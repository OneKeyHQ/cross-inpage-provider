#!/usr/bin/env node
import { parseArgs, numberArg } from '../lib/args.mjs';
import { runBatch } from '../lib/batch-runner.mjs';
import { isRetryableExternalError } from '../lib/http.mjs';
import { registryFile } from '../lib/paths.mjs';

try {
  const args = parseArgs();
  const result = await runBatch({
    file: args.registry || registryFile,
    limit: numberArg(args, 'limit', 3, { min: 1, max: 3 }),
    mode: args.mode || 'auto',
    runId: args['run-id'],
    allowSync: !args['no-sync'],
    topPerChain: numberArg(args, 'top', 20, { min: 1, max: 100 }),
    batchSize: 3,
  });
  process.stdout.write(
    `${JSON.stringify({
      ok: result.exitCode === 0,
      runId: result.batch.runId,
      exitCode: result.exitCode,
      claimed: result.batch.claimed,
      outcomes: result.batch.results.map((item) => ({
        protocolId: item.protocolId,
        status: item.status,
        outcome: item.outcome,
        task: item.task,
        workPacket: item.workPacket,
      })),
      progress: result.batch.progress,
      summaryFile: result.summaryFile,
      resultFile: result.jsonFile,
    })}\n`,
  );
  process.exitCode = result.exitCode;
} catch (error) {
  const message = String(error?.message || error).slice(0, 12000);
  const exitCode = isRetryableExternalError(error) ? 3 : 4;
  process.stderr.write(
    `${JSON.stringify({
      ok: false,
      exitCode,
      ...(exitCode === 3
        ? { retryCondition: message }
        : { diagnostics: { error: message, maxBytes: 12000 } }),
    })}\n`,
  );
  process.exitCode = exitCode;
}
