import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import { hackDir, packageDir } from './paths.mjs';

const mappingFile = path.join(packageDir, 'patterns/connector-mappings.json');
const mappings = JSON.parse(await fs.readFile(mappingFile, 'utf8'));
const walletConstants = await fs.readFile(path.join(hackDir, 'consts.ts'), 'utf8');

const NORMALIZERS = [
  [/^meta\s*mask$/i, 'metamask'],
  [/^wallet\s*connect$/i, 'walletconnect'],
  [/^phantom$/i, 'phantom'],
  [/^solflare(?: wallet)?$/i, 'solflare'],
  [/^jupiter(?: extension)?$/i, 'jupiter'],
  [/^unisat(?: wallet)?$/i, 'unisat'],
  [/^keplr(?: mobile| wallet)?$/i, 'keplr'],
  [/^petra(?: wallet)?$/i, 'petra'],
  [/^martian(?: wallet)?$/i, 'martian'],
  [/^sui(?: wallet)?$/i, 'suiwallet'],
  [/^slush(?: wallet)?$/i, 'slush'],
  [/^tronlink$/i, 'tronlink'],
  [/^(?:polkadot|polkadot\.js)$/i, 'polkadot'],
  [/^nami(?: wallet)?$/i, 'nami'],
];

export function connectorKind(text) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  return NORMALIZERS.find(([pattern]) => pattern.test(normalized))?.[1] || null;
}

export function connectorMapping(kind) {
  return mappings[kind] || null;
}

export function connectorIconFingerprint(kind) {
  if (!kind || !/^[a-z0-9]+$/i.test(kind)) return null;
  const block = walletConstants.match(
    new RegExp(`\\n\\s{2}${kind}: \\{([\\s\\S]*?)\\n\\s{2}\\},`),
  )?.[1];
  const icon = block?.match(/\n\s{4}icon: '([^']+)'/)?.[1];
  if (!icon) return null;
  return `sha256:${crypto.createHash('sha256').update(icon).digest('hex')}`;
}

export function mapWalletCandidates(candidates = []) {
  const seen = new Set();
  return candidates.flatMap((candidate) => {
    const wallet = connectorKind(candidate.text);
    const mapping = connectorMapping(wallet);
    if (!wallet || !mapping || seen.has(wallet)) return [];
    seen.add(wallet);
    return [{
      wallet,
      provider: mapping.provider,
      originalText: candidate.text,
      updatedText: mapping.updatedText,
      expectedMethods: mapping.expectedMethods,
      expectedIconFingerprint: connectorIconFingerprint(wallet),
      itemSelector: candidate.selector || null,
      iconSrc: candidate.iconSrc || null,
    }];
  });
}
