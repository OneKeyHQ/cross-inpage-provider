const api = window.electronLab;

const els = Object.fromEntries(
  [
    'passed-count',
    'review-count',
    'failed-count',
    'untested-count',
    'run-selected',
    'run-all',
    'stop-run',
    'queue-progress',
    'refresh-sites',
    'site-search',
    'site-list',
    'events',
    'clear-events',
    'current-status',
    'current-name',
    'current-url',
    'reload-page',
    'capture-page',
    'open-devtools',
    'notice',
    'address-bar',
    'injection-pill',
    'site-view',
    'empty-state',
    'assertion-summary',
    'show-artifact',
    'brand-subtitle',
  ].map((id) => [id, document.getElementById(id)]),
);

const state = {
  catalog: [],
  results: {},
  selectedId: null,
  running: false,
  refreshing: false,
  stopRequested: false,
  injection: null,
  currentRun: null,
  lastArtifact: null,
  providerRequests: [],
  options: {},
  expandedChainGroups: new Set(),
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function addEvent(message, tone = '') {
  const row = document.createElement('div');
  row.className = `event ${tone}`;
  const time = document.createElement('time');
  time.textContent = formatTime();
  const content = document.createElement('span');
  content.textContent = message;
  row.append(time, content);
  els.events.append(row);
  while (els.events.childElementCount > 120) {
    els.events.firstElementChild?.remove();
  }
  els.events.scrollTop = els.events.scrollHeight;
}

function resultBucket(status) {
  if (status === 'passed' || status === 'native') return 'passed';
  if (status === 'failed') return 'failed';
  if (status === 'review' || status === 'blocked') return 'review';
  return 'untested';
}

function effectiveStatus(site, result = state.results[site.id]) {
  if (result?.status) return result.status;
  if (
    site.coverageState === 'claimed' ||
    site.regressionState === 'claimed'
  ) {
    return 'running';
  }
  if (
    ['implemented_verified', 'existing_verified'].includes(
      site.coverageOutcome,
    ) ||
    ['passed', 'repaired'].includes(site.regressionOutcome)
  ) {
    return 'passed';
  }
  if (site.coverageOutcome === 'native_supported') return 'native';
  if (
    ['blocked', 'not_applicable'].includes(site.coverageOutcome) ||
    ['still_blocked', 'still_not_applicable'].includes(
      site.regressionOutcome,
    )
  ) {
    return 'review';
  }
  if (site.regressionOutcome === 'failed') return 'failed';
  return 'idle';
}

function canRun(site) {
  return Boolean(site?.testReady && site.url);
}

function siteSummary(site, result = state.results[site.id]) {
  if (result?.summary) return result.summary;
  if (site.coverageOutcome) {
    return `Registry outcome: ${site.coverageOutcome}`;
  }
  if (site.needsLlm) return 'Waiting for bounded exception handling';
  if (!site.testReady) return 'Waiting for its three-protocol batch implementation';
  return 'Ready to run scripted E2E';
}

function updateSummary() {
  const counts = { passed: 0, review: 0, failed: 0, untested: 0 };
  for (const site of state.catalog) {
    counts[resultBucket(effectiveStatus(site))] += 1;
  }
  els['passed-count'].textContent = counts.passed;
  els['review-count'].textContent = counts.review;
  els['failed-count'].textContent = counts.failed;
  els['untested-count'].textContent = counts.untested;
}

function selectedSite() {
  return state.catalog.find((site) => site.id === state.selectedId) || null;
}

function formatCompactUsdValue(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return `$${Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)}`;
}

function formatCompactUsd(value) {
  const formatted = formatCompactUsdValue(value);
  return formatted ? `${formatted} TVL` : 'TVL unavailable';
}

function groupForSite(site) {
  return site.chainGroup || {
    id: 'other',
    label: 'Other',
    popularityTvl: 0,
    chainCount: 0,
  };
}

function createSiteRow(site) {
  const result = state.results[site.id];
  const row = document.createElement('button');
  row.type = 'button';
  row.className = `site-row ${site.id === state.selectedId ? 'selected' : ''}`;
  row.dataset.siteId = site.id;
  row.setAttribute('role', 'option');
  row.setAttribute('aria-selected', site.id === state.selectedId ? 'true' : 'false');

  const dot = document.createElement('i');
  dot.className = `result-dot ${
    state.currentRun?.id === site.id
      ? 'running'
      : effectiveStatus(site, result)
  }`;
  const copy = document.createElement('span');
  const name = document.createElement('strong');
  name.textContent = site.name;
  const meta = document.createElement('span');
  meta.className = 'site-meta';
  const totalTvl = Number(site.totalTvl || 0);
  const primaryChainTvl = Number(site.primaryChainTvl || 0);
  const displayedTvl = totalTvl > 0 ? totalTvl : primaryChainTvl;
  const formattedTvl = formatCompactUsdValue(displayedTvl);
  const tvlLabel = formattedTvl
    ? `${formattedTvl}${totalTvl > 0 ? ' total TVL' : ' chain TVL'}`
    : 'TVL unavailable';
  const chainLabel = site.primaryChain
    ? `${site.primaryChain} #${site.primaryChainRank}${
        totalTvl > 0 && primaryChainTvl > 0
          ? ` · ${formatCompactUsdValue(primaryChainTvl)} on chain`
          : ''
      }`
    : null;
  meta.textContent = result
    ? `${tvlLabel} · ${result.status} · ${new Date(
        result.updatedAt || result.finishedAt,
      ).toLocaleDateString()}`
    : [
        tvlLabel,
        site.hostname,
        chainLabel,
        site.coverageOutcome || site.coverageState,
        site.category,
      ]
        .filter(Boolean)
        .join(' · ');
  meta.title = [
    totalTvl > 0
      ? `Total TVL: $${totalTvl.toLocaleString('en')}`
      : null,
    site.primaryChain && primaryChainTvl > 0
      ? `${site.primaryChain} TVL: $${primaryChainTvl.toLocaleString(
          'en',
        )} (#${site.primaryChainRank})`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');
  copy.append(name, meta);
  const source = document.createElement('span');
  source.className = 'source-badge';
  source.textContent =
    site.source === 'fixture'
      ? 'DEMO'
      : site.testReady
        ? 'READY'
        : String(site.coverageState || 'pending').toUpperCase();
  row.append(dot, copy, source);
  row.addEventListener('click', () => selectSite(site.id));
  return row;
}

function renderSites() {
  const query = els['site-search'].value.trim().toLowerCase();
  const fragment = document.createDocumentFragment();
  const filtered = state.catalog.filter((site) => {
    if (!query) return true;
    return `${site.name} ${site.slug || ''} ${site.hostname || ''} ${
      site.category || ''
    } ${site.protocolId || ''} ${site.coverageState || ''} ${
      site.coverageOutcome || ''
    } ${(site.rankings || []).map((ranking) => ranking.chain).join(' ')} ${
      groupForSite(site).label
    }`
      .toLowerCase()
      .includes(query);
  });

  const groups = new Map();
  for (const site of filtered) {
    const group = groupForSite(site);
    const entry = groups.get(group.id) || { group, sites: [] };
    entry.sites.push(site);
    groups.set(group.id, entry);
  }
  const orderedGroups = [...groups.values()].sort(
    (left, right) =>
      (right.group.popularityTvl || 0) - (left.group.popularityTvl || 0) ||
      left.group.label.localeCompare(right.group.label),
  );

  for (const { group, sites } of orderedGroups) {
    const expanded = Boolean(query) || state.expandedChainGroups.has(group.id);
    const section = document.createElement('section');
    section.className = 'chain-group';
    section.dataset.chainGroup = group.id;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'chain-group-toggle';
    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    const heading = document.createElement('span');
    const arrow = document.createElement('i');
    arrow.textContent = expanded ? '▾' : '▸';
    const label = document.createElement('strong');
    label.textContent = group.label;
    heading.append(arrow, label);
    const summary = document.createElement('span');
    summary.className = 'chain-group-summary';
    const chainCount =
      group.id === 'evm' && group.chainCount
        ? `${group.chainCount} chains · `
        : '';
    summary.textContent =
      `${chainCount}${sites.length} protocols · ${formatCompactUsd(group.popularityTvl)}`;
    toggle.append(heading, summary);
    toggle.addEventListener('click', () => {
      if (state.expandedChainGroups.has(group.id)) {
        state.expandedChainGroups.delete(group.id);
      } else {
        state.expandedChainGroups.add(group.id);
      }
      renderSites();
    });
    section.append(toggle);
    if (expanded) {
      const rows = document.createElement('div');
      rows.className = 'chain-group-sites';
      for (const site of sites) rows.append(createSiteRow(site));
      section.append(rows);
    }
    fragment.append(section);
  }

  els['site-list'].replaceChildren(fragment);
}

function comparableUrl(value) {
  try {
    const url = new URL(value);
    url.hash = '';
    return url.href.replace(/\/$/, '');
  } catch {
    return String(value || '');
  }
}

function navigateSite(site, { reloadIfSame = false } = {}) {
  if (!site?.url) return false;
  state.injection = null;
  setInjection('pending', 'Injecting…');
  els['site-view'].classList.add('visible');
  els['empty-state'].classList.add('hidden');
  els['address-bar'].textContent = site.url;
  let currentUrl = '';
  try {
    currentUrl = els['site-view'].getURL();
  } catch {
    // The guest webContents is created on the first src assignment.
  }
  if (
    reloadIfSame &&
    webviewReady() &&
    comparableUrl(currentUrl) === comparableUrl(site.url)
  ) {
    els['site-view'].reload();
  } else {
    els['site-view'].src = site.url;
  }
  return true;
}

function previewSite(site) {
  if (!navigateSite(site, { reloadIfSame: true })) {
    els['site-view'].classList.remove('visible');
    els['empty-state'].classList.remove('hidden');
    setInjection('pending', 'Injection idle');
    addEvent(`${site.name} does not have a resolved dapp URL`);
    return;
  }
  addEvent(`Preview ${site.hostname || site.url}`);
}

async function verifyDashboardPreviewNavigation(site) {
  const ready = waitForWebviewEvent('dom-ready', 30000);
  selectSite(site.id);
  await ready;
  const actualUrl = els['site-view'].getURL();
  if (comparableUrl(actualUrl) !== comparableUrl(site.url)) {
    throw new Error(
      `Dashboard preview navigation mismatch: expected ${site.url}, received ${actualUrl}`,
    );
  }
  addEvent('Dashboard row preview navigation passed', 'success');
}

function selectSite(id, { force = false, preview = true } = {}) {
  if (state.running && !force) return;
  state.selectedId = id;
  const site = selectedSite();
  if (!site) return;
  els['current-name'].textContent = site.name;
  els['current-url'].textContent = site.url || 'No resolved dapp URL';
  els['address-bar'].textContent = site.url || 'about:blank';
  const existing = state.results[id];
  els['current-status'].className = `status-dot ${effectiveStatus(site, existing)}`;
  els['assertion-summary'].textContent = siteSummary(site, existing);
  state.lastArtifact = existing?.screenshot || null;
  els['show-artifact'].classList.toggle('hidden', !state.lastArtifact);
  els['run-selected'].disabled = state.running || !canRun(site);
  if (preview) previewSite(site);
  renderSites();
}

function setRunning(running) {
  state.running = running;
  els['run-selected'].disabled = running || !canRun(selectedSite());
  els['run-all'].disabled =
    running || !state.catalog.some((site) => canRun(site));
  els['site-search'].disabled = running;
  els['refresh-sites'].disabled = running || state.refreshing;
  els['stop-run'].classList.toggle('hidden', !running);
}

function renderRegistrySummary(registry) {
  if (!registry) return;
  const { cycle, progress, claimed } = registry;
  els['brand-subtitle'].textContent =
    `Cycle ${cycle.number} · ${cycle.kind} · ${progress.pendingCoverage} pending`;
  const progressText =
    `Registry: ${progress.active} active · ${progress.doneCoverage} covered · ` +
    `${progress.pendingCoverage} pending · ${progress.needsLlm} needs LLM`;
  els.notice.textContent =
    claimed.length > 0
      ? `${progressText}. Claimed: ${claimed
          .map((protocol) => `${protocol.name} (${protocol.id})`)
          .join(', ')}`
      : `${progressText}. No protocol is currently claimed.`;
  els.notice.classList.add('visible');
}

async function refreshSites() {
  if (state.running || state.refreshing) return;
  state.refreshing = true;
  const previousLabel = els['refresh-sites'].textContent;
  els['refresh-sites'].textContent = 'Refreshing…';
  els['refresh-sites'].disabled = true;
  els['site-search'].disabled = true;
  els['queue-progress'].textContent = 'Refreshing…';
  addEvent('Refreshing chains and protocols from DeFiLlama');
  try {
    const selectedId = state.selectedId;
    const refreshed = await api.refreshCatalog();
    state.catalog = refreshed.catalog;
    state.selectedId =
      state.catalog.some((site) => site.id === selectedId)
        ? selectedId
        : state.catalog[0]?.id || null;
    renderSites();
    updateSummary();
    if (state.selectedId) {
      selectSite(state.selectedId, { preview: false });
    } else {
      els['current-name'].textContent = 'Choose a site';
      els['current-url'].textContent = 'No page loaded';
      els['run-selected'].disabled = true;
    }
    renderRegistrySummary(refreshed.registry);
    const stats = refreshed.sync?.stats;
    const filteredChains = stats?.excludedUnsupportedChains || 0;
    els['queue-progress'].textContent = `${state.catalog.length} protocols`;
    addEvent(
      `DeFiLlama catalog rebuilt: ${state.catalog.length} protocols · ` +
        `${refreshed.build?.supportedChains || refreshed.registry?.chains || 0} supported chains · ` +
        `${filteredChains} unsupported chains filtered`,
      'success',
    );
  } catch (error) {
    els['queue-progress'].textContent = 'Refresh failed';
    addEvent(`DeFiLlama refresh failed: ${error.message}`, 'error');
  } finally {
    state.refreshing = false;
    els['refresh-sites'].textContent = previousLabel;
    els['refresh-sites'].disabled = state.running;
    els['site-search'].disabled = state.running;
  }
}

function setInjection(status, message) {
  state.injection = status;
  els['injection-pill'].className = `pill ${status === 'ready' ? 'ready' : status === 'failed' ? 'failed' : 'pending'}`;
  els['injection-pill'].textContent = message;
}

function waitForWebviewEvent(eventName, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      els['site-view'].removeEventListener(eventName, handler);
      reject(new Error(`Timed out waiting for ${eventName}`));
    }, timeoutMs);
    const handler = (event) => {
      clearTimeout(timer);
      els['site-view'].removeEventListener(eventName, handler);
      resolve(event);
    };
    els['site-view'].addEventListener(eventName, handler, { once: true });
  });
}

