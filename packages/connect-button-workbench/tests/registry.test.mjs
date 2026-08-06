import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyDappResolutions,
  applyProtocolPatch,
  buildRankedProtocols,
  compactRegistry,
  documentAdvertisesUrl,
  hasRunnableDapp,
  isCexProtocol,
  mergeSnapshot,
  registryProgress,
  validateDappResolutionConfig,
  validateRegistry,
} from '../src/lib/registry.mjs';
import {
  detectLocalProviderPackages,
  filterLocalProviderChains,
} from '../src/lib/supported-chains.mjs';

const chains = [
  { name: 'Ethereum', tvl: 1_000, chainId: 1 },
  { name: 'Arbitrum', tvl: 800, chainId: 42161 },
  { name: 'Solana', tvl: 900 },
];
const protocols = [
  {
    id: '10',
    slug: 'ten',
    name: 'Ten',
    url: 'https://ten.example/',
    category: 'Dexes',
    chainTvls: { Ethereum: 100, Arbitrum: 5, 'Ethereum-borrowed': 1000 },
  },
  {
    id: '2',
    slug: 'two',
    name: 'Two',
    url: 'https://www.two.example',
    category: 'Lending',
    chainTvls: { Ethereum: 100, Arbitrum: 200 },
  },
  {
    id: '3',
    slug: 'three',
    name: 'Three',
    url: null,
    category: null,
    chainTvls: { Ethereum: 50, Arbitrum: 0 },
  },
];

const source = {
  llmsUrl: 'https://api-docs.defillama.com/llms.txt',
  protocolsUrl: 'https://api.llama.fi/protocols',
  chainsUrl: 'https://api.llama.fi/v2/chains',
  eip155ChainsUrl: 'https://chainid.network/chains.json',
  fetchedAt: '2026-07-29T00:00:00.000Z',
  llmsSha256: 'a'.repeat(64),
  chainsSha256: 'b'.repeat(64),
  protocolsSha256: 'c'.repeat(64),
  eip155ChainsSha256: 'd'.repeat(64),
};

test('llms URL discovery requires an exact parsed API URL', () => {
  const expected = 'https://api.llama.fi/protocols';
  assert.equal(
    documentAdvertisesUrl(`Protocol endpoint: ${expected}.`, expected),
    true,
  );
  for (const bypass of [
    'https://evil.example/https://api.llama.fi/protocols',
    'https://evil.example/?next=https://api.llama.fi/protocols',
    'https://api.llama.fi.evil.example/protocols',
    'https://api.llama.fi@evil.example/protocols',
  ]) {
    assert.equal(documentAdvertisesUrl(bypass, expected), false, bypass);
  }
});

test('per-chain ranking is deterministic and ignores derived chain keys', () => {
  const result = buildRankedProtocols({ chains, protocols, topPerChain: 2 });
  assert.equal(result.stats.rankingSlots, 4);
  assert.equal(result.stats.uniqueProtocols, 2);
  const ethereum = result.selected
    .flatMap((protocol) =>
      protocol.rankings
        .filter((ranking) => ranking.chain === 'Ethereum')
        .map((ranking) => ({ id: protocol.id, rank: ranking.rank })),
    )
    .sort((left, right) => left.rank - right.rank);
  assert.deepEqual(ethereum, [
    { id: '2', rank: 1 },
    { id: '10', rank: 2 },
  ]);
  assert.deepEqual(
    result.chains.map(({ name, isEvm }) => ({ name, isEvm })),
    [
      { name: 'Ethereum', isEvm: true },
      { name: 'Solana', isEvm: false },
      { name: 'Arbitrum', isEvm: true },
    ],
  );
  assert.equal(result.selected.find((protocol) => protocol.id === '2').sourceHostname, 'two.example');
});

