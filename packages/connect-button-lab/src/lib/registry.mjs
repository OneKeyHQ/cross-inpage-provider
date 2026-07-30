import path from 'node:path';
import { fileExists, readJson, writeJsonAtomic } from './json-file.mjs';
import { fetchText, sha256 } from './http.mjs';
import { registryFile as defaultRegistryFile, repoDir } from './paths.mjs';
import {
  detectLocalProviderPackages,
  filterLocalProviderChains,
} from './supported-chains.mjs';

export const SOURCE_URLS = Object.freeze({
  llmsUrl: 'https://api-docs.defillama.com/llms.txt',
  protocolsUrl: 'https://api.llama.fi/protocols',
  chainsUrl: 'https://api.llama.fi/v2/chains',
  eip155ChainsUrl: 'https://chainid.network/chains.json',
});

export const COVERAGE_STATES = new Set(['pending', 'claimed', 'done']);
export const COVERAGE_OUTCOMES = new Set([
  'implemented_verified',
  'existing_verified',
  'native_supported',
  'not_applicable',
  'blocked',
]);
export const REGRESSION_STATES = new Set(['not_due', 'pending', 'claimed', 'done']);
export const REGRESSION_OUTCOMES = new Set([
  'passed',
  'repaired',
  'failed',
  'still_blocked',
  'still_not_applicable',
]);
export const MANUAL_REVIEW_STATES = new Set(['pending', 'processed']);
export const AUTOMATION_CLASSIFICATIONS = new Set([
  'standard_library',
  'generic_modal',
  'bespoke',
  'native_supported',
  'not_applicable',
  'externally_blocked',
  'needs_review',
]);

function compareIds(left, right) {
  return String(left).localeCompare(String(right), 'en', {
    numeric: true,
    sensitivity: 'base',
  });
}

function normalizeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return { url: null, hostname: null };
  }
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { url: null, hostname: null };
    }
    url.hash = '';
    return {
      url: url.href.replace(/\/$/, ''),
      hostname: url.hostname.toLowerCase().replace(/^www\./, ''),
    };
  } catch {
    return { url: null, hostname: null };
  }
}

function defaultCoverage() {
  return {
    state: 'pending',
    outcome: null,
    attempts: 0,
    runId: null,
    claimedAt: null,
    completedAt: null,
    reason: null,
  };
}

function defaultImplementation() {
  return {
    kind: null,
    adapterFile: null,
    manifestFile: null,
    walletIds: [],
    caseFile: null,
  };
}

function defaultAutomation() {
  return {
    classification: null,
    confidence: null,
    patternId: null,
    workPacket: null,
    needsLlm: false,
  };
}

function defaultEvidence() {
  return {
    researchAt: null,
    screenshots: [],
    lastE2eAt: null,
    lastE2eStatus: null,
    lastE2eCommand: null,
    scriptedAssertionsPassed: false,
  };
}

function defaultRegression() {
  return {
    cycle: 0,
    state: 'not_due',
    outcome: null,
    checkedAt: null,
  };
}

function defaultManualReview() {
  return {
    state: 'pending',
    reviewedAt: null,
    reviewedUrl: null,
    injectedBundleSha256: null,
  };
}

export function isCexProtocol(protocol) {
  return String(protocol?.category || '').trim().toLowerCase() === 'cex';
}

function normalizedChainName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(mainnet|network)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeChainMetadata(chains, eip155Chains = []) {
  const eip155ByName = new Map();
  for (const chain of eip155Chains) {
    if (/\b(test|devnet|deprecated)\b/i.test(chain?.name || '')) continue;
    if (Number(chain?.nativeCurrency?.decimals) !== 18) continue;
    const name = normalizedChainName(chain?.name);
    const chainId = Number(chain?.chainId);
    if (name && Number.isSafeInteger(chainId) && chainId > 0) {
      eip155ByName.set(name, chainId);
    }
  }
  const records = new Map();
  for (const chain of chains) {
    const name = typeof chain?.name === 'string' ? chain.name.trim() : '';
    if (!name) continue;
    const tvl = Number(chain?.tvl);
    const declaredChainId = Number(chain?.chainId);
    const fallbackChainId = eip155ByName.get(normalizedChainName(name));
    const chainId =
      Number.isSafeInteger(declaredChainId) && declaredChainId > 0
        ? declaredChainId
        : fallbackChainId;
    const candidate = {
      name,
      tvl: Number.isFinite(tvl) && tvl > 0 ? tvl : 0,
      chainId: Number.isSafeInteger(chainId) && chainId > 0 ? chainId : null,
      isEvm: Number.isSafeInteger(chainId) && chainId > 0,
    };
    const existing = records.get(name);
    if (
      !existing ||
      candidate.tvl > existing.tvl ||
      (candidate.isEvm && !existing.isEvm)
    ) {
      records.set(name, candidate);
    }
  }
  return [...records.values()].sort(
    (left, right) =>
      right.tvl - left.tvl ||
      left.name.localeCompare(right.name),
  );
}

