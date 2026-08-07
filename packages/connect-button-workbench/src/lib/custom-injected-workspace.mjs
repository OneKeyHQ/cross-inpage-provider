import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_MANIFEST = 'packages/connect-button-workbench/config/onekey-app-custom-injected.json';
const MANIFEST_MAX_BYTES = 128 * 1024;
const REGISTRY_MAX_BYTES = 32 * 1024 * 1024;
const PRELOAD_MAX_BYTES = 64 * 1024 * 1024;
const TOOL_MAX_BYTES = 1024 * 1024;
const SAFE_SOURCE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function inside(parent, child) {
  const relative = path.relative(parent, child);
  return (
    Boolean(relative) &&
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function portablePath(parent, child) {
  return path.relative(parent, child).split(path.sep).join('/');
}

async function readRegularFile(file, maxBytes, label) {
  const stat = await fs.lstat(file);
  if (stat.isSymbolicLink() || !stat.isFile() || stat.size <= 0 || stat.size > maxBytes) {
    throw new Error(`${label} must be a regular file no larger than ${String(maxBytes)} bytes`);
  }
  return fs.readFile(file);
}

async function resolveWorkspaceFile(workspace, relativeFile, label, maxBytes) {
  if (typeof relativeFile !== 'string' || !relativeFile || path.isAbsolute(relativeFile)) {
    throw new Error(`${label} must be a relative workspace file`);
  }
  const candidate = path.resolve(workspace, relativeFile);
  if (!inside(workspace, candidate)) {
    throw new Error(`${label} escapes the selected workspace`);
  }
  const resolved = await fs.realpath(candidate);
  if (!inside(workspace, resolved)) {
    throw new Error(`${label} escapes the selected workspace`);
  }
  if (maxBytes) {
    await readRegularFile(resolved, maxBytes, label);
  }
  return resolved;
}

async function resolveWorkspaceDirectory(workspace, relativeDirectory, label) {
  if (
    typeof relativeDirectory !== 'string' ||
    !relativeDirectory ||
    path.isAbsolute(relativeDirectory)
  ) {
    throw new Error(`${label} must be a relative workspace directory`);
  }
  const candidate = path.resolve(workspace, relativeDirectory);
  if (!inside(workspace, candidate)) {
    throw new Error(`${label} escapes the selected workspace`);
  }
  const resolved = await fs.realpath(candidate);
  if (!inside(workspace, resolved)) {
    throw new Error(`${label} escapes the selected workspace`);
  }
  const stat = await fs.lstat(resolved);
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new Error(`${label} must be a regular directory`);
  }
  return resolved;
}

function isLocalAddress(hostname) {
  const host = String(hostname || '')
    .toLowerCase()
    .replace(/\.+$/u, '');
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host === 'broadcasthost') {
    return true;
  }
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/u);
  if (ipv4) {
    const octets = ipv4.slice(1).map(Number);
    if (octets.some((value) => value > 255)) return true;
    const [a, b, c] = octets;
    return Boolean(
      a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 0 && c === 0) ||
        (a === 192 && b === 168) ||
        (a === 198 && b >= 18 && b <= 19) ||
        a >= 224,
    );
  }
  const ipv6 =
    host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host.includes(':') ? host : '';
  if (!ipv6) return false;
  if (ipv6 === '::' || ipv6 === '::1' || ipv6.startsWith('::ffff:')) {
    return true;
  }
  const firstGroup = Number.parseInt(ipv6.split(':')[0] || '0', 16);
  return Boolean(
    Number.isNaN(firstGroup) ||
      (firstGroup & 0xffc0) === 0xfe80 ||
      (firstGroup & 0xfe00) === 0xfc00 ||
      (firstGroup & 0xff00) === 0xff00,
  );
}

export function isSafeCustomInjectedUrl(value) {
  if (typeof value !== 'string' || !value || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return Boolean(
      url.protocol === 'https:' &&
        !url.username &&
        !url.password &&
        (!url.port || url.port === '443') &&
        !url.hostname.includes('xn--') &&
        !isLocalAddress(url.hostname),
    );
  } catch {
    return false;
  }
}

