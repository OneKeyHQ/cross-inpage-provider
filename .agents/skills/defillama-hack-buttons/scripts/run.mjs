#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_RELATIVE_PATH = '.agents/skills/defillama-hack-buttons';
const MANIFEST_RELATIVE_PATH = 'onekey-app-custom-injected.json';

async function isRepository(directory) {
  try {
    const packageJson = JSON.parse(await fs.readFile(path.join(directory, 'package.json'), 'utf8'));
    await fs.access(path.join(directory, MANIFEST_RELATIVE_PATH));
    return packageJson.name === 'cross-inpage-provider';
  } catch {
    return false;
  }
}

async function findRepository() {
  const starts = [
    process.cwd(),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..'),
  ];
  for (const start of starts) {
    let current = path.resolve(start);
    while (current !== path.dirname(current)) {
      if (await isRepository(current)) return current;
      current = path.dirname(current);
    }
  }
  throw new Error('Could not locate the cross-inpage-provider repository');
}

function argumentValue(argv, name) {
  const index = argv.indexOf(name);
  if (index >= 0) {
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`${name} requires a value`);
    }
    return value;
  }
  const inline = argv.find((argument) => argument.startsWith(`${name}=`));
  return inline?.slice(name.length + 1) || null;
}

function parseArguments(argv) {
  const known = new Set(['--limit', '--site']);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const name = argument.split('=')[0];
    if (!known.has(name)) {
      throw new Error(`Unknown argument: ${argument}`);
    }
    if (!argument.includes('=')) index += 1;
  }

  const rawLimit = argumentValue(argv, '--limit');
  const limit = rawLimit === null ? 3 : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 3) {
    throw new Error('The skill runner only permits --limit between 1 and 3');
  }
  return {
    limit,
    site: argumentValue(argv, '--site'),
  };
}

function normalizeHostname(value) {
  if (!value) return null;
  try {
    const hostname = new URL(
      value.includes('://') ? value : `https://${value}`,
    ).hostname.toLowerCase();
    return hostname.replace(/^www\./, '');
  } catch {
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/^www\./, '');
  }
}

function protocolHostnames(protocol) {
  const values = [
    protocol.sourceHostname,
    protocol.target?.hostname,
    protocol.sourceUrl,
    protocol.target?.urlOverride,
    protocol.target?.resolvedDappUrl,
  ];
  return [...new Set(values.map(normalizeHostname).filter(Boolean))];
}

function preferredUrl(protocol) {
  return (
    protocol.target?.urlOverride || protocol.target?.resolvedDappUrl || protocol.sourceUrl || null
  );
}

function summarizeProtocol(protocol) {
  return {
    key: `${protocol.registrySource}:${protocol.id}`,
    source: protocol.registrySource,
    id: protocol.id,
    slug: protocol.slug,
    name: protocol.name,
    url: preferredUrl(protocol),
    hostname:
      normalizeHostname(preferredUrl(protocol)) ||
      normalizeHostname(protocol.target?.hostname) ||
      normalizeHostname(protocol.sourceHostname),
    sourceUrl: protocol.sourceUrl || null,
    urlOverride: protocol.target?.urlOverride || null,
    priority: protocol.priority || null,
    manualReview: protocol.manualReview || {
      state: 'pending',
      reviewedAt: null,
      reviewedUrl: null,
      injectedBundleSha256: null,
    },
  };
}

function priorityCompare(left, right) {
  return (
    (left.priority?.globalRank ?? Number.MAX_SAFE_INTEGER) -
      (right.priority?.globalRank ?? Number.MAX_SAFE_INTEGER) ||
    (left.priority?.bestRank ?? Number.MAX_SAFE_INTEGER) -
      (right.priority?.bestRank ?? Number.MAX_SAFE_INTEGER) ||
    (right.priority?.rankedChainCount ?? 0) - (left.priority?.rankedChainCount ?? 0) ||
    (right.priority?.maxChainTvl ?? 0) - (left.priority?.maxChainTvl ?? 0) ||
    String(left.id).localeCompare(String(right.id), undefined, { numeric: true })
  );
}

