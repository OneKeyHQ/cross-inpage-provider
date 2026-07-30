import fs from 'node:fs';
import path from 'node:path';
import { repoDir } from './paths.mjs';

export const localProviderPackagesDir = path.join(
  repoDir,
  'packages/providers',
);

const ETHEREUM_PROVIDER_PACKAGE = '@onekeyfe/onekey-eth-provider';

const NON_EVM_CHAIN_PROVIDERS = Object.freeze([
  {
    id: 'algo',
    packageName: '@onekeyfe/onekey-algo-provider',
    chainNames: ['algorand'],
  },
  {
    id: 'alephium',
    packageName: '@onekeyfe/onekey-alph-provider',
    chainNames: ['alephium'],
  },
  {
    id: 'aptos',
    packageName: '@onekeyfe/onekey-aptos-provider',
    chainNames: ['aptos'],
  },
  {
    id: 'bfc',
    packageName: '@onekeyfe/onekey-bfc-provider',
    chainNames: ['bfc'],
  },
  {
    id: 'btc',
    packageName: '@onekeyfe/onekey-btc-provider',
    chainNames: ['bitcoin'],
  },
  {
    id: 'cardano',
    packageName: '@onekeyfe/onekey-cardano-provider',
    chainNames: ['cardano'],
  },
  {
    id: 'conflux',
    packageName: '@onekeyfe/onekey-conflux-provider',
    chainNames: ['conflux'],
  },
  {
    id: 'cosmos',
    packageName: '@onekeyfe/onekey-cosmos-provider',
    chainNames: ['cosmos', 'cosmos hub', 'cosmoshub'],
  },
  {
    id: 'near',
    packageName: '@onekeyfe/onekey-near-provider',
    chainNames: ['near'],
  },
  {
    id: 'neo',
    packageName: '@onekeyfe/onekey-neo-provider',
    chainNames: ['neo'],
  },
  {
    id: 'polkadot',
    packageName: '@onekeyfe/onekey-polkadot-provider',
    chainNames: ['polkadot'],
  },
  {
    id: 'scdo',
    packageName: '@onekeyfe/onekey-scdo-provider',
    chainNames: ['scdo'],
  },
  {
    id: 'solana',
    packageName: '@onekeyfe/onekey-solana-provider',
    chainNames: ['solana'],
  },
  {
    id: 'stellar',
    packageName: '@onekeyfe/onekey-stellar-provider',
    chainNames: ['stellar'],
  },
  {
    id: 'sui',
    packageName: '@onekeyfe/onekey-sui-provider',
    chainNames: ['sui'],
  },
  {
    id: 'ton',
    packageName: '@onekeyfe/onekey-ton-provider',
    chainNames: ['ton'],
  },
  {
    id: 'tron',
    packageName: '@onekeyfe/onekey-tron-provider',
    chainNames: ['tron'],
  },
]);

function normalizedChainName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(mainnet|network)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function detectLocalProviderPackages({
  providersDir = localProviderPackagesDir,
} = {}) {
  let entries;
  try {
    entries = fs.readdirSync(providersDir, { withFileTypes: true });
  } catch (error) {
    throw new Error(
      `Unable to read the local provider packages (${providersDir}): ${error.message}`,
    );
  }
  const packages = new Set();
  for (const entry of entries) {
    if (!entry.isDirectory() || !/^onekey-.+-provider$/.test(entry.name)) {
      continue;
    }
    const packageFile = path.join(providersDir, entry.name, 'package.json');
    try {
      const manifest = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
      if (/^@onekeyfe\/onekey-.+-provider$/.test(manifest?.name || '')) {
        packages.add(manifest.name);
      }
    } catch (error) {
      throw new Error(
        `Unable to read the local provider manifest (${packageFile}): ${error.message}`,
      );
    }
  }
  if (!packages.has(ETHEREUM_PROVIDER_PACKAGE)) {
    throw new Error(
      `Local provider packages do not include ${ETHEREUM_PROVIDER_PACKAGE}`,
    );
  }
  return packages;
}

export function localProviderForChain(
  chain,
  { providerPackages = detectLocalProviderPackages() } = {},
) {
  if (chain?.isEvm === true && providerPackages.has(ETHEREUM_PROVIDER_PACKAGE)) {
    return {
      id: 'ethereum',
      packageName: ETHEREUM_PROVIDER_PACKAGE,
    };
  }
  const name = normalizedChainName(chain?.name);
  const provider = NON_EVM_CHAIN_PROVIDERS.find(
    (candidate) =>
      candidate.chainNames.includes(name) &&
      providerPackages.has(candidate.packageName),
  );
  return provider
    ? {
        id: provider.id,
        packageName: provider.packageName,
      }
    : null;
}

export function filterLocalProviderChains(
  chains,
  { providerPackages = detectLocalProviderPackages() } = {},
) {
  return chains.flatMap((chain) => {
    const provider = localProviderForChain(chain, { providerPackages });
    return provider
      ? [
          {
            ...chain,
            provider: provider.id,
            providerPackage: provider.packageName,
          },
        ]
      : [];
  });
}
