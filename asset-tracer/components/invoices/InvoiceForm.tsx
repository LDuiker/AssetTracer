'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import useSWR from 'swr';
import { Loader2, Plus, Trash2, DollarSign } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import type { Invoice, Client, InvoiceStatus, CreateInvoiceInput } from '@/types';
import { useCurrency } from '@/lib/context/CurrencyContext';

/**
 * Zod schema for line item validation
 */
const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.coerce.number().min(0, 'Unit price must be at least 0'),
  asset_id: z.string().optional().nullable(),
});

/**
 * Zod schema for invoice validation
 */
const invoiceSchema = z.object({
  client_id: z.string().min(1, 'Please select a client'),
  subject: z.string().optional(),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  currency: z.string().min(1, 'Currency is required'),
  tax_rate: z.coerce.number().min(0).max(100, 'Tax rate must be between 0 and 100'),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  items: z.array(lineItemSchema).min(1, 'At least one line item is required'),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  invoice?: Invoice | null;
  onSubmit: (data: CreateInvoiceInput) => void;
  onCancel: () => void;
}

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

/**
 * InvoiceForm component for creating and editing invoices
 */
export function InvoiceForm({ invoice, onSubmit, onCancel }: InvoiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  const isEditMode = !!invoice;

  // Fetch clients for dropdown
  const { data: clientsData } = useSWR<{ clients: Client[] }>('/api/clients', fetcher);
  const clients = clientsData?.clients || [];

  // Fetch assets for dropdown
  const { data: assetsData } = useSWR<{ assets: any[] }>('/api/assets', fetcher);
  const assets = assetsData?.assets || [];

  // Fetch organization settings for default currency
  const { data: orgData } = useSWR('/api/organization/settings', fetcher);
  const defaultCurrency = orgData?.organization?.default_currency || 'USD';

  // Helper function to get currency symbol for input fields (short form)
  const getCurrencySymbolForCode = (currencyCode: string): string => {
    const currencySymbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'BWP': 'P',
      'ZAR': 'R',
    };
    return currencySymbols[currencyCode] || currencyCode;
  };

  // Helper function to get currency code for display (full form for BWP)
  const getCurrencyCodeForDisplay = (currencyCode: string): string => {
    // Use full "BWP" for Botswana, short symbols for others
    return currencyCode === 'BWP' ? 'BWP' : getCurrencySymbolForCode(currencyCode);
  };

  // Calculate default dates
  const today = new Date().toISOString().split('T')[0];
  const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client_id: invoice?.client_id || '',
      subject: invoice?.subject || '',
      issue_date: invoice?.issue_date
        ? new Date(invoice.issue_date).toISOString().split('T')[0]
        : today,
      due_date: invoice?.due_date
        ? new Date(invoice.due_date).toISOString().split('T')[0]
        : defaultDueDate,
      status: invoice?.status || 'draft',
      currency: invoice?.currency || defaultCurrency,
      tax_rate: 10, // Default tax rate
      notes: invoice?.notes || orgData?.organization?.default_notes || '',
      terms: invoice?.terms || orgData?.organization?.invoice_terms || 'Payment due within 30 days',
      items: invoice?.items || [
        { description: '', quantity: 1, unit_price: 0 },
      ],
    },
  });

  // Update form when invoice changes
  useEffect(() => {
    if (invoice) {
      form.reset({
        client_id: invoice.client_id,
        subject: invoice.subject || '',
        issue_date: new Date(invoice.issue_date).toISOString().split('T')[0],
        due_date: new Date(invoice.due_date).toISOString().split('T')[0],
        status: invoice.status,
        currency: invoice.currency,
        tax_rate: 10,
        notes: invoice.notes || '',
        terms: invoice.terms || '',
        items: invoice.items || [{ description: '', quantity: 1, unit_price: 0 }],
      });
    }
  }, [invoice, form]);

  // Update default notes and terms when orgData loads (only for new invoices)
  useEffect(() => {
    if (!invoice && orgData?.organization) {
      const currentValues = form.getValues();
      // Only update if the fields are still empty (haven't been edited by user)
      if (!currentValues.notes && orgData.organization.default_notes) {
        form.setValue('notes', orgData.organization.default_notes);
      }
      if (!currentValues.terms && orgData.organization.invoice_terms) {
        form.setValue('terms', orgData.organization.invoice_terms);
      }
    }
  }, [orgData, invoice, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Watch form values for real-time calculations
  const watchItems = form.watch('items');
  const watchTaxRate = form.watch('tax_rate');
  const watchCurrency = form.watch('currency');

  // Get current currency symbol
  const currentCurrencySymbol = getCurrencySymbolForCode(watchCurrency || defaultCurrency);

  // Format currency based on the form's selected currency (not global context)
  const formatFormCurrency = (amount: number): string => {
    const selectedCurrency = watchCurrency || defaultCurrency;
    const symbol = getCurrencyCodeForDisplay(selectedCurrency);
    return `${symbol}${amount.toFixed(2)}`;
  };

  // Calculate totals
  const subtotal = watchItems.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    return sum + (quantity * unitPrice);
  }, 0);

  const taxAmount = subtotal * (Number(watchTaxRate) / 100);
  const total = subtotal + taxAmount;

  const handleSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    
    try {
      // Calculate totals from form data
      const items = data.items.map((item) => {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unit_price);
        const taxRate = Number(data.tax_rate);
        
        const amount = quantity * unitPrice;
        const taxAmount = amount * (taxRate / 100);
        const itemTotal = amount + taxAmount;
        
        return {
          description: item.description,
          quantity: quantity,
          unit_price: unitPrice,
          tax_rate: taxRate,
          amount: amount,
          tax_amount: taxAmount,
          total: itemTotal,
          asset_id: item.asset_id || null,
        };
      });

      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const tax_total = items.reduce((sum, item) => sum + item.tax_amount, 0);
      const total = subtotal + tax_total;

      const invoiceData: CreateInvoiceInput = {
        client_id: data.client_id,
        subject: data.subject || undefined,
        issue_date: data.issue_date,
        due_date: data.due_date,
        status: data.status,
        currency: data.currency,
        notes: data.notes || null,
        terms: data.terms || null,
        items,
        subtotal,
        tax_total,
        total,
      };

      await onSubmit(invoiceData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLineItem = () => {
    append({ description: '', quantity: 1, unit_price: 0, asset_id: null });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Client Selection Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Client Information
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select the client for this invoice
            </p>
          </div>

          <FormField
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                        {client.company && ` - ${client.company}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Monthly Service Invoice" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Invoice Details Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Invoice Details
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Invoice dates, status, and currency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="issue_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="BWP">BWP - Botswana Pula</SelectItem>
                      <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tax_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Rate (%) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="10"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Enter tax percentage (e.g., 10 for 10%)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Line Items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Line Items
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add items to this invoice
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLineItem}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Item {index + 1}
                  </span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name={`items.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Web Design Services" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.asset_id`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset (Optional)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === 'none' ? null : value)} 
                        value={field.value || 'none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an asset" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No asset</SelectItem>
                          {assets.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id}>
                              {asset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.unit_price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                              {currentCurrencySymbol}
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

                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <div className="h-10 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 flex items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatFormCurrency((Number(watchItems[index]?.quantity) || 0) * (Number(watchItems[index]?.unit_price) || 0))}
                      </span>
                    </div>
                  </FormItem>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Totals Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Invoice Summary
          </h3>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatFormCurrency(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Tax ({watchTaxRate}%):
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatFormCurrency(taxAmount)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg">
              <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
              <span className="font-bold text-primary-blue">
                {formatFormCurrency(total)}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Additional Information Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Additional Information
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Optional notes and payment terms
            </p>
          </div>

          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Terms</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Payment due within 30 days..."
                    className="resize-none"
                    rows={2}
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional notes for the client..."
                    className="resize-none"
                    rows={3}
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
            className="bg-primary-blue hover:bg-blue-700 min-w-[140px]"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Update Invoice' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

