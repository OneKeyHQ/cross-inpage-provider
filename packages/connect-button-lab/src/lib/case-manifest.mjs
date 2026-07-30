import path from 'node:path';
import { writeJsonAtomic } from './json-file.mjs';
import { casesDir, repoRelativePath } from './paths.mjs';

function safeSlug(value) {
  return String(value || 'protocol')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

export function validateCaseManifest(manifest) {
  const errors = [];
  if (manifest?.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (!manifest?.protocolId) errors.push('protocolId is required');
  try {
    const url = new URL(manifest?.url);
    if (!['http:', 'https:', 'file:'].includes(url.protocol)) errors.push('unsupported URL protocol');
  } catch {
    errors.push('url must be valid');
  }
  const actions = [...(manifest?.setup || []), ...(manifest?.openWallet || [])];
  const supported = new Set(['click', 'fill', 'waitFor', 'press', 'reload']);
  for (const action of actions) {
    if (!supported.has(action.action)) errors.push(`unsupported action: ${action.action}`);
    if (!action.selector && !action.text && action.action !== 'reload') {
      errors.push(`${action.action} requires selector or text`);
    }
    if (action.script || action.javascript) errors.push('arbitrary JavaScript is forbidden');
  }
  if (!Array.isArray(manifest?.assertions) || manifest.assertions.length === 0) {
    errors.push('assertions must be non-empty');
  }
  for (const assertion of manifest?.assertions || []) {
    if (
      !assertion.walletId ||
      !assertion.text ||
      !(
        /^sha256:[a-f0-9]{64}$/i.test(assertion.iconFingerprint || '') ||
        /^https:\/\/[^/]*onekey-asset\.com\//i.test(
          assertion.iconFingerprint || '',
        )
      ) ||
      assertion.count !== 1
    ) {
      errors.push(
        'each assertion requires walletId, text, iconFingerprint and count=1',
      );
    }
  }
  if (!manifest?.clickProbe?.expectedScope) errors.push('clickProbe.expectedScope is required');
  if (!Array.isArray(manifest?.clickProbe?.expectedMethods)) {
    errors.push('clickProbe.expectedMethods is required');
  }
  if (manifest?.assertReload !== true) errors.push('assertReload must be true');
  return errors;
}

export function makeCaseManifest({ protocol, url, trigger, adapterManifest }) {
  const firstWallet = adapterManifest.wallets[0];
  const manifest = {
    schemaVersion: 1,
    protocolId: protocol.id,
    slug: protocol.slug,
    name: protocol.name,
    url,
    viewport: {
      width: 1440,
      height: 900,
    },
    setup: [],
    openWallet: [
      {
        action: 'click',
        ...(trigger?.text ? { text: trigger.text } : {}),
        ...(trigger?.selector ? { selector: trigger.selector } : {}),
      },
    ],
    assertions: adapterManifest.wallets.map((wallet) => ({
      walletId: wallet.walletId,
      text: wallet.updatedText,
      iconFingerprint: wallet.expectedIconFingerprint,
      count: 1,
    })),
    clickProbe: {
      walletId: firstWallet.walletId,
      expectedScope: firstWallet.provider,
      expectedMethods: firstWallet.expectedMethods,
    },
    assertMutation: true,
    assertReload: true,
    timeouts: {
      navigationMs: 30000,
      walletModalMs: 15000,
    },
  };
  const errors = validateCaseManifest(manifest);
  if (errors.length > 0) {
    throw new Error(`Case manifest is invalid:\n${errors.join('\n')}`);
  }
  return manifest;
}

export async function writeCaseManifest(manifest) {
  const file = path.join(casesDir, `${safeSlug(manifest.slug)}.json`);
  await writeJsonAtomic(file, manifest);
  return {
    file,
    relativeFile: repoRelativePath(file),
  };
}
