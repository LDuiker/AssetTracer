/**
 * CORS Configuration Utility
 * Provides secure CORS headers for API routes
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Allowed origins for CORS requests
 * In production, restrict to your actual domain
 */
const getAllowedOrigin = (request: NextRequest): string => {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_STAGING_URL,
    'http://localhost:3000',
    'https://www.asset-tracer.com',
    'https://assettracer-staging.vercel.app',
  ].filter(Boolean) as string[];

  // In production, only allow specific origins
  if (process.env.NODE_ENV === 'production') {
    if (origin && allowedOrigins.includes(origin)) {
      return origin;
    }
    // Default to app URL in production
    return process.env.NEXT_PUBLIC_APP_URL || 'https://www.asset-tracer.com';
  }

  // In development, allow the request origin if it's in the list
  if (origin && allowedOrigins.includes(origin)) {
    return origin;
  }

  // Fallback: allow same-origin requests
  return origin || '*';
};

/**
 * CORS headers configuration
 */
export function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = getAllowedOrigin(request);

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Handle CORS preflight requests (OPTIONS)
 * Call this in your API route handlers for OPTIONS requests
 */
export function handleCorsPreflight(request: NextRequest): NextResponse {
  const headers = getCorsHeaders(request);
  return new NextResponse(null, {
    status: 204, // No Content
    headers,
  });
}

/**
 * Add CORS headers to a NextResponse
 * Use this helper to add CORS headers to your API responses
 */
export function withCors(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const corsHeaders = getCorsHeaders(request);
  
  // Add CORS headers to the response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

