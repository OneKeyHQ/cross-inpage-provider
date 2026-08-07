#!/usr/bin/env node
import { parseArgs, requiredArg } from '../lib/args.mjs';
import {
  CUSTOM_INJECTED_WORKSPACE_MANIFEST,
  inspectCustomInjectedWorkspace,
} from '../lib/custom-injected-workspace.mjs';

export async function runCustomInjectedWorkspaceCli({
  argv = process.argv.slice(2),
  cwd = process.cwd(),
} = {}) {
  const args = parseArgs(argv);
  const action = requiredArg(args, 'action');
  if (action !== 'inspect') {
    throw new Error('--action must be inspect');
  }
  return inspectCustomInjectedWorkspace({
    repository: args.workspace || cwd,
    manifest: args.manifest || CUSTOM_INJECTED_WORKSPACE_MANIFEST,
  });
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  try {
    const result = await runCustomInjectedWorkspaceCli();
    process.stdout.write(`${JSON.stringify({ ok: true, result })}\n`);
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      })}\n`,
    );
    process.exitCode = 4;
  }
}