test('global TVL and per-chain TVL selections are unioned without fake chain rankings', () => {
  const result = buildRankedProtocols({
    chains,
    protocols: [
      {
        id: 'global-leader',
        name: 'Global Leader',
        tvl: 1_000,
        url: 'https://global-leader.example',
        chainTvls: { Ethereum: 100, Solana: 10 },
      },
      {
        id: 'ethereum-second',
        name: 'Ethereum Second',
        tvl: 900,
        url: 'https://ethereum-second.example',
        chainTvls: { Ethereum: 90 },
      },
      {
        id: 'solana-leader',
        name: 'Solana Leader',
        tvl: 800,
        url: 'https://solana-leader.example',
        chainTvls: { Solana: 200 },
      },
    ],
    topPerChain: 1,
    globalTop: 2,
  });

  assert.equal(result.stats.globalRankingSlots, 2);
  assert.equal(result.stats.rankingSlots, 2);
  assert.deepEqual(
    new Set(result.selected.map((protocol) => protocol.id)),
    new Set(['global-leader', 'ethereum-second', 'solana-leader']),
  );
  assert.equal(
    result.selected.find((protocol) => protocol.id === 'global-leader')
      .globalRank,
    1,
  );
  assert.equal(
    result.selected.find((protocol) => protocol.id === 'ethereum-second')
      .globalRank,
    2,
  );
  assert.deepEqual(
    result.selected.find((protocol) => protocol.id === 'ethereum-second')
      .rankings,
    [],
  );
  assert.equal(
    result.selected.find((protocol) => protocol.id === 'solana-leader')
      .globalRank,
    null,
  );
  assert.deepEqual(
    result.selected
      .flatMap((protocol) =>
        protocol.rankings.map((ranking) => ({
          chain: ranking.chain,
          id: protocol.id,
          rank: ranking.rank,
        })),
      )
      .sort((left, right) => left.chain.localeCompare(right.chain)),
    [
      { chain: 'Ethereum', id: 'global-leader', rank: 1 },
      { chain: 'Solana', id: 'solana-leader', rank: 1 },
    ],
  );
});

test('protocols sharing a hostname become one site with merged chain rankings', () => {
  const result = buildRankedProtocols({
    chains,
    protocols: [
      {
        id: '101',
        name: 'Same Site Ethereum',
        tvl: 1_000,
        url: 'https://app.same.example/ethereum',
        chainTvls: { Ethereum: 100 },
      },
      {
        id: '102',
        name: 'Same Site Multichain',
        tvl: 2_000,
        url: 'https://app.same.example/solana',
        chainTvls: { Ethereum: 90, Solana: 200 },
      },
    ],
    topPerChain: 20,
  });
  assert.equal(result.selected.length, 1);
  assert.equal(result.selected[0].sourceHostname, 'app.same.example');
  assert.equal(result.selected[0].totalTvl, 2_000);
  assert.deepEqual(result.selected[0].sourceProtocolIds, ['101', '102']);
  assert.deepEqual(
    result.selected[0].rankings.map(({ chain, rank }) => ({ chain, rank })),
    [
      { chain: 'Ethereum', rank: 1 },
      { chain: 'Solana', rank: 1 },
    ],
  );
  assert.equal(result.stats.rankedProtocols, 2);
  assert.equal(result.stats.deduplicatedProtocols, 1);
});

test('EIP-155 metadata fills DeFiLlama EVM chainId gaps', () => {
  const result = buildRankedProtocols({
    chains: [
      { name: 'X Layer', tvl: 100 },
      { name: 'Tron', tvl: 50 },
    ],
    eip155Chains: [
      {
        name: 'X Layer Mainnet',
        chainId: 196,
        nativeCurrency: { decimals: 18 },
      },
      {
        name: 'X Layer Testnet',
        chainId: 1952,
        nativeCurrency: { decimals: 18 },
      },
      {
        name: 'Tron Mainnet',
        chainId: 728126428,
        nativeCurrency: { decimals: 6 },
      },
    ],
    protocols: [
      {
        id: 'x-layer-app',
        name: 'X Layer App',
        chainTvls: { 'X Layer': 10 },
      },
      {
        id: 'tron-app',
        name: 'Tron App',
        chainTvls: { Tron: 10 },
      },
    ],
    topPerChain: 1,
  });
  assert.deepEqual(result.chains, [
    {
      name: 'X Layer',
      tvl: 100,
      chainId: 196,
      isEvm: true,
      provider: 'ethereum',
      providerPackage: '@onekeyfe/onekey-eth-provider',
    },
    {
      name: 'Tron',
      tvl: 50,
      chainId: null,
      isEvm: false,
      provider: 'tron',
      providerPackage: '@onekeyfe/onekey-tron-provider',
    },
  ]);
});

