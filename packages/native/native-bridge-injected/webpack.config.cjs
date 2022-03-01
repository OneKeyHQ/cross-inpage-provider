const path = require('path');
const webpack = require('webpack');
const packageJson = require('./package.json');

const IS_PRD = process.env.NODE_ENV === 'production';

console.log('============ , IS_PRD', IS_PRD, process.env.NODE_ENV);

module.exports = {
  mode: IS_PRD ? 'production' : 'development', // development, production
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts'],
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
        use: ['babel-loader'],
        resolve: {
          fullySpecified: false,
        }
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: ['ts-loader'],
      },
    ],
  },
  plugins: [
  ],

  devtool: IS_PRD ? undefined : 'inline-source-map',
  target: 'electron-preload', // web, electron-preload, electron-renderer, node12.18.2
  entry: {
    injectedNative: './src/injectedNative.ts',
  },
  output: {
    // Fix: "Uncaught ReferenceError: exports is not defined".
    // Fix: JIRA window.require('...') error
    libraryTarget: 'umd',
    // Fix: "Uncaught ReferenceError: global is not defined"
    globalObject: 'window',
    path: path.resolve(__dirname, 'dist/injected'),
    filename: 'index.js',
  },
};
