#!/usr/bin/env node
import fs from 'node:fs/promises';
import { parseArgs, requiredArg } from '../lib/args.mjs';
import { makeCaseManifest, writeCaseManifest } from '../lib/case-manifest.mjs';
import { registryFile } from '../lib/paths.mjs';
import { loadRegistry } from '../lib/registry.mjs';

try {
  const args = parseArgs();
  const protocolId = requiredArg(args, 'protocol-id');
  const registry = await loadRegistry(args.registry || registryFile);
  const protocol = registry.protocols.find((item) => item.id === protocolId);
  if (!protocol) throw new Error(`Unknown protocol ID: ${protocolId}`);
  const raw = JSON.parse(await fs.readFile(requiredArg(args, 'research'), 'utf8'));
  const machineResult = raw.result || raw;
  const adapterManifest = JSON.parse(
    await fs.readFile(requiredArg(args, 'manifest'), 'utf8'),
  );
  const manifest = makeCaseManifest({
    protocol,
    url: args.url || machineResult.url,
    trigger: machineResult.trigger,
    adapterManifest,
  });
  const output = await writeCaseManifest(manifest);
  process.stdout.write(`${JSON.stringify({ ok: true, ...output })}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exitCode = 4;
}
