'use client';

import { ArrowLeft, Edit, Download, Trash2, Building2, Calendar, FileText, DollarSign, Tag, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrencyAmount } from '@/lib/utils/currency';
import type { Expense } from '@/types';

interface ExpenseViewPanelProps {
  expense: Expense;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const categoryLabels: Record<string, string> = {
  maintenance: 'Maintenance',
  repair: 'Repair',
  supplies: 'Supplies',
  utilities: 'Utilities',
  insurance: 'Insurance',
  fuel: 'Fuel',
  other: 'Other',
};

const categoryColors: Record<string, string> = {
  maintenance: 'bg-blue-100 text-blue-800',
  repair: 'bg-red-100 text-red-800',
  supplies: 'bg-purple-100 text-purple-800',
  utilities: 'bg-green-100 text-green-800',
  insurance: 'bg-yellow-100 text-yellow-800',
  fuel: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800',
};

const paymentMethodLabels: Record<string, string> = {
  cash: 'Cash',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  bank_transfer: 'Bank Transfer',
  check: 'Check',
  other: 'Other',
};

export function ExpenseViewPanel({
  expense,
  onBack,
  onEdit,
  onDelete,
}: ExpenseViewPanelProps) {
  const formatCurrency = (amount: number) => formatCurrencyAmount(amount, expense.currency || 'USD');

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
            {expense.receipt_url && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(expense.receipt_url, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Receipt
              </Button>
            )}
            <Button variant="default" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDelete} 
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {expense.description}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Paid to {expense.vendor}
            </p>
          </div>

          {/* Category and Status Badges */}
          <div className="flex flex-col items-end gap-2">
            <Badge className={`${categoryColors[expense.category]} text-sm px-3 py-1`}>
              {categoryLabels[expense.category] || expense.category}
            </Badge>
            {expense.status && (
              <Badge className={`${statusColors[expense.status]} text-sm px-3 py-1`}>
                {expense.status.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Amount Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Amount
                </p>
                <div className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="h-8 w-8 text-gray-400" />
                  {formatCurrency(expense.amount)}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Expense Date
                </p>
                <div className="flex items-center text-gray-900 dark:text-white">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(expense.expense_date).toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Expense Details
            </h3>

            <div className="space-y-4">
              {/* Vendor */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Vendor
                </p>
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                  <p className="font-medium text-gray-900 dark:text-white">
                    {expense.vendor}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Category */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Category
                </p>
                <Badge className={`${categoryColors[expense.category]}`}>
                  {categoryLabels[expense.category] || expense.category}
                </Badge>
              </div>

              {expense.asset && (
                <>
                  <Separator />
                  {/* Linked Asset */}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Linked Asset
                    </p>
                    <div className="flex items-center">
                      <Link2 className="h-4 w-4 mr-2 text-gray-400" />
                      <p className="font-medium text-gray-900 dark:text-white">
                        {expense.asset.name}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {expense.reference_number && (
                <>
                  <Separator />
                  {/* Reference Number */}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Reference Number
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {expense.reference_number}
                    </p>
                  </div>
                </>
              )}

              {expense.payment_method && (
                <>
                  <Separator />
                  {/* Payment Method */}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Payment Method
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {paymentMethodLabels[expense.payment_method] || expense.payment_method}
                    </p>
                  </div>
                </>
              )}

              {expense.is_tax_deductible && (
                <>
                  <Separator />
                  {/* Tax Deductible */}
                  <div>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Tax Deductible
                    </Badge>
                  </div>
                </>
              )}

              {expense.tags && expense.tags.length > 0 && (
                <>
                  <Separator />
                  {/* Tags */}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {expense.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {expense.notes && (
                <>
                  <Separator />
                  {/* Notes */}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Notes
                    </p>
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {expense.notes}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
              Record Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(expense.created_at).toLocaleString()}
                </span>
              </div>
              {expense.updated_at && expense.updated_at !== expense.created_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(expense.updated_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

