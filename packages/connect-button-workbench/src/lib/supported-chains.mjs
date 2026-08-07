import fs from 'node:fs';
import path from 'node:path';
import { configDir, repoDir } from './paths.mjs';

export const localProviderPackagesDir = path.join(
  repoDir,
  'packages/providers',
);

export const injectedProviderCapabilitiesFile = path.join(
  configDir,
  'injected-provider-capabilities.json',
);

export function readInjectedProviderCapabilities({
  file = injectedProviderCapabilitiesFile,
} = {}) {
  let config;
  try {
    config = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(
      `Unable to read injected provider capabilities (${file}): ${error.message}`,
    );
  }
  if (
    config?.schemaVersion !== 1 ||
    !config?.providers ||
    typeof config.providers !== 'object' ||
    Array.isArray(config.providers)
  ) {
    throw new Error(
      `Injected provider capabilities are invalid (${file})`,
    );
  }
  return config;
}

export function normalizeChainName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(mainnet|network)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function detectLocalProviderPackages({
  providersDir = localProviderPackagesDir,
  providerCapabilities = readInjectedProviderCapabilities(),
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
  const evmProvider = Object.values(
    providerCapabilities.providers,
  ).find((provider) => provider.chainMatcher === 'evm');
  if (!evmProvider || !packages.has(evmProvider.packageName)) {
    throw new Error(
      `Local provider packages do not include the configured EVM provider`,
    );
  }
  return packages;
}

export function localProviderForChain(
  chain,
  {
    providerCapabilities = readInjectedProviderCapabilities(),
    providerPackages = detectLocalProviderPackages({
      providerCapabilities,
    }),
  } = {},
) {
  const name = normalizeChainName(chain?.name);
  const provider = Object.entries(
    providerCapabilities.providers,
  ).find(
    ([, candidate]) =>
      providerPackages.has(candidate.packageName) &&
      (chain?.isEvm === true
        ? candidate.chainMatcher === 'evm'
        : candidate.chainMatcher === 'names' &&
          candidate.chainNames.includes(name)),
  );
  return provider
    ? {
        id: provider[0],
        packageName: provider[1].packageName,
      }
    : null;
}

export function filterLocalProviderChains(
  chains,
  {
    providerCapabilities = readInjectedProviderCapabilities(),
    providerPackages = detectLocalProviderPackages({
      providerCapabilities,
    }),
  } = {},
) {
  return chains.flatMap((chain) => {
    const provider = localProviderForChain(chain, {
      providerCapabilities,
      providerPackages,
    });
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
