import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  DesktopCdpClient as CdpClient,
  desktopHostnamesMatch as hostnameMatches,
  fetchDesktopCdpTargets as fetchTargets,
  findOneKeyDesktopHostPage,
  loadDesktopWebSocket as loadWebSocket,
  normalizeDesktopCdpEndpoint as normalizeEndpoint,
} from './desktop-cdp.mjs';
import { writeDesktopE2EFailureArtifact } from './e2e-failure-artifact.mjs';

export const DESKTOP_E2E_MAX_ATTEMPTS = 5;
const DESKTOP_E2E_MAX_ATTEMPTS_ENV = 'ONEKEY_DESKTOP_E2E_MAX_ATTEMPTS';
export const MINIMUM_CLICK_BOUNDARY_WAIT_MS = 2_000;
const MAXIMUM_ACTIONS = 100;
const MAXIMUM_ACTION_TIMEOUT_MS = 15_000;
const MAXIMUM_ACTION_WAIT_MS = 5_000;
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
const NON_SENSITIVE_INPUT_TYPES = new Set(['button', 'submit', 'reset', 'checkbox', 'radio']);
const PROHIBITED_ACTION_TEXT =
  /^(sign|approve|confirm|send|swap|deposit|withdraw|stake|bridge|buy)(\b|\s)/iu;
const TERMS_ACCEPTANCE_TEXT =
  /^(?:(?:accept|agree|confirm|continue|certify)\b.*\b(?:terms?|privacy|policy|notice)\b|I\b.*\b(?:accept|agree|certify|read)\b.*\b(?:terms?|privacy|policy|notice)\b)/iu;
const ONEKEY_WALLET_TEXT = /^OneKey(?:\s*&.*)?$/iu;
const workbenchDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const repositoryDirectory = path.resolve(workbenchDirectory, '../..');
const walletInfoModule = path.join(
  repositoryDirectory,
  'packages/providers/inpage-providers-hub/dist/connectButtonHack/consts.js',
);

function boundedString(value, label, maximumLength) {
  if (typeof value !== 'string') {
    throw new Error(`${label} must be a string`);
  }
  const result = value.trim();
  if (!result || result.length > maximumLength) {
    throw new Error(`${label} length must be between 1 and ${maximumLength}`);
  }
  return result;
}