async function loadSite(site) {
  if (!site.url) {
    throw new Error(
      `Protocol does not have a resolved dapp URL (id=${site.id}, source=${site.source}, requestedId=${state.options?.requestedId || 'none'}, requestedUrl=${state.options?.requestedUrl || 'none'})`,
    );
  }
  const ready = waitForWebviewEvent('dom-ready', 30000);
  navigateSite(site, { reloadIfSame: true });
  await ready;
  await delay(1600);
}

const triggerScript = `
(() => {
  const visible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 2 && rect.height > 2;
  };
  const normalize = (value) => String(value || '').replace(/\\s+/g, ' ').trim();
  const connectPattern = /^(connect(?: (?:a )?wallet)?|select wallet|choose wallet|connect web3|login|log in|launch app)$/i;
  const startedAt = Number(window.__onekeyLabTriggerStartedAt || Date.now());
  window.__onekeyLabTriggerStartedAt = startedAt;
  const candidates = Array.from(document.querySelectorAll('button, [role="button"], a'))
    .filter(visible)
    .filter((element) => !element.hasAttribute('data-onekey-lab-trigger-clicked'))
    .map((element) => ({
      element,
      text: normalize(element.innerText || element.textContent || element.getAttribute('aria-label')),
      walletHintMatched: /(?:connect[-_ ]?wallet|wallet[-_ ]?connect)/i.test(
        [
          element.id,
          element.getAttribute('data-testid'),
          element.getAttribute('data-test'),
          element.getAttribute('data-cy'),
          element.getAttribute('aria-label'),
        ]
          .filter(Boolean)
          .join(' '),
      ),
    }))
    .filter(
      ({ text, walletHintMatched }) =>
        connectPattern.test(text) || walletHintMatched,
    )
    .sort(
      (a, b) =>
        Number(b.walletHintMatched) - Number(a.walletHintMatched) ||
        a.text.length - b.text.length,
    );
  const target =
    candidates.find(({ walletHintMatched }) => walletHintMatched) ||
    (Date.now() - startedAt >= 5000 ? candidates[0] : null);
  if (!target) {
    return {
      clicked: false,
      reason:
        candidates.length > 0
          ? 'Waiting for a stable wallet trigger'
          : 'No deterministic connect trigger found',
    };
  }
  target.element.setAttribute('data-onekey-lab-trigger-clicked', 'true');
  window.__onekeyLabTriggerStartedAt = Date.now();
  target.element.click();
  return {
    clicked: true,
    text: target.text,
    tag: target.element.tagName.toLowerCase(),
    selector: target.element.id
      ? '#' + CSS.escape(target.element.id)
      : ['data-testid', 'data-test', 'data-cy', 'aria-label']
          .map((attribute) => {
            const value = target.element.getAttribute(attribute);
            return value
              ? target.element.tagName.toLowerCase() + '[' + attribute + '="' + CSS.escape(value) + '"]'
              : null;
          })
          .find((selector) => selector && document.querySelectorAll(selector).length === 1) || null,
  };
})()
`;

