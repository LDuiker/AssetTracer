import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAssetFinancials, getMonthlyPL, getFinancialSummary } from '@/lib/db/financials';

/**
 * GET /api/reports/financials
 * 
 * Fetch comprehensive financial report combining:
 * - Asset financials (ROI, spend, revenue per asset)
 * - Monthly P&L (profit/loss by month)
 * - Overall financial summary
 * 
 * Query Parameters:
 * - start_date (optional): Start date for P&L report (YYYY-MM-DD)
 * - end_date (optional): End date for P&L report (YYYY-MM-DD)
 * 
 * If dates not provided, defaults to current year (Jan 1 to Dec 31 of current year)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Get user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');

    // Get organization settings for currency
    const { data: orgData } = await supabase
      .from('organizations')
      .select('default_currency')
      .eq('id', userData.organization_id)
      .single();

    const organizationCurrency = orgData?.default_currency || 'USD';

    // Default to current year if dates not provided
    const currentYear = new Date().getFullYear();
    const startDate = startDateParam || `${currentYear}-01-01`;
    const endDate = endDateParam || `${currentYear}-12-31`;

    // Validate date formats (basic validation)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate date range
    if (new Date(startDate) > new Date(endDate)) {
      return NextResponse.json(
        { error: 'Start date must be before or equal to end date' },
        { status: 400 }
      );
    }

    // Fetch all financial data in parallel for better performance
    const [assetFinancials, monthlyPL, financialSummary] = await Promise.all([
      getAssetFinancials(userData.organization_id),
      getMonthlyPL(userData.organization_id, startDate, endDate),
      getFinancialSummary(userData.organization_id),
    ]);

    // Calculate additional summary metrics from the fetched data
    const totalAssetsValue = assetFinancials.reduce(
      (sum, asset) => sum + (asset.current_value || 0),
      0
    );

    const totalAssetsPurchaseCost = assetFinancials.reduce(
      (sum, asset) => sum + (asset.purchase_cost || 0),
      0
    );

    const totalAssetsRevenue = assetFinancials.reduce(
      (sum, asset) => sum + (asset.total_revenue || 0),
      0
    );

    const totalAssetsSpend = assetFinancials.reduce(
      (sum, asset) => sum + (asset.total_spend || 0),
      0
    );

    const totalRevenue = monthlyPL.reduce(
      (sum, month) => sum + (month.total_revenue || 0),
      0
    );

    const totalExpenses = monthlyPL.reduce(
      (sum, month) => sum + (month.total_expenses || 0),
      0
    );

    const netProfit = totalRevenue - totalExpenses;

    // Calculate average monthly metrics
    const avgMonthlyRevenue = monthlyPL.length > 0 
      ? totalRevenue / monthlyPL.length 
      : 0;

    const avgMonthlyExpenses = monthlyPL.length > 0 
      ? totalExpenses / monthlyPL.length 
      : 0;

    const avgMonthlyProfit = monthlyPL.length > 0 
      ? netProfit / monthlyPL.length 
      : 0;

    // Find best and worst performing months
    const sortedByProfit = [...monthlyPL].sort(
      (a, b) => (b.net_profit || 0) - (a.net_profit || 0)
    );

    const bestMonth = sortedByProfit[0] || null;
    const worstMonth = sortedByProfit[sortedByProfit.length - 1] || null;

    // Calculate profit margin
    const profitMargin = totalRevenue > 0 
      ? ((netProfit / totalRevenue) * 100).toFixed(2)
      : '0.00';

    // Build comprehensive response
    const report = {
      // Metadata
      report_date: new Date().toISOString(),
      date_range: {
        start_date: startDate,
        end_date: endDate,
      },
      organization_id: userData.organization_id,

      // Asset Financials
      asset_financials: assetFinancials.map((asset) => ({
        asset_id: asset.asset_id,
        asset_name: asset.asset_name,
        asset_category: asset.asset_category,
        asset_status: asset.asset_status,
        purchase_cost: asset.purchase_cost,
        current_value: asset.current_value,
        total_spend: asset.total_spend,
        total_revenue: asset.total_revenue,
        profit_loss: asset.profit_loss,
        roi_percentage: asset.roi_percentage,
        maintenance_cost: asset.maintenance_cost,
        operating_cost: asset.operating_cost,
        transaction_count: asset.transaction_count,
        last_transaction_date: asset.last_transaction_date,
        currency: asset.currency,
      })),

      // Monthly P&L
      monthly_pl: monthlyPL.map((month) => ({
        month: month.month,
        month_start: month.month_start,
        month_end: month.month_end,
        total_revenue: month.total_revenue,
        total_expenses: month.total_expenses,
        net_profit: month.net_profit,
        revenue_count: month.revenue_count,
        expense_count: month.expense_count,
        transaction_count: month.transaction_count,
        top_revenue_category: month.top_revenue_category,
        top_expense_category: month.top_expense_category,
        asset_purchases: month.asset_purchases,
        asset_sales: month.asset_sales,
        invoices_paid: month.invoices_paid,
        invoices_paid_count: month.invoices_paid_count,
        currency: month.currency,
      })),

      // Overall Summary
      summary: {
        // From financial summary function
        current_month_revenue: financialSummary.current_month_revenue || 0,
        current_month_expenses: financialSummary.current_month_expenses || 0,
        current_month_profit: financialSummary.current_month_profit || 0,
        previous_month_revenue: financialSummary.previous_month_revenue || 0,
        previous_month_expenses: financialSummary.previous_month_expenses || 0,
        previous_month_profit: financialSummary.previous_month_profit || 0,
        revenue_growth_percentage: financialSummary.revenue_growth_percentage || 0,
        expense_growth_percentage: financialSummary.expense_growth_percentage || 0,
        profit_growth_percentage: financialSummary.profit_growth_percentage || 0,
        ytd_revenue: financialSummary.ytd_revenue || 0,
        ytd_expenses: financialSummary.ytd_expenses || 0,
        ytd_profit: financialSummary.ytd_profit || 0,
        
        // Assets summary
        total_assets_count: assetFinancials.length,
        total_assets_value: totalAssetsValue,
        total_assets_purchase_cost: totalAssetsPurchaseCost,
        total_assets_revenue: totalAssetsRevenue,
        total_assets_spend: totalAssetsSpend,

        // Period summary (based on query date range)
        period_total_revenue: totalRevenue,
        period_total_expenses: totalExpenses,
        period_net_profit: netProfit,
        period_profit_margin: parseFloat(profitMargin),
        
        // Averages
        avg_monthly_revenue: avgMonthlyRevenue,
        avg_monthly_expenses: avgMonthlyExpenses,
        avg_monthly_profit: avgMonthlyProfit,

        // Best/Worst months
        best_month: bestMonth ? {
          month: bestMonth.month,
          net_profit: bestMonth.net_profit,
        } : null,
        worst_month: worstMonth ? {
          month: worstMonth.month,
          net_profit: worstMonth.net_profit,
        } : null,

        // Currency
        currency: organizationCurrency,
      },
    };

    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/reports/financials:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to generate financial report',
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

