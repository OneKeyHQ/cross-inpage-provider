#!/usr/bin/env node
import path from 'node:path';
import { parseArgs, requiredArg } from '../lib/args.mjs';
import { runElectronMachine } from '../lib/electron-runner.mjs';
import { packageDir, researchDir } from '../lib/paths.mjs';
import { runCommand } from '../lib/process.mjs';

try {
  const args = parseArgs();
  const id = args.id || 'manual-inspection';
  if (!args['skip-build']) {
    const build = await runCommand('npm', ['run', 'build'], {
      cwd: packageDir,
      timeoutMs: 180000,
    });
    if (build.code !== 0) throw new Error(build.stderr.slice(-12000));
  }
  const result = await runElectronMachine({
    id,
    url: requiredArg(args, 'url'),
    research: true,
    resultFile:
      args.output || path.join(researchDir, `${id}-manual-inspection.json`),
  });
  process.stdout.write(
    `${JSON.stringify({
      ok: result.status !== 'failed',
      status: result.status,
      trigger: result.trigger,
      research: result.research,
      inspection: {
        markerCount: result.inspection?.markerCount,
        injectedTexts: result.inspection?.injectedTexts,
        oneKeyTexts: result.inspection?.oneKeyTexts,
        blocked: result.inspection?.blocked,
      },
      screenshot: result.screenshot,
    })}\n`,
  );
  if (result.status === 'failed') process.exitCode = 4;
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exitCode = 4;
}
