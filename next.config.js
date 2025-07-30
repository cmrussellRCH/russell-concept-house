/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  // output: 'export', // Commented out - was causing issues with dynamic features
  trailingSlash: true,
}

module.exports = nextConfig