import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { polar } from '@/lib/polar';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization_id from users table
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get user's organization with polar_customer_id
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, polar_customer_id')
      .eq('id', userData.organization_id)
      .single();

    if (orgError || !orgData) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if customer exists in Polar
    if (!orgData.polar_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found. Please subscribe to a plan first.' },
        { status: 400 }
      );
    }

    // Get return URL from request body
    const body = (await request.json()) as { return_url?: unknown };
    const requestedReturnUrl = typeof body.return_url === 'string' ? body.return_url : undefined;
    const defaultReturnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?tab=billing`;
    const returnUrl = requestedReturnUrl ?? defaultReturnUrl;

    // Try to create customer portal session
    try {
      const portalSession = await polar.createCustomerPortalSession(
        orgData.polar_customer_id,
        returnUrl
      );

      return NextResponse.json({
        url: portalSession.url,
      });
    } catch (portalError: unknown) {
      console.error('Error creating portal session:', portalError);
      
      // Fallback: Return Polar dashboard URL
      // Users will need to log in to Polar directly
      return NextResponse.json({
        url: 'https://polar.sh/dashboard',
        message: 'Redirecting to Polar dashboard. You may need to log in.'
      });
    }

  } catch (error: unknown) {
    console.error('Error creating customer portal session:', error);
    const message = error instanceof Error ? error.message : 'Failed to create customer portal session';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

