export type ICustomInjectionRecordingSelector = Readonly<{
  kind: 'testId' | 'dataTest' | 'dataCy' | 'id' | 'ariaLabel' | 'role' | 'text' | 'css';
  value: string;
  unique: boolean;
  matchCount: number;
  visibleMatchCount: number;
  strength: 'stable' | 'anchored' | 'class' | 'semantic' | 'structural';
  role?: string;
  name?: string;
}>;

export type ICustomInjectionRecordingScope = Readonly<{
  relation: 'ancestor';
  tag: string;
  locator: ICustomInjectionRecordingSelector;
}>;

export type ICustomInjectionRecordingShadowHost = Readonly<{
  tag: string;
  selectors: readonly ICustomInjectionRecordingSelector[];
}>;

export type ICustomInjectionRecordingTarget = Readonly<{
  tag: string;
  text: string | null;
  role: string | null;
  ariaLabel: string | null;
  inputType: string | null;
  stableClassTokens: readonly string[];
  scopes: readonly ICustomInjectionRecordingScope[];
  shadowHosts: readonly ICustomInjectionRecordingShadowHost[];
  geometry: Readonly<{
    centerXRatio: number;
    centerYRatio: number;
    widthRatio: number;
    heightRatio: number;
  }> | null;
  selectors: readonly ICustomInjectionRecordingSelector[];
}>;

export type ICustomInjectionRecordingStep = Readonly<{
  action: 'click' | 'press';
  elapsedMs: number;
  pageUrl: string;
  target: ICustomInjectionRecordingTarget;
  key?: string;
}>;

export type ICustomInjectionRecordingCapture = Readonly<{
  schemaVersion: 2;
  kind: 'onekey-connect-button-recording-capture';
  startedAt: string;
  finishedAt: string;
  initialUrl: string;
  finalUrl: string;
  title: string;
  viewport: Readonly<{
    width: number;
    height: number;
    deviceScaleFactor: number;
  }>;
  outcome: Readonly<{
    kind: 'repository-wallet-icon';
    afterStep: number;
  }> | null;
  steps: readonly ICustomInjectionRecordingStep[];
}>;

type IInstallCustomInjectionRecorderOptions = {
  requireTrustedEvents?: boolean;
  maximumSteps?: number;
};

export type ICustomInjectionRecorderController = Readonly<{
  getStepCount: () => number;
  markWalletPickerDetected: () => void;
  start: () => void;
  stop: () => ICustomInjectionRecordingCapture;
}>;

const DEFAULT_MAXIMUM_STEPS = 100;
const MAX_TEXT_LENGTH = 240;
const MAX_SELECTOR_LENGTH = 512;
const MAX_CONTEXT_ANCESTORS = 8;
const MAX_CONTEXT_CLASS_TOKENS = 12;
const MAX_RECORDED_MATCH_COUNT = 10_000;
const MAX_TARGET_SCOPES = 4;
const MAX_SHADOW_HOSTS = 4;
const MAX_SHADOW_HOST_SELECTORS = 4;
const SCOPE_ROLES = new Set(['dialog', 'form', 'main', 'menu', 'navigation', 'region', 'listbox']);
const ALLOWED_PRESS_KEYS = new Set([
  'Enter',
  'Escape',
  'Tab',
  ' ',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]);
const INTERACTIVE_SELECTOR = [
  'button',
  'a',
  'input',
  'select',
  'textarea',
  'label',
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="tab"]',
  '[role="checkbox"]',
].join(',');

function normalizeText(value: unknown): string {
  return String(value || '')
    .replace(/\s+/gu, ' ')
    .trim()
    .slice(0, MAX_TEXT_LENGTH);
}

function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/[^a-zA-Z0-9_-]/gu, (character) => {
    return `\\${character.codePointAt(0)?.toString(16)} `;
  });
}

