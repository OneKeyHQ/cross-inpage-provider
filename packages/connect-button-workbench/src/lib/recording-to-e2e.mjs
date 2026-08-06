import crypto from 'node:crypto';

import {
  isDesktopE2EProhibitedActionText,
  validateDesktopRecordingE2ECase,
} from './desktop-recording-e2e.mjs';

const MAXIMUM_RECORDING_BYTES = 1024 * 1024;
const MAXIMUM_STEPS = 100;
const ALLOWED_ACTIONS = new Set(['click', 'press']);
const ALLOWED_KEYS = new Set([
  'Enter',
  'Escape',
  'Tab',
  ' ',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]);
const ALLOWED_LOCATOR_KINDS = new Set([
  'testId',
  'dataTest',
  'dataCy',
  'id',
  'ariaLabel',
  'role',
  'text',
  'css',
]);
const LOCATOR_PRIORITY = new Map(
  ['testId', 'dataTest', 'dataCy', 'id', 'ariaLabel', 'role', 'text', 'css'].map((kind, index) => [
    kind,
    index,
  ]),
);
const SAFE_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const CONNECT_TARGET_TEXT = /\bconnect(?:\s+(?:a\s+)?wallet)?\b/iu;
const ESCAPE_DISMISSIBLE_ROLES = new Set(['menuitem', 'option']);

function boundedString(value, label, maximumLength) {
  if (typeof value !== 'string') throw new Error(`${label} must be a string`);
  const result = value.trim();
  if (!result || result.length > maximumLength) {
    throw new Error(`${label} length must be between 1 and ${maximumLength}`);
  }
  return result;
}

function optionalString(value, label, maximumLength) {
  if (value == null || value === '') return null;
  return boundedString(value, label, maximumLength);
}

export function normalizeRecordingProtocolSlug(value) {
  const slug = boundedString(value, 'protocol slug', 100)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 100)
    .replace(/-+$/gu, '');
  if (!SAFE_SEGMENT.test(slug)) throw new Error('protocol slug must be normalized');
  return slug;
}

function normalizedHostname(value, label) {
  let url;
  try {
    url = new URL(boundedString(value, label, 2048));
  } catch {
    throw new Error(`${label} must be an HTTP(S) URL`);
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`${label} must be an HTTP(S) URL`);
  }
  return url.hostname.toLowerCase().replace(/^www\./u, '');
}

function assertMatchingHostname(value, expectedHostname, label) {
  if (normalizedHostname(value, label) !== expectedHostname) {
    throw new Error(`${label} hostname must match the recording protocol`);
  }
}

function normalizeSelector(value, stepIndex, selectorIndex) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`step ${stepIndex} selector ${selectorIndex} must be an object`);
  }
  const kind = boundedString(value.kind, `step ${stepIndex} selector ${selectorIndex} kind`, 32);
  if (!ALLOWED_LOCATOR_KINDS.has(kind)) {
    throw new Error(`step ${stepIndex} selector ${selectorIndex} kind is unsupported`);
  }
  const selector = {
    kind,
    value: boundedString(value.value, `step ${stepIndex} selector ${selectorIndex} value`, 512),
    unique: value.unique === true,
  };
  if (kind === 'role') {
    selector.role = boundedString(
      value.role,
      `step ${stepIndex} selector ${selectorIndex} role`,
      80,
    ).toLowerCase();
    selector.name = boundedString(
      value.name,
      `step ${stepIndex} selector ${selectorIndex} name`,
      240,
    );
  }
  return selector;
}

function normalizeStep(value, index, expectedHostname) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`step ${index} must be an object`);
  }
  if (!ALLOWED_ACTIONS.has(value.action)) {
    throw new Error(`step ${index} must be click or press`);
  }
  if ('value' in value || !value.target || typeof value.target !== 'object') {
    throw new Error(`step ${index} contains an unsupported value or target`);
  }
  if ('value' in value.target) {
    throw new Error(`step ${index} target contains an entered value`);
  }
  assertMatchingHostname(value.pageUrl, expectedHostname, `step ${index} pageUrl`);
  if (
    !Array.isArray(value.target.selectors) ||
    value.target.selectors.length === 0 ||
    value.target.selectors.length > 8
  ) {
    throw new Error(`step ${index} must contain 1-8 selectors`);
  }
  const target = {
    tag: boundedString(value.target.tag, `step ${index} target tag`, 40).toLowerCase(),
    text: optionalString(value.target.text, `step ${index} target text`, 240),
    role: optionalString(value.target.role, `step ${index} target role`, 80),
    ariaLabel: optionalString(value.target.ariaLabel, `step ${index} target ariaLabel`, 240),
    selectors: value.target.selectors.map((selector, selectorIndex) =>
      normalizeSelector(selector, index, selectorIndex),
    ),
  };
  const step = { action: value.action, target };
  if (value.action === 'press') {
    step.key = boundedString(value.key, `step ${index} key`, 20);
    if (!ALLOWED_KEYS.has(step.key)) {
      throw new Error(`step ${index} key is unsupported`);
    }
  }
  return step;
}

