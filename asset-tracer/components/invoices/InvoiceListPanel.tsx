'use client';

import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrencyAmount } from '@/lib/utils/currency';
import type { Invoice } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InvoiceListPanelProps {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  onSelect: (invoice: Invoice) => void;
  onCreate: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  disabled?: boolean;
  currentCount?: number;
  maxCount?: number;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export function InvoiceListPanel({
  invoices,
  selectedInvoice,
  onSelect,
  onCreate,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  disabled = false,
  currentCount,
  maxCount,
}: InvoiceListPanelProps) {

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Invoices
          </h2>
          <Button
            onClick={onCreate}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-1" />
            New
            {maxCount !== undefined && maxCount !== Infinity && (
              <span className="ml-2 text-xs opacity-75">
                ({currentCount ?? 0}/{maxCount})
              </span>
            )}
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice List */}
      <div className="flex-1 overflow-y-auto">
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No invoices found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {invoices.map((invoice) => (
              <button
                key={invoice.id}
                onClick={() => onSelect(invoice)}
                className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  selectedInvoice?.id === invoice.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {invoice.invoice_number}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {invoice.client?.name}
                    </p>
                  </div>
                  <Badge className={`${statusColors[invoice.status]} text-xs ml-2 flex-shrink-0`}>
                    {invoice.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {new Date(invoice.issue_date).toLocaleDateString()}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrencyAmount(invoice.total, invoice.currency)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer with count */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
        {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