const inspectScript = `
(async () => {
  const visible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 2 && rect.height > 2;
  };
  const normalize = (value) => String(value || '').replace(/\\s+/g, ' ').trim();
  const summarizeIcon = (value) => {
    const source = String(value || '');
    if (!source) return null;
    if (source.startsWith('data:')) {
      const comma = source.indexOf(',');
      const prefix = source.slice(0, comma > 0 ? comma : 48);
      return prefix + ';length=' + source.length;
    }
    try {
      const url = new URL(source, location.href);
      url.search = '';
      url.hash = '';
      return url.href.slice(0, 300);
    } catch {
      return source.slice(0, 300);
    }
  };
  const iconFingerprint = async (value) => {
    const source = String(value || '');
    if (!source) return null;
    if (source.startsWith('data:')) {
      const bytes = new TextEncoder().encode(source);
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      return 'sha256:' + Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    }
    try {
      const url = new URL(source, location.href);
      url.search = '';
      url.hash = '';
      return url.href.slice(0, 300);
    } catch {
      return source.slice(0, 300);
    }
  };
  const uniqueSelector = (element) => {
    if (!element) return null;
    const escape = (value) => CSS.escape(String(value));
    if (element.id) {
      const selector = '#' + escape(element.id);
      if (document.querySelectorAll(selector).length === 1) return selector;
    }
    for (const attribute of ['data-testid', 'data-test', 'data-cy', 'aria-label']) {
      const value = element.getAttribute(attribute);
      if (!value || value.length > 100) continue;
      const selector = element.tagName.toLowerCase() + '[' + attribute + '="' +
        escape(value) + '"]';
      if (document.querySelectorAll(selector).length === 1) return selector;
    }
    const stableClasses = Array.from(element.classList)
      .filter((value) =>
        value.length > 2 &&
        value.length < 48 &&
        !/[0-9]{3,}/.test(value) &&
        !/^[a-f0-9]{6,}$/i.test(value)
      )
      .slice(0, 2);
    if (stableClasses.length > 0) {
      const selector = element.tagName.toLowerCase() +
        stableClasses.map((value) => '.' + escape(value)).join('');
      if (document.querySelectorAll(selector).length === 1) return selector;
    }
    return null;
  };
  const markerElements = Array.from(document.querySelectorAll('[data-wallet-id]')).filter(visible);
  const allVisible = Array.from(document.querySelectorAll('button, [role="button"], a, div, span'))
    .filter(visible);
  const oneKeyElements = allVisible.filter((element) =>
    /^(onekey|connect onekey)$/i.test(normalize(element.textContent)),
  );
  const injectedTextElements = allVisible.filter((element) =>
    /^onekey\\s*&\\s*(metamask|walletconnect|phantom|solflare|unisat|tronlink|petra|keplr|sui|slush|polkadot|nami|martian|jupiter)/i
      .test(normalize(element.textContent))
  );
  const walletNamePattern = /^(metamask|wallet\\s*connect|phantom|solflare|unisat(?: wallet)?|tronlink|petra(?: wallet)?|keplr(?: mobile| wallet)?|sui(?: wallet)?|slush(?: wallet)?|polkadot(?:\\.js)?|nami(?: wallet)?|martian(?: wallet)?|jupiter(?: extension)?)$/i;
  const walletCandidates = Array.from(document.querySelectorAll('button, [role="button"], a'))
    .filter(visible)
    .map((element) => {
      const text = normalize(element.innerText || element.textContent || element.getAttribute('aria-label'));
      const image = element.querySelector('img');
      return {
        text: text.slice(0, 120),
        tag: element.tagName.toLowerCase(),
        selector: uniqueSelector(element),
        iconSrc: summarizeIcon(image?.currentSrc || image?.src),
        role: element.getAttribute('role'),
        ariaLabel: element.getAttribute('aria-label'),
      };
    })
    .filter(({ text }) => walletNamePattern.test(text))
    .slice(0, 20);
  const actionCandidates = Array.from(document.querySelectorAll('button, [role="button"], a'))
    .filter(visible)
    .map((element) => ({
      text: normalize(
        element.innerText || element.textContent || element.getAttribute('aria-label'),
      ).slice(0, 120),
      tag: element.tagName.toLowerCase(),
      selector: uniqueSelector(element),
    }))
    .filter(({ text }) => text.length > 0)
    .slice(0, 30);
  const modalCandidates = Array.from(
    document.querySelectorAll('dialog, [role="dialog"], [aria-modal="true"], [class*="modal" i], [class*="drawer" i]')
  ).filter(visible);
  const modal = modalCandidates
    .map((element) => ({
      element,
      walletCount: Array.from(element.querySelectorAll('button, [role="button"], a'))
        .filter(visible)
        .filter((candidate) => walletNamePattern.test(normalize(candidate.textContent))).length,
    }))
    .sort((left, right) => right.walletCount - left.walletCount)[0]?.element || null;
  const pageText = String(document.body?.innerText || '').slice(0, 200000);
  const blockedPattern = /(checking your browser|verify you are human|access denied|captcha|cloudflare ray id)/i;
  const markers = await Promise.all(markerElements.slice(0, 8).map(async (element) => {
    const iconSource = element.matches('img') ?
      (element.currentSrc || element.src) :
      (element.querySelector('img')?.currentSrc || element.querySelector('img')?.src);
    return {
      walletId: element.getAttribute('data-wallet-id'),
      text: normalize(element.textContent).slice(0, 120),
      tag: element.tagName.toLowerCase(),
      iconSrc: summarizeIcon(iconSource),
      iconFingerprint: await iconFingerprint(iconSource),
      selector: uniqueSelector(element),
    };
  }));
  return {
    title: document.title,
    url: location.href,
    markerCount: markerElements.length,
    markers,
    oneKeyCount: oneKeyElements.length,
    oneKeyTexts: oneKeyElements.slice(0, 8).map((element) =>
      normalize(element.textContent).slice(0, 120)
    ),
    injectedTextCount: injectedTextElements.length,
    injectedTexts: [...new Set(injectedTextElements.map((element) =>
      normalize(element.textContent).slice(0, 120)
    ))].slice(0, 12),
    walletCandidates,
    actionCandidates,
    modalSelector: uniqueSelector(modal),
    modalWalletCount: modal ?
      Array.from(modal.querySelectorAll('button, [role="button"], a'))
        .filter(visible)
        .filter((candidate) => walletNamePattern.test(normalize(candidate.textContent))).length :
      0,
    blocked: blockedPattern.test(pageText),
  };
})()
`;