function boundedInteger(value, label, minimum, maximum) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be an integer between ${minimum} and ${maximum}`);
  }
  return value;
}

export function isDesktopE2ESensitiveInputType(value) {
  return !NON_SENSITIVE_INPUT_TYPES.has(
    String(value || 'text')
      .trim()
      .toLowerCase(),
  );
}

export function isDesktopE2EProhibitedActionText(value) {
  const text = String(value || '').trim();
  return (
    (PROHIBITED_ACTION_TEXT.test(text) && !TERMS_ACCEPTANCE_TEXT.test(text)) ||
    ONEKEY_WALLET_TEXT.test(text)
  );
}

function normalizeLocator(value, actionIndex, locatorIndex) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`action ${actionIndex} locator ${locatorIndex} must be an object`);
  }
  const kind = boundedString(value.kind, `action ${actionIndex} locator ${locatorIndex} kind`, 32);
  if (!ALLOWED_LOCATOR_KINDS.has(kind)) {
    throw new Error(`action ${actionIndex} locator ${locatorIndex} kind is unsupported`);
  }
  const locator = {
    kind,
    value: boundedString(value.value, `action ${actionIndex} locator ${locatorIndex} value`, 512),
  };
  if (value.strength !== undefined) {
    const strength = boundedString(
      value.strength,
      `action ${actionIndex} locator ${locatorIndex} strength`,
      32,
    );
    if (!ALLOWED_LOCATOR_STRENGTHS.has(strength)) {
      throw new Error(`action ${actionIndex} locator ${locatorIndex} strength is unsupported`);
    }
    locator.strength = strength;
  }
  if (value.uniqueAtRecording !== undefined) {
    if (typeof value.uniqueAtRecording !== 'boolean') {
      throw new Error(
        `action ${actionIndex} locator ${locatorIndex} uniqueAtRecording must be boolean`,
      );
    }
    locator.uniqueAtRecording = value.uniqueAtRecording;
  }
  for (const property of ['matchCount', 'visibleMatchCount']) {
    if (value[property] !== undefined) {
      locator[property] = boundedInteger(
        value[property],
        `action ${actionIndex} locator ${locatorIndex} ${property}`,
        0,
        10_000,
      );
    }
  }
  if (kind === 'role') {
    locator.role = boundedString(
      value.role,
      `action ${actionIndex} locator ${locatorIndex} role`,
      80,
    ).toLowerCase();
    locator.name = boundedString(
      value.name,
      `action ${actionIndex} locator ${locatorIndex} name`,
      240,
    );
  }
  return locator;
}

function normalizeTargetGeometry(value, actionIndex) {
  if (value == null) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`action ${actionIndex} target geometry must be an object`);
  }
  const geometry = {};
  for (const key of ['centerXRatio', 'centerYRatio', 'widthRatio', 'heightRatio']) {
    const number = value[key];
    if (typeof number !== 'number' || !Number.isFinite(number) || number < 0 || number > 1) {
      throw new Error(`action ${actionIndex} target geometry ${key} must be between 0 and 1`);
    }
    geometry[key] = number;
  }
  return geometry;
}

function normalizeResolverTarget(value, actionIndex) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`action ${actionIndex} target must be an object`);
  }
  const target = {
    tag: boundedString(value.tag, `action ${actionIndex} target tag`, 40).toLowerCase(),
  };
  for (const [property, maximumLength] of [
    ['role', 80],
    ['name', 240],
    ['ariaLabel', 240],
    ['inputType', 40],
  ]) {
    if (value[property] !== undefined) {
      target[property] = boundedString(
        value[property],
        `action ${actionIndex} target ${property}`,
        maximumLength,
      );
    }
  }
  if (target.role) target.role = target.role.toLowerCase();
  if (target.inputType) target.inputType = target.inputType.toLowerCase();
  const stableClassTokens = value.stableClassTokens ?? [];
  if (!Array.isArray(stableClassTokens) || stableClassTokens.length > 6) {
    throw new Error(`action ${actionIndex} target stableClassTokens must contain 0-6 values`);
  }
  target.stableClassTokens = stableClassTokens.map((token, tokenIndex) =>
    boundedString(token, `action ${actionIndex} target stableClassTokens ${tokenIndex}`, 40),
  );
  const scopes = value.scopes ?? [];
  if (!Array.isArray(scopes) || scopes.length > 4) {
    throw new Error(`action ${actionIndex} target scopes must contain 0-4 values`);
  }
  target.scopes = scopes.map((scope, scopeIndex) => {
    if (!scope || typeof scope !== 'object' || Array.isArray(scope)) {
      throw new Error(`action ${actionIndex} target scope ${scopeIndex} must be an object`);
    }
    if (scope.relation !== 'ancestor') {
      throw new Error(`action ${actionIndex} target scope ${scopeIndex} relation is unsupported`);
    }
    return {
      relation: 'ancestor',
      tag: boundedString(
        scope.tag,
        `action ${actionIndex} target scope ${scopeIndex} tag`,
        40,
      ).toLowerCase(),
      locator: normalizeLocator(scope.locator, actionIndex, `scope-${String(scopeIndex)}`),
    };
  });
  const shadowHosts = value.shadowHosts ?? [];
  if (!Array.isArray(shadowHosts) || shadowHosts.length > 4) {
    throw new Error(`action ${actionIndex} target shadowHosts must contain 0-4 values`);
  }
  target.shadowHosts = shadowHosts.map((host, hostIndex) => {
    if (!host || typeof host !== 'object' || Array.isArray(host)) {
      throw new Error(`action ${actionIndex} target shadow host ${hostIndex} must be an object`);
    }
    if (!Array.isArray(host.locators) || host.locators.length === 0 || host.locators.length > 4) {
      throw new Error(
        `action ${actionIndex} target shadow host ${hostIndex} must contain 1-4 locators`,
      );
    }
    return {
      tag: boundedString(
        host.tag,
        `action ${actionIndex} target shadow host ${hostIndex} tag`,
        40,
      ).toLowerCase(),
      locators: host.locators.map((locator, locatorIndex) =>
        normalizeLocator(
          locator,
          actionIndex,
          `shadow-${String(hostIndex)}-${String(locatorIndex)}`,
        ),
      ),
    };
  });
  const geometry = normalizeTargetGeometry(value.geometry, actionIndex);
  if (geometry) target.geometry = geometry;
  return target;
}

function normalizeAction(value, index) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`action ${index} must be an object`);
  }
  if (value.action !== 'click' && value.action !== 'press') {
    throw new Error(`action ${index} must be click or press`);
  }
  if (!Array.isArray(value.locators) || value.locators.length === 0 || value.locators.length > 8) {
    throw new Error(`action ${index} must contain 1-8 locators`);
  }
  const waitAfterMs =
    value.waitAfterMs == null
      ? 750
      : boundedInteger(value.waitAfterMs, `action ${index} waitAfterMs`, 0, MAXIMUM_ACTION_WAIT_MS);
  const waitBeforeMs =
    value.waitBeforeMs == null
      ? 0
      : boundedInteger(
          value.waitBeforeMs,
          `action ${index} waitBeforeMs`,
          0,
          MAXIMUM_ACTION_WAIT_MS,
        );
  const action = {
    action: value.action,
    description: boundedString(value.description, `action ${index} description`, 240),
    locators: value.locators.map((locator, locatorIndex) =>
      normalizeLocator(locator, index, locatorIndex),
    ),
    timeoutMs:
      value.timeoutMs == null
        ? 10_000
        : boundedInteger(
            value.timeoutMs,
            `action ${index} timeoutMs`,
            100,
            MAXIMUM_ACTION_TIMEOUT_MS,
          ),
    waitAfterMs:
      value.action === 'click'
        ? Math.max(waitAfterMs, MINIMUM_CLICK_BOUNDARY_WAIT_MS)
        : waitAfterMs,
    ...(waitBeforeMs ? { waitBeforeMs } : {}),
    ...(value.target ? { target: normalizeResolverTarget(value.target, index) } : {}),
  };
  if (value.action === 'press') {
    action.key = boundedString(value.key, `action ${index} key`, 20);
    if (!ALLOWED_KEYS.has(action.key)) {
      throw new Error(`action ${index} key is unsupported`);
    }
  }
  return action;
}

export function validateDesktopRecordingE2ECase(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Desktop recording E2E case must be an object');
  }
  if (value.schemaVersion !== 1 || value.kind !== 'onekey-connect-button-desktop-e2e') {
    throw new Error('Unsupported Desktop recording E2E case');
  }
  const source = boundedString(value.source, 'source', 100);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(source)) {
    throw new Error('source must be a normalized DApp source');
  }
  const site = boundedString(value.site, 'site', 255);
  const startUrl = boundedString(value.startUrl, 'startUrl', 2048);
  const parsedStartUrl = new URL(startUrl);
  if (!['http:', 'https:'].includes(parsedStartUrl.protocol) || !hostnameMatches(site, startUrl)) {
    throw new Error('startUrl must be HTTP(S) and match site');
  }
  if (
    !Array.isArray(value.actions) ||
    value.actions.length === 0 ||
    value.actions.length > MAXIMUM_ACTIONS
  ) {
    throw new Error(`Desktop recording E2E case must contain 1-${MAXIMUM_ACTIONS} actions`);
  }
  const recordingSha256 = boundedString(value.recordingSha256, 'recordingSha256', 64);
  if (!/^[a-f0-9]{64}$/u.test(recordingSha256)) {
    throw new Error('recordingSha256 must be a lowercase SHA-256 digest');
  }
  const actions = value.actions.map(normalizeAction);
  const firstClick = actions.find((action) => action.action === 'click');
  if (firstClick) {
    firstClick.waitBeforeMs = Math.max(
      firstClick.waitBeforeMs || 0,
      MINIMUM_CLICK_BOUNDARY_WAIT_MS,
    );
  }
  return {
    schemaVersion: 1,
    kind: 'onekey-connect-button-desktop-e2e',
    source,
    protocolId: boundedString(value.protocolId, 'protocolId', 160),
    site,
    startUrl,
    recordingSha256,
    actions,
  };
}

export function createDesktopRecordingE2ECase(definition) {
  if (!definition || typeof definition !== 'object' || Array.isArray(definition)) {
    throw new Error('Desktop recording E2E definition must be an object');
  }
  if (!Array.isArray(definition.actions)) {
    throw new Error('Desktop recording E2E definition actions must be an array');
  }
  let readinessActions = 0;
  const actions = definition.actions.flatMap((definitionAction, index) => {
    if (
      !definitionAction ||
      typeof definitionAction !== 'object' ||
      Array.isArray(definitionAction)
    ) {
      throw new Error(`definition action ${index} must be an object`);
    }
    if (definitionAction.readiness !== undefined && definitionAction.readiness !== true) {
      throw new Error(`definition action ${index} readiness must be true when present`);
    }
    const { readiness, ...action } = definitionAction;
    if (readiness !== true) return [action];
    if (action.action !== 'click') {
      throw new Error(`definition action ${index} readiness requires a click action`);
    }
    readinessActions += 1;
    return [
      {
        action: 'press',
        description: 'Wait for the connect path to finish initializing',
        locators: action.locators,
        ...(action.target ? { target: action.target } : {}),
        key: 'Escape',
        timeoutMs: action.timeoutMs,
        waitAfterMs: 3_000,
      },
      action,
    ];
  });
  if (readinessActions !== 1) {
    throw new Error(
      `Desktop recording E2E definition must mark exactly one click readiness action; received ${String(
        readinessActions,
      )}`,
    );
  }
  return validateDesktopRecordingE2ECase({
    ...definition,
    actions,
  });
}

export function repositoryIconSources(walletConnectInfo) {
  if (!walletConnectInfo || typeof walletConnectInfo !== 'object') {
    throw new Error('WALLET_CONNECT_INFO is unavailable');
  }
  return Object.entries(walletConnectInfo).flatMap(([key, value]) => {
    const sources = [
      ['inline', value?.icon],
      ['asset', value?.iconUrl],
      ...(Array.isArray(value?.autoReviewIconUrls)
        ? value.autoReviewIconUrls.map((source) => ['asset', source])
        : []),
    ];
    return sources
      .filter(([, source]) => typeof source === 'string' && source)
      .map(([sourceKind, source]) => ({
        key,
        label: String(value?.text || key),
        source,
        sourceKind,
      }));
  });
}

async function loadRepositoryIconSources() {
  let module;
  try {
    module = await import(`${pathToFileURL(walletInfoModule).href}?e2e=${Date.now()}`);
  } catch (error) {
    throw new Error(
      `Cannot load built WALLET_CONNECT_INFO. Run npm --prefix packages/connect-button-workbench run build:desktop-preload first. ${error.message}`,
    );
  }
  return repositoryIconSources(module.WALLET_CONNECT_INFO);
}

function chooseOneKeyTargets(targets, site) {
  const oneKeyHost = findOneKeyDesktopHostPage(targets);
  if (!oneKeyHost) {
    throw new Error('No OneKey Desktop host page CDP target was found');
  }
  const matchingWebviews = matchingOneKeyWebviews(targets, site);
  const webview = matchingWebviews.at(-1);
  if (!webview?.webSocketDebuggerUrl) {
    throw new Error(`No OneKey Desktop DApp Browser webview matches ${site}`);
  }
  return { oneKeyHost, webview };
}

function matchingOneKeyWebviews(targets, site) {
  return targets.filter(
    (target) => target.type === 'webview' && hostnameMatches(target.url || '', site),
  );
}

export function findFreshOneKeyWebviewTarget(targets, site, previousTargetIds) {
  const excluded = new Set(previousTargetIds || []);
  return matchingOneKeyWebviews(targets, site)
    .filter(
      (target) =>
        target.webSocketDebuggerUrl && typeof target.id === 'string' && !excluded.has(target.id),
    )
    .at(-1);
}

export function desktopE2EWalletDetectionExpression(iconSources) {
  return `(() => {
    const icons = ${JSON.stringify(iconSources)};
    const oneKeyWalletIdPattern = /^[a-z0-9]+-onekey-[a-z0-9-]+$/i;
    const roots = [];
    const visit = (root) => {
      roots.push(root);
      for (const element of root.querySelectorAll('*')) {
        if (element.shadowRoot) visit(element.shadowRoot);
      }
    };
    visit(document);
    const values = (element) => {
      const result = [
        element.getAttribute('href'),
        element.getAttribute('src'),
        element.getAttribute('srcset'),
        element.getAttribute('style'),
        element.getAttribute('xlink:href'),
      ];
      if (typeof HTMLImageElement !== 'undefined' && element instanceof HTMLImageElement) {
        result.push(element.currentSrc, element.src, element.srcset);
      }
      if (typeof SVGImageElement !== 'undefined' && element instanceof SVGImageElement) {
        result.push(element.href?.baseVal);
      }
      if (element instanceof HTMLElement) result.push(element.style.backgroundImage);
      return result.filter(Boolean);
    };
    for (const root of roots) {
      for (const element of root.querySelectorAll('img,source,image,[style]')) {
        const sources = values(element);
        const icon = icons.find(({ source }) =>
          sources.some((value) => value === source || value.includes(source))
        );
        if (icon) {
          return {
            repositoryWalletDetected: true,
            repositoryIconDetected: true,
            oneKeyWalletIdDetected: false,
            iconKey: icon.key,
            iconLabel: icon.label,
            sourceKind: icon.sourceKind,
            walletId: null,
            url: location.href,
            customInjection: window.__ONEKEY_CUSTOM_INJECTION__ || null,
          };
        }
      }
    }
    for (const root of roots) {
      for (const element of root.querySelectorAll('[data-wallet-id]')) {
        const walletId = element.getAttribute('data-wallet-id') || '';
        if (oneKeyWalletIdPattern.test(walletId)) {
          return {
            repositoryWalletDetected: true,
            repositoryIconDetected: false,
            oneKeyWalletIdDetected: true,
            iconKey: null,
            iconLabel: null,
            sourceKind: 'wallet-id',
            walletId,
            url: location.href,
            customInjection: window.__ONEKEY_CUSTOM_INJECTION__ || null,
          };
        }
      }
    }
    return {
      repositoryWalletDetected: false,
      repositoryIconDetected: false,
      oneKeyWalletIdDetected: false,
      walletId: null,
      url: location.href,
      customInjection: window.__ONEKEY_CUSTOM_INJECTION__ || null,
    };
  })()`;
}

function repositoryWalletWasDetected(verdict) {
  return Boolean(
    verdict?.repositoryWalletDetected === true ||
      verdict?.repositoryIconDetected === true ||
      verdict?.oneKeyWalletIdDetected === true,
  );
}

export function desktopE2EResolveLocatorExpression(value, clickToken = '') {
  return `(() => {
    const resolverValue = ${JSON.stringify(value)};
    const resolver = Array.isArray(resolverValue) ? { locators: resolverValue } : resolverValue;
    const locators = resolver.locators || [];
    const target = resolver.target || null;
    const clickToken = ${JSON.stringify(clickToken)};
    const nonSensitiveInputTypes = ${JSON.stringify(Array.from(NON_SENSITIVE_INPUT_TYPES))};
    const prohibitedActionText = new RegExp(${JSON.stringify(PROHIBITED_ACTION_TEXT.source)}, 'iu');
    const termsAcceptanceText = new RegExp(${JSON.stringify(TERMS_ACCEPTANCE_TEXT.source)}, 'iu');
    const oneKeyWalletText = new RegExp(${JSON.stringify(ONEKEY_WALLET_TEXT.source)}, 'iu');
    const strengthWeights = { stable: 120, anchored: 90, class: 55, semantic: 45, structural: 25 };
    const minimumScore = 90;
    const minimumMargin = 25;
    const normalize = (value) => String(value || '').replace(/\\s+/gu, ' ').trim();
    const roots = [];
    const visit = (root) => {
      roots.push(root);
      for (const element of root.querySelectorAll('*')) {
        if (element.shadowRoot) visit(element.shadowRoot);
      }
    };
    visit(document);
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' &&
        Number(style.opacity || 1) > 0 && style.pointerEvents !== 'none' &&
        rect.width > 0 && rect.height > 0;
    };
    const clickablePoint = (element) => {
      const rect = element.getBoundingClientRect();
      const left = Math.max(0, rect.left);
      const right = Math.min(innerWidth, rect.right);
      const top = Math.max(0, rect.top);
      const bottom = Math.min(innerHeight, rect.bottom);
      if (right <= left || bottom <= top) return null;
      const width = right - left;
      const height = bottom - top;
      const candidates = [
        [0.5, 0.5],
        [0.5, 0.25],
        [0.5, 0.75],
        [0.25, 0.5],
        [0.75, 0.5],
      ];
      const root = element.getRootNode();
      const elementFromPoint =
        typeof root.elementFromPoint === 'function'
          ? root.elementFromPoint.bind(root)
          : document.elementFromPoint?.bind(document);
      for (const [xRatio, yRatio] of candidates) {
        const x = left + width * xRatio;
        const y = top + height * yRatio;
        const hit = elementFromPoint?.(x, y);
        if (!hit || hit === element || element.contains(hit)) return { x, y };
      }
      return null;
    };
    const role = (element) => {
      const explicit = normalize(element.getAttribute('role')).toLowerCase();
      if (explicit) return explicit;
      const tag = element.tagName.toLowerCase();
      if (tag === 'button') return 'button';
      if (tag === 'a' && element.hasAttribute('href')) return 'link';
      if (tag === 'dialog') return 'dialog';
      if (tag === 'form') return 'form';
      if (tag === 'main') return 'main';
      if (tag === 'nav') return 'navigation';
      if (tag === 'section' && (element.hasAttribute('aria-label') || element.hasAttribute('title'))) return 'region';
      if (tag === 'select') return 'combobox';
      if (tag === 'textarea') return 'textbox';
      if (tag === 'input') {
        const type = normalize(element.getAttribute('type')).toLowerCase();
        if (type === 'checkbox') return 'checkbox';
        if (type === 'radio') return 'radio';
        if (['button', 'submit', 'reset'].includes(type)) return 'button';
        return 'textbox';
      }
      return '';
    };
    const name = (element) => normalize(
      element.getAttribute('aria-label') || element.getAttribute('title') ||
      element.innerText || element.textContent
    );
    const inferStrength = (locator) => {
      if (locator.strength) return locator.strength;
      if (['testId', 'dataTest', 'dataCy', 'id'].includes(locator.kind)) return 'stable';
      if (locator.kind !== 'css') return 'semantic';
      if (/\\[(?:data-testid|data-test|data-cy)=|#[a-zA-Z_-]/u.test(locator.value)) return 'anchored';
      if (/\\[class~=/u.test(locator.value)) return 'class';
      return 'structural';
    };
    const matchesLocator = (element, locator) => {
      try {
        if (locator.kind === 'testId') return element.getAttribute('data-testid') === locator.value;
        if (locator.kind === 'dataTest') return element.getAttribute('data-test') === locator.value;
        if (locator.kind === 'dataCy') return element.getAttribute('data-cy') === locator.value;
        if (locator.kind === 'id') return element.id === locator.value;
        if (locator.kind === 'ariaLabel') return element.getAttribute('aria-label') === locator.value;
        if (locator.kind === 'css') return element.matches(locator.value);
        if (locator.kind === 'role') return role(element) === locator.role && name(element) === locator.name;
        if (locator.kind === 'text') return name(element) === locator.value;
      } catch {}
      return false;
    };
    const query = (locator) => {
      const result = [];
      for (const root of roots) {
        let candidates = [];
        try {
          if (locator.kind === 'testId') candidates = root.querySelectorAll('[data-testid="' + CSS.escape(locator.value) + '"]');
          else if (locator.kind === 'dataTest') candidates = root.querySelectorAll('[data-test="' + CSS.escape(locator.value) + '"]');
          else if (locator.kind === 'dataCy') candidates = root.querySelectorAll('[data-cy="' + CSS.escape(locator.value) + '"]');
          else if (locator.kind === 'id') candidates = root.querySelectorAll('#' + CSS.escape(locator.value));
          else if (locator.kind === 'ariaLabel') candidates = root.querySelectorAll('[aria-label="' + CSS.escape(locator.value) + '"]');
          else if (locator.kind === 'css') candidates = root.querySelectorAll(locator.value);
          else candidates = root.querySelectorAll('button,a,input,select,textarea,label,[role]');
        } catch { candidates = []; }
        for (const element of candidates) {
          if (locator.kind === 'role' && (role(element) !== locator.role || name(element) !== locator.name)) continue;
          if (locator.kind === 'text' && name(element) !== locator.value) continue;
          if (visible(element) && !result.includes(element)) result.push(element);
        }
      }
      return result;
    };
    const safety = (element) => {
      const text = name(element);
      const walletItem = element.closest('[data-wallet-id]');
      const input = element.closest('input');
      const inputType = normalize(input?.getAttribute('type') || 'text').toLowerCase();
      const sensitive = element.closest('textarea,[contenteditable="true"]') ||
        (input && !nonSensitiveInputTypes.includes(inputType));
      const prohibited =
        (prohibitedActionText.test(text) && !termsAcceptanceText.test(text)) ||
        oneKeyWalletText.test(text);
      return { unsafe: Boolean(walletItem || sensitive || prohibited), text };
    };
    const armClickReceipt = (element) => {
      if (!clickToken) return;
      const stateKey = '__ONEKEY_DESKTOP_E2E_CLICK_ATTEMPT__';
      window[stateKey]?.cleanup?.();
      const state = {
        token: clickToken,
        received: false,
        cleanup: () => undefined,
      };
      const handleClick = (event) => {
        state.received = event.composedPath().includes(element);
        state.cleanup();
      };
      state.cleanup = () => document.removeEventListener('click', handleClick, true);
      window[stateKey] = state;
      document.addEventListener('click', handleClick, true);
    };
    const resolvedResult = (element, locator, point, resolution) => {
      armClickReceipt(element);
      element.focus({ preventScroll: false });
      return {
        found: true,
        locator,
        tag: element.tagName.toLowerCase(),
        text: name(element),
        x: point.x,
        y: point.y,
        ...(resolution ? { resolution } : {}),
      };
    };
    const enhanced = Boolean(
      target || locators.some((locator) =>
        locator.strength || locator.uniqueAtRecording !== undefined || locator.matchCount !== undefined
      )
    );
    if (!enhanced) {
      for (const locator of locators) {
        const matches = query(locator);
        if (matches.length !== 1) continue;
        const element = matches[0];
        const safe = safety(element);
        if (safe.unsafe) {
          return { found: false, unsafe: true, text: safe.text, locator, reason: 'Target violates Desktop E2E safety policy' };
        }
        const point = clickablePoint(element);
        if (!point) continue;
        return resolvedResult(element, locator, point);
      }
      return { found: false, unsafe: false };
    }

    const candidates = new Map();
    const candidateFor = (element) => {
      let candidate = candidates.get(element);
      if (!candidate) {
        candidate = { element, score: 0, evidence: [] };
        candidates.set(element, candidate);
      }
      return candidate;
    };
    for (const locator of locators) {
      const matches = query(locator);
      const strength = inferStrength(locator);
      const baseWeight = strengthWeights[strength] || strengthWeights.structural;
      for (const element of matches) {
        const candidate = candidateFor(element);
        const weight = baseWeight + (locator.uniqueAtRecording === true ? 10 : 0) +
          (matches.length === 1 ? 10 : 0);
        candidate.score += weight;
        candidate.evidence.push({ locator, strength, currentMatchCount: matches.length, weight });
      }
    }
    const fingerprintScore = (element) => {
      if (!target) return { score: 0, matched: [] };
      let score = 0;
      const matched = [];
      if (target.tag && element.tagName.toLowerCase() === target.tag) {
        score += 20;
        matched.push('tag');
      }
      if (target.role && role(element) === target.role) {
        score += 30;
        matched.push('role');
      }
      if (target.name && name(element) === target.name) {
        score += 35;
        matched.push('name');
      }
      if (target.ariaLabel && element.getAttribute('aria-label') === target.ariaLabel) {
        score += 30;
        matched.push('ariaLabel');
      }
      if (target.inputType && normalize(element.getAttribute('type')).toLowerCase() === target.inputType) {
        score += 20;
        matched.push('inputType');
      }
      for (const token of target.stableClassTokens || []) {
        if (element.classList.contains(token)) {
          score += 5;
          matched.push('class:' + token);
        }
      }
      return { score, matched };
    };
    const scopeScore = (element) => {
      let score = 0;
      const matched = [];
      for (const [index, scope] of (target?.scopes || []).entries()) {
        let ancestor = element.parentElement;
        while (ancestor) {
          if (ancestor.tagName.toLowerCase() === scope.tag && matchesLocator(ancestor, scope.locator)) {
            const strength = inferStrength(scope.locator);
            const weight = ['stable', 'anchored'].includes(strength) ? 50 : 30;
            score += weight;
            matched.push(index);
            break;
          }
          ancestor = ancestor.parentElement;
        }
      }
      return { score, matched };
    };
    const shadowHostScore = (element) => {
      const actualHosts = [];
      let root = element.getRootNode();
      while (root?.host) {
        actualHosts.push(root.host);
        root = root.host.getRootNode();
      }
      const expectedHosts = target?.shadowHosts || [];
      if (expectedHosts.length === 0) return { score: 0, matched: [] };
      let score = 0;
      const matched = [];
      for (let index = 0; index < expectedHosts.length; index += 1) {
        const expected = expectedHosts[index];
        const actual = actualHosts[index];
        if (
          actual &&
          actual.tagName.toLowerCase() === expected.tag &&
          expected.locators.some((locator) => matchesLocator(actual, locator))
        ) {
          score += 70;
          matched.push(index);
        }
      }
      if (matched.length === 0) score -= 80;
      return { score, matched };
    };
    const geometryScore = (element) => {
      if (!target?.geometry || innerWidth <= 0 || innerHeight <= 0) return 0;
      const rect = element.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / innerWidth;
      const y = (rect.top + rect.height / 2) / innerHeight;
      const distance = Math.hypot(x - target.geometry.centerXRatio, y - target.geometry.centerYRatio);
      return Math.max(0, 10 - distance * 20);
    };
    const ranked = [];
    for (const candidate of candidates.values()) {
      const point = clickablePoint(candidate.element);
      if (!point) continue;
      const fingerprint = fingerprintScore(candidate.element);
      const scopes = scopeScore(candidate.element);
      const shadowHosts = shadowHostScore(candidate.element);
      const geometry = geometryScore(candidate.element);
      candidate.score += fingerprint.score + scopes.score + shadowHosts.score + geometry;
      const safe = safety(candidate.element);
      ranked.push({
        ...candidate,
        point,
        unsafe: safe.unsafe,
        text: safe.text,
        fingerprint: fingerprint.matched,
        scopes: scopes.matched,
        shadowHosts: shadowHosts.matched,
        geometryScore: geometry,
      });
    }
    ranked.sort((left, right) => right.score - left.score || right.evidence.length - left.evidence.length);
    const best = ranked[0];
    const second = ranked[1];
    const margin = best ? best.score - (second?.score || 0) : 0;
    const diagnostics = {
      candidateCount: ranked.length,
      bestScore: best ? Number(best.score.toFixed(3)) : 0,
      secondScore: second ? Number(second.score.toFixed(3)) : 0,
      margin: Number(margin.toFixed(3)),
      minimumScore,
      minimumMargin,
    };
    if (!best || best.score < minimumScore || (second && margin < minimumMargin)) {
      return { found: false, unsafe: false, ambiguous: Boolean(best), diagnostics };
    }
    const primaryEvidence = [...best.evidence].sort((left, right) => right.weight - left.weight)[0];
    if (best.unsafe) {
      return {
        found: false,
        unsafe: true,
        text: best.text,
        locator: primaryEvidence?.locator || null,
        reason: 'Target violates Desktop E2E safety policy',
        diagnostics,
      };
    }
    return resolvedResult(
      best.element,
      primaryEvidence?.locator || locators[0],
      best.point,
      {
        ...diagnostics,
        score: diagnostics.bestScore,
        matchedLocators: best.evidence.map(({ locator, strength, currentMatchCount }) => ({
          kind: locator.kind,
          value: locator.value,
          strength,
          currentMatchCount,
        })),
        fingerprint: best.fingerprint,
        scopes: best.scopes,
        shadowHosts: best.shadowHosts,
        geometryScore: Number(best.geometryScore.toFixed(3)),
      },
    );
  })()`;
}

export function desktopE2EClickReceiptExpression(clickToken) {
  return `(() => {
    const stateKey = '__ONEKEY_DESKTOP_E2E_CLICK_ATTEMPT__';
    const state = window[stateKey];
    if (!state || state.token !== ${JSON.stringify(clickToken)}) {
      return { received: false };
    }
    state.cleanup?.();
    const result = { received: state.received === true };
    delete window[stateKey];
    return result;
  })()`;
}

export function desktopE2EDismissIndicatorExpression() {
  return `(() => {
    const selector = '#onekey-custom-injection-indicator';
    const observerKey = '__ONEKEY_DESKTOP_E2E_INDICATOR_OBSERVER__';
    const customInjection = window.__ONEKEY_CUSTOM_INJECTION__ || null;
    const removeIndicator = () => {
      const host = document.querySelector(selector);
      if (!host) return false;
      const dismiss = host.shadowRoot?.querySelector(
        '[aria-label="Dismiss OneKey custom injection indicator"]'
      );
      if (dismiss instanceof HTMLElement) dismiss.click();
      if (host.isConnected) host.remove();
      return true;
    };
    const indicatorFound = removeIndicator();
    if (!window[observerKey] && document.documentElement) {
      const observer = new MutationObserver(removeIndicator);
      observer.observe(document.documentElement, { childList: true, subtree: true });
      window[observerKey] = observer;
    }
    return {
      customInjection,
      indicatorFound,
      indicatorDismissed: !document.querySelector(selector),
      observerInstalled: Boolean(window[observerKey]),
    };
  })()`;
}

export function desktopE2EClickTargetIsStable(before, after, tolerancePx = 2) {
  if (!before?.found || !after?.found) return false;
  const sameLocator =
    before.locator?.kind === after.locator?.kind && before.locator?.value === after.locator?.value;
  return (
    sameLocator &&
    before.tag === after.tag &&
    before.text === after.text &&
    Math.abs(before.x - after.x) <= tolerancePx &&
    Math.abs(before.y - after.y) <= tolerancePx
  );
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const MAX_CLICK_ATTEMPTS = 3;
const CLICK_STABILITY_DELAY_MS = 50;
const CLICK_RETRY_DELAY_MS = 100;

function isTransientNavigationContextError(error) {
  return /Cannot find default execution context|Execution context was destroyed/iu.test(
    error?.message || '',
  );
}

async function evaluateWithNavigationRetry(client, expression, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      return await client.evaluate(expression, {
        timeoutMs: Math.max(1, deadline - Date.now()),
      });
    } catch (error) {
      if (!isTransientNavigationContextError(error)) throw error;
      lastError = error;
      await wait(100);
    }
  }
  throw lastError || new Error('DApp Browser execution context did not become available');
}

async function waitForDocument(client, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const ready = await evaluateWithNavigationRetry(
      client,
      `({ readyState: document.readyState, url: location.href })`,
      Math.max(100, deadline - Date.now()),
    );
    if (ready?.readyState === 'complete' || ready?.readyState === 'interactive') return ready;
    await wait(200);
  }
  throw new Error('DApp Browser webview did not become ready');
}

async function dismissCustomInjectionIndicator(client, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  let result;
  while (Date.now() < deadline) {
    result = await evaluateWithNavigationRetry(
      client,
      desktopE2EDismissIndicatorExpression(),
      Math.max(100, deadline - Date.now()),
    );
    const customInjectionActive = result?.customInjection?.source === 'custom-workspace';
    if (customInjectionActive && result?.indicatorDismissed) {
      return {
        found: result.indicatorFound === true,
        dismissed: true,
        observerInstalled: result.observerInstalled === true,
      };
    }
    await wait(100);
  }
  throw new Error(
    result?.indicatorDismissed
      ? 'Custom injection marker did not become active'
      : 'Custom injection indicator could not be dismissed',
  );
}

async function resetToFreshPrivateSessionThroughOneKeyDesktop(
  endpoint,
  fetchImplementation,
  WebSocketImplementation,
  site,
  options = {},
) {
  const targets = await fetchTargets(endpoint, fetchImplementation, options);
  const { oneKeyHost } = chooseOneKeyTargets(targets, site);
  const previousTargetIds = new Set(
    matchingOneKeyWebviews(targets, site)
      .map((target) => target.id)
      .filter((targetId) => typeof targetId === 'string'),
  );
  const hostClient = new CdpClient(
    WebSocketImplementation,
    oneKeyHost.webSocketDebuggerUrl,
    options,
  );
  await hostClient.connect();
  try {
    const result = await hostClient.evaluate(`(() => {
      const button = document.querySelector('[data-testid="custom-injected-e2e-reset"]');
      if (!button) return { clicked: false, reason: 'Clean E2E reset control was not found' };
      if (button.disabled) return { clicked: false, reason: 'Clean E2E reset control is disabled' };
      button.click();
      return { clicked: true };
    })()`);
    if (!result?.clicked) throw new Error(result?.reason || 'Unable to reset DApp Browser');
  } finally {
    hostClient.close();
  }

  await wait(500);
  const deadline = Date.now() + 20_000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const refreshedTargets = await fetchTargets(endpoint, fetchImplementation, options);
      const webview = findFreshOneKeyWebviewTarget(refreshedTargets, site, previousTargetIds);
      if (!webview) {
        throw new Error('Fresh private-session WebView target is not ready');
      }
      const client = new CdpClient(WebSocketImplementation, webview.webSocketDebuggerUrl, options);
      await client.connect();
      return { client, targetId: webview.id, freshWebView: true };
    } catch (error) {
      if (options.signal?.aborted) throw error;
      lastError = error;
      await wait(250);
    }
  }
  throw new Error(
    `Fresh private-session OneKey Desktop webview did not become available: ${lastError?.message}`,
  );
}

async function resolveActionTarget(
  client,
  action,
  deadline = Date.now() + action.timeoutMs,
  clickToken = '',
) {
  let lastResult;
  while (Date.now() < deadline) {
    const result = await evaluateWithNavigationRetry(
      client,
      desktopE2EResolveLocatorExpression(
        {
          locators: action.locators,
          ...(action.target ? { target: action.target } : {}),
        },
        clickToken,
      ),
      Math.max(100, deadline - Date.now()),
    );
    lastResult = result;
    if (result?.unsafe) throw new Error(`${action.description}: ${result.reason} (${result.text})`);
    if (result?.found) return result;
    await wait(250);
  }
  const diagnostic = lastResult?.diagnostics;
  const details = diagnostic
    ? ` (${String(diagnostic.candidateCount)} candidates, best=${String(
        diagnostic.bestScore,
      )}, second=${String(diagnostic.secondScore)}, margin=${String(diagnostic.margin)})`
    : '';
  throw new Error(`${action.description}: no confident visible target resolved${details}`);
}

async function dispatchAction(client, action) {
  if (action.waitBeforeMs) await wait(action.waitBeforeMs);
  const deadline = Date.now() + action.timeoutMs;
  let indicatorFound = false;
  if (action.action === 'click') {
    for (let attempt = 1; attempt <= MAX_CLICK_ATTEMPTS; attempt += 1) {
      await resolveActionTarget(client, action, deadline);
      const indicator = await dismissCustomInjectionIndicator(client);
      indicatorFound ||= indicator.found;
      const target = await resolveActionTarget(client, action, deadline);
      await client.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: target.x,
        y: target.y,
      });
      await wait(CLICK_STABILITY_DELAY_MS);
      const clickToken = `click-${Date.now()}-${attempt}`;
      const confirmedTarget = await resolveActionTarget(client, action, deadline, clickToken);
      if (!desktopE2EClickTargetIsStable(target, confirmedTarget)) {
        await client.evaluate(desktopE2EClickReceiptExpression(clickToken));
        if (attempt < MAX_CLICK_ATTEMPTS) await wait(CLICK_RETRY_DELAY_MS);
        continue;
      }
      await client.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: confirmedTarget.x,
        y: confirmedTarget.y,
        button: 'left',
        clickCount: 1,
      });
      await client.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: confirmedTarget.x,
        y: confirmedTarget.y,
        button: 'left',
        clickCount: 1,
      });
      const receipt = await client.evaluate(desktopE2EClickReceiptExpression(clickToken));
      if (!receipt?.received) {
        if (attempt < MAX_CLICK_ATTEMPTS) await wait(CLICK_RETRY_DELAY_MS);
        continue;
      }
      if (action.waitAfterMs) await wait(action.waitAfterMs);
      return { target: confirmedTarget, attempts: attempt, indicatorFound };
    }
    throw new Error(
      `${action.description}: click target did not remain stable after ${MAX_CLICK_ATTEMPTS} attempts`,
    );
  } else {
    await resolveActionTarget(client, action, deadline);
    const indicator = await dismissCustomInjectionIndicator(client);
    const target = await resolveActionTarget(client, action, deadline);
    const text = action.key === ' ' ? ' ' : action.key.length === 1 ? action.key : undefined;
    await client.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: action.key,
      ...(text ? { text } : {}),
    });
    await client.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: action.key,
    });
    if (action.waitAfterMs) await wait(action.waitAfterMs);
    return { target, attempts: 1, indicatorFound: indicator.found };
  }
}

async function runPass(client, testCase, icons, passName, targetId, freshWebView) {
  await client.send('Page.enable');
  await waitForDocument(client);
  const indicatorChecks = [await dismissCustomInjectionIndicator(client)];
  const detection = desktopE2EWalletDetectionExpression(icons);
  const executedActions = [];
  let verdict = await evaluateWithNavigationRetry(client, detection);
  for (const [actionIndex, action] of testCase.actions.entries()) {
    if (repositoryWalletWasDetected(verdict)) break;
    let dispatched;
    try {
      dispatched = await dispatchAction(client, action);
    } catch (error) {
      executedActions.push({
        index: actionIndex + 1,
        action: action.action,
        description: action.description,
        status: 'error',
        locatorCandidates: action.locators,
        error: error instanceof Error ? error.message : String(error),
      });
      const runPassError = error instanceof Error ? error : new Error(String(error));
      runPassError.desktopE2EDiagnostic = {
        stage: 'action-dispatch',
        finalUrl: verdict?.url || null,
        customInjectionActive: verdict?.customInjection?.source === 'custom-workspace',
        siteMatches: hostnameMatches(verdict?.url || '', testCase.site),
        repositoryIconDetected: verdict?.repositoryIconDetected === true,
        oneKeyWalletIdDetected: verdict?.oneKeyWalletIdDetected === true,
        walletId: verdict?.walletId || null,
        executedActions,
      };
      throw runPassError;
    }
    indicatorChecks.push({
      found: dispatched.indicatorFound,
      dismissed: true,
      observerInstalled: true,
    });
    const { target } = dispatched;
    executedActions.push({
      index: actionIndex + 1,
      action: action.action,
      description: action.description,
      status: 'success',
      locator: target.locator,
      tag: target.tag,
      text: target.text,
      attempts: dispatched.attempts,
      ...(target.resolution ? { resolution: target.resolution } : {}),
    });
    verdict = await evaluateWithNavigationRetry(client, detection);
  }
  if (!repositoryWalletWasDetected(verdict)) {
    await wait(1_000);
    verdict = await evaluateWithNavigationRetry(client, detection);
  }
  const finalIndicatorCheck = await dismissCustomInjectionIndicator(client);
  indicatorChecks.push(finalIndicatorCheck);
  const indicator = {
    found: indicatorChecks.some((check) => check.found),
    dismissed: finalIndicatorCheck.dismissed,
    observerInstalled: finalIndicatorCheck.observerInstalled,
    checks: indicatorChecks.length,
  };
  const customInjectionActive = verdict?.customInjection?.source === 'custom-workspace';
  const siteMatches = hostnameMatches(verdict?.url || '', testCase.site);
  return {
    name: passName,
    targetId,
    freshWebView: freshWebView === true,
    indicator,
    passed:
      freshWebView === true &&
      repositoryWalletWasDetected(verdict) &&
      customInjectionActive &&
      siteMatches,
    customInjectionActive,
    siteMatches,
    repositoryIconDetected: verdict?.repositoryIconDetected === true,
    oneKeyWalletIdDetected: verdict?.oneKeyWalletIdDetected === true,
    iconKey: verdict?.iconKey || null,
    iconLabel: verdict?.iconLabel || null,
    sourceKind: verdict?.sourceKind || null,
    walletId: verdict?.walletId || null,
    finalUrl: verdict?.url || null,
    executedActions,
  };
}

function normalizeDesktopE2EMaxAttempts(value) {
  if (value === undefined || value === null || value === '') {
    return DESKTOP_E2E_MAX_ATTEMPTS;
  }
  const maximumAttempts = Number(value);
  if (
    !Number.isInteger(maximumAttempts) ||
    maximumAttempts < 1 ||
    maximumAttempts > DESKTOP_E2E_MAX_ATTEMPTS
  ) {
    throw new Error(
      `Desktop E2E maximum attempts must be an integer between 1 and ${String(
        DESKTOP_E2E_MAX_ATTEMPTS,
      )}`,
    );
  }
  return maximumAttempts;
}

export async function runDesktopE2EAttempts(
  runAttempt,
  maximumAttempts = DESKTOP_E2E_MAX_ATTEMPTS,
) {
  const normalizedMaximumAttempts = normalizeDesktopE2EMaxAttempts(maximumAttempts);
  const passes = [];
  for (let attempt = 1; attempt <= normalizedMaximumAttempts; attempt += 1) {
    const pass = await runAttempt(attempt, `clean-session-${String(attempt)}`);
    passes.push(pass);
    if (pass?.passed === true) break;
  }
  return passes;
}

export async function runDesktopRecordingE2E(value, options = {}) {
  const testCase = validateDesktopRecordingE2ECase(value);
  if (options.signal?.aborted) {
    throw options.signal.reason instanceof Error
      ? options.signal.reason
      : new Error('Desktop E2E validation was aborted');
  }
  const maximumAttempts = normalizeDesktopE2EMaxAttempts(
    options.maximumAttempts ?? process.env[DESKTOP_E2E_MAX_ATTEMPTS_ENV],
  );
  const endpoint = normalizeEndpoint(options.endpoint || process.env.ONEKEY_DESKTOP_CDP_ENDPOINT);
  const fetchImplementation = options.fetchImplementation || globalThis.fetch;
  if (typeof fetchImplementation !== 'function') throw new Error('fetch is unavailable');
  const WebSocketImplementation = options.WebSocketImplementation || (await loadWebSocket());
  const icons = options.iconSources || (await loadRepositoryIconSources());
  if (!Array.isArray(icons) || icons.length === 0) {
    throw new Error('Repository icon source list is empty');
  }
  const initialTargets = await fetchTargets(endpoint, fetchImplementation, options);
  const { oneKeyHost } = chooseOneKeyTargets(initialTargets, testCase.site);
  const passes = await runDesktopE2EAttempts(async (_attempt, passName) => {
    let target;
    try {
      if (options.signal?.aborted) {
        throw options.signal.reason instanceof Error
          ? options.signal.reason
          : new Error('Desktop E2E validation was aborted');
      }
      target = await resetToFreshPrivateSessionThroughOneKeyDesktop(
        endpoint,
        fetchImplementation,
        WebSocketImplementation,
        testCase.site,
        options,
      );
      return await runPass(
        target.client,
        testCase,
        icons,
        passName,
        target.targetId,
        target.freshWebView,
      );
    } catch (error) {
      if (options.signal?.aborted) throw error;
      const diagnostic = error?.desktopE2EDiagnostic;
      return {
        name: passName,
        targetId: target?.targetId || null,
        freshWebView: target?.freshWebView === true,
        stage:
          diagnostic?.stage || (target ? 'initialize-validation-page' : 'prepare-fresh-session'),
        passed: false,
        customInjectionActive: diagnostic?.customInjectionActive === true,
        siteMatches: diagnostic?.siteMatches === true,
        repositoryIconDetected: diagnostic?.repositoryIconDetected === true,
        oneKeyWalletIdDetected: diagnostic?.oneKeyWalletIdDetected === true,
        iconKey: null,
        iconLabel: null,
        sourceKind: null,
        walletId: diagnostic?.walletId || null,
        finalUrl: diagnostic?.finalUrl || null,
        executedActions: diagnostic?.executedActions || [],
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      try {
        target?.client.close();
      } catch {
        // A failed cleanup must not prevent the next fresh-session attempt.
      }
    }
  }, maximumAttempts);
  const passed = passes.some((pass) => pass.passed);
  return {
    schemaVersion: 1,
    kind: 'onekey-connect-button-desktop-e2e-result',
    passed,
    verdict: 'deterministic-repository-icon-source',
    source: testCase.source,
    protocolId: testCase.protocolId,
    site: testCase.site,
    recordingSha256: testCase.recordingSha256,
    desktop: {
      hostTargetId: oneKeyHost.id,
      endpoint,
    },
    passes,
  };
}

async function persistDirectE2EFailure(testCase, options, { error, result } = {}) {
  const failureArtifact = options?.failureArtifact;
  if (!failureArtifact) return null;
  try {
    await writeDesktopE2EFailureArtifact(failureArtifact.directory, {
      source: testCase.source,
      slug: failureArtifact.slug,
      phase: 'validation',
      protocolId: testCase.protocolId,
      recordingSha256: testCase.recordingSha256,
      error,
      result,
    });
    return null;
  } catch (failureArtifactError) {
    return failureArtifactError instanceof Error
      ? failureArtifactError.message
      : String(failureArtifactError);
  }
}

export async function runDesktopRecordingE2EAndExit(testCase, options) {
  try {
    const result = await runDesktopRecordingE2E(testCase, options);
    if (!result.passed) {
      const failureArtifactError = await persistDirectE2EFailure(testCase, options, {
        error: new Error('Desktop E2E validation failed'),
        result,
      });
      if (failureArtifactError) result.failureArtifactError = failureArtifactError;
    }
    const stream = result.passed ? process.stdout : process.stderr;
    stream.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.passed) process.exitCode = 4;
    return result;
  } catch (error) {
    const failureArtifactError = await persistDirectE2EFailure(testCase, options, { error });
    process.stderr.write(
      `${JSON.stringify({
        ok: false,
        error: error.message,
        ...(failureArtifactError ? { failureArtifactError } : {}),
      })}\n`,
    );
    process.exitCode = 4;
    return null;
  }
}

export async function runDesktopRecordingE2EModule(moduleUrl, definition, options) {
  const testCase = createDesktopRecordingE2ECase(definition);
  if (process.argv[1] && moduleUrl === pathToFileURL(process.argv[1]).href) {
    const directory = path.dirname(fileURLToPath(moduleUrl));
    await runDesktopRecordingE2EAndExit(testCase, {
      ...options,
      failureArtifact: {
        directory,
        slug: path.basename(directory),
      },
    });
  }
  return testCase;
}
