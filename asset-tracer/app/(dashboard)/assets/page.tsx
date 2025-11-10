'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Plus, Upload, Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AssetTable, AssetDialog, AssetListPanel, AssetViewPanel, AssetEditPanel, AssetImportDialog } from '@/components/assets';
import { SubscriptionBadge, UsageBadge } from '@/components/subscription';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import { toast } from 'sonner';
import type { Asset, CreateAssetInput } from '@/types';

export default function AssetsPage() {
  const router = useRouter();
  const { limits, canCreateAsset, getUpgradeMessage, redirectToUpgrade } = useSubscription();
  
  // Fetch assets with SWR (uses global config from layout)
  const { data, error, isLoading, mutate } = useSWR<{ assets: Asset[] }>(
    '/api/assets'
  );

  const assets = data?.assets || [];

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'view' | 'edit'>('list');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  // Pagination constants
  const ITEMS_PER_PAGE = 100;

  /**
   * Filter assets based on search query and status filter
   * Searches in both name and description (case-insensitive)
   */
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Search filter (search in name and description)
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch =
        searchQuery === '' ||
        asset.name.toLowerCase().includes(searchLower) ||
        (asset.description?.toLowerCase().includes(searchLower) ?? false);

      // Status filter
      const matchesStatus =
        statusFilter === 'all' || asset.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [assets, searchQuery, statusFilter]);

  /**
   * Calculate pagination values
   */
  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

  // Reset to page 1 when filters change or if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [searchQuery, statusFilter, currentPage, totalPages]);

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all';

  /**
   * Clear all filters
   */
  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  /**
   * Clear search filter
   */
  const clearSearch = () => {
    setSearchQuery('');
  };

  /**
   * Clear status filter
   */
  const clearStatusFilter = () => {
    setStatusFilter('all');
  };

  /**
   * Handle create asset action
   * Opens dialog with no asset data
   */
  const handleCreate = () => {
    // Check subscription limit
    if (!canCreateAsset(assets.length)) {
      toast.error(getUpgradeMessage('assets'), {
        description: `Free plan allows up to ${limits.maxAssets} assets. You currently have ${assets.length}.`,
        duration: 5000,
        action: {
          label: 'Upgrade',
          onClick: redirectToUpgrade,
        },
      });
      return;
    }

    router.push('/assets/new');
  };

  const handleImport = () => {
    if (!canCreateAsset(assets.length)) {
      toast.error(getUpgradeMessage('assets'), {
        description: `Free plan allows up to ${limits.maxAssets} assets. You currently have ${assets.length}.`,
        duration: 5000,
        action: {
          label: 'Upgrade',
          onClick: redirectToUpgrade,
        },
      });
      return;
    }

    setIsImportDialogOpen(true);
  };

  /**
   * Handle view asset
   */
  const handleView = (asset: Asset) => {
    setSelectedAsset(asset);
    setViewMode('view');
  };

  /**
   * Handle edit asset action
   * Switch to edit mode in panel
   */
  const handleEdit = () => {
    setViewMode('edit');
  };

  /**
   * Handle edit asset from table (legacy)
   */
  const handleEditFromTable = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsCloning(false);
    setIsDialogOpen(true);
  };

  /**
   * Handle clone asset action
   * Opens dialog with asset data pre-filled for cloning
   */
  const handleClone = (asset: Asset) => {
    // Check subscription limit (cloning creates a new asset)
    if (!canCreateAsset(assets.length)) {
      toast.error(getUpgradeMessage('assets'), {
        description: `Free plan allows up to ${limits.maxAssets} assets. You currently have ${assets.length}.`,
        duration: 5000,
        action: {
          label: 'Upgrade',
          onClick: redirectToUpgrade,
        },
      });
      return;
    }

    // Set the asset to clone and mark as cloning mode
    setSelectedAsset(asset);
    setIsCloning(true);
    setIsDialogOpen(true);
  };

  /**
   * Handle delete asset action
   * Shows confirmation and deletes via API
   */
  const handleDelete = async (asset: Asset) => {
    if (!window.confirm(`Are you sure you want to delete "${asset.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/assets/${asset.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete asset');
      }

      // Optimistically update the cache
      mutate(
        { assets: assets.filter((a) => a.id !== asset.id) },
        { revalidate: true }
      );

      toast.success('Asset deleted successfully');
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete asset'
      );
    }
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    setViewMode('list');
    setSelectedAsset(null);
  };

  /**
   * Handle save asset action from panel
   * Updates asset and returns to view mode
   */
  const handleSaveFromPanel = async (data: CreateAssetInput) => {
    if (!selectedAsset) return;

    try {
      // Update existing asset
      const response = await fetch(`/api/assets/${selectedAsset.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update asset');
      }

      const { asset: updatedAsset } = await response.json();

      // Update cache
      mutate(
        {
          assets: assets.map((a) =>
            a.id === selectedAsset.id ? updatedAsset : a
          ),
        },
        { revalidate: true }
      );

      toast.success('Asset updated successfully');
      
      // Update selected asset and return to view mode
      setSelectedAsset(updatedAsset);
      setViewMode('view');
    } catch (error) {
      console.error('Error saving asset:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save asset'
      );
      throw error;
    }
  };

  /**
   * Handle save asset action from dialog (legacy for create/clone)
   * Creates or updates asset via API
   */
  const handleSaveFromDialog = async (data: CreateAssetInput) => {
    try {
      if (selectedAsset && !isCloning) {
        // Update existing asset
        const response = await fetch(`/api/assets/${selectedAsset.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update asset');
        }

        const { asset: updatedAsset } = await response.json();

        // Optimistically update the cache
        mutate(
          {
            assets: assets.map((a) =>
              a.id === selectedAsset.id ? updatedAsset : a
            ),
          },
          { revalidate: true }
        );

        toast.success('Asset updated successfully');
      } else {
        // Create new asset (or clone)
        const response = await fetch('/api/assets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create asset');
        }

        const { asset: newAsset } = await response.json();

        // Optimistically update the cache
        mutate({ assets: [newAsset, ...assets] }, { revalidate: true });

        toast.success(isCloning ? 'Asset cloned successfully' : 'Asset created successfully');
      }
    } catch (error) {
      console.error('Error saving asset:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save asset'
      );
      throw error;
    }
  };

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Assets
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and track all your company assets
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 p-6 text-center">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
            Failed to load assets
          </h3>
          <p className="text-sm text-red-700 dark:text-red-400 mb-4">
            {error.message || 'An error occurred while fetching assets'}
          </p>
          <Button onClick={() => mutate()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Panel-based layout (like quotations/invoices)
  if (viewMode !== 'list') {
    return (
      <div className="h-screen flex">
        {/* Left Panel - Asset List */}
        <div className="w-80 flex-shrink-0">
          <AssetListPanel
            assets={filteredAssets}
            selectedAsset={selectedAsset}
            onSelect={handleView}
            onCreate={handleCreate}
            onImport={handleImport}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </div>

        {/* Right Panel - View or Edit */}
        <div className="flex-1">
          {viewMode === 'view' && selectedAsset && (
            <AssetViewPanel
              asset={selectedAsset}
              onBack={handleBack}
              onEdit={handleEdit}
              onClone={() => {
                handleClone(selectedAsset);
                handleBack();
              }}
              onDelete={async () => {
                if (!window.confirm(`Are you sure you want to delete "${selectedAsset.name}"?`)) {
                  return;
                }
                await handleDelete(selectedAsset);
                handleBack();
              }}
            />
          )}

          {viewMode === 'edit' && selectedAsset && (
            <AssetEditPanel
              asset={selectedAsset}
              onBack={() => setViewMode('view')}
              onSave={handleSaveFromPanel}
            />
          )}
        </div>
      </div>
    );
  }

  // Table view (default)
  return (
    <div className="space-y-6">
      {/* Subscription Badge */}
      <SubscriptionBadge feature="assets" showUpgrade={!canCreateAsset(assets.length)} />

      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Assets
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and track all your company assets
          </p>
          <div className="mt-2">
            <UsageBadge current={assets.length} max={limits.maxAssets} label="Assets used" />
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-auto md:flex-row">
          <Button
            onClick={handleImport}
            variant="outline"
            className="w-full md:w-auto"
            size="lg"
            disabled={isLoading || !canCreateAsset(assets.length)}
          >
            <Upload className="mr-2 h-5 w-5" />
            Import Assets
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-primary-blue hover:bg-blue-700 w-full md:w-auto"
            size="lg"
            disabled={isLoading || !canCreateAsset(assets.length)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Asset
            {!canCreateAsset(assets.length) && (
              <span className="ml-2 text-xs opacity-75">
                (Limit reached: {assets.length}/{limits.maxAssets})
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search assets by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
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
      </div>

      {/* Results Count and Active Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Results Count */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredAssets.length > 0 ? (
            <>
              Showing{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {startIndex + 1}
              </span>
              {' - '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {Math.min(endIndex, filteredAssets.length)}
              </span>
              {' of '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {filteredAssets.length}
              </span>
              {' asset' + (filteredAssets.length !== 1 ? 's' : '')}
              {filteredAssets.length !== assets.length && (
                <>
                  {' (filtered from '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {assets.length}
                  </span>
                  {' total)'}
                </>
              )}
            </>
          ) : (
            <>No assets found</>
          )}
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Active filters:
            </span>

            {/* Search Query Badge */}
            {searchQuery && (
              <Badge
                variant="secondary"
                className="gap-1 pr-1 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300"
              >
                Search: {searchQuery}
                <button
                  onClick={clearSearch}
                  className="ml-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 p-0.5"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {/* Status Filter Badge */}
            {statusFilter !== 'all' && (
              <Badge
                variant="secondary"
                className="gap-1 pr-1 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300"
              >
                Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                <button
                  onClick={clearStatusFilter}
                  className="ml-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 p-0.5"
                  aria-label="Clear status filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {/* Clear All Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-7 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Assets Table - Click to View */}
      <AssetTable
        assets={paginatedAssets}
        onEdit={handleEditFromTable}
        onDelete={handleDelete}
        onClone={handleClone}
        onView={handleView}
        isLoading={isLoading}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {currentPage}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {totalPages}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {/* Show first page if not near start */}
              {currentPage > 3 && (
                <>
                  <Button
                    variant={1 === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    className="h-8 w-8 p-0"
                  >
                    1
                  </Button>
                  {currentPage > 4 && (
                    <span className="px-2 text-gray-500">...</span>
                  )}
                </>
              )}

              {/* Show pages around current page */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                if (pageNum < 1 || pageNum > totalPages) return null;

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="h-8 w-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}

              {/* Show last page if not near end */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <span className="px-2 text-gray-500">...</span>
                  )}
                  <Button
                    variant={totalPages === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    className="h-8 w-8 p-0"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>

            {/* Next Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Asset Dialog (Create/Clone only) */}
      <AssetDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        asset={selectedAsset}
        onSave={handleSaveFromDialog}
        isCloning={isCloning}
      />
      <AssetImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImported={(count) => {
          if (count > 0) {
            mutate();
          }
        }}
      />
    </div>
  );
}

