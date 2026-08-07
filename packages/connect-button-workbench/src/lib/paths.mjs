import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const libDir = path.dirname(fileURLToPath(import.meta.url));
export const packageDir = path.resolve(libDir, '../..');
export const repoDir = path.resolve(packageDir, '../..');
export const configDir = path.join(packageDir, 'config');
export const registryFile = path.join(configDir, 'defillama-protocols.json');
export const dappResolutionsFile = path.join(
  packageDir,
  'dapp-url-resolutions.json',
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
