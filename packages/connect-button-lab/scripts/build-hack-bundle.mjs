import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const labDir = path.resolve(currentDir, '..');
const outputFile = path.join(labDir, 'dist/hack-bundle.js');

const aliases = new Map([
  [
    '@onekeyfe/cross-inpage-provider-core',
    path.join(labDir, 'src/injected/core-stub.ts'),
  ],
  [
    '@onekeyfe/cross-inpage-provider-types',
    path.join(labDir, 'src/injected/types-stub.ts'),
  ],
]);

await fs.mkdir(path.dirname(outputFile), { recursive: true });
await build({
  entryPoints: [path.join(labDir, 'src/injected/hack-entry.ts')],
  outfile: outputFile,
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: ['chrome120'],
  sourcemap: true,
  minify: false,
  nodePaths: [path.join(labDir, 'node_modules')],
  tsconfigRaw: {
    compilerOptions: {
      experimentalDecorators: true,
      useDefineForClassFields: false,
    },
  },
  define: {
    'process.env.NODE_ENV': '"development"',
  },
  plugins: [
    {
      name: 'connect-button-lab-aliases',
      setup(builder) {
        builder.onResolve({ filter: /^@onekeyfe\/cross-inpage-provider-(core|types)$/ }, (args) => ({
          path: aliases.get(args.path),
        }));
      },
    },
  ],
});

const stat = await fs.stat(outputFile);
console.log(
  JSON.stringify({
    output: path.relative(path.resolve(labDir, '../..'), outputFile),
    bytes: stat.size,
  }),
);
