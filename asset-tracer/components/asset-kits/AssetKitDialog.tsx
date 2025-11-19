'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { AssetKit, CreateAssetKitInput, UpdateAssetKitInput, Asset } from '@/types';

const kitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
});

interface AssetKitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kit?: AssetKit | null;
  onSuccess: () => void;
}

export function AssetKitDialog({ open, onOpenChange, kit, onSuccess }: AssetKitDialogProps) {
  const [selectedAssets, setSelectedAssets] = useState<Array<{ asset_id: string; quantity: number }>>([]);
  const [assetQuantities, setAssetQuantities] = useState<Record<string, number>>({});

  // Fetch assets
  const { data: assetsData } = useSWR<{ assets: Asset[] }>('/api/assets');
  const assets = assetsData?.assets || [];
  const activeAssets = assets.filter((a) => a.status === 'active');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(kitSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
    },
  });

  // Reset form when dialog opens/closes or kit changes
  useEffect(() => {
    if (open) {
      if (kit) {
        reset({
          name: kit.name,
          description: kit.description || '',
          category: kit.category || '',
        });
        // Set selected assets from kit
        const items = kit.items || [];
        const assetIds = items.map((item) => ({
          asset_id: item.asset_id,
          quantity: item.quantity,
        }));
        setSelectedAssets(assetIds);
        const quantities: Record<string, number> = {};
        items.forEach((item) => {
          quantities[item.asset_id] = item.quantity;
        });
        setAssetQuantities(quantities);
      } else {
        reset({
          name: '',
          description: '',
          category: '',
        });
        setSelectedAssets([]);
        setAssetQuantities({});
      }
    }
  }, [open, kit, reset]);

  const toggleAsset = (assetId: string) => {
    setSelectedAssets((prev) => {
      if (prev.some((item) => item.asset_id === assetId)) {
        // Remove asset
        const newQuantities = { ...assetQuantities };
        delete newQuantities[assetId];
        setAssetQuantities(newQuantities);
        return prev.filter((item) => item.asset_id !== assetId);
      } else {
        // Add asset with default quantity 1
        setAssetQuantities((prev) => ({ ...prev, [assetId]: 1 }));
        return [...prev, { asset_id: assetId, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (assetId: string, quantity: number) => {
    if (quantity < 1) return;
    setAssetQuantities((prev) => ({ ...prev, [assetId]: quantity }));
    setSelectedAssets((prev) =>
      prev.map((item) => (item.asset_id === assetId ? { ...item, quantity } : item))
    );
  };

  const onSubmit = async (data: any) => {
    if (selectedAssets.length === 0) {
      toast.error('Please select at least one asset');
      return;
    }

    try {
      const assetIds = selectedAssets.map((item) => ({
        asset_id: item.asset_id,
        quantity: assetQuantities[item.asset_id] || 1,
      }));

      const url = kit ? `/api/asset-kits/${kit.id}` : '/api/asset-kits';
      const method = kit ? 'PATCH' : 'POST';

      const payload: CreateAssetKitInput | UpdateAssetKitInput = {
        name: data.name,
        description: data.description || null,
        category: data.category || null,
        asset_ids: assetIds,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save kit');
      }

      toast.success(kit ? 'Kit updated successfully' : 'Kit created successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving kit:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save kit');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{kit ? 'Edit Asset Kit' : 'New Asset Kit'}</DialogTitle>
          <DialogDescription>
            {kit
              ? 'Update the kit details and assets'
              : 'Create a bundle of assets that can be reserved together'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Kit Name *</Label>
              <Input id="name" {...register('name')} placeholder="e.g., Complete Lighting Kit" />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message as string}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input id="category" {...register('category')} placeholder="e.g., Lighting" />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe what this kit is used for"
              rows={3}
            />
          </div>

          {/* Asset Selection */}
          <div>
            <Label>Select Assets *</Label>
            <div className="mt-2 border rounded-lg p-4 max-h-64 overflow-y-auto">
              {activeAssets.length === 0 ? (
                <p className="text-sm text-gray-500">No active assets available</p>
              ) : (
                <div className="space-y-2">
                  {activeAssets.map((asset) => {
                    const isSelected = selectedAssets.some((item) => item.asset_id === asset.id);
                    const quantity = assetQuantities[asset.id] || 1;

                    return (
                      <div
                        key={asset.id}
                        className={`flex items-center justify-between p-2 rounded border ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAsset(asset.id)}
                            className="rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{asset.name}</p>
                            <p className="text-xs text-gray-500">
                              {asset.category} {asset.location && `• ${asset.location}`}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Qty:</Label>
                            <Input
                              type="number"
                              min="1"
                              value={quantity}
                              onChange={(e) => updateQuantity(asset.id, parseInt(e.target.value) || 1)}
                              className="w-16 h-8 text-xs"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {selectedAssets.length === 0 && (
              <p className="text-sm text-red-500 mt-1">Please select at least one asset</p>
            )}
          </div>

          {/* Selected Assets Summary */}
          {selectedAssets.length > 0 && (
            <div>
              <Label>Kit Contents ({selectedAssets.length} assets)</Label>
              <div className="mt-2 space-y-1">
                {selectedAssets.map((item) => {
                  const asset = assets.find((a) => a.id === item.asset_id);
                  if (!asset) return null;
                  return (
                    <div
                      key={item.asset_id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
                    >
                      <span>
                        {asset.name} {assetQuantities[item.asset_id] > 1 && `× ${assetQuantities[item.asset_id]}`}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAsset(item.asset_id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : kit ? 'Update' : 'Create'} Kit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

