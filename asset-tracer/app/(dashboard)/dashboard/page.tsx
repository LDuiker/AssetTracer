'use client';

import { useSubscription } from '@/lib/context/SubscriptionContext';
import { useCurrency } from '@/lib/context/CurrencyContext';
import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Package,
  Calendar,
  Filter,
  Crown,
  Lock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Fetch function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
    const errorMessage = errorData.error || errorData.message || `Failed to fetch (${res.status})`;
    console.error('[Dashboard API Error]', {
      url,
      status: res.status,
      statusText: res.statusText,
      error: errorMessage,
      details: errorData,
    });
    throw new Error(errorMessage);
  }
  return res.json();
};

// Format percentage
const formatPercentage = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

export default function DashboardPage() {
  // Get currency formatting from context (uses global currency setting)
  const { formatCurrency, isLoading: currencyLoading } = useCurrency();

  // Get subscription tier and limits
  const { limits, redirectToUpgrade, isLoading: subscriptionLoading } = useSubscription();

  // Date range state - default to current year
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
  const [activeStartDate, setActiveStartDate] = useState(`${currentYear}-01-01`);
  const [activeEndDate, setActiveEndDate] = useState(`${currentYear}-12-31`);

  // Wait for contexts to load before fetching data
  const contextsLoading = subscriptionLoading || currencyLoading;

  // Fetch financial report (only if date filter is allowed or use default dates)
  // Only fetch if contexts have loaded (to avoid errors from undefined limits)
  const dateFilterEnabled = limits?.hasDateRangeFilter || false;
  const reportUrl = dateFilterEnabled
    ? `/api/reports/financials?start_date=${activeStartDate}&end_date=${activeEndDate}`
    : `/api/reports/financials?start_date=${currentYear}-01-01&end_date=${currentYear}-12-31`;

  const { data: report, isLoading, error } = useSWR(
    contextsLoading ? null : reportUrl, 
    fetcher
  );

  // Process monthly chart data (only if charts are allowed)
  // Must be called before any early returns (React hooks rules)
  const monthlyChartData = useMemo(() => {
    if (contextsLoading || !limits?.hasMonthlyCharts || !report?.monthly_pl) return [];
    return report.monthly_pl.map((month: any) => ({
      month: format(new Date(month.month + '-01'), "MMM 'yy"),
      revenue: month.revenue || 0,
      expenses: month.expenses || 0,
    }));
  }, [report, limits?.hasMonthlyCharts, contextsLoading]);

  // Process top 5 assets (only if charts are allowed)
  // Must be called before any early returns (React hooks rules)
  const top5Assets = useMemo(() => {
    if (contextsLoading || !limits?.hasTopPerformersChart || !report?.asset_financials) return [];
    return [...report.asset_financials]
      .sort((a: any, b: any) => (b.profit_loss || 0) - (a.profit_loss || 0))
      .slice(0, 5)
      .map((asset: any) => ({
        name: asset.asset_name?.length > 15 
          ? asset.asset_name.substring(0, 15) + '...' 
          : asset.asset_name || 'Unknown',
        profit: asset.profit_loss || 0,
      }));
  }, [report, limits?.hasTopPerformersChart, contextsLoading]);

  // Show loading state if contexts are still loading
  // Must be AFTER all hooks are called (React hooks rules)
  if (contextsLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleApplyFilter = () => {
    if (limits?.hasDateRangeFilter) {
      setActiveStartDate(startDate);
      setActiveEndDate(endDate);
    }
  };

  // Calculate summary values
  const summary = report?.summary || {};
  const revenue = summary.period_total_revenue || 0;
  const expenses = summary.period_total_expenses || 0;
  const profit = summary.period_net_profit || 0;
  const assetCount = report?.asset_financials?.length || 0;
  const assetValue = report?.asset_financials?.reduce((sum: number, asset: any) => 
    sum + (asset.current_value || 0), 0) || 0;

  // Calculate growth percentages (only shown if hasGrowthMetrics)
  const revenueGrowth = summary.revenue_growth_percentage || 0;
  const expenseGrowth = summary.expense_growth_percentage || 0;
  const profitGrowth = summary.profit_growth_percentage || 0;

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-red-600 font-semibold">Error loading dashboard data</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {error instanceof Error ? error.message : 'An unknown error occurred'}
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Overview of your financial performance
          </p>
        </div>
      </div>

      {/* Date Range Filter - Only shown if allowed */}
      {limits?.hasDateRangeFilter ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date Range Filter
            </CardTitle>
            <CardDescription>
              Select a date range to view financial data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleApplyFilter} className="w-full sm:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Date Range Filter</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upgrade to Pro to filter data by custom date ranges
                  </p>
                </div>
              </div>
              <Button onClick={redirectToUpgrade} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenue)}</div>
            {limits?.hasGrowthMetrics && (
              <div className={`flex items-center text-xs mt-1 ${
                revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {revenueGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {formatPercentage(revenueGrowth)} from last period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(expenses)}</div>
            {limits?.hasGrowthMetrics && (
              <div className={`flex items-center text-xs mt-1 ${
                expenseGrowth <= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {expenseGrowth <= 0 ? (
                  <TrendingDown className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingUp className="h-3 w-3 mr-1" />
                )}
                {formatPercentage(Math.abs(expenseGrowth))} from last period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(profit)}</div>
            {limits?.hasGrowthMetrics && (
              <div className={`flex items-center text-xs mt-1 ${
                profitGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {profitGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {formatPercentage(profitGrowth)} from last period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Assets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assetCount}</div>
            <div className="text-xs text-gray-500 mt-1">
              {formatCurrency(assetValue)} total value
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary Cards - Available to all tiers */}
      {!isLoading && report && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Best Performing Month */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Best Performing Month
              </CardTitle>
              <CardDescription>
                The month with the highest net profit
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summary.best_month ? (
                <>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {format(new Date(summary.best_month.month + '-01'), 'MMMM yyyy')}
                  </p>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400 mt-2">
                    {formatCurrency(summary.best_month.net_profit)} profit
                  </p>
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Average Monthly Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Average Monthly Performance
              </CardTitle>
              <CardDescription>
                Average financial metrics per month
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                <span>Avg. Revenue:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(summary.avg_monthly_revenue || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                <span>Avg. Expenses:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(summary.avg_monthly_expenses || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                <span>Avg. Profit:</span>
                <span className={`font-semibold ${
                  (summary.avg_monthly_profit || 0) >= 0 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(summary.avg_monthly_profit || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts - Only shown if allowed, otherwise show upgrade prompts */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Monthly Revenue vs Expenses Line Chart - Locked for Free */}
          {limits?.hasMonthlyCharts ? (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue vs Expenses</CardTitle>
                <CardDescription>Trend analysis over time</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#16a34a" 
                        strokeWidth={2}
                        name="Revenue"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="expenses" 
                        stroke="#f97316" 
                        strokeWidth={2}
                        name="Expenses"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No monthly data available for the selected period
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/50 dark:to-indigo-950/50">
              <CardContent className="pt-6">
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full inline-block mb-4">
                      <TrendingUp className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Monthly Revenue & Expense Charts
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Visualize your financial trends with interactive monthly charts. Track revenue and expenses over time to make better business decisions.
                    </p>
                    <Button onClick={redirectToUpgrade} size="lg" className="bg-blue-600 hover:bg-blue-700">
                      <Crown className="h-5 w-5 mr-2" />
                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top 5 Profitable Assets Bar Chart - Locked for Free */}
          {limits?.hasTopPerformersChart ? (
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Profitable Assets</CardTitle>
                <CardDescription>Assets with highest profit</CardDescription>
              </CardHeader>
              <CardContent>
                {top5Assets.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={top5Assets} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(value) => `$${value / 1000}k`} />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="profit" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No asset data available
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/50 dark:to-indigo-950/50">
              <CardContent className="pt-6">
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full inline-block mb-4">
                      <Package className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Top Performers Analysis
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Discover which assets are driving the most profit with interactive charts. Identify your best-performing investments and optimize your portfolio.
                    </p>
                    <Button onClick={redirectToUpgrade} size="lg" className="bg-blue-600 hover:bg-blue-700">
                      <Crown className="h-5 w-5 mr-2" />
                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
