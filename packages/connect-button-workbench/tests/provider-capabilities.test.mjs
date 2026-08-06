import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const workbenchDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = path.resolve(workbenchDir, '../..');
const validator = path.join(
  repoDir,
  'packages/providers/inpage-providers-hub/scripts/validate-provider-capabilities.mjs',
);

function provider(packageName, chainMatcher, chainNames) {
  return {
    packageName,
    chainMatcher,
    chainNames,
  };
}

async function fixture(t, providers, runtimeIds) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'onekey-provider-capabilities-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const configFile = path.join(directory, 'capabilities.json');
  const sourceFile = path.join(directory, 'injectWeb3Provider.ts');
  const packageJson = path.join(directory, 'package.json');
  await Promise.all([
    fs.writeFile(configFile, `${JSON.stringify({ schemaVersion: 1, providers }, null, 2)}\n`),
    fs.writeFile(
      sourceFile,
      `const injectedChainProviders = defineInjectedChainProviders({\n${runtimeIds
        .map((id) => `  ${id}: {},`)
        .join('\n')}\n});\n`,
    ),
    fs.writeFile(
      packageJson,
      `${JSON.stringify(
        {
          dependencies: {
            '@onekeyfe/onekey-eth-provider': '1.0.0',
            '@onekeyfe/onekey-near-provider': '1.0.0',
          },
        },
        null,
        2,
      )}\n`,
    ),
  ]);
  return { configFile, sourceFile, packageJson };
}

function validate(files = {}) {
  const args = [validator];
  if (files.configFile) args.push('--config', files.configFile);
  if (files.sourceFile) args.push('--source', files.sourceFile);
  if (files.packageJson) {
    args.push('--package-json', files.packageJson);
  }
  return spawnSync(process.execPath, args, {
    cwd: repoDir,
    encoding: 'utf8',
  });
}

test('shared provider capabilities match runtime injection', () => {
  const result = validate();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /"ok":true/);
});

test('validator explains a configured provider without a runtime instance', async (t) => {
  const files = await fixture(
    t,
    {
      ethereum: provider('@onekeyfe/onekey-eth-provider', 'evm', []),
      near: provider('@onekeyfe/onekey-near-provider', 'names', ['near']),
    },
    ['ethereum'],
  );
  const result = validate(files);
  assert.equal(result.status, 4);
  assert.match(
    result.stderr,
    /"near" is declared in capabilities\.json but has no runtime instance/,
  );
  assert.match(
    result.stderr,
    /add "near" to injectedChainProviders.*or remove it from the shared configuration/s,
  );
});

test('validator explains a runtime provider missing from shared config', async (t) => {
  const files = await fixture(
    t,
    {
      ethereum: provider('@onekeyfe/onekey-eth-provider', 'evm', []),
    },
    ['ethereum', 'near'],
  );
  const result = validate(files);
  assert.equal(result.status, 4);
  assert.match(
    result.stderr,
    /"near" is instantiated by injectWeb3Provider but is missing from capabilities\.json/,
  );
  assert.match(
    result.stderr,
    /add "near" and its chain mapping.*or remove the runtime provider instance/s,
  );
});
