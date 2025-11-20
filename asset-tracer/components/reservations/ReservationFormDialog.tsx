'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, AlertCircle, CheckCircle2, Plus, Package, FileText } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { AssetKitDialog } from '@/components/asset-kits';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import type { Asset, AssetKit } from '@/types';
import type { Reservation, CreateReservationInput } from '@/types/reservation';

const reservationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  project_name: z.string().optional(),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'active', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.end_date) >= new Date(data.start_date);
    }
    return true;
  },
  {
    message: 'End date must be on or after start date',
    path: ['end_date'],
  }
);

interface ReservationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation?: Reservation | null;
  initialDate?: Date | null;
  onSuccess: () => void;
}

export function ReservationFormDialog({
  open,
  onOpenChange,
  reservation,
  initialDate,
  onSuccess,
}: ReservationFormDialogProps) {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectedKits, setSelectedKits] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<'assets' | 'kits'>('assets');
  const [availabilityResults, setAvailabilityResults] = useState<Record<string, any>>({});
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isKitDialogOpen, setIsKitDialogOpen] = useState(false);

  // Subscription limits
  const { tier, limits, canCreateReservation } = useSubscription();

  // Fetch assets
  const { data: assetsData } = useSWR<{ assets: Asset[] }>('/api/assets');
  const assets = assetsData?.assets || [];
  
  // Fetch reservations to check monthly count
  const { data: reservationsData } = useSWR<{ reservations: Reservation[] }>('/api/reservations');
  const reservations = reservationsData?.reservations || [];
  
  // Calculate monthly reservation count
  const monthlyReservationCount = useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return reservations.filter((r) => new Date(r.created_at) >= firstDayOfMonth).length;
  }, [reservations]);

  // Fetch kits
  const { data: kitsData, mutate: mutateKits } = useSWR<{ kits: AssetKit[] }>('/api/asset-kits');
  const kits = kitsData?.kits || [];

  // Group assets by category
  const assetsByCategory = useMemo(() => {
    const grouped: Record<string, Asset[]> = {};
    assets.forEach((asset) => {
      const category = asset.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(asset);
    });
    return grouped;
  }, [assets]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(assets.map((a) => a.category || 'Uncategorized').filter(Boolean)));
    return cats.sort();
  }, [assets]);

  // Filter assets based on category filter
  const availableAssets = useMemo(() => {
    if (categoryFilter === 'all') {
      return assets.filter((asset) => asset.status === 'active');
    }
    return assets.filter(
      (asset) => asset.status === 'active' && (asset.category || 'Uncategorized') === categoryFilter
    );
  }, [assets, categoryFilter]);

  const toggleCategory = (category: string) => {
    const categoryAssets = assetsByCategory[category] || [];
    const activeCategoryAssets = categoryAssets
      .filter((asset) => asset.status === 'active')
      .map((asset) => asset.id);

    if (activeCategoryAssets.length === 0) return;

    // Check if all assets in category are selected
    const allSelected = activeCategoryAssets.every((id) => selectedAssets.includes(id));

    if (allSelected) {
      // Deselect all assets in this category
      setSelectedAssets((prev) => prev.filter((id) => !activeCategoryAssets.includes(id)));
    } else {
      // Select all assets in this category
      setSelectedAssets((prev) => {
        const newSelection = [...prev];
        activeCategoryAssets.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const isCategorySelected = (category: string) => {
    const categoryAssets = assetsByCategory[category] || [];
    const activeCategoryAssets = categoryAssets
      .filter((asset) => asset.status === 'active')
      .map((asset) => asset.id);

    if (activeCategoryAssets.length === 0) return false;
    return activeCategoryAssets.every((id) => selectedAssets.includes(id));
  };

  const isCategoryPartiallySelected = (category: string) => {
    const categoryAssets = assetsByCategory[category] || [];
    const activeCategoryAssets = categoryAssets
      .filter((asset) => asset.status === 'active')
      .map((asset) => asset.id);

    if (activeCategoryAssets.length === 0) return false;
    const selectedCount = activeCategoryAssets.filter((id) => selectedAssets.includes(id)).length;
    return selectedCount > 0 && selectedCount < activeCategoryAssets.length;
  };

  // Render asset list based on view mode
  const renderAssetList = () => {
    if (availableAssets.length === 0) {
      return <p className="text-sm text-gray-500">No active assets available</p>;
    }

    if (categoryFilter === 'all') {
      // Grouped by category view when showing all
      return (
        <div className="space-y-4">
          {categories.map((category) => {
            const categoryAssets = assetsByCategory[category] || [];
            const activeCategoryAssets = categoryAssets.filter((a) => a.status === 'active');

            if (activeCategoryAssets.length === 0) return null;

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isCategorySelected(category)}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = isCategoryPartiallySelected(category);
                        }
                      }}
                      onChange={() => toggleCategory(category)}
                      className="rounded"
                    />
                    <Label className="font-medium text-sm cursor-pointer">
                      {category} ({activeCategoryAssets.length})
                    </Label>
                  </div>
                </div>
                <div className="space-y-1 pl-6">
                  {activeCategoryAssets.map((asset) => {
                    const isSelected = selectedAssets.includes(asset.id);
                    const availability = availabilityResults[asset.id];
                    const hasConflict = availability && !availability.is_available;

                    return (
                      <div
                        key={asset.id}
                        className={`flex items-center justify-between p-2 rounded border ${
                          isSelected
                            ? hasConflict
                              ? 'bg-red-50 border-red-300 dark:bg-red-900/20'
                              : 'bg-blue-50 border-blue-300 dark:bg-blue-900/20'
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
                              {asset.location && `Location: ${asset.location}`}
                            </p>
                          </div>
                        </div>
                        {isSelected && availability && (
                          <div className="flex items-center gap-2">
                            {availability.is_available ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Available
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Conflict
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Simple list view when filtering by category
    return (
      <div className="space-y-2">
        {availableAssets.map((asset) => {
          const isSelected = selectedAssets.includes(asset.id);
          const availability = availabilityResults[asset.id];
          const hasConflict = availability && !availability.is_available;

          return (
            <div
              key={asset.id}
              className={`flex items-center justify-between p-2 rounded border ${
                isSelected
                  ? hasConflict
                    ? 'bg-red-50 border-red-300 dark:bg-red-900/20'
                    : 'bg-blue-50 border-blue-300 dark:bg-blue-900/20'
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
                    {asset.location && `Location: ${asset.location}`}
                  </p>
                </div>
              </div>
              {isSelected && availability && (
                <div className="flex items-center gap-2">
                  {availability.is_available ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Available
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Conflict
                    </Badge>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      title: reservation?.title || '',
      project_name: reservation?.project_name || '',
      description: reservation?.description || '',
      start_date: reservation?.start_date || '',
      end_date: reservation?.end_date || '',
      start_time: reservation?.start_time || '',
      end_time: reservation?.end_time || '',
      location: reservation?.location || '',
      status: (reservation?.status as any) || 'pending',
      priority: (reservation?.priority as any) || 'normal',
      notes: reservation?.notes || '',
    },
  });

  const startDate = watch('start_date');
  const endDate = watch('end_date');

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (reservation) {
        reset({
          title: reservation.title,
          project_name: reservation.project_name || '',
          description: reservation.description || '',
          start_date: reservation.start_date,
          end_date: reservation.end_date,
          start_time: reservation.start_time || '',
          end_time: reservation.end_time || '',
          location: reservation.location || '',
          status: (reservation.status as any) || 'pending',
          priority: (reservation.priority as any) || 'normal',
          notes: reservation.notes || '',
        });
        // Safely extract asset IDs from reservation assets
        const assetIds: string[] = [];
        if (reservation.assets && Array.isArray(reservation.assets)) {
          reservation.assets.forEach((asset: any) => {
            if (asset && (asset.asset_id || asset.id)) {
              assetIds.push(asset.asset_id || asset.id);
            }
          });
        }
        setSelectedAssets(assetIds);
        setSelectedKits([]);
        setSelectionMode('assets');
      } else {
        // Use initialDate if provided, otherwise use empty strings
        const dateStr = initialDate ? format(initialDate, 'yyyy-MM-dd') : '';
        reset({
          title: '',
          project_name: '',
          description: '',
          start_date: dateStr,
          end_date: dateStr,
          start_time: '',
          end_time: '',
          location: '',
          status: 'pending',
          priority: 'normal',
          notes: '',
        });
        setSelectedAssets([]);
        setSelectedKits([]);
        // Force assets mode if kits not allowed (free tier)
        setSelectionMode('assets');
      }
      setAvailabilityResults({});
      
      // Ensure selection mode is valid for current tier
      if (selectionMode === 'kits' && (tier === 'free' || !limits.hasKitReservations)) {
        setSelectionMode('assets');
      }
    }
  }, [open, reservation, initialDate, reset, limits.hasKitReservations, tier, selectionMode]);

  // Check availability when dates or selected assets/kits change
  useEffect(() => {
    const allAssetIds = getAllSelectedAssetIds;
    if (startDate && endDate && allAssetIds.length > 0) {
      checkAvailability(allAssetIds);
    } else {
      setAvailabilityResults({});
    }
  }, [startDate, endDate, selectedAssets, selectedKits, kits]);

  const checkAvailability = async (assetIds: string[] = getAllSelectedAssetIds) => {
    if (!startDate || !endDate || assetIds.length === 0) return;

    setIsCheckingAvailability(true);
    try {
      const response = await fetch('/api/reservations/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_ids: assetIds,
          start_date: startDate,
          end_date: endDate,
          exclude_reservation_id: reservation?.id || null,
        }),
      });

      const data = await response.json();
      if (response.ok && data.availability && Array.isArray(data.availability)) {
        const results: Record<string, any> = {};
        data.availability.forEach((item: any) => {
          if (item && item.asset_id) {
            results[item.asset_id] = {
              is_available: item.is_available ?? false,
              conflicts: Array.isArray(item.conflicts) ? item.conflicts : [],
              asset_name: item.asset_name || 'Unknown Asset',
            };
          }
        });
        setAvailabilityResults(results);
      } else {
        // If API call failed or returned unexpected data, reset availability results
        console.error('Availability check failed:', data);
        setAvailabilityResults({});
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const toggleAsset = (assetId: string) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
  };

  // Expand selected kits into asset IDs
  const getAllSelectedAssetIds = useMemo(() => {
    const assetIds = [...selectedAssets];
    
    // Add assets from selected kits
    selectedKits.forEach((kitId) => {
      const kit = kits.find((k) => k.id === kitId);
      if (kit && kit.items) {
        kit.items.forEach((item) => {
          // Add each asset the number of times specified by quantity
          for (let i = 0; i < item.quantity; i++) {
            if (!assetIds.includes(item.asset_id)) {
              assetIds.push(item.asset_id);
            }
          }
        });
      }
    });
    
    return assetIds;
  }, [selectedAssets, selectedKits, kits]);

  const toggleKit = (kitId: string) => {
    setSelectedKits((prev) =>
      prev.includes(kitId) ? prev.filter((id) => id !== kitId) : [...prev, kitId]
    );
  };

  const onSubmit = async (data: any) => {
    const allAssetIds = getAllSelectedAssetIds;
    
    if (allAssetIds.length === 0) {
      toast.error('Please select at least one asset or kit');
      return;
    }

    // Check monthly reservation limit (for new reservations only)
    if (!reservation) {
      if (!canCreateReservation(monthlyReservationCount)) {
        const maxAllowed = limits.maxReservationsPerMonth;
        toast.error('Monthly reservation limit reached', {
          description: `Your ${tier === 'free' ? 'Free' : 'Pro'} plan allows ${maxAllowed} reservations per month. You've created ${monthlyReservationCount} this month. ${tier === 'free' ? 'Upgrade to Pro for 200 reservations/month, or Business for unlimited.' : 'Upgrade to Business for unlimited reservations.'}`,
          action: {
            label: 'Upgrade',
            onClick: () => {
              window.location.href = '/settings?tab=billing';
            },
          },
        });
        return;
      }
    }

    // Check for conflicts
    const hasConflicts = Object.values(availabilityResults).some(
      (result: any) => result && !result.is_available && result.conflicts && Array.isArray(result.conflicts) && result.conflicts.length > 0
    );

    // Enforce conflict override based on subscription tier
    if (hasConflicts) {
      if (!limits.hasConflictOverride) {
        // Free and Pro plans cannot override conflicts
        toast.error('Scheduling conflicts detected', {
          description: 'Some selected assets have scheduling conflicts. Business plan required to override conflicts.',
          action: {
            label: 'Upgrade',
            onClick: () => {
              window.location.href = '/settings?tab=billing';
            },
          },
        });
        return;
      } else {
        // Business plan can override, but show confirmation
        const confirmed = window.confirm(
          'Some assets have scheduling conflicts. Do you want to proceed anyway?'
        );
        if (!confirmed) return;
      }
    }

    try {
      // Use expanded asset IDs (from both individual assets and kits)
      const assetIds = allAssetIds;
      
      const payload: CreateReservationInput = {
        title: data.title,
        project_name: data.project_name || null,
        description: data.description || null,
        start_date: data.start_date,
        end_date: data.end_date,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        location: data.location || null,
        status: data.status,
        priority: data.priority,
        notes: data.notes || null,
        asset_ids: assetIds,
      };

      const url = reservation
        ? `/api/reservations/${reservation.id}`
        : '/api/reservations';
      const method = reservation ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details.map((d: any) => `${d.field}: ${d.message}`).join(', ')}`
          : errorData.error || 'Failed to save reservation';
        console.error('Reservation save error:', errorData);
        throw new Error(errorMessage);
      }

      toast.success(reservation ? 'Reservation updated successfully' : 'Reservation created successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving reservation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save reservation');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-2xl">
            {reservation ? 'Edit Reservation' : 'New Reservation'}
          </DialogTitle>
          <DialogDescription>
            {reservation ? 'Update reservation details' : 'Create a new equipment reservation'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-semibold">Basic Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="e.g., Commercial Shoot - Client ABC"
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title.message as string}</p>
                )}
              </div>
              <div>
                <Label htmlFor="project_name">Project Name</Label>
                <Input
                  id="project_name"
                  {...register('project_name')}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Schedule Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-semibold">Schedule</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register('start_date')}
                />
                {errors.start_date && (
                  <p className="text-sm text-red-500 mt-1">{errors.start_date.message as string}</p>
                )}
              </div>
              <div>
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  {...register('end_date')}
                />
                {errors.end_date && (
                  <p className="text-sm text-red-500 mt-1">{errors.end_date.message as string}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  {...register('start_time')}
                />
              </div>
              <div>
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  {...register('end_time')}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-semibold">Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="e.g., Studio A, On-location"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={watch('status')}
                    onValueChange={(value) => setValue('status', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={watch('priority')}
                    onValueChange={(value) => setValue('priority', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Additional details about this reservation"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Internal notes (not visible to clients)"
                rows={2}
              />
            </div>
          </div>

          <Separator />

            {/* Equipment Selection Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-semibold">Equipment Selection *</h3>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={selectionMode === 'assets' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectionMode('assets')}
                >
                  Assets
                </Button>
                <Button
                  type="button"
                  variant={selectionMode === 'kits' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    // Double-check limits to prevent any edge cases
                    if (tier === 'free' || !limits.hasKitReservations) {
                      toast.error('Kit reservations not available', {
                        description: 'Kit reservations require Pro plan or higher. Upgrade to reserve complete equipment bundles.',
                        action: {
                          label: 'Upgrade',
                          onClick: () => {
                            window.location.href = '/settings?tab=billing';
                          },
                        },
                      });
                      return;
                    }
                    setSelectionMode('kits');
                  }}
                  disabled={tier === 'free' || !limits.hasKitReservations}
                  title={tier === 'free' || !limits.hasKitReservations ? 'Kit reservations require Pro plan or higher' : ''}
                >
                  Kits
                  {(tier === 'free' || !limits.hasKitReservations) && (
                    <Badge variant="outline" className="ml-2 text-xs">Pro+</Badge>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Monthly limit warning */}
            {!reservation && !canCreateReservation(monthlyReservationCount) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Monthly reservation limit reached ({monthlyReservationCount}/{limits.maxReservationsPerMonth}). 
                  {tier === 'free' ? ' Upgrade to Pro for 200/month or Business for unlimited.' : ' Upgrade to Business for unlimited reservations.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Kit Selection */}
            {selectionMode === 'kits' && limits.hasKitReservations && tier !== 'free' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-600">Available Kits</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsKitDialogOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Kit
                  </Button>
                </div>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
                  {kits.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500 mb-2">No kits available.</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsKitDialogOpen(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Create Your First Kit
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {kits.map((kit) => {
                        const isSelected = selectedKits.includes(kit.id);
                        const itemCount = kit.items?.length || 0;

                        return (
                          <div
                            key={kit.id}
                            className={`flex items-center justify-between p-3 rounded border ${
                              isSelected
                                ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleKit(kit.id)}
                                className="rounded"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{kit.name}</p>
                                <p className="text-xs text-gray-500">
                                  {itemCount} asset{itemCount !== 1 ? 's' : ''}
                                  {kit.category && ` • ${kit.category}`}
                                </p>
                                {kit.description && (
                                  <p className="text-xs text-gray-400 mt-1">{kit.description}</p>
                                )}
                              </div>
                            </div>
                            {isSelected && kit.items && kit.items.length > 0 && (
                              <div className="text-xs text-gray-500">
                                {kit.items.map((item, idx) => {
                                  const asset = assets.find((a) => a.id === item.asset_id);
                                  return (
                                    <div key={idx}>
                                      {asset?.name} {item.quantity > 1 && `× ${item.quantity}`}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Asset Selection */}
            {selectionMode === 'assets' && (
              <div className="space-y-3">
                {categories.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Category Quick Select */}
                {categoryFilter === 'all' && categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                      const categoryAssets = assetsByCategory[category] || [];
                      const activeCount = categoryAssets.filter((a) => a.status === 'active').length;
                      const isSelected = isCategorySelected(category);
                      const isPartial = isCategoryPartiallySelected(category);

                      if (activeCount === 0) return null;

                      return (
                        <Button
                          key={category}
                          type="button"
                          variant={isSelected ? 'default' : isPartial ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => toggleCategory(category)}
                        >
                          {isPartial && '• '}
                          {category} ({activeCount})
                        </Button>
                      );
                    })}
                  </div>
                )}

                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
                  {renderAssetList()}
                </div>
              </div>
            )}

            {/* Selection Summary */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                {selectionMode === 'assets' && selectedAssets.length === 0 && (
                  <p className="text-sm text-red-500">Please select at least one asset</p>
                )}
                {selectionMode === 'kits' && limits.hasKitReservations && tier !== 'free' && selectedKits.length === 0 && (
                  <p className="text-sm text-red-500">Please select at least one kit</p>
                )}
                {(selectedAssets.length > 0 || selectedKits.length > 0) && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{getAllSelectedAssetIds.length}</span> asset{getAllSelectedAssetIds.length !== 1 ? 's' : ''} selected
                    {selectedKits.length > 0 && (
                      <span className="text-gray-500"> • {selectedKits.length} kit{selectedKits.length !== 1 ? 's' : ''}</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Availability Warnings */}
          {Object.values(availabilityResults).some(
            (result: any) => result && !result.is_available && result.conflicts && Array.isArray(result.conflicts) && result.conflicts.length > 0
          ) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Some selected assets have scheduling conflicts. Please review before proceeding.
              </AlertDescription>
            </Alert>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isCheckingAvailability}>
              {isSubmitting ? 'Saving...' : reservation ? 'Update Reservation' : 'Create Reservation'}
            </Button>
          </div>
        </form>

        {/* Kit Management Dialog */}
        <AssetKitDialog
          open={isKitDialogOpen}
          onOpenChange={setIsKitDialogOpen}
          kit={null}
          onSuccess={() => {
            mutateKits();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

