'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrency } from '@/lib/context/CurrencyContext';
import type { Asset, CreateAssetInput } from '@/types';

/**
 * Zod schema for asset validation
 */
const assetSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  purchase_date: z.string().optional().nullable(),
  purchase_cost: z.coerce
    .number({
      required_error: 'Purchase cost is required',
      invalid_type_error: 'Purchase cost must be a number',
    })
    .min(0, {
      message: 'Purchase cost must be at least 0',
    }),
  current_value: z.coerce
    .number({
      required_error: 'Current value is required',
      invalid_type_error: 'Current value must be a number',
    })
    .min(0, {
      message: 'Current value must be at least 0',
    }),
  status: z.enum(['active', 'maintenance', 'retired', 'sold'], {
    required_error: 'Please select a status',
  }),
  location: z.string().optional().nullable(),
  serial_number: z.string().optional().nullable(),
  asset_type: z.enum(['individual', 'group']).optional().default('individual'),
  quantity: z.coerce.number().min(1).optional().default(1),
});

type AssetFormData = z.infer<typeof assetSchema>;

interface AssetFormProps {
  initialData?: Asset | null;
  onSubmit: (data: CreateAssetInput) => Promise<void>;
  onCancel: () => void;
  isCloning?: boolean;
}

/**
 * Category options for the select field
 */
const categoryOptions = [
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Furniture', label: 'Furniture' },
  { value: 'Vehicles', label: 'Vehicles' },
  { value: 'Equipment', label: 'Equipment' },
  { value: 'Other', label: 'Other' },
];

/**
 * Status options for the select field
 */
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retired', label: 'Retired' },
  { value: 'sold', label: 'Sold' },
];

/**
 * AssetForm component for creating and editing assets
 * Reusable for both create and edit modes
 */
export function AssetForm({ initialData, onSubmit, onCancel, isCloning = false }: AssetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getCurrencySymbol } = useCurrency();
  const isEditMode = !!initialData && !isCloning;

  // Get currency symbol for display
  const currencySymbol = getCurrencySymbol();

  // Initialize form with react-hook-form and zod validation
  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: isCloning && initialData?.name ? `${initialData.name} (Copy)` : (initialData?.name || ''),
      description: initialData?.description || '',
      category: initialData?.category || '',
      purchase_date: initialData?.purchase_date || '',
      purchase_cost: initialData?.purchase_cost || 0,
      current_value: initialData?.current_value || 0,
      status: initialData?.status || 'active',
      location: initialData?.location || '',
      serial_number: initialData?.serial_number || '',
      asset_type: (initialData?.asset_type as 'individual' | 'group') || 'individual',
      quantity: initialData?.quantity || 1,
    },
  });

  // Watch asset_type to show/hide quantity field
  const assetType = form.watch('asset_type');

  /**
   * Handle form submission
   */
  const handleSubmit = async (data: AssetFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data as CreateAssetInput);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input 
                  placeholder={assetType === 'group' ? "e.g., Cutlery Set - 24 pieces" : "e.g., Dell Laptop XPS 15"} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Asset Type Toggle */}
        <FormField
          control={form.control}
          name="asset_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asset Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || 'individual'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="individual">Individual Asset</SelectItem>
                  <SelectItem value="group">Group Asset (Set)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {field.value === 'group' 
                  ? 'Create a group for sets (e.g., cutlery set, dinnerware set)' 
                  : 'Single item asset'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Quantity Field - Only show for groups */}
        {assetType === 'group' && (
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Items in Group *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g., 24"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    value={field.value || 1}
                  />
                </FormControl>
                <FormDescription>
                  Total number of items in this group (e.g., 24 pieces for a cutlery set)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Description Field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={assetType === 'group' 
                    ? "e.g., Complete cutlery set including forks, knives, spoons..." 
                    : "Provide additional details about the asset..."}
                  className="resize-none"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>Optional description of the asset</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category and Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Field */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status Field */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Purchase Date Field */}
        <FormField
          control={form.control}
          name="purchase_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purchase Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Purchase Cost and Current Value Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Purchase Cost Field */}
          <FormField
            control={form.control}
            name="purchase_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Cost *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                      {currencySymbol}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pl-14"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Current Value Field */}
          <FormField
            control={form.control}
            name="current_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Value *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                      {currencySymbol}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pl-14"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Location and Serial Number Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location Field */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Office Building A, Room 101"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Serial Number Field */}
          <FormField
            control={form.control}
            name="serial_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serial Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., SN123456789"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-primary-blue hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>{isEditMode ? 'Update Asset' : 'Create Asset'}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

