'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { 
  ArrowLeft, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  MapPin,
  Tag,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { ExpenseDialog } from '@/components/expenses';
import { AssetDialog } from '@/components/assets';
import { toast } from 'sonner';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import type { Asset, Expense, CreateAssetInput } from '@/types';

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch');
  }
  const data = await res.json();
  return data;
};

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  transaction_date: string;
  description: string;
  reference_number: string | null;
}

interface AssetFinancial {
  totalSpend: number;
  totalRevenue: number;
  profitLoss: number;
  roiPercentage: number;
  expenses: Expense[];
  transactions: Transaction[];
  timeSeriesData: Array<{
    month: string;
    spend: number;
    revenue: number;
  }>;
}

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = params?.id as string;
  const { formatCurrency: formatCurrencyGlobal } = useCurrency();
  const { limits, redirectToUpgrade } = useSubscription();

  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);

  // Fetch asset data
  const { data: assetData, error: assetError, isLoading: assetLoading, mutate: mutateAsset } = useSWR<{ asset: Asset }>(
    assetId ? `/api/assets/${assetId}` : null,
    fetcher
  );

  const asset = assetData?.asset;

  // Fetch expenses for this asset
  const { data: expenses, mutate: mutateExpenses } = useSWR<Expense[]>(
    assetId ? `/api/expenses?asset_id=${assetId}` : null,
    fetcher
  );

  // Fetch transactions for this asset
  const { data: transactions } = useSWR<Transaction[]>(
    assetId ? `/api/transactions?asset_id=${assetId}` : null,
    fetcher
  );

  // Calculate financials using useMemo to recalculate when data changes
  const financials: AssetFinancial = useMemo(() => {
    const baseSpend = asset?.purchase_cost || 0;
    const totalExpenses = expenses ? expenses.reduce((sum, exp) => sum + exp.amount, 0) : 0;
    const totalSpend = baseSpend + totalExpenses;

    const totalRevenue = transactions
      ? transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (t.amount || 0), 0)
      : 0;

    const profitLoss = totalRevenue - totalSpend;
    const roiPercentage = totalSpend > 0
      ? (profitLoss / totalSpend) * 100
      : 0;

    return {
      totalSpend,
      totalRevenue,
      profitLoss,
      roiPercentage,
      expenses: expenses || [],
      transactions: transactions || [],
      timeSeriesData: [],
    };
  }, [asset?.purchase_cost, expenses, transactions]);

  // Generate time series data using useMemo
  const timeSeriesData = useMemo(() => {
    if (!expenses || !transactions) return [];

    const monthlyData = new Map<string, { spend: number; revenue: number }>();

    // Add purchase cost to first month
    if (asset?.purchase_date) {
      const month = new Date(asset.purchase_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      });
      monthlyData.set(month, { spend: asset.purchase_cost, revenue: 0 });
    }

    // Add expenses
    expenses.forEach(exp => {
      const month = new Date(exp.expense_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      });
      const current = monthlyData.get(month) || { spend: 0, revenue: 0 };
      monthlyData.set(month, { ...current, spend: current.spend + exp.amount });
    });

    // Add transactions
    transactions.forEach(tx => {
      const month = new Date(tx.transaction_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      });
      const current = monthlyData.get(month) || { spend: 0, revenue: 0 };
      if (tx.type === 'income') {
        monthlyData.set(month, { ...current, revenue: current.revenue + tx.amount });
      } else {
        monthlyData.set(month, { ...current, spend: current.spend + tx.amount });
      }
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [asset?.purchase_date, asset?.purchase_cost, expenses, transactions]);

  // Update financials with time series data
  financials.timeSeriesData = timeSeriesData;

  const handleEditAsset = () => {
    setAssetDialogOpen(true);
  };

  const handleSaveAsset = async (data: CreateAssetInput) => {
    if (!asset) return;

    try {
      const res = await fetch(`/api/assets/${asset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update asset');
      }

      toast.success('Asset updated successfully');
      setAssetDialogOpen(false);
      mutateAsset(); // Refresh asset data
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update asset');
      throw error;
    }
  };

  const handleAddExpense = () => {
    setSelectedExpense(null);
    setExpenseDialogOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setExpenseDialogOpen(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to delete expense');

      toast.success('Expense deleted successfully');
      mutateExpenses();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete expense');
    }
  };

  const handleSaveExpense = async (data: any) => {
    try {
      const url = selectedExpense
        ? `/api/expenses/${selectedExpense.id}`
        : '/api/expenses';
      
      const method = selectedExpense ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          asset_id: assetId,
        }),
      });

      if (!res.ok) throw new Error('Failed to save expense');

      toast.success(selectedExpense ? 'Expense updated' : 'Expense created');
      setExpenseDialogOpen(false);
      mutateExpenses();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save expense');
    }
  };

  // Use global currency formatter from context
  const formatCurrency = formatCurrencyGlobal;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'retired':
        return 'bg-gray-100 text-gray-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (assetError) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/assets')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assets
        </Button>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-600">
              <p className="text-lg font-semibold">Error loading asset</p>
              <p className="text-sm mt-2">{assetError.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (assetLoading || !asset) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/assets')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assets
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEditAsset}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Asset
          </Button>
        </div>
      </div>

      {/* Asset Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Image */}
            <div className="flex-shrink-0">
              {asset.image_url ? (
                <img
                  src={asset.image_url}
                  alt={asset.name}
                  className="w-48 h-48 object-cover rounded-lg border"
                />
              ) : (
                <div className="w-48 h-48 bg-gray-100 rounded-lg border flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <h1 className="text-3xl font-bold text-gray-900">{asset.name}</h1>
                  <Badge className={getStatusColor(asset.status)}>
                    {asset.status}
                  </Badge>
                </div>
                {asset.description && (
                  <p className="text-gray-600 mt-2">{asset.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    Category
                  </p>
                  <p className="font-semibold">{asset.category || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Location
                  </p>
                  <p className="font-semibold">{asset.location || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Purchase Date
                  </p>
                  <p className="font-semibold">
                    {asset.purchase_date ? formatDate(asset.purchase_date) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Serial Number</p>
                  <p className="font-semibold">{asset.serial_number || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">Purchase Cost</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(asset.purchase_cost)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Value</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(asset.current_value)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="financials" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Basic Information</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Name:</dt>
                      <dd className="font-medium">{asset.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Category:</dt>
                      <dd className="font-medium">{asset.category || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Status:</dt>
                      <dd>
                        <Badge className={getStatusColor(asset.status)}>
                          {asset.status}
                        </Badge>
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Location:</dt>
                      <dd className="font-medium">{asset.location || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Purchase Information</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Purchase Date:</dt>
                      <dd className="font-medium">
                        {asset.purchase_date ? formatDate(asset.purchase_date) : 'N/A'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Purchase Cost:</dt>
                      <dd className="font-medium">{formatCurrency(asset.purchase_cost)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Current Value:</dt>
                      <dd className="font-medium">{formatCurrency(asset.current_value)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Serial Number:</dt>
                      <dd className="font-medium">{asset.serial_number || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {asset.description && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-600">{asset.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financials Tab */}
        <TabsContent value="financials" className="space-y-6">
          {/* KPI Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${limits.hasROITracking ? 'lg:grid-cols-4' : 'lg:grid-cols-2'}`}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Spend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(financials.totalSpend)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Purchase + Expenses
                </p>
              </CardContent>
            </Card>

            {limits.hasROITracking ? (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(financials.totalRevenue)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      From transactions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Profit / Loss
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      financials.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(financials.profitLoss)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Revenue - Spend
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      ROI
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${
                      financials.roiPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {financials.roiPercentage.toFixed(2)}%
                    </div>
                    <p className="text-xs text-gray-600 mt-1 font-medium">
                      Return on Investment
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="p-4 bg-blue-100 rounded-full inline-block mb-4">
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      ROI Tracking & Financial Analysis
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Track revenue, profit/loss, and return on investment for this asset
                    </p>
                    <Button onClick={redirectToUpgrade} size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Chart */}
          {limits.hasROITracking ? (
            financials.timeSeriesData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Spend vs Revenue Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={financials.timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
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
                        dataKey="spend"
                        stroke="#ef4444"
                        strokeWidth={2}
                        name="Spend"
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Revenue"
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )
          ) : (
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
              <CardContent className="pt-6">
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <div className="p-4 bg-blue-100 rounded-full inline-block mb-4">
                      <TrendingUp className="h-12 w-12 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Spend vs Revenue Analytics
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Visualize your asset's spending and revenue trends over time with interactive charts. Track profitability and ROI performance.
                    </p>
                    <Button onClick={redirectToUpgrade} size="lg" className="bg-blue-600 hover:bg-blue-700">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expenses Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Expenses ({financials.expenses.length})
                </CardTitle>
                <Button onClick={handleAddExpense} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {financials.expenses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No expenses recorded for this asset
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financials.expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{formatDate(expense.expense_date)}</TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{expense.category}</Badge>
                          </TableCell>
                          <TableCell>{expense.vendor}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(expense.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditExpense(expense)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Transactions Table */}
          {limits.hasROITracking ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Revenue Transactions ({financials.transactions.filter(t => t.type === 'income').length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {financials.transactions.filter(t => t.type === 'income').length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No revenue transactions for this asset
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {financials.transactions
                          .filter(t => t.type === 'income')
                          .map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                              <TableCell>{transaction.description}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{transaction.category}</Badge>
                              </TableCell>
                              <TableCell>{transaction.reference_number || '-'}</TableCell>
                              <TableCell className="text-right font-medium text-green-600">
                                {formatCurrency(transaction.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="p-4 bg-blue-100 rounded-full inline-block mb-4">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Revenue Transaction Tracking
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    View detailed revenue transactions linked to this asset. Track income sources and analyze revenue patterns.
                  </p>
                  <Button onClick={redirectToUpgrade} size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Asset Edit Dialog */}
      <AssetDialog
        open={assetDialogOpen}
        onOpenChange={setAssetDialogOpen}
        asset={asset || null}
        onSave={handleSaveAsset}
      />

      {/* Expense Dialog */}
      <ExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        expense={selectedExpense}
        onSave={handleSaveExpense}
      />
    </div>
  );
}

