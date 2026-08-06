#!/usr/bin/env node
import { execFile } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { generateDesktopRecordingE2EFromContent } from '../lib/recording-to-e2e.mjs';

const execFileAsync = promisify(execFile);
const SAFE_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const MAXIMUM_VALIDATION_ATTEMPTS = 5;
const E2E_PROCESS_TIMEOUT_MS = 450_000;

function argumentValue(argv, name) {
  const index = argv.indexOf(name);
  if (index >= 0) return argv[index + 1];
  return argv
    .find((argument) => argument.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

async function findRepository(cwd = process.cwd()) {
  const starts = [
    cwd,
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..'),
  ];
  for (const start of starts) {
    let current = path.resolve(start);
    while (current !== path.dirname(current)) {
      try {
        const packageJson = JSON.parse(
          await fs.readFile(path.join(current, 'package.json'), 'utf8'),
        );
        if (packageJson.name === 'cross-inpage-provider')
          return fs.realpath(current);
      } catch {
        // Keep walking.
      }
      current = path.dirname(current);
    }
  }
  throw new Error('Could not locate the cross-inpage-provider repository');
}

function parseJsonOutput(output) {
  const trimmed = String(output || '').trim();
  if (!trimmed)
    throw new Error('Generated E2E validation returned no JSON output');
  const lines = trimmed.split(/\r?\n/u);
  const candidates = [trimmed];
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index]?.startsWith('{'))
      candidates.push(lines.slice(index).join('\n'));
  }
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next root-level JSON candidate after process warnings.
    }
  }
  throw new Error('Generated E2E validation returned invalid JSON');
}

function validationFailureDetail(value) {
  if (value?.ok === false && typeof value.error === 'string')
    return value.error;
  if (!Array.isArray(value?.passes)) {
    return 'the runner did not return clean-session attempts';
  }
  return value.passes
    .map((pass, index) => {
      return `${String(pass?.name || `pass-${String(index + 1)}`)}: passed=${String(
        pass?.passed === true,
      )}, freshWebView=${String(pass?.freshWebView === true)}, repositoryIconDetected=${String(
        pass?.repositoryIconDetected === true,
      )}`;
    })
    .join('; ');
}

export function validateGeneratedE2EResult(value, testCase) {
  const passes = value?.passes;
  const passesMatch =
    Array.isArray(passes) &&
    passes.length >= 1 &&
    passes.length <= MAXIMUM_VALIDATION_ATTEMPTS &&
    passes.every((pass, index) => {
      return (
        pass?.name === `clean-session-${String(index + 1)}` &&
        typeof pass?.passed === 'boolean' &&
        typeof pass?.freshWebView === 'boolean' &&
        typeof pass?.repositoryIconDetected === 'boolean' &&
        (pass.passed !== true ||
          (pass.freshWebView === true && pass.repositoryIconDetected === true))
      );
    }) &&
    passes.filter((pass) => pass.passed === true).length === 1 &&
    passes.at(-1)?.passed === true;
  if (
    value?.schemaVersion !== 1 ||
    value?.kind !== 'onekey-connect-button-desktop-e2e-result' ||
    value?.passed !== true ||
    value?.verdict !== 'deterministic-repository-icon-source' ||
    value?.source !== testCase.source ||
    value?.protocolId !== testCase.protocolId ||
    value?.site !== testCase.site ||
    value?.recordingSha256 !== testCase.recordingSha256 ||
    !passesMatch
  ) {
    throw new Error(
      `Generated E2E failed after up to ${String(
        MAXIMUM_VALIDATION_ATTEMPTS,
      )} clean-session attempts: ${validationFailureDetail(value)}`,
    );
  }
  return value;
}

async function executeGeneratedE2E(temporaryFile, repository) {
  try {
    const { stdout } = await execFileAsync(process.execPath, [temporaryFile], {
      cwd: repository,
      encoding: 'utf8',
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        ONEKEY_DESKTOP_CDP_ENDPOINT:
          process.env.ONEKEY_DESKTOP_CDP_ENDPOINT || 'http://127.0.0.1:9222',
      },
      maxBuffer: 1024 * 1024,
      timeout: E2E_PROCESS_TIMEOUT_MS,
    });
    return parseJsonOutput(stdout);
  } catch (error) {
    for (const output of [error?.stderr, error?.stdout]) {
      if (!String(output || '').trim()) continue;
      try {
        return parseJsonOutput(output);
      } catch {
        // Fall back to the process error below.
      }
    }
    throw error;
  }
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

function safeSegment(value, label) {
  const result = String(value || '');
  if (result.length > 100 || !SAFE_SEGMENT.test(result)) {
    throw new Error(`${label} must be a normalized path segment`);
  }
  return result;
}

