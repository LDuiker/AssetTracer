'use client';

import { Search, Plus, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/lib/context/CurrencyContext';
import type { Asset } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AssetListPanelProps {
  assets: Asset[];
  selectedAsset: Asset | null;
  onSelect: (asset: Asset) => void;
  onCreate: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  retired: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  sold: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
};

export function AssetListPanel({
  assets,
  selectedAsset,
  onSelect,
  onCreate,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: AssetListPanelProps) {
  const { formatCurrency } = useCurrency();

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Assets
          </h2>
          <Button
            onClick={onCreate}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
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

      {/* Asset List */}
      <div className="flex-1 overflow-y-auto">
        {assets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No assets found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {assets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => onSelect(asset)}
                className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  selectedAsset?.id === asset.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {asset.name}
                    </h3>
                    {asset.category && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {asset.category}
                      </p>
                    )}
                  </div>
                  <Badge
                    className={`ml-2 ${statusColors[asset.status] || statusColors.active}`}
                  >
                    {asset.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Value: {formatCurrency(asset.current_value)}
                  </span>
                  {asset.location && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[100px]">
                      {asset.location}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer with count */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {assets.length} {assets.length === 1 ? 'asset' : 'assets'}
        </p>
      </div>
    </div>
  );
}

