#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArguments(argv) {
  const defaults = {
    config: path.resolve(
      packageDir,
      '../../connect-button-workbench/config/injected-provider-capabilities.json',
    ),
    source: path.join(packageDir, 'src/injectWeb3Provider.ts'),
    packageJson: path.join(packageDir, 'package.json'),
  };
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];
    if (!['--config', '--source', '--package-json'].includes(name) || !value) {
      throw new Error(
        'Usage: validate-provider-capabilities.mjs ' +
          '[--config <file>] [--source <file>] [--package-json <file>]',
      );
    }
    defaults[name === '--package-json' ? 'packageJson' : name.slice(2)] = path.resolve(value);
  }
  return defaults;
}

function normalizedChainName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(mainnet|network)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to read JSON (${file}): ${error.message}`);
  }
}

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
    return node.text;
  }
  return null;
}

function runtimeProviderIds(sourceFile) {
  const sourceText = fs.readFileSync(sourceFile, 'utf8');
  const source = ts.createSourceFile(
    sourceFile,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  let providerObject = null;

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'injectedChainProviders'
    ) {
      const initializer = node.initializer;
      if (ts.isObjectLiteralExpression(initializer)) {
        providerObject = initializer;
      } else if (
        ts.isCallExpression(initializer) &&
        ts.isObjectLiteralExpression(initializer.arguments[0])
      ) {
        providerObject = initializer.arguments[0];
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  if (!providerObject) {
    throw new Error(`Unable to find the injectedChainProviders object in ${sourceFile}`);
  }

  return providerObject.properties.map((property) => {
    if (!ts.isPropertyAssignment(property) && !ts.isShorthandPropertyAssignment(property)) {
      throw new Error('injectedChainProviders must contain only static object properties');
    }
    const name = propertyName(property.name);
    if (!name) {
      throw new Error('injectedChainProviders contains a computed provider ID');
    }
    return name;
  });
}

function validateConfig(config, packageManifest, configFile) {
  const errors = [];
  if (config?.schemaVersion !== 1) {
    errors.push(`${configFile} must declare schemaVersion 1`);
  }
  if (
    !config?.providers ||
    typeof config.providers !== 'object' ||
    Array.isArray(config.providers)
  ) {
    errors.push(`${configFile} must declare a providers object`);
    return errors;
  }

  const dependencies = {
    ...packageManifest.dependencies,
    ...packageManifest.devDependencies,
  };
  const chainOwners = new Map();
  let evmProviders = 0;

  for (const [providerId, capability] of Object.entries(config.providers)) {
    if (!/^[a-z][a-z0-9]*$/.test(providerId)) {
      errors.push(`Provider ID "${providerId}" is not normalized`);
    }
    if (!/^@onekeyfe\/onekey-.+-provider$/.test(capability?.packageName || '')) {
      errors.push(`Provider "${providerId}" has an invalid packageName`);
    } else if (!dependencies[capability.packageName]) {
      errors.push(
        `Provider "${providerId}" uses ${capability.packageName}, ` +
          'but that package is not a dependency of inpage-providers-hub',
      );
    }
    if (!['evm', 'names'].includes(capability?.chainMatcher)) {
      errors.push(`Provider "${providerId}" must use chainMatcher "evm" or "names"`);
    }
    const chainNames = capability?.chainNames;
    if (!Array.isArray(chainNames)) {
      errors.push(`Provider "${providerId}" must declare chainNames`);
      continue;
    }
    if (capability.chainMatcher === 'evm') {
      evmProviders += 1;
      if (chainNames.length > 0) {
        errors.push(`EVM provider "${providerId}" must use an empty chainNames array`);
      }
    } else if (chainNames.length === 0) {
      errors.push(`Named-chain provider "${providerId}" must declare at least one chain name`);
    }
    for (const chainName of chainNames) {
      const normalized = normalizedChainName(chainName);
      if (!normalized || normalized !== chainName) {
        errors.push(`Provider "${providerId}" has a non-normalized chain name: "${chainName}"`);
        continue;
      }
      const owner = chainOwners.get(normalized);
      if (owner && owner !== providerId) {
        errors.push(`Chain name "${normalized}" belongs to both "${owner}" and "${providerId}"`);
      }
      chainOwners.set(normalized, providerId);
    }
  }

  if (evmProviders !== 1) {
    errors.push(`Expected exactly one provider with chainMatcher "evm"; found ${evmProviders}`);
  }
  return errors;
}

function mismatchErrors({ configIds, runtimeIds, configFile, sourceFile }) {
  const configured = new Set(configIds);
  const runtime = new Set(runtimeIds);
  const errors = [];

  for (const providerId of configIds) {
    if (runtime.has(providerId)) continue;
    errors.push(
      `Provider capability mismatch: "${providerId}" is declared in ` +
        `${path.basename(configFile)} but has no runtime instance in ` +
        'injectedChainProviders.\n\n' +
        `Fix: add "${providerId}" to injectedChainProviders in ` +
        `${path.basename(sourceFile)}, or remove it from the shared configuration.`,
    );
  }
  for (const providerId of runtimeIds) {
    if (configured.has(providerId)) continue;
    errors.push(
      `Provider capability mismatch: "${providerId}" is instantiated by ` +
        `injectWeb3Provider but is missing from ${path.basename(configFile)}.\n\n` +
        `Fix: add "${providerId}" and its chain mapping to the shared ` +
        'configuration, or remove the runtime provider instance.',
    );
  }
  return errors;
}

try {
  const files = parseArguments(process.argv.slice(2));
  const config = readJson(files.config);
  const packageManifest = readJson(files.packageJson);
  const runtimeIds = runtimeProviderIds(files.source);
  const configIds = Object.keys(config.providers || {});
  const errors = [
    ...validateConfig(config, packageManifest, files.config),
    ...mismatchErrors({
      configIds,
      runtimeIds,
      configFile: files.config,
      sourceFile: files.source,
    }),
  ];
  if (errors.length > 0) {
    throw new Error(errors.join('\n\n'));
  }
  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      config: path.relative(packageDir, files.config),
      source: path.relative(packageDir, files.source),
      providers: configIds.length,
    })}\n`,
  );
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 4;
}
