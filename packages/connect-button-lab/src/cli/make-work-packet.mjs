#!/usr/bin/env node
import fs from 'node:fs/promises';
import { parseArgs, requiredArg } from '../lib/args.mjs';
import { registryFile } from '../lib/paths.mjs';
import { classifyResearch } from '../lib/research.mjs';
import { loadRegistry } from '../lib/registry.mjs';
import { makeWorkPacket } from '../lib/work-packet.mjs';

try {
  const args = parseArgs();
  const protocolId = requiredArg(args, 'protocol-id');
  const registry = await loadRegistry(args.registry || registryFile);
  const protocol = registry.protocols.find((item) => item.id === protocolId);
  if (!protocol) throw new Error(`Unknown protocol ID: ${protocolId}`);
  const raw = JSON.parse(await fs.readFile(requiredArg(args, 'result'), 'utf8'));
  const machineResult = raw.result || raw;
  const classification = classifyResearch(machineResult);
  const packet = await makeWorkPacket({
    protocol,
    task: args.task || 'repair_e2e',
    discovery: null,
    machineResult,
    classification,
    failure: null,
  });
  process.stdout.write(`${JSON.stringify({ ok: true, ...packet })}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exitCode = 4;
}
