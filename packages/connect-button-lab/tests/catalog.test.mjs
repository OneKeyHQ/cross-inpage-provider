import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { isCexProtocol } from '../src/lib/registry.mjs';
import {
  detectLocalProviderPackages,
  localProviderForChain,
} from '../src/lib/supported-chains.mjs';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryFile = path.resolve(
  packageDir,
  '../providers/inpage-providers-hub/src/connectButtonHack/defillama-protocols.json',
);

test('catalog is generated only from active DeFiLlama registry protocols', async () => {
  const build = spawnSync(process.execPath, ['scripts/build-catalog.mjs'], {
    cwd: packageDir,
    encoding: 'utf8',
  });
  assert.equal(build.status, 0, build.stderr);

  const catalog = JSON.parse(
    await fs.readFile(path.join(packageDir, 'dist/site-catalog.json'), 'utf8'),
  );
  const registry = JSON.parse(await fs.readFile(registryFile, 'utf8'));
  const providerPackages = detectLocalProviderPackages();
  const supportedChainNames = new Set(
    (registry.chains || [])
      .filter((chain) =>
        localProviderForChain(chain, { providerPackages }),
      )
      .map((chain) => chain.name),
  );
  const active = registry.protocols.filter(
    (protocol) =>
      protocol.active &&
      !isCexProtocol(protocol) &&
      protocol.rankings.some((ranking) =>
        supportedChainNames.has(ranking.chain),
      ),
  );

  assert.ok(catalog.length <= active.length);
  assert.deepEqual(
    catalog
      .flatMap((site) => site.protocolIds)
      .sort((left, right) => left.localeCompare(right, 'en', { numeric: true })),
    active
      .map((protocol) => String(protocol.id))
      .sort((left, right) => left.localeCompare(right, 'en', { numeric: true })),
    'hostname groups must preserve every eligible DeFiLlama protocol ID',
  );
  assert.equal(
    new Set(catalog.map((site) => site.id)).size,
    catalog.length,
    'protocol IDs must be unique',
  );
  assert.ok(catalog.every((site) => site.source === 'defillama'));
  assert.ok(!catalog.some((site) => isCexProtocol(site)));
  assert.ok(!catalog.some((site) => site.id === 'lab-demo'));
  assert.equal(
    new Set(catalog.map((site) => site.hostname).filter(Boolean)).size,
    catalog.filter((site) => site.hostname).length,
    'resolved hostnames must be unique in the Dashboard catalog',
  );
  assert.ok(
    catalog.every(
      (site) =>
        site.rankings.length > 0 &&
        site.rankings.every((ranking) =>
          supportedChainNames.has(ranking.chain),
        ) &&
        site.primaryProvider,
    ),
    'catalog rankings must only reference chains backed by a local injected provider',
  );
  assert.ok(
    catalog.every(
      (site) =>
        site.chainGroup?.id &&
        site.chainGroup?.label &&
        Number.isFinite(site.chainGroup?.popularityTvl) &&
        Array.isArray(site.rankings),
    ),
    'each site must include deterministic dashboard chain grouping metadata',
  );
  assert.ok(
    catalog.every(
      (site) =>
        !site.primaryChain ||
        site.rankings.some(
          (ranking) =>
            ranking.chain === site.primaryChain &&
            ranking.rank === site.primaryChainRank &&
            ranking.chainTvl === site.primaryChainTvl,
        ),
    ),
    'primary chain rank and TVL must come from the protocol rankings',
  );
  assert.ok(
    catalog.every(
      (site) =>
        Number.isFinite(site.totalTvl) &&
        site.totalTvl >= 0 &&
        Number.isFinite(site.primaryChainTvl) &&
        site.primaryChainTvl > 0,
    ),
    'each site must expose numeric TVL fields for the Dashboard',
  );
  assert.ok(
    catalog
      .filter((site) => site.url)
      .every(
        (site) =>
          new URL(site.url).hostname.toLowerCase().replace(/^www\./, '') ===
          site.hostname,
      ),
    'resolved catalog URLs must match their hostnames',
  );
  assert.ok(
    catalog.every(
      (site) =>
        site.testReady === Boolean(site.caseDefinition && site.url) &&
        (!site.caseDefinition ||
          (String(site.caseDefinition.protocolId) === site.caseProtocolId &&
            site.protocolIds.includes(site.caseProtocolId))),
    ),
    'test readiness must come from a case owned by the hostname group',
  );
});
