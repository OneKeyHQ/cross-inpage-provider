import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export const DESKTOP_E2E_FAILURE_FILE = 'e2e-failure.json';
export const DESKTOP_E2E_FAILURE_MAXIMUM_ENTRIES = 20;
export const DESKTOP_E2E_FAILURE_MAXIMUM_BYTES = 64 * 1024;

const SAFE_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const ALLOWED_PHASES = new Set(['recording', 'generation', 'validation']);

function boundedText(value, maximumLength) {
  const text = String(value || '')
    .replace(/\s+/gu, ' ')
    .trim();
  return text ? text.slice(0, maximumLength) : null;
}

function safeSegment(value, label) {
  const segment = boundedText(value, 100);
  if (!segment || !SAFE_SEGMENT.test(segment)) {
    throw new Error(`${label} must be a normalized path segment`);
  }
  return segment;
}

function failurePass(value) {
  const passes = Array.isArray(value?.passes) ? value.passes : [];
  return passes.findLast((pass) => pass?.passed !== true) || passes.at(-1) || null;
}

function failureAction(pass) {
  const actions = Array.isArray(pass?.executedActions) ? pass.executedActions : [];
  return actions.findLast((action) => action?.status === 'error') || null;
}

export function createDesktopE2EFailureArtifact({
  source,
  slug,
  phase,
  protocolId,
  recordingSha256,
  error,
  result,
  failedAt = new Date().toISOString(),
}) {
  if (!ALLOWED_PHASES.has(phase)) throw new Error('E2E failure phase is unsupported');
  const diagnosticResult = result || error?.diagnostics || null;
  const pass = failurePass(diagnosticResult);
  const action = failureAction(pass);
  const reason = boundedText(
    action?.error || pass?.error || (error instanceof Error ? error.message : error),
    2_000,
  );
  if (!reason) throw new Error('E2E failure reason is required');
  const normalizedProtocolId = boundedText(protocolId, 160);
  const normalizedRecordingSha256 = boundedText(recordingSha256, 64);
  if (normalizedRecordingSha256 && !/^[a-f0-9]{64}$/u.test(normalizedRecordingSha256)) {
    throw new Error('E2E failure recordingSha256 must be a lowercase SHA-256 digest');
  }
  const stage = boundedText(pass?.stage, 80);
  const attempt = boundedText(pass?.name, 80);
  const actionDescription = boundedText(action?.description, 240);
  return {
    schemaVersion: 1,
    kind: 'onekey-connect-button-e2e-failure',
    failedAt,
    source: safeSegment(source, 'E2E failure source'),
    slug: safeSegment(slug, 'E2E failure slug'),
    phase,
    ...(normalizedProtocolId ? { protocolId: normalizedProtocolId } : {}),
    ...(normalizedRecordingSha256 ? { recordingSha256: normalizedRecordingSha256 } : {}),
    ...(stage ? { stage } : {}),
    ...(attempt ? { attempt } : {}),
    ...(actionDescription
      ? {
          action: {
            ...(Number.isInteger(action?.index) ? { index: action.index } : {}),
            ...(boundedText(action?.action, 20) ? { type: boundedText(action.action, 20) } : {}),
            description: actionDescription,
          },
        }
      : {}),
    reason,
  };
}

function serializedFailureLog(entries) {
  return `${JSON.stringify(
    {
      schemaVersion: 1,
      kind: 'onekey-connect-button-e2e-failure-log',
      maximumEntries: DESKTOP_E2E_FAILURE_MAXIMUM_ENTRIES,
      entries,
    },
    null,
    2,
  )}\n`;
}

async function readExistingEntries(file) {
  let stat;
  try {
    stat = await fs.lstat(file);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error('E2E failure log must be a regular non-symbolic-link file');
  }
  if (stat.size <= 0 || stat.size > DESKTOP_E2E_FAILURE_MAXIMUM_BYTES) return [];
  try {
    const value = JSON.parse(await fs.readFile(file, 'utf8'));
    if (
      value?.schemaVersion === 1 &&
      value?.kind === 'onekey-connect-button-e2e-failure-log' &&
      Array.isArray(value.entries)
    ) {
      return value.entries.slice(-DESKTOP_E2E_FAILURE_MAXIMUM_ENTRIES);
    }
    if (value?.schemaVersion === 1 && value?.kind === 'onekey-connect-button-e2e-failure') {
      return [value];
    }
  } catch {
    // Replace a corrupt ignored runtime artifact with the latest bounded failure reason.
  }
  return [];
}

export async function writeDesktopE2EFailureArtifact(directory, details) {
  const entry = createDesktopE2EFailureArtifact(details);
  const file = path.join(directory, DESKTOP_E2E_FAILURE_FILE);
  const entries = [...(await readExistingEntries(file)), entry].slice(
    -DESKTOP_E2E_FAILURE_MAXIMUM_ENTRIES,
  );
  let content = serializedFailureLog(entries);
  while (Buffer.byteLength(content) > DESKTOP_E2E_FAILURE_MAXIMUM_BYTES && entries.length > 1) {
    entries.shift();
    content = serializedFailureLog(entries);
  }
  if (Buffer.byteLength(content) > DESKTOP_E2E_FAILURE_MAXIMUM_BYTES) {
    throw new Error('E2E failure reason exceeds the bounded failure-log size');
  }
  const temporaryFile = path.join(
    directory,
    `.${DESKTOP_E2E_FAILURE_FILE}.${String(process.pid)}.${crypto.randomUUID()}.tmp`,
  );
  try {
    await fs.writeFile(temporaryFile, content, {
      flag: 'wx',
      mode: 0o600,
    });
    await fs.rename(temporaryFile, file);
  } catch (error) {
    await fs.unlink(temporaryFile).catch(() => undefined);
    throw error;
  }
  return { file, entry, entries };
}