test('provider aliases rank protocol TVL and add supported chains missing from the chains API', () => {
  const result = buildRankedProtocols({
    chains: [{ name: 'CosmosHub', tvl: 1_000 }],
    protocols: [
      {
        id: 'cosmos-app',
        name: 'Cosmos App',
        url: 'https://cosmos.example',
        chainTvls: { Cosmos: 120 },
      },
      {
        id: 'polkadot-app',
        name: 'Polkadot App',
        url: 'https://polkadot.example',
        chainTvls: {
          Polkadot: 80,
          'Polkadot-borrowed': 800,
        },
      },
      {
        id: 'polkadot-cex',
        name: 'Polkadot CEX',
        category: 'CEX',
        url: 'https://polkadot-cex.example',
        chainTvls: { Polkadot: 10_000 },
      },
    ],
    topPerChain: 20,
  });

  assert.deepEqual(
    result.chains.map((chain) => ({
      name: chain.name,
      tvl: chain.tvl,
      provider: chain.provider,
    })),
    [
      { name: 'CosmosHub', tvl: 1_000, provider: 'cosmos' },
      { name: 'Polkadot', tvl: 80, provider: 'polkadot' },
    ],
  );
  assert.deepEqual(
    result.selected
      .flatMap((protocol) =>
        protocol.rankings.map((ranking) => ({
          id: protocol.id,
          chain: ranking.chain,
          chainTvl: ranking.chainTvl,
        })),
      )
      .sort((left, right) => left.chain.localeCompare(right.chain)),
    [
      { id: 'cosmos-app', chain: 'CosmosHub', chainTvl: 120 },
      { id: 'polkadot-app', chain: 'Polkadot', chainTvl: 80 },
    ],
  );
  assert.equal(result.stats.supplementalChains, 1);
  assert.equal(result.stats.aliasedProtocolChainKeys, 1);
  assert.equal(result.stats.excludedCexProtocols, 1);
});

test('protocol TVL cannot add an ambiguous EVM chain without DeFiLlama chain metadata', () => {
  const result = buildRankedProtocols({
    chains: [],
    eip155Chains: [
      {
        name: 'Example Chain Mainnet',
        chainId: 7654321,
        nativeCurrency: { decimals: 18 },
      },
    ],
    protocols: [
      {
        id: 'example-chain-app',
        name: 'Example Chain App',
        chainTvls: { 'Example Chain': 25 },
      },
    ],
    topPerChain: 20,
  });

  assert.deepEqual(result.chains, []);
  assert.deepEqual(result.selected, []);
  assert.equal(result.stats.sourceChains, 0);
  assert.equal(result.stats.supplementalChains, 0);
});

test('EVM chain aliases sharing a chainId are ranked as one canonical chain', () => {
  const result = buildRankedProtocols({
    chains: [
      { name: 'BSC', tvl: 1_000, chainId: 56 },
      { name: 'Binance', tvl: 0, chainId: 56 },
    ],
    protocols: [
      {
        id: 'bsc-app',
        name: 'BSC App',
        chainTvls: { BSC: 100 },
      },
      {
        id: 'binance-app',
        name: 'Binance App',
        chainTvls: { Binance: 90 },
      },
    ],
    topPerChain: 20,
  });

  assert.deepEqual(
    result.chains.map(({ name, chainId }) => ({ name, chainId })),
    [{ name: 'BSC', chainId: 56 }],
  );
  assert.deepEqual(
    result.selected.map((protocol) => ({
      id: protocol.id,
      chain: protocol.rankings[0].chain,
      rank: protocol.rankings[0].rank,
    })),
    [
      { id: 'bsc-app', chain: 'BSC', rank: 1 },
      { id: 'binance-app', chain: 'BSC', rank: 2 },
    ],
  );
  assert.equal(result.stats.chains, 1);
  assert.equal(result.stats.rankingSlots, 2);
});

test('chains without a local provider package are filtered before ranking', () => {
  const ethereumProvider = '@onekeyfe/onekey-eth-provider';
  const result = buildRankedProtocols({
    chains: [
      { name: 'Ethereum', tvl: 1_000, chainId: 1 },
      { name: 'Starknet', tvl: 900 },
      { name: 'Solana', tvl: 800 },
    ],
    protocols: [
      {
        id: 'evm-app',
        name: 'EVM App',
        chainTvls: { Ethereum: 100 },
      },
      {
        id: 'starknet-app',
        name: 'Starknet App',
        chainTvls: { Starknet: 90 },
      },
      {
        id: 'solana-app',
        name: 'Solana App',
        chainTvls: { Solana: 80 },
      },
    ],
    providerPackages: new Set([ethereumProvider]),
    topPerChain: 20,
  });
  assert.deepEqual(
    result.chains.map((chain) => ({
      name: chain.name,
      provider: chain.provider,
    })),
    [{ name: 'Ethereum', provider: 'ethereum' }],
  );
  assert.deepEqual(result.selected.map((protocol) => protocol.id), ['evm-app']);
  assert.equal(result.stats.sourceChains, 3);
  assert.equal(result.stats.chains, 1);
  assert.equal(result.stats.excludedUnsupportedChains, 2);
});

