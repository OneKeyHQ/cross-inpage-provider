import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { runBatch } from '../src/lib/batch-runner.mjs';
import {
  applyProtocolPatch,
  buildRankedProtocols,
  claimRegistryBatch,
  isCexProtocol,
  mergeSnapshot,
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

test('topPerChain is applied independently instead of as a global protocol limit', () => {
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
  });

  assert.equal(result.stats.rankingSlots, 2);
  assert.deepEqual(
    new Set(result.selected.map((protocol) => protocol.id)),
    new Set(['global-leader', 'solana-leader']),
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
  assert.equal(result.selected[0].totalTvl, 3_000);
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
      ['Near', 'near'],
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

test('registry merge preserves work and creates regression tasks on rollover', async () => {
  const ranked = buildRankedProtocols({ chains, protocols, topPerChain: 2 });
  const first = mergeSnapshot({
    existing: null,
    selected: ranked.selected,
    source,
    topPerChain: 2,
    now: source.fetchedAt,
  });
  const two = first.protocols.find((protocol) => protocol.id === '2');
  two.coverage = {
    ...two.coverage,
    state: 'done',
    outcome: 'native_supported',
    completedAt: source.fetchedAt,
  };
  two.target.hostname = 'app.two.example';
  two.target.urlOverride = 'https://app.two.example/swap';
  two.manualReview = {
    state: 'processed',
    reviewedAt: source.fetchedAt,
    reviewedUrl: 'https://app.two.example/swap',
    injectedBundleSha256: 'e'.repeat(64),
  };

  const second = mergeSnapshot({
    existing: first,
    selected: ranked.selected,
    source: { ...source, fetchedAt: '2026-07-30T00:00:00.000Z' },
    topPerChain: 2,
    startCycle: true,
    now: '2026-07-30T00:00:00.000Z',
  });
  const preserved = second.protocols.find((protocol) => protocol.id === '2');
  assert.equal(second.cycle.number, 2);
  assert.equal(second.cycle.kind, 'regression');
  assert.equal(preserved.target.hostname, 'app.two.example');
  assert.equal(preserved.target.urlOverride, 'https://app.two.example/swap');
  assert.equal(preserved.manualReview.state, 'processed');
  assert.equal(preserved.manualReview.injectedBundleSha256, 'e'.repeat(64));
  assert.equal(preserved.coverage.outcome, 'native_supported');
  assert.equal(preserved.regression.state, 'pending');
  assert.equal(preserved.regression.cycle, 2);
  assert.deepEqual(await validateRegistry(second, { checkFiles: false }), []);
});

test('URL overrides are normalized and reset only the manual review state', async () => {
  const ranked = buildRankedProtocols({ chains, protocols, topPerChain: 2 });
  const registry = mergeSnapshot({
    existing: null,
    selected: ranked.selected,
    source,
    topPerChain: 2,
    now: source.fetchedAt,
  });
  const protocol = registry.protocols[0];
  protocol.manualReview = {
    state: 'processed',
    reviewedAt: source.fetchedAt,
    reviewedUrl: protocol.sourceUrl,
    injectedBundleSha256: 'e'.repeat(64),
  };

  await applyProtocolPatch(
    registry,
    protocol.id,
    {
      target: {
        urlOverride: 'https://app.override.example/swap/',
      },
    },
    { checkFiles: false },
  );

  assert.equal(
    protocol.target.urlOverride,
    'https://app.override.example/swap',
  );
  assert.deepEqual(protocol.manualReview, {
    state: 'pending',
    reviewedAt: null,
    reviewedUrl: null,
    injectedBundleSha256: null,
  });
  assert.deepEqual(await validateRegistry(registry, { checkFiles: false }), []);

  await assert.rejects(
    applyProtocolPatch(
      registry,
      protocol.id,
      { target: { urlOverride: 'file:///tmp/dapp.html' } },
      { checkFiles: false },
    ),
    /must be an HTTP\(S\) URL/,
  );
});

test('hostname representative changes preserve completed alias progress', () => {
  const existing = mergeSnapshot({
    existing: null,
    selected: [
      {
        id: 'legacy',
        name: 'Legacy',
        slug: 'legacy',
        sourceHostname: 'same.example',
        sourceUrl: 'https://same.example/legacy',
        sourceProtocolIds: ['legacy'],
        active: true,
        rankings: [{ chain: 'Ethereum', rank: 1, chainTvl: 100 }],
        priority: { bestRank: 1, rankedChainCount: 1, maxChainTvl: 100 },
      },
    ],
    chains: [],
    source,
    now: source.fetchedAt,
  });
  const legacy = existing.protocols[0];
  legacy.coverage.state = 'done';
  legacy.coverage.outcome = 'native_supported';
  legacy.coverage.completedAt = source.fetchedAt;

  const merged = mergeSnapshot({
    existing,
    selected: [
      {
        id: 'current',
        name: 'Current',
        slug: 'current',
        sourceHostname: 'same.example',
        sourceUrl: 'https://same.example/current',
        sourceProtocolIds: ['current', 'legacy'],
        active: true,
        rankings: [{ chain: 'Ethereum', rank: 1, chainTvl: 200 }],
        priority: { bestRank: 1, rankedChainCount: 1, maxChainTvl: 200 },
      },
    ],
    chains: [],
    source,
    now: '2026-07-30T00:00:00.000Z',
  });
  const current = merged.protocols.find((protocol) => protocol.id === 'current');
  assert.equal(current.coverage.state, 'done');
  assert.equal(current.coverage.outcome, 'native_supported');
  assert.deepEqual(current.sourceProtocolIds, ['current', 'legacy']);
  assert.equal(
    merged.protocols.find((protocol) => protocol.id === 'legacy').active,
    false,
  );
});

test('registry merge removes historical CEX records instead of retaining them inactive', () => {
  const ranked = buildRankedProtocols({ chains, protocols, topPerChain: 2 });
  const existing = mergeSnapshot({
    existing: null,
    selected: ranked.selected,
    source,
    topPerChain: 2,
    now: source.fetchedAt,
  });
  existing.protocols.push({
    ...structuredClone(existing.protocols[0]),
    id: 'legacy-cex',
    category: 'CEX',
    active: false,
    rankings: [],
  });
  const merged = mergeSnapshot({
    existing,
    selected: ranked.selected,
    source,
    topPerChain: 2,
    now: '2026-07-30T00:00:00.000Z',
  });
  assert.ok(!merged.protocols.some((protocol) => protocol.id === 'legacy-cex'));
});

test('claim selects at most the limit and protocol patches enforce E2E evidence', async () => {
  const ranked = buildRankedProtocols({ chains, protocols, topPerChain: 2 });
  const registry = mergeSnapshot({
    existing: null,
    selected: ranked.selected,
    source,
    topPerChain: 2,
    now: source.fetchedAt,
  });
  const claim = claimRegistryBatch(registry, {
    limit: 2,
    runId: 'fixture-run',
    now: '2026-07-29T01:00:00.000Z',
  });
  assert.equal(claim.selected.length, 2);
  assert.ok(claim.selected.every((protocol) => protocol.coverage.state === 'claimed'));
  assert.throws(
    () =>
      claimRegistryBatch(registry, {
        limit: 4,
        runId: 'oversized-run',
        now: '2026-07-29T01:00:00.000Z',
      }),
    /between 1 and 3/,
  );

  await assert.rejects(
    applyProtocolPatch(
      registry,
      claim.selected[0].id,
      {
        coverage: { state: 'done', outcome: 'existing_verified' },
      },
      { checkFiles: false },
    ),
    /requires passed scripted E2E evidence/,
  );
  const invalidVerified = structuredClone(registry);
  const invalid = invalidVerified.protocols.find(
    (candidate) => candidate.id === claim.selected[0].id,
  );
  invalid.coverage.state = 'done';
  invalid.coverage.outcome = 'existing_verified';
  invalid.evidence.lastE2eStatus = 'passed';
  invalid.evidence.scriptedAssertionsPassed = false;
  assert.ok(
    (await validateRegistry(invalidVerified, { checkFiles: false })).some(
      (error) => error.includes('verified coverage requires passed scripted E2E'),
    ),
  );

  const protocol = await applyProtocolPatch(
    registry,
    claim.selected[1].id,
    {
      coverage: { state: 'done', outcome: 'native_supported' },
      automation: {
        classification: 'native_supported',
        confidence: 1,
        needsLlm: false,
      },
    },
    { checkFiles: false },
  );
  assert.equal(protocol.coverage.runId, null);
  assert.equal(protocol.history.length, 1);
});

test('a new machine immediately resumes persisted claims without another attempt', () => {
  const ranked = buildRankedProtocols({ chains, protocols, topPerChain: 2 });
  const registry = mergeSnapshot({
    existing: null,
    selected: ranked.selected,
    source,
    topPerChain: 2,
    now: source.fetchedAt,
  });
  const first = claimRegistryBatch(registry, {
    limit: 2,
    runId: 'machine-a',
    now: '2026-07-29T01:00:00.000Z',
  });
  const attempts = first.selected.map((protocol) => protocol.coverage.attempts);
  const second = claimRegistryBatch(registry, {
    limit: 2,
    runId: 'machine-b',
    now: '2026-07-29T01:01:00.000Z',
  });
  assert.deepEqual(
    second.selected.map((protocol) => protocol.id),
    first.selected.map((protocol) => protocol.id),
  );
  assert.ok(
    second.selected.every((protocol) => protocol.coverage.runId === 'machine-b'),
  );
  assert.deepEqual(
    second.selected.map((protocol) => protocol.coverage.attempts),
    attempts,
  );
});

test('registry rejects machine-local artifact paths', async () => {
  const ranked = buildRankedProtocols({ chains, protocols, topPerChain: 2 });
  const registry = mergeSnapshot({
    existing: null,
    selected: ranked.selected,
    source,
    topPerChain: 2,
    now: source.fetchedAt,
  });
  registry.protocols[0].evidence.screenshots = [
    '/Users/example/project/packages/connect-button-lab/artifacts/failure.png',
  ];
  registry.protocols[1].automation.workPacket =
    'C:\\project\\packages\\connect-button-lab\\.data\\packet.json';
  const errors = await validateRegistry(registry, { checkFiles: false });
  assert.ok(
    errors.some((error) => error.includes('evidence.screenshots must contain portable')),
  );
  assert.ok(
    errors.some((error) => error.includes('automation.workPacket must be a portable')),
  );
});

test('implemented coverage requires its source manifest for future codegen', async () => {
  const ranked = buildRankedProtocols({ chains, protocols, topPerChain: 1 });
  const registry = mergeSnapshot({
    existing: null,
    selected: ranked.selected,
    source,
    topPerChain: 1,
    now: source.fetchedAt,
  });
  const protocol = registry.protocols[0];
  protocol.coverage.state = 'done';
  protocol.coverage.outcome = 'implemented_verified';
  protocol.evidence.lastE2eStatus = 'passed';
  protocol.evidence.scriptedAssertionsPassed = true;
  protocol.implementation.kind = 'generated';
  protocol.implementation.adapterFile = 'package.json';
  protocol.implementation.caseFile = 'package.json';
  protocol.implementation.manifestFile =
    'packages/connect-button-lab/manifests/missing.json';
  const errors = await validateRegistry(registry);
  assert.ok(errors.some((error) => error.includes('manifestFile does not exist')));
});

test('build failure does not persist newly claimed work', async (context) => {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'connect-button-lab-registry-'),
  );
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'registry.json');
  const ranked = buildRankedProtocols({ chains, protocols, topPerChain: 1 });
  const registry = mergeSnapshot({
    existing: null,
    selected: ranked.selected,
    source,
    topPerChain: 1,
    now: source.fetchedAt,
  });
  await fs.writeFile(file, `${JSON.stringify(registry, null, 2)}\n`);

  await assert.rejects(
    runBatch({
      file,
      limit: 1,
      runId: 'failed-build',
      allowSync: false,
      build: async () => {
        throw new Error('fixture build failure');
      },
    }),
    /fixture build failure/,
  );
  const saved = JSON.parse(await fs.readFile(file, 'utf8'));
  assert.equal(saved.protocols[0].coverage.state, 'pending');
  assert.equal(saved.protocols[0].coverage.runId, null);
});
