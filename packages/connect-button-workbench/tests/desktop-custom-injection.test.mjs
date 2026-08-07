import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  parseDesktopProtocolPosition,
  resolveDesktopCustomInjectionProtocol,
} from '../src/lib/desktop-custom-injection.mjs';
import {
  DesktopCdpClient,
  fetchDesktopCdpTargets,
  normalizeDesktopCdpEndpoint,
  normalizeDesktopHostname,
} from '../src/lib/desktop-cdp.mjs';
import {
  parseValidateRecordingE2EArguments,
  validateDesktopRecordingE2Es,
} from '../src/cli/validate-recording-e2es.mjs';

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryDirectory = path.resolve(packageDirectory, '../..');

test('accepts only loopback Desktop CDP endpoints', () => {
  assert.equal(normalizeDesktopCdpEndpoint(), 'http://127.0.0.1:9222');
  assert.equal(normalizeDesktopCdpEndpoint('http://localhost:9333/'), 'http://localhost:9333');
  assert.throws(
    () => normalizeDesktopCdpEndpoint('https://desktop.example:9222'),
    /must use loopback HTTP/u,
  );
  assert.equal(normalizeDesktopHostname('https://www.app.example/path'), 'app.example');
});

test('bounds Desktop CDP target discovery when fetch never settles', async () => {
  await assert.rejects(
    fetchDesktopCdpTargets('http://127.0.0.1:9222', () => new Promise(() => undefined), {
      fetchTimeoutMs: 20,
    }),
    /Desktop CDP target discovery timed out after 20 ms/u,
  );

  const controller = new AbortController();
  const aborted = fetchDesktopCdpTargets(
    'http://127.0.0.1:9222',
    () => new Promise(() => undefined),
    { fetchTimeoutMs: 1_000, signal: controller.signal },
  );
  controller.abort(new Error('Batch case deadline expired'));
  await assert.rejects(aborted, /Batch case deadline expired/u);
});

test('bounds Desktop CDP WebSocket connection and command waits', async () => {
  class ConnectingWebSocket extends EventEmitter {
    constructor() {
      super();
      this.readyState = 0;
      this.closed = false;
    }

    close() {
      this.closed = true;
      this.readyState = 3;
      this.emit('close');
    }
  }

  const connecting = new DesktopCdpClient(ConnectingWebSocket, 'ws://127.0.0.1/connect', {
    connectTimeoutMs: 20,
  });
  await assert.rejects(
    connecting.connect(),
    /Desktop CDP WebSocket connection timed out after 20 ms/u,
  );
  assert.equal(connecting.socket.closed, true);

  class SilentOpenWebSocket extends EventEmitter {
    constructor() {
      super();
      this.readyState = 1;
    }

    send() {}

    close() {
      this.readyState = 3;
      this.emit('close');
    }
  }

  const connected = new DesktopCdpClient(SilentOpenWebSocket, 'ws://127.0.0.1/command', {
    commandTimeoutMs: 20,
  });
  await connected.connect();
  await assert.rejects(
    connected.send('Page.enable'),
    /Desktop CDP command Page\.enable timed out after 20 ms/u,
  );
  assert.equal(connected.pending.size, 0);
  connected.close();
});

test('parses full Desktop protocol positions with thousands separators', () => {
  assert.deepEqual(parseDesktopProtocolPosition('1,346 / 1,377'), {
    position: 1346,
    total: 1377,
  });
  assert.equal(parseDesktopProtocolPosition('– / 1'), null);
  assert.equal(parseDesktopProtocolPosition('4 / 3'), null);
});

test('maps source-qualified protocols exactly before using a unique source hostname fallback', () => {
  const protocols = [
    {
      position: 1,
      key: 'defillama:1599',
      source: 'defillama',
      id: '1599',
      url: 'https://app.aave.com',
    },
    {
      position: 2,
      key: 'custom:aave-v3',
      source: 'custom',
      id: 'aave-v3',
      url: 'https://app.aave.com',
    },
    {
      position: 3,
      key: 'custom:gem',
      source: 'custom',
      id: 'gem',
      url: 'https://opensea.io',
    },
  ];
  assert.deepEqual(
    resolveDesktopCustomInjectionProtocol(protocols, {
      source: 'custom',
      protocolId: 'aave-v3',
      site: 'app.aave.com',
    }),
    {
      protocol: protocols[1],
      match: 'exact',
      requestedKey: 'custom:aave-v3',
    },
  );
  assert.deepEqual(
    resolveDesktopCustomInjectionProtocol(protocols, {
      source: 'custom',
      protocolId: 'opensea',
      site: 'www.opensea.io',
    }),
    {
      protocol: protocols[2],
      match: 'source-hostname',
      requestedKey: 'custom:opensea',
    },
  );
});

test('rejects ambiguous source-hostname protocol mappings', () => {
  assert.throws(
    () =>
      resolveDesktopCustomInjectionProtocol(
        [
          { key: 'custom:first', source: 'custom', id: 'first', url: 'https://app.example' },
          { key: 'custom:second', source: 'custom', id: 'second', url: 'https://app.example' },
        ],
        { source: 'custom', protocolId: 'missing', site: 'app.example' },
      ),
    /ambiguous/u,
  );
});

