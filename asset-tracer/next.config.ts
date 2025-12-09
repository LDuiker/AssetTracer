import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Temporarily disable ESLint during production builds
    // TODO: Fix ESLint errors and re-enable
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Also ignore TypeScript errors during build for now
    // TODO: Fix TypeScript errors and re-enable
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Fix for jsdom/parse5 ES module compatibility issue
    // isomorphic-dompurify uses jsdom which depends on parse5 (ESM-only)
    if (isServer) {
      // Resolve parse5 to use dynamic import instead of require
      config.resolve.alias = {
        ...config.resolve.alias,
        'parse5': false, // Disable parse5 bundling, let it be loaded at runtime
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.supabase.co https://api.polar.sh https://secure.3gdirectpay.com https://www.google-analytics.com https://www.googletagmanager.com",
              "frame-src 'self' https://checkout.polar.sh https://vercel.live",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
