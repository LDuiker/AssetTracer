import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit, createRateLimitResponse, getRateLimitHeaders } from '@/lib/utils/rate-limit'

/**
 * Middleware to handle authentication and route protection
 * - Protects dashboard routes (requires authentication)
 * - Redirects authenticated users away from login page
 * - Allows public access to landing page and API webhooks
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // SEO routes - must be accessible without any auth checks (skip all processing)
  const seoRoutes = ['/sitemap.xml', '/robots.txt']
  if (seoRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Verify user authentication - use getUser() for security (validates with Supabase Auth server)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  
  // Check if user is authenticated (user exists and no error)
  const isAuthenticated = !!user && !userError

  // Define public routes (no authentication required)
  const publicRoutes = [
    '/api/webhooks', // Webhooks from external services (Polar.sh, etc.)
    '/api/auth',     // Auth callback endpoints
    '/auth/callback', // OAuth callback route
    '/accept-invite', // Team invitation acceptance
    '/checkout',     // Checkout page (needs to check auth internally)
    '/privacy',      // Privacy Policy page
    '/blog',         // Blog pages
  ]

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    try {
      // Determine rate limit type based on route
      let rateLimitType: 'auth' | 'public' | 'api' | 'webhook' = 'api';
      
      if (pathname.startsWith('/api/auth')) {
        rateLimitType = 'auth';
      } else if (pathname.startsWith('/api/webhooks')) {
        rateLimitType = 'webhook';
      } else if (pathname.startsWith('/api/')) {
        // Check if route requires authentication by checking for user
        // For now, treat all /api routes as authenticated (they check auth internally)
        rateLimitType = 'api';
      }

      const rateLimit = checkRateLimit(request, rateLimitType);
      if (!rateLimit.isAllowed) {
        return createRateLimitResponse(rateLimit);
      }
      
      // Add rate limit headers to response
      const rateLimitHeaders = getRateLimitHeaders(rateLimit);
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        supabaseResponse.headers.set(key, value);
      });
    } catch (error) {
      // Rate limiting check failed - log but don't block request
      console.error('[Middleware] Rate limiting check failed:', error);
      // Continue with request - rate limiting failure shouldn't break the app
    }
  }

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Define protected routes (require authentication)
  const protectedRoutes = [
    '/dashboard',
    '/assets',
    '/inventory',
    '/clients',
    '/quotations',
    '/invoices',
    '/expenses',
    '/reports',
    '/settings',
  ]

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Allow public routes without authentication
  if (isPublicRoute) {
    return supabaseResponse
  }

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if accessing login with active authentication
  if (pathname === '/login' && isAuthenticated) {
    const redirectUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Add security headers to all responses
  // This ensures headers are present even if next.config.ts headers don't work
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  supabaseResponse.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co https://api.polar.sh https://secure.3gdirectpay.com",
      "frame-src 'self' https://checkout.polar.sh https://vercel.live",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ')
  )

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sitemap.xml and robots.txt (SEO files)
     * - public folder
     * - api/webhooks (public webhooks)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

