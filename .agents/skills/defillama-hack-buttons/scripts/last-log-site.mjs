#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LOG_DIRECTORY = path.join('logs', 'custom-injection');
const LOG_FILES_OLDEST_FIRST = [
  'operations.4.jsonl',
  'operations.3.jsonl',
  'operations.2.jsonl',
  'operations.1.jsonl',
  'operations.jsonl',
];

async function isRepository(directory) {
  try {
    const packageJson = JSON.parse(await fs.readFile(path.join(directory, 'package.json'), 'utf8'));
    return packageJson.name === 'cross-inpage-provider';
  } catch {
    return false;
  }
}

async function findRepository(explicitRoot) {
  if (explicitRoot) {
    const root = path.resolve(explicitRoot);
    if (await isRepository(root)) return root;
    throw new Error(`Not a cross-inpage-provider repository: ${root}`);
  }
  const starts = [
    process.cwd(),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..'),
  ];
  for (const start of starts) {
    let current = path.resolve(start);
    while (current !== path.dirname(current)) {
      if (await isRepository(current)) return current;
      current = path.dirname(current);
    }
  }
  throw new Error('Could not locate the cross-inpage-provider repository');
}

function argumentValue(argv, name) {
  const index = argv.indexOf(name);
  if (index >= 0) {
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`${name} requires a value`);
    }
    return value;
  }
  const inline = argv.find((argument) => argument.startsWith(`${name}=`));
  return inline?.slice(name.length + 1) || null;
}

function parseArguments(argv) {
  const known = new Set(['--repo-root']);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const name = argument.split('=')[0];
    if (!known.has(name)) throw new Error(`Unknown argument: ${argument}`);
    if (!argument.includes('=')) index += 1;
  }
  return { repoRoot: argumentValue(argv, '--repo-root') };
}

function objectField(value, key) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value[key] ?? null;
}

function stringField(value, key) {
  const field = objectField(value, key);
  return typeof field === 'string' && field ? field : null;
}

function normalizeUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.href;
  } catch {
    return null;
  }
}

function normalizeHostname(value) {
  const url = normalizeUrl(value);
  return url ? new URL(url).hostname.toLowerCase().replace(/^www\./, '') : null;
}

async function readRecords(repo) {
  const directory = path.join(repo, LOG_DIRECTORY);
  const records = [];
  for (const fileName of LOG_FILES_OLDEST_FIRST) {
    const file = path.join(directory, fileName);
    let content;
    try {
      const stat = await fs.lstat(file);
      if (!stat.isFile() || stat.isSymbolicLink()) continue;
      content = await fs.readFile(file, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    for (const line of content.split('\n')) {
      if (!line) continue;
      try {
        const record = JSON.parse(line);
        if (
          record?.kind === 'onekey-custom-injection-operation' &&
          typeof record.operation === 'string' &&
          typeof record.timestamp === 'string'
        ) {
          records.push({ ...record, sequence: records.length });
        }
      } catch {
        // Ignore an incomplete line left by an interrupted append.
      }
    }
  }
  return records;
}

function protocolSummary(record) {
  const protocol = objectField(record, 'protocol');
  if (!protocol) return null;
  const key = stringField(protocol, 'key');
  return key
    ? {
        key,
        source: stringField(protocol, 'source'),
        id: stringField(protocol, 'id'),
        name: stringField(protocol, 'name'),
      }
    : null;
}

function evidence(record) {
  return {
    timestamp: record.timestamp,
    operationId: typeof record.operationId === 'string' ? record.operationId : null,
    operation: record.operation,
    status: typeof record.status === 'string' ? record.status : null,
  };
}

function resolveLastSite(records) {
  const selection = records
    .filter(
      (record) =>
        record.operation === 'protocol.select' &&
        record.status === 'result' &&
        normalizeUrl(stringField(record.result, 'url')) &&
        protocolSummary(record),
    )
    .at(-1);

  if (selection) {
    const protocol = protocolSummary(selection);
    const laterPage = records
      .slice(selection.sequence + 1)
      .filter(
        (record) =>
          protocolSummary(record)?.key === protocol.key &&
          normalizeUrl(stringField(record.input, 'pageUrl')),
      )
      .at(-1);
    const selectedUrl = normalizeUrl(stringField(selection.result, 'url'));
    const pageUrl = laterPage ? normalizeUrl(stringField(laterPage.input, 'pageUrl')) : null;
    const url = pageUrl || selectedUrl;
    return {
      protocol,
      url,
      hostname: normalizeHostname(url),
      selectionEvidence: evidence(selection),
      ...(laterPage ? { pageEvidence: evidence(laterPage) } : {}),
    };
  }

  const pageRecord = records
    .filter(
      (record) => protocolSummary(record) && normalizeUrl(stringField(record.input, 'pageUrl')),
    )
    .at(-1);
  if (!pageRecord) return null;
  const url = normalizeUrl(stringField(pageRecord.input, 'pageUrl'));
  return {
    protocol: protocolSummary(pageRecord),
    url,
    hostname: normalizeHostname(url),
    pageEvidence: evidence(pageRecord),
  };
}

try {
  const args = parseArguments(process.argv.slice(2));
  const repo = await findRepository(args.repoRoot);
  const records = await readRecords(repo);
  const site = resolveLastSite(records);
  if (!site?.hostname) {
    throw new Error('No recently selected Custom Injection site found in logs');
  }
  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      readOnly: true,
      source: 'custom-injection-operation-log',
      logDirectory: LOG_DIRECTORY,
      site,
    })}\n`,
  );
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exitCode = 4;
}