function attributeSelector(name: string, value: string): string {
  const escaped = value.replace(/\\/gu, '\\\\').replace(/"/gu, '\\"');
  return `[${name}="${escaped}"]`;
}

function queryElements(root: Document | ShadowRoot, selector: string): Element[] {
  try {
    return Array.from(root.querySelectorAll(selector));
  } catch {
    return [];
  }
}

function queryCount(root: Document | ShadowRoot, selector: string): number {
  return queryElements(root, selector).length;
}

function isRendered(element: Element): boolean {
  const view = element.ownerDocument.defaultView;
  const style = view?.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return Boolean(
    style &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      Number(style.opacity || 1) > 0 &&
      style.pointerEvents !== 'none' &&
      rect.width > 0 &&
      rect.height > 0,
  );
}

function selectorStats(matches: readonly Element[]) {
  const matchCount = Math.min(matches.length, MAX_RECORDED_MATCH_COUNT);
  return {
    unique: matchCount === 1,
    matchCount,
    visibleMatchCount: Math.min(matches.filter(isRendered).length, MAX_RECORDED_MATCH_COUNT),
  };
}

function cssSelectorDescriptor(
  root: Document | ShadowRoot,
  value: string,
  strength: ICustomInjectionRecordingSelector['strength'],
): ICustomInjectionRecordingSelector {
  return {
    kind: 'css',
    value,
    strength,
    ...selectorStats(queryElements(root, value)),
  };
}

function implicitRole(element: Element): string | null {
  const explicit = normalizeText(element.getAttribute('role')).toLowerCase();
  if (explicit) return explicit;
  const tag = element.tagName.toLowerCase();
  if (tag === 'button') return 'button';
  if (tag === 'a' && element.hasAttribute('href')) return 'link';
  if (tag === 'dialog') return 'dialog';
  if (tag === 'form') return 'form';
  if (tag === 'main') return 'main';
  if (tag === 'nav') return 'navigation';
  if (tag === 'section' && (element.hasAttribute('aria-label') || element.hasAttribute('title'))) {
    return 'region';
  }
  if (tag === 'select') return 'combobox';
  if (tag === 'textarea') return 'textbox';
  if (tag === 'input') {
    const type = normalizeText(element.getAttribute('type')).toLowerCase();
    if (type === 'checkbox') return 'checkbox';
    if (type === 'radio') return 'radio';
    if (['button', 'submit', 'reset'].includes(type)) return 'button';
    return 'textbox';
  }
  return null;
}

function accessibleName(element: Element): string {
  return normalizeText(
    element.getAttribute('aria-label') ||
      element.getAttribute('title') ||
      (element as HTMLElement).innerText ||
      element.textContent,
  );
}

function isSensitiveElement(element: Element): boolean {
  const editable = element.closest(
    'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]),textarea,[contenteditable="true"]',
  );
  return Boolean(editable);
}

function recordingTarget(event: Event): Element | null {
  const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
  const elements = path.filter((item): item is Element => item instanceof Element);
  const interactive = elements.find((element) => element.matches(INTERACTIVE_SELECTOR));
  const target =
    interactive || elements[0] || (event.target instanceof Element ? event.target : null);
  if (!target || target.closest('#onekey-custom-injection-indicator')) {
    return null;
  }
  return target;
}

function structuralSelector(element: Element, root: Document | ShadowRoot): string {
  const parts: string[] = [];
  let current: Element | null = element;
  while (current && parts.length < 6) {
    const tag = current.tagName.toLowerCase();
    let part = tag;
    const parent: Element | null = current.parentElement;
    if (parent) {
      const siblings: Element[] = Array.from(parent.children).filter(
        (candidate) => candidate.tagName === current?.tagName,
      );
      if (siblings.length > 1) {
        part += `:nth-of-type(${String(siblings.indexOf(current) + 1)})`;
      }
    }
    parts.unshift(part);
    const selector = parts.join(' > ');
    if (queryCount(root, selector) === 1) return selector;
    current = parent;
  }
  return parts.join(' > ');
}

function stableAttributeSelectors(element: Element): string[] {
  const selectors: string[] = [];
  for (const attribute of ['data-testid', 'data-test', 'data-cy'] as const) {
    const value = normalizeText(element.getAttribute(attribute));
    if (value) selectors.push(attributeSelector(attribute, value));
  }
  const id = normalizeText(element.id);
  if (id) selectors.push(`#${cssEscape(id)}`);
  const ariaLabel = normalizeText(element.getAttribute('aria-label'));
  if (ariaLabel) selectors.push(attributeSelector('aria-label', ariaLabel));
  return selectors;
}

function stableClassTokens(element: Element): string[] {
  return Array.from(element.classList)
    .filter((token) => {
      return (
        token.length >= 2 &&
        token.length <= 40 &&
        /^[a-zA-Z][a-zA-Z0-9_-]*$/u.test(token) &&
        !/^(?:css|sc)-[a-z0-9]{6,}$/iu.test(token) &&
        !/^[a-z]+[a-f0-9]{8,}$/iu.test(token)
      );
    })
    .slice(0, MAX_CONTEXT_CLASS_TOKENS);
}

function classTargetSelectors(element: Element): string[] {
  const tag = element.tagName.toLowerCase();
  const tokens = stableClassTokens(element);
  const selectors = tokens.map((token) => {
    return `${tag}${attributeSelector('class~', token)}`;
  });
  for (let left = 0; left < tokens.length; left += 1) {
    for (let right = left + 1; right < tokens.length; right += 1) {
      const leftToken = tokens[left];
      const rightToken = tokens[right];
      if (!leftToken || !rightToken) continue;
      selectors.push(
        `${tag}${attributeSelector('class~', leftToken)}${attributeSelector('class~', rightToken)}`,
      );
    }
  }
  return selectors;
}

function relativeStructuralSelector(element: Element, ancestor: Element): string {
  const parts: string[] = [];
  let current: Element | null = element;
  while (current && current !== ancestor) {
    const tag = current.tagName.toLowerCase();
    let part = tag;
    const parent: Element | null = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (candidate) => candidate.tagName === current?.tagName,
      );
      if (siblings.length > 1) {
        part += `:nth-of-type(${String(siblings.indexOf(current) + 1)})`;
      }
    }
    parts.unshift(part);
    current = parent;
  }
  return current === ancestor ? parts.join(' > ') : '';
}

