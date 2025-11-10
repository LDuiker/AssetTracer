import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * Delete user account and all associated data
 * This is a destructive operation and cannot be undone
 */
export async function DELETE() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userData, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }

    const organizationId = userData?.organization_id;

    // If user is part of an organization, cancel any active subscriptions first
    if (organizationId) {
      const { data: organization } = await supabase
        .from('organizations')
        .select('polar_subscription_id, subscription_tier')
        .eq('id', organizationId)
        .single();

      // If there's an active paid subscription, attempt to cancel it in Polar
      if (organization?.polar_subscription_id && organization.subscription_tier !== 'free') {
        try {
          const response = await fetch(
            `https://sandbox-api.polar.sh/v1/subscriptions/${organization.polar_subscription_id}/cancel`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${process.env.POLAR_API_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!response.ok) {
            console.error('Failed to cancel subscription in Polar:', response.status);
            // Continue with deletion anyway
          }
        } catch (polarError) {
          console.error('Error canceling subscription in Polar:', polarError);
          // Continue with deletion anyway
        }
      }

      // Delete organization data (this will cascade to related data if FK constraints are set)
      // Note: Be careful with this in production - you might want to soft delete instead
      const { error: deleteOrgError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', organizationId);

      if (deleteOrgError) {
        console.error('Error deleting organization:', deleteOrgError);
        // Continue with user deletion anyway
      }
    }

    // Create admin client for deletions (bypasses RLS)
    const adminClient = createAdminClient();

    // Delete user from users table using admin client (bypasses RLS)
    const { error: deleteUserError } = await adminClient
      .from('users')
      .delete()
      .eq('id', user.id);

    if (deleteUserError) {
      console.error('Error deleting user from users table:', deleteUserError);
      return NextResponse.json(
        { error: 'Failed to delete user data', details: deleteUserError.message },
        { status: 500 }
      );
    }

    // Delete user from Supabase Auth using Admin API
    const { error: deleteAuthUserError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteAuthUserError) {
      console.error('Error deleting user from auth:', deleteAuthUserError);
      return NextResponse.json(
        { error: 'Failed to delete authentication account', details: deleteAuthUserError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully deleted user: ${user.id} (${user.email})`);

    return NextResponse.json({
      success: true,
      message: 'Account successfully deleted',
    });
  } catch (error: unknown) {
    console.error('Account deletion error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    );
  }
}

