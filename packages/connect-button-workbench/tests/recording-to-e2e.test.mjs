import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { generateRecordingE2E } from '../src/cli/generate-recording-e2e.mjs';
import {
  compileRecordingToDesktopE2E,
  generateDesktopRecordingE2EFromContent,
  normalizeRecordingProtocolSlug,
} from '../src/lib/recording-to-e2e.mjs';

function passingValidation(testCase, attempts = [false, false, true]) {
  return {
    schemaVersion: 1,
    kind: 'onekey-connect-button-desktop-e2e-result',
    passed: true,
    verdict: 'deterministic-repository-icon-source',
    source: testCase.source,
    protocolId: testCase.protocolId,
    site: testCase.site,
    recordingSha256: testCase.recordingSha256,
    passes: attempts.map((passed, index) => ({
      name: `clean-session-${String(index + 1)}`,
      passed,
      freshWebView: true,
      repositoryIconDetected: passed,
    })),
  };
}

function selector(overrides = {}) {
  return {
    kind: 'testId',
    value: 'connect-wallet',
    unique: true,
    ...overrides,
  };
}

function click(text = 'Connect Wallet', selectors = [selector()]) {
  return {
    action: 'click',
    elapsedMs: 1000,
    pageUrl: 'https://app.example.com/swap',
    target: {
      tag: 'button',
      text,
      role: 'button',
      ariaLabel: null,
      selectors,
    },
  };
}

function recording(overrides = {}) {
  return {
    schemaVersion: 1,
    kind: 'onekey-connect-button-recording',
    protocol: {
      source: 'defillama',
      id: 'protocol-1',
      name: 'Example',
      slug: 'example',
      url: 'https://app.example.com',
    },
    runtime: {
      bundleSha256: 'b'.repeat(64),
      privateSession: true,
    },
    initialUrl: 'https://app.example.com/',
    finalUrl: 'https://app.example.com/swap',
    outcome: {
      kind: 'repository-wallet-icon',
      afterStep: 1,
    },
    steps: [click()],
    ...overrides,
  };
}

test('compiles a deterministic E2E and inserts standardized readiness', () => {
  const { testCase } = compileRecordingToDesktopE2E(
    recording({
      steps: [
        click('Connect Wallet', [
          selector({
            kind: 'role',
            value: 'button:Connect Wallet',
            role: 'button',
            name: 'Connect Wallet',
          }),
          selector({ kind: 'css', value: '[data-testid="wallet"] button' }),
        ]),
        click('Close', [selector({ kind: 'ariaLabel', value: 'Close' })]),
      ],
    }),
    'a'.repeat(64),
  );

  assert.equal(testCase.actions.length, 2);
  assert.deepEqual(
    testCase.actions.map(({ action, waitAfterMs }) => ({
      action,
      waitAfterMs,
    })),
    [
      { action: 'press', waitAfterMs: 3000 },
      { action: 'click', waitAfterMs: 1000 },
    ],
  );
  assert.deepEqual(testCase.actions[0].locators, testCase.actions[1].locators);
  assert.equal(testCase.actions[0].key, 'Escape');
  assert.equal(testCase.actions[1].locators[0].kind, 'role');
});

test('runs readiness before opening an Escape-dismissible wallet menu', () => {
  const getStarted = click('Get Started', [
    selector({
      kind: 'role',
      value: 'button:Get Started',
      role: 'button',
      name: 'Get Started',
    }),
  ]);
  const connectWallet = click('Connect a Wallet', [
    selector({
      kind: 'role',
      value: 'menuitem:Connect a Wallet',
      role: 'menuitem',
      name: 'Connect a Wallet',
    }),
  ]);
  connectWallet.target = {
    ...connectWallet.target,
    tag: 'div',
    role: 'menuitem',
  };
  const { testCase } = compileRecordingToDesktopE2E(
    recording({
      outcome: {
        kind: 'repository-wallet-icon',
        afterStep: 2,
      },
      steps: [getStarted, connectWallet],
    }),
    'a'.repeat(64),
  );

  assert.deepEqual(
    testCase.actions.map(({ action, waitAfterMs }) => ({
      action,
      waitAfterMs,
    })),
    [
      { action: 'press', waitAfterMs: 3000 },
      { action: 'click', waitAfterMs: 750 },
      { action: 'click', waitAfterMs: 1000 },
    ],
  );
  assert.deepEqual(testCase.actions[0].locators, testCase.actions[1].locators);
  assert.notDeepEqual(
    testCase.actions[0].locators,
    testCase.actions[2].locators,
  );
  assert.match(testCase.actions[2].description, /wallet selection modal/u);
});

