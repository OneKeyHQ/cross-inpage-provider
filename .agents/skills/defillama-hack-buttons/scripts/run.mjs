#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

async function isRepository(directory) {
  try {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(directory, 'package.json'), 'utf8'),
    );
    await fs.access(path.join(directory, 'packages/connect-button-lab/package.json'));
    return packageJson.name === 'cross-inpage-provider';
  } catch {
    return false;
  }
}

async function findRepository() {
  const starts = [
    process.cwd(),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'),
  ];
  for (const start of starts) {
    let current = path.resolve(start);
    while (current !== path.dirname(current)) {
      if (await isRepository(current)) return current;
      current = path.dirname(current);
    }
  }
  throw new Error('Could not locate the cross-inpage-provider repository');
}

function validateArguments(argv) {
  const limitIndex = argv.findIndex((argument) => argument === '--limit');
  const inlineLimit = argv.find((argument) => argument.startsWith('--limit='));
  const value =
    limitIndex >= 0
      ? Number(argv[limitIndex + 1])
      : inlineLimit
        ? Number(inlineLimit.slice('--limit='.length))
        : 3;
  if (!Number.isInteger(value) || value < 1 || value > 3) {
    throw new Error('The skill runner only permits --limit between 1 and 3');
  }
  return {
    hasLimit: limitIndex >= 0 || Boolean(inlineLimit),
    hasMode:
      argv.includes('--mode') || argv.some((argument) => argument.startsWith('--mode=')),
  };
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout = `${stdout}${chunk}`.slice(-20000);
    });
    child.stderr.on('data', (chunk) => {
      stderr = `${stderr}${chunk}`.slice(-20000);
    });
    child.on('error', reject);
    child.on('close', (exitCode) => {
      resolve({ code: exitCode ?? 4, stdout, stderr });
    });
  });
}

try {
  const forwarded = process.argv.slice(2);
  const argumentState = validateArguments(forwarded);
  const repo = await findRepository();
  const args = [
    '--prefix',
    'packages/connect-button-lab',
    'run',
    'batch',
    '--',
    ...(argumentState.hasLimit ? [] : ['--limit', '3']),
    ...(argumentState.hasMode ? [] : ['--mode', 'auto']),
    ...forwarded,
  ];
  const batch = await run('npm', args, repo);
  if (batch.code !== 0) {
    process.stdout.write(batch.stdout);
    process.stderr.write(batch.stderr);
    process.exitCode = batch.code;
  } else {
    const desktopBundle = await run(
      'npm',
      [
        '--prefix',
        'packages/connect-button-lab',
        'run',
        'build:desktop-preload',
      ],
      repo,
    );
    if (desktopBundle.code !== 0) {
      throw new Error(
        `Desktop preload build failed:\n${
          desktopBundle.stderr || desktopBundle.stdout
        }`.slice(-12000),
      );
    }
    process.stderr.write(batch.stderr);
    process.stdout.write(batch.stdout);
    process.exitCode = 0;
  }
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exitCode = 4;
}
