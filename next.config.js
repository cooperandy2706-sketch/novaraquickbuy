// FILE: next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
    ],
    formats:     ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@tanstack/react-query'],
  },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options',        value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff'    },
        { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
      ],
    }]
  },
  async redirects() {
    return [
      { source: '/', destination: '/feed', permanent: false },
    ]
  },
}

module.exports = nextConfig