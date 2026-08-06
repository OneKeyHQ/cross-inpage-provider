#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const DEFAULT_ENDPOINT = 'http://127.0.0.1:9222';

async function isRepository(directory) {
  try {
    const packageJson = JSON.parse(await fs.readFile(path.join(directory, 'package.json'), 'utf8'));
    return packageJson.name === 'cross-inpage-provider';
  } catch {
    return false;
  }
}

async function findRepository() {
  const starts = [
    process.cwd(),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..'),
  ];
  for (const start of starts) {
    let current = path.resolve(start);
    while (current !== path.dirname(current)) {
      if (await isRepository(current)) return current;
      current = path.dirname(current);
    }
  }
  throw new Error('Could not locate the cross-inpage-provider repository');
}

function argumentValue(argv, name) {
  const index = argv.indexOf(name);
  if (index >= 0) {
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`${name} requires a value`);
    }
    return value;
  }
  return argv.find((argument) => argument.startsWith(`${name}=`))?.slice(name.length + 1);
}

function parseArguments(argv) {
  const command = argv[0];
  if (
    ![
      'list',
      'host-inspect',
      'host-click',
      'open-browser',
      'open-site',
      'reload-host',
      'protocols',
      'refresh-protocols',
      'preload',
      'inspect',
      'open-wallet',
      'reload',
      'verify',
    ].includes(command)
  ) {
    throw new Error(
      'Usage: desktop-cdp.mjs <list|host-inspect|host-click|open-browser|open-site|reload-host|protocols|refresh-protocols|preload|inspect|open-wallet|reload|verify> [--site <hostname-or-url>] [--test-id <safe-control>] [--endpoint <url>]',
    );
  }
  const endpoint = argumentValue(argv.slice(1), '--endpoint') || DEFAULT_ENDPOINT;
  const site = argumentValue(argv.slice(1), '--site') || null;
  const testId = argumentValue(argv.slice(1), '--test-id') || null;
  if (command === 'host-click' && !testId) {
    throw new Error('host-click requires --test-id <safe-control>');
  }
  if (
    ![
      'list',
      'host-inspect',
      'host-click',
      'open-browser',
      'reload-host',
      'protocols',
      'refresh-protocols',
    ].includes(command) &&
    !site
  ) {
    throw new Error(`${command} requires --site <hostname-or-url>`);
  }
  return { command, endpoint: endpoint.replace(/\/$/, ''), site, testId };
}

function normalizeHostname(value) {
  if (!value) return null;
  try {
    return new URL(value.includes('://') ? value : `https://${value}`).hostname
      .toLowerCase()
      .replace(/^www\./, '');
  } catch {
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/^www\./, '');
  }
}

async function fetchTargets(endpoint) {
  let response;
  try {
    response = await fetch(`${endpoint}/json/list`);
  } catch (error) {
    throw new Error(
      `Cannot reach OneKey Desktop CDP at ${endpoint}. Start the dev Desktop with --remote-debugging-port=9222. ${error.message}`,
    );
  }
  if (!response.ok) {
    throw new Error(`OneKey Desktop CDP returned HTTP ${response.status}`);
  }
  return response.json();
}

function targetHostname(target) {
  return normalizeHostname(target.url);
}

function chooseWebview(targets, site) {
  const hostname = normalizeHostname(site);
  const matches = targets.filter(
    (target) =>
      target.type === 'webview' &&
      (targetHostname(target) === hostname ||
        targetHostname(target)?.endsWith(`.${hostname}`) ||
        hostname?.endsWith(`.${targetHostname(target)}`)),
  );
  if (matches.length === 0) {
    throw new Error(
      `No DApp Browser webview matches ${site}. Open the protocol URL in OneKey Desktop first.`,
    );
  }
  return matches[matches.length - 1];
}

function chooseHostPage(targets) {
  const pages = targets.filter((target) => target.type === 'page');
  const preferred = pages.find(
    (target) => /localhost|127\.0\.0\.1/.test(target.url) && /OneKey/i.test(target.title || ''),
  );
  return preferred || pages[0] || null;
}

