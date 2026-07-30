import fs from 'node:fs/promises';
import path from 'node:path';
import { writeJsonAtomic } from './json-file.mjs';
import {
  generatedAdapterFile,
  manifestsDir,
  repoRelativePath,
} from './paths.mjs';

function safeSlug(value) {
  return String(value || 'protocol')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

function walletId(provider, updatedText) {
  return `${provider}-${updatedText.replace(/[\s&.]/g, '').toLowerCase()}`.replace(
    /onekey/i,
    'onekey-',
  );
}

function validateSelector(selector) {
  if (typeof selector !== 'string' || !selector || selector.length > 500) return false;
  return !/[{};]/.test(selector) && !/<\/?script/i.test(selector);
}

export function validateAdapterManifest(manifest) {
  const errors = [];
  if (manifest?.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (!manifest?.protocolId) errors.push('protocolId is required');
  if (!Array.isArray(manifest?.urls) || manifest.urls.length === 0) {
    errors.push('urls must be a non-empty array');
  }
  for (const hostname of manifest?.urls || []) {
    if (
      typeof hostname !== 'string' ||
      hostname.includes('*') ||
      hostname.includes('/') ||
      !hostname.includes('.')
    ) {
      errors.push(`invalid exact hostname: ${hostname}`);
    }
  }
  if (!Array.isArray(manifest?.wallets) || manifest.wallets.length === 0) {
    errors.push('wallets must be a non-empty array');
  }
  const ids = new Set();
  for (const wallet of manifest?.wallets || []) {
    if (!wallet.wallet || !wallet.provider || !wallet.updatedText) {
      errors.push('wallet, provider and updatedText are required');
    }
    if (!/^sha256:[a-f0-9]{64}$/i.test(wallet.expectedIconFingerprint || '')) {
      errors.push(`invalid expected icon fingerprint for ${wallet.wallet}`);
    }
    if (!validateSelector(wallet.containerSelector)) {
      errors.push(`invalid container selector for ${wallet.wallet}`);
    }
    if (ids.has(wallet.walletId)) errors.push(`duplicate walletId: ${wallet.walletId}`);
    ids.add(wallet.walletId);
  }
  return errors;
}

export function makeAdapterManifest({ protocol, url, classification }) {
  const parsed = new URL(url);
  const modalSelector = classification.research?.modalSelector || null;
  const wallets = classification.wallets.map((wallet) => ({
    wallet: wallet.wallet,
    provider: wallet.provider,
    originalText: wallet.originalText,
    updatedText: wallet.updatedText,
    containerSelector: wallet.itemSelector || modalSelector,
    walletId: walletId(wallet.provider, wallet.updatedText),
    expectedMethods: wallet.expectedMethods,
    expectedIconFingerprint: wallet.expectedIconFingerprint,
  }));
  const manifest = {
    schemaVersion: 1,
    generated: true,
    protocolId: protocol.id,
    slug: protocol.slug,
    name: protocol.name,
    urls: [parsed.hostname.toLowerCase()],
    testUrl: parsed.href,
    classification: classification.classification,
    confidence: classification.confidence,
    patternId: classification.patternId,
    wallets,
  };
  const errors = validateAdapterManifest(manifest);
  if (errors.length > 0) {
    throw new Error(`Adapter manifest is invalid:\n${errors.join('\n')}`);
  }
  return manifest;
}

export async function writeAdapterManifest(manifest) {
  const file = path.join(manifestsDir, `${safeSlug(manifest.slug)}.json`);
  await writeJsonAtomic(file, manifest);
  return file;
}

function quote(value) {
  return JSON.stringify(value);
}

export function generateAdapterSource(manifests) {
  const valid = manifests
    .filter((manifest) => manifest?.generated !== false)
    .sort(
      (left, right) =>
        left.urls[0].localeCompare(right.urls[0]) ||
        String(left.protocolId).localeCompare(String(right.protocolId), 'en', { numeric: true }),
    );
  const entries = valid.map((manifest) => {
    const grouped = new Map();
    for (const wallet of manifest.wallets) {
      const wallets = grouped.get(wallet.provider) || [];
      wallets.push(wallet);
      grouped.set(wallet.provider, wallets);
    }
    const providerBlocks = [...grouped.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(
        ([provider, wallets]) => `      [IInjectedProviderNames.${provider}]: [
${wallets
  .sort((left, right) => left.wallet.localeCompare(right.wallet))
  .map(
    (wallet) => `        {
          ...basicWalletInfo[${quote(wallet.wallet)}],
          container: ${quote(wallet.containerSelector)},
        },`,
  )
  .join('\n')}
      ],`,
      )
      .join('\n');
    return `  {
    urls: ${JSON.stringify(manifest.urls)},
    testUrls: [${quote(manifest.testUrl)}],
    walletsForProvider: {
${providerBlocks}
    },
  },`;
  });

  const imports = valid.length > 0
    ? `import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { basicWalletInfo, SitesInfo } from '../universal/config';`
    : `import { SitesInfo } from '../universal/config';`;
  return `// This file is generated by @onekeyfe/connect-button-lab.
// Do not edit by hand; edit manifests/*.json and run generate:adapters.
${imports}

const defillamaSitesGenerated: SitesInfo[] = [
${entries.join('\n')}
];

export default defillamaSitesGenerated;
`;
}

export async function regenerateAdapters() {
  await fs.mkdir(manifestsDir, { recursive: true });
  const files = (await fs.readdir(manifestsDir))
    .filter((file) => file.endsWith('.json'))
    .sort();
  const manifests = [];
  for (const file of files) {
    const manifest = JSON.parse(await fs.readFile(path.join(manifestsDir, file), 'utf8'));
    const errors = validateAdapterManifest(manifest);
    if (errors.length > 0) {
      throw new Error(`${file} is invalid:\n${errors.join('\n')}`);
    }
    manifests.push(manifest);
  }
  const source = generateAdapterSource(manifests);
  await fs.mkdir(path.dirname(generatedAdapterFile), { recursive: true });
  await fs.writeFile(generatedAdapterFile, source);
  return {
    file: generatedAdapterFile,
    relativeFile: repoRelativePath(generatedAdapterFile),
    manifests: manifests.length,
  };
}
