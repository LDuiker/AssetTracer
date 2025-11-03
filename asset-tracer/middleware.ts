import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
          cookiesToSet.forEach(({ name, value, options }) => {
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

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Define public routes (no authentication required)
  const publicRoutes = [
    '/api/webhooks', // Webhooks from external services (DPO, etc.)
    '/api/auth',     // Auth callback endpoints
    '/auth/callback', // OAuth callback route
    '/accept-invite', // Team invitation acceptance
    '/checkout',     // Checkout page (needs to check auth internally)
  ]

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

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if accessing login with active session
  if (pathname === '/login' && session) {
    const redirectUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(redirectUrl)
  }

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

