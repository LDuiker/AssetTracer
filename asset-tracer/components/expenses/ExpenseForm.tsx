'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useCurrency } from '@/lib/context/CurrencyContext';
import type { Expense, CreateExpenseInput, Asset } from '@/types';

const expenseFormSchema = z.object({
  description: z.string().min(2, 'Description must be at least 2 characters'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  expense_date: z.string().min(1, 'Date is required'),
  category: z.enum([
    'maintenance',
    'repair',
    'supplies',
    'utilities',
    'insurance',
    'fuel',
    'other',
  ]),
  vendor: z.string().min(1, 'Vendor is required'),
  asset_id: z.string().uuid().nullable().optional(),
  reference_number: z.string().optional(),
  payment_method: z
    .enum(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other'])
    .nullable()
    .optional(),
  is_tax_deductible: z.boolean().default(false),
  status: z.enum(['pending', 'approved', 'rejected', 'paid']).default('pending'),
  notes: z.string().optional(),
  receipt_url: z.string().url().optional().or(z.literal('')),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
  expense?: Expense | null;
  onSubmit: (data: CreateExpenseInput) => void;
  onCancel: () => void;
}

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch');
  }
  return res.json();
};

export function ExpenseForm({ expense, onSubmit, onCancel }: ExpenseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getCurrencySymbol } = useCurrency();

  // Get currency symbol for display
  const currencySymbol = getCurrencySymbol();

  // Fetch organization data for default currency
  const { data: orgData } = useSWR('/api/organization/settings', fetcher);
  const defaultCurrency = orgData?.organization?.default_currency || 'USD';

  // Fetch assets for the asset dropdown
  const { data: assetsData } = useSWR<{ assets: Asset[] }>('/api/assets', fetcher);
  const assets = assetsData?.assets || [];

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: expense?.description || '',
      amount: expense?.amount || 0,
      expense_date: expense?.expense_date
        ? new Date(expense.expense_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      category: expense?.category || 'other',
      vendor: expense?.vendor || '',
      asset_id: expense?.asset_id || null,
      reference_number: expense?.reference_number || '',
      payment_method: expense?.payment_method || null,
      is_tax_deductible: expense?.is_tax_deductible || false,
      status: expense?.status || 'pending',
      notes: expense?.notes || '',
      receipt_url: expense?.receipt_url || '',
    },
  });

  // Reset form when expense prop changes
  useEffect(() => {
    if (expense) {
      form.reset({
        description: expense.description,
        amount: expense.amount,
        expense_date: new Date(expense.expense_date).toISOString().split('T')[0],
        category: expense.category,
        vendor: expense.vendor,
        asset_id: expense.asset_id,
        reference_number: expense.reference_number || '',
        payment_method: expense.payment_method,
        is_tax_deductible: expense.is_tax_deductible,
        status: expense.status,
        notes: expense.notes || '',
        receipt_url: expense.receipt_url || '',
      });
    }
  }, [expense, form]);

  const handleSubmit = async (data: ExpenseFormValues) => {
    setIsSubmitting(true);
    try {
      const submitData: CreateExpenseInput = {
        description: data.description,
        amount: data.amount,
        expense_date: data.expense_date,
        category: data.category,
        vendor: data.vendor,
        currency: defaultCurrency,
        asset_id: data.asset_id || null,
        reference_number: data.reference_number || null,
        payment_method: data.payment_method || null,
        is_tax_deductible: data.is_tax_deductible,
        is_recurring: false,
        recurring_frequency: null,
        status: data.status,
        notes: data.notes || null,
        tags: null,
        receipt_url: data.receipt_url || null,
        project_id: null,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description of the expense"
                  {...field}
                  rows={2}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Row: Amount and Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                      {currencySymbol}
                    </span>
                    <Input 
                      type="number" 
                      step="0.01" 
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

          <FormField
            control={form.control}
            name="expense_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expense Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row: Category and Vendor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="fuel">Fuel</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vendor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor</FormLabel>
                <FormControl>
                  <Input placeholder="Vendor name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Asset Selection */}
        <FormField
          control={form.control}
          name="asset_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Linked Asset (Optional)</FormLabel>
              <Select
                onValueChange={(value) =>
                  field.onChange(value === 'none' ? null : value)
                }
                value={field.value || 'none'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No Asset</SelectItem>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name} - {asset.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Link this expense to a specific asset if applicable
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Row: Reference Number and Payment Method */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="reference_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Invoice or receipt number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select
                  onValueChange={(value) =>
                    field.onChange(value === 'none' ? null : value)
                  }
                  value={field.value || 'none'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row: Status and Tax Deductible */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_tax_deductible"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Tax Deductible</FormLabel>
                  <FormDescription>
                    Mark if this expense is tax deductible
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Receipt URL */}
        <FormField
          control={form.control}
          name="receipt_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Receipt URL (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com/receipt.pdf"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Link to the receipt or supporting document
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes or details"
                  {...field}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Expense'
            )}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

