import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_ENDPOINT = 'http://127.0.0.1:9222';
export const DESKTOP_E2E_MAX_ATTEMPTS = 5;
const MAXIMUM_ACTIONS = 100;
const MAXIMUM_ACTION_TIMEOUT_MS = 15_000;
const MAXIMUM_WAIT_AFTER_MS = 5_000;
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
const NON_SENSITIVE_INPUT_TYPES = new Set([
  'button',
  'submit',
  'reset',
  'checkbox',
  'radio',
]);
const PROHIBITED_ACTION_TEXT =
  /^(sign|approve|confirm|send|swap|deposit|withdraw|stake|bridge|buy)(\b|\s)/iu;
const TERMS_ACCEPTANCE_TEXT =
  /^(?:(?:accept|agree|confirm|continue|certify)\b.*\b(?:terms?|privacy|policy|notice)\b|I\b.*\b(?:accept|agree|certify|read)\b.*\b(?:terms?|privacy|policy|notice)\b)/iu;
const ONEKEY_WALLET_TEXT = /^OneKey(?:\s*&.*)?$/iu;
const workbenchDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
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
    throw new Error(
      `${label} must be an integer between ${minimum} and ${maximum}`,
    );
  }
  return value;
}

function normalizeHostname(value) {
  try {
    return new URL(value.includes('://') ? value : `https://${value}`).hostname
      .toLowerCase()
      .replace(/^www\./u, '');
  } catch {
    return '';
  }
}

function hostnameMatches(left, right) {
  const leftHostname = normalizeHostname(left);
  const rightHostname = normalizeHostname(right);
  return Boolean(
    leftHostname &&
    rightHostname &&
    (leftHostname === rightHostname ||
      leftHostname.endsWith(`.${rightHostname}`) ||
      rightHostname.endsWith(`.${leftHostname}`)),
  );
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

function normalizeEndpoint(value) {
  const endpoint = new URL(value || DEFAULT_ENDPOINT);
  if (
    endpoint.protocol !== 'http:' ||
    !['127.0.0.1', 'localhost', '[::1]'].includes(endpoint.hostname)
  ) {
    throw new Error('Desktop CDP endpoint must use loopback HTTP');
  }
  endpoint.pathname = endpoint.pathname.replace(/\/$/u, '');
  endpoint.search = '';
  endpoint.hash = '';
  return endpoint.toString().replace(/\/$/u, '');
}

function normalizeLocator(value, actionIndex, locatorIndex) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(
      `action ${actionIndex} locator ${locatorIndex} must be an object`,
    );
  }
  const kind = boundedString(
    value.kind,
    `action ${actionIndex} locator ${locatorIndex} kind`,
    32,
  );
  if (!ALLOWED_LOCATOR_KINDS.has(kind)) {
    throw new Error(
      `action ${actionIndex} locator ${locatorIndex} kind is unsupported`,
    );
  }
  const locator = {
    kind,
    value: boundedString(
      value.value,
      `action ${actionIndex} locator ${locatorIndex} value`,
      512,
    ),
  };
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

function normalizeAction(value, index) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`action ${index} must be an object`);
  }
  if (value.action !== 'click' && value.action !== 'press') {
    throw new Error(`action ${index} must be click or press`);
  }
  if (
    !Array.isArray(value.locators) ||
    value.locators.length === 0 ||
    value.locators.length > 8
  ) {
    throw new Error(`action ${index} must contain 1-8 locators`);
  }
  const action = {
    action: value.action,
    description: boundedString(
      value.description,
      `action ${index} description`,
      240,
    ),
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
      value.waitAfterMs == null
        ? 750
        : boundedInteger(
            value.waitAfterMs,
            `action ${index} waitAfterMs`,
            0,
            MAXIMUM_WAIT_AFTER_MS,
          ),
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
  if (
    value.schemaVersion !== 1 ||
    value.kind !== 'onekey-connect-button-desktop-e2e'
  ) {
    throw new Error('Unsupported Desktop recording E2E case');
  }
  const source = boundedString(value.source, 'source', 100);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(source)) {
    throw new Error('source must be a normalized DApp source');
  }
  const site = boundedString(value.site, 'site', 255);
  const startUrl = boundedString(value.startUrl, 'startUrl', 2048);
  const parsedStartUrl = new URL(startUrl);
  if (
    !['http:', 'https:'].includes(parsedStartUrl.protocol) ||
    !hostnameMatches(site, startUrl)
  ) {
    throw new Error('startUrl must be HTTP(S) and match site');
  }
  if (
    !Array.isArray(value.actions) ||
    value.actions.length === 0 ||
    value.actions.length > MAXIMUM_ACTIONS
  ) {
    throw new Error(
      `Desktop recording E2E case must contain 1-${MAXIMUM_ACTIONS} actions`,
    );
  }
  const recordingSha256 = boundedString(
    value.recordingSha256,
    'recordingSha256',
    64,
  );
  if (!/^[a-f0-9]{64}$/u.test(recordingSha256)) {
    throw new Error('recordingSha256 must be a lowercase SHA-256 digest');
  }
  return {
    schemaVersion: 1,
    kind: 'onekey-connect-button-desktop-e2e',
    source,
    protocolId: boundedString(value.protocolId, 'protocolId', 160),
    site,
    startUrl,
    recordingSha256,
    actions: value.actions.map(normalizeAction),
  };
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
    module = await import(
      `${pathToFileURL(walletInfoModule).href}?e2e=${Date.now()}`
    );
  } catch (error) {
    throw new Error(
      `Cannot load built WALLET_CONNECT_INFO. Run npm --prefix packages/connect-button-workbench run build:desktop-preload first. ${error.message}`,
    );
  }
  return repositoryIconSources(module.WALLET_CONNECT_INFO);
}

