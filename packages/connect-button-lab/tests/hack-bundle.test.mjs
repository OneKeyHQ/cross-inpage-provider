import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('current worktree hack source bundles for browser injection', async () => {
  const build = spawnSync(process.execPath, ['scripts/build-hack-bundle.mjs'], {
    cwd: packageDir,
    encoding: 'utf8',
  });
  assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);

  const bundle = await fs.readFile(path.join(packageDir, 'dist/hack-bundle.js'), 'utf8');
  assert.ok(bundle.length > 10000, 'bundle should include real adapter code');
  assert.match(bundle, /onekey-connect-button-lab/);
  assert.match(bundle, /hack-bundle-ready/);
});
