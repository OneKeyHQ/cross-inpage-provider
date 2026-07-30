import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isCexProtocol } from '../src/lib/registry.mjs';
import {
  detectLocalProviderPackages,
  localProviderForChain,
} from '../src/lib/supported-chains.mjs';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const labDir = path.resolve(currentDir, '..');
const repoDir = path.resolve(labDir, '../..');
const hackDir = path.join(
  repoDir,
  'packages/providers/inpage-providers-hub/src/connectButtonHack',
);
const casesDir = path.join(labDir, 'cases');
const registryFile = path.join(hackDir, 'defillama-protocols.json');
const outputFile = path.join(labDir, 'dist/site-catalog.json');

async function readCases() {
  let files = [];
  try {
    files = (await fs.readdir(casesDir))
      .filter((name) => name.endsWith('.json'))
      .sort();
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const cases = new Map();
  for (const file of files) {
    const definition = JSON.parse(
      await fs.readFile(path.join(casesDir, file), 'utf8'),
    );
    const protocolId = String(definition.protocolId || '');
    if (!protocolId) {
      throw new Error(`Case ${file} does not declare protocolId`);
    }
    if (cases.has(protocolId)) {
      throw new Error(`Multiple cases declare protocol ${protocolId}`);
    }
    cases.set(protocolId, definition);
  }
  return cases;
}

function httpUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function hostname(value) {
  try {
    return (
      new URL(value).hostname.toLowerCase().replace(/^www\./, '') || null
    );
  } catch {
    return null;
  }
}

const registry = JSON.parse(await fs.readFile(registryFile, 'utf8'));
if (!Array.isArray(registry.protocols)) {
  throw new Error('DeFiLlama registry protocols must be an array');
}
const rankingTvlByChain = new Map();
for (const protocol of registry.protocols) {
  for (const ranking of protocol.rankings || []) {
    rankingTvlByChain.set(
      ranking.chain,
      (rankingTvlByChain.get(ranking.chain) || 0) + Number(ranking.chainTvl || 0),
    );
  }
}
const providerPackages = detectLocalProviderPackages();
const supportedChains = (registry.chains || []).flatMap((chain) => {
  const provider = chain.provider
    ? {
        id: chain.provider,
        packageName: chain.providerPackage || null,
      }
    : localProviderForChain(chain, { providerPackages });
  return provider
    ? [
        {
          ...chain,
          provider: provider.id,
          providerPackage: provider.packageName,
        },
      ]
    : [];
});
const chainsByName = new Map(
  supportedChains.map((chain) => [chain.name, chain]),
);
function chainMetadata(name) {
  const chain = chainsByName.get(name);
  if (!chain) return null;
  return {
    name,
    tvl: Number(chain?.tvl || rankingTvlByChain.get(name) || 0),
    isEvm: chain?.isEvm === true,
    provider: chain.provider,
  };
}
const evmChains = supportedChains.filter((chain) => chain.isEvm);
const evmGroupTvl = evmChains.reduce(
  (total, chain) => total + Number(chain.tvl || 0),
  0,
);

function rankedChainDetails(protocol) {
  return (protocol.rankings || [])
    .map((ranking) => {
      const chain = chainMetadata(ranking.chain);
      if (!chain) return null;
      return {
        chain: ranking.chain,
        rank: ranking.rank,
        chainTvl: ranking.chainTvl,
        chainTotalTvl: chain.tvl,
        isEvm: chain.isEvm,
        provider: chain.provider,
      };
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        left.rank - right.rank ||
        right.chainTotalTvl - left.chainTotalTvl ||
        left.chain.localeCompare(right.chain),
    );
}

function chainGroup(rankings) {
  const primary = rankings[0] || null;
  if (!primary) {
    return {
      id: 'other',
      label: 'Other',
      popularityTvl: 0,
      chainCount: 0,
    };
  }
  if (primary.isEvm) {
    return {
      id: 'evm',
      label: 'EVM Networks',
      popularityTvl: evmGroupTvl,
      chainCount: evmChains.length,
    };
  }
  return {
    id: `chain:${primary.chain}`,
    label: primary.chain,
    popularityTvl: primary.chainTotalTvl,
    chainCount: 1,
  };
}

function mergeCatalogRankings(sites) {
  const rankingsByChain = new Map();
  for (const site of sites) {
    for (const ranking of site.rankings) {
      const existing = rankingsByChain.get(ranking.chain);
      if (
        !existing ||
        ranking.rank < existing.rank ||
        (ranking.rank === existing.rank &&
          ranking.chainTvl > existing.chainTvl)
      ) {
        rankingsByChain.set(ranking.chain, ranking);
      }
    }
  }
  return [...rankingsByChain.values()].sort(
    (left, right) =>
      left.rank - right.rank ||
      right.chainTotalTvl - left.chainTotalTvl ||
      left.chain.localeCompare(right.chain),
  );
}

function dedupeCatalogByHostname(sites) {
  const groups = new Map();
  for (const site of sites) {
    const key = site.hostname
      ? `hostname:${site.hostname}`
      : `protocol:${site.protocolId}`;
    const group = groups.get(key) || [];
    group.push(site);
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => {
    const representative = group[0];
    const runnable = group.find((site) => site.testReady) || null;
    const rankings = mergeCatalogRankings(group);
    const primaryRanking = rankings[0] || null;
    const protocolIds = [
      ...new Set(
        group.flatMap((site) => site.protocolIds || [site.protocolId]),
      ),
    ];
    return {
      ...representative,
      url: runnable?.url || representative.url,
      protocolIds,
      duplicateProtocolCount: Math.max(0, protocolIds.length - 1),
      totalTvl: group.reduce(
        (total, site) => total + Number(site.totalTvl || 0),
        0,
      ),
      bestRank: primaryRanking?.rank || representative.bestRank,
      rankedChainCount: rankings.length,
      primaryChain: primaryRanking?.chain || null,
      primaryChainRank: primaryRanking?.rank || null,
      primaryChainTvl: Number(primaryRanking?.chainTvl || 0),
      primaryProvider: primaryRanking?.provider || null,
      chainGroup: chainGroup(rankings),
      rankings,
      testReady: Boolean(runnable),
      caseProtocolId: runnable?.protocolId || null,
      caseDefinition: runnable?.caseDefinition || null,
    };
  });
}

const cases = await readCases();
const catalogCandidates = registry.protocols
  .filter((protocol) => protocol.active && !isCexProtocol(protocol))
  .map((protocol) => {
    const protocolId = String(protocol.id);
    const caseDefinition = cases.get(protocolId) || null;
    const rankings = rankedChainDetails(protocol);
    const primaryRanking = rankings[0] || null;
    const url =
      httpUrl(protocol.target?.urlOverride) ||
      httpUrl(caseDefinition?.url) ||
      httpUrl(protocol.target?.resolvedDappUrl) ||
      httpUrl(protocol.sourceUrl);
    const urlSource = httpUrl(protocol.target?.urlOverride)
      ? 'override'
      : httpUrl(caseDefinition?.url)
        ? 'case'
        : httpUrl(protocol.target?.resolvedDappUrl)
          ? 'resolved'
          : 'defillama';
    return {
      id: protocolId,
      protocolId,
      protocolIds: Array.isArray(protocol.sourceProtocolIds)
        ? protocol.sourceProtocolIds
        : [protocolId],
      slug: protocol.slug,
      name: protocol.name,
      category: protocol.category,
      totalTvl: Number(protocol.totalTvl || 0),
      hostname:
        hostname(protocol.target?.urlOverride) ||
        hostname(caseDefinition?.url) ||
        hostname(protocol.target?.resolvedDappUrl) ||
        protocol.target?.hostname ||
        hostname(protocol.sourceUrl) ||
        protocol.sourceHostname ||
        null,
      url,
      urlSource,
      source: 'defillama',
      bestRank: protocol.priority?.bestRank || null,
      rankedChainCount: protocol.priority?.rankedChainCount || 0,
      primaryChain: primaryRanking?.chain || null,
      primaryChainRank: primaryRanking?.rank || null,
      primaryChainTvl: Number(primaryRanking?.chainTvl || 0),
      primaryProvider: primaryRanking?.provider || null,
      chainGroup: chainGroup(rankings),
      rankings,
      coverageState: protocol.coverage?.state || 'pending',
      coverageOutcome: protocol.coverage?.outcome || null,
      regressionState: protocol.regression?.state || 'not_due',
      regressionOutcome: protocol.regression?.outcome || null,
      manualReview: protocol.manualReview || {
        state: 'pending',
        reviewedAt: null,
        reviewedUrl: null,
        injectedBundleSha256: null,
      },
      needsLlm: protocol.automation?.needsLlm === true,
      automationClassification:
        protocol.automation?.classification || null,
      implementationKind: protocol.implementation?.kind || null,
      testReady: Boolean(caseDefinition && url),
      caseDefinition,
    };
  })
  .filter((site) => site.rankings.length > 0);
const catalog = dedupeCatalogByHostname(catalogCandidates);

await fs.mkdir(path.dirname(outputFile), { recursive: true });
await fs.writeFile(outputFile, `${JSON.stringify(catalog, null, 2)}\n`);

console.log(
  JSON.stringify({
    output: path.relative(repoDir, outputFile),
    source: 'defillama-registry',
    sites: catalog.length,
    testReady: catalog.filter((site) => site.testReady).length,
    supportedChains: supportedChains.length,
    filteredUnsupportedProtocols:
      registry.protocols.filter(
        (protocol) => protocol.active && !isCexProtocol(protocol),
      ).length - catalogCandidates.length,
    deduplicatedHostnames: catalogCandidates.length - catalog.length,
    cycle: registry.cycle,
  }),
);
