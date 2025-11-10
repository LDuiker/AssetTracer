import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { polar } from '@/lib/polar';

export async function POST() {
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

    // Get organization with subscription details
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, polar_subscription_id, subscription_tier, polar_current_period_end')
      .eq('id', userData.organization_id)
      .single();

    if (orgError || !orgData) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if organization has an active subscription
    if (orgData.subscription_tier === 'free') {
      return NextResponse.json(
        { error: 'No active subscription to cancel' },
        { status: 400 }
      );
    }

    // Cancel subscription in Polar (if we have the subscription ID)
    if (orgData.polar_subscription_id) {
      try {
        await polar.cancelSubscription(orgData.polar_subscription_id);
      } catch (polarError: unknown) {
        console.error('Polar cancellation error:', polarError);
        // Continue even if Polar API fails - we'll update our database
      }
    } else {
      console.log('No polar_subscription_id found, updating database only');
    }

    // Update organization status to canceled but KEEP the current tier
    // Users retain access until the end of their billing period
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        polar_subscription_status: 'canceled',
        subscription_status: 'cancelled', // Mark as cancelled but tier stays
        // Keep subscription_tier (pro/business) so they retain access
        // Keep polar_current_period_end - when this date passes, webhooks will downgrade to free
      })
      .eq('id', orgData.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update subscription status' },
        { status: 500 }
      );
    }

    // Get the period end date to inform the user
    const periodEnd = orgData.polar_current_period_end 
      ? new Date(orgData.polar_current_period_end).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'the end of your billing period';

    return NextResponse.json({
      message: `Subscription cancelled. You'll retain access until ${periodEnd}`,
      tier: orgData.subscription_tier, // Current tier (not 'free')
      access_until: orgData.polar_current_period_end
    });

  } catch (error: unknown) {
    console.error('Error cancelling subscription:', error);
    const message = error instanceof Error ? error.message : 'Failed to cancel subscription';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

