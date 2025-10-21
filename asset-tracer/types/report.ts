/**
 * Types for financial reports
 */

import type { AssetFinancials, MonthlyPL } from './financial';

/**
 * Date range for reports
 */
export interface DateRange {
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
}

/**
 * Best/Worst month summary
 */
export interface MonthSummary {
  month: string; // YYYY-MM
  net_profit: number;
}

/**
 * Overall financial summary combining multiple data sources
 */
export interface FinancialReportSummary {
  // Current vs Previous Month (from financial summary)
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

  // Assets Summary
  total_assets_count: number;
  total_assets_value: number;
  total_assets_purchase_cost: number;
  total_assets_revenue: number;
  total_assets_spend: number;

  // Period Summary (based on query date range)
  period_total_revenue: number;
  period_total_expenses: number;
  period_net_profit: number;
  period_profit_margin: number; // Percentage

  // Monthly Averages
  avg_monthly_revenue: number;
  avg_monthly_expenses: number;
  avg_monthly_profit: number;

  // Performance Highlights
  best_month: MonthSummary | null;
  worst_month: MonthSummary | null;

  // Currency
  currency: string;
}

/**
 * Complete financial report response
 */
export interface FinancialReport {
  // Metadata
  report_date: string; // ISO timestamp
  date_range: DateRange;
  organization_id: string;

  // Detailed Data
  asset_financials: AssetFinancials[];
  monthly_pl: MonthlyPL[];

  // Summary
  summary: FinancialReportSummary;
}

/**
 * Query parameters for financial reports
 */
export interface FinancialReportParams {
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
}

/**
 * Asset performance ranking for reports
 */
export interface AssetPerformanceRanking {
  rank: number;
  asset_id: string;
  asset_name: string;
  roi_percentage: number;
  profit_loss: number;
  total_revenue: number;
  total_spend: number;
  performance_tier: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

/**
 * Category breakdown for expense/revenue analysis
 */
export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number; // Of total
  transaction_count: number;
}

/**
 * Trend analysis for charts/visualizations
 */
export interface TrendAnalysis {
  period: string; // Month, Quarter, or Year
  revenue: number;
  expenses: number;
  profit: number;
  profit_margin: number;
}

/**
 * Export formats for reports
 */
export type ReportExportFormat = 'json' | 'csv' | 'pdf' | 'xlsx';

/**
 * Report generation status
 */
export interface ReportGenerationStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  report_url?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

