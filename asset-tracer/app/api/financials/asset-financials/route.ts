import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getAssetFinancials } from '@/lib/db';

/**
 * Helper function to get organization ID from user session
 */
async function getOrganizationId(userId: string) {
  const supabase = await createSupabaseClient();
  
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    const { data: { user } } = await supabase.auth.getUser();
    return user?.user_metadata?.organization_id || null;
  }

  return userProfile?.organization_id || null;
}

/**
 * GET /api/financials/asset-financials
 * Returns financial summary for all assets including ROI calculations
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const organizationId = await getOrganizationId(session.user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: 'User is not associated with an organization.' },
        { status: 403 }
      );
    }

    const data = await getAssetFinancials(organizationId);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/financials/asset-financials:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

