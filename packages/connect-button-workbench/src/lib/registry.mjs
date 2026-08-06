import path from 'node:path';
import { fileExists, readJson, writeJsonAtomic } from './json-file.mjs';
import { fetchText, sha256 } from './http.mjs';
import {
  dappResolutionsFile as defaultDappResolutionsFile,
  registryFile as defaultRegistryFile,
  repoDir,
  repoRelativePath,
} from './paths.mjs';
import {
  detectLocalProviderPackages,
  filterLocalProviderChains,
  localProviderForChain,
  normalizeChainName,
  readInjectedProviderCapabilities,
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
export const MANUAL_REVIEW_STATES = new Set([
  'pending',
  'processed',
  'unsupported',
]);
export const AUTOMATION_CLASSIFICATIONS = new Set([
  'standard_library',
  'generic_modal',
  'bespoke',
  'native_supported',
  'not_applicable',
  'externally_blocked',
  'needs_review',
]);
export const SOURCE_DAPP_STATUSES = new Set([
  'available',
  'unresolved',
  'unavailable',
]);
export const DAPP_RESOLUTION_STATUSES = new Set([
  'resolved',
  'no_runnable_dapp',
  'unresolved',
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

export function sourceDappAvailability(protocol) {
  if (protocol?.rugged === true) {
    return {
      status: 'unavailable',
      reason: 'defillama_rugged',
      deadFrom: protocol.deadFrom || null,
    };
  }
  if (protocol?.deprecated === true) {
    return {
      status: 'unavailable',
      reason: 'defillama_deprecated',
      deadFrom: protocol.deadFrom || null,
    };
  }
  if (protocol?.deadFrom) {
    return {
      status: 'unavailable',
      reason: 'defillama_dead_from',
      deadFrom: String(protocol.deadFrom),
    };
  }
  if (protocol?.deadUrl === true) {
    return {
      status: 'unavailable',
      reason: 'defillama_dead_url',
      deadFrom: null,
    };
  }
  if (normalizeUrl(protocol?.url).url) {
    return {
      status: 'available',
      reason: 'defillama_url',
      deadFrom: null,
    };
  }
  return {
    status: 'unresolved',
    reason: 'defillama_missing_url',
    deadFrom: null,
  };
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

function defaultUrlResolution() {
  return {
    status: 'unresolved',
    source: 'none',
    reason: 'no_trusted_official_url',
    evidenceUrl: null,
    verifiedAt: null,
  };
}

function inferredUrlResolution(protocol) {
  if (normalizeUrl(protocol?.target?.urlOverride).url) {
    return {
      status: 'resolved',
      source: 'manual_override',
      reason: 'manual_url_override',
      evidenceUrl: null,
      verifiedAt: null,
    };
  }
  if (normalizeUrl(protocol?.target?.resolvedDappUrl).url) {
    return {
      status: 'resolved',
      source: 'discovery',
      reason: 'discovered_dapp_url',
      evidenceUrl: null,
      verifiedAt: null,
    };
  }
  if (normalizeUrl(protocol?.sourceUrl).url) {
    return {
      status: 'resolved',
      source: 'defillama',
      reason: 'defillama_url',
      evidenceUrl: null,
      verifiedAt: null,
    };
  }
  return defaultUrlResolution();
}

export function protocolDappUrl(protocol) {
  return (
    normalizeUrl(protocol?.target?.urlOverride).url ||
    normalizeUrl(protocol?.target?.resolvedDappUrl).url ||
    normalizeUrl(protocol?.sourceUrl).url ||
    null
  );
}

export function hasRunnableDapp(protocol) {
  return Boolean(protocolDappUrl(protocol));
}

export function validateDappResolutionConfig(config) {
  const errors = [];
  if (config?.schemaVersion !== 1) {
    errors.push('schemaVersion must be 1');
  }
  if (!Array.isArray(config?.protocols)) {
    return [...errors, 'protocols must be an array'];
  }
  const ids = new Set();
  for (const entry of config.protocols) {
    const protocolId = String(entry?.protocolId || '').trim();
    const label = `protocol ${protocolId || '<missing>'}`;
    if (!protocolId || ids.has(protocolId)) {
      errors.push(`${label}: duplicate or missing protocolId`);
    }
    ids.add(protocolId);
    if (
      typeof entry?.protocolSlug !== 'string' ||
      !entry.protocolSlug.trim()
    ) {
      errors.push(`${label}: protocolSlug must be a non-empty string`);
    }
    if (!DAPP_RESOLUTION_STATUSES.has(entry?.status)) {
      errors.push(`${label}: invalid status`);
    }
    if (!Number.isFinite(Date.parse(entry?.verifiedAt || ''))) {
      errors.push(`${label}: verifiedAt must be an ISO timestamp`);
    }
    if (!normalizeUrl(entry?.evidenceUrl).url) {
      errors.push(`${label}: evidenceUrl must be an HTTP(S) URL`);
    }
    if (entry?.status === 'resolved') {
      if (!normalizeUrl(entry?.url).url) {
        errors.push(`${label}: resolved entry requires an HTTP(S) URL`);
      }
    } else {
      if (entry?.url != null) {
        errors.push(`${label}: non-resolved entry cannot declare a URL`);
      }
      if (typeof entry?.reason !== 'string' || !entry.reason.trim()) {
        errors.push(`${label}: non-resolved entry requires a reason`);
      }
    }
  }
  return errors;
}

export function applyDappResolutions(registry, config) {
  const errors = validateDappResolutionConfig(config);
  if (errors.length > 0) {
    throw new Error(`Invalid DApp URL resolutions:\n${errors.join('\n')}`);
  }
  const entries = new Map(
    config.protocols.map((entry) => [String(entry.protocolId), entry]),
  );
  const stats = {
    configured: config.protocols.length,
    matched: 0,
    resolved: 0,
    noRunnableDapp: 0,
    reviewedUnresolved: 0,
    activeWithoutRunnableDapp: 0,
  };

  for (const protocol of registry.protocols) {
    protocol.target = {
      resolvedDappUrl: null,
      urlOverride: null,
      hostname: null,
      provider: null,
      coveredByProtocolId: null,
      urlResolution: defaultUrlResolution(),
      ...protocol.target,
    };
    const entry = entries.get(String(protocol.id));
    if (!entry) {
      if (protocol.target.urlResolution?.source === 'curated') {
        protocol.target.resolvedDappUrl = null;
      }
      protocol.target.urlResolution = inferredUrlResolution(protocol);
      if (protocol.active && !hasRunnableDapp(protocol)) {
        stats.activeWithoutRunnableDapp += 1;
      }
      continue;
    }
    stats.matched += 1;
    if (protocol.slug !== entry.protocolSlug) {
      throw new Error(
        `DApp URL resolution ${entry.protocolId} expected slug ${entry.protocolSlug}, received ${protocol.slug}`,
      );
    }
    const evidenceUrl = normalizeUrl(entry.evidenceUrl).url;
    if (entry.status === 'resolved') {
      const resolved = normalizeUrl(entry.url);
      protocol.target.resolvedDappUrl = resolved.url;
      protocol.target.urlResolution = {
        status: 'resolved',
        source: 'curated',
        reason: 'trusted_official_url',
        evidenceUrl,
        verifiedAt: entry.verifiedAt,
      };
      stats.resolved += 1;
    } else {
      protocol.target.resolvedDappUrl = null;
      protocol.target.urlResolution = {
        status: entry.status,
        source: 'curated',
        reason: entry.reason,
        evidenceUrl,
        verifiedAt: entry.verifiedAt,
      };
      if (entry.status === 'no_runnable_dapp') {
        stats.noRunnableDapp += 1;
      } else {
        stats.reviewedUnresolved += 1;
      }
    }
    if (protocol.active && !hasRunnableDapp(protocol)) {
      stats.activeWithoutRunnableDapp += 1;
    }
  }
  return stats;
}

export function isCexProtocol(protocol) {
  return String(protocol?.category || '').trim().toLowerCase() === 'cex';
}

function eip155ChainsByName(eip155Chains) {
  const eip155ByName = new Map();
  for (const chain of eip155Chains) {
    if (/\b(test|devnet|deprecated)\b/i.test(chain?.name || '')) continue;
    if (Number(chain?.nativeCurrency?.decimals) !== 18) continue;
    const chainId = Number(chain?.chainId);
    if (!Number.isSafeInteger(chainId) || chainId <= 0) continue;
    for (const value of [chain?.name, chain?.title]) {
      const name = normalizeChainName(value);
      if (name && !eip155ByName.has(name)) {
        eip155ByName.set(name, {
          chainId,
          name:
            typeof chain?.name === 'string' && chain.name.trim()
              ? chain.name.trim()
              : value.trim(),
        });
      }
    }
  }
  return eip155ByName;
}

function normalizeChainMetadata(chains, eip155Chains = []) {
  const eip155ByName = eip155ChainsByName(eip155Chains);
  const records = new Map();
  for (const chain of chains) {
    const name = typeof chain?.name === 'string' ? chain.name.trim() : '';
    if (!name) continue;
    const tvl = Number(chain?.tvl);
    const declaredChainId = Number(chain?.chainId);
    const fallbackChainId = eip155ByName.get(normalizeChainName(name))?.chainId;
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

function collectPositiveProtocolChainTvls(protocols) {
  const chainTvls = new Map();
  for (const protocol of protocols) {
    for (const [rawName, rawTvl] of Object.entries(
      protocol?.chainTvls || {},
    )) {
      const name = String(rawName || '').trim();
      const tvl = Number(rawTvl);
      if (!name || !Number.isFinite(tvl) || tvl <= 0) continue;
      const existing = chainTvls.get(name) || 0;
      chainTvls.set(name, existing + tvl);
    }
  }
  return [...chainTvls.entries()]
    .map(([name, tvl]) => ({
      name,
      normalizedName: normalizeChainName(name),
      tvl,
    }))
    .filter((chain) => chain.normalizedName)
    .sort(
      (left, right) =>
        right.tvl - left.tvl ||
        left.name.localeCompare(right.name),
    );
}

function chainIdentity(chain) {
  if (chain.isEvm) {
    return `evm:${chain.chainId || normalizeChainName(chain.name)}`;
  }
  return `provider:${chain.provider}`;
}

function resolveSupportedChainMetadata({
  chains,
  protocols,
  eip155Chains,
  providerCapabilities,
  providerPackages,
}) {
  const sourceChains = normalizeChainMetadata(chains, eip155Chains);
  const supportedSourceChains = filterLocalProviderChains(sourceChains, {
    providerCapabilities,
    providerPackages,
  });
  const groups = new Map();
  const groupByNormalizedName = new Map();

  for (const chain of supportedSourceChains) {
    const identity = chainIdentity(chain);
    const existing = groups.get(identity);
    const group =
      existing ||
      {
        chain,
        protocolChainNames: new Set(),
        supplemental: false,
      };
    group.protocolChainNames.add(chain.name);
    if (
      existing &&
      (chain.tvl > existing.chain.tvl ||
        (chain.tvl === existing.chain.tvl &&
          chain.name.localeCompare(existing.chain.name) < 0))
    ) {
      group.chain = chain;
    }
    groups.set(identity, group);
    groupByNormalizedName.set(normalizeChainName(chain.name), identity);
  }

  let aliasedProtocolChainKeys = 0;
  for (const source of collectPositiveProtocolChainTvls(protocols)) {
    let identity = groupByNormalizedName.get(source.normalizedName);
    let provider = null;

    if (!identity) {
      provider = localProviderForChain(
        { name: source.name, isEvm: false },
        { providerCapabilities, providerPackages },
      );
      if (provider) {
        identity = `provider:${provider.id}`;
      }
    }

    if (!identity) continue;
    let group = groups.get(identity);
    if (!group) {
      group = {
        chain: {
          name: source.name,
          tvl: source.tvl,
          chainId: null,
          isEvm: false,
          provider: provider.id,
          providerPackage: provider.packageName,
        },
        protocolChainNames: new Set(),
        supplemental: true,
      };
      groups.set(identity, group);
      groupByNormalizedName.set(source.normalizedName, identity);
    } else if (group.supplemental && source.tvl > group.chain.tvl) {
      group.chain.tvl = source.tvl;
    }

    if (
      normalizeChainName(group.chain.name) !== source.normalizedName
    ) {
      aliasedProtocolChainKeys += 1;
    }
    group.protocolChainNames.add(source.name);
  }

  const resolved = [...groups.values()].sort(
    (left, right) =>
      right.chain.tvl - left.chain.tvl ||
      left.chain.name.localeCompare(right.chain.name),
  );
  return {
    chains: resolved,
    stats: {
      sourceChains: sourceChains.length,
      excludedUnsupportedChains:
        sourceChains.length - supportedSourceChains.length,
      supplementalChains: resolved.filter((group) => group.supplemental)
        .length,
      aliasedProtocolChainKeys,
    },
  };
}

function protocolChainTvl(protocol, chainNames) {
  let tvl = 0;
  for (const chainName of chainNames) {
    const candidate = Number(protocol?.chainTvls?.[chainName]);
    if (Number.isFinite(candidate) && candidate > tvl) {
      tvl = candidate;
    }
  }
  return tvl;
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
      const globalRanks = group
        .map((protocol) => protocol.globalRank)
        .filter((rank) => Number.isInteger(rank) && rank > 0);
      const globalRank =
        globalRanks.length > 0 ? Math.min(...globalRanks) : null;
      return {
        ...representative,
        sourceProtocolIds: group
          .map((protocol) => protocol.id)
          .sort(compareIds),
        totalTvl:
          Number.isFinite(Number(representative.totalTvl)) &&
          Number(representative.totalTvl) > 0
            ? Number(representative.totalTvl)
            : 0,
        globalRank,
        rankings,
        priority: {
          globalRank,
          bestRank:
            rankings.length > 0
              ? Math.min(...rankings.map((ranking) => ranking.rank))
              : null,
          rankedChainCount: rankings.length,
          maxChainTvl:
            rankings.length > 0
              ? Math.max(...rankings.map((ranking) => ranking.chainTvl))
              : 0,
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
  globalTop = 1000,
  providerCapabilities = readInjectedProviderCapabilities(),
  providerPackages = detectLocalProviderPackages({
    providerCapabilities,
  }),
}) {
  if (!Array.isArray(chains) || !Array.isArray(protocols)) {
    throw new Error('DeFiLlama chains and protocols responses must be arrays');
  }
  const records = new Map();
  let rankingSlots = 0;
  const nonCexProtocols = protocols.filter(
    (protocol) => !isCexProtocol(protocol),
  );
  const eligibleProtocols = nonCexProtocols.filter(
    (protocol) =>
      sourceDappAvailability(protocol).status !== 'unavailable',
  );

  const resolvedChainMetadata = resolveSupportedChainMetadata({
    chains,
    protocols: eligibleProtocols,
    eip155Chains,
    providerCapabilities,
    providerPackages,
  });
  const chainMetadata = resolvedChainMetadata.chains;

  const globallyRanked = eligibleProtocols
    .map((protocol) => ({
      protocol,
      totalTvl: Number(protocol?.tvl),
    }))
    .filter(
      ({ protocol, totalTvl }) =>
        protocol?.id != null &&
        Number.isFinite(totalTvl) &&
        totalTvl > 0,
    )
    .sort(
      (left, right) =>
        right.totalTvl - left.totalTvl ||
        compareIds(left.protocol.id, right.protocol.id),
    )
    .slice(0, globalTop);

  globallyRanked.forEach(({ protocol }, index) => {
    records.set(String(protocol.id), {
      raw: protocol,
      globalRank: index + 1,
      rankings: [],
    });
  });

  for (const chainRecord of chainMetadata) {
    const chain = chainRecord.chain.name;
    const ranked = eligibleProtocols
      .map((protocol) => ({
        protocol,
        chainTvl: protocolChainTvl(
          protocol,
          chainRecord.protocolChainNames,
        ),
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
        globalRank: null,
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
    .map(([id, { raw, globalRank = null, rankings }]) => {
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
        sourceDapp: sourceDappAvailability(raw),
        globalRank,
        rankings,
        priority: {
          globalRank,
          bestRank:
            rankings.length > 0
              ? Math.min(...rankings.map((ranking) => ranking.rank))
              : null,
          rankedChainCount: rankings.length,
          maxChainTvl:
            rankings.length > 0
              ? Math.max(...rankings.map((ranking) => ranking.chainTvl))
              : 0,
        },
      };
    })
    .sort(compareProtocolPriority);
  const selected = dedupeRankedProtocolsByHostname(rankedProtocols);

  return {
    selected,
    chains: chainMetadata.map((chain) => chain.chain),
    stats: {
      chains: chainMetadata.length,
      ...resolvedChainMetadata.stats,
      globalRankingSlots: globallyRanked.length,
      rankingSlots,
      uniqueProtocols: selected.length,
      rankedProtocols: rankedProtocols.length,
      deduplicatedProtocols: rankedProtocols.length - selected.length,
      excludedCexProtocols: protocols.length - nonCexProtocols.length,
      excludedUnavailableProtocols:
        nonCexProtocols.length - eligibleProtocols.length,
    },
  };
}

export function compareProtocolPriority(left, right) {
  return (
    (left.priority?.globalRank ?? Number.POSITIVE_INFINITY) -
      (right.priority?.globalRank ?? Number.POSITIVE_INFINITY) ||
    (left.priority?.bestRank ?? Number.POSITIVE_INFINITY) -
      (right.priority?.bestRank ?? Number.POSITIVE_INFINITY) ||
    (right.priority?.rankedChainCount || 0) -
      (left.priority?.rankedChainCount || 0) ||
    (right.priority?.maxChainTvl || 0) -
      (left.priority?.maxChainTvl || 0) ||
    compareIds(left.id, right.id)
  );
}

function makeProtocol(snapshot) {
  return {
    ...snapshot,
    totalTvl:
      Number.isFinite(Number(snapshot.totalTvl)) &&
      Number(snapshot.totalTvl) > 0
        ? Number(snapshot.totalTvl)
        : 0,
    target: {
      resolvedDappUrl: null,
      urlOverride: null,
      hostname: null,
      provider: null,
      coveredByProtocolId: null,
      urlResolution: inferredUrlResolution(snapshot),
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
  globalTop = 1000,
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
        urlResolution: inferredUrlResolution(prior),
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
      totalTvl:
        Number.isFinite(Number(prior.totalTvl)) &&
        Number(prior.totalTvl) > 0
          ? Number(prior.totalTvl)
          : 0,
      globalRank: null,
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
      globalTop,
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
  resolutionsFile = defaultDappResolutionsFile,
  topPerChain = 20,
  globalTop = 1000,
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
    globalTop,
  });
  const existing = await readJson(file, null);
  const dappResolutions = await readJson(resolutionsFile, null);
  if (!dappResolutions) {
    throw new Error(`DApp URL resolutions not found: ${resolutionsFile}`);
  }
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
      dappResolutionsFile: repoRelativePath(resolutionsFile),
    },
    topPerChain,
    globalTop,
    startCycle,
    now,
  });
  const sourceProtocolsById = new Map(
    protocols.map((protocol) => [String(protocol.id), protocol]),
  );
  for (const protocol of registry.protocols) {
    const sourceProtocol = sourceProtocolsById.get(String(protocol.id));
    if (sourceProtocol) {
      protocol.sourceDapp = sourceDappAvailability(sourceProtocol);
    }
  }
  const dappResolutionStats = applyDappResolutions(
    registry,
    dappResolutions,
  );
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
      dappResolutions: dappResolutionStats,
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
  if (
    !Number.isInteger(registry?.settings?.topPerChain) ||
    registry.settings.topPerChain < 1
  ) {
    errors.push('settings.topPerChain must be a positive integer');
  }
  if (
    !Number.isInteger(registry?.settings?.globalTop) ||
    registry.settings.globalTop < 1
  ) {
    errors.push('settings.globalTop must be a positive integer');
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
    if (
      protocol?.target?.resolvedDappUrl != null &&
      !normalizeUrl(protocol.target.resolvedDappUrl).url
    ) {
      errors.push(
        `${label}: target.resolvedDappUrl must be an HTTP(S) URL or null`,
      );
    }
    const urlResolution = protocol?.target?.urlResolution;
    if (urlResolution != null) {
      if (!DAPP_RESOLUTION_STATUSES.has(urlResolution.status)) {
        errors.push(`${label}: invalid target.urlResolution.status`);
      }
      if (
        typeof urlResolution.source !== 'string' ||
        !urlResolution.source
      ) {
        errors.push(`${label}: invalid target.urlResolution.source`);
      }
      if (
        typeof urlResolution.reason !== 'string' ||
        !urlResolution.reason
      ) {
        errors.push(`${label}: invalid target.urlResolution.reason`);
      }
      if (
        urlResolution.evidenceUrl != null &&
        !normalizeUrl(urlResolution.evidenceUrl).url
      ) {
        errors.push(
          `${label}: target.urlResolution.evidenceUrl must be an HTTP(S) URL or null`,
        );
      }
      if (
        urlResolution.verifiedAt != null &&
        !Number.isFinite(Date.parse(urlResolution.verifiedAt))
      ) {
        errors.push(
          `${label}: target.urlResolution.verifiedAt must be an ISO timestamp or null`,
        );
      }
      if (
        urlResolution.status === 'resolved' &&
        !hasRunnableDapp(protocol)
      ) {
        errors.push(
          `${label}: resolved target.urlResolution requires a runnable URL`,
        );
      }
      if (
        ['no_runnable_dapp', 'unresolved'].includes(
          urlResolution.status,
        ) &&
        urlResolution.source === 'curated' &&
        protocol.target?.resolvedDappUrl != null
      ) {
        errors.push(
          `${label}: curated non-resolved target cannot retain resolvedDappUrl`,
        );
      }
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
    if (
      protocol?.sourceDapp != null &&
      !SOURCE_DAPP_STATUSES.has(protocol.sourceDapp.status)
    ) {
      errors.push(`${label}: invalid sourceDapp.status`);
    }
    if (
      protocol?.sourceDapp?.reason != null &&
      typeof protocol.sourceDapp.reason !== 'string'
    ) {
      errors.push(`${label}: invalid sourceDapp.reason`);
    }
    if (
      protocol?.sourceDapp?.deadFrom != null &&
      typeof protocol.sourceDapp.deadFrom !== 'string'
    ) {
      errors.push(`${label}: invalid sourceDapp.deadFrom`);
    }
    if (
      protocol.active &&
      protocol?.sourceDapp?.status === 'unavailable'
    ) {
      errors.push(`${label}: unavailable source DApp cannot be active`);
    }
    if (!Number.isFinite(protocol.totalTvl) || protocol.totalTvl < 0) {
      errors.push(`${label}: invalid protocol TVL`);
    }
    const hasGlobalRank =
      Number.isInteger(protocol.globalRank) &&
      protocol.globalRank >= 1 &&
      protocol.globalRank <= registry.settings.globalTop;
    if (
      protocol.globalRank != null &&
      !hasGlobalRank
    ) {
      errors.push(`${label}: invalid global rank`);
    }
    if (
      protocol.active &&
      (!Array.isArray(protocol.rankings) || protocol.rankings.length === 0) &&
      !hasGlobalRank
    ) {
      errors.push(`${label}: active protocol has no global or chain ranking`);
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
  const runnable = active.filter(hasRunnableDapp);
  const counts = {
    active: active.length,
    runnable: runnable.length,
    withoutRunnableDapp: active.length - runnable.length,
    noRunnableDapp: active.filter(
      (protocol) =>
        protocol.target?.urlResolution?.status === 'no_runnable_dapp',
    ).length,
    unresolvedDapp: active.filter(
      (protocol) =>
        protocol.target?.urlResolution?.status === 'unresolved',
    ).length,
    pendingCoverage: 0,
    claimedCoverage: 0,
    doneCoverage: 0,
    pendingRegression: 0,
    doneRegression: 0,
    needsLlm: 0,
  };
  for (const protocol of runnable) {
    if (protocol.coverage.state === 'pending') counts.pendingCoverage += 1;
    if (protocol.coverage.state === 'claimed') counts.claimedCoverage += 1;
    if (protocol.coverage.state === 'done') counts.doneCoverage += 1;
    if (protocol.regression.state === 'pending') counts.pendingRegression += 1;
    if (protocol.regression.state === 'done') counts.doneRegression += 1;
    if (protocol.automation.needsLlm) counts.needsLlm += 1;
  }
  return counts;
}