async function loadWebSocket(repo) {
  try {
    const require = createRequire(path.join(repo, 'package.json'));
    return require('ws');
  } catch {
    if (typeof globalThis.WebSocket === 'function') return globalThis.WebSocket;
    throw new Error(
      'A WebSocket implementation is unavailable. Install the repository dependencies first.',
    );
  }
}

class CdpClient {
  constructor(WebSocketImpl, url) {
    this.nextId = 1;
    this.pending = new Map();
    this.socket = new WebSocketImpl(url);
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener?.('open', resolve, { once: true });
      this.socket.addEventListener?.('error', reject, { once: true });
      this.socket.once?.('open', resolve);
      this.socket.once?.('error', reject);
    });
    const onMessage = (event) => {
      const raw = event?.data ?? event;
      const message = JSON.parse(raw.toString());
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(new Error(message.error.message));
      } else {
        pending.resolve(message.result);
      }
    };
    this.socket.addEventListener?.('message', onMessage);
    this.socket.on?.('message', onMessage);
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (result.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.exception?.description ||
          result.exceptionDetails.text ||
          'Runtime evaluation failed',
      );
    }
    return result.result?.value;
  }

  close() {
    this.socket.close();
  }
}

async function withTarget(WebSocketImpl, target, callback) {
  const client = new CdpClient(WebSocketImpl, target.webSocketDebuggerUrl);
  await client.connect();
  try {
    return await callback(client);
  } finally {
    client.close();
  }
}

const inspectExpression = `(() => {
  const normalize = (value) => String(value || '').replace(/\\s+/g, ' ').trim();
  const visible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' &&
      Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
  };
  const describe = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const image = element.matches('img') ? element : element.querySelector('img');
    const walletContainer = element.closest(
      'button,[role="button"],[role="option"],li'
    );
    return {
      tag: element.tagName,
      id: element.id || null,
      text: normalize(element.innerText || element.textContent).slice(0, 180),
      walletLabel: normalize(
        walletContainer?.innerText || walletContainer?.textContent,
      ).slice(0, 180),
      walletId: element.dataset?.walletId || null,
      disabled: Boolean(element.disabled),
      visible: visible(element),
      opacity: style.opacity,
      pointerEvents: style.pointerEvents,
      role: element.getAttribute('role'),
      ariaLabel: element.getAttribute('aria-label'),
      testId: element.getAttribute('data-testid') || element.getAttribute('data-test-id'),
      rect: {
        x: Math.round(rect.x), y: Math.round(rect.y),
        width: Math.round(rect.width), height: Math.round(rect.height),
      },
      image: image ? {
        alt: image.getAttribute('alt'),
        source: (image.currentSrc || image.src || '').slice(0, 240),
      } : null,
      html: element.outerHTML.slice(0, 1200),
    };
  };
  const all = Array.from(document.querySelectorAll(
    'button,[role="button"],[role="option"],[data-wallet-id]'
  ));
  const triggers = all.filter((element) => {
    const text = normalize(element.innerText || element.textContent);
    return visible(element) && /^(connect( wallet)?|connect to (a )?wallet|select wallet)$/i.test(text);
  }).slice(0, 12);
  const walletPattern = /(metamask|walletconnect|coinbase|rabby|phantom|onekey|browser wallet|injected|unisat|xverse|leather|ordinals wallet|okx|oyl|tap wallet)/i;
  const wallets = all.filter((element) => {
    const text = normalize(element.innerText || element.textContent);
    return visible(element) && (element.hasAttribute('data-wallet-id') || walletPattern.test(text));
  }).slice(0, 24);
  const walletIds = Array.from(document.querySelectorAll('[data-wallet-id]'));
  const idCounts = {};
  for (const element of document.querySelectorAll('[id]')) {
    idCounts[element.id] = (idCounts[element.id] || 0) + 1;
  }
  const customMarker = document.querySelector(
    '[data-onekey-injection-source="custom-workspace"],#onekey-custom-injection-indicator'
  );
  return {
    url: location.href,
    title: document.title,
    readyState: document.readyState,
    customInjection: {
      runtime: window.__ONEKEY_CUSTOM_INJECTION__ || null,
      indicator: customMarker ? describe(customMarker) : null,
    },
    triggers: triggers.map(describe),
    wallets: wallets.map(describe),
    replacements: walletIds.slice(0, 24).map(describe),
    duplicateIds: Object.entries(idCounts).filter(([, count]) => count > 1).slice(0, 24),
  };
})()`;

