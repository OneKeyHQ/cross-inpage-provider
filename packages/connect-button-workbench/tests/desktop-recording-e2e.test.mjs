import assert from 'node:assert/strict';
import test from 'node:test';

import { JSDOM } from 'jsdom';

import {
  DESKTOP_E2E_MAX_ATTEMPTS,
  createDesktopRecordingE2ECase,
  desktopE2EClickReceiptExpression,
  desktopE2EClickTargetIsStable,
  desktopE2EDismissIndicatorExpression,
  desktopE2EResolveLocatorExpression,
  desktopE2EWalletDetectionExpression,
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
  dom.window.document.elementFromPoint = () => dom.window.document.querySelector('[data-target]');
  configureDocument?.(dom.window.document);
  return dom.window.eval(desktopE2EResolveLocatorExpression(locators));
}

function resolveEnhancedTarget(markup, resolver, configureDocument) {
  const dom = new JSDOM(markup, {
    runScripts: 'outside-only',
    url: 'https://app.example.com/',
  });
  dom.window.CSS ||= {};
  dom.window.CSS.escape ||= (value) => String(value);
  const targets = Array.from(dom.window.document.querySelectorAll('[data-target]'));
  targets.forEach((element, index) => {
    const left = 20 + index * 180;
    element.getBoundingClientRect = () => ({
      bottom: 60,
      height: 40,
      left,
      right: left + 140,
      top: 20,
      width: 140,
      x: left,
      y: 20,
    });
  });
  dom.window.document.elementFromPoint = (x, y) =>
    targets.find((element) => {
      const rect = element.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }) || null;
  configureDocument?.(dom.window.document, dom.window);
  return dom.window.eval(desktopE2EResolveLocatorExpression(resolver));
}