const mutationProbeScript = `
(() => {
  for (let index = 0; index < 3; index += 1) {
    const probe = document.createElement('span');
    probe.hidden = true;
    probe.dataset.onekeyLabMutationProbe = String(Date.now() + index);
    document.body.appendChild(probe);
    probe.remove();
  }
  return { mutations: 6 };
})()
`;

function clickMarkerScript(walletId) {
  return `
(() => {
  const walletId = ${JSON.stringify(walletId || null)};
  const marker = walletId
    ? Array.from(document.querySelectorAll('[data-wallet-id]'))
        .find((element) => element.getAttribute('data-wallet-id') === walletId)
    : document.querySelector('[data-wallet-id]');
  if (!marker) return { clicked: false };
  const target = marker.closest('button, [role="button"], a') || marker;
  target.click();
  return {
    clicked: true,
    walletId: marker.getAttribute('data-wallet-id'),
    tag: target.tagName.toLowerCase(),
  };
})()
`;
}

function assertion(id, passed, actual, expected, required = true) {
  return { id, passed: Boolean(passed), actual, expected, required };
}

function classifyResult(
  trigger,
  inspection,
  stableInspection,
  reloadInspection,
  injectionOk,
  site,
  providerRequests,
) {
  const assertions = [
    assertion('injection_ready', injectionOk, injectionOk, true),
  ];
  if (!injectionOk) {
    return {
      status: 'failed',
      summary: 'Hack bundle failed to inject',
      assertions,
    };
  }
  if (inspection.blocked) {
    return {
      status: 'blocked',
      summary: 'Site presented bot protection or access denial',
      assertions: [
        ...assertions,
        assertion('site_accessible', false, 'blocked', 'accessible'),
      ],
    };
  }
  const replacementVisible = inspection.markerCount > 0 || inspection.injectedTextCount > 0;
  assertions.push(
    assertion(
      'replacement_visible',
      replacementVisible,
      {
        markerCount: inspection.markerCount,
        injectedTextCount: inspection.injectedTextCount,
      },
      'at least one visible scripted replacement',
    ),
  );

  if (inspection.markerCount > 0) {
    const walletIds = inspection.markers.map((marker) => marker.walletId).filter(Boolean);
    assertions.push(
      assertion(
        'wallet_ids_unique',
        walletIds.length === new Set(walletIds).size,
        walletIds,
        'unique wallet IDs',
      ),
      assertion(
        'joint_brand_text',
        inspection.markers.every((marker) => /^OneKey\s*&/i.test(marker.text)),
        inspection.markers.map((marker) => marker.text),
        'every marker starts with OneKey &',
      ),
      assertion(
        'joint_brand_icon',
        inspection.markers.every(
          (marker) =>
            /^sha256:[a-f0-9]{64}$/i.test(marker.iconFingerprint || '') ||
            /onekey-asset\.com/i.test(marker.iconFingerprint || ''),
        ),
        inspection.markers.map((marker) => marker.iconFingerprint),
        'normalized OneKey joint-brand icon fingerprint',
      ),
      assertion(
        'mutation_stable',
        stableInspection.markerCount === inspection.markerCount &&
          JSON.stringify(stableInspection.markers.map((marker) => marker.walletId).sort()) ===
            JSON.stringify(walletIds.sort()),
        stableInspection.markerCount,
        inspection.markerCount,
      ),
    );
  } else if (inspection.injectedTextCount > 0) {
    assertions.push(
      assertion(
        'joint_brand_text_unique',
        inspection.injectedTexts.length === new Set(inspection.injectedTexts).size,
        inspection.injectedTexts,
        'unique visible joint-brand text',
      ),
      assertion(
        'mutation_stable',
        stableInspection.injectedTexts.length === inspection.injectedTexts.length,
        stableInspection.injectedTexts,
        inspection.injectedTexts,
      ),
    );
  }

  const caseAssertions = site.caseDefinition?.assertions || [];
  for (const expected of caseAssertions) {
    const matching = inspection.markers.filter(
      (marker) =>
        marker.walletId === expected.walletId &&
        (expected.text == null || marker.text === expected.text) &&
        marker.iconFingerprint === expected.iconFingerprint,
    );
    assertions.push(
      assertion(
        `case:${expected.walletId}`,
        matching.length === expected.count,
        matching.length,
        expected.count,
      ),
    );
  }
  if (site.caseDefinition?.assertReload) {
    const reloadMatches = caseAssertions.every((expected) => {
      const matching = (reloadInspection?.markers || []).filter(
        (marker) =>
          marker.walletId === expected.walletId &&
          marker.text === expected.text &&
          marker.iconFingerprint === expected.iconFingerprint,
      );
      return matching.length === expected.count;
    });
    assertions.push(
      assertion(
        'reload_stable',
        reloadMatches,
        (reloadInspection?.markers || []).map((marker) => ({
          walletId: marker.walletId,
          text: marker.text,
        })),
        caseAssertions,
      ),
    );
  }

  const clickProbe = site.caseDefinition?.clickProbe ||
    (site.source === 'fixture'
      ? {
          expectedScope: 'ethereum',
          expectedMethods: ['eth_requestAccounts'],
        }
      : null);
  if (clickProbe) {
    const routed = providerRequests.some(
      (request) =>
        request.scope === clickProbe.expectedScope &&
        clickProbe.expectedMethods.includes(request.method),
    );
    assertions.push(
      assertion(
        'provider_route',
        routed,
        providerRequests.map((request) => `${request.scope}.${request.method}`),
        `${clickProbe.expectedScope}.${clickProbe.expectedMethods.join('|')}`,
      ),
    );
  }

  const passed = assertions.filter((item) => item.required).every((item) => item.passed);
  if (replacementVisible && passed) {
    return {
      status: 'passed',
      summary: `${assertions.length} scripted assertions passed`,
      assertions,
    };
  }
  if (inspection.oneKeyCount > 0) {
    return {
      status: 'native',
      summary: 'A visible native OneKey entry was found',
      assertions: [
        assertion('injection_ready', injectionOk, injectionOk, true),
        assertion('native_onekey_visible', true, inspection.oneKeyTexts, 'OneKey'),
      ],
    };
  }
  if (!trigger.clicked) {
    return {
      status: 'review',
      summary: trigger.reason,
      assertions,
    };
  }
  return {
    status: 'review',
    summary: `Opened “${trigger.text}”, but no injected or native OneKey entry was visible`,
    assertions,
  };
}

