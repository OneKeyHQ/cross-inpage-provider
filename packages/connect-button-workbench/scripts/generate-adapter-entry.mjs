#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workbenchDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(workbenchDir, '../..');
const dappsDirectory = path.join(workbenchDir, 'dapps');
const generatedDirectory = path.join(
  repoRoot,
  'packages/providers/inpage-providers-hub/src/connectButtonHack/generated/workbench-adapters',
);
const safeSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const canonicalSourcePrefix = '../../../../providers/inpage-providers-hub/src/connectButtonHack/';
const canonicalProviderSource = '../../../../providers/inpage-providers-hub/src/injectWeb3Provider';
const generatedSourcePrefix = '../../../../';
const generatedProviderSource = '../../../../../injectWeb3Provider';

async function readOptionalConfig(directory, key) {
  const file = path.join(directory, 'adapter.config.json');
  let content;
  try {
    content = await fs.readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { enabled: true };
    }
    throw error;
  }
  const value = JSON.parse(content);
  if (
    value?.schemaVersion !== 1 ||
    typeof value.enabled !== 'boolean' ||
    Object.keys(value).some((key) => !['schemaVersion', 'enabled'].includes(key))
  ) {
    throw new Error(`${key}/adapter.config.json is invalid`);
  }
  return value;
}

async function regularFile(file, label) {
  const stat = await fs.lstat(file);
  if (stat.isSymbolicLink() || !stat.isFile() || stat.size === 0) {
    throw new Error(`${label} must be a non-empty regular file`);
  }
}

function generatedAdapterSource(source) {
  return `// AUTO-GENERATED from packages/connect-button-workbench/dapps. Do not edit.\n${source
    .replaceAll(canonicalSourcePrefix, generatedSourcePrefix)
    .replaceAll(canonicalProviderSource, generatedProviderSource)}`;
}

export async function discoverAdapters(rootDirectory = dappsDirectory) {
  const sourceEntries = await fs.readdir(rootDirectory, { withFileTypes: true });
  const adapters = [];
  for (const sourceEntry of sourceEntries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    if (!sourceEntry.isDirectory()) {
      continue;
    }
    if (!safeSlugPattern.test(sourceEntry.name)) {
      throw new Error(`${sourceEntry.name} is not a safe DApp source`);
    }
    const sourceDirectory = path.join(rootDirectory, sourceEntry.name);
    const sourceDirectoryStat = await fs.lstat(sourceDirectory);
    if (sourceDirectoryStat.isSymbolicLink()) {
      throw new Error(`${sourceEntry.name} must not be a symbolic link`);
    }
    try {
      await fs.access(path.join(sourceDirectory, 'adapter.ts'));
      throw new Error(
        `${sourceEntry.name}/adapter.ts uses the legacy flat layout; expected <source>/<slug>/adapter.ts`,
      );
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    const dappEntries = await fs.readdir(sourceDirectory, { withFileTypes: true });
    for (const dappEntry of dappEntries.sort((left, right) =>
      left.name.localeCompare(right.name),
    )) {
      if (!dappEntry.isDirectory()) continue;
      if (!safeSlugPattern.test(dappEntry.name)) {
        throw new Error(`${sourceEntry.name}/${dappEntry.name} is not a safe DApp key`);
      }
      const directory = path.join(sourceDirectory, dappEntry.name);
      const directoryStat = await fs.lstat(directory);
      const key = `${sourceEntry.name}:${dappEntry.name}`;
      if (directoryStat.isSymbolicLink()) {
        throw new Error(`${key} must not be a symbolic link`);
      }
      const adapterFile = path.join(directory, 'adapter.ts');
      try {
        await regularFile(adapterFile, `${sourceEntry.name}/${dappEntry.name}/adapter.ts`);
      } catch (error) {
        if (error.code === 'ENOENT') continue;
        throw error;
      }
      const config = await readOptionalConfig(directory, key);
      const adapterSourceEntries = await fs.readdir(directory, { withFileTypes: true });
      const sources = adapterSourceEntries
        .filter(
          (candidate) =>
            candidate.isFile() &&
            /^adapter(?:\.[a-z0-9-]+)?\.ts$/u.test(candidate.name) &&
            !/\.(?:spec|test)\.ts$/u.test(candidate.name),
        )
        .map((candidate) => candidate.name)
        .sort();
      adapters.push({
        source: sourceEntry.name,
        slug: dappEntry.name,
        key,
        directory,
        enabled: config.enabled,
        sources,
      });
    }
  }
  return adapters;
}

export async function writeGeneratedAdapters(adapters, outputDirectory = generatedDirectory) {
  const parentDirectory = path.dirname(outputDirectory);
  await fs.mkdir(parentDirectory, { recursive: true });
  const temporaryDirectory = await fs.mkdtemp(path.join(parentDirectory, '.workbench-adapters-'));
  try {
    const enabledAdapters = adapters.filter((adapter) => adapter.enabled);
    for (const adapter of enabledAdapters) {
      const adapterOutputDirectory = path.join(temporaryDirectory, adapter.source, adapter.slug);
      await fs.mkdir(adapterOutputDirectory, { recursive: true });
      for (const sourceName of adapter.sources) {
        const source = await fs.readFile(path.join(adapter.directory, sourceName), 'utf8');
        await fs.writeFile(
          path.join(adapterOutputDirectory, sourceName),
          generatedAdapterSource(source),
        );
      }
    }

    const imports = enabledAdapters.map(
      (adapter, index) =>
        `import adapter${String(index + 1)} from './${adapter.source}/${adapter.slug}/adapter';`,
    );
    const source = `${[
      '// AUTO-GENERATED by packages/connect-button-workbench/scripts/generate-adapter-entry.mjs.',
      '// Edit dapps/<source>/<slug>/adapter.ts instead of this directory.',
      ...imports,
      '',
      `export const workbenchAdapterKeys = ${JSON.stringify(
        enabledAdapters.map((adapter) => adapter.key),
      )} as const;`,
      '',
      `const workbenchAdapters = [${enabledAdapters
        .map((_, index) => `adapter${String(index + 1)}`)
        .join(', ')}] as const;`,
      '',
      'export default function runWorkbenchAdapters() {',
      '  for (const adapter of workbenchAdapters) {',
      '    adapter();',
      '  }',
      '}',
      '',
    ].join('\n')}`;
    await fs.writeFile(path.join(temporaryDirectory, 'index.generated.ts'), source);
    await fs.rm(outputDirectory, { recursive: true, force: true });
    await fs.rename(temporaryDirectory, outputDirectory);
  } catch (error) {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const adapters = await discoverAdapters();
  await writeGeneratedAdapters(adapters);
  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      adapterCount: adapters.filter((adapter) => adapter.enabled).length,
      disabled: adapters.filter((adapter) => !adapter.enabled).map((adapter) => adapter.key),
      output: path.relative(repoRoot, generatedDirectory).split(path.sep).join('/'),
    })}\n`,
  );
}
