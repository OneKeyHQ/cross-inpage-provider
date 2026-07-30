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
    'packages/connect-button-lab/node_modules/electron/package.json',
    'packages/connect-button-lab/dist/site-catalog.json',
    'packages/connect-button-lab/.data/results.json',
    'packages/connect-button-lab/artifacts/failure.png',
    'packages/connect-button-lab/coverage/lcov.info',
    'packages/connect-button-lab/playwright-report/index.html',
    'packages/connect-button-lab/blob-report/report.zip',
    'packages/connect-button-lab/test-results/result.json',
    'packages/connect-button-lab/traces/failure.zip',
    'packages/connect-button-lab/screenshots/failure.png',
    'packages/connect-button-lab/videos/run.webm',
    'packages/connect-button-lab/.cache/catalog.json',
    'app-monorepo/package.json',
    'packages/connect-button-lab/cases/aave.json.123.tmp',
    'packages/providers/inpage-providers-hub/src/connectButtonHack/defillama-protocols.json.123.tmp',
  ];
  const ignored = git(
    ['check-ignore', '--stdin'],
    `${runtimeFiles.join('\n')}\n`,
  );
  assert.equal(ignored.status, 0, ignored.stderr);
  assert.deepEqual(
    ignored.stdout.trim().split('\n').sort(),
    runtimeFiles.slice().sort(),
  );

  const persistentFiles = [
    '.agents/skills/defillama-hack-buttons/SKILL.md',
    'onekey-app-custom-injected.json',
    'packages/connect-button-lab/scripts/build-desktop-preload.mjs',
    'packages/connect-button-lab/cases/aave.json',
    'packages/connect-button-lab/manifests/aave.json',
    'packages/connect-button-lab/package-lock.json',
    'packages/providers/inpage-providers-hub/src/connectButtonHack/defillama-protocols.json',
    'packages/providers/inpage-providers-hub/src/connectButtonHack/generated/defillama-sites.generated.ts',
  ];
  for (const file of persistentFiles) {
    const result = git(['check-ignore', '-q', file]);
    assert.equal(result.status, 1, `${file} must remain versionable`);
  }

  const trackedIgnored = git(['ls-files', '-ci', '--exclude-standard']);
  assert.equal(trackedIgnored.status, 0, trackedIgnored.stderr);
  assert.equal(trackedIgnored.stdout, '');
});
