import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getMonthlyPL, getCurrentYearDateRange, getLastNMonthsDateRange } from '@/lib/db';

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
 * GET /api/financials/monthly-pl
 * Returns monthly profit & loss data for a date range
 * 
 * Query parameters:
 * - start_date: Start date (YYYY-MM-DD) - optional
 * - end_date: End date (YYYY-MM-DD) - optional
 * - period: Shortcut for date range (current_year, last_6_months, last_3_months, last_12_months) - optional
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const organizationId = await getOrganizationId(user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: 'User is not associated with an organization.' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    let startDate = searchParams.get('start_date');
    let endDate = searchParams.get('end_date');

    // Handle period shortcuts
    if (period) {
      let dateRange;
      switch (period) {
        case 'current_year':
          dateRange = getCurrentYearDateRange();
          break;
        case 'last_3_months':
          dateRange = getLastNMonthsDateRange(3);
          break;
        case 'last_6_months':
          dateRange = getLastNMonthsDateRange(6);
          break;
        case 'last_12_months':
          dateRange = getLastNMonthsDateRange(12);
          break;
        default:
          dateRange = getCurrentYearDateRange();
      }
      startDate = dateRange.start_date;
      endDate = dateRange.end_date;
    }

    // Default to current year if no dates provided
    if (!startDate || !endDate) {
      const dateRange = getCurrentYearDateRange();
      startDate = dateRange.start_date;
      endDate = dateRange.end_date;
    }

    const data = await getMonthlyPL(organizationId, startDate, endDate);
    return NextResponse.json({ 
      data,
      period: { start_date: startDate, end_date: endDate }
    }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/financials/monthly-pl:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

