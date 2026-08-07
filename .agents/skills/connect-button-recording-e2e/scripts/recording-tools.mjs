#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MAXIMUM_BYTES = 1024 * 1024;
const SAFE_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

function argumentValue(argv, name) {
  const index = argv.indexOf(name);
  if (index >= 0) return argv[index + 1];
  return argv.find((argument) => argument.startsWith(`${name}=`))?.slice(name.length + 1);
}

async function findRepository() {
  const starts = [
    process.cwd(),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..'),
  ];
  for (const start of starts) {
    let current = path.resolve(start);
    while (current !== path.dirname(current)) {
      try {
        const packageJson = JSON.parse(
          await fs.readFile(path.join(current, 'package.json'), 'utf8'),
        );
        if (packageJson.name === 'cross-inpage-provider') return current;
      } catch {
        // Keep walking.
      }
      current = path.dirname(current);
    }
  }
  throw new Error('Could not locate the cross-inpage-provider repository');
}

function inside(parent, child) {
  const relative = path.relative(parent, child);
  return (
    Boolean(relative) &&
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function safeSlug(value) {
  return (
    String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/gu, '-')
      .replace(/^-+|-+$/gu, '')
      .slice(0, 100)
      .replace(/-+$/gu, '') || 'protocol'
  );
}

function requireSafeSegment(value, label) {
  const segment = String(value || '');
  if (segment.length > 100 || !SAFE_SEGMENT.test(segment)) {
    throw new Error(`${label} must be a normalized path segment`);
  }
  return segment;
}

async function dappsDirectory(repository) {
  const manifest = JSON.parse(
    await fs.readFile(
      path.join(
        repository,
        'packages/connect-button-workbench/config/onekey-app-custom-injected.json',
      ),
      'utf8',
    ),
  );
  if (![2, 3].includes(manifest.schemaVersion) || manifest.kind !== 'onekey-app-custom-injected') {
    throw new Error('Unsupported custom injection manifest');
  }
  const relative = String(manifest.dappsDirectory || '');
  if (
    !relative ||
    path.isAbsolute(relative) ||
    relative.split(/[\\/]+/u).some((part) => !part || part === '.' || part === '..')
  ) {
    throw new Error('Manifest dappsDirectory must be a safe relative path');
  }
  const sourceValues =
    manifest.schemaVersion === 2
      ? [manifest.dappSource]
      : manifest.protocolSources?.map(({ source }) => source);
  if (!Array.isArray(sourceValues) || sourceValues.length === 0) {
    throw new Error('Manifest protocolSources must contain at least one source');
  }
  const sources = sourceValues.map((source) =>
    requireSafeSegment(source, 'Manifest protocol source'),
  );
  if (new Set(sources).size !== sources.length) {
    throw new Error('Manifest protocol sources must be unique');
  }
  const directory = path.resolve(repository, relative);
  if (!inside(repository, directory)) throw new Error('dappsDirectory escapes repository');
  return { directory, relative, sources };
}

function validateEnvelope(value, file) {
  if (
    !value ||
    ![1, 2].includes(value.schemaVersion) ||
    value.kind !== 'onekey-connect-button-recording'
  ) {
    throw new Error(`${file}: unsupported recording envelope`);
  }
  if (value.runtime?.privateSession !== true) {
    throw new Error(`${file}: recording is not from a private session`);
  }
  if (!value.protocol?.id || !value.protocol?.url) {
    throw new Error(`${file}: protocol metadata is missing`);
  }
  requireSafeSegment(value.protocol.source, `${file}: protocol source`);
  if (!/^[a-f0-9]{64}$/u.test(String(value.runtime?.bundleSha256 || ''))) {
    throw new Error(`${file}: bundle SHA-256 is invalid`);
  }
  if (!Array.isArray(value.steps) || value.steps.length === 0 || value.steps.length > 100) {
    throw new Error(`${file}: recording capture is invalid`);
  }
  for (const [index, step] of value.steps.entries()) {
    if (
      !['click', 'press'].includes(step?.action) ||
      !Array.isArray(step?.target?.selectors) ||
      step.target.selectors.length === 0
    ) {
      throw new Error(`${file}: step ${index} is invalid`);
    }
    if ('value' in step || 'value' in step.target) {
      throw new Error(`${file}: step ${index} contains a value`);
    }
  }
  if (
    value.outcome !== null &&
    value.outcome !== undefined &&
    (value.outcome?.kind !== 'repository-wallet-icon' ||
      !Number.isInteger(value.outcome.afterStep) ||
      value.outcome.afterStep < 1 ||
      value.outcome.afterStep > value.steps.length)
  ) {
    throw new Error(`${file}: wallet-picker outcome is invalid`);
  }
  return value;
}

async function readRecording(file, baseDirectory) {
  const resolved = await fs.realpath(file);
  const base = await fs.realpath(baseDirectory);
  if (!inside(base, resolved)) throw new Error('Recording file escapes dappsDirectory');
  const stat = await fs.lstat(resolved);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size <= 0 || stat.size > MAXIMUM_BYTES) {
    throw new Error('Recording must be a regular JSON file no larger than 1 MiB');
  }
  const content = await fs.readFile(resolved);
  return {
    file: resolved,
    content,
    value: validateEnvelope(JSON.parse(content.toString('utf8')), resolved),
  };
}

