/**
 * Rate Limiting Utility
 * Implements token bucket algorithm to prevent API abuse
 * 
 * Note: This uses in-memory storage. For production at scale,
 * consider using Redis or a dedicated rate limiting service.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limit configuration for different endpoint types
 */
export const RATE_LIMIT_CONFIG = {
  // Authentication endpoints - strict limits
  auth: {
    requests: 5, // 5 requests
    window: 15 * 60 * 1000, // per 15 minutes
  },
  // Public API endpoints - moderate limits
  public: {
    requests: 100, // 100 requests
    window: 60 * 1000, // per minute
  },
  // Authenticated API endpoints - higher limits
  api: {
    requests: 200, // 200 requests
    window: 60 * 1000, // per minute
  },
  // Webhook endpoints - very high limits (external services)
  webhook: {
    requests: 1000, // 1000 requests
    window: 60 * 1000, // per minute
  },
} as const;

/**
 * Rate limit entry stored in memory
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * In-memory store for rate limiting
 * Key format: `${type}:${identifier}`
 * In production, replace with Redis or similar
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries periodically
 */
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }

  lastCleanup = now;
}

/**
 * Get client identifier from request
 * Uses IP address as primary identifier
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare

  const ip = cfConnectingIp || realIp || forwarded?.split(',')[0] || 'unknown';
  return ip.trim();
}

/**
 * Check if request should be rate limited
 * @param request - Next.js request object
 * @param type - Type of endpoint (auth, public, api, webhook)
 * @param identifier - Optional custom identifier (defaults to IP)
 * @returns Object with isAllowed flag and rate limit info
 */
export function checkRateLimit(
  request: NextRequest,
  type: keyof typeof RATE_LIMIT_CONFIG,
  identifier?: string
): {
  isAllowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
} {
  cleanupExpiredEntries();

  const config = RATE_LIMIT_CONFIG[type];
  const clientId = identifier || getClientIdentifier(request);
  const key = `${type}:${clientId}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  // No entry or expired - create new entry
  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.window,
    };
    rateLimitStore.set(key, newEntry);

    return {
      isAllowed: true,
      remaining: config.requests - 1,
      resetTime: newEntry.resetTime,
      limit: config.requests,
    };
  }

  // Entry exists and is within window
  if (entry.count >= config.requests) {
    // Rate limit exceeded
    return {
      isAllowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      limit: config.requests,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    isAllowed: true,
    remaining: config.requests - entry.count,
    resetTime: entry.resetTime,
    limit: config.requests,
  };
}

/**
 * Create rate limit response headers
 */
export function getRateLimitHeaders(result: {
  remaining: number;
  resetTime: number;
  limit: number;
}): Record<string, string> {
  const resetSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
  
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': resetSeconds.toString(),
  };
}

/**
 * Handle rate limit exceeded - returns 429 response
 */
export function createRateLimitResponse(result: {
  resetTime: number;
  limit: number;
}): NextResponse {
  const resetSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
  const retryAfter = Math.max(1, resetSeconds);

  const headers = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': '0',
    'X-RateLimit-Reset': resetSeconds.toString(),
    'Retry-After': retryAfter.toString(),
  };

  return NextResponse.json(
    {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: retryAfter,
    },
    {
      status: 429,
      headers,
    }
  );
}

/**
 * Rate limit middleware helper
 * Use this in API routes to apply rate limiting
 * 
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const rateLimit = checkRateLimit(request, 'api');
 *   if (!rateLimit.isAllowed) {
 *     return createRateLimitResponse(rateLimit);
 *   }
 *   // ... rest of handler
 * }
 * ```
 */
export function withRateLimit<T extends NextRequest>(
  request: T,
  type: keyof typeof RATE_LIMIT_CONFIG,
  handler: (request: T, rateLimitInfo: ReturnType<typeof checkRateLimit>) => Promise<NextResponse>
): Promise<NextResponse> {
  const rateLimit = checkRateLimit(request, type);

  // Add rate limit headers to all responses
  const rateLimitHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.isAllowed) {
    return createRateLimitResponse(rateLimit);
  }

  // Call handler and add rate limit headers to response
  return handler(request, rateLimit).then((response) => {
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  });
}

