import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { sha256 } from '../src/lib/http.mjs';
import { buildRankedProtocols, mergeSnapshot } from '../src/lib/registry.mjs';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = path.resolve(packageDir, '../..');
const editor = path.join(packageDir, 'src/cli/custom-injected-registry.mjs');

function runEditor(args) {
  return spawnSync(process.execPath, [editor, ...args], {
    cwd: packageDir,
    encoding: 'utf8',
  });
}

async function makeRegistryFile(directory) {
  const ranked = buildRankedProtocols({
    chains: [{ name: 'Ethereum', tvl: 1_000, chainId: 1 }],
    protocols: [
      {
        id: 'protocol-1',
        name: 'Protocol One',
        url: 'https://protocol.example',
        category: 'Dexes',
        chainTvls: { Ethereum: 100 },
      },
    ],
    topPerChain: 20,
  });
  const registry = mergeSnapshot({
    existing: null,
    selected: ranked.selected,
    chains: ranked.chains,
    source: {
      llmsUrl: 'https://api-docs.defillama.com/llms.txt',
      protocolsUrl: 'https://api.llama.fi/protocols',
      chainsUrl: 'https://api.llama.fi/v2/chains',
      eip155ChainsUrl: 'https://chainid.network/chains.json',
      fetchedAt: '2026-07-30T00:00:00.000Z',
      llmsSha256: 'a'.repeat(64),
      chainsSha256: 'b'.repeat(64),
      protocolsSha256: 'c'.repeat(64),
      eip155ChainsSha256: 'd'.repeat(64),
    },
    now: '2026-07-30T00:00:00.000Z',
  });
  const file = path.join(directory, 'registry.json');
  const text = `${JSON.stringify(registry, null, 2)}\n`;
  await fs.writeFile(file, text);
  return { file, text };
}

test('custom injected editor persists URL and manual review with optimistic locking', async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'custom-injected-registry-'));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  const { file, text } = await makeRegistryFile(directory);

  const urlUpdate = runEditor([
    '--file',
    file,
    '--protocol-id',
    'protocol-1',
    '--expected-sha256',
    sha256(text),
    '--action',
    'set-url',
    '--url',
    'https://app.protocol.example/swap',
  ]);
  assert.equal(urlUpdate.status, 0, urlUpdate.stderr);
  const urlResult = JSON.parse(urlUpdate.stdout);
  assert.equal(urlResult.urlOverride, 'https://app.protocol.example/swap');
  assert.equal(urlResult.manualReview.state, 'pending');

  const updatedText = await fs.readFile(file, 'utf8');
  const reviewUpdate = runEditor([
    '--file',
    file,
    '--protocol-id',
    'protocol-1',
    '--expected-sha256',
    sha256(updatedText),
    '--action',
    'set-review',
    '--state',
    'processed',
    '--reviewed-url',
    'https://app.protocol.example/swap',
    '--bundle-sha256',
    'e'.repeat(64),
  ]);
  assert.equal(reviewUpdate.status, 0, reviewUpdate.stderr);
  const reviewResult = JSON.parse(reviewUpdate.stdout);
  assert.equal(reviewResult.manualReview.state, 'processed');
  assert.equal(reviewResult.manualReview.injectedBundleSha256, 'e'.repeat(64));

  const processedText = await fs.readFile(file, 'utf8');
  const unsupportedUpdate = runEditor([
    '--file',
    file,
    '--protocol-id',
    'protocol-1',
    '--expected-sha256',
    sha256(processedText),
    '--action',
    'set-review',
    '--state',
    'unsupported',
  ]);
  assert.equal(unsupportedUpdate.status, 0, unsupportedUpdate.stderr);
  const unsupportedResult = JSON.parse(unsupportedUpdate.stdout);
  assert.deepEqual(unsupportedResult.manualReview, {
    state: 'unsupported',
  });

  const staleUpdate = runEditor([
    '--file',
    file,
    '--protocol-id',
    'protocol-1',
    '--expected-sha256',
    sha256(updatedText),
    '--action',
    'set-review',
    '--state',
    'pending',
  ]);
  assert.equal(staleUpdate.status, 4);
  assert.match(staleUpdate.stderr, /Registry changed since it was loaded/);
});

test('custom injected editor updates the lightweight custom adapter registry', async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'custom-adapter-registry-'));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'registry.json');
  const registry = {
    schemaVersion: 1,
    kind: 'onekey-custom-protocol-registry',
    source: 'custom',
    protocols: [
      {
        id: 'example',
        name: 'Example',
        slug: 'example',
        active: true,
        category: 'Custom',
        totalTvl: 0,
        sourceUrl: 'https://example.com',
        target: { urlOverride: null, resolvedDappUrl: null },
        manualReview: {
          state: 'pending',
          reviewedAt: null,
          reviewedUrl: null,
          injectedBundleSha256: null,
        },
      },
    ],
  };
  const text = `${JSON.stringify(registry, null, 2)}\n`;
  await fs.writeFile(file, text);

  const result = runEditor([
    '--file',
    file,
    '--protocol-id',
    'example',
    '--expected-sha256',
    sha256(text),
    '--action',
    'set-url',
    '--url',
    'https://app.example.com',
  ]);

  assert.equal(result.status, 0, result.stderr);
  const saved = JSON.parse(await fs.readFile(file, 'utf8'));
  assert.equal(saved.protocols[0].target.urlOverride, 'https://app.example.com');
  assert.equal(saved.protocols[0].manualReview.state, 'pending');
});

test('custom injected manifest exposes only portable workspace paths', async () => {
  const manifest = JSON.parse(
    await fs.readFile(path.join(repoDir, 'onekey-app-custom-injected.json'), 'utf8'),
  );
  assert.equal(manifest.schemaVersion, 3);
  assert.equal(manifest.kind, 'onekey-app-custom-injected');
  assert.deepEqual(
    manifest.protocolSources.map(({ source }) => source),
    ['defillama', 'custom'],
  );
  for (const field of ['desktopPreload', 'dappsDirectory', 'recordingE2EGenerator']) {
    assert.equal(path.isAbsolute(manifest[field]), false);
    assert.equal(manifest[field].includes('..'), false);
  }
  for (const source of manifest.protocolSources) {
    for (const field of ['protocolRegistry', 'registryUpdater']) {
      assert.equal(path.isAbsolute(source[field]), false);
      assert.equal(source[field].includes('..'), false);
    }
    if (source.registryRefresher) {
      assert.equal(path.isAbsolute(source.registryRefresher), false);
      assert.equal(source.registryRefresher.includes('..'), false);
    }
  }
  assert.equal(manifest.dappsDirectory, 'packages/connect-button-workbench/dapps');
  assert.equal(
    manifest.recordingE2EGenerator,
    'packages/connect-button-workbench/src/cli/generate-recording-e2e.mjs',
  );
});
