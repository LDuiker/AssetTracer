'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Package, FileText, DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  ResponsiveContainer,
} from 'recharts';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import type { FinancialReport } from '@/types';

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch');
  }
  return res.json();
};

export default function DashboardPage() {
  const { formatCurrency: formatCurrencyGlobal, currency } = useCurrency();
  const { limits, tier, redirectToUpgrade } = useSubscription();
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
  const [queryUrl, setQueryUrl] = useState('/api/reports/financials');

  const { data: report, error, isLoading } = useSWR<FinancialReport>(queryUrl, fetcher);

  const handleApplyDateRange = () => {
    if (startDate && endDate) {
      setQueryUrl(`/api/reports/financials?start_date=${startDate}&end_date=${endDate}`);
    } else {
      setQueryUrl('/api/reports/financials');
    }
  };

  // Get currency symbol from formatted currency
  const getCurrencySymbol = () => {
    const formatted = formatCurrencyGlobal(0);
    // Extract symbol (everything before or after the number)
    const match = formatted.match(/[^\d.,\s]+/);
    return match ? match[0] : '$';
  };

  const currencySymbol = getCurrencySymbol();

  // Process monthly data for line chart
  const monthlyChartData = useMemo(() => {
    if (!report?.monthly_pl) return [];
    return report.monthly_pl.map((month) => ({
      month: new Date(month.month + '-01').toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      }),
      revenue: month.total_revenue,
      expenses: month.total_expenses,
      profit: month.net_profit,
    }));
  }, [report]);

  // Process top 5 profitable assets
  const top5Assets = useMemo(() => {
    if (!report?.asset_financials) return [];
    return [...report.asset_financials]
      .sort((a, b) => b.profit_loss - a.profit_loss)
      .slice(0, 5)
      .map((asset) => ({
        name: asset.asset_name.length > 15 
          ? asset.asset_name.substring(0, 15) + '...' 
          : asset.asset_name,
        profit: asset.profit_loss,
      }));
  }, [report]);

  // Process asset ROI data
  const assetROIData = useMemo(() => {
    if (!report?.asset_financials) return [];
    return report.asset_financials
      .filter((asset) => asset.roi_percentage !== 0)
      .map((asset) => ({
        name: asset.asset_name.length > 15 
          ? asset.asset_name.substring(0, 15) + '...' 
          : asset.asset_name,
        roi: asset.roi_percentage,
        fill: asset.roi_percentage >= 0 ? '#10b981' : '#ef4444',
      }));
  }, [report]);

  // Use global currency formatter from context
  const formatCurrency = formatCurrencyGlobal;

  if (error) {
    return (
      <div className="space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error loading dashboard</h3>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <div>
        <h2 className="text-3xl font-bold text-text-primary dark:text-white mb-2">
          Financial Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of your business performance and key metrics
        </p>
      </div>

      {/* Date Range Filter - Pro/Business only */}
      {limits.hasDateRangeFilter ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date Range Filter
            </CardTitle>
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
                  Apply Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Date Range Filtering</p>
                  <p className="text-sm text-gray-600">
                    Upgrade to Pro to filter reports by custom date ranges
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

      {/* Stats Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : report ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <Card className="hover:shadow-lg transition-shadow duration-200 border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Revenue
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary dark:text-white mb-1">
                {formatCurrency(report.summary.period_total_revenue)}
              </div>
              {limits.hasGrowthMetrics ? (
                <div className="flex items-center text-xs text-green-600">
                  {report.summary.revenue_growth_percentage >= 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {Math.abs(report.summary.revenue_growth_percentage).toFixed(1)}% from last month
                </div>
              ) : (
                <p className="text-xs text-gray-500">Upgrade to Pro for growth tracking</p>
              )}
            </CardContent>
          </Card>

          {/* Total Expenses */}
          <Card className="hover:shadow-lg transition-shadow duration-200 border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Expenses
              </CardTitle>
              <div className="p-2 rounded-lg bg-red-100">
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary dark:text-white mb-1">
                {formatCurrency(report.summary.period_total_expenses)}
              </div>
              {limits.hasGrowthMetrics ? (
                <div className="flex items-center text-xs text-gray-600">
                  {report.summary.expense_growth_percentage >= 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {Math.abs(report.summary.expense_growth_percentage).toFixed(1)}% from last month
                </div>
              ) : (
                <p className="text-xs text-gray-500">Upgrade to Pro for growth tracking</p>
              )}
            </CardContent>
          </Card>

          {/* Net Profit */}
          <Card className="hover:shadow-lg transition-shadow duration-200 border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Net Profit
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-100">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary dark:text-white mb-1">
                {formatCurrency(report.summary.period_net_profit)}
              </div>
              {limits.hasGrowthMetrics ? (
                <div className="flex items-center text-xs text-blue-600">
                  {report.summary.profit_growth_percentage >= 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {Math.abs(report.summary.profit_growth_percentage).toFixed(1)}% from last month
                </div>
              ) : (
                <p className="text-xs text-gray-500">Upgrade to Pro for growth tracking</p>
              )}
            </CardContent>
          </Card>

          {/* Total Assets */}
          <Card className="hover:shadow-lg transition-shadow duration-200 border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Assets
                </CardTitle>
              <div className="p-2 rounded-lg bg-purple-100">
                <Package className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-text-primary dark:text-white mb-1">
                {report.summary.total_assets_count}
                </div>
              <p className="text-xs text-gray-500">
                Value: {formatCurrency(report.summary.total_assets_value)}
                </p>
              </CardContent>
            </Card>
      </div>
      ) : null}

      {/* Charts Section */}
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-96" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      ) : report && (
        <>
          {/* Monthly Revenue vs Expenses Line Chart - Pro/Business only */}
          {limits.hasMonthlyCharts ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Monthly Revenue vs Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `${currencySymbol}${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: any) => {
                          const numValue = typeof value === 'number' ? value : parseFloat(value);
                          return isNaN(numValue) ? value : formatCurrency(numValue);
                        }}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Revenue"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="expenses"
                        stroke="#f97316"
                        strokeWidth={2}
                        name="Expenses"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-96 flex items-center justify-center text-gray-500">
                    No monthly data available for the selected period
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Monthly Revenue vs Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 flex flex-col items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="p-4 bg-blue-100 rounded-full inline-block mb-4">
                      <TrendingUp className="h-12 w-12 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Monthly Trend Charts
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Track your revenue and expenses over time with interactive charts
                    </p>
                    <Button onClick={redirectToUpgrade} size="lg" className="gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bottom Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 Profitable Assets Bar Chart - Pro/Business only */}
            {limits.hasTopPerformersChart ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-green-600" />
                    Top 5 Profitable Assets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {top5Assets.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={top5Assets} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number"
                          style={{ fontSize: '12px' }}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <YAxis 
                          type="category"
                          dataKey="name" 
                          width={120}
                          style={{ fontSize: '11px' }}
                        />
                        <Tooltip 
                          formatter={(value: any) => {
                            const numValue = typeof value === 'number' ? value : parseFloat(value);
                            return isNaN(numValue) ? value : formatCurrency(numValue);
                          }}
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                        />
                        <Bar 
                          dataKey="profit" 
                          fill="#10b981" 
                          name="Profit"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-96 flex items-center justify-center text-gray-500">
                      No asset data available
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-green-600" />
                    Top 5 Profitable Assets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 flex flex-col items-center justify-center gap-4">
                    <div className="text-center">
                      <div className="p-4 bg-green-100 rounded-full inline-block mb-4">
                        <Package className="h-12 w-12 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Top Performers Analysis
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Discover your most profitable assets and optimize your portfolio
                      </p>
                      <Button onClick={redirectToUpgrade} size="lg" className="gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Upgrade to Pro
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Asset ROI Distribution Bar Chart - Pro/Business only */}
            {limits.hasROITracking ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Asset ROI Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assetROIData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={assetROIData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          style={{ fontSize: '11px' }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          style={{ fontSize: '12px' }}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip 
                          formatter={(value: any) => {
                            const numValue = typeof value === 'number' ? value : parseFloat(value);
                            return isNaN(numValue) ? value : `${numValue.toFixed(2)}%`;
                          }}
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                        />
                        <Bar 
                          dataKey="roi" 
                          name="ROI %"
                          radius={[4, 4, 0, 0]}
                        >
                          {assetROIData.map((entry, index) => (
                            <Bar key={`bar-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-96 flex items-center justify-center text-gray-500">
                      No ROI data available
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Asset ROI Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 flex flex-col items-center justify-center gap-4">
                    <div className="text-center">
                      <div className="p-4 bg-blue-100 rounded-full inline-block mb-4">
                        <TrendingUp className="h-12 w-12 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        ROI Tracking
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Measure asset performance and return on investment
                      </p>
                      <Button onClick={redirectToUpgrade} size="lg" className="gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Upgrade to Pro
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
      </div>
        </>
      )}

      {/* Performance Summary */}
      {!isLoading && report && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
              <CardTitle>Best Performing Month</CardTitle>
        </CardHeader>
        <CardContent>
              {report.summary.best_month ? (
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-green-600">
                    {new Date(report.summary.best_month.month + '-01').toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-lg">
                    Net Profit: {formatCurrency(report.summary.best_month.net_profit)}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Monthly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Revenue:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(report.summary.avg_monthly_revenue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Expenses:</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(report.summary.avg_monthly_expenses)}
                </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-gray-600 font-medium">Avg Profit:</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(report.summary.avg_monthly_profit)}
                </span>
                </div>
          </div>
        </CardContent>
      </Card>
        </div>
      )}
    </div>
  );
}
