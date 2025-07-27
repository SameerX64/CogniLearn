/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
  images: {
    domains: ['localhost', 'via.placeholder.com'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Enable SWC minification
  swcMinify: true,
  // Configure TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },
  // Configure ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
