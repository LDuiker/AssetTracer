import { MetadataRoute } from 'next';

/**
 * Robots.txt for AssetTracer
 * Tells search engines what to crawl and what to avoid
 * 
 * SECURITY: Blocks all private user areas from being indexed
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.asset-tracer.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // User dashboard - NEVER index these
          '/dashboard',
          '/dashboard/*',
          
          // Settings and user-specific pages
          '/settings',
          '/settings/*',
          
          // Authentication pages
          '/auth',
          '/auth/*',
          '/login',
          '/login/*',
          
          // API routes - NEVER index these
          '/api',
          '/api/*',
          
          // Private user actions
          '/accept-invite',
          '/accept-invite/*',
          '/checkout',
          '/checkout/*',
          
          // Assets, clients, invoices (user-specific data)
          '/assets',
          '/assets/*',
          '/clients',
          '/clients/*',
          '/invoices',
          '/invoices/*',
          '/quotations',
          '/quotations/*',
          '/expenses',
          '/expenses/*',
          '/inventory',
          '/inventory/*',
          '/reports',
          '/reports/*',
          
          // Query parameters (prevent duplicate content)
          '/*?*',
          
          // Next.js internals
          '/_next',
          '/_next/*',
          '/*.json',
          // Note: sitemap.xml is explicitly allowed via allow: '/' above
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

