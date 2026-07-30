#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runCommand } from '../src/lib/process.mjs';

const labDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(labDir, '../..');
const injectedDir = path.join(repoRoot, 'packages/injected');
const outputFile = path.join(
  injectedDir,
  'dist/injected/injectedDesktopPreload.js',
);
const generatedVersionInfoFile = path.join(
  repoRoot,
  'packages/core/src/versionInfo.ts',
);

const dependencyFiles = {
  hub: path.join(
    injectedDir,
    'node_modules/@onekeyfe/inpage-providers-hub/package.json',
  ),
  lerna: path.join(repoRoot, 'node_modules/lerna/cli.js'),
  tsc: path.join(repoRoot, 'node_modules/typescript/bin/tsc'),
  webpack: path.join(injectedDir, 'node_modules/webpack/bin/webpack.js'),
};

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function dependenciesReady() {
  return (
    await Promise.all(Object.values(dependencyFiles).map((file) => exists(file)))
  ).every(Boolean);
}

async function installRootDependencies() {
  if (await dependenciesReady()) return;
  const corepackHome = path.join(repoRoot, '.data/corepack');
  const yarnCacheFolder = path.join(repoRoot, '.data/yarn-cache');
  await fs.mkdir(corepackHome, { recursive: true });
  const packageJson = JSON.parse(
    await fs.readFile(path.join(repoRoot, 'package.json'), 'utf8'),
  );
  const yarnVersion = String(packageJson.packageManager || '').match(
    /^yarn@([^+]+)/u,
  )?.[1];
  if (!yarnVersion) {
    throw new Error('package.json must declare a Yarn packageManager version');
  }
  const yarnJs = path.join(
    corepackHome,
    'v1/yarn',
    yarnVersion,
    'bin/yarn.js',
  );
  if (!(await exists(yarnJs))) {
    await runChecked(
      'corepack',
      ['prepare', `yarn@${yarnVersion}`, '--activate'],
      {
        cwd: repoRoot,
        env: {
          ...process.env,
          COREPACK_HOME: corepackHome,
        },
        timeoutMs: 2 * 60 * 1000,
      },
    );
  }
  await runChecked(
    process.execPath,
    [yarnJs, 'install', '--frozen-lockfile'],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        COREPACK_HOME: corepackHome,
        YARN_CACHE_FOLDER: yarnCacheFolder,
        YARN_IGNORE_PATH: '1',
      },
      timeoutMs: 10 * 60 * 1000,
    },
  );
  if (!(await dependenciesReady())) {
    const lernaCli = path.join(repoRoot, 'node_modules/lerna/cli.js');
    const yarnBin = path.join(
      corepackHome,
      'v1/yarn',
      yarnVersion,
      'bin/yarn',
    );
    await runChecked(
      process.execPath,
      [
        lernaCli,
        'bootstrap',
        '--scope',
        '@onekeyfe/cross-inpage-provider-injected',
        '--include-dependencies',
        '--force-local',
        '--concurrency',
        '1',
        '--npm-client',
        yarnBin,
      ],
      {
        cwd: repoRoot,
        env: {
          ...process.env,
          COREPACK_HOME: corepackHome,
          YARN_CACHE_FOLDER: yarnCacheFolder,
          YARN_IGNORE_PATH: '1',
          YARN_PURE_LOCKFILE: 'true',
        },
        timeoutMs: 15 * 60 * 1000,
      },
    );
  }
  if (!(await dependenciesReady())) {
    throw new Error(
      'Repository bootstrap completed without installing build dependencies',
    );
  }
}

async function runChecked(command, args, options) {
  const result = await runCommand(command, args, options);
  if (result.code !== 0) {
    throw new Error(
      `${path.basename(command)} ${args.join(' ')} failed:\n${
        result.stderr || result.stdout
      }`.slice(-12000),
    );
  }
}

let originalVersionInfo;
try {
  await installRootDependencies();
  originalVersionInfo = await fs.readFile(generatedVersionInfoFile);
  const packageJson = JSON.parse(
    await fs.readFile(path.join(repoRoot, 'package.json'), 'utf8'),
  );
  const yarnVersion = String(packageJson.packageManager || '').match(
    /^yarn@([^+]+)/u,
  )?.[1];
  const corepackHome = path.join(repoRoot, '.data/corepack');
  const yarnBin = path.join(
    corepackHome,
    'v1/yarn',
    yarnVersion,
    'bin/yarn',
  );
  await runChecked(
    process.execPath,
    [
      path.join(repoRoot, 'node_modules/lerna/cli.js'),
      'run',
      'build',
      '--scope',
      '@onekeyfe/cross-inpage-provider-injected',
      '--include-dependencies',
      '--stream',
    ],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        COREPACK_HOME: corepackHome,
        PATH: `${path.dirname(yarnBin)}${path.delimiter}${process.env.PATH || ''}`,
        YARN_CACHE_FOLDER: path.join(repoRoot, '.data/yarn-cache'),
        YARN_IGNORE_PATH: '1',
        YARN_PURE_LOCKFILE: 'true',
      },
      timeoutMs: 30 * 60 * 1000,
    },
  );

  const content = await fs.readFile(outputFile);
  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      output: path.relative(repoRoot, outputFile),
      bytes: content.byteLength,
      sha256: crypto.createHash('sha256').update(content).digest('hex'),
    })}\n`,
  );
} catch (error) {
  process.stderr.write(
    `${JSON.stringify({
      ok: false,
      diagnostics: {
        error: String(error?.message || error).slice(0, 12000),
        maxBytes: 12000,
      },
    })}\n`,
  );
  process.exitCode = 4;
} finally {
  if (originalVersionInfo) {
    await fs.writeFile(generatedVersionInfoFile, originalVersionInfo);
  }
}
