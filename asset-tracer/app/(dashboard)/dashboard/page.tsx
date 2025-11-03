'use client';

import { useSaveConsent } from '@/hooks/useSaveConsent';
import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Package,
  Calendar,
  Filter
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
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format percentage
const formatPercentage = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

export default function DashboardPage() {
  // Save consent data if needed (runs automatically)
  useSaveConsent();

  // Date range state - default to current year
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
  const [activeStartDate, setActiveStartDate] = useState(`${currentYear}-01-01`);
  const [activeEndDate, setActiveEndDate] = useState(`${currentYear}-12-31`);

  // Fetch financial report
  const { data: report, isLoading, error } = useSWR(
    `/api/reports/financials?start_date=${activeStartDate}&end_date=${activeEndDate}`,
    fetcher
  );

  // Process monthly chart data
  const monthlyChartData = useMemo(() => {
    if (!report?.monthly_pl) return [];
    return report.monthly_pl.map((month: any) => ({
      month: format(new Date(month.month + '-01'), "MMM 'yy"),
      revenue: month.revenue || 0,
      expenses: month.expenses || 0,
    }));
  }, [report]);

  // Process top 5 assets
  const top5Assets = useMemo(() => {
    if (!report?.asset_financials) return [];
    return [...report.asset_financials]
      .sort((a: any, b: any) => (b.profit_loss || 0) - (a.profit_loss || 0))
      .slice(0, 5)
      .map((asset: any) => ({
        name: asset.asset_name?.length > 15 
          ? asset.asset_name.substring(0, 15) + '...' 
          : asset.asset_name || 'Unknown',
        profit: asset.profit_loss || 0,
      }));
  }, [report]);

  const handleApplyFilter = () => {
    setActiveStartDate(startDate);
    setActiveEndDate(endDate);
  };

  // Calculate summary values
  const summary = report?.summary || {};
  const revenue = summary.period_total_revenue || 0;
  const expenses = summary.period_total_expenses || 0;
  const profit = summary.period_net_profit || 0;
  const assetCount = report?.asset_financials?.length || 0;
  const assetValue = report?.asset_financials?.reduce((sum: number, asset: any) => 
    sum + (asset.current_value || 0), 0) || 0;

  // Calculate growth percentages (simplified - would need previous period data)
  const revenueGrowth = summary.revenue_growth_percentage || 0;
  const expenseGrowth = summary.expense_growth_percentage || 0;
  const profitGrowth = summary.profit_growth_percentage || 0;

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading dashboard data. Please try again later.</p>
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

      {/* Date Range Filter */}
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

      {/* Charts */}
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
          {/* Monthly Revenue vs Expenses Line Chart */}
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

          {/* Top 5 Profitable Assets Bar Chart */}
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
        </>
      )}
    </div>
  );
}
