import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = path.resolve(packageDir, '../..');

function git(args, input) {
  return spawnSync('git', args, {
    cwd: repoDir,
    encoding: 'utf8',
    input,
  });
}

test('runtime artifacts stay ignored and persistent workflow files stay versionable', () => {
  const runtimeFiles = [
    '.data/corepack/lastKnownGood.json',
    '.yarn/releases/yarn-4.cjs',
    '.yarnrc.yml',
    'node_modules/typescript/package.json',
    'packages/injected/dist/injected/injectedDesktopPreload.js',
    'packages/injected/node_modules/webpack/package.json',
    'packages/connect-button-workbench/node_modules/example/package.json',
    'packages/connect-button-workbench/.data/results.json',
    'packages/connect-button-workbench/dapps/defillama/example/recording.json',
    'packages/connect-button-workbench/dapps/defillama/example/e2e-failure.json',
    'packages/connect-button-workbench/coverage/lcov.info',
    'packages/connect-button-workbench/.cache/catalog.json',
    'app-monorepo/package.json',
    'packages/connect-button-workbench/config/defillama-protocols.json.123.tmp',
    'packages/providers/inpage-providers-hub/src/connectButtonHack/generated/workbench-adapters/index.generated.ts',
  ];
  const ignored = git(['check-ignore', '--stdin'], `${runtimeFiles.join('\n')}\n`);
  assert.equal(ignored.status, 0, ignored.stderr);
  assert.deepEqual(ignored.stdout.trim().split('\n').sort(), runtimeFiles.slice().sort());

  const persistentFiles = [
    '.agents/skills/defillama-hack-buttons/SKILL.md',
    'packages/connect-button-workbench/config/custom-protocols.json',
    'packages/connect-button-workbench/config/defillama-protocols.json',
    'packages/connect-button-workbench/config/injected-provider-capabilities.json',
    'packages/connect-button-workbench/config/onekey-app-custom-injected.json',
    'packages/connect-button-workbench/scripts/build-desktop-preload.mjs',
    'packages/connect-button-workbench/dapps/defillama/example/e2e.mjs',
    'packages/connect-button-workbench/dapps/custom/example/adapter.ts',
    'packages/connect-button-workbench/dapps/custom/example/adapter.test.ts',
  ];
  for (const file of persistentFiles) {
    const result = git(['check-ignore', '-q', file]);
    assert.equal(result.status, 1, `${file} must remain versionable`);
  }

  const trackedIgnored = git(['ls-files', '-ci', '--exclude-standard']);
  assert.equal(trackedIgnored.status, 0, trackedIgnored.stderr);
  assert.equal(trackedIgnored.stdout, '');
});