async function captureCurrent(site, quiet = false) {
  try {
    const screenshot = await api.captureWebview({
      webContentsId: els['site-view'].getWebContentsId(),
      id: site.id,
    });
    state.lastArtifact = screenshot;
    els['show-artifact'].classList.remove('hidden');
    if (!quiet) addEvent(`Screenshot saved: ${screenshot}`, 'success');
    return screenshot;
  } catch (error) {
    addEvent(`Screenshot failed: ${error.message}`, 'error');
    return null;
  }
}

async function executeCaseAction(action) {
  const supported = new Set(['click', 'fill', 'waitFor', 'press', 'reload']);
  if (!action || !supported.has(action.action)) {
    throw new Error(`Unsupported case action: ${action?.action || '<missing>'}`);
  }
  if (action.action === 'reload') {
    const ready = waitForWebviewEvent('dom-ready', action.timeoutMs || 30000);
    els['site-view'].reload();
    await ready;
    return { action: 'reload', ok: true };
  }
  const payload = JSON.stringify({
    action: action.action,
    selector: action.selector || null,
    text: action.text || null,
    value: action.value || '',
    key: action.key || '',
  });
  const script = `
  (() => {
    const input = ${payload};
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 2 && rect.height > 2;
    };
    const interactable = (element) => {
      if (!visible(element)) return false;
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return false;
      const top = document.elementFromPoint(x, y);
      return Boolean(
        top &&
          (top === element || element.contains(top) || top.contains(element)),
      );
    };
    const normalize = (value) => String(value || '').replace(/\\s+/g, ' ').trim();
    let target = input.selector ? document.querySelector(input.selector) : null;
    if (target && input.action === 'click' && !interactable(target)) target = null;
    if (!target && input.text) {
      target = Array.from(
        document.querySelectorAll('button, [role="button"], a, input, div, span'),
      )
        .filter(input.action === 'click' ? interactable : visible)
        .find((element) =>
          normalize(element.innerText || element.textContent || element.getAttribute('aria-label')) === input.text
        ) || null;
    }
    if (!target) return { ok: false, reason: 'target_missing' };
    const rect = target.getBoundingClientRect();
    const point = input.action === 'click'
      ? {
          x: Math.round(rect.left + rect.width / 2),
          y: Math.round(rect.top + rect.height / 2),
        }
      : null;
    if (input.action === 'fill') {
      target.focus();
      target.value = input.value;
      target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: input.value }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (input.action === 'press') {
      target.focus();
      target.dispatchEvent(new KeyboardEvent('keydown', { key: input.key, bubbles: true }));
      target.dispatchEvent(new KeyboardEvent('keyup', { key: input.key, bubbles: true }));
    }
    return { ok: true, action: input.action, point };
  })()
  `;
  const deadline = Date.now() + (action.timeoutMs || 10000);
  let result;
  do {
    result = await els['site-view'].executeJavaScript(script, true);
    if (result.ok) break;
    await delay(250);
  } while (Date.now() < deadline);
  if (!result.ok && !action.optional) {
    throw new Error(`Case ${action.action} target not found`);
  }
  if (result.ok && action.action === 'click' && result.point) {
    els['site-view'].focus();
    els['site-view'].sendInputEvent({
      type: 'mouseMove',
      x: result.point.x,
      y: result.point.y,
      movementX: 0,
      movementY: 0,
    });
    els['site-view'].sendInputEvent({
      type: 'mouseDown',
      x: result.point.x,
      y: result.point.y,
      button: 'left',
      clickCount: 1,
    });
    els['site-view'].sendInputEvent({
      type: 'mouseUp',
      x: result.point.x,
      y: result.point.y,
      button: 'left',
      clickCount: 1,
    });
  }
  if (result.ok && (action.delayMs || action.action !== 'waitFor')) {
    await delay(action.delayMs || 450);
  }
  return result;
}

