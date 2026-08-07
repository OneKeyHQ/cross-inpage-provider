#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  getDesktopCustomInjectionWorkspace,
  resolveDesktopCustomInjectionProtocol,
  selectDesktopCustomInjectionProtocol,
} from '../lib/desktop-custom-injection.mjs';
import { DESKTOP_E2E_MAX_ATTEMPTS, runDesktopRecordingE2E } from '../lib/desktop-recording-e2e.mjs';
import { normalizeDesktopCdpEndpoint } from '../lib/desktop-cdp.mjs';
import { writeDesktopE2EFailureArtifact } from '../lib/e2e-failure-artifact.mjs';

const SAFE_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const repositoryDirectory = path.resolve(packageDirectory, '../..');
export const DESKTOP_E2E_BATCH_CASE_TIMEOUT_MS = 600_000;

function normalizeCaseTimeout(value) {
  const timeoutMs = value == null ? DESKTOP_E2E_BATCH_CASE_TIMEOUT_MS : Number(value);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 3_600_000) {
    throw new Error('Desktop E2E batch case timeout must be between 1 and 3600000 ms');
  }
  return timeoutMs;
}

async function runWithCaseDeadline(label, timeoutMs, operation) {
  const controller = new AbortController();
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(`${label} timed out after ${String(timeoutMs)} ms`);
      error.code = 'ETIMEDOUT';
      controller.abort(error);
      reject(error);
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      Promise.resolve().then(() => operation(controller.signal)),
      timeout,
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function safeSegment(value, label) {
  const result = String(value || '');
  if (!result || result.length > 100 || !SAFE_SEGMENT.test(result)) {
    throw new Error(`${label} must be a normalized path segment`);
  }
  return result;
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

export function parseValidateRecordingE2EArguments(argv) {
  const flags = new Set(['--all', '--dry-run']);
  const valueOptions = new Map([
    ['--source', 'source'],
    ['--protocol', 'protocol'],
    ['--file', 'file'],
    ['--endpoint', 'endpoint'],
  ]);
  const parsed = {
    all: false,
    dryRun: false,
    source: null,
    protocol: null,
    file: null,
    endpoint: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const separator = argument.indexOf('=');
    const name = separator >= 0 ? argument.slice(0, separator) : argument;
    if (flags.has(name)) {
      if (separator >= 0) throw new Error(`${name} does not accept a value`);
      parsed[name === '--all' ? 'all' : 'dryRun'] = true;
      continue;
    }
    const property = valueOptions.get(name);
    if (!property) throw new Error(`Unknown argument: ${argument}`);
    const value = separator >= 0 ? argument.slice(separator + 1) : argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
    if (parsed[property] !== null) throw new Error(`${name} may only be provided once`);
    parsed[property] = value;
    if (separator < 0) index += 1;
  }
  const { all, dryRun, source, protocol, file } = parsed;
  const endpoint = normalizeDesktopCdpEndpoint(parsed.endpoint);
  if (!all && !source && !protocol && !file) {
    throw new Error(
      'Select E2Es with --all, --source <source>, --protocol <id-or-slug>, or --file <e2e.mjs>',
    );
  }
  if (file && (all || source || protocol)) {
    throw new Error('--file cannot be combined with --all, --source, or --protocol');
  }
  if (source) safeSegment(source, '--source');
  if (protocol) safeSegment(protocol, '--protocol');
  return {
    all,
    dryRun,
    source: source || null,
    protocol: protocol || null,
    file: file || null,
    endpoint,
  };
}

async function readManifest(repository) {
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
    throw new Error('Manifest must declare at least one protocol source');
  }
  const sources = sourceValues.map((source) => safeSegment(source, 'Manifest protocol source'));
  const directory = await fs.realpath(path.resolve(repository, relative));
  if (!inside(repository, directory)) throw new Error('dappsDirectory escapes repository');
  return { directory, sources };
}

async function childDirectories(directory, label) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const children = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    safeSegment(entry.name, label);
    const child = path.join(directory, entry.name);
    const stat = await fs.lstat(child);
    if (stat.isSymbolicLink()) throw new Error(`${child}: symbolic-link directory is not allowed`);
    children.push({ name: entry.name, directory: child });
  }
  return children.sort((left, right) => left.name.localeCompare(right.name));
}