test('infers one legacy connect click and removes later recorded modal actions', () => {
  const value = recording({
    outcome: undefined,
    steps: [
      click(),
      click('Close', [selector({ kind: 'ariaLabel', value: 'Close' })]),
    ],
  });
  const { testCase } = compileRecordingToDesktopE2E(value, 'a'.repeat(64));

  assert.equal(testCase.actions.length, 2);
  assert.match(testCase.actions[1].description, /wallet selection modal/u);
});

test('rejects a step when the recording contains no unique locator', () => {
  assert.throws(
    () =>
      compileRecordingToDesktopE2E(
        recording({
          steps: [
            click('Connect Wallet', [
              selector({
                kind: 'role',
                value: 'button:Connect Wallet',
                role: 'button',
                name: 'Connect Wallet',
                unique: false,
              }),
            ]),
          ],
        }),
        'a'.repeat(64),
      ),
    /no unique recorded locator/u,
  );
});

test('rejects wallet selection and cross-host recordings', () => {
  assert.throws(
    () =>
      compileRecordingToDesktopE2E(
        recording({ steps: [click('OneKey')] }),
        'a'.repeat(64),
      ),
    /safety policy/u,
  );
  assert.throws(
    () =>
      compileRecordingToDesktopE2E(
        recording({ finalUrl: 'https://malicious.example/' }),
        'a'.repeat(64),
      ),
    /hostname must match/u,
  );
});

test('renders a self-contained source tied to the exact recording bytes', () => {
  const content = Buffer.from(`${JSON.stringify(recording(), null, 2)}\n`);
  const generated = generateDesktopRecordingE2EFromContent(content);

  assert.equal(
    generated.recordingSha256,
    crypto.createHash('sha256').update(content).digest('hex'),
  );
  assert.match(generated.source, /validateDesktopRecordingE2ECase/u);
  assert.match(generated.source, /runDesktopRecordingE2EAndExit/u);
  assert.match(generated.source, new RegExp(generated.recordingSha256, 'u'));
  assert.match(generated.source, /\bsource:\s*"defillama"/u);
  assert.doesNotMatch(generated.source, /"source":/u);
  assert.doesNotMatch(generated.source, /recording\.json/u);
});

test('normalizes a source protocol slug for the canonical DApp directory', () => {
  assert.equal(
    normalizeRecordingProtocolSlug('ether.fi-stake'),
    'ether-fi-stake',
  );
  assert.equal(
    normalizeRecordingProtocolSlug(' SparkDEX--V3.1 '),
    'sparkdex-v3-1',
  );
  assert.throws(
    () => normalizeRecordingProtocolSlug('...'),
    /protocol slug must be normalized/u,
  );
});

