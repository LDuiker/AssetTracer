import { MetadataRoute } from 'next';

/**
 * Sitemap for AssetTracer
 * Only includes PUBLIC pages that should be indexed by search engines
 * 
 * Dashboard, auth, and API routes are excluded for security
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.asset-tracer.com';
  const currentDate = new Date();

  return [
    // Homepage - highest priority
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    
    // Marketing pages (add these as you create them)
    // Uncomment when ready:
    
    // {
    //   url: `${baseUrl}/features`,
    //   lastModified: currentDate,
    //   changeFrequency: 'monthly',
    //   priority: 0.8,
    // },
    // {
    //   url: `${baseUrl}/pricing`,
    //   lastModified: currentDate,
    //   changeFrequency: 'monthly',
    //   priority: 0.8,
    // },
    // {
    //   url: `${baseUrl}/about`,
    //   lastModified: currentDate,
    //   changeFrequency: 'monthly',
    //   priority: 0.6,
    // },
    // {
    //   url: `${baseUrl}/contact`,
    //   lastModified: currentDate,
    //   changeFrequency: 'monthly',
    //   priority: 0.6,
    // },
    
    // Legal pages (if you have them)
    // {
    //   url: `${baseUrl}/privacy`,
    //   lastModified: currentDate,
    //   changeFrequency: 'yearly',
    //   priority: 0.3,
    // },
    // {
    //   url: `${baseUrl}/terms`,
    //   lastModified: currentDate,
    //   changeFrequency: 'yearly',
    //   priority: 0.3,
    // },
    
    // Blog posts (add dynamically when you have a blog)
    // Example:
    // {
    //   url: `${baseUrl}/blog/asset-management-guide`,
    //   lastModified: new Date('2025-01-15'),
    //   changeFrequency: 'monthly',
    //   priority: 0.7,
    // },
  ];
}

