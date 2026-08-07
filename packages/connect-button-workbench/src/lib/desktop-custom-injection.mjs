import {
  desktopHostnamesMatch,
  fetchDesktopCdpTargets,
  normalizeDesktopCdpEndpoint,
  withOneKeyDesktopHost,
} from './desktop-cdp.mjs';

const SAFE_PROTOCOL_PART = /^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/iu;
const DEFAULT_SELECTION_TIMEOUT_MS = 20_000;

function boundedProtocolPart(value, label) {
  const result = String(value || '').trim();
  if (!result || result.length > 160 || !SAFE_PROTOCOL_PART.test(result)) {
    throw new Error(`${label} must be a bounded protocol identifier`);
  }
  return result;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function workspaceExpression() {
  return `(async () => {
    const session = await globalThis.desktopApiProxy?.webview?.getActiveCustomInjectedWorkspace?.();
    if (!session) return null;
    return {
      sessionId: session.sessionId,
      workspace: session.workspace,
      registrySha256: session.registrySha256,
      bundleSha256: session.bundleSha256,
      protocols: Array.isArray(session.protocols) ? session.protocols.map((protocol, index) => ({
        position: index + 1,
        key: protocol.key,
        source: protocol.source,
        id: protocol.id,
        name: protocol.name,
        slug: protocol.slug,
        url: protocol.url,
      })) : [],
    };
  })()`;
}

function activeProtocolExpression() {
  return `(async () => {
    const visible = (element) => {
      const rect = element?.getBoundingClientRect();
      const style = element ? getComputedStyle(element) : null;
      return Boolean(
        rect && rect.width > 0 && rect.height > 0 && style?.display !== 'none' &&
        style?.visibility !== 'hidden'
      );
    };
    const session = await globalThis.desktopApiProxy?.webview?.getActiveCustomInjectedWorkspace?.();
    if (!session || !Array.isArray(session.protocols)) return null;
    const positions = Array.from(
      document.querySelectorAll('[data-testid="custom-injected-toolbar-position"]')
    ).filter(visible);
    const parsed = positions.map((element) => {
      const match = String(element.textContent || '').match(/([0-9,]+)\\s*\\/\\s*([0-9,]+)/u);
      return match ? {
        position: Number(match[1].replace(/,/g, '')),
        total: Number(match[2].replace(/,/g, '')),
      } : null;
    }).find((value) => value?.total === session.protocols.length);
    const currentItem = Array.from(document.querySelectorAll('[aria-current="true"][data-testid]'))
      .filter(visible)
      .find((element) => String(element.getAttribute('data-testid') || '').startsWith(
        'custom-injected-protocol-'
      ));
    const currentTestId = currentItem?.getAttribute('data-testid') || '';
    const currentFromPicker = currentTestId ? session.protocols.find(
      (candidate) =>
        'custom-injected-protocol-' + candidate.source + '-' + candidate.id === currentTestId
    ) : null;
    const protocol = currentFromPicker || (parsed ? session.protocols[parsed.position - 1] : null);
    const protocolPosition = protocol ? session.protocols.indexOf(protocol) + 1 : null;
    const webview = Array.from(document.querySelectorAll('webview')).filter(visible).at(-1);
    return {
      sessionId: session.sessionId,
      workspace: session.workspace,
      protocol: protocol ? {
        position: protocolPosition,
        key: protocol.key,
        source: protocol.source,
        id: protocol.id,
        name: protocol.name,
        slug: protocol.slug,
        url: protocol.url,
      } : null,
      webviewUrl: webview?.getAttribute('src') || null,
      pickerOpen: Array.from(document.querySelectorAll(
        '[data-testid="nav-header-search-custom-injected-protocol-search"]'
      )).some(visible),
    };
  })()`;
}

export function parseDesktopProtocolPosition(value) {
  const match = String(value || '').match(/^\s*([0-9,]+)\s*\/\s*([0-9,]+)\s*$/u);
  if (!match) return null;
  const position = Number(match[1].replace(/,/gu, ''));
  const total = Number(match[2].replace(/,/gu, ''));
  if (!Number.isInteger(position) || !Number.isInteger(total) || position < 1 || position > total) {
    return null;
  }
  return { position, total };
}

export function resolveDesktopCustomInjectionProtocol(
  protocols,
  { source, protocolId, site },
) {
  const normalizedSource = boundedProtocolPart(source, 'DApp source');
  const normalizedProtocolId = boundedProtocolPart(protocolId, 'DApp protocol ID');
  if (!Array.isArray(protocols) || protocols.length === 0) {
    throw new Error('Desktop custom-injection workspace has no protocols');
  }
  const requestedKey = `${normalizedSource}:${normalizedProtocolId}`;
  const exact = protocols.find((protocol) => protocol?.key === requestedKey);
  if (exact) return { protocol: exact, match: 'exact', requestedKey };

  const hostnameMatches = protocols.filter(
    (protocol) =>
      protocol?.source === normalizedSource && desktopHostnamesMatch(protocol?.url || '', site),
  );
  if (hostnameMatches.length === 1) {
    return { protocol: hostnameMatches[0], match: 'source-hostname', requestedKey };
  }
  if (hostnameMatches.length > 1) {
    throw new Error(
      `Desktop protocol mapping for ${requestedKey} is ambiguous on hostname ${String(site)}`,
    );
  }
  throw new Error(`Desktop protocol ${requestedKey} was not found`);
}

export async function getDesktopCustomInjectionWorkspace(options = {}) {
  return withOneKeyDesktopHost(options, async ({ client, endpoint, host }) => {
    const workspace = await client.evaluate(workspaceExpression());
    if (!workspace) throw new Error('No active custom-injection workspace session was found');
    return { ...workspace, endpoint, hostTargetId: host.id };
  });
}

export async function getActiveDesktopCustomInjectionProtocol(options = {}) {
  return withOneKeyDesktopHost(options, async ({ client, endpoint, host }) => {
    const active = await client.evaluate(activeProtocolExpression());
    if (!active) throw new Error('No active custom-injection workspace session was found');
    return { ...active, endpoint, hostTargetId: host.id };
  });
}

export async function selectDesktopCustomInjectionProtocol(request, options = {}) {
  const timeoutMs = Number(options.timeoutMs ?? DEFAULT_SELECTION_TIMEOUT_MS);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 60_000) {
    throw new Error('Desktop protocol selection timeout must be between 1000 and 60000 ms');
  }
  const endpoint = normalizeDesktopCdpEndpoint(options.endpoint);
  const workspace = await getDesktopCustomInjectionWorkspace({ ...options, endpoint });
  const resolved = resolveDesktopCustomInjectionProtocol(workspace.protocols, request);
  const target = resolved.protocol;
  if (!Number.isInteger(target.position) || target.position < 1) {
    throw new Error(`Desktop protocol ${target.key} has no valid workspace position`);
  }

  await withOneKeyDesktopHost({ ...options, endpoint }, async ({ client }) => {
    const prepared = await client.evaluate(`(async () => {
      const target = ${JSON.stringify({
        key: target.key,
        source: target.source,
        id: target.id,
        position: target.position,
      })};
      const visible = (element) => {
        const rect = element?.getBoundingClientRect();
        const style = element ? getComputedStyle(element) : null;
        return Boolean(
          rect && rect.width > 0 && rect.height > 0 && style?.display !== 'none' &&
          style?.visibility !== 'hidden'
        );
      };
      const pickerButton = Array.from(document.querySelectorAll(
        '[data-testid="custom-injected-protocol-list"]'
      )).find(visible);
      let search = Array.from(document.querySelectorAll(
        '[data-testid="nav-header-search-custom-injected-protocol-search"]'
      )).find(visible);
      if (!search) {
        if (!pickerButton) return { clicked: false, reason: 'Protocol picker button was not found' };
        pickerButton.click();
        await new Promise((resolve) => setTimeout(resolve, 300));
        search = Array.from(document.querySelectorAll(
          '[data-testid="nav-header-search-custom-injected-protocol-search"]'
        )).find(visible);
      }
      if (!search) return { clicked: false, reason: 'Protocol picker search was not found' };
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (!setter) return { clicked: false, reason: 'Protocol picker value setter is unavailable' };
      search.focus();
      setter.call(search, String(target.position));
      search.dispatchEvent(new Event('input', { bubbles: true }));
      search.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 500));
      const testId = 'custom-injected-protocol-' + target.source + '-' + target.id;
      const item = Array.from(document.querySelectorAll('[data-testid]')).find(
        (element) => element.getAttribute('data-testid') === testId && visible(element)
      );
      if (!item) return { ready: false, reason: 'Exact filtered protocol item was not found' };
      return { ready: true, key: target.key, testId };
    })()`);
    if (!prepared?.ready) throw new Error(prepared?.reason || 'Desktop protocol selection failed');
    const clicked = await client.evaluate(`(() => {
      const testId = ${JSON.stringify(
        `custom-injected-protocol-${target.source}-${target.id}`,
      )};
      const item = Array.from(document.querySelectorAll('[data-testid]')).find(
        (element) => element.getAttribute('data-testid') === testId
      );
      if (!item) return false;
      item.click();
      return true;
    })()`);
    if (!clicked) throw new Error('Exact filtered Desktop protocol item could not be clicked');
    await wait(500);
  });

  const deadline = Date.now() + timeoutMs;
  let active;
  let matchingWebview;
  while (Date.now() < deadline) {
    active = await getActiveDesktopCustomInjectionProtocol({ ...options, endpoint });
    const targets = await fetchDesktopCdpTargets(endpoint, options.fetchImplementation, options);
    matchingWebview = targets
      .filter(
        (candidate) =>
          candidate.type === 'webview' &&
          candidate.webSocketDebuggerUrl &&
          desktopHostnamesMatch(candidate.url || '', target.url),
      )
      .at(-1);
    if (active.protocol?.key === target.key && matchingWebview) break;
    await wait(250);
  }
  if (active?.protocol?.key !== target.key || !matchingWebview) {
    throw new Error(
      `OneKey Desktop did not activate ${target.key} within ${String(timeoutMs)} ms`,
    );
  }
  return {
    schemaVersion: 1,
    kind: 'onekey-desktop-custom-injection-selection',
    endpoint,
    sessionId: workspace.sessionId,
    workspace: workspace.workspace,
    requestedKey: resolved.requestedKey,
    selectedKey: target.key,
    match: resolved.match,
    protocol: active.protocol,
    webviewTargetId: matchingWebview.id,
    webviewUrl: matchingWebview.url,
  };
}
