export type ICustomInjectionRecordingSelector = Readonly<{
  kind: 'testId' | 'dataTest' | 'dataCy' | 'id' | 'ariaLabel' | 'role' | 'text' | 'css';
  value: string;
  unique: boolean;
  role?: string;
  name?: string;
}>;

export type ICustomInjectionRecordingTarget = Readonly<{
  tag: string;
  text: string | null;
  role: string | null;
  ariaLabel: string | null;
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
  schemaVersion: 1;
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

function queryCount(root: Document | ShadowRoot, selector: string): number {
  try {
    return root.querySelectorAll(selector).length;
  } catch {
    return 0;
  }
}

function implicitRole(element: Element): string | null {
  const explicit = normalizeText(element.getAttribute('role')).toLowerCase();
  if (explicit) return explicit;
  const tag = element.tagName.toLowerCase();
  if (tag === 'button') return 'button';
  if (tag === 'a' && element.hasAttribute('href')) return 'link';
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
        result.push({ kind: 'css', value: candidate, unique: true });
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
      add({
        kind,
        value,
        unique: queryCount(root, attributeSelector(attribute, value)) === 1,
      });
    }
  }

  const id = normalizeText(element.id);
  if (id) {
    add({
      kind: 'id',
      value: id,
      unique: queryCount(root, `#${cssEscape(id)}`) === 1,
    });
  }
  const ariaLabel = normalizeText(element.getAttribute('aria-label'));
  if (ariaLabel) {
    add({
      kind: 'ariaLabel',
      value: ariaLabel,
      unique: queryCount(root, attributeSelector('aria-label', ariaLabel)) === 1,
    });
  }

  for (const selector of contextualSelectors(element, root)) {
    add(selector);
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
      unique: roleMatches.length === 1,
    });
  }
  if (name) {
    const textMatches = Array.from(root.querySelectorAll(INTERACTIVE_SELECTOR)).filter(
      (candidate) => accessibleName(candidate) === name,
    );
    add({
      kind: 'text',
      value: name,
      unique: textMatches.length === 1,
    });
  }

  const css = structuralSelector(element, root);
  if (css) {
    add({
      kind: 'css',
      value: css,
      unique: queryCount(root, css) === 1,
    });
  }
  return selectors;
}

function describeTarget(element: Element): ICustomInjectionRecordingTarget | null {
  const selectors = targetSelectors(element);
  if (selectors.length === 0) return null;
  const text = accessibleName(element);
  return {
    tag: element.tagName.toLowerCase(),
    text: text || null,
    role: implicitRole(element),
    ariaLabel: normalizeText(element.getAttribute('aria-label')) || null,
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
        schemaVersion: 1,
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