async function childDirectories(directory, label) {
  let entries = [];
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const children = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    requireSafeSegment(entry.name, label);
    const child = path.join(directory, entry.name);
    const stat = await fs.lstat(child);
    if (stat.isSymbolicLink())
      throw new Error(`${child}: symbolic-link directories are not allowed`);
    children.push({ name: entry.name, directory: child });
  }
  return children.sort((left, right) => left.name.localeCompare(right.name));
}

function assertRecordingPath(recording, source, slug) {
  if (recording.value.protocol.source !== source) {
    throw new Error(`${recording.file}: protocol source does not match its DApp directory`);
  }
  const expectedSlug = safeSlug(recording.value.protocol.slug || recording.value.protocol.id);
  if (slug !== expectedSlug) {
    throw new Error(`${recording.file}: protocol slug does not match its DApp directory`);
  }
}

async function listRecordings(repository, directory, filters) {
  const sources = await childDirectories(directory, 'DApp source');
  const results = [];
  for (const source of sources) {
    if (!filters.sources.has(source.name)) continue;
    if (filters.source && source.name !== filters.source) continue;
    const dapps = await childDirectories(source.directory, `${source.name} DApp slug`);
    for (const dapp of dapps) {
      const candidate = path.join(dapp.directory, 'recording.json');
      try {
        await fs.access(candidate);
        const recording = await readRecording(candidate, directory);
        assertRecordingPath(recording, source.name, dapp.name);
        if (filters.protocolId && recording.value.protocol.id !== filters.protocolId) continue;
        const stat = await fs.stat(recording.file);
        results.push({
          file: path.relative(repository, recording.file).split(path.sep).join('/'),
          source: source.name,
          slug: dapp.name,
          protocolId: recording.value.protocol.id,
          protocolName: recording.value.protocol.name,
          protocolUrl: recording.value.protocol.url,
          startedAt: recording.value.startedAt,
          stepCount: recording.value.steps.length,
          bundleSha256: recording.value.runtime.bundleSha256,
          recordingSha256: crypto.createHash('sha256').update(recording.content).digest('hex'),
          modifiedAt: stat.mtime.toISOString(),
        });
      } catch (error) {
        if (error.code === 'ENOENT') continue;
        results.push({
          file: path.relative(repository, candidate).split(path.sep).join('/'),
          source: source.name,
          slug: dapp.name,
          error: error.message,
        });
      }
    }
  }
  return results.sort((left, right) =>
    String(right.startedAt || '').localeCompare(String(left.startedAt || '')),
  );
}