async function loadWebSocket() {
  try {
    const require = createRequire(
      path.join(repositoryDirectory, 'package.json'),
    );
    return require('ws');
  } catch {
    if (typeof globalThis.WebSocket === 'function') return globalThis.WebSocket;
    throw new Error(
      'A WebSocket implementation is unavailable; install repository dependencies',
    );
  }
}

class CdpClient {
  constructor(WebSocketImplementation, url) {
    this.nextId = 1;
    this.pending = new Map();
    this.socket = new WebSocketImplementation(url);
    this.connected = false;
  }

  async connect() {
    if (this.connected) return;
    const onMessage = (event) => {
      const raw = event?.data ?? event;
      const message = JSON.parse(raw.toString());
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    };
    if (typeof this.socket.on === 'function')
      this.socket.on('message', onMessage);
    else this.socket.addEventListener('message', onMessage);
    const onClose = () => {
      const error = new Error('Desktop CDP target closed');
      for (const pending of this.pending.values()) pending.reject(error);
      this.pending.clear();
    };
    if (typeof this.socket.once === 'function')
      this.socket.once('close', onClose);
    else this.socket.addEventListener('close', onClose, { once: true });
    if (this.socket.readyState !== 1) {
      await new Promise((resolve, reject) => {
        if (typeof this.socket.once === 'function') {
          this.socket.once('open', resolve);
          this.socket.once('error', reject);
        } else {
          this.socket.addEventListener('open', resolve, { once: true });
          this.socket.addEventListener('error', reject, { once: true });
        }
      });
    }
    this.connected = true;
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const response = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (response.exceptionDetails) {
      throw new Error(
        response.exceptionDetails.exception?.description ||
          response.exceptionDetails.text ||
          'Runtime evaluation failed',
      );
    }
    return response.result?.value;
  }

  close() {
    this.socket.close();
  }
}

async function fetchTargets(endpoint, fetchImplementation) {
  let response;
  try {
    response = await fetchImplementation(`${endpoint}/json/list`);
  } catch (error) {
    throw new Error(
      `Cannot reach OneKey Desktop CDP at ${endpoint}. Start Desktop with --remote-debugging-port=9222. ${error.message}`,
    );
  }
  if (!response.ok)
    throw new Error(`OneKey Desktop CDP returned HTTP ${response.status}`);
  return response.json();
}

function chooseOneKeyTargets(targets, site) {
  const hostPages = targets.filter((target) => target.type === 'page');
  const oneKeyHost =
    hostPages.find((target) =>
      /onekey/iu.test(`${target.title || ''} ${target.url || ''}`),
    ) ||
    hostPages.find((target) =>
      /localhost|127\.0\.0\.1/iu.test(target.url || ''),
    );
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
    (target) =>
      target.type === 'webview' && hostnameMatches(target.url || '', site),
  );
}

export function findFreshOneKeyWebviewTarget(targets, site, previousTargetIds) {
  const excluded = new Set(previousTargetIds || []);
  return matchingOneKeyWebviews(targets, site)
    .filter(
      (target) =>
        target.webSocketDebuggerUrl &&
        typeof target.id === 'string' &&
        !excluded.has(target.id),
    )
    .at(-1);
}

function detectionExpression(iconSources) {
  return `(() => {
    const icons = ${JSON.stringify(iconSources)};
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
            repositoryIconDetected: true,
            iconKey: icon.key,
            iconLabel: icon.label,
            sourceKind: icon.sourceKind,
            url: location.href,
            customInjection: window.__ONEKEY_CUSTOM_INJECTION__ || null,
          };
        }
      }
    }
    return {
      repositoryIconDetected: false,
      url: location.href,
      customInjection: window.__ONEKEY_CUSTOM_INJECTION__ || null,
    };
  })()`;
}

