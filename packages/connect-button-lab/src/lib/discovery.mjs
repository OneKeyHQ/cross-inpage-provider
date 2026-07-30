import { fetchText } from './http.mjs';

const POSITIVE = [
  [/\blaunch\s+app\b/i, 80],
  [/\bopen\s+app\b/i, 75],
  [/\benter\s+app\b/i, 70],
  [/\bapp\b/i, 50],
  [/\btrade\b/i, 36],
  [/\bstake\b/i, 34],
  [/\bborrow\b/i, 32],
  [/\blending\b/i, 30],
  [/\bdashboard\b/i, 28],
  [/\bportfolio\b/i, 24],
];
const NEGATIVE = [
  [/\b(docs?|documentation)\b/i, -100],
  [/\b(blog|news|careers?|jobs?)\b/i, -100],
  [/\b(terms|privacy|legal|governance)\b/i, -100],
  [/\b(discord|twitter|x\.com|telegram|medium|github)\b/i, -100],
];

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function registrableSuffix(hostname) {
  return hostname.toLowerCase().split('.').slice(-2).join('.');
}

export function extractDappCandidates(html, finalUrl, { limit = 5 } = {}) {
  const base = new URL(finalUrl);
  const root = registrableSuffix(base.hostname);
  const candidates = new Map();

  function add(url, text, baseScore = 0) {
    let parsed;
    try {
      parsed = new URL(url, base);
    } catch {
      return;
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) return;
    if (registrableSuffix(parsed.hostname) !== root) return;
    parsed.hash = '';
    const haystack = `${text} ${parsed.hostname} ${parsed.pathname}`;
    let score = baseScore;
    for (const [pattern, value] of POSITIVE) if (pattern.test(haystack)) score += value;
    for (const [pattern, value] of NEGATIVE) if (pattern.test(haystack)) score += value;
    if (/^(app|trade|stake|dashboard)\./i.test(parsed.hostname)) score += 45;
    if (parsed.origin === base.origin) score += 8;
    const normalized = parsed.href.replace(/\/$/, '');
    const existing = candidates.get(normalized);
    if (!existing || score > existing.score) {
      candidates.set(normalized, {
        url: normalized,
        hostname: parsed.hostname.toLowerCase(),
        text: decodeHtml(text).slice(0, 160),
        score,
      });
    }
  }

  add(base.href, 'source page', base.pathname === '/' ? 5 : 20);
  const bounded = String(html).slice(0, 2_000_000);
  const anchorPattern = /<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of bounded.matchAll(anchorPattern)) {
    add(match[1], match[2]);
  }
  const absolutePattern = /https?:\/\/[a-z0-9.-]+(?:\/[^\s"'<>]*)?/gi;
  for (const match of bounded.matchAll(absolutePattern)) {
    add(match[0], '');
  }
  return [...candidates.values()]
    .filter((candidate) => candidate.score > -50)
    .sort((left, right) => right.score - left.score || left.url.localeCompare(right.url))
    .slice(0, limit);
}

export async function discoverDapp(sourceUrl, options = {}) {
  if (!sourceUrl) {
    return {
      status: 'blocked',
      reason: 'Protocol has no source URL',
      finalUrl: null,
      candidates: [],
    };
  }
  try {
    const response = await (options.fetchImpl || globalThis.fetch)(sourceUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(options.timeoutMs || 30000),
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'OneKey-Connect-Button-Lab/1.0',
      },
    });
    if (!response.ok) {
      return {
        status: 'blocked',
        reason: `HTTP ${response.status}`,
        finalUrl: response.url || sourceUrl,
        candidates: [],
      };
    }
    const html = await response.text();
    const finalUrl = response.url || sourceUrl;
    return {
      status: 'ok',
      reason: null,
      finalUrl,
      candidates: extractDappCandidates(html, finalUrl, options),
    };
  } catch (error) {
    return {
      status: 'blocked',
      reason: error.message,
      finalUrl: sourceUrl,
      candidates: [],
    };
  }
}
