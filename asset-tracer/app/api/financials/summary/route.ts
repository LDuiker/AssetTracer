import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getFinancialSummary } from '@/lib/db';

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
 * GET /api/financials/summary
 * Returns high-level financial overview for dashboard
 * 
 * Includes:
 * - Current month revenue, expenses, profit
 * - Previous month comparison
 * - Growth percentages
 * - Year-to-date totals
 * - Assets summary
 * - Invoices summary
 */
export async function GET() {
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

    const data = await getFinancialSummary(organizationId);
    
    if (!data) {
      // Return default empty data if no financial data exists yet
      return NextResponse.json({
        data: {
          current_month_revenue: 0,
          current_month_expenses: 0,
          current_month_profit: 0,
          previous_month_revenue: 0,
          previous_month_expenses: 0,
          previous_month_profit: 0,
          revenue_growth_percentage: 0,
          expense_growth_percentage: 0,
          profit_growth_percentage: 0,
          ytd_revenue: 0,
          ytd_expenses: 0,
          ytd_profit: 0,
          total_assets_value: 0,
          total_assets_count: 0,
          total_invoices_outstanding: 0,
          total_invoices_overdue: 0,
          currency: 'USD',
        }
      }, { status: 200 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/financials/summary:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

