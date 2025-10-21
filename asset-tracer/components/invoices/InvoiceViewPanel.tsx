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
import type { Invoice } from '@/types';

interface InvoiceViewPanelProps {
  invoice: Invoice;
  onBack: () => void;
  onEdit: () => void;
  onClone?: () => void;
  onDelete: () => void;
  onStatusChange?: (invoiceId: string, newStatus: string) => void;
  onDownloadPDF?: () => void;
  onMarkAsPaid?: () => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-orange-100 text-orange-800',
};

const statusOptions = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'sent', label: 'Sent', color: 'bg-blue-100 text-blue-800' },
  { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' },
  { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-orange-100 text-orange-800' },
];

export function InvoiceViewPanel({
  invoice,
  onBack,
  onEdit,
  onClone,
  onDelete,
  onStatusChange,
  onDownloadPDF,
  onMarkAsPaid,
}: InvoiceViewPanelProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const items = invoice.items || [];
  
  // Helper to format currency using the invoice's currency
  const formatCurrency = (amount: number) => formatCurrencyAmount(amount, invoice.currency);

  const handleStatusChange = async (newStatus: string) => {
    if (!onStatusChange) {
      toast.error('Status change not implemented');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await onStatusChange(invoice.id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Check if invoice is paid
  const isPaid = invoice.status === 'paid';

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
            {onDownloadPDF && (
              <Button variant="outline" size="sm" onClick={onDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            )}
            {onClone && (
              <Button variant="outline" size="sm" onClick={onClone}>
                <Copy className="h-4 w-4 mr-2" />
                Clone
              </Button>
            )}
            {onMarkAsPaid && !isPaid && (
              <Button variant="outline" size="sm" onClick={onMarkAsPaid} className="text-green-600 border-green-200 hover:bg-green-50">
                <FileText className="h-4 w-4 mr-2" />
                Mark as Paid
              </Button>
            )}
            {/* Disable Edit and Delete for paid invoices */}
            {!isPaid && (
              <>
                <Button variant="default" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {invoice.invoice_number}
            </h1>
            {invoice.subject && (
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
                {invoice.subject}
              </p>
            )}
            <p className="text-gray-600 dark:text-gray-400">
              Issued to {invoice.client?.name}
            </p>
          </div>
          
          {/* Status Badge with Dropdown */}
          {isPaid ? (
            // Non-editable status badge for paid invoices
            <div
              className={`${statusColors[invoice.status]} text-sm px-3 py-1 rounded-full font-medium inline-flex items-center gap-2 cursor-not-allowed`}
              title="Status cannot be changed for paid invoices"
            >
              {invoice.status.toUpperCase()}
            </div>
          ) : (
            // Editable status dropdown for non-paid invoices
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`${statusColors[invoice.status]} text-sm px-3 py-1 rounded-full font-medium inline-flex items-center gap-2 hover:opacity-80 transition-opacity`}
                  disabled={isUpdatingStatus}
                >
                  {invoice.status.toUpperCase()}
                  <MoreVertical className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statusOptions
                  .filter(option => option.value !== 'paid') // Prevent manual selection of 'paid' status
                  .map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleStatusChange(option.value)}
                      disabled={option.value === invoice.status || isUpdatingStatus}
                      className={option.value === invoice.status ? 'bg-gray-100 dark:bg-gray-700' : ''}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${option.color.split(' ')[0]}`} />
                        <span>{option.label}</span>
                        {option.value === invoice.status && (
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
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Due Date</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date(invoice.due_date).toLocaleDateString()}
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(invoice.paid_amount || 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Balance</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(invoice.balance || invoice.total)}
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
                  {invoice.client?.name || 'Unknown Client'}
                </span>
              </div>
              {invoice.client?.company && (
                <div className="flex items-center">
                  <Building2 className="mr-2 h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {invoice.client.company}
                  </span>
                </div>
              )}
              {invoice.client?.email && (
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {invoice.client.email}
                  </span>
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  Issue Date: {new Date(invoice.issue_date).toLocaleDateString()}
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
                    {formatCurrency(invoice.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(invoice.tax_total)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
                {invoice.paid_amount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Paid:</span>
                      <span className="font-semibold">
                        -{formatCurrency(invoice.paid_amount)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-900 dark:text-white">Balance Due:</span>
                      <span className="text-red-600 dark:text-red-400">
                        {formatCurrency(invoice.balance || 0)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes and Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="grid grid-cols-2 gap-6">
            {invoice.notes && (
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Notes</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {invoice.notes}
                  </p>
                </CardContent>
              </Card>
            )}
            {invoice.terms && (
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Terms & Conditions
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {invoice.terms}
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

