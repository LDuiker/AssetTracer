'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { ArrowLeft, Edit, Copy, Trash2, Package, MapPin, Hash, Calendar, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrencyAmount } from '@/lib/utils/currency';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import type { Asset } from '@/types';

interface AssetViewPanelProps {
  asset: Asset;
  onBack: () => void;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  retired: 'bg-gray-100 text-gray-800',
  sold: 'bg-blue-100 text-blue-800',
};

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  transaction_date: string;
  description: string;
}

const fetcher = async (url: string) => {
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch {
        errorData = { error: `HTTP ${res.status}: ${res.statusText}` };
      }
      console.error('[AssetViewPanel] API Error:', errorData);
      throw new Error(errorData.error || errorData.message || `Failed to fetch: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('[AssetViewPanel] Network error - check:', {
        url,
        message: 'Possible CORS issue, network problem, or API route not responding',
        error: error.message
      });
      throw new Error('Network error: Unable to connect to server. Please check your internet connection and try again.');
    }
    throw error;
  }
};

export function AssetViewPanel({
  asset,
  onBack,
  onEdit,
  onClone,
  onDelete,
}: AssetViewPanelProps) {
  const { formatCurrency } = useCurrency();
  const { limits, redirectToUpgrade } = useSubscription();

  // Fetch transactions for this asset to show financials
  const { data: transactions, error: transactionsError } = useSWR<Transaction[]>(
    asset.id ? `/api/transactions?asset_id=${asset.id}` : null,
    fetcher
  );

  // Debug logging
  useEffect(() => {
    console.log('🔍 [AssetViewPanel] Asset ID:', asset.id);
    console.log('🔍 [AssetViewPanel] Transactions:', transactions);
    console.log('🔍 [AssetViewPanel] Transactions Error:', transactionsError);
    if (transactions) {
      console.log('✅ [AssetViewPanel] Transaction count:', transactions.length);
      const incomeTransactions = transactions.filter(t => t.type === 'income');
      console.log('✅ [AssetViewPanel] Income transactions:', incomeTransactions);
      incomeTransactions.forEach(t => {
        console.log('💰 [AssetViewPanel] Transaction:', {
          id: t.id,
          amount: t.amount,
          amountType: typeof t.amount,
          parsed: typeof t.amount === 'number' ? t.amount : parseFloat(t.amount?.toString() || '0')
        });
      });
    }
  }, [asset.id, transactions, transactionsError]);

  // Calculate financials with proper type handling
  const totalRevenue = transactions
    ? transactions
        .filter(t => t.type === 'income' && t.amount)
        .reduce((sum, t) => {
          const amount = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount?.toString() || '0');
          return sum + amount;
        }, 0)
    : 0;
  
  const totalExpenses = transactions
    ? transactions
        .filter(t => t.type === 'expense' && t.amount)
        .reduce((sum, t) => {
          const amount = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount?.toString() || '0');
          return sum + amount;
        }, 0)
    : 0;
  
  const totalSpend = (asset.purchase_cost || 0) + totalExpenses;
  const profitLoss = totalRevenue - totalSpend;
  const roiPercentage = totalSpend > 0 ? ((profitLoss / totalSpend) * 100) : 0;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={onBack} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClone}>
              <Copy className="h-4 w-4 mr-2" />
              Clone
            </Button>
            <Button variant="default" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {asset.name}
            </h1>
            {asset.category && (
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {asset.category}
              </p>
            )}
          </div>
          
          {/* Status Badge */}
          <Badge
            className={`${statusColors[asset.status]} text-sm px-3 py-1 rounded-full font-medium`}
          >
            {asset.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Financial Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Purchase Cost</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(asset.purchase_cost)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Value</p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {formatCurrency(asset.current_value)}
              </p>
            </CardContent>
          </Card>
          {limits.hasROITracking ? (
            <>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(totalRevenue)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">ROI</p>
                  <p className={`text-lg font-bold ${roiPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {roiPercentage.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="col-span-2 border-blue-200 bg-blue-50/50">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-600 mb-2">💎 ROI Tracking</p>
                <Button onClick={redirectToUpgrade} size="sm" className="gap-2">
                  <TrendingUp className="h-3 w-3" />
                  Upgrade to Pro
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Asset Details */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Asset Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {asset.location && (
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Location: </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {asset.location}
                    </span>
                  </div>
                </div>
              )}
              {asset.serial_number && (
                <div className="flex items-center">
                  <Hash className="mr-2 h-4 w-4 text-gray-500" />
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Serial #: </span>
                    <span className="text-gray-700 dark:text-gray-300 font-mono">
                      {asset.serial_number}
                    </span>
                  </div>
                </div>
              )}
              {asset.purchase_date && (
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Purchase Date: </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {new Date(asset.purchase_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-center">
                <Activity className="mr-2 h-4 w-4 text-gray-500" />
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Status: </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {asset.status}
                  </span>
                </div>
              </div>
            </div>

            {asset.description && (
              <>
                <Separator className="my-4" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {asset.description}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Financial Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Purchase Cost:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(asset.purchase_cost)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Expenses:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(totalExpenses)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Spend:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatCurrency(totalSpend)}
                  </span>
                </div>
              </div>
              
              {limits.hasROITracking ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(totalRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Profit/Loss:</span>
                    <span className={`font-semibold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(profitLoss)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">ROI:</span>
                    <span className={`font-bold text-lg ${roiPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {roiPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-6 px-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    💎 ROI Tracking & Financial Analysis
                  </p>
                  <p className="text-xs text-gray-600 mb-3">
                    Track revenue, profit/loss, and return on investment for this asset
                  </p>
                  <Button onClick={redirectToUpgrade} size="sm" className="gap-2">
                    <TrendingUp className="h-3 w-3" />
                    Upgrade to Pro
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        {transactions && transactions.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Transactions
              </h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 10).map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-sm">
                          {new Date(transaction.transaction_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{transaction.description}</TableCell>
                        <TableCell className={`text-right font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {transactions.length > 10 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
                  Showing 10 of {transactions.length} transactions
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

