#!/usr/bin/env node
import { parseArgs, numberArg, requiredArg } from '../lib/args.mjs';
import { registryFile } from '../lib/paths.mjs';
import {
  claimRegistryBatch,
  loadRegistry,
  registryProgress,
  saveRegistry,
  validateRegistry,
} from '../lib/registry.mjs';

try {
  const args = parseArgs();
  const file = args.file || registryFile;
  const runId = requiredArg(args, 'run-id');
  const limit = numberArg(args, 'limit', 3, { min: 1, max: 20 });
  const registry = await loadRegistry(file);
  const errors = await validateRegistry(registry, { checkFiles: false });
  if (errors.length > 0) {
    throw new Error(`Registry validation failed:\n${errors.join('\n')}`);
  }
  const claim = claimRegistryBatch(registry, { limit, runId });
  await saveRegistry(registry, file);
  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      runId,
      rolloverNeeded: claim.rolloverNeeded,
      protocols: claim.selected.map((protocol) => ({
        id: protocol.id,
        slug: protocol.slug,
        name: protocol.name,
        sourceUrl: protocol.sourceUrl,
        sourceHostname: protocol.sourceHostname,
        task: protocol.coverage.state === 'claimed' ? 'coverage' : 'regression',
      })),
      progress: registryProgress(registry),
    })}\n`,
  );
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exitCode = 4;
}
