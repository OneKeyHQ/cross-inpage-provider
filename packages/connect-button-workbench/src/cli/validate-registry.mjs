#!/usr/bin/env node
import { parseArgs } from '../lib/args.mjs';
import { registryFile } from '../lib/paths.mjs';
import { loadRegistry, registryProgress, validateRegistry } from '../lib/registry.mjs';

try {
  const args = parseArgs();
  const file = args.file || registryFile;
  const registry = await loadRegistry(file);
  const errors = await validateRegistry(registry, {
    checkFiles: !args['skip-file-checks'],
  });
  process.stdout.write(
    `${JSON.stringify({
      ok: errors.length === 0,
      file,
      cycle: registry.cycle,
      progress: registryProgress(registry),
      errors,
    })}\n`,
  );
  if (errors.length > 0) process.exitCode = 4;
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exitCode = 4;
}