function resolveExplicitSite(protocols, query) {
  const normalizedQuery = String(query).trim().toLowerCase();
  const queryHostname = normalizeHostname(query);
  const exact = protocols.filter(
    (protocol) =>
      `${protocol.registrySource}:${protocol.id}`.toLowerCase() === normalizedQuery ||
      String(protocol.id).toLowerCase() === normalizedQuery ||
      String(protocol.slug).toLowerCase() === normalizedQuery ||
      String(protocol.name).toLowerCase() === normalizedQuery ||
      protocolHostnames(protocol).includes(queryHostname),
  );
  if (exact.length === 0) {
    throw new Error(`No protocol matches --site ${query}`);
  }
  if (exact.length > 1) {
    throw new Error(
      `Ambiguous --site ${query}; matches ${exact
        .slice(0, 8)
        .map((protocol) => protocol.slug)
        .join(', ')}`,
    );
  }
  return exact[0];
}

async function loadProtocolSources(repo) {
  const manifest = JSON.parse(await fs.readFile(path.join(repo, MANIFEST_RELATIVE_PATH), 'utf8'));
  if (!Array.isArray(manifest.protocolSources)) {
    throw new Error('Custom Injection manifest has no protocolSources');
  }
  const protocols = [];
  for (const sourceConfig of manifest.protocolSources) {
    if (
      typeof sourceConfig?.source !== 'string' ||
      typeof sourceConfig?.protocolRegistry !== 'string'
    ) {
      throw new Error('Custom Injection protocol source is invalid');
    }
    const registry = JSON.parse(
      await fs.readFile(path.join(repo, sourceConfig.protocolRegistry), 'utf8'),
    );
    if (!Array.isArray(registry.protocols)) {
      throw new Error(`Protocol registry is invalid: ${sourceConfig.source}`);
    }
    protocols.push(
      ...registry.protocols.map((protocol) => ({
        ...protocol,
        registrySource: sourceConfig.source,
      })),
    );
  }
  return protocols;
}

function commands(protocols) {
  const site = protocols[0]?.hostname || protocols[0]?.slug || '<hostname>';
  const cdpScript = `${SKILL_RELATIVE_PATH}/scripts/desktop-cdp.mjs`;
  return {
    cdpList: `node ${cdpScript} list`,
    cdpPreload: `node ${cdpScript} preload --site ${site}`,
    cdpOpenWallet: `node ${cdpScript} open-wallet --site ${site}`,
    cdpInspect: `node ${cdpScript} inspect --site ${site}`,
    buildDesktopPreload: 'npm --prefix packages/connect-button-workbench run build:desktop-preload',
    cdpReload: `node ${cdpScript} reload --site ${site}`,
    cdpVerify: `node ${cdpScript} verify --site ${site}`,
    validateRegistry: 'npm run hack-buttons:validate',
  };
}

try {
  const args = parseArguments(process.argv.slice(2));
  const repo = await findRepository();
  const allProtocols = await loadProtocolSources(repo);
  const targets = args.site
    ? [resolveExplicitSite(allProtocols, args.site)]
    : allProtocols
        .filter(
          (protocol) =>
            protocol.registrySource === 'defillama' &&
            (protocol.manualReview?.state || 'pending') === 'pending' &&
            preferredUrl(protocol),
        )
        .sort(priorityCompare)
        .slice(0, args.limit);
  const protocols = targets.map(summarizeProtocol);
  const counts = allProtocols.reduce(
    (result, protocol) => {
      const state = protocol.manualReview?.state || 'pending';
      result[state] = (result[state] || 0) + 1;
      return result;
    },
    { pending: 0, processed: 0, unsupported: 0 },
  );

  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      mode: args.site ? 'targeted' : 'next',
      readOnly: true,
      protocols,
      manualReviewCounts: counts,
      commands: commands(protocols),
    })}\n`,
  );
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exitCode = 4;
}