export async function discoverDesktopRecordingE2Es(repository = repositoryDirectory) {
  const resolvedRepository = await fs.realpath(repository);
  const manifest = await readManifest(resolvedRepository);
  const results = [];
  for (const source of manifest.sources) {
    const sourceDirectory = path.join(manifest.directory, source);
    let dapps = [];
    try {
      dapps = await childDirectories(sourceDirectory, `${source} DApp slug`);
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    for (const dapp of dapps) {
      const file = path.join(dapp.directory, 'e2e.mjs');
      let stat;
      try {
        stat = await fs.lstat(file);
      } catch (error) {
        if (error.code === 'ENOENT') continue;
        throw error;
      }
      if (!stat.isFile() || stat.isSymbolicLink()) {
        throw new Error(`${file}: E2E must be a regular non-symbolic-link file`);
      }
      const module = await import(`${pathToFileURL(file).href}?catalog=${stat.mtimeMs}`);
      const testCase = module.testCase;
      if (!testCase || testCase.source !== source) {
        throw new Error(`${file}: E2E source does not match its DApp directory`);
      }
      results.push({
        source,
        slug: dapp.name,
        file,
        relativeFile: path.relative(resolvedRepository, file).split(path.sep).join('/'),
        testCase,
      });
    }
  }
  return results.sort((left, right) => left.relativeFile.localeCompare(right.relativeFile));
}

function selectCatalogEntries(catalog, selection, repository) {
  if (selection.file) {
    const requested = path.resolve(repository, selection.file);
    const match = catalog.find((entry) => path.resolve(entry.file) === requested);
    if (!match) throw new Error('--file must name a canonical discovered DApp e2e.mjs');
    return [match];
  }
  const selected = catalog.filter(
    (entry) =>
      (!selection.source || entry.source === selection.source) &&
      (!selection.protocol ||
        entry.slug === selection.protocol ||
        entry.testCase.protocolId === selection.protocol),
  );
  if (selected.length === 0) throw new Error('No DApp E2Es match the requested selection');
  if (selection.protocol && !selection.source && selected.length > 1) {
    throw new Error('--protocol is ambiguous without --source');
  }
  return selected;
}

function summarizePass(result) {
  const pass = result?.passes?.find((candidate) => candidate?.passed === true);
  return {
    passed: result?.passed === true,
    attempts: Array.isArray(result?.passes) ? result.passes.length : 0,
    freshWebView: pass?.freshWebView === true,
    finalUrl: pass?.finalUrl || null,
    iconKey: pass?.iconKey || null,
    sourceKind: pass?.sourceKind || null,
    walletId: pass?.walletId || null,
  };
}

export async function validateDesktopRecordingE2Es({
  argv = process.argv.slice(2),
  repository = repositoryDirectory,
  getWorkspace = getDesktopCustomInjectionWorkspace,
  selectProtocol = selectDesktopCustomInjectionProtocol,
  runE2E = runDesktopRecordingE2E,
  discoverE2Es = discoverDesktopRecordingE2Es,
  caseTimeoutMs = DESKTOP_E2E_BATCH_CASE_TIMEOUT_MS,
  progress = () => undefined,
  writeFailureArtifact = writeDesktopE2EFailureArtifact,
} = {}) {
  const selection = parseValidateRecordingE2EArguments(argv);
  const normalizedCaseTimeoutMs = normalizeCaseTimeout(caseTimeoutMs);
  const resolvedRepository = await fs.realpath(repository);
  const catalog = await discoverE2Es(resolvedRepository);
  const selected = selectCatalogEntries(catalog, selection, resolvedRepository);
  const workspace = await getWorkspace({ endpoint: selection.endpoint });
  if (path.resolve(workspace.workspace || '') !== resolvedRepository) {
    throw new Error(
      `OneKey Desktop workspace mismatch: expected ${resolvedRepository}, received ${String(
        workspace.workspace || '',
      )}`,
    );
  }

  const planned = selected.map((entry) => {
    const resolved = resolveDesktopCustomInjectionProtocol(workspace.protocols, {
      source: entry.testCase.source,
      protocolId: entry.testCase.protocolId,
      site: entry.testCase.site,
    });
    return { entry, resolved };
  });
  if (selection.dryRun) {
    return {
      schemaVersion: 1,
      kind: 'onekey-desktop-recording-e2e-batch-result',
      dryRun: true,
      passed: true,
      total: planned.length,
      passedCount: 0,
      failedCount: 0,
      results: planned.map(({ entry, resolved }) => ({
        source: entry.source,
        slug: entry.slug,
        protocolId: entry.testCase.protocolId,
        relativeFile: entry.relativeFile,
        site: entry.testCase.site,
        requestedKey: resolved.requestedKey,
        selectedKey: resolved.protocol.key,
        protocolMatch: resolved.match,
      })),
    };
  }

  const results = [];
  for (const [index, item] of planned.entries()) {
    const { entry, resolved } = item;
    progress({ index: index + 1, total: planned.length, entry, phase: 'select' });
    let e2eResult;
    let failureError;
    let resultEntry;
    try {
      const validation = await runWithCaseDeadline(
        `Desktop E2E ${entry.source}:${entry.slug}`,
        normalizedCaseTimeoutMs,
        async (signal) => {
          const selectedProtocol = await selectProtocol(
            {
              source: entry.testCase.source,
              protocolId: entry.testCase.protocolId,
              site: entry.testCase.site,
            },
            { endpoint: selection.endpoint, signal },
          );
          progress({ index: index + 1, total: planned.length, entry, phase: 'validate' });
          const validationResult = await runE2E(entry.testCase, {
            endpoint: selection.endpoint,
            maximumAttempts: DESKTOP_E2E_MAX_ATTEMPTS,
            signal,
          });
          return { desktopSelection: selectedProtocol, e2eResult: validationResult };
        },
      );
      const { desktopSelection } = validation;
      e2eResult = validation.e2eResult;
      const summary = summarizePass(e2eResult);
      resultEntry = {
        source: entry.source,
        slug: entry.slug,
        protocolId: entry.testCase.protocolId,
        relativeFile: entry.relativeFile,
        site: entry.testCase.site,
        requestedKey: resolved.requestedKey,
        selectedKey: desktopSelection.selectedKey,
        protocolMatch: desktopSelection.match,
        webviewTargetId: desktopSelection.webviewTargetId,
        ...summary,
        ...(!summary.passed ? { passes: e2eResult?.passes || [] } : {}),
      };
    } catch (error) {
      failureError = error;
      resultEntry = {
        source: entry.source,
        slug: entry.slug,
        protocolId: entry.testCase.protocolId,
        relativeFile: entry.relativeFile,
        site: entry.testCase.site,
        requestedKey: resolved.requestedKey,
        selectedKey: resolved.protocol.key,
        protocolMatch: resolved.match,
        passed: false,
        attempts: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
    if (!resultEntry.passed) {
      try {
        await writeFailureArtifact(path.dirname(entry.file), {
          source: entry.source,
          slug: entry.slug,
          phase: 'validation',
          protocolId: entry.testCase.protocolId,
          recordingSha256: entry.testCase.recordingSha256,
          error: failureError || new Error('Desktop E2E validation failed'),
          result: e2eResult,
        });
      } catch (failureArtifactError) {
        resultEntry.failureArtifactError =
          failureArtifactError instanceof Error
            ? failureArtifactError.message
            : String(failureArtifactError);
      }
    }
    results.push(resultEntry);
    progress({
      index: index + 1,
      total: planned.length,
      entry,
      phase: results.at(-1).passed ? 'passed' : 'failed',
    });
  }
  const passedCount = results.filter((result) => result.passed).length;
  return {
    schemaVersion: 1,
    kind: 'onekey-desktop-recording-e2e-batch-result',
    dryRun: false,
    passed: passedCount === results.length,
    total: results.length,
    passedCount,
    failedCount: results.length - passedCount,
    maximumAttempts: DESKTOP_E2E_MAX_ATTEMPTS,
    caseTimeoutMs: normalizedCaseTimeoutMs,
    results,
  };
}

function progressLine({ index, total, entry, phase }) {
  process.stderr.write(
    `[${String(index).padStart(2, '0')}/${String(total)}] ${entry.source}:${entry.slug} ${phase}\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await validateDesktopRecordingE2Es({ progress: progressLine });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.passed) process.exitCode = 4;
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
