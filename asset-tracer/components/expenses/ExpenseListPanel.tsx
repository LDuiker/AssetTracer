'use client';

import { Search, Plus, Filter, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrencyAmount } from '@/lib/utils/currency';
import type { Expense } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExpenseListPanelProps {
  expenses: Expense[];
  selectedExpense: Expense | null;
  onSelect: (expense: Expense) => void;
  onCreate: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
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
  maintenance: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  repair: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  supplies: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  utilities: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  insurance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  fuel: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export function ExpenseListPanel({
  expenses,
  selectedExpense,
  onSelect,
  onCreate,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
}: ExpenseListPanelProps) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Expenses
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
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
          <SelectTrigger className="w-full">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="repair">Repair</SelectItem>
            <SelectItem value="supplies">Supplies</SelectItem>
            <SelectItem value="utilities">Utilities</SelectItem>
            <SelectItem value="insurance">Insurance</SelectItem>
            <SelectItem value="fuel">Fuel</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Expense List */}
      <div className="flex-1 overflow-y-auto">
        {expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No expenses found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                onClick={() => onSelect(expense)}
                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedExpense?.id === expense.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
                    : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {expense.description}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {expense.vendor}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrencyAmount(expense.amount, expense.currency || 'USD')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={`${categoryColors[expense.category]} text-xs`}>
                      {categoryLabels[expense.category] || expense.category}
                    </Badge>
                    {expense.asset && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {expense.asset.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(expense.expense_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

