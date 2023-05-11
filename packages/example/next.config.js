/** @type {import('next').NextConfig} */

const webpack = require('webpack');
const { withExpo } = require('@expo/next-adapter');
const withFonts = require('next-fonts');
const withPlugins = require('next-compose-plugins');
const withTM = require('next-transpile-modules')([
  'react-native-web',
  'react-native-svg',
  'native-base',
  'react-native-svg',
]);

const nextConfig = {
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  images: {
    // https://nextjs.org/docs/api-reference/next/image#loader-configuration
    loader: 'custom',
  },
  // https://nextjs.org/docs/api-reference/next.config.js/custom-page-extensions#including-non-page-files-in-the-pages-directory
  pageExtensions: ['page.tsx', 'page.ts', 'page.jsx', 'page.js'],
  // **** custom pageExtensions not working with native-base
  webpack: (config) => {
    config.plugins.push(
      new webpack.ProvidePlugin({
        React: 'react',
      })
    );

    // You can add more custom webpack configurations here
    return config;
  },
};

module.exports = withPlugins(
  [
    withTM,
    withFonts,
    withExpo,
  ],
  nextConfig,
);
