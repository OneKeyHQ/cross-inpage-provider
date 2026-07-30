#!/usr/bin/env node
import fs from 'node:fs/promises';
import { parseArgs, requiredArg } from '../lib/args.mjs';
import { classifyResearch } from '../lib/research.mjs';

try {
  const args = parseArgs();
  const result = JSON.parse(await fs.readFile(requiredArg(args, 'research'), 'utf8'));
  const machineResult = result.result || result;
  const classification = classifyResearch(machineResult);
  process.stdout.write(
    `${JSON.stringify({
      ok: classification.confidence >= 0.9,
      classification: classification.classification,
      confidence: classification.confidence,
      patternId: classification.patternId,
      needsLlm: classification.needsLlm,
      wallets: classification.wallets,
      selectorCandidates: [
        machineResult.research?.modalSelector,
        ...(machineResult.research?.walletCandidates || []).map(
          (candidate) => candidate.selector,
        ),
      ]
        .filter(Boolean)
        .slice(0, 5),
    })}\n`,
  );
  if (classification.needsLlm) process.exitCode = 2;
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exitCode = 4;
}