test('supported non-EVM chains require a matching provider package in the repository', () => {
  const providerPackages = detectLocalProviderPackages();
  const supported = filterLocalProviderChains(
    [
      { name: 'Solana', isEvm: false },
      { name: 'Tron', isEvm: false },
      { name: 'Near', isEvm: false },
      { name: 'Starknet', isEvm: false },
    ],
    { providerPackages },
  );
  assert.deepEqual(
    supported.map((chain) => [chain.name, chain.provider]),
    [
      ['Solana', 'solana'],
      ['Tron', 'tron'],
    ],
  );
});

test('CEX protocols are filtered before each chain takes its top TVL slots', () => {
  const result = buildRankedProtocols({
    chains,
    protocols: [
      {
        id: 'cex-1',
        slug: 'centralized',
        name: 'Centralized Exchange',
        url: 'https://cex.example',
        category: 'CEX',
        chainTvls: { Ethereum: 10000, Arbitrum: 10000 },
      },
      ...protocols,
    ],
    topPerChain: 2,
  });
  assert.equal(result.stats.excludedCexProtocols, 1);
  assert.equal(result.stats.rankingSlots, 4);
  assert.ok(!result.selected.some(isCexProtocol));
  assert.ok(!result.selected.some((protocol) => protocol.id === 'cex-1'));
});

test('unavailable DeFiLlama DApps are excluded before global and chain ranking', () => {
  const result = buildRankedProtocols({
    chains,
    protocols: [
      {
        id: 'dead-url',
        name: 'Dead URL',
        tvl: 10_000,
        url: '',
        deadUrl: true,
        chainTvls: { Ethereum: 10_000 },
      },
      {
        id: 'rugged',
        name: 'Rugged',
        tvl: 9_000,
        url: 'https://rugged.example',
        rugged: true,
        chainTvls: { Ethereum: 9_000 },
      },
      {
        id: 'live',
        name: 'Live',
        tvl: 100,
        url: 'https://live.example',
        chainTvls: { Ethereum: 100 },
      },
      {
        id: 'unresolved',
        name: 'Unresolved',
        tvl: 90,
        url: '',
        chainTvls: { Ethereum: 90 },
      },
    ],
    topPerChain: 1,
    globalTop: 2,
  });

  assert.equal(result.stats.excludedUnavailableProtocols, 2);
  assert.deepEqual(
    new Set(result.selected.map((protocol) => protocol.id)),
    new Set(['live', 'unresolved']),
  );
  assert.deepEqual(
    result.selected.find((protocol) => protocol.id === 'live').sourceDapp,
    {
      status: 'available',
      reason: 'defillama_url',
      deadFrom: null,
    },
  );
  assert.deepEqual(
    result.selected.find((protocol) => protocol.id === 'unresolved')
      .sourceDapp,
    {
      status: 'unresolved',
      reason: 'defillama_missing_url',
      deadFrom: null,
    },
  );
});

