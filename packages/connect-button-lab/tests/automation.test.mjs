import assert from 'node:assert/strict';
import test from 'node:test';
import {
  generateAdapterSource,
  makeAdapterManifest,
  validateAdapterManifest,
} from '../src/lib/adapter.mjs';
import {
  makeCaseManifest,
  validateCaseManifest,
} from '../src/lib/case-manifest.mjs';
import { diagnoseFailure } from '../src/lib/diagnostics.mjs';
import { extractDappCandidates } from '../src/lib/discovery.mjs';
import { isRetryableExternalError } from '../src/lib/http.mjs';
import { classifyResearch } from '../src/lib/research.mjs';

const protocol = {
  id: '42',
  slug: 'example',
  name: 'Example',
};

test('dapp discovery ranks app links and excludes docs/social links', () => {
  const html = `
    <a href="https://docs.example.com">Docs</a>
    <a href="https://app.example.com/swap">Launch App</a>
    <a href="/blog">Blog</a>
    <a href="https://twitter.com/example">Twitter</a>
  `;
  const candidates = extractDappCandidates(html, 'https://example.com');
  assert.equal(candidates[0].url, 'https://app.example.com/swap');
  assert.ok(!candidates.some((candidate) => candidate.hostname === 'docs.example.com'));
});

test('structured research generates a validated adapter and case', () => {
  const machineResult = {
    status: 'review',
    trigger: {
      clicked: true,
      text: 'Connect Wallet',
      selector: '#connect-wallet',
    },
    research: {
      modalSelector: '[role="dialog"][aria-label="Connect wallet"]',
      walletCandidates: [
        {
          text: 'MetaMask',
          selector: 'button[data-testid="wallet-metamask"]',
          iconSrc: 'https://example.com/metamask.svg',
        },
      ],
    },
  };
  const classification = classifyResearch(machineResult);
  assert.equal(classification.classification, 'generic_modal');
  assert.ok(classification.confidence >= 0.9);
  classification.research = machineResult.research;

  const adapter = makeAdapterManifest({
    protocol,
    url: 'https://app.example.com',
    classification,
  });
  assert.deepEqual(validateAdapterManifest(adapter), []);
  assert.equal(adapter.wallets[0].walletId, 'ethereum-onekey-metamask');

  const caseManifest = makeCaseManifest({
    protocol,
    url: 'https://app.example.com',
    trigger: machineResult.trigger,
    adapterManifest: adapter,
  });
  assert.deepEqual(validateCaseManifest(caseManifest), []);
  assert.equal(caseManifest.assertReload, true);
  assert.equal(caseManifest.clickProbe.expectedScope, 'ethereum');
  assert.match(caseManifest.assertions[0].iconFingerprint, /^sha256:[a-f0-9]{64}$/);

  const source = generateAdapterSource([adapter]);
  assert.match(source, /app\.example\.com/);
  assert.match(source, /basicWalletInfo\["metamask"\]/);
  assert.doesNotMatch(source, /eval|new Function/);

  const emptySource = generateAdapterSource([]);
  assert.doesNotMatch(emptySource, /IInjectedProviderNames|basicWalletInfo/);
  assert.match(emptySource, /SitesInfo/);
});

test('manifest validators reject wildcard hostnames and arbitrary JavaScript', () => {
  assert.ok(
    validateAdapterManifest({
      schemaVersion: 1,
      protocolId: '1',
      urls: ['*.example.com'],
      wallets: [
        {
          wallet: 'metamask',
          provider: 'ethereum',
          updatedText: 'OneKey & MetaMask',
          walletId: 'ethereum-onekey-metamask',
          containerSelector: 'button',
        },
      ],
    }).some((error) => error.includes('hostname')),
  );
  assert.ok(
    validateCaseManifest({
      schemaVersion: 1,
      protocolId: '1',
      url: 'https://example.com',
      setup: [{ action: 'click', selector: 'button', script: 'alert(1)' }],
      openWallet: [{ action: 'click', text: 'Connect' }],
      assertions: [
        {
          walletId: 'ethereum-onekey-metamask',
          text: 'OneKey & MetaMask',
          count: 1,
        },
      ],
      clickProbe: { expectedScope: 'ethereum', expectedMethods: ['eth_accounts'] },
      assertReload: true,
    }).includes('arbitrary JavaScript is forbidden'),
  );
});

test('failure diagnosis is deterministic and uses scripted assertions', () => {
  assert.deepEqual(
    diagnoseFailure({
      status: 'review',
      scriptedAssertions: [
        {
          id: 'provider_route',
          required: true,
          passed: false,
        },
      ],
    }).code,
    'provider_route_mismatch',
  );
});

test('external retry classification separates network failures from code failures', () => {
  assert.equal(
    isRetryableExternalError(Object.assign(new Error('fetch failed'), { code: 'ENOTFOUND' })),
    true,
  );
  assert.equal(isRetryableExternalError(new Error('Generated registry is invalid')), false);
});