async function openWalletForSite(site) {
  const definition = site.caseDefinition;
  if (!definition) {
    const deadline = Date.now() + 15000;
    let trigger = { clicked: false, reason: 'No deterministic connect trigger found' };
    let clickCount = 0;
    do {
      const candidate = await els['site-view'].executeJavaScript(triggerScript, true);
      if (candidate.clicked) {
        trigger = candidate;
        clickCount += 1;
        await delay(750);
        const inspection = await els['site-view'].executeJavaScript(inspectScript, true);
        if (
          inspection.markerCount > 0 ||
          inspection.oneKeyCount > 0 ||
          inspection.walletCandidates.length > 0 ||
          clickCount >= 3
        ) {
          return trigger;
        }
      }
      await delay(500);
    } while (Date.now() < deadline);
    return trigger;
  }
  for (const action of definition.setup || []) {
    await executeCaseAction(action);
  }
  let last = { clicked: false, reason: 'Case has no openWallet action' };
  for (const action of definition.openWallet || []) {
    const result = await executeCaseAction(action);
    last = {
      clicked: Boolean(result.ok),
      text: action.text || action.selector || action.action,
      tag: action.action,
      reason: result.reason,
    };
  }
  return last;
}

async function runOne(site) {
  const startedAt = new Date().toISOString();
  state.providerRequests = [];
  state.currentRun = { id: site.id };
  state.selectedId = site.id;
  selectSite(site.id, { force: true, preview: false });
  els['current-status'].className = 'status-dot running';
  els['assertion-summary'].textContent = 'Loading and inspecting page…';
  renderSites();
  addEvent(`Start ${site.hostname}`);

  let result;
  try {
    await loadSite(site);
    if (state.stopRequested) throw new Error('Run stopped');

    const trigger = await openWalletForSite(site);
    addEvent(trigger.clicked ? `Clicked “${trigger.text}”` : trigger.reason);
    const inspectionDeadline = Date.now() + (site.source === 'fixture' ? 4200 : 5200);
    let inspection;
    do {
      await delay(600);
      inspection = await els['site-view'].executeJavaScript(inspectScript, true);
      if (inspection.markerCount > 0 || inspection.oneKeyCount > 0 || inspection.blocked) break;
    } while (Date.now() < inspectionDeadline);
    await els['site-view'].executeJavaScript(mutationProbeScript, true);
    await delay(900);
    const stableInspection = await els['site-view'].executeJavaScript(inspectScript, true);

    let clickProbe = { clicked: false };
    if (
      inspection.markerCount > 0 &&
      (site.caseDefinition?.clickProbe || site.source === 'fixture')
    ) {
      clickProbe = await els['site-view'].executeJavaScript(
        clickMarkerScript(site.caseDefinition?.clickProbe?.walletId),
        true,
      );
      if (clickProbe.clicked) await delay(900);
    }
    const providerRequests = state.providerRequests.slice(0, 50);
    let reloadInspection = null;
    if (site.caseDefinition?.assertReload) {
      state.injection = null;
      setInjection('pending', 'Re-injecting…');
      const ready = waitForWebviewEvent(
        'dom-ready',
        site.caseDefinition?.timeouts?.navigationMs || 30000,
      );
      els['site-view'].reload();
      await ready;
      await delay(1700);
      await openWalletForSite(site);
      const reloadDeadline =
        Date.now() + (site.caseDefinition?.timeouts?.walletModalMs || 15000);
      do {
        await delay(600);
        reloadInspection = await els['site-view'].executeJavaScript(inspectScript, true);
        if (
          reloadInspection.markerCount > 0 ||
          reloadInspection.oneKeyCount > 0 ||
          reloadInspection.blocked
        ) {
          break;
        }
      } while (Date.now() < reloadDeadline);
    }
    const verdict = classifyResult(
      trigger,
      inspection,
      stableInspection,
      reloadInspection,
      state.injection === 'ready',
      site,
      providerRequests,
    );
    const screenshot = await captureCurrent(site, true);
    result = {
      id: site.id,
      hostname: site.hostname,
      url: inspection.url || site.url,
      status: verdict.status,
      summary: verdict.summary,
      source: site.source,
      startedAt,
      finishedAt: new Date().toISOString(),
      injectionOk: state.injection === 'ready',
      trigger,
      inspection,
      stableInspection,
      reloadInspection,
      clickProbe,
      providerRequests,
      scriptedAssertions: verdict.assertions,
      scriptedAssertionsPassed:
        verdict.status === 'passed' &&
        verdict.assertions.filter((item) => item.required).every((item) => item.passed),
      research: {
        modalSelector: inspection.modalSelector,
        modalWalletCount: inspection.modalWalletCount,
        walletCandidates: inspection.walletCandidates,
        actionCandidates: inspection.actionCandidates,
      },
      screenshot,
    };
  } catch (error) {
    result = {
      id: site.id,
      hostname: site.hostname,
      url: site.url,
      status: state.stopRequested ? 'review' : 'failed',
      summary: error instanceof Error ? error.message : String(error),
      source: site.source,
      startedAt,
      finishedAt: new Date().toISOString(),
      injectionOk: state.injection === 'ready',
      scriptedAssertions: [],
      scriptedAssertionsPassed: false,
      screenshot: await captureCurrent(site, true),
    };
  }

  const saved = await api.saveResult(result);
  state.results[site.id] = saved;
  state.currentRun = null;
  els['current-status'].className = `status-dot ${saved.status}`;
  els['assertion-summary'].textContent = saved.summary;
  state.lastArtifact = saved.screenshot || null;
  els['show-artifact'].classList.toggle('hidden', !state.lastArtifact);
  addEvent(`${site.hostname}: ${saved.status} — ${saved.summary}`, saved.status === 'passed' ? 'success' : saved.status === 'failed' ? 'error' : '');
  renderSites();
  updateSummary();
  return saved;
}