test('curated DApp resolutions are compact and unresolved protocols stay non-runnable', async () => {
  const ranked = buildRankedProtocols({
    chains,
    protocols: [
      {
        id: 'resolved',
        slug: 'resolved',
        name: 'Resolved',
        tvl: 30,
        url: null,
        chainTvls: { Ethereum: 30 },
      },
      {
        id: 'service',
        slug: 'service',
        name: 'Service',
        tvl: 20,
        url: null,
        chainTvls: { Ethereum: 20 },
      },
      {
        id: 'missing',
        slug: 'missing',
        name: 'Missing',
        tvl: 10,
        url: null,
        chainTvls: { Ethereum: 10 },
      },
    ],
    topPerChain: 3,
    globalTop: 3,
  });
  const registry = mergeSnapshot({
    existing: null,
    selected: ranked.selected,
    source,
    topPerChain: 3,
    globalTop: 3,
  });
  const config = {
    schemaVersion: 1,
    protocols: [
      {
        protocolId: 'resolved',
        protocolSlug: 'resolved',
        status: 'resolved',
        url: 'https://app.resolved.example/',
        evidenceUrl: 'https://resolved.example/',
        verifiedAt: source.fetchedAt,
      },
      {
        protocolId: 'service',
        protocolSlug: 'service',
        status: 'no_runnable_dapp',
        reason: 'institutional_service',
        evidenceUrl: 'https://service.example/',
        verifiedAt: source.fetchedAt,
      },
    ],
  };

  assert.deepEqual(validateDappResolutionConfig(config), []);
  const stats = applyDappResolutions(registry, config);
  const compacted = compactRegistry(registry);
  const resolved = compacted.protocols.find(
    (protocol) => protocol.id === 'resolved',
  );
  const service = compacted.protocols.find(
    (protocol) => protocol.id === 'service',
  );
  const missing = compacted.protocols.find(
    (protocol) => protocol.id === 'missing',
  );

  assert.equal(resolved.target.resolvedDappUrl, 'https://app.resolved.example');
  assert.equal(service.target, undefined);
  assert.equal(missing.target, undefined);
  assert.equal(hasRunnableDapp(resolved), true);
  assert.equal(hasRunnableDapp(service), false);
  assert.equal(hasRunnableDapp(missing), false);
  assert.deepEqual(stats, {
    configured: 2,
    matched: 2,
    resolved: 1,
    noRunnableDapp: 1,
    reviewedUnresolved: 0,
    selectedWithoutRunnableDapp: 2,
  });
  assert.deepEqual(registryProgress(compacted), {
    selected: 3,
    runnable: 1,
    withoutRunnableDapp: 2,
    pendingReview: 3,
    processedReview: 0,
    unsupportedReview: 0,
  });
  assert.deepEqual(await validateRegistry(compacted), []);
});

test('registry refresh preserves only persistent Desktop state and drops old selections', async () => {
  const ranked = buildRankedProtocols({ chains, protocols, topPerChain: 2 });
  const first = mergeSnapshot({
    existing: null,
    selected: ranked.selected,
    source,
    topPerChain: 2,
  });
  const preserved = first.protocols.find((protocol) => protocol.id === '2');
  preserved.target = { urlOverride: 'https://app.two.example/swap' };
  preserved.manualReview = {
    state: 'processed',
    reviewedAt: source.fetchedAt,
    reviewedUrl: 'https://app.two.example/swap',
    injectedBundleSha256: 'e'.repeat(64),
  };
  preserved.coverage = { state: 'done' };
  preserved.history = [{ at: source.fetchedAt }];

  const selected = ranked.selected.filter((protocol) => protocol.id === '2');
  const refreshed = mergeSnapshot({
    existing: first,
    selected,
    source: { ...source, fetchedAt: '2026-07-30T00:00:00.000Z' },
    topPerChain: 2,
  });
  const protocol = refreshed.protocols[0];

  assert.deepEqual(refreshed.protocols.map(({ id }) => id), ['2']);
  assert.equal(protocol.target.urlOverride, 'https://app.two.example/swap');
  assert.equal(protocol.manualReview.state, 'processed');
  assert.equal(protocol.coverage, undefined);
  assert.equal(protocol.history, undefined);
  assert.equal(protocol.active, undefined);
  assert.deepEqual(await validateRegistry(refreshed), []);
});

test('URL overrides are normalized and reset only manual review state', async () => {
  const ranked = buildRankedProtocols({ chains, protocols, topPerChain: 2 });
  const registry = mergeSnapshot({
    existing: null,
    selected: ranked.selected,
    source,
    topPerChain: 2,
  });
  const protocol = registry.protocols[0];
  protocol.manualReview = {
    state: 'processed',
    reviewedAt: source.fetchedAt,
    reviewedUrl: protocol.sourceUrl,
    injectedBundleSha256: 'e'.repeat(64),
  };

  await applyProtocolPatch(registry, protocol.id, {
    target: {
      urlOverride: 'https://app.override.example/swap/',
    },
  });

  assert.equal(
    protocol.target.urlOverride,
    'https://app.override.example/swap',
  );
  assert.equal(protocol.manualReview, undefined);
  assert.deepEqual(await validateRegistry(registry), []);

  await assert.rejects(
    applyProtocolPatch(registry, protocol.id, {
      target: { urlOverride: 'file:///tmp/dapp.html' },
    }),
    /must be an HTTP\(S\) URL/,
  );
});

