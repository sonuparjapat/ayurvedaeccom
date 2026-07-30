import type { NextConfig } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,                  // gzip all responses (helps mobile speed)
  productionBrowserSourceMaps: false, // don't ship source maps → smaller JS
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: 'oroganix.com' },
    ],
    formats: ['image/avif', 'image/webp'], // serve modern formats first
    minimumCacheTTL: 60 * 60 * 24 * 30,   // cache optimized images 30 days
  },

  // ── WWW + HTTP → canonical HTTPS non-www ───────────────────────────────────
  async redirects() {
    return [
      // www → non-www (permanent)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.oroganix.com' }],
        destination: `https://oroganix.com/:path*`,
        permanent: true,
      },
    ]
  },

  // ── Cache headers for static assets ──────────────────────────────────────
  async headers() {
    return [
      {
        // Immutable cache for Next.js hashed static chunks (JS/CSS)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // 30-day cache for public assets (images, fonts, etc.)
        source: '/(.*)\\.(jpg|jpeg|png|gif|webp|svg|ico|woff|woff2|ttf|otf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // Security + performance headers on all pages
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ]
  },
};

export default nextConfig;
