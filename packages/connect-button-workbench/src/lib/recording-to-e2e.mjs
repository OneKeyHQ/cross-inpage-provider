import crypto from 'node:crypto';

import {
  createDesktopRecordingE2ECase,
  isDesktopE2EProhibitedActionText,
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
const ALLOWED_LOCATOR_STRENGTHS = new Set([
  'stable',
  'anchored',
  'class',
  'semantic',
  'structural',
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
const MAXIMUM_RECORDED_MATCH_COUNT = 10_000;
const MAXIMUM_TARGET_SCOPES = 4;
const MAXIMUM_SHADOW_HOSTS = 4;
const MAXIMUM_SHADOW_HOST_SELECTORS = 4;

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

function optionalBoundedInteger(value, label, maximum) {
  if (value == null) return null;
  if (!Number.isInteger(value) || value < 0 || value > maximum) {
    throw new Error(`${label} must be an integer between 0 and ${String(maximum)}`);
  }
  return value;
}

function inferLocatorStrength(kind, value) {
  if (['testId', 'dataTest', 'dataCy', 'id'].includes(kind)) return 'stable';
  if (kind !== 'css') return 'semantic';
  if (/\[(?:data-testid|data-test|data-cy)=|#[a-zA-Z_-]/u.test(value)) return 'anchored';
  if (/\[class~=/u.test(value)) return 'class';
  return 'structural';
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
  const strength = value.strength ?? inferLocatorStrength(kind, selector.value);
  if (!ALLOWED_LOCATOR_STRENGTHS.has(strength)) {
    throw new Error(`step ${stepIndex} selector ${selectorIndex} strength is unsupported`);
  }
  selector.strength = strength;
  const matchCount = optionalBoundedInteger(
    value.matchCount,
    `step ${stepIndex} selector ${selectorIndex} matchCount`,
    MAXIMUM_RECORDED_MATCH_COUNT,
  );
  const visibleMatchCount = optionalBoundedInteger(
    value.visibleMatchCount,
    `step ${stepIndex} selector ${selectorIndex} visibleMatchCount`,
    MAXIMUM_RECORDED_MATCH_COUNT,
  );
  if (matchCount !== null) selector.matchCount = matchCount;
  if (visibleMatchCount !== null) selector.visibleMatchCount = visibleMatchCount;
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

function normalizeScope(value, stepIndex, scopeIndex) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`step ${stepIndex} scope ${scopeIndex} must be an object`);
  }
  if (value.relation !== 'ancestor') {
    throw new Error(`step ${stepIndex} scope ${scopeIndex} relation is unsupported`);
  }
  return {
    relation: 'ancestor',
    tag: boundedString(value.tag, `step ${stepIndex} scope ${scopeIndex} tag`, 40).toLowerCase(),
    locator: normalizeSelector(value.locator, stepIndex, `scope-${String(scopeIndex)}`),
  };
}

function normalizeShadowHost(value, stepIndex, hostIndex) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`step ${stepIndex} shadow host ${hostIndex} must be an object`);
  }
  if (
    !Array.isArray(value.selectors) ||
    value.selectors.length === 0 ||
    value.selectors.length > MAXIMUM_SHADOW_HOST_SELECTORS
  ) {
    throw new Error(
      `step ${stepIndex} shadow host ${hostIndex} must contain 1-${String(
        MAXIMUM_SHADOW_HOST_SELECTORS,
      )} selectors`,
    );
  }
  return {
    tag: boundedString(
      value.tag,
      `step ${stepIndex} shadow host ${hostIndex} tag`,
      40,
    ).toLowerCase(),
    selectors: value.selectors.map((selector, selectorIndex) =>
      normalizeSelector(
        selector,
        stepIndex,
        `shadow-${String(hostIndex)}-${String(selectorIndex)}`,
      ),
    ),
  };
}

function normalizeGeometry(value, stepIndex) {
  if (value == null) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`step ${stepIndex} target geometry must be an object`);
  }
  const geometry = {};
  for (const key of ['centerXRatio', 'centerYRatio', 'widthRatio', 'heightRatio']) {
    const number = value[key];
    if (typeof number !== 'number' || !Number.isFinite(number) || number < 0 || number > 1) {
      throw new Error(`step ${stepIndex} target geometry ${key} must be between 0 and 1`);
    }
    geometry[key] = number;
  }
  return geometry;
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
  const stableClassTokens = value.target.stableClassTokens ?? [];
  if (!Array.isArray(stableClassTokens) || stableClassTokens.length > 6) {
    throw new Error(`step ${index} target stableClassTokens must contain 0-6 values`);
  }
  const scopes = value.target.scopes ?? [];
  if (!Array.isArray(scopes) || scopes.length > MAXIMUM_TARGET_SCOPES) {
    throw new Error(
      `step ${index} target scopes must contain 0-${String(MAXIMUM_TARGET_SCOPES)} values`,
    );
  }
  const shadowHosts = value.target.shadowHosts ?? [];
  if (!Array.isArray(shadowHosts) || shadowHosts.length > MAXIMUM_SHADOW_HOSTS) {
    throw new Error(
      `step ${index} target shadowHosts must contain 0-${String(MAXIMUM_SHADOW_HOSTS)} values`,
    );
  }
  const target = {
    tag: boundedString(value.target.tag, `step ${index} target tag`, 40).toLowerCase(),
    text: optionalString(value.target.text, `step ${index} target text`, 240),
    role: optionalString(value.target.role, `step ${index} target role`, 80),
    ariaLabel: optionalString(value.target.ariaLabel, `step ${index} target ariaLabel`, 240),
    inputType: optionalString(value.target.inputType, `step ${index} target inputType`, 40),
    stableClassTokens: stableClassTokens.map((token, tokenIndex) =>
      boundedString(token, `step ${index} target stableClassTokens ${tokenIndex}`, 40),
    ),
    scopes: scopes.map((scope, scopeIndex) => normalizeScope(scope, index, scopeIndex)),
    shadowHosts: shadowHosts.map((host, hostIndex) => normalizeShadowHost(host, index, hostIndex)),
    geometry: normalizeGeometry(value.target.geometry, index),
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
  if (![1, 2].includes(value.schemaVersion) || value.kind !== 'onekey-connect-button-recording') {
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
    schemaVersion: value.schemaVersion,
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

function compiledLocator(selector) {
  return {
    kind: selector.kind,
    value: selector.value,
    strength: selector.strength,
    uniqueAtRecording: selector.unique,
    ...(selector.matchCount !== undefined ? { matchCount: selector.matchCount } : {}),
    ...(selector.visibleMatchCount !== undefined
      ? { visibleMatchCount: selector.visibleMatchCount }
      : {}),
    ...(selector.kind === 'role' ? { role: selector.role, name: selector.name } : {}),
  };
}

function compiledLocators(target, stepIndex) {
  const selectors = target.selectors.map((selector, index) => ({ selector, index }));
  const hasRecordedUniqueLocator = selectors.some(({ selector }) => selector.unique);
  const hasCompositeContext = Boolean(
    selectors.length >= 2 ||
      target.scopes.length > 0 ||
      target.shadowHosts.length > 0 ||
      target.stableClassTokens.length > 0,
  );
  if (!hasRecordedUniqueLocator && !hasCompositeContext) {
    throw new Error(
      `step ${stepIndex} has neither a unique locator nor enough composite target context; re-record with the current recorder`,
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
    return [compiledLocator(selector)];
  });
}

function compiledTarget(target) {
  return {
    tag: target.tag,
    ...(target.role ? { role: target.role.toLowerCase() } : {}),
    ...(target.text ? { name: target.text } : {}),
    ...(target.ariaLabel ? { ariaLabel: target.ariaLabel } : {}),
    ...(target.inputType ? { inputType: target.inputType.toLowerCase() } : {}),
    ...(target.stableClassTokens.length > 0 ? { stableClassTokens: target.stableClassTokens } : {}),
    ...(target.scopes.length > 0
      ? {
          scopes: target.scopes.map((scope) => ({
            relation: scope.relation,
            tag: scope.tag,
            locator: compiledLocator(scope.locator),
          })),
        }
      : {}),
    ...(target.shadowHosts.length > 0
      ? {
          shadowHosts: target.shadowHosts.map((host) => ({
            tag: host.tag,
            locators: host.selectors.map(compiledLocator),
          })),
        }
      : {}),
    ...(target.geometry ? { geometry: target.geometry } : {}),
  };
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
      target: compiledTarget(step.target),
      ...(step.action === 'press' ? { key: step.key } : {}),
    };
  });
  const readinessIndex = readinessActionIndex(requiredSteps, walletOpeningIndex);
  compiledActions[readinessIndex].readiness = true;
  const definition = {
    schemaVersion: 1,
    kind: 'onekey-connect-button-desktop-e2e',
    source: recording.source,
    protocolId: recording.protocolId,
    site: recording.site,
    startUrl: recording.initialUrl,
    recordingSha256,
    actions: compiledActions,
  };
  const testCase = createDesktopRecordingE2ECase(definition);
  return {
    recording,
    definition,
    testCase,
  };
}

export function renderDesktopRecordingE2E(definition) {
  const serialized = JSON.stringify(definition, null, 2).replace(
    /^(\s*)"([a-zA-Z][a-zA-Z0-9]*)":/gmu,
    '$1$2:',
  );
  return `import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, ${serialized});
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
    source: renderDesktopRecordingE2E(compiled.definition),
  };
}
