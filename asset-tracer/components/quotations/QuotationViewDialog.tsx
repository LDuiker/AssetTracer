'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrencyAmount } from '@/lib/utils/currency';
import type { Quotation } from '@/types';

interface QuotationViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: Quotation | null;
  onEdit?: () => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-orange-100 text-orange-800',
};

export function QuotationViewDialog({
  open,
  onOpenChange,
  quotation,
  onEdit,
}: QuotationViewDialogProps) {
  if (!quotation) return null;

  const items = quotation.items || [];
  
  // Helper to format currency using the quotation's currency
  const formatCurrency = (amount: number) => formatCurrencyAmount(amount, quotation.currency);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">
                {quotation.quotation_number}
              </DialogTitle>
              <DialogDescription>
                Quotation details and line items
              </DialogDescription>
            </div>
            <Badge className={statusColors[quotation.status] || 'bg-gray-100 text-gray-800'}>
              {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Client Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <p className="text-sm">
                <span className="font-medium">Name:</span> {quotation.client?.name || 'N/A'}
              </p>
              {quotation.client?.company && (
                <p className="text-sm">
                  <span className="font-medium">Company:</span> {quotation.client.company}
                </p>
              )}
              {quotation.client?.email && (
                <p className="text-sm">
                  <span className="font-medium">Email:</span> {quotation.client.email}
                </p>
              )}
            </div>
          </div>

          {/* Quotation Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Quotation Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Issue Date</p>
                <p className="text-sm font-medium">
                  {new Date(quotation.issue_date).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Valid Until</p>
                <p className="text-sm font-medium">
                  {new Date(quotation.valid_until).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Currency</p>
                <p className="text-sm font-medium">{quotation.currency}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <p className="text-sm font-medium capitalize">{quotation.status}</p>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Line Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax %
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {item.tax_rate}%
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatCurrency(quotation.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax Total</span>
              <span className="font-medium">{formatCurrency(quotation.tax_total)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-gray-900">{formatCurrency(quotation.total)}</span>
            </div>
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{quotation.notes}</p>
              </div>
            </div>
          )}

          {/* Terms */}
          {quotation.terms && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Terms & Conditions</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{quotation.terms}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onEdit && (
            <Button onClick={onEdit}>
              Edit Quotation
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

