import type { SWRConfiguration } from 'swr';

/**
 * Fetcher function for SWR
 * Makes authenticated API requests and handles errors
 */
export const fetcher = async (url: string) => {
  const res = await fetch(url, {
    credentials: 'include', // Include cookies for authentication
  });

  // Handle non-OK responses
  if (!res.ok) {
    const error = await res.json().catch(() => ({
      error: 'An error occurred while fetching data',
    }));

    const errorMessage = error.error || `Request failed with status ${res.status}`;
    throw new Error(errorMessage);
  }

  return res.json();
};

/**
 * Default SWR configuration
 * Applied globally to all SWR hooks in the application
 * Optimized for performance and better UX
 */
export const swrConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: false, // Don't revalidate when window regains focus
  revalidateOnReconnect: true, // Revalidate when internet connection is restored
  shouldRetryOnError: false, // Don't automatically retry on errors
  revalidateOnMount: false, // Use cached data on mount if available (faster navigation)
  revalidateIfStale: true, // Still revalidate stale data in background
  dedupingInterval: 2000, // Dedupe requests within 2 seconds (prevents duplicate API calls)
  focusThrottleInterval: 5000, // Throttle focus revalidation to 5 seconds
  errorRetryCount: 0, // Don't retry on error (user can manually retry)
  errorRetryInterval: 5000,
};

