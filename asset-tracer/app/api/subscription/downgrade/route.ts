import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { polar } from '@/lib/polar';
import { z } from 'zod';

const downgradeSchema = z.object({
  tier: z.enum(['free', 'pro']).optional(),
});

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

    // Parse request body (optional tier parameter)
    const body = await request.json().catch(() => ({}));
    const validationResult = downgradeSchema.safeParse(body);
    
    // Default to 'free' if no tier specified
    const targetTier = validationResult.success && validationResult.data.tier 
      ? validationResult.data.tier 
      : 'free';

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

    try {
      // If downgrading to free, cancel the Polar subscription
      if (targetTier === 'free' && organization.polar_subscription_id) {
        await polar.cancelSubscription(organization.polar_subscription_id);
      }

      // Update organization subscription
      const updatePayload: any = {
        subscription_tier: targetTier,
        subscription_status: targetTier === 'free' ? 'inactive' : 'active',
        updated_at: new Date().toISOString(),
      };

      // If downgrading to free, clear Polar data
      if (targetTier === 'free') {
        updatePayload.subscription_start_date = null;
        updatePayload.subscription_end_date = null;
        updatePayload.polar_subscription_id = null;
        updatePayload.polar_product_id = null;
        updatePayload.polar_subscription_status = 'canceled';
        updatePayload.polar_current_period_start = null;
        updatePayload.polar_current_period_end = null;
      } else {
        // Keep subscription dates for paid tiers
        updatePayload.subscription_start_date = new Date().toISOString();
      }

      const { data: updatedOrg, error: updateError } = await supabase
        .from('organizations')
        .update(updatePayload)
        .eq('id', userData.organization_id)
        .select()
        .single();

      if (updateError) {
        console.error('Error downgrading subscription:', updateError);
        return NextResponse.json(
          { error: 'Failed to downgrade subscription' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        organization: updatedOrg,
        message: `Successfully downgraded to ${targetTier} plan`,
      });
    } catch (polarError) {
      console.error('Polar API error:', polarError);
      return NextResponse.json(
        { error: 'Failed to cancel subscription' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Downgrade error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