async function inspect(WebSocketImpl, target) {
  return withTarget(WebSocketImpl, target, (client) => client.evaluate(inspectExpression));
}

async function openWallet(WebSocketImpl, target) {
  return withTarget(WebSocketImpl, target, async (client) => {
    const target = await client.evaluate(`(() => {
      const normalize = (value) => String(value || '').replace(/\\s+/g, ' ').trim();
      const visible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' &&
          Number(style.opacity || 1) > 0 && style.pointerEvents !== 'none' &&
          rect.width > 0 && rect.height > 0;
      };
      const exact = /^(connect( wallet)?|connect to (a )?wallet|select wallet)$/i;
      const candidates = Array.from(document.querySelectorAll('button,[role="button"]'))
        .filter((element) => exact.test(normalize(element.innerText || element.textContent)))
        .filter((element) => visible(element) && !element.disabled);
      const button = candidates[candidates.length - 1];
      if (!button) return { found: false, reason: 'No safe visible enabled wallet trigger found' };
      const rect = button.getBoundingClientRect();
      return {
        found: true,
        tag: button.tagName,
        id: button.id || null,
        text: normalize(button.innerText || button.textContent),
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    })()`);
    if (!target.found) return { click: target, page: await client.evaluate(inspectExpression) };
    await client.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: target.x,
      y: target.y,
      button: 'left',
      clickCount: 1,
    });
    await client.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: target.x,
      y: target.y,
      button: 'left',
      clickCount: 1,
    });
    await new Promise((resolve) => setTimeout(resolve, 1800));
    return {
      click: { ...target, clicked: true },
      page: await client.evaluate(inspectExpression),
    };
  });
}

async function preload(WebSocketImpl, targets, site) {
  const host = chooseHostPage(targets);
  if (!host) throw new Error('No OneKey Desktop host page CDP target was found');
  const hostname = normalizeHostname(site);
  return withTarget(WebSocketImpl, host, (client) =>
    client.evaluate(`(() => {
      const hostname = ${JSON.stringify(hostname)};
      const normalizeHost = (value) => {
        try { return new URL(value).hostname.toLowerCase().replace(/^www\\./, ''); }
        catch { return ''; }
      };
      const webviews = Array.from(document.querySelectorAll('webview')).map((webview) => ({
        src: webview.getAttribute('src'),
        preload: webview.getAttribute('preload'),
        partition: webview.getAttribute('partition'),
      }));
      return webviews.find((webview) => {
        const host = normalizeHost(webview.src);
        return host === hostname || host.endsWith('.' + hostname) || hostname.endsWith('.' + host);
      }) || { found: false, webviewCount: webviews.length };
    })()`),
  );
}

const protocolSummaryExpression = `(async () => {
  const session =
    await globalThis.desktopApiProxy?.webview?.getActiveCustomInjectedWorkspace?.();
  if (!session) {
    return { active: false };
  }
  const protocols = Array.isArray(session.protocols) ? session.protocols : [];
  const sortViolations = protocols.slice(1).filter(
    (protocol, index) =>
      Number(protocol.totalTvl || 0) >
      Number(protocols[index]?.totalTvl || 0)
  ).length;
  return {
    active: true,
    sessionId: session.sessionId,
    workspace: session.workspace,
    registrySha256: session.registrySha256,
    bundleSha256: session.bundleSha256,
    protocolCount: protocols.length,
    sortViolations,
    top: protocols.slice(0, 10).map((protocol, index) => ({
      position: index + 1,
      id: protocol.id,
      name: protocol.name,
      totalTvl: protocol.totalTvl,
      url: protocol.url,
      urlSource: protocol.urlSource,
    })),
  };
})()`;