test('unsupported manual review survives registry refresh', async () => {
  const ranked = buildRankedProtocols({ chains, protocols, topPerChain: 2 });
  const first = mergeSnapshot({
    existing: null,
    selected: ranked.selected,
    source,
    topPerChain: 2,
  });
  const protocol = first.protocols[0];
  protocol.manualReview = { state: 'unsupported' };

  const refreshed = mergeSnapshot({
    existing: first,
    selected: ranked.selected,
    source: { ...source, fetchedAt: '2026-07-30T00:00:00.000Z' },
    topPerChain: 2,
  });
  const preserved = refreshed.protocols.find(
    (candidate) => candidate.id === protocol.id,
  );

  assert.deepEqual(preserved.manualReview, { state: 'unsupported' });
  assert.deepEqual(await validateRegistry(refreshed), []);
});

test('hostname representative changes preserve persistent alias state only', async () => {
  const priority = {
    globalRank: 1,
    bestRank: 1,
    rankedChainCount: 1,
    maxChainTvl: 100,
  };
  const existing = mergeSnapshot({
    existing: null,
    selected: [
      {
        id: 'legacy',
        name: 'Legacy',
        slug: 'legacy',
        sourceUrl: 'https://same.example/legacy',
        sourceProtocolIds: ['legacy'],
        totalTvl: 100,
        priority,
      },
    ],
    source,
  });
  existing.protocols[0].target = {
    urlOverride: 'https://same.example/app',
  };
  existing.protocols[0].manualReview = {
    state: 'processed',
    reviewedAt: source.fetchedAt,
    reviewedUrl: 'https://same.example/app',
    injectedBundleSha256: 'e'.repeat(64),
  };

  const merged = mergeSnapshot({
    existing,
    selected: [
      {
        id: 'current',
        name: 'Current',
        slug: 'current',
        sourceUrl: 'https://same.example/current',
        sourceProtocolIds: ['current', 'legacy'],
        totalTvl: 200,
        priority: { ...priority, maxChainTvl: 200 },
      },
    ],
    source: { ...source, fetchedAt: '2026-07-30T00:00:00.000Z' },
  });
  const current = merged.protocols[0];

  assert.equal(current.id, 'current');
  assert.equal(current.target.urlOverride, 'https://same.example/app');
  assert.equal(current.manualReview.state, 'processed');
  assert.deepEqual(current.sourceProtocolIds, ['current', 'legacy']);
  assert.equal(merged.protocols.some(({ id }) => id === 'legacy'), false);
  assert.deepEqual(await validateRegistry(merged), []);
});

test('registry compaction removes legacy workflow fields', async () => {
  const ranked = buildRankedProtocols({ chains, protocols, topPerChain: 2 });
  const registry = mergeSnapshot({
    existing: null,
    selected: ranked.selected,
    source,
    topPerChain: 2,
  });
  registry.protocols[0] = {
    ...registry.protocols[0],
    active: true,
    coverage: { state: 'pending' },
    implementation: {},
    automation: {},
    evidence: {},
    regression: {},
    history: [],
    rankings: [{ chain: 'Ethereum', rank: 1, chainTvl: 100 }],
  };
  registry.chains = [{ name: 'Ethereum' }];
  registry.cycle = { number: 1 };

  const compacted = compactRegistry(registry);
  assert.deepEqual(Object.keys(compacted), [
    'schemaVersion',
    'source',
    'settings',
    'protocols',
  ]);
  assert.deepEqual(
    Object.keys(compacted.protocols[0]).sort(),
    [
      'id',
      'name',
      'priority',
      'slug',
      'sourceUrl',
      'totalTvl',
    ],
  );
  assert.deepEqual(await validateRegistry(compacted), []);
});

test('registry patches and validation reject removed workflow fields', async () => {
  const ranked = buildRankedProtocols({ chains, protocols, topPerChain: 2 });
  const registry = mergeSnapshot({
    existing: null,
    selected: ranked.selected,
    source,
    topPerChain: 2,
  });

  await assert.rejects(
    applyProtocolPatch(registry, registry.protocols[0].id, {
      coverage: { state: 'done' },
    }),
    /Unsupported patch keys: coverage/,
  );

  const legacy = structuredClone(registry);
  legacy.protocols[0].active = true;
  legacy.protocols[0].coverage = { state: 'pending' };
  const errors = await validateRegistry(legacy);
  assert.ok(
    errors.some((error) =>
      error.includes('unsupported fields: active, coverage'),
    ),
  );
});