export function parseCustomInjectedProtocols(
  registryText,
  protocolSource,
  registrySha256 = sha256(registryText),
) {
  if (!SAFE_SOURCE.test(protocolSource || '')) {
    throw new Error('Custom injection protocol source must be normalized');
  }
  const registry = JSON.parse(registryText);
  if (!Array.isArray(registry?.protocols)) {
    throw new Error('Custom injection registry must contain a protocols array');
  }
  if (registry.kind === 'onekey-custom-protocol-registry' && registry.source !== protocolSource) {
    throw new Error('Custom injection registry source does not match its manifest source');
  }
  const seenHostnames = new Set();
  return registry.protocols
    .flatMap((protocol) => {
      const id = String(protocol?.id || '').trim();
      if (!id) return [];
      const override = String(protocol?.target?.urlOverride || '');
      const resolved = String(protocol?.target?.resolvedDappUrl || '');
      const registryUrl = String(protocol?.sourceUrl || '');
      const url = override || resolved || registryUrl;
      if (!isSafeCustomInjectedUrl(url)) return [];
      const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./u, '');
      if (seenHostnames.has(hostname)) return [];
      seenHostnames.add(hostname);
      const rawReviewState = protocol?.manualReview?.state;
      const state =
        rawReviewState === 'processed' || rawReviewState === 'unsupported'
          ? rawReviewState
          : 'pending';
      const totalTvlValue = Number(protocol?.totalTvl);
      const bestRankValue = protocol?.priority?.bestRank;
      return [
        {
          key: `${protocolSource}:${id}`,
          source: protocolSource,
          id,
          name: String(protocol?.name || protocol?.slug || id),
          slug: String(protocol?.slug || protocol?.name || id),
          url,
          urlSource: override ? 'override' : resolved ? 'resolved' : 'registry',
          registryUrl: isSafeCustomInjectedUrl(registryUrl) ? registryUrl : null,
          registrySha256,
          totalTvl: Number.isFinite(totalTvlValue) && totalTvlValue > 0 ? totalTvlValue : 0,
          bestRank:
            bestRankValue !== null &&
            bestRankValue !== undefined &&
            Number.isFinite(Number(bestRankValue))
              ? Number(bestRankValue)
              : null,
          manualReview: {
            state,
            reviewedAt:
              typeof protocol?.manualReview?.reviewedAt === 'string'
                ? protocol.manualReview.reviewedAt
                : null,
            reviewedUrl:
              typeof protocol?.manualReview?.reviewedUrl === 'string'
                ? protocol.manualReview.reviewedUrl
                : null,
            injectedBundleSha256:
              typeof protocol?.manualReview?.injectedBundleSha256 === 'string'
                ? protocol.manualReview.injectedBundleSha256
                : null,
          },
        },
      ];
    })
    .sort(
      (left, right) =>
        right.totalTvl - left.totalTvl ||
        (left.bestRank ?? Number.MAX_SAFE_INTEGER) - (right.bestRank ?? Number.MAX_SAFE_INTEGER) ||
        left.id.localeCompare(right.id, 'en', {
          numeric: true,
          sensitivity: 'base',
        }),
    );
}

function protocolSourcesFromManifest(manifest) {
  if (manifest.schemaVersion === 2) {
    return [
      {
        source: manifest.dappSource,
        protocolRegistry: manifest.protocolRegistry,
        registryUpdater: manifest.registryUpdater,
        registryRefresher: manifest.registryRefresher,
      },
    ];
  }
  return manifest.protocolSources;
}

