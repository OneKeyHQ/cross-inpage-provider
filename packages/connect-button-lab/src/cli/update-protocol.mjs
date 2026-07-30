#!/usr/bin/env node
import fs from 'node:fs/promises';
import { parseArgs, requiredArg } from '../lib/args.mjs';
import { registryFile } from '../lib/paths.mjs';
import {
  applyProtocolPatch,
  loadRegistry,
  saveRegistry,
  validateRegistry,
} from '../lib/registry.mjs';

try {
  const args = parseArgs();
  const file = args.file || registryFile;
  const protocolId = requiredArg(args, 'protocol-id');
  const patchFile = requiredArg(args, 'patch');
  const patch = JSON.parse(await fs.readFile(patchFile, 'utf8'));
  const registry = await loadRegistry(file);
  const protocol = await applyProtocolPatch(registry, protocolId, patch);
  const errors = await validateRegistry(registry);
  if (errors.length > 0) {
    throw new Error(`Registry validation failed:\n${errors.join('\n')}`);
  }
  await saveRegistry(registry, file);
  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      protocolId,
      coverage: protocol.coverage,
      regression: protocol.regression,
    })}\n`,
  );
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exitCode = 4;
}
