import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  GENERATED_E2E_MAX_ATTEMPTS,
  generateRecordingE2E,
  generationFailureOutput,
  validateGeneratedE2EResult,
} from '../src/cli/generate-recording-e2e.mjs';
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

async function findDAppE2EFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return findDAppE2EFiles(entryPath);
      return entry.isFile() && entry.name === 'e2e.mjs' ? [entryPath] : [];
    }),
  );
  return nested.flat();
}

test('accepts a fresh E2E pass detected by OneKey wallet ID', () => {
  const testCase = {
    source: 'custom',
    protocolId: 'iziswap',
    site: 'izumi.finance',
    recordingSha256: 'a'.repeat(64),
  };
  const result = passingValidation(testCase, [true]);
  result.passes[0] = {
    ...result.passes[0],
    repositoryIconDetected: false,
    oneKeyWalletIdDetected: true,
    walletId: 'ethereum-onekey-wallet',
  };

  assert.equal(validateGeneratedE2EResult(result, testCase), result);
});

test('rejects a generated candidate result with more than three attempts', () => {
  const testCase = {
    source: 'custom',
    protocolId: 'example',
    site: 'app.example.com',
    recordingSha256: 'a'.repeat(64),
  };

  assert.throws(
    () =>
      validateGeneratedE2EResult(
        passingValidation(testCase, [false, false, false, true]),
        testCase,
      ),
    /failed after up to 3 clean-session attempts/u,
  );
});

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
  const { definition, testCase } = compileRecordingToDesktopE2E(
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
    testCase.actions.map(({ action, waitBeforeMs, waitAfterMs }) => ({
      action,
      waitBeforeMs,
      waitAfterMs,
    })),
    [
      { action: 'press', waitBeforeMs: undefined, waitAfterMs: 3000 },
      { action: 'click', waitBeforeMs: 2000, waitAfterMs: 2000 },
    ],
  );
  assert.deepEqual(testCase.actions[0].locators, testCase.actions[1].locators);
  assert.equal(testCase.actions[0].key, 'Escape');
  assert.equal(testCase.actions[1].locators[0].kind, 'role');
  assert.equal(testCase.actions[1].locators[0].strength, 'semantic');
  assert.equal(testCase.actions[1].locators[0].uniqueAtRecording, true);
  assert.deepEqual(testCase.actions[1].target, {
    tag: 'button',
    role: 'button',
    name: 'Connect Wallet',
    stableClassTokens: [],
    scopes: [],
    shadowHosts: [],
  });
  assert.equal(definition.actions.length, 1);
  assert.equal(definition.actions[0].readiness, true);
  assert.equal(definition.actions[0].timeoutMs, undefined);
  assert.equal(definition.actions[0].waitBeforeMs, undefined);
  assert.equal(definition.actions[0].waitAfterMs, undefined);
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
    testCase.actions.map(({ action, waitBeforeMs, waitAfterMs }) => ({
      action,
      waitBeforeMs,
      waitAfterMs,
    })),
    [
      { action: 'press', waitBeforeMs: undefined, waitAfterMs: 3000 },
      { action: 'click', waitBeforeMs: 2000, waitAfterMs: 2000 },
      { action: 'click', waitBeforeMs: undefined, waitAfterMs: 2000 },
    ],
  );
  assert.deepEqual(testCase.actions[0].locators, testCase.actions[1].locators);
  assert.notDeepEqual(testCase.actions[0].locators, testCase.actions[2].locators);
  assert.match(testCase.actions[2].description, /wallet selection modal/u);
});

test('infers one legacy connect click and removes later recorded modal actions', () => {
  const value = recording({
    outcome: undefined,
    steps: [click(), click('Close', [selector({ kind: 'ariaLabel', value: 'Close' })])],
  });
  const { testCase } = compileRecordingToDesktopE2E(value, 'a'.repeat(64));

  assert.equal(testCase.actions.length, 2);
  assert.match(testCase.actions[1].description, /wallet selection modal/u);
});

test('rejects a step with neither a unique locator nor composite context', () => {
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
    /neither a unique locator nor enough composite target context/u,
  );
});

test('compiles multiple ambiguous locators for runtime consensus resolution', () => {
  const { definition } = compileRecordingToDesktopE2E(
    recording({
      schemaVersion: 2,
      steps: [
        click('Connect Wallet', [
          selector({
            kind: 'role',
            value: 'button:Connect Wallet',
            role: 'button',
            name: 'Connect Wallet',
            unique: false,
            matchCount: 2,
            visibleMatchCount: 2,
            strength: 'semantic',
          }),
          selector({
            kind: 'text',
            value: 'Connect Wallet',
            unique: false,
            matchCount: 2,
            visibleMatchCount: 2,
            strength: 'semantic',
          }),
        ]),
      ],
    }),
    'a'.repeat(64),
  );

  assert.equal(definition.actions[0].locators[0].uniqueAtRecording, false);
  assert.equal(definition.actions[0].locators[0].matchCount, 2);
  assert.equal(definition.actions[0].target.tag, 'button');
  assert.equal(definition.actions[0].target.name, 'Connect Wallet');
});

