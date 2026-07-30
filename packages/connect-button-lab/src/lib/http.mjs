import crypto from 'node:crypto';

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

export function isRetryableExternalError(error) {
  const codes = new Set([
    'ECONNRESET',
    'ECONNREFUSED',
    'ENETUNREACH',
    'ENOTFOUND',
    'EAI_AGAIN',
    'ETIMEDOUT',
  ]);
  const code = error?.code || error?.cause?.code;
  const message = String(error?.message || error);
  return (
    error?.name === 'AbortError' ||
    codes.has(code) ||
    RETRYABLE_STATUS.has(error?.status) ||
    /\b(fetch failed|network|dns|timed? ?out|socket hang up|HTTP (429|5\d\d))\b/i.test(
      message,
    )
  );
}

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export async function fetchText(
  url,
  { timeoutMs = 30000, retries = 3, fetchImpl = globalThis.fetch } = {},
) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {
        headers: {
          accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
          'user-agent': 'OneKey-Connect-Button-Lab/1.0',
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status} for ${url}`);
        error.status = response.status;
        throw error;
      }
      return await response.text();
    } catch (error) {
      lastError = error;
      const retryable = isRetryableExternalError(error);
      if (!retryable || attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

export async function fetchJson(url, options) {
  const text = await fetchText(url, options);
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON from ${url}: ${error.message}`);
  }
}