function contextualSelectors(
  element: Element,
  root: Document | ShadowRoot,
): ICustomInjectionRecordingSelector[] {
  const result: ICustomInjectionRecordingSelector[] = [];
  const seen = new Set<string>();
  const targetCandidates = [element.tagName.toLowerCase(), ...classTargetSelectors(element)];
  let ancestor = element.parentElement;
  let depth = 0;
  while (ancestor && depth < MAX_CONTEXT_ANCESTORS && result.length < 3) {
    const anchors = stableAttributeSelectors(ancestor);
    const relative = relativeStructuralSelector(element, ancestor);
    for (const anchor of anchors) {
      const candidates = [
        ...targetCandidates.map((target) => `${anchor} ${target}`),
        ...(relative ? [`${anchor} > ${relative}`] : []),
      ];
      for (const candidate of candidates) {
        if (
          candidate.length > MAX_SELECTOR_LENGTH ||
          seen.has(candidate) ||
          queryCount(root, candidate) !== 1
        ) {
          continue;
        }
        seen.add(candidate);
        result.push(cssSelectorDescriptor(root, candidate, 'anchored'));
        if (result.length >= 3) return result;
      }
    }
    ancestor = ancestor.parentElement;
    depth += 1;
  }
  return result;
}

function targetSelectors(element: Element): ICustomInjectionRecordingSelector[] {
  const rootNode = element.getRootNode();
  const root = rootNode instanceof ShadowRoot ? rootNode : document;
  const selectors: ICustomInjectionRecordingSelector[] = [];
  const seen = new Set<string>();
  const add = (selector: ICustomInjectionRecordingSelector) => {
    const key = `${selector.kind}:${selector.value}`;
    if (!selector.value || seen.has(key) || selectors.length >= 8) return;
    seen.add(key);
    selectors.push(selector);
  };

  const stableAttributes = [
    ['data-testid', 'testId'],
    ['data-test', 'dataTest'],
    ['data-cy', 'dataCy'],
  ] as const;
  for (const [attribute, kind] of stableAttributes) {
    const value = normalizeText(element.getAttribute(attribute));
    if (value) {
      const matches = queryElements(root, attributeSelector(attribute, value));
      add({
        kind,
        value,
        strength: 'stable',
        ...selectorStats(matches),
      });
    }
  }

  const id = normalizeText(element.id);
  if (id) {
    const matches = queryElements(root, `#${cssEscape(id)}`);
    add({
      kind: 'id',
      value: id,
      strength: 'stable',
      ...selectorStats(matches),
    });
  }
  const ariaLabel = normalizeText(element.getAttribute('aria-label'));
  if (ariaLabel) {
    const matches = queryElements(root, attributeSelector('aria-label', ariaLabel));
    add({
      kind: 'ariaLabel',
      value: ariaLabel,
      strength: 'semantic',
      ...selectorStats(matches),
    });
  }

  for (const selector of contextualSelectors(element, root)) {
    add(selector);
  }

  for (const selector of classTargetSelectors(element).slice(0, 2)) {
    add(cssSelectorDescriptor(root, selector, 'class'));
  }

  const role = implicitRole(element);
  const name = accessibleName(element);
  if (role && name) {
    const roleMatches = Array.from(
      root.querySelectorAll(`${INTERACTIVE_SELECTOR},[role="${cssEscape(role)}"]`),
    ).filter((candidate) => implicitRole(candidate) === role && accessibleName(candidate) === name);
    add({
      kind: 'role',
      value: `${role}:${name}`,
      role,
      name,
      strength: 'semantic',
      ...selectorStats(roleMatches),
    });
  }
  if (name) {
    const textMatches = Array.from(root.querySelectorAll(INTERACTIVE_SELECTOR)).filter(
      (candidate) => accessibleName(candidate) === name,
    );
    add({
      kind: 'text',
      value: name,
      strength: 'semantic',
      ...selectorStats(textMatches),
    });
  }

  const css = structuralSelector(element, root);
  if (css) {
    add(cssSelectorDescriptor(root, css, 'structural'));
  }
  return selectors;
}

