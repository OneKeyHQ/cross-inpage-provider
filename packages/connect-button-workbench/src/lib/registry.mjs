import { readJson, writeJsonAtomic } from './json-file.mjs';
import { fetchText, sha256 } from './http.mjs';
import {
  dappResolutionsFile as defaultDappResolutionsFile,
  registryFile as defaultRegistryFile,
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

export const MANUAL_REVIEW_STATES = new Set([
  'pending',
  'processed',
  'unsupported',
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

export function documentAdvertisesUrl(document, expectedUrl) {
  const expected = new URL(expectedUrl);
  const candidates = String(document).match(
    /https?:\/\/[^\s<>"'`()\[\]{}]+/gu,
  );
  return (candidates || []).some((value) => {
    try {
      const candidate = new URL(value.replace(/[.,;:]+$/u, ''));
      return (
        candidate.protocol === expected.protocol &&
        candidate.hostname === expected.hostname &&
        candidate.port === expected.port &&
        candidate.pathname === expected.pathname &&
        candidate.search === expected.search &&
        candidate.hash === expected.hash &&
        candidate.username === '' &&
        candidate.password === ''
      );
    } catch {
      return false;
    }
  });
}

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

function defaultManualReview() {
  return {
    state: 'pending',
    reviewedAt: null,
    reviewedUrl: null,
    injectedBundleSha256: null,
  };
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
    selectedWithoutRunnableDapp: 0,
  };

  for (const protocol of registry.protocols) {
    protocol.target = {
      resolvedDappUrl: null,
      urlOverride: null,
      ...protocol.target,
    };
    protocol.target.resolvedDappUrl = null;
    const entry = entries.get(String(protocol.id));
    if (!entry) {
      if (!hasRunnableDapp(protocol)) {
        stats.selectedWithoutRunnableDapp += 1;
      }
      continue;
    }
    stats.matched += 1;
    if (protocol.slug !== entry.protocolSlug) {
      throw new Error(
        `DApp URL resolution ${entry.protocolId} expected slug ${entry.protocolSlug}, received ${protocol.slug}`,
      );
    }
    if (entry.status === 'resolved') {
      const resolved = normalizeUrl(entry.url);
      protocol.target.resolvedDappUrl = resolved.url;
      stats.resolved += 1;
    } else {
      protocol.target.resolvedDappUrl = null;
      if (entry.status === 'no_runnable_dapp') {
        stats.noRunnableDapp += 1;
      } else {
        stats.reviewedUnresolved += 1;
      }
    }
    if (!hasRunnableDapp(protocol)) {
      stats.selectedWithoutRunnableDapp += 1;
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

function priorStateScore(protocol) {
  if (!protocol) return -1;
  if (protocol.manualReview?.state === 'processed') return 2;
  if (protocol.manualReview?.state === 'unsupported') return 1;
  return 0;
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

function compactManualReview(value) {
  const review = {
    ...defaultManualReview(),
    ...(value && typeof value === 'object' ? value : {}),
  };
  if (review.state === 'processed') {
    return {
      state: 'processed',
      reviewedAt: review.reviewedAt,
      reviewedUrl: normalizeUrl(review.reviewedUrl).url,
      injectedBundleSha256: review.injectedBundleSha256,
    };
  }
  return review.state === 'unsupported' ? { state: 'unsupported' } : null;
}

function compactTarget(value) {
  const target = {};
  const resolvedDappUrl = normalizeUrl(value?.resolvedDappUrl).url;
  const urlOverride = normalizeUrl(value?.urlOverride).url;
  if (resolvedDappUrl) target.resolvedDappUrl = resolvedDappUrl;
  if (urlOverride) target.urlOverride = urlOverride;
  return target;
}

function compactProtocol(protocol) {
  const sourceProtocolIds = [
    ...new Set(
      (protocol?.sourceProtocolIds || [])
        .map((id) => String(id || '').trim())
        .filter(Boolean),
    ),
  ].sort(compareIds);
  const target = compactTarget(protocol?.target);
  const manualReview = compactManualReview(protocol?.manualReview);
  const result = {
    id: String(protocol.id),
    slug: String(protocol.slug || protocol.name || protocol.id),
    name: String(protocol.name || protocol.slug || protocol.id),
    totalTvl:
      Number.isFinite(Number(protocol.totalTvl)) &&
      Number(protocol.totalTvl) > 0
        ? Number(protocol.totalTvl)
        : 0,
    priority: {
      globalRank:
        Number.isInteger(protocol?.priority?.globalRank)
          ? protocol.priority.globalRank
          : Number.isInteger(protocol?.globalRank)
            ? protocol.globalRank
            : null,
      bestRank: Number.isInteger(protocol?.priority?.bestRank)
        ? protocol.priority.bestRank
        : null,
      rankedChainCount: Number.isInteger(
        protocol?.priority?.rankedChainCount,
      )
        ? protocol.priority.rankedChainCount
        : 0,
      maxChainTvl:
        Number.isFinite(Number(protocol?.priority?.maxChainTvl)) &&
        Number(protocol.priority.maxChainTvl) > 0
          ? Number(protocol.priority.maxChainTvl)
          : 0,
    },
  };
  const sourceUrl = normalizeUrl(protocol.sourceUrl).url;
  if (sourceUrl) result.sourceUrl = sourceUrl;
  if (sourceProtocolIds.length > 1) {
    result.sourceProtocolIds = sourceProtocolIds;
  }
  if (Object.keys(target).length > 0) result.target = target;
  if (manualReview) result.manualReview = manualReview;
  return result;
}

export function compactRegistry(registry) {
  return {
    schemaVersion: 1,
    source: registry.source,
    settings: {
      topPerChain: registry.settings?.topPerChain ?? 20,
      globalTop: registry.settings?.globalTop ?? 1000,
    },
    protocols: (registry.protocols || [])
      .filter((protocol) => !isCexProtocol(protocol))
      .map(compactProtocol),
  };
}

export function mergeSnapshot({
  existing,
  selected,
  source,
  topPerChain = 20,
  globalTop = 1000,
}) {
  const previous = new Map((existing?.protocols || []).map((protocol) => [protocol.id, protocol]));
  const protocols = selected.map((snapshot) => {
    const prior = findPriorProtocol(previous, snapshot);
    return compactProtocol({
      ...snapshot,
      target: {
        resolvedDappUrl: prior?.target?.resolvedDappUrl || null,
        urlOverride: prior?.target?.urlOverride || null,
        ...snapshot.target,
      },
      manualReview: prior?.manualReview || defaultManualReview(),
    });
  });

  return {
    schemaVersion: 1,
    source,
    settings: {
      topPerChain,
      globalTop,
    },
    protocols,
  };
}

export async function syncRegistry({
  file = defaultRegistryFile,
  resolutionsFile = defaultDappResolutionsFile,
  topPerChain = 20,
  globalTop = 1000,
  fetchImpl = globalThis.fetch,
  now = new Date().toISOString(),
} = {}) {
  const [llmsText, chainsText, protocolsText, eip155ChainsText] = await Promise.all([
    fetchText(SOURCE_URLS.llmsUrl, { fetchImpl }),
    fetchText(SOURCE_URLS.chainsUrl, { fetchImpl }),
    fetchText(SOURCE_URLS.protocolsUrl, { fetchImpl }),
    fetchText(SOURCE_URLS.eip155ChainsUrl, { fetchImpl }),
  ]);
  if (!documentAdvertisesUrl(llmsText, SOURCE_URLS.protocolsUrl)) {
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
  });
  const dappResolutionStats = applyDappResolutions(
    registry,
    dappResolutions,
  );
  const compactedRegistry = compactRegistry(registry);
  const errors = await validateRegistry(compactedRegistry, {
    checkFiles: false,
  });
  if (errors.length > 0) {
    throw new Error(`Generated registry is invalid:\n${errors.join('\n')}`);
  }
  await writeJsonAtomic(file, compactedRegistry);
  return {
    registry: compactedRegistry,
    stats: {
      ...ranked.stats,
      totalProtocols: protocols.length,
      selectedProtocols: compactedRegistry.protocols.length,
      dappResolutions: dappResolutionStats,
    },
  };
}

export async function applyProtocolPatch(
  registry,
  protocolId,
  patch,
) {
  const protocol = registry.protocols.find((candidate) => candidate.id === String(protocolId));
  if (!protocol) throw new Error(`Unknown protocol ID: ${protocolId}`);
  const allowed = new Set(['target', 'manualReview']);
  const unknown = Object.keys(patch).filter((key) => !allowed.has(key));
  if (unknown.length > 0) throw new Error(`Unsupported patch keys: ${unknown.join(', ')}`);

  const unknownTargetKeys = Object.keys(patch.target || {}).filter(
    (key) => key !== 'urlOverride',
  );
  if (unknownTargetKeys.length > 0) {
    throw new Error(
      `Unsupported target patch keys: ${unknownTargetKeys.join(', ')}`,
    );
  }
  if (
    Object.prototype.hasOwnProperty.call(patch.target || {}, 'urlOverride')
  ) {
    const previousOverride = protocol.target?.urlOverride || null;
    protocol.target ||= {};
    const override = patch.target.urlOverride;
    if (override == null) {
      delete protocol.target.urlOverride;
    } else {
      const normalizedOverride = normalizeUrl(override);
      if (!normalizedOverride.url) {
        throw new Error('target.urlOverride must be an HTTP(S) URL or null');
      }
      protocol.target.urlOverride = normalizedOverride.url;
    }
    if ((protocol.target.urlOverride || null) !== previousOverride) {
      delete protocol.manualReview;
    }
    if (Object.keys(protocol.target).length === 0) {
      delete protocol.target;
    }
  }
  if (patch.manualReview) {
    const manualReview = compactManualReview({
      ...defaultManualReview(),
      ...protocol.manualReview,
      ...patch.manualReview,
    });
    if (manualReview) protocol.manualReview = manualReview;
    else delete protocol.manualReview;
  }
  return protocol;
}

export async function validateRegistry(registry) {
  const errors = [];
  if (registry?.schemaVersion !== 1) errors.push('schemaVersion must be 1');

  const unknownRegistryKeys = Object.keys(registry || {}).filter(
    (key) => !['schemaVersion', 'source', 'settings', 'protocols'].includes(key),
  );
  if (unknownRegistryKeys.length > 0) {
    errors.push(`unsupported registry fields: ${unknownRegistryKeys.join(', ')}`);
  }
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
  if (!Array.isArray(registry?.protocols)) {
    return [...errors, 'protocols must be an array'];
  }

  const ids = new Set();
  for (const protocol of registry.protocols) {
    const label = `protocol ${protocol?.id || '<missing>'}`;
    if (!protocol?.id || ids.has(protocol.id)) {
      errors.push(`${label}: duplicate or missing id`);
    }
    ids.add(protocol?.id);

    const unknownProtocolKeys = Object.keys(protocol || {}).filter(
      (key) =>
        ![
          'id',
          'slug',
          'name',
          'totalTvl',
          'sourceUrl',
          'sourceProtocolIds',
          'priority',
          'target',
          'manualReview',
        ].includes(key),
    );
    if (unknownProtocolKeys.length > 0) {
      errors.push(
        `${label}: unsupported fields: ${unknownProtocolKeys.join(', ')}`,
      );
    }
    if (typeof protocol?.slug !== 'string' || !protocol.slug.trim()) {
      errors.push(`${label}: slug is required`);
    }
    if (typeof protocol?.name !== 'string' || !protocol.name.trim()) {
      errors.push(`${label}: name is required`);
    }
    if (protocol?.sourceUrl != null && !normalizeUrl(protocol.sourceUrl).url) {
      errors.push(`${label}: sourceUrl must be an HTTP(S) URL`);
    }
    if (protocol?.sourceProtocolIds != null) {
      if (
        !Array.isArray(protocol.sourceProtocolIds) ||
        protocol.sourceProtocolIds.length < 2 ||
        new Set(protocol.sourceProtocolIds).size !==
          protocol.sourceProtocolIds.length ||
        protocol.sourceProtocolIds.some(
          (id) => typeof id !== 'string' || !id.trim(),
        )
      ) {
        errors.push(`${label}: sourceProtocolIds must contain unique IDs`);
      }
    }
    if (!Number.isFinite(protocol.totalTvl) || protocol.totalTvl < 0) {
      errors.push(`${label}: invalid protocol TVL`);
    }

    const priority = protocol?.priority;
    const unknownPriorityKeys = Object.keys(priority || {}).filter(
      (key) =>
        ![
          'globalRank',
          'bestRank',
          'rankedChainCount',
          'maxChainTvl',
        ].includes(key),
    );
    if (unknownPriorityKeys.length > 0) {
      errors.push(
        `${label}: unsupported priority fields: ${unknownPriorityKeys.join(
          ', ',
        )}`,
      );
    }
    const hasGlobalRank =
      Number.isInteger(priority?.globalRank) &&
      priority.globalRank >= 1 &&
      priority.globalRank <= registry.settings.globalTop;
    if (priority?.globalRank != null && !hasGlobalRank) {
      errors.push(`${label}: invalid global rank`);
    }
    const hasChainRank =
      Number.isInteger(priority?.bestRank) &&
      priority.bestRank >= 1 &&
      priority.bestRank <= registry.settings.topPerChain;
    if (priority?.bestRank != null && !hasChainRank) {
      errors.push(`${label}: invalid best chain rank`);
    }
    if (!hasGlobalRank && !hasChainRank) {
      errors.push(`${label}: protocol has no global or chain ranking`);
    }
    if (
      !Number.isInteger(priority?.rankedChainCount) ||
      priority.rankedChainCount < 0
    ) {
      errors.push(`${label}: invalid rankedChainCount`);
    }
    if (
      !Number.isFinite(priority?.maxChainTvl) ||
      priority.maxChainTvl < 0
    ) {
      errors.push(`${label}: invalid maxChainTvl`);
    }

    if (protocol?.target != null) {
      if (
        typeof protocol.target !== 'object' ||
        Array.isArray(protocol.target)
      ) {
        errors.push(`${label}: target must be an object`);
      } else {
        const unknownTargetKeys = Object.keys(protocol.target).filter(
          (key) => !['resolvedDappUrl', 'urlOverride'].includes(key),
        );
        if (unknownTargetKeys.length > 0) {
          errors.push(
            `${label}: unsupported target fields: ${unknownTargetKeys.join(
              ', ',
            )}`,
          );
        }
        if (Object.keys(protocol.target).length === 0) {
          errors.push(`${label}: empty target must be omitted`);
        }
        if (
          protocol.target.urlOverride != null &&
          !normalizeUrl(protocol.target.urlOverride).url
        ) {
          errors.push(
            `${label}: target.urlOverride must be an HTTP(S) URL`,
          );
        }
        if (
          protocol.target.resolvedDappUrl != null &&
          !normalizeUrl(protocol.target.resolvedDappUrl).url
        ) {
          errors.push(
            `${label}: target.resolvedDappUrl must be an HTTP(S) URL`,
          );
        }
      }
    }

    const review = protocol?.manualReview;
    if (review == null) {
      continue;
    }
    if (typeof review !== 'object' || Array.isArray(review)) {
      errors.push(`${label}: manualReview must be an object`);
      continue;
    }
    const unknownReviewKeys = Object.keys(review).filter(
      (key) =>
        ![
          'state',
          'reviewedAt',
          'reviewedUrl',
          'injectedBundleSha256',
        ].includes(key),
    );
    if (unknownReviewKeys.length > 0) {
      errors.push(
        `${label}: unsupported manualReview fields: ${unknownReviewKeys.join(
          ', ',
        )}`,
      );
    }
    if (!MANUAL_REVIEW_STATES.has(review.state)) {
      errors.push(`${label}: invalid manualReview.state`);
    }
    if (review.state === 'processed') {
      if (!Number.isFinite(Date.parse(review.reviewedAt || ''))) {
        errors.push(`${label}: processed manual review requires reviewedAt`);
      }
      if (!normalizeUrl(review.reviewedUrl).url) {
        errors.push(`${label}: processed manual review requires reviewedUrl`);
      }
      if (!/^[a-f0-9]{64}$/iu.test(review.injectedBundleSha256 || '')) {
        errors.push(
          `${label}: processed manual review requires injectedBundleSha256`,
        );
      }
    } else if (Object.keys(review).some((key) => key !== 'state')) {
      errors.push(
        `${label}: pending or unsupported review must contain only state`,
      );
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
  const output =
    registry?.kind === 'onekey-custom-protocol-registry'
      ? registry
      : compactRegistry(registry);
  await writeJsonAtomic(file, output);
  return output;
}

export function registryProgress(registry) {
  const selected = registry.protocols;
  const runnable = selected.filter(hasRunnableDapp);
  const counts = {
    selected: selected.length,
    runnable: runnable.length,
    withoutRunnableDapp: selected.length - runnable.length,
    pendingReview: 0,
    processedReview: 0,
    unsupportedReview: 0,
  };
  for (const protocol of selected) {
    const state = protocol.manualReview?.state || 'pending';
    if (state === 'processed') counts.processedReview += 1;
    else if (state === 'unsupported') counts.unsupportedReview += 1;
    else counts.pendingReview += 1;
  }
  return counts;
}
