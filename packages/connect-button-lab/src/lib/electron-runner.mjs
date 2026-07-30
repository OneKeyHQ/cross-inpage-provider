import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { packageDir } from './paths.mjs';
import { readJson } from './json-file.mjs';

export async function runElectronMachine({
  id,
  url,
  caseFile = null,
  research = false,
  timeoutMs = 70000,
  resultFile,
}) {
  const electron = path.join(
    packageDir,
    'node_modules/.bin',
    process.platform === 'win32' ? 'electron.cmd' : 'electron',
  );
  const args = [
    '.',
    '--machine-run',
    '--id',
    String(id),
    '--url',
    url,
    '--result-file',
    resultFile,
  ];
  if (caseFile) args.push('--case-file', caseFile);
  if (research) args.push('--research');

  await fs.mkdir(path.dirname(resultFile), { recursive: true });
  try {
    await fs.unlink(resultFile);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  const output = await new Promise((resolve, reject) => {
    const child = spawn(electron, args, {
      cwd: packageDir,
      env: {
        ...process.env,
        ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Electron machine run timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout.on('data', (chunk) => {
      stdout = `${stdout}${chunk}`.slice(-200_000);
    });
    child.stderr.on('data', (chunk) => {
      stderr = `${stderr}${chunk}`.slice(-200_000);
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
  const result = await readJson(resultFile, null);
  if (!result) {
    throw new Error(
      `Electron did not write a result (exit ${output.code}): ${output.stderr.slice(-4000)}`,
    );
  }
  return {
    ...result,
    runner: {
      exitCode: output.code,
      stderrTail: output.stderr.slice(-4000),
    },
  };
}