function scopeLocator(
  element: Element,
  root: Document | ShadowRoot,
): ICustomInjectionRecordingSelector | null {
  const stableAttributes = [
    ['data-testid', 'testId'],
    ['data-test', 'dataTest'],
    ['data-cy', 'dataCy'],
  ] as const;
  for (const [attribute, kind] of stableAttributes) {
    const value = normalizeText(element.getAttribute(attribute));
    if (!value) continue;
    return {
      kind,
      value,
      strength: 'stable',
      ...selectorStats(queryElements(root, attributeSelector(attribute, value))),
    };
  }
  const id = normalizeText(element.id);
  if (id) {
    return {
      kind: 'id',
      value: id,
      strength: 'stable',
      ...selectorStats(queryElements(root, `#${cssEscape(id)}`)),
    };
  }
  const ariaLabel = normalizeText(element.getAttribute('aria-label'));
  if (ariaLabel) {
    return {
      kind: 'ariaLabel',
      value: ariaLabel,
      strength: 'semantic',
      ...selectorStats(queryElements(root, attributeSelector('aria-label', ariaLabel))),
    };
  }
  const role = implicitRole(element);
  const name = accessibleName(element);
  if (!role || !name || !SCOPE_ROLES.has(role)) return null;
  const matches = Array.from(root.querySelectorAll('[role],dialog,form,main,nav')).filter(
    (candidate) => implicitRole(candidate) === role && accessibleName(candidate) === name,
  );
  return {
    kind: 'role',
    value: `${role}:${name}`,
    role,
    name,
    strength: 'semantic',
    ...selectorStats(matches),
  };
}

function targetScopes(
  element: Element,
  root: Document | ShadowRoot,
): ICustomInjectionRecordingScope[] {
  const scopes: ICustomInjectionRecordingScope[] = [];
  let ancestor = element.parentElement;
  let depth = 0;
  while (ancestor && depth < MAX_CONTEXT_ANCESTORS && scopes.length < MAX_TARGET_SCOPES) {
    const locator = scopeLocator(ancestor, root);
    if (locator) {
      scopes.push({
        relation: 'ancestor',
        tag: ancestor.tagName.toLowerCase(),
        locator,
      });
    }
    ancestor = ancestor.parentElement;
    depth += 1;
  }
  return scopes;
}

function targetShadowHosts(element: Element): ICustomInjectionRecordingShadowHost[] {
  const hosts: ICustomInjectionRecordingShadowHost[] = [];
  let root: Node = element.getRootNode();
  while (root instanceof ShadowRoot && hosts.length < MAX_SHADOW_HOSTS) {
    const host = root.host;
    hosts.push({
      tag: host.tagName.toLowerCase(),
      selectors: targetSelectors(host).slice(0, MAX_SHADOW_HOST_SELECTORS),
    });
    root = host.getRootNode();
  }
  return hosts;
}

