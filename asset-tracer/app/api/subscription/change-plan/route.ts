import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Change/upgrade an existing subscription
 * For Polar, this requires canceling the old subscription and creating a new one
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { new_tier } = body;

    if (!new_tier || !['pro', 'business'].includes(new_tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be "pro" or "business"' },
        { status: 400 }
      );
    }

    // Get organization details
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

    const currentTier = organization.subscription_tier || 'free';

    // Check if it's a valid upgrade/downgrade
    if (currentTier === new_tier) {
      return NextResponse.json(
        { error: `You are already on the ${new_tier} plan` },
        { status: 400 }
      );
    }

    // For Polar upgrades/downgrades, we need to redirect to customer portal
    // where they can manage their subscription
    if (organization.polar_subscription_id) {
      return NextResponse.json({
        success: true,
        message: 'To change your plan, please manage your subscription through our billing portal',
        requires_portal: true,
        current_tier: currentTier,
        requested_tier: new_tier,
      });
    } else {
      // No existing subscription, can create a new one
      return NextResponse.json({
        success: true,
        can_checkout: true,
        message: 'You can proceed with checkout for the new plan',
      });
    }
  } catch (error: any) {
    console.error('Change plan error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

