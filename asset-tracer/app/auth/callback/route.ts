import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Auth callback route for OAuth providers (Google, etc.)
 * This route handles the redirect from the OAuth provider
 * and exchanges the code for a session
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successfully authenticated
      // Check for plan parameter (from landing page pricing)
      const plan = requestUrl.searchParams.get('plan');
      
      if (plan && (plan === 'pro' || plan === 'business')) {
        // Redirect directly to checkout page for immediate upgrade
        return NextResponse.redirect(`${origin}/checkout?plan=${plan}`);
      }
      
      // Check for other redirect parameters
      const redirectPath = requestUrl.searchParams.get('redirect');
      const tab = requestUrl.searchParams.get('tab');
      
      if (redirectPath) {
        // Build redirect URL with preserved parameters
        const redirectParams = new URLSearchParams();
        if (tab) redirectParams.append('tab', tab);
        
        const fullRedirectPath = redirectParams.toString()
          ? `${redirectPath}?${redirectParams.toString()}`
          : redirectPath;
        
        return NextResponse.redirect(`${origin}${fullRedirectPath}`);
      }
      
      // Default redirect to dashboard
      return NextResponse.redirect(`${origin}/dashboard`);
    }

    console.error('Error exchanging code for session:', error);
  }

  // If no code or error, redirect to login
  return NextResponse.redirect(`${origin}/login`);
}