async function migrateLatestRecordings(repository, directory, filters) {
  const sources = await childDirectories(directory, 'DApp source');
  const migrations = [];
  for (const source of sources) {
    if (!filters.sources.has(source.name)) continue;
    if (filters.source && source.name !== filters.source) continue;
    const dapps = await childDirectories(source.directory, `${source.name} DApp slug`);
    for (const dapp of dapps) {
      const candidates = await fs.readdir(dapp.directory, { withFileTypes: true });
      const recordings = [];
      for (const candidate of candidates) {
        if (
          !candidate.isFile() ||
          !candidate.name.endsWith('.json') ||
          (candidate.name !== 'recording.json' && !candidate.name.startsWith('recording-'))
        ) {
          continue;
        }
        try {
          const recording = await readRecording(
            path.join(dapp.directory, candidate.name),
            directory,
          );
          assertRecordingPath(recording, source.name, dapp.name);
          if (filters.protocolId && recording.value.protocol.id !== filters.protocolId) continue;
          recordings.push(recording);
        } catch {
          // Invalid files are not safe to migrate and are left untouched.
        }
      }
      if (recordings.length === 0) continue;
      recordings.sort((left, right) =>
        String(right.value.finishedAt || right.value.startedAt || '').localeCompare(
          String(left.value.finishedAt || left.value.startedAt || ''),
        ),
      );
      const latest = recordings[0];
      const canonical = path.join(dapp.directory, 'recording.json');
      if (latest.file !== canonical) {
        const temporary = `${canonical}.${process.pid}.${crypto.randomUUID()}.tmp`;
        try {
          await fs.writeFile(temporary, latest.content, { flag: 'wx', mode: 0o600 });
          await fs.rename(temporary, canonical);
        } catch (error) {
          await fs.unlink(temporary).catch(() => undefined);
          throw error;
        }
      }
      const removed = [];
      for (const recording of recordings) {
        if (recording.file === canonical) continue;
        await fs.unlink(recording.file);
        removed.push(path.relative(repository, recording.file).split(path.sep).join('/'));
      }
      migrations.push({
        source: source.name,
        slug: dapp.name,
        protocolId: latest.value.protocol.id,
        file: path.relative(repository, canonical).split(path.sep).join('/'),
        recordingSha256: crypto.createHash('sha256').update(latest.content).digest('hex'),
        removed,
      });
    }
  }
  return migrations;
}

function e2eStringField(source, field) {
  const match = source.match(new RegExp(`\\b${field}\\s*:\\s*["']([^"']+)["']`, 'u'));
  return match?.[1] || null;
}

async function readE2EMetadata(file) {
  const stat = await fs.lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size <= 0 || stat.size > MAXIMUM_BYTES) {
    throw new Error('E2E must be a regular file no larger than 1 MiB');
  }
  const source = await fs.readFile(file, 'utf8');
  return {
    compact: source.includes('runDesktopRecordingE2EModule'),
    legacy: source.includes('runDesktopRecordingE2EAndExit'),
    source: e2eStringField(source, 'source'),
    protocolId: e2eStringField(source, 'protocolId'),
    recordingSha256: e2eStringField(source, 'recordingSha256'),
  };
}

async function auditE2Es(repository, directory, filters) {
  const recordings = await listRecordings(repository, directory, filters);
  const results = [];
  const seenDirectories = new Set();
  for (const recording of recordings) {
    const relativeRecording = recording.file;
    const directoryName = path.posix.dirname(relativeRecording);
    seenDirectories.add(directoryName);
    if (recording.error) {
      results.push({
        source: recording.source || null,
        slug: recording.slug || null,
        recordingFile: relativeRecording,
        e2eFile: `${directoryName}/e2e.mjs`,
        status: 'invalid-recording',
        issues: [recording.error],
      });
      continue;
    }
    const e2eFile = path.join(repository, directoryName, 'e2e.mjs');
    let metadata;
    try {
      metadata = await readE2EMetadata(e2eFile);
    } catch (error) {
      if (error.code === 'ENOENT') {
        results.push({
          source: recording.source,
          slug: recording.slug,
          protocolId: recording.protocolId,
          recordingFile: relativeRecording,
          e2eFile: `${directoryName}/e2e.mjs`,
          status: 'missing',
          issues: ['Canonical e2e.mjs is missing'],
        });
        continue;
      }
      results.push({
        source: recording.source,
        slug: recording.slug,
        protocolId: recording.protocolId,
        recordingFile: relativeRecording,
        e2eFile: `${directoryName}/e2e.mjs`,
        status: 'invalid-e2e',
        issues: [error.message],
      });
      continue;
    }
    const issues = [];
    if (metadata.source !== recording.source) issues.push('E2E source does not match recording');
    if (metadata.protocolId !== recording.protocolId) {
      issues.push('E2E protocolId does not match recording');
    }
    if (metadata.recordingSha256 !== recording.recordingSha256) {
      issues.push('E2E recordingSha256 is stale');
    }
    if (!metadata.compact && !metadata.legacy) issues.push('E2E module template is unrecognized');
    results.push({
      source: recording.source,
      slug: recording.slug,
      protocolId: recording.protocolId,
      recordingFile: relativeRecording,
      e2eFile: `${directoryName}/e2e.mjs`,
      status: issues.length > 0 ? 'stale' : metadata.compact ? 'current' : 'legacy',
      compact: metadata.compact,
      issues,
    });
  }

  const sourceDirectories = await childDirectories(directory, 'DApp source');
  for (const source of sourceDirectories) {
    if (!filters.sources.has(source.name)) continue;
    if (filters.source && source.name !== filters.source) continue;
    const dapps = await childDirectories(source.directory, `${source.name} DApp slug`);
    for (const dapp of dapps) {
      const relativeDirectory = path.relative(repository, dapp.directory).split(path.sep).join('/');
      if (seenDirectories.has(relativeDirectory)) continue;
      const e2eFile = path.join(dapp.directory, 'e2e.mjs');
      let metadata;
      try {
        metadata = await readE2EMetadata(e2eFile);
      } catch (error) {
        if (error.code === 'ENOENT') continue;
        throw error;
      }
      if (filters.protocolId && metadata.protocolId !== filters.protocolId) continue;
      results.push({
        source: source.name,
        slug: dapp.name,
        recordingFile: `${relativeDirectory}/recording.json`,
        e2eFile: `${relativeDirectory}/e2e.mjs`,
        status: 'orphan',
        issues: ['Canonical recording.json is missing'],
      });
    }
  }
  results.sort((left, right) => left.e2eFile.localeCompare(right.e2eFile));
  const counts = {};
  for (const result of results) counts[result.status] = (counts[result.status] || 0) + 1;
  return { counts, results };
}

