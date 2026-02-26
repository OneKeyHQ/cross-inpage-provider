module.exports = {
  // babel-plugin-lodash transforms `import { x } from 'lodash'` → `import x from 'lodash/x'`
  // to cherry-pick individual functions instead of bundling the entire 531 KB monolith.
  plugins: ['babel-plugin-lodash'],
  presets: [
    [
      '@babel/preset-env',
      {
        // "targets": {
          // "edge": "17",
          // "firefox": "60",
          // "chrome": "67",
          // "safari": "11.1"
        // },
        // "useBuiltIns": "usage",
        // "corejs": "3.6.5"
      }
    ]
  ]
};