function normalizeRecording(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Recording must be an object');
  }
  if (value.schemaVersion !== 1 || value.kind !== 'onekey-connect-button-recording') {
    throw new Error('Unsupported connect-button recording');
  }
  if (value.runtime?.privateSession !== true) {
    throw new Error('Recording must come from a private session');
  }
  if (!/^[a-f0-9]{64}$/u.test(String(value.runtime?.bundleSha256 || ''))) {
    throw new Error('Recording bundle SHA-256 is invalid');
  }
  const source = boundedString(value.protocol?.source, 'protocol source', 100);
  if (!SAFE_SEGMENT.test(source)) throw new Error('protocol source must be normalized');
  const protocolId = boundedString(value.protocol?.id, 'protocol id', 160);
  const protocolName = boundedString(value.protocol?.name, 'protocol name', 160);
  const protocolSlug = normalizeRecordingProtocolSlug(value.protocol?.slug);
  const protocolUrl = boundedString(value.protocol?.url, 'protocol URL', 2048);
  const expectedHostname = normalizedHostname(protocolUrl, 'protocol URL');
  const initialUrl = boundedString(value.initialUrl, 'initialUrl', 2048);
  assertMatchingHostname(initialUrl, expectedHostname, 'initialUrl');
  assertMatchingHostname(value.finalUrl, expectedHostname, 'finalUrl');
  if (
    !Array.isArray(value.steps) ||
    value.steps.length === 0 ||
    value.steps.length > MAXIMUM_STEPS
  ) {
    throw new Error(`Recording must contain 1-${MAXIMUM_STEPS} steps`);
  }
  const steps = value.steps.map((step, index) => normalizeStep(step, index, expectedHostname));
  let outcome = null;
  if (value.outcome !== null && value.outcome !== undefined) {
    if (
      value.outcome?.kind !== 'repository-wallet-icon' ||
      !Number.isInteger(value.outcome.afterStep) ||
      value.outcome.afterStep < 1 ||
      value.outcome.afterStep > steps.length
    ) {
      throw new Error('Recording wallet-picker outcome is invalid');
    }
    outcome = {
      kind: 'repository-wallet-icon',
      afterStep: value.outcome.afterStep,
    };
  }
  return {
    source,
    protocolId,
    protocolName,
    protocolSlug,
    protocolUrl,
    site: expectedHostname,
    initialUrl,
    outcome,
    steps,
  };
}

function targetSemanticValues(target) {
  return [
    target.text,
    target.ariaLabel,
    ...target.selectors.flatMap((selector) => {
      if (selector.kind === 'role') return [selector.name];
      if (selector.kind === 'text' || selector.kind === 'ariaLabel') {
        return [selector.value];
      }
      return [];
    }),
  ].filter(Boolean);
}

function recordedActionBoundary(recording) {
  if (recording.outcome) return recording.outcome.afterStep;
  const connectClicks = recording.steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => {
      return (
        step.action === 'click' &&
        targetSemanticValues(step.target).some((value) => CONNECT_TARGET_TEXT.test(value))
      );
    });
  if (connectClicks.length === 1) return connectClicks[0].index + 1;
  if (recording.steps.length === 1 && recording.steps[0].action === 'click') return 1;
  throw new Error(
    'Recording does not identify exactly one wallet-opening click; re-record with the current recorder',
  );
}

function assertSafeTarget(target, stepIndex) {
  const unsafe = targetSemanticValues(target).find((value) =>
    isDesktopE2EProhibitedActionText(value),
  );
  if (unsafe) {
    throw new Error(`step ${stepIndex} violates the Desktop E2E safety policy (${unsafe})`);
  }
}