async function readManifest(repository) {
  const manifest = JSON.parse(
    await fs.readFile(
      path.join(repository, 'onekey-app-custom-injected.json'),
      'utf8',
    ),
  );
  if (
    ![2, 3].includes(manifest.schemaVersion) ||
    manifest.kind !== 'onekey-app-custom-injected'
  ) {
    throw new Error('Unsupported custom injection manifest');
  }
  const relative = String(manifest.dappsDirectory || '');
  if (
    !relative ||
    path.isAbsolute(relative) ||
    relative
      .split(/[\\/]+/u)
      .some((part) => !part || part === '.' || part === '..')
  ) {
    throw new Error('Manifest dappsDirectory must be a safe relative path');
  }
  const sourceValues =
    manifest.schemaVersion === 2
      ? [manifest.dappSource]
      : manifest.protocolSources?.map(({ source }) => source);
  if (!Array.isArray(sourceValues) || sourceValues.length === 0) {
    throw new Error('Manifest must declare at least one protocol source');
  }
  const sources = new Set(
    sourceValues.map((source) =>
      safeSegment(source, 'Manifest protocol source'),
    ),
  );
  const directory = await fs.realpath(path.resolve(repository, relative));
  if (!inside(repository, directory))
    throw new Error('dappsDirectory escapes repository');
  return { directory, sources };
}

export async function generateRecordingE2E({
  argv = process.argv.slice(2),
  cwd = process.cwd(),
  executeCandidate = executeGeneratedE2E,
} = {}) {
  const requestedFile = argumentValue(argv, '--file');
  if (!requestedFile) {
    throw new Error(
      'Usage: generate-recording-e2e.mjs --file <recording.json>',
    );
  }
  const repository = await findRepository(cwd);
  const { directory: dappsDirectory, sources } = await readManifest(repository);
  const recordingCandidate = path.resolve(repository, requestedFile);
  const candidateStat = await fs.lstat(recordingCandidate);
  if (!candidateStat.isFile() || candidateStat.isSymbolicLink()) {
    throw new Error('Recording must be a regular non-symbolic-link file');
  }
  const recordingFile = await fs.realpath(recordingCandidate);
  if (!inside(dappsDirectory, recordingFile)) {
    throw new Error('Recording file escapes dappsDirectory');
  }
  const relativeParts = path
    .relative(dappsDirectory, recordingFile)
    .split(path.sep);
  if (relativeParts.length !== 3 || relativeParts[2] !== 'recording.json') {
    throw new Error(
      'Only canonical dapps/<source>/<slug>/recording.json files are supported',
    );
  }
  const [source, slug] = relativeParts;
  safeSegment(source, 'DApp source');
  safeSegment(slug, 'DApp slug');
  if (!sources.has(source)) {
    throw new Error(
      'Recording source is not declared by the custom injection manifest',
    );
  }
  const content = await fs.readFile(recordingFile);
  const generated = generateDesktopRecordingE2EFromContent(content);
  if (
    generated.recording.source !== source ||
    generated.recording.protocolSlug !== slug
  ) {
    throw new Error(
      'Recording metadata does not match its canonical DApp directory',
    );
  }
  const e2eFile = path.join(path.dirname(recordingFile), 'e2e.mjs');
  const temporaryFile = path.join(
    path.dirname(recordingFile),
    `.e2e.${String(process.pid)}.${crypto.randomUUID()}.mjs`,
  );
  let validationPasses = 0;
  try {
    await fs.writeFile(temporaryFile, generated.source, {
      flag: 'wx',
      mode: 0o644,
    });
    await execFileAsync(process.execPath, ['--check', temporaryFile], {
      cwd: repository,
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      maxBuffer: 1024 * 1024,
      timeout: 15_000,
    });
    const validationResult = await executeCandidate(
      temporaryFile,
      repository,
      generated.testCase,
    );
    validateGeneratedE2EResult(validationResult, generated.testCase);
    validationPasses = validationResult.passes.length;
    await fs.rename(temporaryFile, e2eFile);
  } catch (error) {
    await fs.unlink(temporaryFile).catch(() => undefined);
    throw error;
  }
  return {
    schemaVersion: 1,
    kind: 'onekey-connect-button-e2e-generation-result',
    ok: true,
    source,
    protocolId: generated.recording.protocolId,
    recordingSha256: generated.recordingSha256,
    actionCount: generated.testCase.actions.length,
    validated: true,
    validationPasses,
    relativeFile: path.relative(repository, e2eFile).split(path.sep).join('/'),
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    process.stdout.write(
      `${JSON.stringify(await generateRecordingE2E(), null, 2)}\n`,
    );
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      })}\n`,
    );
    process.exitCode = 4;
  }
}
