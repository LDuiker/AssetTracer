'use client';

import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrencyAmount } from '@/lib/utils/currency';
import type { Quotation } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface QuotationListPanelProps {
  quotations: Quotation[];
  selectedQuotation: Quotation | null;
  onSelect: (quotation: Quotation) => void;
  onCreate: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  expired: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

export function QuotationListPanel({
  quotations,
  selectedQuotation,
  onSelect,
  onCreate,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: QuotationListPanelProps) {

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quotations
          </h2>
          <Button
            onClick={onCreate}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search quotations..."
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
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="invoiced">Invoiced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quotation List */}
      <div className="flex-1 overflow-y-auto">
        {quotations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No quotations found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {quotations.map((quotation) => (
              <button
                key={quotation.id}
                onClick={() => onSelect(quotation)}
                className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  selectedQuotation?.id === quotation.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {quotation.quotation_number}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {quotation.client?.name}
                    </p>
                  </div>
                  <Badge className={`${statusColors[quotation.status]} text-xs ml-2 flex-shrink-0`}>
                    {quotation.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {new Date(quotation.issue_date).toLocaleDateString()}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrencyAmount(quotation.total, quotation.currency)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer with count */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
        {quotations.length} quotation{quotations.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

