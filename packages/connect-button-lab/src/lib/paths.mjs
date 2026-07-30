import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const libDir = path.dirname(fileURLToPath(import.meta.url));
export const packageDir = path.resolve(libDir, '../..');
export const repoDir = path.resolve(packageDir, '../..');
export const hackDir = path.join(
  repoDir,
  'packages/providers/inpage-providers-hub/src/connectButtonHack',
);
export const registryFile = path.join(hackDir, 'defillama-protocols.json');
export const casesDir = path.join(packageDir, 'cases');
export const manifestsDir = path.join(packageDir, 'manifests');
export const workPacketsDir = path.join(packageDir, '.data/work-packets');
export const batchResultsDir = path.join(packageDir, '.data/batches');
export const researchDir = path.join(packageDir, '.data/research');
export const artifactsDir = path.join(packageDir, 'artifacts');
export const generatedAdapterFile = path.join(
  hackDir,
  'generated/defillama-sites.generated.ts',
);

export function repoRelativePath(file) {
  if (typeof file !== 'string' || !file) {
    throw new Error('Repository-relative path requires a non-empty file path');
  }
  const absolute = path.isAbsolute(file)
    ? path.resolve(file)
    : path.resolve(repoDir, file);
  const relative = path.relative(repoDir, absolute);
  if (
    !relative ||
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`Path is outside the repository: ${file}`);
  }
  return relative.split(path.sep).join('/');
}
