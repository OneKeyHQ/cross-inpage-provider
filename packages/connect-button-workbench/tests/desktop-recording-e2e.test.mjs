import assert from 'node:assert/strict';
import test from 'node:test';

import { JSDOM } from 'jsdom';

import {
  DESKTOP_E2E_MAX_ATTEMPTS,
  desktopE2EClickReceiptExpression,
  desktopE2EClickTargetIsStable,
  desktopE2EDismissIndicatorExpression,
  desktopE2EResolveLocatorExpression,
  findFreshOneKeyWebviewTarget,
  isDesktopE2EProhibitedActionText,
  isDesktopE2ESensitiveInputType,
  repositoryIconSources,
  runDesktopE2EAttempts,
  validateDesktopRecordingE2ECase,
} from '../src/lib/desktop-recording-e2e.mjs';

function resolveTarget(markup, locators, configureDocument) {
  const dom = new JSDOM(markup, {
    runScripts: 'outside-only',
    url: 'https://app.example.com/',
  });
  dom.window.CSS ||= {};
  dom.window.CSS.escape ||= (value) => String(value);
  for (const element of dom.window.document.querySelectorAll('[data-target]')) {
    element.getBoundingClientRect = () => ({
      bottom: 40,
      height: 30,
      left: 10,
      right: 110,
      top: 10,
      width: 100,
      x: 10,
      y: 10,
    });
  }
  dom.window.document.elementFromPoint = () =>
    dom.window.document.querySelector('[data-target]');
  configureDocument?.(dom.window.document);
  return dom.window.eval(desktopE2EResolveLocatorExpression(locators));
}

test('allows terms acceptance controls without allowing sensitive input or transaction actions', () => {
  assert.equal(isDesktopE2ESensitiveInputType('checkbox'), false);
  assert.equal(isDesktopE2ESensitiveInputType('radio'), false);
  assert.equal(isDesktopE2ESensitiveInputType('password'), true);
  assert.equal(isDesktopE2ESensitiveInputType('text'), true);
  assert.equal(isDesktopE2EProhibitedActionText('Accept Terms of Use'), false);
  assert.equal(isDesktopE2EProhibitedActionText('Confirm Terms of Use'), false);
  assert.equal(
    isDesktopE2EProhibitedActionText('I agree to the Privacy Notice'),
    false,
  );
  assert.equal(isDesktopE2EProhibitedActionText('Sign message'), true);
  assert.equal(isDesktopE2EProhibitedActionText('Approve transaction'), true);
  assert.equal(isDesktopE2EProhibitedActionText('Send 1 ETH'), true);
  assert.equal(isDesktopE2EProhibitedActionText('Confirm transaction'), true);
  assert.equal(isDesktopE2EProhibitedActionText('OneKey'), true);

  assert.equal(
    resolveTarget(
      '<input data-target type="checkbox" aria-label="Accept Terms of Use">',
      [{ kind: 'ariaLabel', value: 'Accept Terms of Use' }],
    ).found,
    true,
  );
  assert.equal(
    resolveTarget(
      '<button data-target aria-label="Accept Terms of Use">Accept Terms of Use</button>',
      [{ kind: 'ariaLabel', value: 'Accept Terms of Use' }],
    ).found,
    true,
  );
  assert.equal(
    resolveTarget('<input data-target type="password" aria-label="Password">', [
      { kind: 'ariaLabel', value: 'Password' },
    ]).unsafe,
    true,
  );
  assert.equal(
    resolveTarget('<button data-target id="sign">Sign message</button>', [
      { kind: 'id', value: 'sign' },
    ]).unsafe,
    true,
  );
});

test('uses an unobscured point when the element center is covered', () => {
  const result = resolveTarget(
    '<button data-target id="connect">Connect Wallet</button><div id="overlay"></div>',
    [{ kind: 'id', value: 'connect' }],
    (document) => {
      const button = document.querySelector('#connect');
      const overlay = document.querySelector('#overlay');
      document.elementFromPoint = (_x, y) => (y >= 20 ? overlay : button);
    },
  );
  assert.equal(result.found, true);
  assert.equal(result.x, 60);
  assert.equal(result.y, 17.5);
});