async function protocols(WebSocketImpl, targets) {
  const host = chooseHostPage(targets);
  if (!host) throw new Error('No OneKey Desktop host page CDP target was found');
  return withTarget(WebSocketImpl, host, (client) => client.evaluate(protocolSummaryExpression));
}

async function inspectHost(WebSocketImpl, targets) {
  const host = chooseHostPage(targets);
  if (!host) throw new Error('No OneKey Desktop host page CDP target was found');
  return withTarget(WebSocketImpl, host, (client) =>
    client.evaluate(`(() => {
      const normalize = (value) => String(value || '').replace(/\\s+/g, ' ').trim();
      const visible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' &&
          Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
      };
      return {
        url: location.href,
        title: document.title,
        bodyText: normalize(document.body?.innerText).slice(-3000),
        controls: Array.from(document.querySelectorAll('button,a,input,[role],[data-testid],webview'))
          .filter(visible)
          .map((element) => ({
            tag: element.tagName.toLowerCase(),
            text: normalize(element.innerText || element.textContent).slice(0, 180),
            ariaLabel: element.getAttribute('aria-label'),
            testId: element.getAttribute('data-testid'),
            role: element.getAttribute('role'),
            href: element.getAttribute('href'),
            src: element.getAttribute('src'),
          }))
          .filter((item) => item.text || item.ariaLabel || item.testId || item.href || item.src)
          .slice(0, 160),
      };
    })()`),
  );
}

const safeHostClickTestIds = new Set([
  'custom-injected-previous',
  'custom-injected-next',
  'custom-injected-recording',
  'custom-injected-e2e-validate',
  'explore-index-search',
]);

async function clickHostControl(WebSocketImpl, targets, testId) {
  if (!safeHostClickTestIds.has(testId)) {
    throw new Error(`host-click does not allow ${testId}`);
  }
  const host = chooseHostPage(targets);
  if (!host) throw new Error('No OneKey Desktop host page CDP target was found');
  return withTarget(WebSocketImpl, host, async (client) => {
    const result = await client.evaluate(`(() => {
      const testId = ${JSON.stringify(testId)};
      const button = document.querySelector('[data-testid="' + CSS.escape(testId) + '"]');
      if (!button) return { clicked: false, reason: testId + ' was not found' };
      if (button.disabled) return { clicked: false, reason: testId + ' is disabled' };
      const text = String(button.innerText || button.textContent || '').trim();
      const rect = button.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return { clicked: false, reason: testId + ' is not visible' };
      }
      return {
        clicked: true,
        testId,
        text,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    })()`);
    if (result.clicked) {
      await client.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: result.x,
        y: result.y,
        button: 'left',
        clickCount: 1,
      });
      await client.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: result.x,
        y: result.y,
        button: 'left',
        clickCount: 1,
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return result;
  });
}

async function openBrowser(WebSocketImpl, targets) {
  const host = chooseHostPage(targets);
  if (!host) throw new Error('No OneKey Desktop host page CDP target was found');
  return withTarget(WebSocketImpl, host, async (client) => {
    const sidebar = await client.evaluate(`(() => {
      const button = document.querySelector('[data-testid="discovery"]');
      if (!button) return { clicked: false, reason: 'Browser sidebar item was not found' };
      button.click();
      return { clicked: true, testId: button.getAttribute('data-testid') };
    })()`);
    if (!sidebar.clicked) return { sidebar };
    await new Promise((resolve) => setTimeout(resolve, 500));
    const existingTab = await client.evaluate(`(() => {
      const tab = Array.from(document.querySelectorAll('[data-testid]')).find((element) =>
        /^tab-modal-no-active-item-[0-9a-f-]{36}$/i.test(element.getAttribute('data-testid') || '')
      );
      if (!tab) return { clicked: false };
      tab.click();
      return { clicked: true, testId: tab.getAttribute('data-testid') };
    })()`);
    if (existingTab.clicked) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      return { sidebar, existingTab };
    }
    const newTab = await client.evaluate(`(() => {
      const button = document.querySelector(
        '[data-testid="tab-modal-no-active-item-PlusSmallOutline"], [data-testid="browser-bar-add"]'
      );
      if (!button) return { clicked: false, reason: 'New Browser tab item was not found' };
      button.click();
      return { clicked: true, testId: button.getAttribute('data-testid') };
    })()`);
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return { sidebar, existingTab, newTab };
  });
}

