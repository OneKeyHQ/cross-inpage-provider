#!/usr/bin/env node
import { parseArgs, numberArg } from '../lib/args.mjs';
import { registryFile } from '../lib/paths.mjs';
import { registryProgress, syncRegistry } from '../lib/registry.mjs';

try {
  const args = parseArgs();
  const topPerChain = numberArg(args, 'top', 20, { min: 1, max: 100 });
  const globalTop = numberArg(args, 'global-top', 1000, {
    min: 1,
    max: 5000,
  });
  const result = await syncRegistry({
    file: args.file || registryFile,
    topPerChain,
    globalTop,
    startCycle: Boolean(args['start-cycle']),
  });
  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      file: args.file || registryFile,
      cycle: result.registry.cycle,
      stats: result.stats,
      progress: registryProgress(result.registry),
    })}\n`,
  );
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exitCode = 4;
}
