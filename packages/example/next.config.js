/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // https://nextjs.org/docs/api-reference/next/image#loader-configuration
    loader:  'custom'
  },
}

module.exports = nextConfig
