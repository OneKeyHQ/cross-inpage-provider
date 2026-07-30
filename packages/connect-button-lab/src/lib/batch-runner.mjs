import fs from 'node:fs/promises';
import path from 'node:path';
import { writeJsonAtomic, fileExists } from './json-file.mjs';
import {
  batchResultsDir,
  packageDir,
  registryFile as defaultRegistryFile,
} from './paths.mjs';
import { runCommand } from './process.mjs';
import {
  applyProtocolPatch,
  claimRegistryBatch,
  loadRegistry,
  registryProgress,
  saveRegistry,
  syncRegistry,
  validateRegistry,
} from './registry.mjs';
import { runProtocol } from './protocol-runner.mjs';

export function createRunId(now = new Date()) {
  return now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

async function buildLab() {
  const result = await runCommand('npm', ['run', 'build'], {
    cwd: packageDir,
    timeoutMs: 180000,
  });
  if (result.code !== 0) {
    throw new Error(`Build failed:\n${result.stderr.slice(-12000)}`);
  }
}

async function ensureRegistry(file, { allowSync, topPerChain, batchSize }) {
  if (!(await fileExists(file))) {
    if (!allowSync) throw new Error(`Registry does not exist: ${file}`);
    await syncRegistry({ file, topPerChain, batchSize });
  }
  let registry = await loadRegistry(file);
  const errors = await validateRegistry(registry);
  if (errors.length > 0) throw new Error(`Invalid registry:\n${errors.join('\n')}`);
  return registry;
}

async function releaseHardFailure(file, protocolId, reason) {
  const registry = await loadRegistry(file);
  const protocol = registry.protocols.find((candidate) => candidate.id === protocolId);
  if (!protocol) return;
  if (protocol.coverage.state === 'claimed') {
    await applyProtocolPatch(
      registry,
      protocolId,
      {
        coverage: {
          state: 'pending',
          runId: null,
          claimedAt: null,
          reason,
        },
      },
      { checkFiles: false },
    );
  } else if (protocol.regression.state === 'claimed') {
    await applyProtocolPatch(
      registry,
      protocolId,
      {
        regression: {
          state: 'pending',
          runId: null,
          claimedAt: null,
        },
      },
      { checkFiles: false },
    );
  }
  await saveRegistry(registry, file);
}

function textSummary(batch) {
  const lines = [
    `run: ${batch.runId}`,
    `cycle: ${batch.cycle.number} (${batch.cycle.kind})`,
    `claimed: ${batch.claimed}`,
  ];
  for (const result of batch.results) {
    lines.push(
      `- ${result.protocolId}: ${result.status}${
        result.outcome ? ` / ${result.outcome}` : ''
      }${result.task ? ` / ${result.task}` : ''}`,
    );
  }
  lines.push(
    `remaining coverage: ${batch.progress.pendingCoverage}`,
    `remaining regression: ${batch.progress.pendingRegression}`,
    `needs LLM: ${batch.progress.needsLlm}`,
  );
  return `${lines.join('\n')}\n`;
}

export async function runBatch({
  file = defaultRegistryFile,
  limit = 3,
  mode = 'auto',
  runId = createRunId(),
  allowSync = true,
  topPerChain = 20,
  batchSize = 3,
  build = buildLab,
  protocolRunner = runProtocol,
}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 3) {
    throw new Error('Batch limit must be an integer between 1 and 3');
  }
  let registry = await ensureRegistry(file, { allowSync, topPerChain, batchSize });
  let claim = claimRegistryBatch(registry, { limit, runId });
  if (claim.rolloverNeeded && allowSync) {
    await syncRegistry({
      file,
      topPerChain: registry.settings.topPerChain,
      batchSize: registry.settings.batchSize,
      startCycle: true,
    });
    registry = await loadRegistry(file);
    claim = claimRegistryBatch(registry, { limit, runId });
  }
  if (claim.selected.length > 0) await build();
  await saveRegistry(registry, file);
  const results = [];
  for (const protocol of claim.selected) {
    try {
      results.push(
        await protocolRunner({
          protocolId: protocol.id,
          registryFile: file,
          mode,
          skipBuild: true,
        }),
      );
    } catch (error) {
      const reason = String(error?.message || error).slice(0, 12000);
      await releaseHardFailure(file, protocol.id, reason);
      results.push({
        protocolId: protocol.id,
        status: 'hard_failure',
        error: reason,
      });
    }
  }

  registry = await loadRegistry(file);
  const batch = {
    schemaVersion: 1,
    runId,
    cycle: registry.cycle,
    claimed: claim.selected.length,
    results,
    progress: registryProgress(registry),
    finishedAt: new Date().toISOString(),
  };
  await fs.mkdir(batchResultsDir, { recursive: true });
  const jsonFile = path.join(batchResultsDir, `${runId}.json`);
  const summaryFile = path.join(batchResultsDir, `${runId}.txt`);
  await writeJsonAtomic(jsonFile, batch);
  await fs.writeFile(summaryFile, textSummary(batch));

  let exitCode = 0;
  if (results.some((result) => result.status === 'hard_failure')) exitCode = 4;
  else if (results.some((result) => result.status === 'needs_llm')) exitCode = 2;
  return {
    batch,
    exitCode,
    jsonFile,
    summaryFile,
  };
}
