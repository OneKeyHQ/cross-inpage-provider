/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
const path = require('path');
const webpack = require('webpack');
const packageJson = require('./package.json');
const { merge } = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const IS_PRD = process.env.NODE_ENV === 'production';

console.log('============ , IS_PRD', IS_PRD, process.env.NODE_ENV);

const createAnalyzer = (name) => {
  return new BundleAnalyzerPlugin({
    analyzerMode: 'static',
    reportFilename: `${name}.bundle-report.html`,
    openAnalyzer: false,
  });
};

const commonConfig = {
  mode: IS_PRD ? 'production' : 'development', // development, production
  optimization: {
    usedExports: true,
    minimize: true,
  },
  resolve: {
    alias: {
      // === Stubs: replace heavy libs with lightweight implementations ===

      // Stub poseidon-lite (~608 KB): transitive dep of @aptos-labs/ts-sdk,
      // only used for Keyless Account ZK hashing — never called in provider layer
      'poseidon-lite': path.resolve(__dirname, 'src/stubs/poseidon-lite-stub.js'),
      // Stub validator (~221 KB): tronweb only uses validator.isURL()
      validator: path.resolve(__dirname, 'src/stubs/validator-stub.js'),
      // Stub @alephium/web3 (~584 KB): provider only extends InteractiveSignerProvider.
      // NodeProvider/ExplorerProvider API calls are proxied via bridge in OnekeyAlphProvider.
      '@alephium/web3': path.resolve(
        __dirname,
        '../../packages/providers/onekey-alph-provider/src/stubs/alephium-web3.js',
      ),
      // === Peer deps ===
      '@aptos-labs/ts-sdk': path.resolve(
        __dirname,
        '../../packages/providers/onekey-aptos-provider/node_modules/@aptos-labs/ts-sdk',
      ),

      // === Dedup: multiple copies across providers → single copy ===
      // (yarn-deduplicate handles lockfile-level dedup, but monorepo workspace
      //  packages still get their own node_modules copies. These aliases force
      //  webpack to bundle only one copy.)
      // Dedup to v1.7.2 (installed in injected/package.json).
      // @scure/bip32 imports '@noble/hashes/legacy' which only exists in v1.7.2+
      '@noble/hashes': path.resolve(__dirname, 'node_modules/@noble/hashes'),
      '@noble/curves': path.resolve(__dirname, 'node_modules/@noble/curves'),
      'lodash-es': path.resolve(__dirname, '../../node_modules/lodash-es'),
      'bignumber.js': path.resolve(__dirname, 'node_modules/bignumber.js'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts'],
    fallback: {
      'crypto': false,
      'crypto-browserify': require.resolve('crypto-browserify'),
    },
  },
  module: {
    rules: [
      {
        test: /\.text-(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: ['raw-loader'],
      },
      {
        test: /\.(c|m)?(js|jsx)$/,
        exclude: (modulePath) => {
          const includeModules = [
            // force third party library to compile
            '@solana/web3.js',
          ];
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (includeModules.some((module) => modulePath.includes(module))) {
            console.log('webpack babel loader includeModules: ', modulePath);
            return false;
          }
          const excludeModulesRegex = [/node_modules/, /\.text\.(js|jsx|ts|tsx)$/];
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          return excludeModulesRegex.some((regex) => regex.test(modulePath));
        },
        use: [
          {
            loader: 'babel-loader',
            options: require('./babel.config.cjs'),
          },
        ],
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: ['ts-loader'],
      },
    ],
  },
  plugins: [].filter(Boolean),

  devtool: IS_PRD ? undefined : 'inline-source-map',
  output: {
    // Fix: "Uncaught ReferenceError: exports is not defined".
    // Fix: JIRA window.require('...') error
    libraryTarget: 'umd',
    // Fix: "Uncaught ReferenceError: global is not defined"
    globalObject: 'window',
    path: path.resolve(__dirname, 'dist/injected'),
    filename: '[name].js',
  },
};

const extensionConfig = merge(commonConfig, {
  resolve: {
    fallback: {
      buffer: require.resolve('buffer/'),
    },
  },
  target: 'web',
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    createAnalyzer('extension-and-native'),
  ],
  entry: {
    injectedExtension: './src/injectedExtension.ts',
    injectedNative: './src/injectedNative.ts',
  },
});

const desktopConfig = merge(commonConfig, {
  target: 'web',
  entry: {
    injectedDesktop: './src/injectedDesktop.ts',
  },
  externals: {
    electron: 'commonjs electron', // 将 Electron 标记为外部模块
  },
  plugins: [createAnalyzer('desktop')],
});

module.exports = [extensionConfig, desktopConfig];