function targetGeometry(element: Element): ICustomInjectionRecordingTarget['geometry'] {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0 || window.innerWidth <= 0 || window.innerHeight <= 0) {
    return null;
  }
  const boundedRatio = (value: number) => Math.max(0, Math.min(1, Number(value.toFixed(6))));
  return {
    centerXRatio: boundedRatio((rect.left + rect.width / 2) / window.innerWidth),
    centerYRatio: boundedRatio((rect.top + rect.height / 2) / window.innerHeight),
    widthRatio: boundedRatio(rect.width / window.innerWidth),
    heightRatio: boundedRatio(rect.height / window.innerHeight),
  };
}

function describeTarget(element: Element): ICustomInjectionRecordingTarget | null {
  const selectors = targetSelectors(element);
  if (selectors.length === 0) return null;
  const text = accessibleName(element);
  const rootNode = element.getRootNode();
  const root = rootNode instanceof ShadowRoot ? rootNode : document;
  const inputType =
    element instanceof HTMLInputElement
      ? normalizeText(element.getAttribute('type') || 'text')
      : '';
  return {
    tag: element.tagName.toLowerCase(),
    text: text || null,
    role: implicitRole(element),
    ariaLabel: normalizeText(element.getAttribute('aria-label')) || null,
    inputType: inputType || null,
    stableClassTokens: stableClassTokens(element).slice(0, 6),
    scopes: targetScopes(element, root),
    shadowHosts: targetShadowHosts(element),
    geometry: targetGeometry(element),
    selectors,
  };
}

export function installCustomInjectionRecorder(
  options: IInstallCustomInjectionRecorderOptions = {},
): ICustomInjectionRecorderController {
  const requireTrustedEvents = options.requireTrustedEvents !== false;
  const maximumSteps = Math.max(
    1,
    Math.min(DEFAULT_MAXIMUM_STEPS, options.maximumSteps || DEFAULT_MAXIMUM_STEPS),
  );
  let startedAtMs = 0;
  let startedAt = '';
  let initialUrl = '';
  let active = false;
  let walletPickerDetectedAfterStep: number | null = null;
  let steps: ICustomInjectionRecordingStep[] = [];

  const record = (action: 'click' | 'press', event: Event, key?: string) => {
    if (
      !active ||
      steps.length >= maximumSteps ||
      (requireTrustedEvents && event.isTrusted !== true)
    ) {
      return;
    }
    const element = recordingTarget(event);
    if (!element || isSensitiveElement(element)) return;
    const target = describeTarget(element);
    if (!target) return;
    steps.push({
      action,
      elapsedMs: Math.max(0, Date.now() - startedAtMs),
      pageUrl: location.href,
      target,
      ...(key ? { key } : {}),
    });
  };

  const onClick = (event: MouseEvent) => {
    if (event.button !== 0) return;
    record('click', event);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (!ALLOWED_PRESS_KEYS.has(event.key) || event.repeat) return;
    record('press', event, event.key);
  };

  return {
    getStepCount: () => steps.length,
    markWalletPickerDetected: () => {
      if (active && steps.length > 0 && walletPickerDetectedAfterStep === null) {
        walletPickerDetectedAfterStep = steps.length;
      }
    },
    start: () => {
      if (active) return;
      active = true;
      steps = [];
      walletPickerDetectedAfterStep = null;
      startedAtMs = Date.now();
      startedAt = new Date(startedAtMs).toISOString();
      initialUrl = location.href;
      window.addEventListener('click', onClick, true);
      window.addEventListener('keydown', onKeyDown, true);
    },
    stop: () => {
      if (!active) {
        throw new Error('Custom injection recorder is not active');
      }
      active = false;
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('keydown', onKeyDown, true);
      return {
        schemaVersion: 2,
        kind: 'onekey-connect-button-recording-capture',
        startedAt,
        finishedAt: new Date().toISOString(),
        initialUrl,
        finalUrl: location.href,
        title: document.title.slice(0, 256),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          deviceScaleFactor: window.devicePixelRatio || 1,
        },
        outcome:
          walletPickerDetectedAfterStep === null
            ? null
            : {
                kind: 'repository-wallet-icon',
                afterStep: walletPickerDetectedAfterStep,
              },
        steps: [...steps],
      };
    },
  };
}
