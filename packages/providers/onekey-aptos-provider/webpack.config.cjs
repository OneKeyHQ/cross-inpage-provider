const path = require('path');
const { merge } = require('webpack-merge');

const MODE = process.env.NODE_ENV === 'production' ? 'production' : 'development';

// 公共配置：解析 TypeScript、排除外部依赖
const common = {
  mode: MODE,
  resolve: {
    extensions: ['.ts', '.js', '.mjs'],
    exportsFields: [],
    fullySpecified: false,
  },
  module: {
    rules: [
      {
        test: /\.(ts|mjs|js)$/, // 支持 .ts、.mjs 与 .js
        use: [
          {
            loader: 'babel-loader',
            options: {
              configFile: path.resolve(__dirname, 'babel.config.cjs'),
              cacheDirectory: true
            }
          },
          'ts-loader',
        ],
        exclude: /node_modules/,
      },
    ],
  },
};

// ESM 构建（module）
const esmConfig = merge(common, {
  target: 'web',
  entry: './src/index.ts',
  experiments: { outputModule: true },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: {
      type: 'module',
    },
  },
});

// CJS 构建（require）
const cjsConfig = merge(common, {
  target: 'web',
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist/cjs'),
    filename: 'index.js',
    library: {
      type: 'commonjs2',
    },
  },
});

module.exports = [esmConfig, cjsConfig];