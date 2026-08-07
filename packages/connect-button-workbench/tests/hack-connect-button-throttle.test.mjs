import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const workbenchDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryDirectory = path.resolve(workbenchDirectory, '../..');
const throttleSourceFile = path.join(
  repositoryDirectory,
  'packages/providers/inpage-providers-hub/src/connectButtonHack/throttleDelay.ts',
);

async function loadThrottleModule() {
  const source = await fs.readFile(throttleSourceFile, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  Function('exports', 'module', output)(module.exports, module);
  return module.exports;
}

test('enforces the 600ms Hack adapter throttle floor', async () => {
  const { MINIMUM_HACK_BUTTON_THROTTLE_DELAY_MS, normalizeHackButtonThrottleDelay } =
    await loadThrottleModule();

  assert.equal(MINIMUM_HACK_BUTTON_THROTTLE_DELAY_MS, 600);
  assert.equal(normalizeHackButtonThrottleDelay(-1), 600);
  assert.equal(normalizeHackButtonThrottleDelay(50), 600);
  assert.equal(normalizeHackButtonThrottleDelay(599), 600);
  assert.equal(normalizeHackButtonThrottleDelay(600), 600);
  assert.equal(normalizeHackButtonThrottleDelay(1_200), 1_200);
  assert.equal(normalizeHackButtonThrottleDelay(Number.NaN), 600);
  assert.equal(normalizeHackButtonThrottleDelay(Number.POSITIVE_INFINITY), 600);
});

test('does not contain a hand-maintained adapter below the throttle floor', async () => {
  const dappsDirectory = path.join(workbenchDirectory, 'dapps');
  const adapterFiles = [];
  for (const sourceEntry of await fs.readdir(dappsDirectory, { withFileTypes: true })) {
    if (!sourceEntry.isDirectory()) continue;
    const sourceDirectory = path.join(dappsDirectory, sourceEntry.name);
    for (const dappEntry of await fs.readdir(sourceDirectory, { withFileTypes: true })) {
      if (!dappEntry.isDirectory()) continue;
      const adapterFile = path.join(sourceDirectory, dappEntry.name, 'adapter.ts');
      try {
        await fs.access(adapterFile);
        adapterFiles.push(adapterFile);
      } catch {
        // This DApp directory has no hand-maintained adapter.
      }
    }
  }

  for (const adapterFile of adapterFiles) {
    const source = await fs.readFile(adapterFile, 'utf8');
    for (const match of source.matchAll(/throttleDelay\s*:\s*([0-9][0-9_]*)/gu)) {
      const value = Number(match[1].replaceAll('_', ''));
      assert.ok(value >= 600, `${path.relative(repositoryDirectory, adapterFile)} uses ${value}ms`);
    }
  }
});
