const REVIEW_STATES = new Set(['pending', 'processed', 'unsupported']);
const SAFE_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

function normalizeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.href.replace(/\/$/u, '');
  } catch {
    return null;
  }
}

function defaultReview() {
  return {
    state: 'pending',
    reviewedAt: null,
    reviewedUrl: null,
    injectedBundleSha256: null,
  };
}

export function validateCustomProtocolRegistry(registry) {
  const errors = [];
  if (registry?.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (registry?.kind !== 'onekey-custom-protocol-registry') {
    errors.push('kind must be onekey-custom-protocol-registry');
  }
  if (!SAFE_SEGMENT.test(registry?.source || '')) {
    errors.push('source must be normalized');
  }
  if (!Array.isArray(registry?.protocols)) {
    return [...errors, 'protocols must be an array'];
  }
  const ids = new Set();
  const slugs = new Set();
  for (const protocol of registry.protocols) {
    const label = `protocol ${protocol?.id || '<missing>'}`;
    if (!SAFE_SEGMENT.test(protocol?.id || '') || ids.has(protocol.id)) {
      errors.push(`${label}: duplicate or invalid id`);
    }
    ids.add(protocol?.id);
    if (!SAFE_SEGMENT.test(protocol?.slug || '') || slugs.has(protocol.slug)) {
      errors.push(`${label}: duplicate or invalid slug`);
    }
    slugs.add(protocol?.slug);
    if (typeof protocol?.name !== 'string' || !protocol.name.trim()) {
      errors.push(`${label}: name is required`);
    }
    if (typeof protocol?.active !== 'boolean') {
      errors.push(`${label}: active must be boolean`);
    }
    if (!normalizeUrl(protocol?.sourceUrl)) {
      errors.push(`${label}: sourceUrl must be an HTTP(S) URL`);
    }
    if (
      protocol?.target?.urlOverride != null &&
      !normalizeUrl(protocol.target.urlOverride)
    ) {
      errors.push(`${label}: target.urlOverride must be an HTTP(S) URL or null`);
    }
    const state = protocol?.manualReview?.state || 'pending';
    if (!REVIEW_STATES.has(state)) {
      errors.push(`${label}: invalid manualReview.state`);
    }
    if (state === 'processed') {
      if (!Number.isFinite(Date.parse(protocol.manualReview.reviewedAt || ''))) {
        errors.push(`${label}: processed manual review requires reviewedAt`);
      }
      if (!normalizeUrl(protocol.manualReview.reviewedUrl)) {
        errors.push(`${label}: processed manual review requires reviewedUrl`);
      }
      if (!/^[a-f0-9]{64}$/iu.test(protocol.manualReview.injectedBundleSha256 || '')) {
        errors.push(`${label}: processed manual review requires injectedBundleSha256`);
      }
    }
  }
  return errors;
}

export function applyCustomProtocolPatch(registry, protocolId, patch) {
  const protocol = registry.protocols.find((candidate) => candidate.id === String(protocolId));
  if (!protocol) throw new Error(`Unknown protocol ID: ${protocolId}`);
  const unknown = Object.keys(patch).filter(
    (key) => key !== 'target' && key !== 'manualReview',
  );
  if (unknown.length > 0) {
    throw new Error(`Unsupported patch keys: ${unknown.join(', ')}`);
  }
  if (Object.prototype.hasOwnProperty.call(patch.target || {}, 'urlOverride')) {
    protocol.target ||= { urlOverride: null, resolvedDappUrl: null };
    const nextUrl = patch.target.urlOverride;
    if (nextUrl == null) {
      protocol.target.urlOverride = null;
    } else {
      const normalized = normalizeUrl(nextUrl);
      if (!normalized) {
        throw new Error('target.urlOverride must be an HTTP(S) URL or null');
      }
      protocol.target.urlOverride = normalized;
    }
    protocol.manualReview = defaultReview();
  }
  if (patch.manualReview) {
    protocol.manualReview = {
      ...(protocol.manualReview || defaultReview()),
      ...patch.manualReview,
    };
  }
  return protocol;
}
