/** @jest-environment node */

const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const webpack = require('webpack');
const configs = require('../../webpack.config.cjs');

describe('Buffer in production injection bundles', () => {
  it.each(configs.map((config) => [Object.keys(config.entry).join(', '), config]))(
    '%s runs without a browser-global Buffer',
    async (_name, config) => {
      const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'onekey-buffer-bundle-'));
      const entry = path.join(directory, 'entry.js');
      fs.writeFileSync(
        entry,
        `globalThis.bufferResult = {
          text: Buffer.from('你好👋', 'utf8').toString('hex'),
          bytes: Buffer.from([0, 1, 127, 128, 255]).toString('hex')
        };`,
      );

      const compiler = webpack({
        ...config,
        mode: 'production',
        entry,
        devtool: false,
        output: { ...config.output, path: directory, filename: 'bundle.js' },
        // The fixture is plain JavaScript; retain the real resolution and injection plugins.
        module: { rules: [] },
        plugins: config.plugins.filter(
          (plugin) => plugin.constructor.name !== 'BundleAnalyzerPlugin',
        ),
      });

      try {
        await new Promise((resolve, reject) => {
          compiler.run((error, stats) => {
            if (error) return reject(error);
            if (stats.hasErrors()) {
              return reject(new Error(stats.toString({ all: false, errors: true })));
            }
            resolve();
          });
        });
        const context = vm.createContext({ window: {}, self: {} });
        vm.runInContext(fs.readFileSync(path.join(directory, 'bundle.js'), 'utf8'), context);
        expect(context.bufferResult).toEqual({
          text: 'e4bda0e5a5bdf09f918b',
          bytes: '00017f80ff',
        });
        expect(context.Buffer).toBeUndefined();
        expect(context.window.Buffer).toBeUndefined();
      } finally {
        await new Promise((resolve) => compiler.close(resolve));
        fs.rmSync(directory, { recursive: true, force: true });
      }
    },
    60000,
  );
});
