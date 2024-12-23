const path = require('path');
const webpack = require('webpack');
const packageJson = require('./package.json');
const { merge } = require('webpack-merge');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const IS_PRD = process.env.NODE_ENV === 'production';

console.log('============ , IS_PRD', IS_PRD, process.env.NODE_ENV);

const createAnalyzer = (name) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
  return new BundleAnalyzerPlugin({
    analyzerMode: 'static',
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    reportFilename: `${name}.bundle-report.html`,
    openAnalyzer: false,
  });
};

const commonConfig = {
  mode: IS_PRD ? 'production' : 'development', // development, production
  resolve: {
    // DO NOT need alias if injected working in all platforms
    //    alias module should be ES module export
    alias: {
      // secp256k1 required in @solana/web3.js index.iife.js
      // './precomputed/secp256k1': path.resolve(__dirname, 'development/resolveAlias/secp256k1-mock'),
      // '@solana/web3.js': path.resolve(__dirname, 'development/resolveAlias/@solana-web3'),
      tronweb: path.resolve(
        __dirname,
        'node_modules/@onekeyfe/inpage-providers-hub/node_modules/@onekeyfe/onekey-tron-provider/node_modules/tronweb/dist/TronWeb.js',
      ),
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
        test: /\.(js|jsx)$/,
        // exclude: /node_modules/,
        exclude: [/node_modules/, /\.text\.(js|jsx|ts|tsx)$/],
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