test('dismisses and suppresses the custom injection indicator without clearing its runtime marker', async () => {
  const dom = new JSDOM('<html><body></body></html>', {
    runScripts: 'outside-only',
    url: 'https://app.example.com/',
  });
  const host = dom.window.document.createElement('div');
  host.id = 'onekey-custom-injection-indicator';
  const shadowRoot = host.attachShadow({ mode: 'open' });
  const dismiss = dom.window.document.createElement('button');
  dismiss.setAttribute(
    'aria-label',
    'Dismiss OneKey custom injection indicator',
  );
  dismiss.addEventListener('click', () => host.remove());
  shadowRoot.append(dismiss);
  dom.window.document.body.append(host);
  Object.defineProperty(dom.window, '__ONEKEY_CUSTOM_INJECTION__', {
    value: { source: 'custom-workspace', buildLabel: 'test' },
  });

  const result = dom.window.eval(desktopE2EDismissIndicatorExpression());
  assert.equal(result.customInjection.source, 'custom-workspace');
  assert.equal(result.customInjection.buildLabel, 'test');
  assert.equal(result.indicatorFound, true);
  assert.equal(result.indicatorDismissed, true);
  assert.equal(result.observerInstalled, true);
  assert.equal(
    dom.window.document.querySelector('#onekey-custom-injection-indicator'),
    null,
  );
  assert.equal(
    dom.window.__ONEKEY_CUSTOM_INJECTION__.source,
    'custom-workspace',
  );

  const remountedHost = dom.window.document.createElement('div');
  remountedHost.id = 'onekey-custom-injection-indicator';
  dom.window.document.body.append(remountedHost);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(
    dom.window.document.querySelector('#onekey-custom-injection-indicator'),
    null,
  );
});

test('requires a click target to remain stable before dispatch', () => {
  const target = {
    found: true,
    locator: { kind: 'css', value: '#connect' },
    tag: 'button',
    text: 'Connect Wallet',
    x: 120,
    y: 80,
  };
  assert.equal(
    desktopE2EClickTargetIsStable(target, { ...target, x: 121.5, y: 78.5 }),
    true,
  );
  assert.equal(
    desktopE2EClickTargetIsStable(target, { ...target, x: 140 }),
    false,
  );
  assert.equal(
    desktopE2EClickTargetIsStable(target, {
      ...target,
      locator: { kind: 'role', value: 'button:Connect Wallet' },
    }),
    false,
  );
});

test('records whether the dispatched click reached the resolved target', () => {
  const dom = new JSDOM(
    '<button data-target id="connect">Connect Wallet</button>',
    {
      runScripts: 'outside-only',
      url: 'https://app.example.com/',
    },
  );
  dom.window.CSS ||= {};
  dom.window.CSS.escape ||= (value) => String(value);
  const button = dom.window.document.querySelector('#connect');
  button.getBoundingClientRect = () => ({
    bottom: 40,
    height: 30,
    left: 10,
    right: 110,
    top: 10,
    width: 100,
    x: 10,
    y: 10,
  });
  dom.window.document.elementFromPoint = () => button;
  const target = dom.window.eval(
    desktopE2EResolveLocatorExpression(
      [{ kind: 'id', value: 'connect' }],
      'click-test',
    ),
  );
  assert.equal(target.found, true);
  button.click();
  assert.equal(
    dom.window.eval(desktopE2EClickReceiptExpression('click-test')).received,
    true,
  );
});

test('selects only a newly remounted matching WebView target', () => {
  const oldTarget = {
    id: 'old-target',
    type: 'webview',
    url: 'https://app.example.com/swap',
    webSocketDebuggerUrl: 'ws://127.0.0.1/old',
  };
  const freshTarget = {
    id: 'fresh-target',
    type: 'webview',
    url: 'https://app.example.com/swap',
    webSocketDebuggerUrl: 'ws://127.0.0.1/fresh',
  };
  assert.equal(
    findFreshOneKeyWebviewTarget(
      [oldTarget],
      'app.example.com',
      new Set(['old-target']),
    ),
    undefined,
  );
  assert.equal(
    findFreshOneKeyWebviewTarget(
      [
        oldTarget,
        {
          id: 'wrong-site',
          type: 'webview',
          url: 'https://other.example/',
          webSocketDebuggerUrl: 'ws://127.0.0.1/wrong',
        },
        freshTarget,
      ],
      'app.example.com',
      new Set(['old-target']),
    ),
    freshTarget,
  );
});

