#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs, requiredArg } from '../lib/args.mjs';
import {
  makeAdapterManifest,
  regenerateAdapters,
  writeAdapterManifest,
} from '../lib/adapter.mjs';
import { registryFile, repoDir } from '../lib/paths.mjs';
import { classifyResearch } from '../lib/research.mjs';
import { loadRegistry } from '../lib/registry.mjs';

try {
  const args = parseArgs();
  const registry = await loadRegistry(args.registry || registryFile);
  const protocolId = requiredArg(args, 'protocol-id');
  const protocol = registry.protocols.find((item) => item.id === protocolId);
  if (!protocol) throw new Error(`Unknown protocol ID: ${protocolId}`);
  const raw = JSON.parse(await fs.readFile(requiredArg(args, 'research'), 'utf8'));
  const machineResult = raw.result || raw;
  const classification = classifyResearch(machineResult);
  classification.research = machineResult.research;
  if (classification.confidence < 0.9 || classification.needsLlm) {
    process.stdout.write(
      `${JSON.stringify({
        ok: false,
        needsLlm: true,
        classification: classification.classification,
        confidence: classification.confidence,
      })}\n`,
    );
    process.exitCode = 2;
  } else {
    const manifest = makeAdapterManifest({
      protocol,
      url: args.url || machineResult.url,
      classification,
    });
    const manifestFile = await writeAdapterManifest(manifest);
    const generation = await regenerateAdapters();
    process.stdout.write(
      `${JSON.stringify({
        ok: true,
        manifestFile: path.relative(repoDir, manifestFile),
        adapterFile: generation.relativeFile,
        wallets: manifest.wallets.length,
      })}\n`,
    );
  }
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exitCode = 4;
}
