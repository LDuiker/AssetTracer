import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
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

    // Get notification preferences from organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, subscription_tier, email_notifications_enabled')
      .eq('id', userData.organization_id)
      .single();

    if (orgError || !orgData) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      email_notifications_enabled: orgData.email_notifications_enabled ?? true,
      subscription_tier: orgData.subscription_tier || 'free',
    });

  } catch (error: unknown) {
    console.error('Error fetching notification preferences:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch notification preferences';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    // Get organization to check subscription tier
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, subscription_tier')
      .eq('id', userData.organization_id)
      .single();

    if (orgError || !orgData) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Only Business plan can manage email notifications
    if (orgData.subscription_tier !== 'business') {
      return NextResponse.json(
        { error: 'Email notifications are only available for Business plan subscribers. Please upgrade to access this feature.' },
        { status: 403 }
      );
    }

    // Get request body
    const body = (await request.json()) as { email_notifications_enabled?: unknown };
    const { email_notifications_enabled } = body;

    if (typeof email_notifications_enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'email_notifications_enabled must be a boolean' },
        { status: 400 }
      );
    }

    // Update notification preferences
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        email_notifications_enabled,
      })
      .eq('id', orgData.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update notification preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Notification preferences updated successfully',
      email_notifications_enabled,
    });

  } catch (error: unknown) {
    console.error('Error updating notification preferences:', error);
    const message = error instanceof Error ? error.message : 'Failed to update notification preferences';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