test('requires an explicit bounded batch selection', () => {
  assert.throws(() => parseValidateRecordingE2EArguments([]), /Select E2Es/u);
  assert.deepEqual(parseValidateRecordingE2EArguments(['--source', 'custom']), {
    all: false,
    dryRun: false,
    source: 'custom',
    protocol: null,
    file: null,
    endpoint: 'http://127.0.0.1:9222',
  });
  assert.throws(
    () => parseValidateRecordingE2EArguments(['--source', 'custom', '--unknown']),
    /Unknown argument/u,
  );
  assert.throws(
    () => parseValidateRecordingE2EArguments(['--source', 'custom', 'custom']),
    /Unknown argument/u,
  );
  assert.throws(
    () => parseValidateRecordingE2EArguments(['--source', 'custom', '--source=defillama']),
    /only be provided once/u,
  );
});

test('batch validation selects the exact Desktop protocol and keeps five-attempt validation', async () => {
  const calls = [];
  const result = await validateDesktopRecordingE2Es({
    argv: ['--source', 'custom', '--protocol', 'opensea'],
    repository: repositoryDirectory,
    getWorkspace: async () => ({
      workspace: repositoryDirectory,
      protocols: [
        {
          position: 1,
          key: 'custom:gem',
          source: 'custom',
          id: 'gem',
          name: 'Gem',
          slug: 'gem',
          url: 'https://opensea.io',
        },
      ],
    }),
    selectProtocol: async (request, options) => {
      calls.push({ kind: 'select', request, options });
      return {
        selectedKey: 'custom:gem',
        match: 'source-hostname',
        webviewTargetId: 'webview-1',
      };
    },
    runE2E: async (testCase, options) => {
      calls.push({ kind: 'run', testCase, options });
      return {
        passed: true,
        passes: [
          {
            passed: true,
            freshWebView: true,
            finalUrl: 'https://opensea.io/',
            iconKey: 'onekey',
            sourceKind: 'inline',
          },
        ],
      };
    },
    writeFailureArtifact: async () => {
      assert.fail('A passing batch case must not write a DApp failure reason');
    },
  });

  assert.equal(result.passed, true);
  assert.equal(result.total, 1);
  assert.equal(result.results[0].requestedKey, 'custom:opensea');
  assert.equal(result.results[0].selectedKey, 'custom:gem');
  assert.equal(calls[0].kind, 'select');
  assert.equal(calls[1].kind, 'run');
  assert.equal(calls[1].options.maximumAttempts, 5);
});

test('batch validation times out one DApp and continues with the next', async () => {
  const testCases = [
    {
      schemaVersion: 1,
      kind: 'onekey-connect-button-desktop-e2e',
      source: 'custom',
      protocolId: 'first',
      site: 'first.example',
      startUrl: 'https://first.example/',
      recordingSha256: 'a'.repeat(64),
      actions: [],
    },
    {
      schemaVersion: 1,
      kind: 'onekey-connect-button-desktop-e2e',
      source: 'custom',
      protocolId: 'second',
      site: 'second.example',
      startUrl: 'https://second.example/',
      recordingSha256: 'b'.repeat(64),
      actions: [],
    },
  ];
  const protocols = testCases.map((testCase, index) => ({
    position: index + 1,
    key: `custom:${testCase.protocolId}`,
    source: 'custom',
    id: testCase.protocolId,
    url: testCase.startUrl,
  }));
  const signals = [];
  const failureArtifacts = [];
  const result = await validateDesktopRecordingE2Es({
    argv: ['--source', 'custom'],
    repository: repositoryDirectory,
    caseTimeoutMs: 20,
    discoverE2Es: async () =>
      testCases.map((testCase) => ({
        source: 'custom',
        slug: testCase.protocolId,
        file: `/workspace/${testCase.protocolId}/e2e.mjs`,
        relativeFile: `dapps/custom/${testCase.protocolId}/e2e.mjs`,
        testCase,
      })),
    getWorkspace: async () => ({ workspace: repositoryDirectory, protocols }),
    selectProtocol: async (request) => ({
      selectedKey: `custom:${request.protocolId}`,
      match: 'exact',
      webviewTargetId: `webview-${request.protocolId}`,
    }),
    runE2E: async (testCase, options) => {
      signals.push(options.signal);
      if (testCase.protocolId === 'first') return new Promise(() => undefined);
      return {
        passed: true,
        passes: [
          {
            passed: true,
            freshWebView: true,
            finalUrl: testCase.startUrl,
            iconKey: 'onekey',
            sourceKind: 'inline',
          },
        ],
      };
    },
    writeFailureArtifact: async (directory, details) => {
      failureArtifacts.push({ directory, details });
    },
  });

  assert.equal(result.passed, false);
  assert.equal(result.total, 2);
  assert.equal(result.passedCount, 1);
  assert.equal(result.failedCount, 1);
  assert.equal(result.caseTimeoutMs, 20);
  assert.match(result.results[0].error, /Desktop E2E custom:first timed out after 20 ms/u);
  assert.equal(result.results[1].passed, true);
  assert.equal(signals.length, 2);
  assert.equal(signals[0].aborted, true);
  assert.equal(signals[1].aborted, false);
  assert.equal(failureArtifacts.length, 1);
  assert.equal(failureArtifacts[0].directory, '/workspace/first');
  assert.equal(failureArtifacts[0].details.phase, 'validation');
  assert.match(failureArtifacts[0].details.error.message, /timed out after 20 ms/u);
});
