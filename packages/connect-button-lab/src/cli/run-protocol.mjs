#!/usr/bin/env node
import { parseArgs, numberArg, requiredArg } from '../lib/args.mjs';
import { registryFile } from '../lib/paths.mjs';
import { runProtocol } from '../lib/protocol-runner.mjs';

try {
  const args = parseArgs();
  const result = await runProtocol({
    protocolId: requiredArg(args, 'id'),
    registryFile: args.registry || registryFile,
    mode: args.mode || 'auto',
    skipBuild: Boolean(args['skip-build']),
    maxCandidates: numberArg(args, 'max-candidates', 3, { min: 1, max: 5 }),
  });
  process.stdout.write(`${JSON.stringify({ ok: true, ...result })}\n`);
  if (result.status === 'needs_llm') process.exitCode = 2;
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exitCode = 4;
}