async function openSite(WebSocketImpl, targets, value) {
  const host = chooseHostPage(targets);
  if (!host) throw new Error('No OneKey Desktop host page CDP target was found');
  const url = new URL(value.includes('://') ? value : `https://${value}`);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('open-site only accepts an HTTP or HTTPS URL');
  }
  return withTarget(WebSocketImpl, host, async (client) => {
    const targetUrl = JSON.stringify(url.href);
    const input = await client.evaluate(`(() => {
      const url = ${targetUrl};
      const element = document.querySelector('[data-testid="search-input"]');
      if (!element) return { found: false, reason: 'Browser search input was not found' };
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return { found: false, reason: 'Browser search input is not visible' };
      }
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )?.set;
      if (!valueSetter) {
        return { found: false, reason: 'Browser search input value setter is unavailable' };
      }
      element.focus();
      valueSetter.call(element, url);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return {
        found: true,
        value: element.value,
      };
    })()`);
    if (!input.found) return input;
    await client.send('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 13,
    });
    await client.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 13,
    });
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return { opened: true, url: url.href };
  });
}

async function reloadHost(WebSocketImpl, targets) {
  const host = chooseHostPage(targets);
  if (!host) throw new Error('No OneKey Desktop host page CDP target was found');
  return withTarget(WebSocketImpl, host, async (client) => {
    await client.send('Page.reload', { ignoreCache: true });
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return { reloaded: true, targetId: host.id };
  });
}

async function refreshProtocols(WebSocketImpl, targets) {
  const host = chooseHostPage(targets);
  if (!host) throw new Error('No OneKey Desktop host page CDP target was found');
  return withTarget(WebSocketImpl, host, async (client) => {
    const before = await client.evaluate(protocolSummaryExpression);
    if (!before.active) {
      throw new Error('No active custom-injection workspace session was found');
    }
    const opened = await client.evaluate(`(() => {
      const button = document.querySelector(
        '[data-testid="custom-injected-protocol-list"]'
      );
      if (!button) {
        return {
          clicked: false,
          reason: 'All protocols button was not found',
        };
      }
      button.click();
      return {
        clicked: true,
        text: String(button.innerText || button.textContent || '').trim(),
      };
    })()`);
    if (!opened.clicked) return { opened, before };
    await new Promise((resolve) => setTimeout(resolve, 500));
    const clicked = await client.evaluate(`(() => {
      const button = document.querySelector(
        '[data-testid="custom-injected-refresh-protocols"]'
      );
      if (!button) {
        return {
          clicked: false,
          reason: 'Refresh protocols button was not found',
        };
      }
      button.click();
      return {
        clicked: true,
        text: String(button.innerText || button.textContent || '').trim(),
      };
    })()`);
    if (!clicked.clicked) return { opened, clicked, before };

    const deadline = Date.now() + 60_000;
    let after = before;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      after = await client.evaluate(protocolSummaryExpression);
      if (after.active && after.registrySha256 && after.registrySha256 !== before.registrySha256) {
        return { opened, clicked, before, after };
      }
    }
    return {
      opened,
      clicked,
      before,
      after,
      timedOut: true,
      reason: 'Registry SHA-256 did not change within 60 seconds',
    };
  });
}

