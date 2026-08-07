import assert from 'node:assert/strict';
import test from 'node:test';

import { verifyPage } from './desktop-cdp-verification.mjs';

function pageWithReplacement(replacement) {
  return {
    customInjection: {
      runtime: { source: 'custom-workspace' },
      indicator: { visible: true },
    },
    replacements: [
      {
        tag: 'DIV',
        id: null,
        disabled: false,
        opacity: '1',
        pointerEvents: 'auto',
        visible: true,
        ...replacement,
      },
    ],
  };
}

test('accepts a standalone OneKey replacement marked by wallet ID', () => {
  const result = verifyPage(
    pageWithReplacement({
      text: 'OneKey',
      walletLabel: '',
      walletId: 'ethereum-onekey-wallet',
      image: null,
    }),
  );

  assert.equal(result.desktopDomCheckPassed, true);
  assert.equal(result.visibleOneKeyReplacementCount, 1);
  assert.equal(result.visibleJointReplacementCount, 0);
});

test('continues to accept a joint OneKey replacement', () => {
  const result = verifyPage(
    pageWithReplacement({
      text: 'OneKey & MetaMask',
      walletLabel: 'OneKey & MetaMask',
      walletId: 'ethereum-onekey-metamask',
      image: { source: 'data:image/svg+xml;base64,onekey-metamask' },
    }),
  );

  assert.equal(result.desktopDomCheckPassed, true);
  assert.equal(result.visibleJointReplacementCount, 1);
});
