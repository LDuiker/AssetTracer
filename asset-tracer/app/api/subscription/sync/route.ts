import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type PolarSubscription = {
  id: string;
  status: string;
  product_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  metadata?: Record<string, unknown> | null;
};

type PolarSubscriptionsResponse = {
  items?: PolarSubscription[];
};

/**
 * Manual subscription sync endpoint
 * Fetches subscription data from Polar and updates the database
 * Useful when webhooks fail or there's a mismatch
 */
export async function POST() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: userData, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userData?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get organization with Polar customer ID
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', userData.organization_id)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    if (!organization.polar_customer_id) {
      return NextResponse.json(
        { error: 'No Polar customer ID found', subscription_tier: 'free' },
        { status: 200 }
      );
    }

    console.log(`🔄 Syncing subscription for customer: ${organization.polar_customer_id}`);

    // Determine API base URL (sandbox vs production)
    const isSandbox = process.env.NEXT_PUBLIC_POLAR_SANDBOX === 'true' || 
                      process.env.POLAR_API_KEY?.startsWith('polar_oat_');
    const polarBaseUrl = isSandbox 
      ? 'https://sandbox-api.polar.sh' 
      : 'https://api.polar.sh';
    
    console.log(`Using Polar API: ${polarBaseUrl} (sandbox: ${isSandbox})`);

    // Fetch subscriptions from Polar
    try {
      const response = await fetch(
        `${polarBaseUrl}/v1/subscriptions?customer_id=${organization.polar_customer_id}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.POLAR_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Polar API error: ${response.status}`);
      }

      const data = (await response.json()) as PolarSubscriptionsResponse;
      console.log('Polar subscriptions response:', JSON.stringify(data, null, 2));

      // Check if there are any active subscriptions
      const activeSubscription = data.items?.find(
        (sub) => sub.status === 'active' || sub.status === 'trialing'
      );

      if (activeSubscription) {
        // Get tier from metadata, or fallback to product ID mapping
        const metadataTier = activeSubscription.metadata?.tier;
        
        // Product ID to tier mapping (fallback if metadata is missing)
        const productIdToTier: Record<string, string> = {
          'd0ef8f7a-657b-4115-8fb2-7bdfd4af3b18': 'pro', // Pro Monthly product
          // Add other product IDs here as needed
        };
        
        const tier = typeof metadataTier === 'string' 
          ? metadataTier 
          : (activeSubscription.product_id && productIdToTier[activeSubscription.product_id]) || 'free';
        
        console.log(`✅ Found active subscription: ${activeSubscription.id}`, {
          product_id: activeSubscription.product_id,
          metadata_tier: metadataTier,
          determined_tier: tier,
        });

        // Update database with Polar subscription data
        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            polar_subscription_id: activeSubscription.id,
            polar_product_id: activeSubscription.product_id,
            polar_subscription_status: activeSubscription.status,
            subscription_tier: tier,
            subscription_status: 'active',
            subscription_start_date: activeSubscription.current_period_start,
            subscription_end_date: activeSubscription.current_period_end,
            polar_current_period_start: activeSubscription.current_period_start,
            polar_current_period_end: activeSubscription.current_period_end,
            polar_metadata: activeSubscription.metadata || {},
            updated_at: new Date().toISOString(),
          })
          .eq('id', organization.id);

        if (updateError) {
          console.error('Database update error:', updateError);
          throw updateError;
        }

        return NextResponse.json({
          success: true,
          message: 'Subscription synced successfully',
          subscription: {
            tier,
            status: activeSubscription.status,
            subscription_id: activeSubscription.id,
          },
        });
      } else {
        // No active subscription found
        console.log('❌ No active subscription found in Polar');
        
        return NextResponse.json({
          success: true,
          message: 'No active subscription found',
          subscription_tier: 'free',
        });
      }
    } catch (polarError: unknown) {
      console.error('Polar API error:', polarError);
      const details = polarError instanceof Error ? polarError.message : 'Unknown error';
      return NextResponse.json(
        { 
          error: 'Failed to fetch subscription from Polar',
          details,
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Sync error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    );
  }
}