async function runSites(sites) {
  if (state.running || sites.length === 0) return;
  setRunning(true);
  state.stopRequested = false;
  const results = [];
  try {
    for (let index = 0; index < sites.length; index += 1) {
      if (state.stopRequested) break;
      els['queue-progress'].textContent = `${index + 1} / ${sites.length}`;
      results.push(await runOne(sites[index]));
    }
  } finally {
    setRunning(false);
    els['queue-progress'].textContent = state.stopRequested ? 'Stopped' : 'Complete';
    state.stopRequested = false;
  }
  return results;
}

function webviewReady() {
  try {
    return Boolean(els['site-view'].getWebContentsId());
  } catch {
    return false;
  }
}

els['site-view'].setAttribute('partition', 'persist:connect-button-lab');
els['site-view'].addEventListener('ipc-message', (event) => {
  if (event.channel === 'hack-bundle-status') {
    const payload = event.args[0] || {};
    setInjection(payload.ok ? 'ready' : 'failed', payload.ok ? 'Injection ready' : 'Injection failed');
    addEvent(payload.ok ? 'Hack bundle injected' : `Injection error: ${payload.error}`, payload.ok ? 'success' : 'error');
  }
  if (event.channel === 'lab-event') {
    const payload = event.args[0] || {};
    if (payload.type === 'provider-request') {
      state.providerRequests.push({
        scope: payload.scope,
        method: payload.method,
        params: payload.params,
        at: payload.at,
      });
      addEvent(`Provider ${payload.scope}.${payload.method}`);
    }
    if (payload.type === 'hack-bundle-ready') {
      addEvent('Current hack runtime initialized', 'success');
    }
  }
});