test('allows terms acceptance controls without allowing sensitive input or transaction actions', () => {
  assert.equal(isDesktopE2ESensitiveInputType('checkbox'), false);
  assert.equal(isDesktopE2ESensitiveInputType('radio'), false);
  assert.equal(isDesktopE2ESensitiveInputType('password'), true);
  assert.equal(isDesktopE2ESensitiveInputType('text'), true);
  assert.equal(isDesktopE2EProhibitedActionText('Accept Terms of Use'), false);
  assert.equal(isDesktopE2EProhibitedActionText('Confirm Terms of Use'), false);
  assert.equal(isDesktopE2EProhibitedActionText('I agree to the Privacy Notice'), false);
  assert.equal(isDesktopE2EProhibitedActionText('Sign message'), true);
  assert.equal(isDesktopE2EProhibitedActionText('Approve transaction'), true);
  assert.equal(isDesktopE2EProhibitedActionText('Send 1 ETH'), true);
  assert.equal(isDesktopE2EProhibitedActionText('Confirm transaction'), true);
  assert.equal(isDesktopE2EProhibitedActionText('OneKey'), true);

  assert.equal(
    resolveTarget('<input data-target type="checkbox" aria-label="Accept Terms of Use">', [
      { kind: 'ariaLabel', value: 'Accept Terms of Use' },
    ]).found,
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

test('uses ancestor scope to disambiguate duplicate semantic buttons', () => {
  const result = resolveEnhancedTarget(
    '<section data-testid="header"><button data-target>Connect Wallet</button></section>' +
      '<section data-testid="trade-widget"><button data-target>Connect Wallet</button></section>',
    {
      locators: [
        {
          kind: 'role',
          value: 'button:Connect Wallet',
          role: 'button',
          name: 'Connect Wallet',
          strength: 'semantic',
          uniqueAtRecording: false,
        },
        {
          kind: 'text',
          value: 'Connect Wallet',
          strength: 'semantic',
          uniqueAtRecording: false,
        },
      ],
      target: {
        tag: 'button',
        role: 'button',
        name: 'Connect Wallet',
        scopes: [
          {
            relation: 'ancestor',
            tag: 'section',
            locator: {
              kind: 'testId',
              value: 'trade-widget',
              strength: 'stable',
              uniqueAtRecording: true,
            },
          },
        ],
      },
    },
  );

  assert.equal(result.found, true);
  assert.equal(result.x, 270);
  assert.deepEqual(Array.from(result.resolution.scopes), [0]);
  assert.equal(result.resolution.candidateCount, 2);
});

test('allows accessible-name drift when a stable identity remains unique', () => {
  const result = resolveEnhancedTarget(
    '<button data-target id="connect-wallet">Link wallet</button>',
    {
      locators: [
        {
          kind: 'id',
          value: 'connect-wallet',
          strength: 'stable',
          uniqueAtRecording: true,
        },
      ],
      target: {
        tag: 'button',
        role: 'button',
        name: 'Connect Wallet',
      },
    },
  );

  assert.equal(result.found, true);
  assert.equal(result.text, 'Link wallet');
  assert.deepEqual(Array.from(result.resolution.fingerprint).sort(), ['role', 'tag']);
});

test('fails closed when duplicate candidates remain indistinguishable', () => {
  const result = resolveEnhancedTarget(
    '<button data-target>Connect Wallet</button><button data-target>Connect Wallet</button>',
    {
      locators: [
        {
          kind: 'role',
          value: 'button:Connect Wallet',
          role: 'button',
          name: 'Connect Wallet',
          strength: 'semantic',
          uniqueAtRecording: false,
        },
        {
          kind: 'text',
          value: 'Connect Wallet',
          strength: 'semantic',
          uniqueAtRecording: false,
        },
      ],
      target: { tag: 'button', role: 'button', name: 'Connect Wallet' },
    },
  );

  assert.equal(result.found, false);
  assert.equal(result.ambiguous, true);
  assert.equal(result.diagnostics.candidateCount, 2);
  assert.equal(result.diagnostics.margin, 0);
});

test('uses the recorded shadow-host chain to select the intended component', () => {
  const dom = new JSDOM('<div data-testid="shell-one"></div><div data-testid="shell-two"></div>', {
    runScripts: 'outside-only',
    url: 'https://app.example.com/',
  });
  dom.window.CSS ||= {};
  dom.window.CSS.escape ||= (value) => String(value);
  const hosts = Array.from(dom.window.document.querySelectorAll('div'));
  hosts.forEach((host, index) => {
    const root = host.attachShadow({ mode: 'open' });
    const button = dom.window.document.createElement('button');
    button.textContent = 'Connect Wallet';
    const left = 20 + index * 240;
    button.getBoundingClientRect = () => ({
      bottom: 60,
      height: 40,
      left,
      right: left + 160,
      top: 20,
      width: 160,
      x: left,
      y: 20,
    });
    root.append(button);
    root.elementFromPoint = () => button;
  });
  const result = dom.window.eval(
    desktopE2EResolveLocatorExpression({
      locators: [
        {
          kind: 'role',
          value: 'button:Connect Wallet',
          role: 'button',
          name: 'Connect Wallet',
          strength: 'semantic',
          uniqueAtRecording: false,
        },
      ],
      target: {
        tag: 'button',
        role: 'button',
        name: 'Connect Wallet',
        shadowHosts: [
          {
            tag: 'div',
            locators: [
              {
                kind: 'testId',
                value: 'shell-two',
                strength: 'stable',
                uniqueAtRecording: true,
              },
            ],
          },
        ],
      },
    }),
  );

  assert.equal(result.found, true);
  assert.equal(result.x, 340);
  assert.deepEqual(Array.from(result.resolution.shadowHosts), [0]);
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
  dismiss.setAttribute('aria-label', 'Dismiss OneKey custom injection indicator');
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
  assert.equal(dom.window.document.querySelector('#onekey-custom-injection-indicator'), null);
  assert.equal(dom.window.__ONEKEY_CUSTOM_INJECTION__.source, 'custom-workspace');

  const remountedHost = dom.window.document.createElement('div');
  remountedHost.id = 'onekey-custom-injection-indicator';
  dom.window.document.body.append(remountedHost);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(dom.window.document.querySelector('#onekey-custom-injection-indicator'), null);
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
  assert.equal(desktopE2EClickTargetIsStable(target, { ...target, x: 121.5, y: 78.5 }), true);
  assert.equal(desktopE2EClickTargetIsStable(target, { ...target, x: 140 }), false);
  assert.equal(
    desktopE2EClickTargetIsStable(target, {
      ...target,
      locator: { kind: 'role', value: 'button:Connect Wallet' },
    }),
    false,
  );
});

test('records whether the dispatched click reached the resolved target', () => {
  const dom = new JSDOM('<button data-target id="connect">Connect Wallet</button>', {
    runScripts: 'outside-only',
    url: 'https://app.example.com/',
  });
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
    desktopE2EResolveLocatorExpression([{ kind: 'id', value: 'connect' }], 'click-test'),
  );
  assert.equal(target.found, true);
  button.click();
  assert.equal(dom.window.eval(desktopE2EClickReceiptExpression('click-test')).received, true);
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
    findFreshOneKeyWebviewTarget([oldTarget], 'app.example.com', new Set(['old-target'])),
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

test('supports a lower clean-session attempt limit for generated candidates', async () => {
  let attempts = 0;
  const passes = await runDesktopE2EAttempts(async (_attempt, name) => {
    attempts += 1;
    return { name, passed: false };
  }, 3);

  assert.equal(attempts, 3);
  assert.equal(passes.length, 3);
  assert.equal(passes.at(-1).name, 'clean-session-3');
  assert.equal(DESKTOP_E2E_MAX_ATTEMPTS, 5);
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
  assert.equal(result.actions[0].waitBeforeMs, 2000);
  assert.equal(result.actions[0].waitAfterMs, 2000);
  assert.deepEqual(result.actions[0].locators[0], {
    kind: 'role',
    value: 'button:Connect Wallet',
    role: 'button',
    name: 'Connect Wallet',
  });
});

test('expands one compact readiness marker through the shared definition helper', () => {
  const definition = validCase();
  definition.actions[0].readiness = true;
  const result = createDesktopRecordingE2ECase(definition);

  assert.deepEqual(
    result.actions.map(({ action, key, waitBeforeMs, waitAfterMs }) => ({
      action,
      key,
      waitBeforeMs,
      waitAfterMs,
    })),
    [
      {
        action: 'press',
        key: 'Escape',
        waitBeforeMs: undefined,
        waitAfterMs: 3000,
      },
      {
        action: 'click',
        key: undefined,
        waitBeforeMs: 2000,
        waitAfterMs: 2000,
      },
    ],
  );
  assert.deepEqual(result.actions[0].locators, result.actions[1].locators);
  assert.equal(result.actions[0].timeoutMs, result.actions[1].timeoutMs);
  assert.equal(result.actions[0].description, 'Wait for the connect path to finish initializing');
});

test('requires exactly one click readiness marker in a compact definition', () => {
  assert.throws(
    () => createDesktopRecordingE2ECase(validCase()),
    /mark exactly one click readiness action/u,
  );
  const definition = validCase();
  definition.actions[0] = {
    ...definition.actions[0],
    action: 'press',
    key: 'Escape',
    readiness: true,
  };
  assert.throws(
    () => createDesktopRecordingE2ECase(definition),
    /readiness requires a click action/u,
  );
});

test('rejects non-loop-equivalent URLs and value-bearing actions', () => {
  assert.throws(
    () => validateDesktopRecordingE2ECase({ ...validCase(), source: '../custom' }),
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

test('detects either a repository icon or a OneKey wallet ID', () => {
  const icons = [
    {
      key: 'onekey',
      label: 'OneKey',
      source: 'data:image/svg+xml;base64,repository-onekey-icon',
      sourceKind: 'inline',
    },
  ];
  const detect = (markup) => {
    const dom = new JSDOM(markup, {
      runScripts: 'outside-only',
      url: 'https://app.example.com/',
    });
    return dom.window.eval(desktopE2EWalletDetectionExpression(icons));
  };

  assert.deepEqual(
    {
      repositoryWalletDetected: detect(
        '<img src="data:image/svg+xml;base64,repository-onekey-icon">',
      ).repositoryWalletDetected,
      repositoryIconDetected: detect('<img src="data:image/svg+xml;base64,repository-onekey-icon">')
        .repositoryIconDetected,
    },
    {
      repositoryWalletDetected: true,
      repositoryIconDetected: true,
    },
  );

  const walletIdVerdict = detect('<button data-wallet-id="ethereum-onekey-wallet">OneKey</button>');
  assert.equal(walletIdVerdict.repositoryWalletDetected, true);
  assert.equal(walletIdVerdict.repositoryIconDetected, false);
  assert.equal(walletIdVerdict.oneKeyWalletIdDetected, true);
  assert.equal(walletIdVerdict.walletId, 'ethereum-onekey-wallet');

  const unrelatedVerdict = detect('<button data-wallet-id="ethereum-metamask">MetaMask</button>');
  assert.equal(unrelatedVerdict.repositoryWalletDetected, false);
});