export async function inspectCustomInjectedWorkspace({
  repository,
  manifest = DEFAULT_MANIFEST,
} = {}) {
  if (!repository) throw new Error('Custom injection repository is required');
  const workspace = await fs.realpath(repository);
  const workspaceStat = await fs.lstat(workspace);
  if (workspaceStat.isSymbolicLink() || !workspaceStat.isDirectory()) {
    throw new Error('Custom injection repository must be a regular directory');
  }
  const manifestFile = await resolveWorkspaceFile(
    workspace,
    manifest,
    'Custom injection manifest',
    MANIFEST_MAX_BYTES,
  );
  const manifestValue = JSON.parse(
    (await readRegularFile(manifestFile, MANIFEST_MAX_BYTES, 'Custom injection manifest')).toString(
      'utf8',
    ),
  );
  if (
    ![2, 3].includes(manifestValue?.schemaVersion) ||
    manifestValue?.kind !== 'onekey-app-custom-injected'
  ) {
    throw new Error('Unsupported custom injection manifest');
  }
  const sourceManifests = protocolSourcesFromManifest(manifestValue);
  if (
    !Array.isArray(sourceManifests) ||
    sourceManifests.length < 1 ||
    sourceManifests.length > 20
  ) {
    throw new Error('Custom injection manifest protocolSources must contain 1 to 20 sources');
  }
  const sourceNames = new Set();
  for (const source of sourceManifests) {
    if (!SAFE_SOURCE.test(source?.source || '') || sourceNames.has(source.source)) {
      throw new Error('Custom injection manifest protocol source must be unique and normalized');
    }
    sourceNames.add(source.source);
  }

  const [desktopPreloadFile, dappsDirectory, recordingE2EGeneratorFile] = await Promise.all([
    resolveWorkspaceFile(
      workspace,
      manifestValue.desktopPreload,
      'desktopPreload',
      PRELOAD_MAX_BYTES,
    ),
    resolveWorkspaceDirectory(workspace, manifestValue.dappsDirectory, 'dappsDirectory'),
    manifestValue.recordingE2EGenerator
      ? resolveWorkspaceFile(
          workspace,
          manifestValue.recordingE2EGenerator,
          'recordingE2EGenerator',
          TOOL_MAX_BYTES,
        )
      : null,
  ]);

  const protocolSources = await Promise.all(
    sourceManifests.map(async (sourceManifest) => {
      const [registryFile, updaterFile, refresherFile] = await Promise.all([
        resolveWorkspaceFile(
          workspace,
          sourceManifest.protocolRegistry,
          `${sourceManifest.source}.protocolRegistry`,
          REGISTRY_MAX_BYTES,
        ),
        resolveWorkspaceFile(
          workspace,
          sourceManifest.registryUpdater,
          `${sourceManifest.source}.registryUpdater`,
          TOOL_MAX_BYTES,
        ),
        sourceManifest.registryRefresher
          ? resolveWorkspaceFile(
              workspace,
              sourceManifest.registryRefresher,
              `${sourceManifest.source}.registryRefresher`,
              TOOL_MAX_BYTES,
            )
          : null,
      ]);
      const registryContent = await readRegularFile(
        registryFile,
        REGISTRY_MAX_BYTES,
        `${sourceManifest.source} protocol registry`,
      );
      const registryText = registryContent.toString('utf8');
      const registryDigest = sha256(registryText);
      return {
        source: sourceManifest.source,
        protocolRegistry: portablePath(workspace, registryFile),
        registryUpdater: portablePath(workspace, updaterFile),
        registryRefresher: refresherFile ? portablePath(workspace, refresherFile) : null,
        registrySha256: registryDigest,
        protocols: parseCustomInjectedProtocols(
          registryText,
          sourceManifest.source,
          registryDigest,
        ),
      };
    }),
  );
  const protocols = protocolSources
    .flatMap((source) => source.protocols)
    .sort(
      (left, right) =>
        right.totalTvl - left.totalTvl ||
        (left.bestRank ?? Number.MAX_SAFE_INTEGER) - (right.bestRank ?? Number.MAX_SAFE_INTEGER) ||
        left.key.localeCompare(right.key, 'en', {
          numeric: true,
          sensitivity: 'base',
        }),
    );
  if (protocols.length === 0) {
    throw new Error('Custom injection registry has no supported active protocols');
  }
  const registrySha256 =
    protocolSources.length === 1
      ? protocolSources[0].registrySha256
      : sha256(
          JSON.stringify(protocolSources.map((source) => [source.source, source.registrySha256])),
        );
  const bundleSha256 = sha256(
    await readRegularFile(desktopPreloadFile, PRELOAD_MAX_BYTES, 'desktopPreload'),
  );

  return {
    schemaVersion: 1,
    kind: 'onekey-custom-injection-workspace-snapshot',
    workspace,
    manifest: portablePath(workspace, manifestFile),
    desktopPreload: portablePath(workspace, desktopPreloadFile),
    dappsDirectory: portablePath(workspace, dappsDirectory),
    recordingE2EGenerator: recordingE2EGeneratorFile
      ? portablePath(workspace, recordingE2EGeneratorFile)
      : null,
    registrySha256,
    bundleSha256,
    protocolSources: protocolSources.map(({ protocols: _protocols, ...source }) => source),
    protocols,
  };
}

export const CUSTOM_INJECTED_WORKSPACE_MANIFEST = DEFAULT_MANIFEST;