test('generator promotes an E2E after the first successful clean-session attempt', async () => {
  const repository = await fs.mkdtemp(path.join(os.tmpdir(), 'recording-e2e-'));
  const dappDirectory = path.join(repository, 'dapps/defillama/example');
  await fs.mkdir(dappDirectory, { recursive: true });
  await Promise.all([
    fs.writeFile(
      path.join(repository, 'package.json'),
      `${JSON.stringify({ name: 'cross-inpage-provider' })}\n`,
    ),
    fs.writeFile(
      path.join(repository, 'onekey-app-custom-injected.json'),
      `${JSON.stringify({
        schemaVersion: 3,
        kind: 'onekey-app-custom-injected',
        protocolSources: [{ source: 'defillama' }],
        dappsDirectory: 'dapps',
      })}\n`,
    ),
    fs.writeFile(
      path.join(dappDirectory, 'recording.json'),
      `${JSON.stringify(recording(), null, 2)}\n`,
    ),
    fs.writeFile(path.join(dappDirectory, 'e2e.mjs'), '// previous E2E\n'),
  ]);
  try {
    const result = await generateRecordingE2E({
      argv: ['--file', 'dapps/defillama/example/recording.json'],
      cwd: repository,
      executeCandidate: (_file, _repository, testCase) =>
        passingValidation(testCase),
    });
    const source = await fs.readFile(
      path.join(dappDirectory, 'e2e.mjs'),
      'utf8',
    );

    assert.equal(result.ok, true);
    assert.equal(result.validated, true);
    assert.equal(result.validationPasses, 3);
    assert.equal(result.relativeFile, 'dapps/defillama/example/e2e.mjs');
    assert.notEqual(source, '// previous E2E\n');
    assert.match(source, /onekey-connect-button-desktop-e2e/u);
    assert.equal(
      (await fs.readdir(dappDirectory)).some((file) =>
        file.startsWith('.e2e.'),
      ),
      false,
    );

    const nextRecording = recording({
      protocol: { ...recording().protocol, name: 'Changed' },
    });
    await fs.writeFile(
      path.join(dappDirectory, 'recording.json'),
      `${JSON.stringify(nextRecording, null, 2)}\n`,
    );
    await assert.rejects(
      generateRecordingE2E({
        argv: ['--file', 'dapps/defillama/example/recording.json'],
        cwd: repository,
        executeCandidate: (_file, _repository, testCase) => ({
          ...passingValidation(testCase, Array(5).fill(false)),
          passed: false,
        }),
      }),
      /failed after up to 5 clean-session attempts/u,
    );
    assert.equal(
      await fs.readFile(path.join(dappDirectory, 'e2e.mjs'), 'utf8'),
      source,
    );
    assert.equal(
      (await fs.readdir(dappDirectory)).some((file) =>
        file.startsWith('.e2e.'),
      ),
      false,
    );
  } finally {
    await fs.rm(repository, { force: true, recursive: true });
  }
});

test('generator replaces a previous E2E when the source slug requires normalization', async () => {
  const repository = await fs.mkdtemp(
    path.join(os.tmpdir(), 'recording-e2e-slug-'),
  );
  const dappDirectory = path.join(repository, 'dapps/defillama/ether-fi-stake');
  await fs.mkdir(dappDirectory, { recursive: true });
  await Promise.all([
    fs.writeFile(
      path.join(repository, 'package.json'),
      `${JSON.stringify({ name: 'cross-inpage-provider' })}\n`,
    ),
    fs.writeFile(
      path.join(repository, 'onekey-app-custom-injected.json'),
      `${JSON.stringify({
        schemaVersion: 3,
        kind: 'onekey-app-custom-injected',
        protocolSources: [{ source: 'defillama' }],
        dappsDirectory: 'dapps',
      })}\n`,
    ),
    fs.writeFile(
      path.join(dappDirectory, 'recording.json'),
      `${JSON.stringify(
        recording({
          protocol: {
            ...recording().protocol,
            id: '2626',
            name: 'ether.fi Stake',
            slug: 'ether.fi-stake',
          },
        }),
        null,
        2,
      )}\n`,
    ),
    fs.writeFile(path.join(dappDirectory, 'e2e.mjs'), '// previous E2E\n'),
  ]);
  try {
    const result = await generateRecordingE2E({
      argv: ['--file', 'dapps/defillama/ether-fi-stake/recording.json'],
      cwd: repository,
      executeCandidate: (_file, _repository, testCase) =>
        passingValidation(testCase),
    });
    const source = await fs.readFile(
      path.join(dappDirectory, 'e2e.mjs'),
      'utf8',
    );

    assert.equal(result.relativeFile, 'dapps/defillama/ether-fi-stake/e2e.mjs');
    assert.notEqual(source, '// previous E2E\n');
    assert.match(source, /protocolId:\s*"2626"/u);
  } finally {
    await fs.rm(repository, { force: true, recursive: true });
  }
});