test('rejects wallet selection and cross-host recordings', () => {
  assert.throws(
    () => compileRecordingToDesktopE2E(recording({ steps: [click('OneKey')] }), 'a'.repeat(64)),
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
  assert.match(generated.source, /runDesktopRecordingE2EModule/u);
  assert.match(generated.source, /readiness:\s*true/u);
  assert.doesNotMatch(generated.source, /validateDesktopRecordingE2ECase/u);
  assert.doesNotMatch(generated.source, /runDesktopRecordingE2EAndExit/u);
  assert.doesNotMatch(generated.source, /pathToFileURL/u);
  assert.doesNotMatch(generated.source, /waitBeforeMs/u);
  assert.doesNotMatch(generated.source, /waitAfterMs/u);
  assert.match(generated.source, new RegExp(generated.recordingSha256, 'u'));
  assert.match(generated.source, /\bsource:\s*"defillama"/u);
  assert.doesNotMatch(generated.source, /"source":/u);
  assert.doesNotMatch(generated.source, /recording\.json/u);
});

test('keeps every eligible DApp E2E on the compact shared module template', async () => {
  const dappsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dapps');
  const files = (await findDAppE2EFiles(dappsDirectory)).sort();

  assert.equal(files.length, 42);
  for (const file of files) {
    const source = await fs.readFile(file, 'utf8');
    assert.match(source, /^import \{ runDesktopRecordingE2EModule \}/u, file);
    assert.match(
      source,
      /export const testCase = await runDesktopRecordingE2EModule\(import\.meta\.url,/u,
      file,
    );
    assert.equal(source.match(/\breadiness:\s*true\b/gu)?.length, 1, file);
    assert.doesNotMatch(source, /pathToFileURL|runDesktopRecordingE2EAndExit/u, file);
    const { testCase } = await import(`${pathToFileURL(file).href}?compact-contract=1`);
    const recording = await fs.readFile(path.join(path.dirname(file), 'recording.json'));
    assert.equal(
      testCase.recordingSha256,
      crypto.createHash('sha256').update(recording).digest('hex'),
      file,
    );
  }
});

test('normalizes a source protocol slug for the canonical DApp directory', () => {
  assert.equal(normalizeRecordingProtocolSlug('ether.fi-stake'), 'ether-fi-stake');
  assert.equal(normalizeRecordingProtocolSlug(' SparkDEX--V3.1 '), 'sparkdex-v3-1');
  assert.throws(() => normalizeRecordingProtocolSlug('...'), /protocol slug must be normalized/u);
});

test('generator promotes an E2E after the first successful clean-session attempt', async () => {
  const repository = await fs.mkdtemp(path.join(os.tmpdir(), 'recording-e2e-'));
  const dappDirectory = path.join(repository, 'dapps/defillama/example');
  const manifestFile = path.join(
    repository,
    'packages/connect-button-workbench/config/onekey-app-custom-injected.json',
  );
  await fs.mkdir(dappDirectory, { recursive: true });
  await fs.mkdir(path.dirname(manifestFile), { recursive: true });
  await Promise.all([
    fs.writeFile(
      path.join(repository, 'package.json'),
      `${JSON.stringify({ name: 'cross-inpage-provider' })}\n`,
    ),
    fs.writeFile(
      manifestFile,
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
    let candidateMaximumAttempts;
    const result = await generateRecordingE2E({
      argv: ['--file', 'dapps/defillama/example/recording.json'],
      cwd: repository,
      executeCandidate: (_file, _repository, testCase, options) => {
        candidateMaximumAttempts = options.maximumAttempts;
        return passingValidation(testCase);
      },
    });
    const source = await fs.readFile(path.join(dappDirectory, 'e2e.mjs'), 'utf8');

    assert.equal(result.ok, true);
    assert.equal(result.validated, true);
    assert.equal(result.validationPasses, 3);
    assert.equal(candidateMaximumAttempts, GENERATED_E2E_MAX_ATTEMPTS);
    assert.equal(GENERATED_E2E_MAX_ATTEMPTS, 3);
    assert.equal(result.relativeFile, 'dapps/defillama/example/e2e.mjs');
    assert.notEqual(source, '// previous E2E\n');
    assert.match(source, /onekey-connect-button-desktop-e2e/u);
    assert.equal(
      (await fs.readdir(dappDirectory)).some((file) => file.startsWith('.e2e.')),
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
          ...passingValidation(testCase, Array(3).fill(false)),
          passed: false,
        }),
      }),
      /failed after up to 3 clean-session attempts/u,
    );
    const firstFailureLog = JSON.parse(
      await fs.readFile(path.join(dappDirectory, 'e2e-failure.json'), 'utf8'),
    );
    assert.equal(firstFailureLog.kind, 'onekey-connect-button-e2e-failure-log');
    assert.equal(firstFailureLog.entries.length, 1);
    assert.equal(firstFailureLog.entries[0].phase, 'generation');
    assert.match(firstFailureLog.entries[0].reason, /failed after up to 3 clean-session attempts/u);
    assert.equal('passes' in firstFailureLog.entries[0], false);
    assert.equal('diagnostics' in firstFailureLog.entries[0], false);
    assert.equal(await fs.readFile(path.join(dappDirectory, 'e2e.mjs'), 'utf8'), source);
    assert.equal(
      (await fs.readdir(dappDirectory)).some((file) => file.startsWith('.e2e.')),
      false,
    );
    const abortController = new AbortController();
    let candidateSignal;
    await assert.rejects(
      generateRecordingE2E({
        argv: ['--file', 'dapps/defillama/example/recording.json'],
        cwd: repository,
        signal: abortController.signal,
        executeCandidate: (_file, _repository, testCase, options) => {
          candidateSignal = options.signal;
          abortController.abort();
          return passingValidation(testCase);
        },
      }),
      /stopped by user/u,
    );
    assert.equal(candidateSignal, abortController.signal);
    const secondFailureLog = JSON.parse(
      await fs.readFile(path.join(dappDirectory, 'e2e-failure.json'), 'utf8'),
    );
    assert.equal(secondFailureLog.entries.length, 2);
    assert.match(secondFailureLog.entries.at(-1).reason, /stopped by user/u);
    assert.equal(await fs.readFile(path.join(dappDirectory, 'e2e.mjs'), 'utf8'), source);
    assert.equal(
      (await fs.readdir(dappDirectory)).some((file) => file.startsWith('.e2e.')),
      false,
    );
  } finally {
    await fs.rm(repository, { force: true, recursive: true });
  }
});