async function reload(WebSocketImpl, targets, site, endpoint) {
  const host = chooseHostPage(targets);
  if (!host) throw new Error('No OneKey Desktop host page CDP target was found');
  const result = await withTarget(WebSocketImpl, host, (client) =>
    client.evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button,[role="button"]'));
      const button =
        document.querySelector('[data-testid="custom-injected-reload"]') ||
        buttons.find((element) =>
          /^(reload|reload · new bundle)$/i.test(String(element.innerText || element.textContent || '').trim())
        );
      if (!button) return { clicked: false, reason: 'DApp Browser custom-injection Reload button was not found' };
      button.click();
      return { clicked: true, text: String(button.innerText || button.textContent || '').trim() };
    })()`),
  );
  if (!result.clicked) return result;
  await new Promise((resolve) => setTimeout(resolve, 2500));
  const refreshedTargets = await fetchTargets(endpoint);
  const webview = chooseWebview(refreshedTargets, site);
  return {
    ...result,
    webview: { id: webview.id, title: webview.title, url: webview.url },
  };
}

function verifyPage(page) {
  const replacements = page.replacements || [];
  const walletIds = replacements.map((item) => item.walletId).filter(Boolean);
  const uniqueWalletIds = new Set(walletIds);
  const customInjectionActive =
    page.customInjection?.runtime?.source === 'custom-workspace' &&
    page.customInjection?.indicator?.visible === true;
  const visibleJointReplacements = replacements.filter(
    (item) =>
      item.visible &&
      /^OneKey\s*&\s*/i.test(item.walletLabel || item.text) &&
      (item.image?.source?.startsWith('data:') || /onekey/i.test(item.image?.source || '')),
  );
  const passed =
    customInjectionActive &&
    replacements.length > 0 &&
    walletIds.length === uniqueWalletIds.size &&
    visibleJointReplacements.length > 0;
  return {
    desktopDomCheckPassed: passed,
    verdictScope: 'development DOM check only; not Electron E2E and not registry verification',
    customInjectionActive,
    replacementCount: replacements.length,
    uniqueWalletIds: walletIds.length === uniqueWalletIds.size,
    visibleJointReplacementCount: visibleJointReplacements.length,
    replacements: replacements.map((item) => ({
      tag: item.tag,
      id: item.id,
      text: item.text,
      walletLabel: item.walletLabel,
      walletId: item.walletId,
      disabled: item.disabled,
      visible: item.visible,
      opacity: item.opacity,
      pointerEvents: item.pointerEvents,
      imageSource: item.image?.source || null,
    })),
  };
}

try {
  const args = parseArguments(process.argv.slice(2));
  const repo = await findRepository();
  const WebSocketImpl = await loadWebSocket(repo);
  const targets = await fetchTargets(args.endpoint);
  let result;

  if (args.command === 'list') {
    result = targets
      .filter((target) => ['page', 'webview'].includes(target.type))
      .map((target) => ({
        id: target.id,
        type: target.type,
        title: target.title,
        url: target.url,
      }));
  } else if (args.command === 'host-inspect') {
    result = await inspectHost(WebSocketImpl, targets);
  } else if (args.command === 'host-click') {
    result = await clickHostControl(WebSocketImpl, targets, args.testId);
  } else if (args.command === 'open-browser') {
    result = await openBrowser(WebSocketImpl, targets);
  } else if (args.command === 'open-site') {
    result = await openSite(WebSocketImpl, targets, args.site);
  } else if (args.command === 'reload-host') {
    result = await reloadHost(WebSocketImpl, targets);
  } else if (args.command === 'protocols') {
    result = await protocols(WebSocketImpl, targets);
  } else if (args.command === 'refresh-protocols') {
    result = await refreshProtocols(WebSocketImpl, targets);
  } else if (args.command === 'preload') {
    result = await preload(WebSocketImpl, targets, args.site);
  } else if (args.command === 'reload') {
    result = await reload(WebSocketImpl, targets, args.site, args.endpoint);
  } else {
    const webview = chooseWebview(targets, args.site);
    if (args.command === 'open-wallet') {
      result = await openWallet(WebSocketImpl, webview);
    } else {
      const page = await inspect(WebSocketImpl, webview);
      result = args.command === 'verify' ? verifyPage(page) : page;
    }
  }

  process.stdout.write(`${JSON.stringify({ ok: true, command: args.command, result })}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exitCode = 4;
}