test('retries failed clean sessions and stops immediately after the first success', async () => {
  const attempts = [];
  const passes = await runDesktopE2EAttempts(async (attempt, name) => {
    attempts.push(attempt);
    return { name, passed: attempt === 3 };
  });

  assert.deepEqual(attempts, [1, 2, 3]);
  assert.deepEqual(
    passes.map(({ name, passed }) => ({ name, passed })),
    [
      { name: 'clean-session-1', passed: false },
      { name: 'clean-session-2', passed: false },
      { name: 'clean-session-3', passed: true },
    ],
  );
});

test('stops after five failed clean-session attempts', async () => {
  let attempts = 0;
  const passes = await runDesktopE2EAttempts(async (_attempt, name) => {
    attempts += 1;
    return { name, passed: false };
  });

  assert.equal(attempts, DESKTOP_E2E_MAX_ATTEMPTS);
  assert.equal(passes.length, DESKTOP_E2E_MAX_ATTEMPTS);
  assert.equal(passes.at(-1).name, 'clean-session-5');
});

function validCase() {
  return {
    schemaVersion: 1,
    kind: 'onekey-connect-button-desktop-e2e',
    source: 'defillama',
    protocolId: 'protocol-1',
    site: 'app.example.com',
    startUrl: 'https://app.example.com/swap',
    recordingSha256: 'a'.repeat(64),
    actions: [
      {
        action: 'click',
        description: 'Open wallet modal',
        locators: [
          {
            kind: 'role',
            value: 'button:Connect Wallet',
            role: 'button',
            name: 'Connect Wallet',
          },
        ],
      },
    ],
  };
}

test('validates a bounded self-contained generated Desktop E2E case', () => {
  const result = validateDesktopRecordingE2ECase(validCase());
  assert.equal(result.actions[0].timeoutMs, 10_000);
  assert.equal(result.actions[0].waitAfterMs, 750);
  assert.deepEqual(result.actions[0].locators[0], {
    kind: 'role',
    value: 'button:Connect Wallet',
    role: 'button',
    name: 'Connect Wallet',
  });
});

test('rejects non-loop-equivalent URLs and value-bearing actions', () => {
  assert.throws(
    () =>
      validateDesktopRecordingE2ECase({ ...validCase(), source: '../custom' }),
    /normalized DApp source/u,
  );
  assert.throws(
    () =>
      validateDesktopRecordingE2ECase({
        ...validCase(),
        startUrl: 'https://evil.example/',
      }),
    /match site/u,
  );
  assert.throws(
    () =>
      validateDesktopRecordingE2ECase({
        ...validCase(),
        actions: [
          {
            action: 'fill',
            description: 'Enter secret',
            locators: [],
            value: 'secret',
          },
        ],
      }),
    /click or press/u,
  );
});

test('derives exact verdict sources from WALLET_CONNECT_INFO', () => {
  assert.deepEqual(
    repositoryIconSources({
      onekey: {
        text: 'OneKey',
        icon: 'data:image/svg+xml;base64,abc',
        iconUrl: 'https://assets.example/onekey.png',
        autoReviewIconUrls: ['https://assets.example/sprite.svg#onekey'],
      },
    }),
    [
      {
        key: 'onekey',
        label: 'OneKey',
        source: 'data:image/svg+xml;base64,abc',
        sourceKind: 'inline',
      },
      {
        key: 'onekey',
        label: 'OneKey',
        source: 'https://assets.example/onekey.png',
        sourceKind: 'asset',
      },
      {
        key: 'onekey',
        label: 'OneKey',
        source: 'https://assets.example/sprite.svg#onekey',
        sourceKind: 'asset',
      },
    ],
  );
});