function compiledLocators(target, stepIndex) {
  const selectors = target.selectors.map((selector, index) => ({ selector, index }));
  if (!selectors.some(({ selector }) => selector.unique)) {
    throw new Error(
      `step ${stepIndex} has no unique recorded locator; re-record with the current recorder`,
    );
  }
  selectors.sort((left, right) => {
    return (
      Number(right.selector.unique) - Number(left.selector.unique) ||
      (LOCATOR_PRIORITY.get(left.selector.kind) ?? Number.MAX_SAFE_INTEGER) -
        (LOCATOR_PRIORITY.get(right.selector.kind) ?? Number.MAX_SAFE_INTEGER) ||
      left.index - right.index
    );
  });
  const seen = new Set();
  return selectors.flatMap(({ selector }) => {
    const key = `${selector.kind}:${selector.value}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [
      {
        kind: selector.kind,
        value: selector.value,
        ...(selector.kind === 'role' ? { role: selector.role, name: selector.name } : {}),
      },
    ];
  });
}

function actionDescription(recording, step, index, walletOpeningIndex) {
  const label = step.target.text || step.target.ariaLabel || step.target.role || step.target.tag;
  if (index === walletOpeningIndex) {
    return `Open the ${recording.protocolName} wallet selection modal`;
  }
  return step.action === 'press'
    ? `Replay ${step.key} on ${label}`
    : `Replay recorded click on ${label}`;
}

function readinessActionIndex(requiredSteps, walletOpeningIndex) {
  const walletOpeningTarget = requiredSteps[walletOpeningIndex]?.target;
  const roles = new Set([
    walletOpeningTarget?.role?.toLowerCase(),
    ...walletOpeningTarget.selectors
      .filter((selector) => selector.kind === 'role')
      .map((selector) => selector.role),
  ]);
  if (![...roles].some((role) => ESCAPE_DISMISSIBLE_ROLES.has(role))) {
    return walletOpeningIndex;
  }
  for (let index = walletOpeningIndex - 1; index >= 0; index -= 1) {
    if (requiredSteps[index]?.action === 'click') return index;
  }
  return walletOpeningIndex;
}

export function compileRecordingToDesktopE2E(value, recordingSha256) {
  if (!/^[a-f0-9]{64}$/u.test(String(recordingSha256 || ''))) {
    throw new Error('recordingSha256 must be a lowercase SHA-256 digest');
  }
  const recording = normalizeRecording(value);
  const boundary = recordedActionBoundary(recording);
  const requiredSteps = recording.steps.slice(0, boundary);
  const walletOpeningIndex = requiredSteps.length - 1;
  if (requiredSteps[walletOpeningIndex]?.action !== 'click') {
    throw new Error('The wallet-picker outcome must follow a click action');
  }
  const compiledActions = requiredSteps.map((step, index) => {
    assertSafeTarget(step.target, index);
    return {
      action: step.action,
      description: actionDescription(recording, step, index, walletOpeningIndex),
      locators: compiledLocators(step.target, index),
      ...(step.action === 'press' ? { key: step.key } : {}),
      timeoutMs: 10_000,
      waitAfterMs: index === walletOpeningIndex ? 1_000 : 750,
    };
  });
  const readinessIndex = readinessActionIndex(requiredSteps, walletOpeningIndex);
  const readinessTargetAction = compiledActions[readinessIndex];
  compiledActions.splice(readinessIndex, 0, {
    action: 'press',
    description: `Wait for the ${recording.protocolName} connect path to finish initializing`,
    locators: readinessTargetAction.locators,
    key: 'Escape',
    timeoutMs: readinessTargetAction.timeoutMs,
    waitAfterMs: 3_000,
  });
  const testCase = validateDesktopRecordingE2ECase({
    schemaVersion: 1,
    kind: 'onekey-connect-button-desktop-e2e',
    source: recording.source,
    protocolId: recording.protocolId,
    site: recording.site,
    startUrl: recording.initialUrl,
    recordingSha256,
    actions: compiledActions,
  });
  return {
    recording,
    testCase,
  };
}

export function renderDesktopRecordingE2E(testCase) {
  const serialized = JSON.stringify(testCase, null, 2).replace(
    /^(\s*)"([a-zA-Z][a-zA-Z0-9]*)":/gmu,
    '$1$2:',
  );
  return `import { pathToFileURL } from 'node:url';

import {
  runDesktopRecordingE2EAndExit,
  validateDesktopRecordingE2ECase,
} from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = validateDesktopRecordingE2ECase(${serialized});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runDesktopRecordingE2EAndExit(testCase);
}
`;
}

export function generateDesktopRecordingE2EFromContent(content) {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(String(content), 'utf8');
  if (buffer.byteLength === 0 || buffer.byteLength > MAXIMUM_RECORDING_BYTES) {
    throw new Error('Recording must be 1 byte to 1 MiB');
  }
  let value;
  try {
    value = JSON.parse(buffer.toString('utf8'));
  } catch {
    throw new Error('Recording must be valid JSON');
  }
  const recordingSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const compiled = compileRecordingToDesktopE2E(value, recordingSha256);
  return {
    ...compiled,
    recordingSha256,
    source: renderDesktopRecordingE2E(compiled.testCase),
  };
}
