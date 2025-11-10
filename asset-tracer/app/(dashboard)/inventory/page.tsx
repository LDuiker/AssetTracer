'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Package, AlertTriangle, TrendingUp, TrendingDown, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/lib/context/CurrencyContext';
import type { Asset } from '@/types';

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function InventoryPage() {
  const { formatCurrency: formatCurrencyGlobal } = useCurrency();
  
  const { data, error, isLoading } = useSWR<{ assets: Asset[] }>(
    '/api/assets',
    fetcher
  );

  const assetsData = data?.assets;
  const assets = useMemo<Asset[]>(() => assetsData ?? [], [assetsData]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch =
        searchQuery === '' ||
        asset.name.toLowerCase().includes(searchLower) ||
        (asset.category?.toLowerCase().includes(searchLower) ?? false);

      const matchesCategory =
        categoryFilter === 'all' || asset.category === categoryFilter;

      const matchesStatus =
        statusFilter === 'all' || asset.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [assets, searchQuery, categoryFilter, statusFilter]);

  // Calculate inventory statistics
  const stats = useMemo(() => {
    const totalAssets = assets.length;
    const activeAssets = assets.filter((a) => a.status === 'active').length;
    const maintenanceAssets = assets.filter((a) => a.status === 'maintenance').length;
    const retiredAssets = assets.filter((a) => a.status === 'retired').length;
    
    const totalValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);
    const totalCost = assets.reduce((sum, a) => sum + (a.purchase_cost || 0), 0);
    const totalDepreciation = totalCost - totalValue;

    // Group by category
    const byCategory = assets.reduce((acc, asset) => {
      const cat = asset.category || 'Uncategorized';
      if (!acc[cat]) {
        acc[cat] = { count: 0, value: 0 };
      }
      acc[cat].count++;
      acc[cat].value += asset.current_value || 0;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    return {
      totalAssets,
      activeAssets,
      maintenanceAssets,
      retiredAssets,
      totalValue,
      totalCost,
      totalDepreciation,
      byCategory,
    };
  }, [assets]);

  // Use global currency formatter from context
  const formatCurrency = formatCurrencyGlobal;

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

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(assets.map((a) => a.category).filter(Boolean));
    return Array.from(cats);
  }, [assets]);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Inventory Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor your inventory levels and stock
          </p>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-600">
              <p className="text-lg font-semibold">Error loading inventory</p>
              <p className="text-sm mt-2">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Inventory Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Monitor your inventory levels and asset distribution
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? <Skeleton className="h-8 w-16" /> : stats.totalAssets}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.activeAssets} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(stats.totalValue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Current inventory value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {isLoading ? <Skeleton className="h-8 w-12" /> : stats.maintenanceAssets}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Assets need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Depreciation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(stats.totalDepreciation)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total value loss
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : Object.keys(stats.byCategory).length === 0 ? (
            <p className="text-center text-gray-500 py-4">No assets found</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.byCategory)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([category, data]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-gray-400" />
    <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {category}
                        </p>
                        <p className="text-sm text-gray-500">
                          {data.count} {data.count === 1 ? 'asset' : 'assets'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(data.value)}
                      </p>
                      <p className="text-sm text-gray-500">Total value</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat || ''}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Asset Inventory ({filteredAssets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Purchase Cost</TableHead>
                  <TableHead className="text-right">Current Value</TableHead>
                  <TableHead className="text-right">Depreciation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No assets found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssets.map((asset) => {
                    const depreciation = asset.purchase_cost - asset.current_value;
                    const depreciationPercent =
                      asset.purchase_cost > 0
                        ? ((depreciation / asset.purchase_cost) * 100).toFixed(1)
                        : '0.0';

                    return (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">
                          {asset.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {asset.category || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {asset.location || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(asset.status)}>
                            {asset.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(asset.purchase_cost)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(asset.current_value)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-medium text-red-600">
                              {formatCurrency(depreciation)}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({depreciationPercent}%)
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

