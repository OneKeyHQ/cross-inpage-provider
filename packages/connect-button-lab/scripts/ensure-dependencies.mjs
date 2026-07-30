import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(currentDir, '..');
const lockFile = path.join(packageDir, 'package-lock.json');
const markerFile = path.join(
  packageDir,
  'node_modules/.connect-button-lab-lock.sha256',
);
const requiredFiles = [
  path.join(
    packageDir,
    'node_modules/.bin',
    process.platform === 'win32' ? 'electron.cmd' : 'electron',
  ),
  path.join(
    packageDir,
    'node_modules/.bin',
    process.platform === 'win32' ? 'esbuild.cmd' : 'esbuild',
  ),
  path.join(packageDir, 'node_modules/lodash-es/package.json'),
];

async function lockDigest() {
  return crypto
    .createHash('sha256')
    .update(await fs.readFile(lockFile))
    .digest('hex');
}

async function dependenciesCurrent(digest) {
  try {
    const [marker] = await Promise.all([
      fs.readFile(markerFile, 'utf8'),
      ...requiredFiles.map((file) => fs.access(file)),
    ]);
    return marker.trim() === digest;
  } catch {
    return false;
  }
}

function runNpmCi() {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return new Promise((resolve, reject) => {
    const child = spawn(
      npm,
      ['ci', '--no-audit', '--no-fund'],
      {
        cwd: packageDir,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    let output = '';
    child.stdout.on('data', (chunk) => {
      output = `${output}${chunk}`.slice(-12000);
    });
    child.stderr.on('data', (chunk) => {
      output = `${output}${chunk}`.slice(-12000);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npm ci exited with ${code}\n${output}`));
    });
  });
}

const digest = await lockDigest();
if (!(await dependenciesCurrent(digest))) {
  try {
    await runNpmCi();
    await fs.writeFile(markerFile, `${digest}\n`);
  } catch (error) {
    process.stderr.write(
      `[connect-button-lab] dependency bootstrap failed: ${error.message}\n`,
    );
    process.exitCode = 3;
  }
}
