'use client';

import { useState } from 'react';
import { ArrowLeft, Edit, Copy, Download, FileText, Trash2, Building2, User, Mail, Calendar, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { formatCurrencyAmount } from '@/lib/utils/currency';
import { toast } from 'sonner';
import type { Quotation } from '@/types';

interface QuotationViewPanelProps {
  quotation: Quotation;
  onBack: () => void;
  onEdit: () => void;
  onClone: () => void;
  onConvertToInvoice?: () => void;
  onDownloadPDF?: () => void;
  onDelete: () => void;
  onStatusChange?: (quotationId: string, newStatus: string) => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-orange-100 text-orange-800',
  invoiced: 'bg-purple-100 text-purple-800',
};

const statusOptions = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'sent', label: 'Sent', color: 'bg-blue-100 text-blue-800' },
  { value: 'accepted', label: 'Accepted', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'expired', label: 'Expired', color: 'bg-orange-100 text-orange-800' },
  { value: 'invoiced', label: 'Invoiced', color: 'bg-purple-100 text-purple-800' },
];

export function QuotationViewPanel({
  quotation,
  onBack,
  onEdit,
  onClone,
  onConvertToInvoice,
  onDownloadPDF,
  onDelete,
  onStatusChange,
}: QuotationViewPanelProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const items = quotation.items || [];
  
  // Helper to format currency using the quotation's currency
  const formatCurrency = (amount: number) => formatCurrencyAmount(amount, quotation.currency);

  const handleStatusChange = async (newStatus: string) => {
    if (!onStatusChange) {
      toast.error('Status change not implemented');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await onStatusChange(quotation.id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={onBack} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClone}>
              <Copy className="h-4 w-4 mr-2" />
              Clone
            </Button>
            {onDownloadPDF && (
              <Button variant="outline" size="sm" onClick={onDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            )}
            {onConvertToInvoice && quotation.status === 'accepted' && !quotation.converted_to_invoice_id && (
              <Button variant="outline" size="sm" onClick={onConvertToInvoice} className="text-purple-600 border-purple-200 hover:bg-purple-50">
                <FileText className="h-4 w-4 mr-2" />
                Convert to Invoice
              </Button>
            )}
            {quotation.converted_to_invoice_id && (
              <Badge className="bg-purple-100 text-purple-800 px-3 py-1">
                <FileText className="h-3 w-3 mr-1" />
                Converted to Invoice
              </Badge>
            )}
            {/* Disable Edit for invoiced quotations, but allow Delete */}
            {!(quotation.status === 'invoiced' || quotation.converted_to_invoice_id) && (
              <Button variant="default" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {/* Always show Delete button */}
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {quotation.quotation_number}
            </h1>
            {quotation.subject && (
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
                {quotation.subject}
              </p>
            )}
            <p className="text-gray-600 dark:text-gray-400">
              Issued to {quotation.client?.name}
            </p>
          </div>
          
          {/* Status Badge with Dropdown */}
          {quotation.status === 'invoiced' || quotation.converted_to_invoice_id ? (
            // Non-editable status badge for invoiced quotations
            <div
              className={`${statusColors[quotation.status]} text-sm px-3 py-1 rounded-full font-medium inline-flex items-center gap-2 cursor-not-allowed`}
              title="Status cannot be changed for invoiced quotations"
            >
              {quotation.status.toUpperCase()}
            </div>
          ) : (
            // Editable status dropdown for non-invoiced quotations
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`${statusColors[quotation.status]} text-sm px-3 py-1 rounded-full font-medium inline-flex items-center gap-2 hover:opacity-80 transition-opacity`}
                  disabled={isUpdatingStatus}
                >
                  {quotation.status.toUpperCase()}
                  <MoreVertical className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statusOptions
                  .filter(option => option.value !== 'invoiced') // Prevent manual selection of 'invoiced' status
                  .map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleStatusChange(option.value)}
                      disabled={option.value === quotation.status || isUpdatingStatus}
                      className={option.value === quotation.status ? 'bg-gray-100 dark:bg-gray-700' : ''}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${option.color.split(' ')[0]}`} />
                        <span>{option.label}</span>
                        {option.value === quotation.status && (
                          <span className="ml-auto text-xs text-gray-500">(Current)</span>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Valid Until</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date(quotation.valid_until).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Items</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {items.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(quotation.total)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Client Details */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Client Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  {quotation.client?.name}
                </span>
              </div>
              {quotation.client?.company && (
                <div className="flex items-center">
                  <Building2 className="mr-2 h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {quotation.client.company}
                  </span>
                </div>
              )}
              {quotation.client?.email && (
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {quotation.client.email}
                  </span>
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  Issue Date: {new Date(quotation.issue_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Line Items
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tax (%)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {item.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                        {item.tax_rate}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(quotation.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(quotation.tax_total)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {formatCurrency(quotation.total)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes and Terms */}
        {(quotation.notes || quotation.terms) && (
          <div className="grid grid-cols-2 gap-6">
            {quotation.notes && (
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Notes</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {quotation.notes}
                  </p>
                </CardContent>
              </Card>
            )}
            {quotation.terms && (
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Terms & Conditions
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {quotation.terms}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

