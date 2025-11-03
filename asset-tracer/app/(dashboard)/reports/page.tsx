'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Calendar, RefreshCw, Download } from 'lucide-react';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import { toast } from 'sonner';
import type { FinancialReport } from '@/types';

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch');
  }
  return res.json();
};

export default function ReportsPage() {
  const { formatCurrency: formatCurrencyGlobal } = useCurrency();
  const { limits, redirectToUpgrade } = useSubscription();
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
  const [queryUrl, setQueryUrl] = useState('/api/reports/financials');
  const [isExporting, setIsExporting] = useState(false);

  const { data: report, error, isLoading, mutate } = useSWR<FinancialReport>(
    queryUrl,
    fetcher
  );

  const handleApplyDateRange = () => {
    if (startDate && endDate) {
      setQueryUrl(`/api/reports/financials?start_date=${startDate}&end_date=${endDate}`);
    } else {
      setQueryUrl('/api/reports/financials');
    }
  };

  const handleExportCSV = () => {
    if (!limits.hasCSVExport) {
      toast.error('CSV Export Not Available', {
        description: 'Upgrade to Pro for advanced reporting features.',
        action: {
          label: 'Upgrade',
          onClick: redirectToUpgrade,
        },
      });
      return;
    }

    if (!report) {
      toast.error('No data to export');
      return;
    }

    setIsExporting(true);

    try {
      // Create CSV content
      const csvRows: string[] = [];

      // Header
      csvRows.push('Financial Report');
      csvRows.push(`Period: ${report.date_range.start_date} to ${report.date_range.end_date}`);
      csvRows.push('');

      // Summary Section
      csvRows.push('SUMMARY');
      csvRows.push('Metric,Value');
      csvRows.push(`Total Revenue,${report.summary.period_total_revenue}`);
      csvRows.push(`Total Expenses,${report.summary.period_total_expenses}`);
      csvRows.push(`Net Profit,${report.summary.period_net_profit}`);
      csvRows.push(`Profit Margin,${report.summary.profit_margin_percentage}%`);
      // Growth metrics are premium features
      if (limits.hasGrowthMetrics) {
        csvRows.push(`Revenue Growth,${report.summary.revenue_growth_percentage}%`);
      }
      csvRows.push('');

      // Monthly P&L
      csvRows.push('MONTHLY PROFIT & LOSS');
      csvRows.push('Month,Revenue,Expenses,Net Profit');
      report.monthly_pl.forEach((month) => {
        csvRows.push(
          `${month.month},${month.revenue},${month.expenses},${month.net_profit}`
        );
      });
      csvRows.push('');

      // Asset Financials
      csvRows.push('ASSET FINANCIALS');
      // ROI data is a premium feature - only include if user has ROI tracking
      if (limits.hasROITracking) {
        csvRows.push('Asset Name,Category,Total Spent,Total Revenue,Net Profit,ROI %');
        report.asset_financials.forEach((asset) => {
          csvRows.push(
            `"${asset.asset_name}",${asset.category || 'N/A'},${asset.total_spent},${asset.total_revenue},${asset.net_profit},${asset.roi_percentage}`
          );
        });
      } else {
        // Free tier: only show basic asset info (no revenue/ROI data)
        csvRows.push('Asset Name,Category,Total Spent');
        report.asset_financials.forEach((asset) => {
          csvRows.push(
            `"${asset.asset_name}",${asset.category || 'N/A'},${asset.total_spent}`
          );
        });
      }

      // Create blob and download
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financial-report-${report.date_range.start_date}-to-${report.date_range.end_date}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Report exported successfully', {
        description: 'Your CSV file has been downloaded.',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report', {
        description: 'Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Use global currency formatter from context
  const formatCurrency = formatCurrencyGlobal;

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error Loading Report</h3>
          <p className="text-red-600 text-sm mt-1">
            {error.message || 'Failed to load financial report. Please try again.'}
          </p>
          <Button onClick={() => mutate()} variant="outline" size="sm" className="mt-3">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive financial analytics and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleExportCSV} 
            disabled={isLoading || !report || isExporting || !limits.hasCSVExport}
            variant="outline"
            className="bg-white"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* Date Range Filter - Pro/Business only */}
      {limits.hasDateRangeFilter ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Date Range</CardTitle>
            <CardDescription>Filter report by date range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleApplyDateRange} disabled={isLoading}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Apply Filter
                </Button>
              </div>
            </div>
            {report && (
              <div className="mt-4 text-sm text-muted-foreground">
                Showing data from{' '}
                <span className="font-semibold">{report.date_range.start_date}</span> to{' '}
                <span className="font-semibold">{report.date_range.end_date}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg">Date Range Filter</CardTitle>
            <CardDescription>Available on Pro and Business plans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Custom Date Ranges</p>
                  <p className="text-sm text-gray-600">
                    Filter reports by specific date periods
                  </p>
                </div>
              </div>
              <Button onClick={redirectToUpgrade} className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Upgrade to Pro
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {/* KPI Cards */}
      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Revenue Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(report.summary.period_total_revenue)}
                </div>
                {limits.hasGrowthMetrics ? (
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {report.summary.revenue_growth_percentage >= 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                    )}
                    <span className={report.summary.revenue_growth_percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {Math.abs(report.summary.revenue_growth_percentage).toFixed(2)}%
                    </span>
                    <span className="ml-1">from last month</span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Pro: Growth tracking</p>
                )}
              </CardContent>
            </Card>

            {/* Expenses Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <DollarSign className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(report.summary.period_total_expenses)}
                </div>
                {limits.hasGrowthMetrics ? (
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {report.summary.expense_growth_percentage >= 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3 text-red-600" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3 text-green-600" />
                    )}
                    <span className={report.summary.expense_growth_percentage >= 0 ? 'text-red-600' : 'text-green-600'}>
                      {Math.abs(report.summary.expense_growth_percentage).toFixed(2)}%
                    </span>
                    <span className="ml-1">from last month</span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Pro: Growth tracking</p>
                )}
              </CardContent>
            </Card>

            {/* Net Profit Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(report.summary.period_net_profit)}
                </div>
                {limits.hasGrowthMetrics ? (
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {report.summary.profit_growth_percentage >= 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                    )}
                    <span className={report.summary.profit_growth_percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {Math.abs(report.summary.profit_growth_percentage).toFixed(2)}%
                    </span>
                    <span className="ml-1">from last month</span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Pro: Growth tracking</p>
                )}
              </CardContent>
            </Card>

            {/* Profit Margin Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                <Badge variant="outline">{report.summary.period_profit_margin.toFixed(2)}%</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.summary.period_profit_margin >= 40 ? '🎉 Excellent' : 
                   report.summary.period_profit_margin >= 20 ? '✅ Good' :
                   report.summary.period_profit_margin >= 10 ? '⚠️ Fair' : '🔻 Low'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {report.summary.period_profit_margin >= 40 ? 'Outstanding performance' :
                   report.summary.period_profit_margin >= 20 ? 'Healthy margin' :
                   report.summary.period_profit_margin >= 10 ? 'Room for improvement' : 'Needs attention'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Assets Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Assets Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`grid grid-cols-2 gap-4 ${limits.hasROITracking ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                <div>
                  <p className="text-sm text-muted-foreground">Total Assets</p>
                  <p className="text-2xl font-bold">{report.summary.total_assets_count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(report.summary.total_assets_value)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Purchase Cost</p>
                  <p className="text-2xl font-bold">{formatCurrency(report.summary.total_assets_purchase_cost)}</p>
                </div>
                {limits.hasROITracking && (
                  <div>
                    <p className="text-sm text-muted-foreground">Assets Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(report.summary.total_assets_revenue)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Averages */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Averages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Monthly Revenue</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(report.summary.avg_monthly_revenue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Monthly Expenses</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(report.summary.avg_monthly_expenses)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Monthly Profit</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(report.summary.avg_monthly_profit)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  🏆 Best Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.summary.best_month ? (
                  <>
                    <p className="text-2xl font-bold">{report.summary.best_month.month}</p>
                    <p className="text-green-600 font-semibold">
                      {formatCurrency(report.summary.best_month.net_profit)} profit
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  📉 Worst Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.summary.worst_month ? (
                  <>
                    <p className="text-2xl font-bold">{report.summary.worst_month.month}</p>
                    <p className="text-red-600 font-semibold">
                      {formatCurrency(report.summary.worst_month.net_profit)} profit
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Raw Data (Collapsible) */}
          <Card>
            <CardHeader>
              <CardTitle>🔍 Raw Report Data</CardTitle>
              <CardDescription>
                Full JSON response from the API ({report.monthly_pl.length} months, {report.asset_financials.length} assets)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-xs">
                {JSON.stringify(report, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

