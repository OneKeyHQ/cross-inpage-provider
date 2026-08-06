import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { discoverAdapters } from '../scripts/generate-adapter-entry.mjs';
import { validateCustomProtocolRegistry } from '../src/lib/custom-protocol-registry.mjs';

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryDirectory = path.resolve(packageDirectory, '../..');
const dappsDirectory = path.join(packageDirectory, 'dapps');
const generatedDirectory = path.join(
  repositoryDirectory,
  'packages/providers/inpage-providers-hub/src/connectButtonHack/generated/workbench-adapters',
);

test('generates the production adapter entry from canonical DApp directories', async () => {
  const generated = spawnSync(process.execPath, ['scripts/generate-adapter-entry.mjs'], {
    cwd: packageDirectory,
    encoding: 'utf8',
  });
  assert.equal(generated.status, 0, generated.stderr);
  assert.deepEqual(JSON.parse(generated.stdout), {
    ok: true,
    adapterCount: 39,
    disabled: ['custom:walletconnect'],
    output:
      'packages/providers/inpage-providers-hub/src/connectButtonHack/generated/workbench-adapters',
  });

  const adapters = await discoverAdapters(dappsDirectory);
  assert.equal(adapters.length, 40);
  assert.ok(adapters.every((adapter) => adapter.source === 'custom'));

  const customRegistry = JSON.parse(
    await fs.readFile(path.join(packageDirectory, 'custom-protocols.json'), 'utf8'),
  );
  assert.deepEqual(validateCustomProtocolRegistry(customRegistry), []);
  assert.deepEqual(
    customRegistry.protocols.map(({ slug }) => `custom:${slug}`).sort(),
    adapters
      .filter(({ enabled, source }) => enabled && source === 'custom')
      .map(({ key }) => key)
      .sort(),
  );

  const generatedIndex = await fs.readFile(
    path.join(generatedDirectory, 'index.generated.ts'),
    'utf8',
  );
  assert.match(generatedIndex, /\.\/custom\/aave-v3\/adapter/u);
  assert.match(generatedIndex, /\.\/custom\/iziswap\/adapter/u);
  assert.match(generatedIndex, /"custom:aave-v3"/u);
  assert.doesNotMatch(generatedIndex, /\.\/custom\/walletconnect\/adapter/u);
  await assert.rejects(
    fs.access(path.join(generatedDirectory, 'custom', 'walletconnect', 'adapter.ts')),
    (error) => error.code === 'ENOENT',
  );

  const copiedIziswap = await fs.readFile(
    path.join(generatedDirectory, 'custom', 'iziswap', 'adapter.ts'),
    'utf8',
  );
  assert.match(copiedIziswap, /from '\.\.\/\.\.\/\.\.\/\.\.\/hackConnectButton'/u);
  assert.doesNotMatch(copiedIziswap, /providers\/inpage-providers-hub\/src/u);
});

test('keeps identical slugs isolated by source', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'workbench-adapter-sources-'));
  try {
    await Promise.all([
      fs.mkdir(path.join(root, 'custom', 'same-slug'), { recursive: true }),
      fs.mkdir(path.join(root, 'defillama', 'same-slug'), { recursive: true }),
    ]);
    await Promise.all([
      fs.writeFile(
        path.join(root, 'custom', 'same-slug', 'adapter.ts'),
        'export default () => {};',
      ),
      fs.writeFile(
        path.join(root, 'defillama', 'same-slug', 'adapter.ts'),
        'export default () => {};',
      ),
    ]);

    const adapters = await discoverAdapters(root);
    assert.deepEqual(
      adapters.map((adapter) => adapter.key),
      ['custom:same-slug', 'defillama:same-slug'],
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
