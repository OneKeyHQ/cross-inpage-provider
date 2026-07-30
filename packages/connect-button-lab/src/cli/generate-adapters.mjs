#!/usr/bin/env node
import { regenerateAdapters } from '../lib/adapter.mjs';

try {
  const result = await regenerateAdapters();
  process.stdout.write(`${JSON.stringify({ ok: true, ...result })}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exitCode = 4;
}
