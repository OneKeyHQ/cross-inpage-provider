#!/usr/bin/env node
import fs from 'node:fs/promises';
import { parseArgs, requiredArg } from '../lib/args.mjs';
import { diagnoseFailure } from '../lib/diagnostics.mjs';

try {
  const args = parseArgs();
  const result = JSON.parse(await fs.readFile(requiredArg(args, 'result'), 'utf8'));
  process.stdout.write(`${JSON.stringify({ ok: true, ...diagnoseFailure(result) })}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exitCode = 4;
}