function mergeSiteRankings(protocols) {
  const rankingsByChain = new Map();
  for (const protocol of protocols) {
    for (const ranking of protocol.rankings || []) {
      const existing = rankingsByChain.get(ranking.chain);
      if (
        !existing ||
        ranking.rank < existing.rank ||
        (ranking.rank === existing.rank &&
          ranking.chainTvl > existing.chainTvl)
      ) {
        rankingsByChain.set(ranking.chain, { ...ranking });
      }
    }
  }
  return [...rankingsByChain.values()].sort(
    (left, right) =>
      left.rank - right.rank ||
      left.chain.localeCompare(right.chain),
  );
}

export function dedupeRankedProtocolsByHostname(protocols) {
  const groups = new Map();
  for (const protocol of [...protocols].sort(compareProtocolPriority)) {
    const key = protocol.sourceHostname
      ? `hostname:${protocol.sourceHostname}`
      : `protocol:${protocol.id}`;
    const group = groups.get(key) || [];
    group.push(protocol);
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((group) => {
      const representative = group[0];
      const rankings = mergeSiteRankings(group);
      return {
        ...representative,
        sourceProtocolIds: group
          .map((protocol) => protocol.id)
          .sort(compareIds),
        totalTvl: group.reduce(
          (total, protocol) => total + Number(protocol.totalTvl || 0),
          0,
        ),
        rankings,
        priority: {
          bestRank: Math.min(...rankings.map((ranking) => ranking.rank)),
          rankedChainCount: rankings.length,
          maxChainTvl: Math.max(
            ...rankings.map((ranking) => ranking.chainTvl),
          ),
        },
      };
    })
    .sort(compareProtocolPriority);
}

export function buildRankedProtocols({
  chains,
  protocols,
  eip155Chains = [],
  topPerChain = 20,
  providerPackages = detectLocalProviderPackages(),
}) {
  if (!Array.isArray(chains) || !Array.isArray(protocols)) {
    throw new Error('DeFiLlama chains and protocols responses must be arrays');
  }
  const records = new Map();
  let rankingSlots = 0;
  const eligibleProtocols = protocols.filter(
    (protocol) => !isCexProtocol(protocol),
  );

  const allChainMetadata = normalizeChainMetadata(chains, eip155Chains);
  const chainMetadata = filterLocalProviderChains(allChainMetadata, {
    providerPackages,
  });
  const canonicalChains = chainMetadata
    .map((chain) => chain.name)
    .sort((left, right) => left.localeCompare(right));

  for (const chain of canonicalChains) {
    const ranked = eligibleProtocols
      .map((protocol) => ({
        protocol,
        chainTvl: Number(protocol?.chainTvls?.[chain]),
      }))
      .filter(
        ({ protocol, chainTvl }) =>
          protocol?.id != null &&
          Number.isFinite(chainTvl) &&
          chainTvl > 0,
      )
      .sort(
        (left, right) =>
          right.chainTvl - left.chainTvl ||
          compareIds(left.protocol.id, right.protocol.id),
      )
      .slice(0, topPerChain);

    ranked.forEach(({ protocol, chainTvl }, index) => {
      const id = String(protocol.id);
      const existing = records.get(id) || {
        raw: protocol,
        rankings: [],
      };
      existing.rankings.push({
        chain,
        rank: index + 1,
        chainTvl,
      });
      records.set(id, existing);
      rankingSlots += 1;
    });
  }

  const rankedProtocols = [...records.entries()]
    .map(([id, { raw, rankings }]) => {
      rankings.sort(
        (left, right) =>
          left.rank - right.rank || left.chain.localeCompare(right.chain),
      );
      const normalized = normalizeUrl(raw.url);
      return {
        id,
        slug: String(raw.slug || raw.name || id),
        name: String(raw.name || raw.slug || id),
        category: raw.category == null ? null : String(raw.category),
        active: true,
        totalTvl:
          Number.isFinite(Number(raw.tvl)) && Number(raw.tvl) > 0
            ? Number(raw.tvl)
            : 0,
        sourceUrl: normalized.url,
        sourceHostname: normalized.hostname,
        rankings,
        priority: {
          bestRank: Math.min(...rankings.map((ranking) => ranking.rank)),
          rankedChainCount: rankings.length,
          maxChainTvl: Math.max(
            ...rankings.map((ranking) => ranking.chainTvl),
          ),
        },
      };
    })
    .sort(compareProtocolPriority);
  const selected = dedupeRankedProtocolsByHostname(rankedProtocols);

  return {
    selected,
    chains: chainMetadata,
    stats: {
      chains: canonicalChains.length,
      sourceChains: allChainMetadata.length,
      excludedUnsupportedChains:
        allChainMetadata.length - chainMetadata.length,
      rankingSlots,
      uniqueProtocols: selected.length,
      rankedProtocols: rankedProtocols.length,
      deduplicatedProtocols: rankedProtocols.length - selected.length,
      excludedCexProtocols: protocols.length - eligibleProtocols.length,
    },
  };
}

export function compareProtocolPriority(left, right) {
  return (
    left.priority.bestRank - right.priority.bestRank ||
    right.priority.rankedChainCount - left.priority.rankedChainCount ||
    right.priority.maxChainTvl - left.priority.maxChainTvl ||
    compareIds(left.id, right.id)
  );
}

function makeProtocol(snapshot) {
  return {
    ...snapshot,
    target: {
      resolvedDappUrl: null,
      urlOverride: null,
      hostname: null,
      provider: null,
      coveredByProtocolId: null,
    },
    coverage: defaultCoverage(),
    implementation: defaultImplementation(),
    automation: defaultAutomation(),
    evidence: defaultEvidence(),
    regression: defaultRegression(),
    manualReview: defaultManualReview(),
    history: [],
  };
}

function existingState(existing, fallback, key) {
  return existing?.[key] && typeof existing[key] === 'object'
    ? { ...fallback(), ...existing[key] }
    : fallback();
}

function priorStateScore(protocol) {
  if (!protocol) return -1;
  let score = 0;
  if (protocol.coverage?.state === 'done') score += 100;
  if (protocol.coverage?.state === 'claimed') score += 20;
  if (protocol.regression?.state === 'done') score += 10;
  if (protocol.regression?.state === 'claimed') score += 5;
  if (protocol.evidence?.scriptedAssertionsPassed === true) score += 2;
  if (protocol.implementation?.caseFile) score += 1;
  return score;
}

function findPriorProtocol(previous, snapshot) {
  const candidateIds = new Set([
    snapshot.id,
    ...(snapshot.sourceProtocolIds || []),
  ]);
  return [...candidateIds]
    .map((id) => previous.get(id))
    .filter(Boolean)
    .sort(
      (left, right) =>
        priorStateScore(right) - priorStateScore(left) ||
        Number(right.id === snapshot.id) - Number(left.id === snapshot.id) ||
        compareIds(left.id, right.id),
    )[0];
}

export function mergeSnapshot({
  existing,
  selected,
  chains,
  source,
  topPerChain = 20,
  batchSize = 3,
  startCycle = false,
  now = new Date().toISOString(),
}) {
  const previous = new Map((existing?.protocols || []).map((protocol) => [protocol.id, protocol]));
  const activeIds = new Set(selected.map((protocol) => protocol.id));
  const nextCycleNumber = existing
    ? existing.cycle.number + (startCycle ? 1 : 0)
    : 1;
  const nextCycleKind = existing && startCycle ? 'regression' : existing?.cycle?.kind || 'coverage';

  const protocols = selected.map((snapshot) => {
    const prior = findPriorProtocol(previous, snapshot);
    if (!prior) return makeProtocol(snapshot);
    const merged = {
      ...prior,
      ...snapshot,
      target: {
        resolvedDappUrl: null,
        urlOverride: null,
        hostname: null,
        provider: null,
        coveredByProtocolId: null,
        ...prior.target,
      },
      coverage: existingState(prior, defaultCoverage, 'coverage'),
      implementation: existingState(prior, defaultImplementation, 'implementation'),
      automation: existingState(prior, defaultAutomation, 'automation'),
      evidence: existingState(prior, defaultEvidence, 'evidence'),
      regression: existingState(prior, defaultRegression, 'regression'),
      manualReview: existingState(
        prior,
        defaultManualReview,
        'manualReview',
      ),
      history: Array.isArray(prior.history) ? prior.history.slice(-10) : [],
    };
    if (existing && startCycle && merged.coverage.state === 'done') {
      merged.regression = {
        cycle: nextCycleNumber,
        state: 'pending',
        outcome: null,
        checkedAt: null,
      };
    }
    return merged;
  });

  for (const prior of previous.values()) {
    if (activeIds.has(prior.id) || isCexProtocol(prior)) continue;
    protocols.push({
      ...prior,
      active: false,
      rankings: [],
    });
  }

  protocols.sort((left, right) => {
    if (left.active !== right.active) return left.active ? -1 : 1;
    if (!left.active) return compareIds(left.id, right.id);
    return compareProtocolPriority(left, right);
  });

  return {
    schemaVersion: 1,
    source,
    chains: Array.isArray(chains)
      ? chains
      : Array.isArray(existing?.chains)
        ? existing.chains
        : [],
    settings: {
      topPerChain,
      batchSize,
    },
    cycle: {
      number: nextCycleNumber,
      kind: nextCycleKind,
      snapshotAt: now,
      startedAt: existing && !startCycle ? existing.cycle.startedAt : now,
    },
    protocols,
  };
}

export async function syncRegistry({
  file = defaultRegistryFile,
  topPerChain = 20,
  batchSize = 3,
  startCycle = false,
  fetchImpl = globalThis.fetch,
  now = new Date().toISOString(),
} = {}) {
  const [llmsText, chainsText, protocolsText, eip155ChainsText] = await Promise.all([
    fetchText(SOURCE_URLS.llmsUrl, { fetchImpl }),
    fetchText(SOURCE_URLS.chainsUrl, { fetchImpl }),
    fetchText(SOURCE_URLS.protocolsUrl, { fetchImpl }),
    fetchText(SOURCE_URLS.eip155ChainsUrl, { fetchImpl }),
  ]);
  if (!llmsText.includes('https://api.llama.fi') || !llmsText.includes('/protocols')) {
    throw new Error('llms.txt no longer advertises the expected free TVL API');
  }
  let chains;
  let protocols;
  let eip155Chains;
  try {
    chains = JSON.parse(chainsText);
    protocols = JSON.parse(protocolsText);
    eip155Chains = JSON.parse(eip155ChainsText);
  } catch (error) {
    throw new Error(`Invalid chain source JSON: ${error.message}`);
  }
  const ranked = buildRankedProtocols({
    chains,
    protocols,
    eip155Chains,
    topPerChain,
  });
  const existing = await readJson(file, null);
  const registry = mergeSnapshot({
    existing,
    selected: ranked.selected,
    chains: ranked.chains,
    source: {
      ...SOURCE_URLS,
      fetchedAt: now,
      llmsSha256: sha256(llmsText),
      chainsSha256: sha256(chainsText),
      protocolsSha256: sha256(protocolsText),
      eip155ChainsSha256: sha256(eip155ChainsText),
    },
    topPerChain,
    batchSize,
    startCycle,
    now,
  });
  const errors = await validateRegistry(registry, { checkFiles: false });
  if (errors.length > 0) {
    throw new Error(`Generated registry is invalid:\n${errors.join('\n')}`);
  }
  await writeJsonAtomic(file, registry);
  return {
    registry,
    stats: {
      ...ranked.stats,
      totalProtocols: protocols.length,
      activeProtocols: registry.protocols.filter((protocol) => protocol.active).length,
      inactiveProtocols: registry.protocols.filter((protocol) => !protocol.active).length,
    },
  };
}

function isStale(date, nowMs, ttlMs) {
  const time = Date.parse(date || '');
  return !Number.isFinite(time) || nowMs - time > ttlMs;
}

function isPortableRepoReference(value) {
  if (
    typeof value !== 'string' ||
    !value ||
    value.includes('\\') ||
    value.includes('://')
  ) {
    return false;
  }
  if (path.posix.isAbsolute(value) || path.win32.isAbsolute(value)) return false;
  const normalized = path.posix.normalize(value);
  return (
    normalized !== '.' &&
    normalized !== '..' &&
    !normalized.startsWith('../')
  );
}

function selectDiverseHostname(tasks, limit) {
  const selected = [];
  const seen = new Set();
  for (const protocol of tasks) {
    const hostname = protocol.target?.hostname || protocol.sourceHostname || `id:${protocol.id}`;
    if (seen.has(hostname)) continue;
    selected.push(protocol);
    seen.add(hostname);
    if (selected.length === limit) return selected;
  }
  for (const protocol of tasks) {
    if (selected.includes(protocol)) continue;
    selected.push(protocol);
    if (selected.length === limit) break;
  }
  return selected;
}

export function claimRegistryBatch(
  registry,
  {
    limit = registry.settings?.batchSize || 3,
    runId,
    now = new Date().toISOString(),
    claimTtlMs = 2 * 60 * 60 * 1000,
  },
) {
  if (!runId) throw new Error('runId is required');
  if (!Number.isInteger(limit) || limit < 1 || limit > 3) {
    throw new Error('Batch limit must be an integer between 1 and 3');
  }
  const nowMs = Date.parse(now);
  for (const protocol of registry.protocols) {
    if (
      protocol.coverage.state === 'claimed' &&
      isStale(protocol.coverage.claimedAt, nowMs, claimTtlMs)
    ) {
      protocol.coverage.state = 'pending';
      protocol.coverage.runId = null;
      protocol.coverage.claimedAt = null;
      protocol.coverage.reason = 'Recovered stale claim';
    }
    if (
      protocol.regression.state === 'claimed' &&
      isStale(protocol.regression.claimedAt, nowMs, claimTtlMs)
    ) {
      protocol.regression.state = 'pending';
      protocol.regression.runId = null;
      protocol.regression.claimedAt = null;
    }
  }

  const resumed = registry.protocols
    .filter(
    (protocol) =>
      protocol.active &&
      (protocol.coverage.state === 'claimed' || protocol.regression.state === 'claimed'),
    )
    .sort(compareProtocolPriority);
  const coveragePending = registry.protocols
    .filter((protocol) => protocol.active && protocol.coverage.state === 'pending')
    .sort(compareProtocolPriority);
  const regressionPending = registry.protocols
    .filter(
      (protocol) =>
        protocol.active &&
        protocol.coverage.state === 'done' &&
        protocol.regression.cycle === registry.cycle.number &&
        protocol.regression.state === 'pending',
    )
    .sort(compareProtocolPriority);

  const candidates = [
    ...resumed,
    ...coveragePending.filter((protocol) => !resumed.includes(protocol)),
    ...regressionPending.filter((protocol) => !resumed.includes(protocol)),
  ];
  const selected = selectDiverseHostname(candidates, limit);
  for (const protocol of selected) {
    if (protocol.coverage.state !== 'done') {
      const isNewClaim = protocol.coverage.state !== 'claimed';
      protocol.coverage.state = 'claimed';
      protocol.coverage.runId = runId;
      protocol.coverage.claimedAt = now;
      if (isNewClaim) protocol.coverage.attempts += 1;
    } else {
      protocol.regression.state = 'claimed';
      protocol.regression.runId = runId;
      protocol.regression.claimedAt = now;
    }
  }
  return {
    selected,
    rolloverNeeded:
      selected.length === 0 &&
      registry.protocols
        .filter((protocol) => protocol.active)
        .every(
          (protocol) =>
            protocol.coverage.state === 'done' &&
            (protocol.regression.cycle !== registry.cycle.number ||
              protocol.regression.state === 'done' ||
              protocol.regression.state === 'not_due'),
        ),
  };
}

function mergePatch(target, patch) {
  const result = { ...target };
  for (const [key, value] of Object.entries(patch || {})) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      target?.[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = mergePatch(target[key], value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export async function applyProtocolPatch(
  registry,
  protocolId,
  patch,
  { now = new Date().toISOString(), checkFiles = true } = {},
) {
  const protocol = registry.protocols.find((candidate) => candidate.id === String(protocolId));
  if (!protocol) throw new Error(`Unknown protocol ID: ${protocolId}`);
  const allowed = new Set([
    'target',
    'coverage',
    'implementation',
    'automation',
    'evidence',
    'regression',
    'manualReview',
  ]);
  const unknown = Object.keys(patch).filter((key) => !allowed.has(key));
  if (unknown.length > 0) throw new Error(`Unsupported patch keys: ${unknown.join(', ')}`);

  const before = structuredClone(protocol);
  for (const key of Object.keys(patch)) {
    protocol[key] = mergePatch(protocol[key], patch[key]);
  }
  if (
    Object.prototype.hasOwnProperty.call(patch.target || {}, 'urlOverride')
  ) {
    const override = patch.target.urlOverride;
    if (override == null) {
      protocol.target.urlOverride = null;
    } else {
      const normalizedOverride = normalizeUrl(override);
      if (!normalizedOverride.url) {
        throw new Error('target.urlOverride must be an HTTP(S) URL or null');
      }
      protocol.target.urlOverride = normalizedOverride.url;
    }
    if (protocol.target.urlOverride !== before.target?.urlOverride) {
      protocol.manualReview = defaultManualReview();
    }
  }
  if (protocol.coverage.state === 'done') {
    if (!COVERAGE_OUTCOMES.has(protocol.coverage.outcome)) {
      throw new Error('Terminal coverage requires a valid outcome');
    }
    if (!protocol.coverage.completedAt) protocol.coverage.completedAt = now;
    protocol.coverage.runId = null;
    protocol.coverage.claimedAt = null;
    if (
      ['implemented_verified', 'existing_verified'].includes(protocol.coverage.outcome) &&
      (protocol.evidence.lastE2eStatus !== 'passed' ||
        protocol.evidence.scriptedAssertionsPassed !== true)
    ) {
      throw new Error(
        `${protocol.coverage.outcome} requires passed scripted E2E evidence`,
      );
    }
  }
  if (
    protocol.regression.state === 'done' &&
    ['passed', 'repaired'].includes(protocol.regression.outcome) &&
    (protocol.evidence.lastE2eStatus !== 'passed' ||
      protocol.evidence.scriptedAssertionsPassed !== true)
  ) {
    throw new Error(
      `${protocol.regression.outcome} regression requires passed scripted E2E evidence`,
    );
  }
  if (
    checkFiles &&
    ['implemented_verified', 'existing_verified'].includes(
      protocol.coverage.outcome,
    )
  ) {
    const requiredFiles = [
      ['caseFile', protocol.implementation.caseFile],
      ...(protocol.coverage.outcome === 'implemented_verified'
        ? [
            ['adapterFile', protocol.implementation.adapterFile],
            ['manifestFile', protocol.implementation.manifestFile],
          ]
        : []),
    ];
    for (const [label, file] of requiredFiles) {
      if (!file || !(await fileExists(path.resolve(repoDir, file)))) {
        throw new Error(`${label} does not exist: ${file || '<empty>'}`);
      }
    }
  }
  protocol.history = [
    ...(Array.isArray(before.history) ? before.history : []),
    {
      at: now,
      runId: before.coverage.runId || before.regression.runId || null,
      coverageState: protocol.coverage.state,
      coverageOutcome: protocol.coverage.outcome,
      regressionState: protocol.regression.state,
      regressionOutcome: protocol.regression.outcome,
    },
  ].slice(-10);
  return protocol;
}

export async function validateRegistry(
  registry,
  { checkFiles = true, now = Date.now() } = {},
) {
  const errors = [];
  if (registry?.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (!Number.isFinite(Date.parse(registry?.source?.fetchedAt || ''))) {
    errors.push('source.fetchedAt must be an ISO timestamp');
  }
  for (const field of [
    'llmsSha256',
    'chainsSha256',
    'protocolsSha256',
    'eip155ChainsSha256',
  ]) {
    if (!/^[a-f0-9]{64}$/i.test(registry?.source?.[field] || '')) {
      errors.push(`source.${field} must be a SHA-256 digest`);
    }
  }
  if (registry?.chains != null && !Array.isArray(registry.chains)) {
    errors.push('chains must be an array');
  }
  const chainNames = new Set();
  for (const chain of registry?.chains || []) {
    if (!chain?.name || chainNames.has(chain.name)) {
      errors.push(`chain ${chain?.name || '<missing>'}: duplicate or missing name`);
    }
    chainNames.add(chain?.name);
    if (!Number.isFinite(chain?.tvl) || chain.tvl < 0) {
      errors.push(`chain ${chain?.name || '<missing>'}: invalid TVL`);
    }
    if (
      chain?.chainId != null &&
      (!Number.isSafeInteger(chain.chainId) || chain.chainId <= 0)
    ) {
      errors.push(`chain ${chain?.name || '<missing>'}: invalid chainId`);
    }
    if (typeof chain?.isEvm !== 'boolean') {
      errors.push(`chain ${chain?.name || '<missing>'}: isEvm must be boolean`);
    }
  }
  if (!Array.isArray(registry?.protocols)) return [...errors, 'protocols must be an array'];
  const ids = new Set();
  for (const protocol of registry.protocols) {
    const label = `protocol ${protocol?.id || '<missing>'}`;
    if (!protocol?.id || ids.has(protocol.id)) errors.push(`${label}: duplicate or missing id`);
    ids.add(protocol?.id);
    if (isCexProtocol(protocol)) {
      errors.push(`${label}: CEX protocols must be excluded from the registry`);
    }
    if (!COVERAGE_STATES.has(protocol?.coverage?.state)) {
      errors.push(`${label}: invalid coverage.state`);
    }
    if (!REGRESSION_STATES.has(protocol?.regression?.state)) {
      errors.push(`${label}: invalid regression.state`);
    }
    const manualReviewState = protocol?.manualReview?.state || 'pending';
    if (!MANUAL_REVIEW_STATES.has(manualReviewState)) {
      errors.push(`${label}: invalid manualReview.state`);
    }
    if (
      protocol?.target?.urlOverride != null &&
      !normalizeUrl(protocol.target.urlOverride).url
    ) {
      errors.push(`${label}: target.urlOverride must be an HTTP(S) URL or null`);
    }
    if (manualReviewState === 'processed') {
      if (
        !Number.isFinite(
          Date.parse(protocol.manualReview.reviewedAt || ''),
        )
      ) {
        errors.push(`${label}: processed manual review requires reviewedAt`);
      }
      if (!normalizeUrl(protocol.manualReview.reviewedUrl).url) {
        errors.push(`${label}: processed manual review requires reviewedUrl`);
      }
      if (
        !/^[a-f0-9]{64}$/iu.test(
          protocol.manualReview.injectedBundleSha256 || '',
        )
      ) {
        errors.push(
          `${label}: processed manual review requires injectedBundleSha256`,
        );
      }
    }
    if (
      protocol?.automation?.classification != null &&
      !AUTOMATION_CLASSIFICATIONS.has(protocol.automation.classification)
    ) {
      errors.push(`${label}: invalid automation.classification`);
    }
    if (protocol.active && (!Array.isArray(protocol.rankings) || protocol.rankings.length === 0)) {
      errors.push(`${label}: active protocol has no rankings`);
    }
    for (const ranking of protocol.rankings || []) {
      if (
        !Number.isInteger(ranking.rank) ||
        ranking.rank < 1 ||
        ranking.rank > registry.settings.topPerChain
      ) {
        errors.push(`${label}: invalid rank for ${ranking.chain}`);
      }
      if (!Number.isFinite(ranking.chainTvl) || ranking.chainTvl <= 0) {
        errors.push(`${label}: invalid chain TVL for ${ranking.chain}`);
      }
    }
    if (
      protocol.coverage.state === 'done' &&
      !COVERAGE_OUTCOMES.has(protocol.coverage.outcome)
    ) {
      errors.push(`${label}: done coverage requires valid outcome`);
    }
    if (
      protocol.regression.state === 'done' &&
      !REGRESSION_OUTCOMES.has(protocol.regression.outcome)
    ) {
      errors.push(`${label}: done regression requires valid outcome`);
    }
    if (
      protocol.coverage.state === 'done' &&
      ['implemented_verified', 'existing_verified'].includes(
        protocol.coverage.outcome,
      ) &&
      (protocol.evidence?.lastE2eStatus !== 'passed' ||
        protocol.evidence?.scriptedAssertionsPassed !== true)
    ) {
      errors.push(`${label}: verified coverage requires passed scripted E2E evidence`);
    }
    if (
      protocol.regression.state === 'done' &&
      ['passed', 'repaired'].includes(protocol.regression.outcome) &&
      (protocol.evidence?.lastE2eStatus !== 'passed' ||
        protocol.evidence?.scriptedAssertionsPassed !== true)
    ) {
      errors.push(`${label}: verified regression requires passed scripted E2E evidence`);
    }
    if (
      protocol.coverage.state === 'claimed' &&
      isStale(protocol.coverage.claimedAt, now, 24 * 60 * 60 * 1000)
    ) {
      errors.push(`${label}: coverage claim is older than 24 hours`);
    }
    for (const [field, value] of [
      ['implementation.adapterFile', protocol.implementation?.adapterFile],
      ['implementation.manifestFile', protocol.implementation?.manifestFile],
      ['implementation.caseFile', protocol.implementation?.caseFile],
      ['automation.workPacket', protocol.automation?.workPacket],
    ]) {
      if (value != null && !isPortableRepoReference(value)) {
        errors.push(`${label}: ${field} must be a portable repository-relative path`);
      }
    }
    if (!Array.isArray(protocol.evidence?.screenshots)) {
      errors.push(`${label}: evidence.screenshots must be an array`);
    } else {
      for (const screenshot of protocol.evidence.screenshots) {
        if (!isPortableRepoReference(screenshot)) {
          errors.push(
            `${label}: evidence.screenshots must contain portable repository-relative paths`,
          );
          break;
        }
      }
    }
    if (
      checkFiles &&
      ['implemented_verified', 'existing_verified'].includes(
        protocol.coverage.outcome,
      )
    ) {
      if (
        !protocol.implementation.caseFile ||
        !(await fileExists(path.resolve(repoDir, protocol.implementation.caseFile)))
      ) {
        errors.push(`${label}: caseFile does not exist`);
      }
      if (
        protocol.coverage.outcome === 'implemented_verified' &&
        (!protocol.implementation.adapterFile ||
          !(await fileExists(
            path.resolve(repoDir, protocol.implementation.adapterFile),
          )))
      ) {
        errors.push(`${label}: adapterFile does not exist`);
      }
      if (
        protocol.coverage.outcome === 'implemented_verified' &&
        (!protocol.implementation.manifestFile ||
          !(await fileExists(
            path.resolve(repoDir, protocol.implementation.manifestFile),
          )))
      ) {
        errors.push(`${label}: manifestFile does not exist`);
      }
    }
  }

  for (const protocol of registry.protocols) {
    const seen = new Set([protocol.id]);
    let current = protocol;
    while (current?.target?.coveredByProtocolId) {
      const nextId = current.target.coveredByProtocolId;
      if (seen.has(nextId)) {
        errors.push(`protocol ${protocol.id}: coveredByProtocolId cycle`);
        break;
      }
      seen.add(nextId);
      current = registry.protocols.find((candidate) => candidate.id === nextId);
      if (!current) {
        errors.push(`protocol ${protocol.id}: unknown coveredByProtocolId ${nextId}`);
        break;
      }
    }
  }
  return errors;
}

export async function loadRegistry(file = defaultRegistryFile) {
  const registry = await readJson(file, null);
  if (!registry) throw new Error(`Registry not found: ${file}`);
  return registry;
}

export async function saveRegistry(registry, file = defaultRegistryFile) {
  await writeJsonAtomic(file, registry);
}

export function registryProgress(registry) {
  const active = registry.protocols.filter((protocol) => protocol.active);
  const counts = {
    active: active.length,
    pendingCoverage: 0,
    claimedCoverage: 0,
    doneCoverage: 0,
    pendingRegression: 0,
    doneRegression: 0,
    needsLlm: 0,
  };
  for (const protocol of active) {
    if (protocol.coverage.state === 'pending') counts.pendingCoverage += 1;
    if (protocol.coverage.state === 'claimed') counts.claimedCoverage += 1;
    if (protocol.coverage.state === 'done') counts.doneCoverage += 1;
    if (protocol.regression.state === 'pending') counts.pendingRegression += 1;
    if (protocol.regression.state === 'done') counts.doneRegression += 1;
    if (protocol.automation.needsLlm) counts.needsLlm += 1;
  }
  return counts;
}
