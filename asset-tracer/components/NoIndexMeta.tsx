'use client';

import { useEffect } from 'react';

/**
 * NoIndexMeta Component
 * Adds noindex meta tag to prevent search engines from indexing private pages
 * Used in dashboard, auth, and other private areas
 * 
 * This is a safety layer on top of robots.txt
 */
export function NoIndexMeta() {
  useEffect(() => {
    // Add noindex meta tag
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);

    // Cleanup on unmount
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  return null; // This component doesn't render anything
}

