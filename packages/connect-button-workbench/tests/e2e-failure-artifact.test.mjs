import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  DESKTOP_E2E_FAILURE_FILE,
  DESKTOP_E2E_FAILURE_MAXIMUM_BYTES,
  DESKTOP_E2E_FAILURE_MAXIMUM_ENTRIES,
  createDesktopE2EFailureArtifact,
  writeDesktopE2EFailureArtifact,
} from '../src/lib/e2e-failure-artifact.mjs';

test('extracts a repair reason without copying full validation diagnostics', () => {
  const artifact = createDesktopE2EFailureArtifact({
    source: 'defillama',
    slug: 'aave-v3',
    phase: 'validation',
    error: new Error('validation failed'),
    result: {
      passes: [
        {
          name: 'clean-session-2',
          stage: 'action-dispatch',
          passed: false,
          executedActions: [
            {
              index: 3,
              action: 'click',
              description: 'Open wallet modal',
              status: 'error',
              locatorCandidates: [{ kind: 'css', value: '#full-diagnostic-only' }],
              error: 'two candidates remained tied',
            },
          ],
        },
      ],
    },
    failedAt: '2026-08-07T00:00:00.000Z',
  });

  assert.deepEqual(artifact.action, {
    index: 3,
    type: 'click',
    description: 'Open wallet modal',
  });
  assert.equal(artifact.attempt, 'clean-session-2');
  assert.equal(artifact.stage, 'action-dispatch');
  assert.equal(artifact.reason, 'two candidates remained tied');
  assert.doesNotMatch(JSON.stringify(artifact), /full-diagnostic-only|locatorCandidates/u);
});

test('keeps only the latest bounded per-DApp failure reasons', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'e2e-failure-artifact-'));
  try {
    for (let index = 0; index < DESKTOP_E2E_FAILURE_MAXIMUM_ENTRIES + 5; index += 1) {
      await writeDesktopE2EFailureArtifact(directory, {
        source: 'defillama',
        slug: 'aave-v3',
        phase: 'validation',
        protocolId: '1599',
        recordingSha256: 'a'.repeat(64),
        failedAt: new Date(Date.UTC(2026, 7, 7, 0, 0, index)).toISOString(),
        error: new Error(`failure-${String(index)} ${'x'.repeat(5_000)}`),
      });
    }

    const file = path.join(directory, DESKTOP_E2E_FAILURE_FILE);
    const [content, stat] = await Promise.all([fs.readFile(file, 'utf8'), fs.stat(file)]);
    const value = JSON.parse(content);

    assert.equal(value.kind, 'onekey-connect-button-e2e-failure-log');
    assert.equal(value.maximumEntries, DESKTOP_E2E_FAILURE_MAXIMUM_ENTRIES);
    assert.equal(value.entries.length, DESKTOP_E2E_FAILURE_MAXIMUM_ENTRIES);
    assert.match(value.entries[0].reason, /^failure-5 /u);
    assert.match(value.entries.at(-1).reason, /^failure-24 /u);
    assert.equal(value.entries.at(-1).reason.length, 2_000);
    assert.equal('passes' in value.entries.at(-1), false);
    assert.equal('diagnostics' in value.entries.at(-1), false);
    assert.ok(stat.size <= DESKTOP_E2E_FAILURE_MAXIMUM_BYTES);
  } finally {
    await fs.rm(directory, { force: true, recursive: true });
  }
});
