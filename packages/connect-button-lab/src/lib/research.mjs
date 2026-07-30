import fs from 'node:fs/promises';
import path from 'node:path';
import { mapWalletCandidates } from './connectors.mjs';
import { packageDir } from './paths.mjs';

const libraryPatterns = JSON.parse(
  await fs.readFile(path.join(packageDir, 'patterns/wallet-libraries.json'), 'utf8'),
);

function detectLibrary(research) {
  const selectors = [
    research?.modalSelector,
    ...(research?.walletCandidates || []).map((candidate) => candidate.selector),
  ].filter(Boolean);
  const genericTokens = new Set([
    'button',
    'dialog',
    'class',
    'data-testid',
    'role',
    'modal',
  ]);
  return libraryPatterns.find((pattern) =>
    pattern.selectors.some((librarySelector) => {
      const tokens = (librarySelector.match(/[a-z][a-z0-9-]{3,}/gi) || [])
        .filter((token) => !genericTokens.has(token.toLowerCase()))
        .sort((left, right) => right.length - left.length);
      return tokens.some((token) =>
        selectors.some((selector) =>
          selector.toLowerCase().includes(token.toLowerCase()),
        ),
      );
    }),
  ) || null;
}

export function classifyResearch(machineResult) {
  if (machineResult.status === 'blocked') {
    return {
      classification: 'externally_blocked',
      confidence: 1,
      patternId: null,
      needsLlm: false,
      reason: machineResult.summary,
      wallets: [],
    };
  }
  if (machineResult.status === 'native') {
    return {
      classification: 'native_supported',
      confidence: 1,
      patternId: null,
      needsLlm: false,
      reason: machineResult.summary,
      wallets: [],
    };
  }
  if (machineResult.status === 'passed' && machineResult.scriptedAssertionsPassed) {
    return {
      classification: 'standard_library',
      confidence: 1,
      patternId: 'existing-adapter',
      needsLlm: false,
      reason: 'Existing adapter passed scripted assertions',
      wallets: [],
    };
  }
  const wallets = mapWalletCandidates(machineResult.research?.walletCandidates);
  const library = detectLibrary(machineResult.research);
  const hasStableContainer = Boolean(machineResult.research?.modalSelector);
  const allStable = wallets.length > 0 &&
    wallets.every((wallet) => wallet.itemSelector || hasStableContainer);
  if (wallets.length > 0 && allStable) {
    const confidence = library?.confidence || (hasStableContainer ? 0.92 : 0.9);
    return {
      classification: library ? 'standard_library' : 'generic_modal',
      confidence,
      patternId: library?.id || 'generic-modal-v1',
      needsLlm: confidence < 0.9,
      reason: `${wallets.length} known wallet connector(s) with stable selectors`,
      wallets,
    };
  }
  if (machineResult.trigger?.clicked && wallets.length === 0) {
    return {
      classification: 'needs_review',
      confidence: 0.55,
      patternId: null,
      needsLlm: true,
      reason: 'Wallet entry point opened but no known wallet items were identified',
      wallets: [],
    };
  }
  return {
    classification: 'needs_review',
    confidence: 0.35,
    patternId: null,
    needsLlm: true,
    reason: machineResult.trigger?.reason || 'Connect wallet flow was not identified',
    wallets: [],
  };
}
