'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Plus, Search, Filter, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ExpenseTable, ExpenseDialog } from '@/components/expenses';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { toast } from 'sonner';
import type { Expense, CreateExpenseInput } from '@/types';

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch');
  }
  return res.json();
};

export default function ExpensesPage() {
  const { formatCurrency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [assetFilter, setAssetFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Fetch expenses
  const { data: expenses = [], error, mutate, isLoading } = useSWR<Expense[]>(
    '/api/expenses',
    fetcher
  );

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        expense.description.toLowerCase().includes(searchLower) ||
        expense.vendor.toLowerCase().includes(searchLower) ||
        (expense.reference_number &&
          expense.reference_number.toLowerCase().includes(searchLower)) ||
        (expense.notes && expense.notes.toLowerCase().includes(searchLower));

      // Category filter
      const matchesCategory =
        categoryFilter === 'all' || expense.category === categoryFilter;

      // Asset filter
      const matchesAsset =
        assetFilter === 'all' ||
        (assetFilter === 'unlinked' && !expense.asset_id) ||
        expense.asset_id === assetFilter;

      // Date range filter
      const expenseDate = new Date(expense.expense_date);
      const matchesStartDate = !startDate || expenseDate >= new Date(startDate);
      const matchesEndDate = !endDate || expenseDate <= new Date(endDate);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAsset &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [expenses, searchQuery, categoryFilter, assetFilter, startDate, endDate]);

  // Get unique assets for filter dropdown
  const uniqueAssets = useMemo(() => {
    const assetMap = new Map();
    expenses.forEach((expense) => {
      if (expense.asset && !assetMap.has(expense.asset.id)) {
        assetMap.set(expense.asset.id, expense.asset);
      }
    });
    return Array.from(assetMap.values());
  }, [expenses]);

  // Calculate total expenses
  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);

  // Handle create expense
  const handleCreate = () => {
    setSelectedExpense(null);
    setDialogOpen(true);
  };

  // Handle edit expense
  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setDialogOpen(true);
  };

  // Handle delete expense
  const handleDelete = async (expense: Expense) => {
    if (!confirm(`Are you sure you want to delete this expense?\n\n"${expense.description}"`)) {
      return;
    }

    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete expense');
      }

      // Optimistically update the UI
      await mutate(
        expenses.filter((e) => e.id !== expense.id),
        false
      );

      toast.success('Expense deleted successfully');

      // Revalidate in the background
      mutate();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete expense'
      );
      mutate(); // Revalidate to restore correct state
    }
  };

  // Handle save expense (create or update)
  const handleSave = async (data: CreateExpenseInput) => {
    try {
      const isEditing = !!selectedExpense;
      const url = isEditing
        ? `/api/expenses/${selectedExpense.id}`
        : '/api/expenses';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${isEditing ? 'update' : 'create'} expense`);
      }

      const savedExpense = await response.json();

      // Optimistically update the UI
      if (isEditing) {
        await mutate(
          expenses.map((e) => (e.id === savedExpense.id ? savedExpense : e)),
          false
        );
        toast.success('Expense updated successfully');
      } else {
        await mutate([savedExpense, ...expenses], false);
        toast.success('Expense created successfully');
      }

      // Revalidate in the background
      mutate();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save expense'
      );
      throw error;
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setAssetFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters =
    searchQuery || categoryFilter !== 'all' || assetFilter !== 'all' || startDate || endDate;

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error loading expenses</h3>
          <p className="text-red-600 text-sm mt-1">
            {error.message || 'Failed to load expenses. Please try again.'}
          </p>
          <Button
            onClick={() => mutate()}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your business expenses
          </p>
        </div>
        <Button onClick={handleCreate} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Create Expense
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        {/* Search and Category Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Category" />
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

          <Select value={assetFilter} onValueChange={setAssetFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Asset" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assets</SelectItem>
              <SelectItem value="unlinked">No Asset</SelectItem>
              {uniqueAssets.map((asset) => (
                <SelectItem key={asset.id} value={asset.id}>
                  {asset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="date"
              placeholder="Start date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="date"
              placeholder="End date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-10"
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full md:w-auto"
            >
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
          <span className="text-sm text-gray-600">
            Showing {filteredExpenses.length} of {expenses.length} expenses
          </span>
          <span className="text-sm font-semibold text-gray-900">
            Total: {formatCurrency(totalExpenses)}
          </span>
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchQuery}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setSearchQuery('')}
              />
            </Badge>
          )}
          {categoryFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Category: {categoryFilter}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setCategoryFilter('all')}
              />
            </Badge>
          )}
          {assetFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {assetFilter === 'unlinked' ? 'No Asset' : 'Asset Filter'}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setAssetFilter('all')}
              />
            </Badge>
          )}
          {(startDate || endDate) && (
            <Badge variant="secondary" className="gap-1">
              Date Range
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
              />
            </Badge>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <ExpenseTable
        expenses={filteredExpenses}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Expense Dialog */}
      <ExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        expense={selectedExpense}
        onSave={handleSave}
      />
    </div>
  );
}