try {
  const command = process.argv[2];
  if (!['list', 'show', 'audit', 'migrate-latest'].includes(command)) {
    throw new Error(
      'Usage: recording-tools.mjs <list|show|audit|migrate-latest> [--source <source>] [--protocol <id>] [--file <recording.json>]',
    );
  }
  const repository = await findRepository();
  const { directory, relative, sources } = await dappsDirectory(repository);
  const filters = {
    sources: new Set(sources),
    source: argumentValue(process.argv.slice(3), '--source'),
    protocolId: argumentValue(process.argv.slice(3), '--protocol'),
  };
  if (filters.source) {
    requireSafeSegment(filters.source, '--source');
    if (!filters.sources.has(filters.source)) {
      throw new Error('--source is not declared by the custom injection manifest');
    }
  }
  if (command === 'list') {
    const recordings = await listRecordings(repository, directory, filters);
    process.stdout.write(
      `${JSON.stringify({ dappsDirectory: relative, sources, recordings }, null, 2)}\n`,
    );
  } else if (command === 'show') {
    const requestedFile = argumentValue(process.argv.slice(3), '--file');
    if (!requestedFile) throw new Error('show requires --file <recording.json>');
    const candidate = path.resolve(repository, requestedFile);
    const recording = await readRecording(candidate, directory);
    const relativeParts = path.relative(directory, recording.file).split(path.sep);
    if (relativeParts.length !== 3 || relativeParts[2] !== 'recording.json') {
      throw new Error('show only accepts canonical dapps/<source>/<slug>/recording.json files');
    }
    const [source, slug] = relativeParts;
    requireSafeSegment(source, 'DApp source');
    requireSafeSegment(slug, 'DApp slug');
    if (!filters.sources.has(source)) {
      throw new Error('Recording source is not declared by the custom injection manifest');
    }
    assertRecordingPath(recording, source, slug);
    process.stdout.write(
      `${JSON.stringify(
        {
          file: path.relative(repository, recording.file).split(path.sep).join('/'),
          recordingSha256: crypto.createHash('sha256').update(recording.content).digest('hex'),
          ...recording.value,
        },
        null,
        2,
      )}\n`,
    );
  } else if (command === 'audit') {
    const audit = await auditE2Es(repository, directory, filters);
    process.stdout.write(
      `${JSON.stringify({ dappsDirectory: relative, sources, ...audit }, null, 2)}\n`,
    );
  } else {
    const migrations = await migrateLatestRecordings(repository, directory, filters);
    process.stdout.write(
      `${JSON.stringify({ dappsDirectory: relative, sources, migrations }, null, 2)}\n`,
    );
  }
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exitCode = 4;
}
