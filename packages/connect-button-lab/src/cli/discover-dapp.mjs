#!/usr/bin/env node
import { parseArgs, requiredArg } from '../lib/args.mjs';
import { discoverDapp } from '../lib/discovery.mjs';

try {
  const args = parseArgs();
  const result = await discoverDapp(requiredArg(args, 'url'), {
    limit: Number(args.limit || 5),
  });
  process.stdout.write(`${JSON.stringify({ ok: result.status === 'ok', ...result })}\n`);
  if (result.status !== 'ok') process.exitCode = 3;
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exitCode = 4;
}
