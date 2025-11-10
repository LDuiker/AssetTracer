import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import type { AssetFinancials, MonthlyPL } from '@/types';

/**
 * Type for financial summary from database function
 */
export interface FinancialSummaryDB {
  current_month_revenue: number;
  current_month_expenses: number;
  current_month_profit: number;
  previous_month_revenue: number;
  previous_month_expenses: number;
  previous_month_profit: number;
  revenue_growth_percentage: number;
  expense_growth_percentage: number;
  profit_growth_percentage: number;
  ytd_revenue: number;
  ytd_expenses: number;
  ytd_profit: number;
  total_assets_value: number;
  total_assets_count: number; // Note: bigint from DB, but JavaScript converts to number
  total_invoices_outstanding: number;
  total_invoices_overdue: number;
  currency: string;
}

type MonthlyPLRow = {
  month: string;
  total_revenue: string | number;
  total_expenses: string | number;
  net_profit: string | number;
  currency: string;
  transaction_count: number;
};

/**
 * Type for asset ROI ranking from database function
 */
export interface AssetROIRanking {
  rank: number;
  asset_id: string;
  asset_name: string;
  asset_category: string;
  roi_percentage: number;
  profit_loss: number;
  total_revenue: number;
  total_spend: number;
  performance_indicator: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

/**
 * Get asset financial summaries for an organization
 * Calls the get_asset_financials PostgreSQL function
 * 
 * @param organizationId - The organization ID
 * @returns Array of asset financials
 */
export async function getAssetFinancials(
  organizationId: string
): Promise<AssetFinancials[]> {
  try {
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .rpc('get_asset_financials', { org_id: organizationId });

    if (error) {
      console.error('Error fetching asset financials:', error);
      throw new Error(`Failed to fetch asset financials: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getAssetFinancials:', error);
    throw error;
  }
}

/**
 * Get monthly profit & loss for a date range
 * Calls the get_monthly_pl PostgreSQL function
 * 
 * @param organizationId - The organization ID
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Array of monthly P&L data
 */
export async function getMonthlyPL(
  organizationId: string,
  startDate: string,
  endDate: string
): Promise<MonthlyPL[]> {
  try {
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .rpc('get_monthly_pl', {
        org_id: organizationId,
        start_date: startDate,
        end_date: endDate,
      });

    if (error) {
      console.error('Error fetching monthly P&L:', error);
      throw new Error(`Failed to fetch monthly P&L: ${error.message}`);
    }

    // Transform database response to match MonthlyPL type
    const rows = (data as MonthlyPLRow[] | null) ?? [];
    return rows.map((row) => ({
      month: row.month,
      total_revenue: typeof row.total_revenue === 'number' ? row.total_revenue : parseFloat(row.total_revenue),
      total_expenses:
        typeof row.total_expenses === 'number' ? row.total_expenses : parseFloat(row.total_expenses),
      net_profit: typeof row.net_profit === 'number' ? row.net_profit : parseFloat(row.net_profit),
      currency: row.currency,
      transactions_count: row.transaction_count,
    }));
  } catch (error) {
    console.error('Unexpected error in getMonthlyPL:', error);
    throw error;
  }
}

/**
 * Get financial summary for dashboard
 * Calls the get_financial_summary PostgreSQL function
 * 
 * @param organizationId - The organization ID
 * @returns Financial summary object
 */
export async function getFinancialSummary(
  organizationId: string
): Promise<FinancialSummaryDB | null> {
  try {
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .rpc('get_financial_summary', { org_id: organizationId });

    if (error) {
      console.error('Error fetching financial summary:', error);
      throw new Error(`Failed to fetch financial summary: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Return first row (function returns single row)
    return data[0];
  } catch (error) {
    console.error('Unexpected error in getFinancialSummary:', error);
    throw error;
  }
}

/**
 * Get asset ROI rankings
 * Calls the get_asset_roi_rankings PostgreSQL function
 * 
 * @param organizationId - The organization ID
 * @param limitCount - Number of results to return (default: 10)
 * @returns Array of ranked assets
 */
export async function getAssetROIRankings(
  organizationId: string,
  limitCount: number = 10
): Promise<AssetROIRanking[]> {
  try {
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .rpc('get_asset_roi_rankings', {
        org_id: organizationId,
        limit_count: limitCount,
      });

    if (error) {
      console.error('Error fetching asset ROI rankings:', error);
      throw new Error(`Failed to fetch asset ROI rankings: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getAssetROIRankings:', error);
    throw error;
  }
}

/**
 * Helper function to get current year date range
 * @returns Object with start_date and end_date for current year
 */
export function getCurrentYearDateRange(): { start_date: string; end_date: string } {
  const now = new Date();
  const year = now.getFullYear();
  return {
    start_date: `${year}-01-01`,
    end_date: `${year}-12-31`,
  };
}

/**
 * Helper function to get last N months date range
 * @param months - Number of months to look back
 * @returns Object with start_date and end_date
 */
export function getLastNMonthsDateRange(months: number): { start_date: string; end_date: string } {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setMonth(startDate.getMonth() - months);
  
  return {
    start_date: startDate.toISOString().split('T')[0],
    end_date: now.toISOString().split('T')[0],
  };
}

/**
 * Helper function to get quarter date range
 * @param year - Year (e.g., 2024)
 * @param quarter - Quarter number (1-4)
 * @returns Object with start_date and end_date
 */
export function getQuarterDateRange(
  year: number,
  quarter: number
): { start_date: string; end_date: string } {
  const quarterStartMonth = (quarter - 1) * 3;
  const quarterEndMonth = quarterStartMonth + 2;
  
  const startDate = new Date(year, quarterStartMonth, 1);
  const endDate = new Date(year, quarterEndMonth + 1, 0); // Last day of the month
  
  return {
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
  };
}