export function desktopE2EResolveLocatorExpression(locators, clickToken = '') {
  return `(() => {
    const locators = ${JSON.stringify(locators)};
    const clickToken = ${JSON.stringify(clickToken)};
    const nonSensitiveInputTypes = ${JSON.stringify(Array.from(NON_SENSITIVE_INPUT_TYPES))};
    const prohibitedActionText = new RegExp(${JSON.stringify(PROHIBITED_ACTION_TEXT.source)}, 'iu');
    const termsAcceptanceText = new RegExp(${JSON.stringify(TERMS_ACCEPTANCE_TEXT.source)}, 'iu');
    const oneKeyWalletText = new RegExp(${JSON.stringify(ONEKEY_WALLET_TEXT.source)}, 'iu');
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
    for (const locator of locators) {
      const matches = query(locator);
      if (matches.length !== 1) continue;
      const element = matches[0];
      const text = name(element);
      const walletItem = element.closest('[data-wallet-id]');
      const input = element.closest('input');
      const inputType = normalize(input?.getAttribute('type') || 'text').toLowerCase();
      const sensitive = element.closest('textarea,[contenteditable="true"]') ||
        (input && !nonSensitiveInputTypes.includes(inputType));
      const prohibited =
        (prohibitedActionText.test(text) && !termsAcceptanceText.test(text)) ||
        oneKeyWalletText.test(text);
      if (walletItem || sensitive || prohibited) {
        return { found: false, unsafe: true, text, locator, reason: 'Target violates Desktop E2E safety policy' };
      }
      const point = clickablePoint(element);
      if (!point) continue;
      if (clickToken) {
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
      }
      element.focus({ preventScroll: false });
      return {
        found: true,
        locator,
        tag: element.tagName.toLowerCase(),
        text,
        x: point.x,
        y: point.y,
      };
    }
    return { found: false, unsafe: false };
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
    before.locator?.kind === after.locator?.kind &&
    before.locator?.value === after.locator?.value;
  return (
    sameLocator &&
    before.tag === after.tag &&
    before.text === after.text &&
    Math.abs(before.x - after.x) <= tolerancePx &&
    Math.abs(before.y - after.y) <= tolerancePx
  );
}

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));
const MAX_CLICK_ATTEMPTS = 3;
const CLICK_STABILITY_DELAY_MS = 50;
const CLICK_RETRY_DELAY_MS = 100;

function isTransientNavigationContextError(error) {
  return /Cannot find default execution context|Execution context was destroyed/iu.test(
    error?.message || '',
  );
}

async function evaluateWithNavigationRetry(
  client,
  expression,
  timeoutMs = 5_000,
) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      return await client.evaluate(expression);
    } catch (error) {
      if (!isTransientNavigationContextError(error)) throw error;
      lastError = error;
      await wait(100);
    }
  }
  throw (
    lastError ||
    new Error('DApp Browser execution context did not become available')
  );
}

async function waitForDocument(client, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const ready = await evaluateWithNavigationRetry(
      client,
      `({ readyState: document.readyState, url: location.href })`,
      Math.max(100, deadline - Date.now()),
    );
    if (ready?.readyState === 'complete' || ready?.readyState === 'interactive')
      return ready;
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
    const customInjectionActive =
      result?.customInjection?.source === 'custom-workspace';
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
) {
  const targets = await fetchTargets(endpoint, fetchImplementation);
  const { oneKeyHost } = chooseOneKeyTargets(targets, site);
  const previousTargetIds = new Set(
    matchingOneKeyWebviews(targets, site)
      .map((target) => target.id)
      .filter((targetId) => typeof targetId === 'string'),
  );
  const hostClient = new CdpClient(
    WebSocketImplementation,
    oneKeyHost.webSocketDebuggerUrl,
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
    if (!result?.clicked)
      throw new Error(result?.reason || 'Unable to reset DApp Browser');
  } finally {
    hostClient.close();
  }

  await wait(500);
  const deadline = Date.now() + 20_000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const refreshedTargets = await fetchTargets(
        endpoint,
        fetchImplementation,
      );
      const webview = findFreshOneKeyWebviewTarget(
        refreshedTargets,
        site,
        previousTargetIds,
      );
      if (!webview) {
        throw new Error('Fresh private-session WebView target is not ready');
      }
      const client = new CdpClient(
        WebSocketImplementation,
        webview.webSocketDebuggerUrl,
      );
      await client.connect();
      return { client, targetId: webview.id, freshWebView: true };
    } catch (error) {
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
  while (Date.now() < deadline) {
    const result = await evaluateWithNavigationRetry(
      client,
      desktopE2EResolveLocatorExpression(action.locators, clickToken),
      Math.max(100, deadline - Date.now()),
    );
    if (result?.unsafe)
      throw new Error(
        `${action.description}: ${result.reason} (${result.text})`,
      );
    if (result?.found) return result;
    await wait(250);
  }
  throw new Error(`${action.description}: no unique visible locator resolved`);
}

async function dispatchAction(client, action) {
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
      const confirmedTarget = await resolveActionTarget(
        client,
        action,
        deadline,
        clickToken,
      );
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
      const receipt = await client.evaluate(
        desktopE2EClickReceiptExpression(clickToken),
      );
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
    const text =
      action.key === ' '
        ? ' '
        : action.key.length === 1
          ? action.key
          : undefined;
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

async function runPass(
  client,
  testCase,
  icons,
  passName,
  targetId,
  freshWebView,
) {
  await client.send('Page.enable');
  await waitForDocument(client);
  const indicatorChecks = [await dismissCustomInjectionIndicator(client)];
  const detection = detectionExpression(icons);
  const executedActions = [];
  let verdict = await evaluateWithNavigationRetry(client, detection);
  for (const action of testCase.actions) {
    if (verdict?.repositoryIconDetected) break;
    const dispatched = await dispatchAction(client, action);
    indicatorChecks.push({
      found: dispatched.indicatorFound,
      dismissed: true,
      observerInstalled: true,
    });
    const { target } = dispatched;
    executedActions.push({
      action: action.action,
      description: action.description,
      locator: target.locator,
      tag: target.tag,
      text: target.text,
      attempts: dispatched.attempts,
    });
    verdict = await evaluateWithNavigationRetry(client, detection);
  }
  if (!verdict?.repositoryIconDetected) {
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
  const customInjectionActive =
    verdict?.customInjection?.source === 'custom-workspace';
  const siteMatches = hostnameMatches(verdict?.url || '', testCase.site);
  return {
    name: passName,
    targetId,
    freshWebView: freshWebView === true,
    indicator,
    passed:
      freshWebView === true &&
      verdict?.repositoryIconDetected === true &&
      customInjectionActive &&
      siteMatches,
    customInjectionActive,
    siteMatches,
    repositoryIconDetected: verdict?.repositoryIconDetected === true,
    iconKey: verdict?.iconKey || null,
    iconLabel: verdict?.iconLabel || null,
    sourceKind: verdict?.sourceKind || null,
    finalUrl: verdict?.url || null,
    executedActions,
  };
}

export async function runDesktopE2EAttempts(runAttempt) {
  const passes = [];
  for (let attempt = 1; attempt <= DESKTOP_E2E_MAX_ATTEMPTS; attempt += 1) {
    const pass = await runAttempt(attempt, `clean-session-${String(attempt)}`);
    passes.push(pass);
    if (pass?.passed === true) break;
  }
  return passes;
}

export async function runDesktopRecordingE2E(value, options = {}) {
  const testCase = validateDesktopRecordingE2ECase(value);
  const endpoint = normalizeEndpoint(
    options.endpoint || process.env.ONEKEY_DESKTOP_CDP_ENDPOINT,
  );
  const fetchImplementation = options.fetchImplementation || globalThis.fetch;
  if (typeof fetchImplementation !== 'function')
    throw new Error('fetch is unavailable');
  const WebSocketImplementation =
    options.WebSocketImplementation || (await loadWebSocket());
  const icons = options.iconSources || (await loadRepositoryIconSources());
  if (!Array.isArray(icons) || icons.length === 0) {
    throw new Error('Repository icon source list is empty');
  }
  const initialTargets = await fetchTargets(endpoint, fetchImplementation);
  const { oneKeyHost } = chooseOneKeyTargets(initialTargets, testCase.site);
  const passes = await runDesktopE2EAttempts(async (_attempt, passName) => {
    let target;
    try {
      target = await resetToFreshPrivateSessionThroughOneKeyDesktop(
        endpoint,
        fetchImplementation,
        WebSocketImplementation,
        testCase.site,
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
      return {
        name: passName,
        targetId: target?.targetId || null,
        freshWebView: target?.freshWebView === true,
        passed: false,
        repositoryIconDetected: false,
        iconKey: null,
        iconLabel: null,
        sourceKind: null,
        finalUrl: null,
        executedActions: [],
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      try {
        target?.client.close();
      } catch {
        // A failed cleanup must not prevent the next fresh-session attempt.
      }
    }
  });
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

export async function runDesktopRecordingE2EAndExit(testCase, options) {
  try {
    const result = await runDesktopRecordingE2E(testCase, options);
    const stream = result.passed ? process.stdout : process.stderr;
    stream.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.passed) process.exitCode = 4;
    return result;
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify({ ok: false, error: error.message })}\n`,
    );
    process.exitCode = 4;
    return null;
  }
}