test('preserves clean-session action diagnostics in the generator failure output', () => {
  const testCase = {
    source: 'custom',
    protocolId: 'renzoprotocol',
    site: 'app.renzoprotocol.com',
    startUrl: 'https://app.renzoprotocol.com/explore',
    recordingSha256: 'a'.repeat(64),
    actions: [
      {
        action: 'click',
        description: 'Open the Renzo wallet selection modal',
        locators: [
          {
            kind: 'role',
            value: 'button:Solana Wallet',
            role: 'button',
            name: 'Solana Wallet',
          },
        ],
      },
    ],
  };
  const failedAction = {
    index: 1,
    action: 'click',
    description: 'Open the Renzo wallet selection modal',
    status: 'error',
    locatorCandidates: testCase.actions[0].locators,
    error: 'no unique visible locator resolved',
  };
  const result = {
    ...passingValidation(testCase, [false]),
    passed: false,
    passes: [
      {
        name: 'clean-session-1',
        passed: false,
        freshWebView: true,
        repositoryIconDetected: false,
        stage: 'action-dispatch',
        finalUrl: testCase.startUrl,
        executedActions: [failedAction],
        error: failedAction.error,
      },
    ],
  };

  assert.throws(
    () => validateGeneratedE2EResult(result, testCase),
    (error) => {
      assert.equal(error.code, 'GENERATED_E2E_VALIDATION_FAILED');
      assert.match(error.message, /failedAction=Open the Renzo/u);
      assert.match(error.message, /no unique visible locator resolved/u);
      assert.equal(error.diagnostics.expected.site, testCase.site);
      assert.deepEqual(error.diagnostics.passes[0].executedActions, [failedAction]);
      assert.deepEqual(generationFailureOutput(error), {
        ok: false,
        error: error.message,
        diagnostics: error.diagnostics,
      });
      return true;
    },
  );
});

test('generator replaces a previous E2E when the source slug requires normalization', async () => {
  const repository = await fs.mkdtemp(path.join(os.tmpdir(), 'recording-e2e-slug-'));
  const dappDirectory = path.join(repository, 'dapps/defillama/ether-fi-stake');
  const manifestFile = path.join(
    repository,
    'packages/connect-button-workbench/config/onekey-app-custom-injected.json',
  );
  await fs.mkdir(dappDirectory, { recursive: true });
  await fs.mkdir(path.dirname(manifestFile), { recursive: true });
  await Promise.all([
    fs.writeFile(
      path.join(repository, 'package.json'),
      `${JSON.stringify({ name: 'cross-inpage-provider' })}\n`,
    ),
    fs.writeFile(
      manifestFile,
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
      executeCandidate: (_file, _repository, testCase) => passingValidation(testCase),
    });
    const source = await fs.readFile(path.join(dappDirectory, 'e2e.mjs'), 'utf8');

    assert.equal(result.relativeFile, 'dapps/defillama/ether-fi-stake/e2e.mjs');
    assert.notEqual(source, '// previous E2E\n');
    assert.match(source, /protocolId:\s*"2626"/u);
  } finally {
    await fs.rm(repository, { force: true, recursive: true });
  }
});
