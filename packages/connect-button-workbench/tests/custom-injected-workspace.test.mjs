import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  inspectCustomInjectedWorkspace,
  isSafeCustomInjectedUrl,
  parseCustomInjectedProtocols,
} from '../src/lib/custom-injected-workspace.mjs';

function registry(source, protocols) {
  return `${JSON.stringify({
    schemaVersion: 1,
    kind: 'onekey-custom-protocol-registry',
    source,
    protocols,
  })}\n`;
}

async function createWorkspace() {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'onekey-custom-injected-workspace-'));
  await fs.mkdir(path.join(workspace, 'config'));
  await fs.mkdir(path.join(workspace, 'dapps'));
  await fs.mkdir(path.join(workspace, 'tools'));
  await Promise.all([
    fs.writeFile(path.join(workspace, 'preload.js'), 'console.log("preload");'),
    fs.writeFile(path.join(workspace, 'tools/update.mjs'), 'process.exit(0);'),
    fs.writeFile(path.join(workspace, 'tools/generate.mjs'), 'process.exit(0);'),
    fs.writeFile(
      path.join(workspace, 'config/defillama.json'),
      registry('defillama', [
        {
          id: 'low-rank',
          name: 'Low Rank',
          slug: 'low-rank',
          active: true,
          totalTvl: 10,
          priority: { bestRank: 1 },
          sourceUrl: 'https://low-rank.example',
        },
        {
          id: 'high-tvl',
          name: 'High TVL',
          slug: 'high-tvl',
          active: true,
          totalTvl: 20,
          priority: { bestRank: 10 },
          sourceUrl: 'https://high-tvl.example',
        },
      ]),
    ),
    fs.writeFile(
      path.join(workspace, 'config/custom.json'),
      registry('custom', [
        {
          id: 'high-tvl',
          name: 'Custom High TVL',
          slug: 'custom-high-tvl',
          active: true,
          totalTvl: 30,
          sourceUrl: 'https://custom-high-tvl.example',
          manualReview: { state: 'unsupported' },
        },
      ]),
    ),
    fs.writeFile(
      path.join(workspace, 'manifest.json'),
      JSON.stringify({
        schemaVersion: 3,
        kind: 'onekey-app-custom-injected',
        protocolSources: [
          {
            source: 'defillama',
            protocolRegistry: 'config/defillama.json',
            registryUpdater: 'tools/update.mjs',
          },
          {
            source: 'custom',
            protocolRegistry: 'config/custom.json',
            registryUpdater: 'tools/update.mjs',
          },
        ],
        desktopPreload: 'preload.js',
        dappsDirectory: 'dapps',
        recordingE2EGenerator: 'tools/generate.mjs',
      }),
    ),
  ]);
  return workspace;
}

test('inspects a versioned workspace and returns a deterministic snapshot', async (context) => {
  const workspace = await createWorkspace();
  context.after(() => fs.rm(workspace, { recursive: true, force: true }));

  const snapshot = await inspectCustomInjectedWorkspace({
    repository: workspace,
    manifest: 'manifest.json',
  });

  assert.equal(snapshot.kind, 'onekey-custom-injection-workspace-snapshot');
  assert.equal(snapshot.desktopPreload, 'preload.js');
  assert.equal(snapshot.recordingE2EGenerator, 'tools/generate.mjs');
  assert.deepEqual(
    snapshot.protocols.map(({ key }) => key),
    ['custom:high-tvl', 'defillama:high-tvl', 'defillama:low-rank'],
  );
  assert.equal(snapshot.protocols[0].manualReview.state, 'unsupported');
  assert.match(snapshot.registrySha256, /^[a-f0-9]{64}$/u);
  assert.match(snapshot.bundleSha256, /^[a-f0-9]{64}$/u);
});

test('filters unsafe and duplicate URLs with the Desktop URL policy', () => {
  assert.equal(isSafeCustomInjectedUrl('https://app.example.com'), true);
  assert.equal(isSafeCustomInjectedUrl('http://app.example.com'), false);
  assert.equal(isSafeCustomInjectedUrl('https://127.0.0.1'), false);
  assert.equal(isSafeCustomInjectedUrl('https://user@app.example.com'), false);

  const protocols = parseCustomInjectedProtocols(
    JSON.stringify({
      protocols: [
        { id: 'safe', sourceUrl: 'https://app.example.com' },
        { id: 'duplicate', sourceUrl: 'https://www.app.example.com/path' },
        { id: 'unsafe', sourceUrl: 'https://192.168.1.2' },
      ],
    }),
    'custom',
  );
  assert.deepEqual(
    protocols.map(({ id }) => id),
    ['safe'],
  );
});

test('rejects files that escape the selected workspace', async (context) => {
  const workspace = await createWorkspace();
  context.after(() => fs.rm(workspace, { recursive: true, force: true }));
  const manifest = JSON.parse(await fs.readFile(path.join(workspace, 'manifest.json')));
  manifest.desktopPreload = '../outside.js';
  await fs.writeFile(path.join(workspace, 'manifest.json'), JSON.stringify(manifest));

  await assert.rejects(
    inspectCustomInjectedWorkspace({
      repository: workspace,
      manifest: 'manifest.json',
    }),
    /desktopPreload/,
  );
});