els['site-view'].addEventListener('did-navigate', (event) => {
  els['address-bar'].textContent = event.url;
});
els['site-view'].addEventListener('did-navigate-in-page', (event) => {
  els['address-bar'].textContent = event.url;
});
els['site-view'].addEventListener('did-fail-load', (event) => {
  if (event.errorCode === -3) return;
  addEvent(`Navigation failed (${event.errorCode}): ${event.errorDescription}`, 'error');
});
els['site-view'].addEventListener('console-message', (event) => {
  if (/hackButton|onekey/i.test(event.message)) {
    addEvent(`Page: ${event.message}`);
  }
});

els['run-selected'].addEventListener('click', () => {
  const site = selectedSite();
  if (canRun(site)) void runSites([site]);
});
els['run-all'].addEventListener('click', () =>
  void runSites(state.catalog.filter((site) => canRun(site))),
);
els['stop-run'].addEventListener('click', () => {
  state.stopRequested = true;
  els['queue-progress'].textContent = 'Stopping…';
});
els['refresh-sites'].addEventListener('click', () => void refreshSites());
els['site-search'].addEventListener('input', renderSites);
els['clear-events'].addEventListener('click', () => els.events.replaceChildren());
els['reload-page'].addEventListener('click', () => {
  if (webviewReady()) els['site-view'].reload();
});
els['open-devtools'].addEventListener('click', () => {
  if (webviewReady()) void api.openDevTools(els['site-view'].getWebContentsId());
});
els['capture-page'].addEventListener('click', () => {
  const site = selectedSite();
  if (site && webviewReady()) void captureCurrent(site);
});
els['show-artifact'].addEventListener('click', () => {
  if (state.lastArtifact) void api.showArtifact(state.lastArtifact);
});
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault();
    els['run-selected'].click();
  }
});

async function boot() {
  const bootstrap = await api.getBootstrap();
  state.catalog = bootstrap.catalog;
  state.results = bootstrap.results;
  state.options = bootstrap.options;
  els['site-view'].setAttribute('preload', bootstrap.guestPreloadUrl);
  state.selectedId = state.catalog[0]?.id || null;
  selectSite(state.selectedId, { preview: false });
  renderSites();
  updateSummary();
  setRunning(false);
  addEvent(
    `DeFiLlama catalog loaded: ${state.catalog.length} active protocols · ${
      state.catalog.filter((site) => canRun(site)).length
    } test ready`,
    'success',
  );
  if (bootstrap.registry) {
    renderRegistrySummary(bootstrap.registry);
    const { progress } = bootstrap.registry;
    addEvent(
      `Registry: ${progress.doneCoverage}/${progress.active} coverage complete`,
      'success',
    );
  }

  let automaticSites = [];
  if (state.options.smokeTest) {
    automaticSites = state.catalog.filter((site) => site.id === 'lab-demo');
  } else if (state.options.runAll) {
    automaticSites = state.catalog.filter((site) => canRun(site));
  } else if (state.options.runSite) {
    const requested = state.options.requestedSite || state.options.requestedId;
    const target =
      state.catalog.find((site) => site.id === requested || site.hostname === requested) ||
      state.catalog[0];
    automaticSites = target ? [target] : [];
  }

  if (automaticSites.length > 0) {
    if (state.options.smokeTest) {
      await verifyDashboardPreviewNavigation(automaticSites[0]);
    }
    const results = await runSites(automaticSites);
    if (state.options.smokeTest) {
      api.smokeComplete(results?.[0] || { status: 'failed', summary: 'No smoke result' });
    } else if (state.options.machineRun) {
      api.machineComplete(results?.[0] || { status: 'failed', summary: 'No machine result' });
    }
  }
}

void boot().catch((error) => {
  addEvent(`Dashboard failed: ${error.message}`, 'error');
  els['assertion-summary'].textContent = error.message;
  if (state.options.smokeTest) {
    api.smokeComplete({ status: 'failed', summary: error.message });
  } else if (state.options.machineRun) {
    api.machineComplete({ status: 'failed', summary: error.message });
  }
});
