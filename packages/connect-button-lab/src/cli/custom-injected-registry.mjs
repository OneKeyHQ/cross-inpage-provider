#!/usr/bin/env node
import fs from 'node:fs/promises';

import { parseArgs, requiredArg } from '../lib/args.mjs';
import { sha256 } from '../lib/http.mjs';
import {
  applyProtocolPatch,
  saveRegistry,
  validateRegistry,
} from '../lib/registry.mjs';

function processedReview(args, now) {
  const reviewedUrl = requiredArg(args, 'reviewed-url');
  const injectedBundleSha256 = requiredArg(args, 'bundle-sha256');
  if (!/^[a-f0-9]{64}$/iu.test(injectedBundleSha256)) {
    throw new Error('--bundle-sha256 must be a SHA-256 digest');
  }
  return {
    state: 'processed',
    reviewedAt: now,
    reviewedUrl,
    injectedBundleSha256: injectedBundleSha256.toLowerCase(),
  };
}

function makePatch(args, now) {
  const action = requiredArg(args, 'action');
  if (action === 'set-url') {
    if (args['clear-url']) {
      return { target: { urlOverride: null } };
    }
    return {
      target: {
        urlOverride: requiredArg(args, 'url'),
      },
    };
  }
  if (action === 'set-review') {
    const state = requiredArg(args, 'state');
    if (state === 'pending') {
      return {
        manualReview: {
          state,
          reviewedAt: null,
          reviewedUrl: null,
          injectedBundleSha256: null,
        },
      };
    }
    if (state === 'processed') {
      return { manualReview: processedReview(args, now) };
    }
    throw new Error('--state must be pending or processed');
  }
  throw new Error('--action must be set-url or set-review');
}

try {
  const args = parseArgs();
  const file = requiredArg(args, 'file');
  const protocolId = requiredArg(args, 'protocol-id');
  const expectedSha256 = requiredArg(args, 'expected-sha256').toLowerCase();
  if (!/^[a-f0-9]{64}$/iu.test(expectedSha256)) {
    throw new Error('--expected-sha256 must be a SHA-256 digest');
  }

  const originalText = await fs.readFile(file, 'utf8');
  const originalSha256 = sha256(originalText);
  if (originalSha256 !== expectedSha256) {
    throw new Error(
      `Registry changed since it was loaded: expected ${expectedSha256}, received ${originalSha256}`,
    );
  }

  const registry = JSON.parse(originalText);
  const now = new Date().toISOString();
  const protocol = await applyProtocolPatch(
    registry,
    protocolId,
    makePatch(args, now),
  );
  const errors = await validateRegistry(registry);
  if (errors.length > 0) {
    throw new Error(`Registry validation failed:\n${errors.join('\n')}`);
  }

  const currentText = await fs.readFile(file, 'utf8');
  const currentSha256 = sha256(currentText);
  if (currentSha256 !== originalSha256) {
    throw new Error(
      `Registry changed while the update was being prepared: expected ${originalSha256}, received ${currentSha256}`,
    );
  }

  await saveRegistry(registry, file);
  const savedText = `${JSON.stringify(registry, null, 2)}\n`;
  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      protocolId: protocol.id,
      urlOverride: protocol.target.urlOverride,
      manualReview: protocol.manualReview,
      registrySha256: sha256(savedText),
    })}\n`,
  );
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exitCode = 4;
}
