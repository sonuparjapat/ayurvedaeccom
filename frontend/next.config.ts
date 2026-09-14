import type { NextConfig } from "next";

const SITE_URL   = process.env.NEXT_PUBLIC_SITE_URL   || 'https://oroganix.com'
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.oroganix.com'

const csp = [
  `default-src 'self'`,
  // Next.js App Router requires unsafe-inline for its hydration scripts
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://accounts.google.com`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com data:`,
  // Product images live on Cloudinary / S3; Google profile pictures from OAuth
  `img-src 'self' data: blob: https://*.cloudinary.com https://*.amazonaws.com https://*.googleusercontent.com https://lh3.googleusercontent.com`,
  // API calls + third-party services
  `connect-src 'self' ${BACKEND_URL} https://api.razorpay.com https://accounts.google.com https://oauth2.googleapis.com`,
  // Razorpay and Google OAuth open in iframes during checkout / sign-in
  `frame-src https://checkout.razorpay.com https://accounts.google.com https://api.razorpay.com`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `upgrade-insecure-requests`,
].join('; ')

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
          { key: 'Content-Security-Policy',  value: csp },
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
};

export default nextConfig;
