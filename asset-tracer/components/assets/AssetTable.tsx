'use client';

import { useRouter } from 'next/navigation';
import { MoreVertical, Edit, Trash2, Package, Eye, Copy, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/lib/context/CurrencyContext';
import type { Asset } from '@/types';

interface AssetTableProps {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onClone: (asset: Asset) => void;
  onView?: (asset: Asset) => void; // Optional onView handler
  isLoading?: boolean;
}

/**
 * Maps asset status to badge variant and color
 */
const getStatusBadge = (status: Asset['status']) => {
  const statusConfig = {
    active: {
      variant: 'default' as const,
      className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300',
    },
    maintenance: {
      variant: 'default' as const,
      className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300',
    },
    retired: {
      variant: 'secondary' as const,
      className: 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300',
    },
    sold: {
      variant: 'default' as const,
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
    },
  };

  return statusConfig[status] || statusConfig.active;
};

/**
 * Loading skeleton for table rows
 */
function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-6 mb-4">
        <Package className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        No assets found
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        Get started by adding your first asset to track and manage your inventory.
      </p>
    </div>
  );
}

/**
 * AssetTable component displays a list of assets in a table format
 */
export function AssetTable({ assets, onEdit, onDelete, onClone, onView, isLoading = false }: AssetTableProps) {
  const router = useRouter();
  const { formatCurrency } = useCurrency();

  const handleView = (asset: Asset) => {
    if (onView) {
      // Use panel view
      onView(asset);
    } else {
      // Fallback to navigation
      router.push(`/assets/${asset.id}`);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      {/* Responsive wrapper with horizontal scroll on mobile */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Name</TableHead>
              <TableHead className="min-w-[120px]">Category</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[120px] text-right">Purchase Cost</TableHead>
              <TableHead className="min-w-[120px] text-right">Current Value</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64">
                  <EmptyState />
                </TableCell>
              </TableRow>
            ) : (
              assets.map((asset) => {
                const statusBadge = getStatusBadge(asset.status);
                
                return (
                  <TableRow 
                    key={asset.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => handleView(asset)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {asset.asset_type === 'group' && (
                            <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          )}
                          <span className="text-gray-900 dark:text-gray-100">{asset.name}</span>
                          {asset.asset_type === 'group' && asset.quantity && (
                            <Badge variant="outline" className="text-xs">
                              {asset.quantity} items
                            </Badge>
                          )}
                        </div>
                        {asset.description && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {asset.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700 dark:text-gray-300">
                        {asset.category || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadge.variant} className={statusBadge.className}>
                        {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(asset.purchase_cost)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(asset.current_value)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleView(asset)}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            <span>View Details</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onEdit(asset)}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onClone(asset)}
                            className="cursor-pointer"
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            <span>Clone</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(asset)}
                            className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

