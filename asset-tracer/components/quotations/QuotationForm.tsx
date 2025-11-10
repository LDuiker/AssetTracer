'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
import { Loader2, Plus, Trash2, FileText, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { Quotation, Client, CreateQuotationInput, Asset } from '@/types';

const quotationItemSchema = z.object({
  asset_id: z.string().optional(), // Optional link to an asset
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  unit_price: z.coerce.number().min(0, 'Unit price must be non-negative'),
  tax_rate: z.coerce.number().min(0).max(100, 'Tax rate must be between 0 and 100'),
});

const quotationFormSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  subject: z.string().optional(),
  issue_date: z.string().min(1, 'Issue date is required'),
  valid_until: z.string().min(1, 'Valid until date is required'),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']),
  currency: z.string().min(1, 'Currency is required'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(quotationItemSchema).min(1, 'At least one item is required'),
});

type QuotationFormValues = z.infer<typeof quotationFormSchema>;

interface QuotationFormProps {
  quotation?: Quotation | null;
  onSubmit: (data: CreateQuotationInput) => void;
  onCancel: () => void;
}

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export function QuotationForm({ quotation, onSubmit, onCancel }: QuotationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch clients for dropdown
  const { data: clientsData } = useSWR<{ clients: Client[] }>('/api/clients', fetcher);
  const clients = clientsData?.clients || [];

  // Fetch assets for dropdown
  const { data: assetsData } = useSWR<{ assets: Asset[] }>('/api/assets', fetcher);
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

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      client_id: quotation?.client_id || '',
      subject: quotation?.subject || '',
      issue_date: quotation?.issue_date
        ? new Date(quotation.issue_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      valid_until: quotation?.valid_until
        ? new Date(quotation.valid_until).toISOString().split('T')[0]
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      status: quotation?.status || 'draft',
      currency: quotation?.currency || defaultCurrency,
      notes: quotation?.notes || orgData?.organization?.default_notes || '',
      terms: quotation?.terms || orgData?.organization?.quotation_terms || '',
      items: quotation?.items || [
        { asset_id: undefined, description: '', quantity: 1, unit_price: 0, tax_rate: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Update form when quotation changes
  useEffect(() => {
    if (quotation) {
      form.reset({
        client_id: quotation.client_id,
        subject: quotation.subject || '',
        issue_date: new Date(quotation.issue_date).toISOString().split('T')[0],
        valid_until: new Date(quotation.valid_until).toISOString().split('T')[0],
        status: quotation.status,
        currency: quotation.currency,
        notes: quotation.notes || '',
        terms: quotation.terms || '',
        items: quotation.items || [{ description: '', quantity: 1, unit_price: 0, tax_rate: 0 }],
      });
    }
  }, [quotation, form]);

  // Update default notes and terms when orgData loads (only for new quotations)
  useEffect(() => {
    if (!quotation && orgData?.organization) {
      const currentValues = form.getValues();
      // Only update if the fields are still empty (haven't been edited by user)
      if (!currentValues.notes && orgData.organization.default_notes) {
        form.setValue('notes', orgData.organization.default_notes);
      }
      if (!currentValues.terms && orgData.organization.quotation_terms) {
        form.setValue('terms', orgData.organization.quotation_terms);
      }
    }
  }, [orgData, quotation, form]);

  const handleSubmit = async (data: QuotationFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data as CreateQuotationInput);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate totals
  const watchItems = form.watch('items');
  const watchCurrency = form.watch('currency');

  // Get current currency symbol
  const currentCurrencySymbol = getCurrencySymbolForCode(watchCurrency || defaultCurrency);

  // Format currency based on the form's selected currency (not global context)
  const formatFormCurrency = (amount: number): string => {
    const selectedCurrency = watchCurrency || defaultCurrency;
    const symbol = getCurrencyCodeForDisplay(selectedCurrency);
    return `${symbol}${amount.toFixed(2)}`;
  };

  const subtotal = watchItems.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unit_price || 0);
  }, 0);
  const taxTotal = watchItems.reduce((sum, item) => {
    const itemAmount = (item.quantity || 0) * (item.unit_price || 0);
    return sum + (itemAmount * (item.tax_rate || 0)) / 100;
  }, 0);
  const total = subtotal + taxTotal;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Client Selection */}
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
                      {client.name} {client.company && `(${client.company})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Subject */}
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Website Redesign Project" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dates and Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            name="valid_until"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valid Until *</FormLabel>
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
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Currency */}
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

        {/* Line Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <FormLabel className="text-base">Line Items *</FormLabel>
              <p className="text-sm text-gray-500 mt-1">Link assets or add custom items</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ asset_id: undefined, description: '', quantity: 1, unit_price: 0, tax_rate: 0 })}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {fields.map((field, index) => {
            const currentItem = watchItems[index];
            const selectedAsset = currentItem?.asset_id 
              ? assets.find(a => a.id === currentItem.asset_id) 
              : null;
            
            const lineTotal = (currentItem?.quantity || 0) * (currentItem?.unit_price || 0);
            const assetCost = selectedAsset ? selectedAsset.purchase_cost * (currentItem?.quantity || 1) : 0;
            const profit = lineTotal - assetCost;
            const profitMargin = lineTotal > 0 ? (profit / lineTotal) * 100 : 0;

            return (
              <Card key={field.id} className="rounded-xl shadow-sm border-gray-200">
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Item {index + 1}</h4>
                        {selectedAsset && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Linked Asset
                          </Badge>
                        )}
                      </div>
                    </div>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Asset Selection */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.asset_id`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link Asset (Optional)</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            // Handle "none" as undefined/empty
                            const actualValue = value === 'none' ? undefined : value;
                            field.onChange(actualValue);
                            // Auto-fill description and unit price from asset
                            if (value !== 'none') {
                              const asset = assets.find(a => a.id === value);
                              if (asset) {
                                form.setValue(`items.${index}.description`, asset.name);
                                form.setValue(`items.${index}.unit_price`, asset.current_value || asset.purchase_cost);
                              }
                            }
                          }} 
                          value={field.value || 'none'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an asset (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Asset</SelectItem>
                            {assets.map((asset) => (
                              <SelectItem key={asset.id} value={asset.id}>
                                {asset.name} - {formatFormCurrency(asset.current_value || asset.purchase_cost)}
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
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Item description" rows={2} />
                        </FormControl>
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
                            <Input type="number" step="1" min="1" {...field} />
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

                    <FormField
                      control={form.control}
                      name={`items.${index}.tax_rate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Rate (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" max="100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Line Summary */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Line Total:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatFormCurrency(lineTotal)}
                      </span>
                    </div>
                    {selectedAsset && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Asset Cost:</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {formatFormCurrency(assetCost)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Profit:
                          </span>
                          <span className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatFormCurrency(profit)} ({profitMargin.toFixed(1)}%)
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Totals Display */}
        <Card className="rounded-xl shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border-blue-200">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Quote Summary</h3>
            </div>
            
            {/* Financial Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatFormCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatFormCurrency(taxTotal)}</span>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between text-xl font-bold pt-2">
              <span className="text-gray-900 dark:text-white">Total:</span>
              <span className="text-blue-600 dark:text-blue-400">{formatFormCurrency(total)}</span>
            </div>

            {/* Profitability Summary */}
            {(() => {
              // Calculate total costs and profit
              let totalAssetCost = 0;
              let itemsWithAssets = 0;

              watchItems.forEach((item) => {
                if (item?.asset_id) {
                  const asset = assets.find(a => a.id === item.asset_id);
                  if (asset) {
                    totalAssetCost += asset.purchase_cost * (item.quantity || 1);
                    itemsWithAssets++;
                  }
                }
              });

              const totalProfit = subtotal - totalAssetCost;
              const profitMargin = subtotal > 0 ? (totalProfit / subtotal) * 100 : 0;

              // Only show if there are linked assets
              if (itemsWithAssets > 0) {
                return (
                  <>
                    <Separator className="my-3" />
                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Profitability</h4>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Asset Costs:</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {formatFormCurrency(totalAssetCost)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Estimated Profit:</span>
                        <div className="text-right">
                          <div className={`font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatFormCurrency(totalProfit)}
                          </div>
                          <div className={`text-xs ${profitMargin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {profitMargin.toFixed(1)}% margin
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        💡 Based on {itemsWithAssets} linked asset{itemsWithAssets !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </>
                );
              }
              return null;
            })()}
          </CardContent>
        </Card>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Additional notes..." rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Terms */}
        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Terms & Conditions</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Payment terms and conditions..." rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          
          <div className="flex gap-3">
            {quotation && quotation.status === 'accepted' && (
              <Button 
                type="button" 
                variant="outline"
                className="bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200"
                disabled={isSubmitting}
                onClick={() => {
                  // TODO: Implement Convert to Invoice
                  alert('Convert to Invoice feature coming soon!');
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Convert to Invoice
              </Button>
            )}
            
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 min-w-[140px]"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {quotation ? 'Update Quote' : 'Create Quote'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

