'use client';

import { MoreHorizontal, Edit, Trash2, FileText } from 'lucide-react';
import { Expense } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/lib/context/CurrencyContext';

interface ExpenseTableProps {
  expenses: Expense[];
  isLoading?: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
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

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  approved: 'bg-green-100 text-green-800 hover:bg-green-100',
  rejected: 'bg-red-100 text-red-800 hover:bg-red-100',
  paid: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
};

export function ExpenseTable({
  expenses,
  isLoading,
  onEdit,
  onDelete,
}: ExpenseTableProps) {
  const { formatCurrency: formatCurrencyGlobal } = useCurrency();
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">No expenses found</h3>
        <p className="mt-2 text-sm text-gray-500">
          Get started by creating your first expense.
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Use global currency formatter from context (ignore expense currency for now)
  const formatCurrency = (amount: number) => formatCurrencyGlobal(amount);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Linked Asset</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  {formatDate(expense.expense_date)}
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px]">
                    <div className="font-medium truncate">{expense.description}</div>
                    {expense.reference_number && (
                      <div className="text-xs text-gray-500">
                        Ref: {expense.reference_number}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {categoryLabels[expense.category] || expense.category}
                  </Badge>
                </TableCell>
                <TableCell>{expense.vendor}</TableCell>
                <TableCell>
                  {expense.asset ? (
                    <div className="text-sm">
                      <div className="font-medium">{expense.asset.name}</div>
                      <div className="text-xs text-gray-500">
                        {expense.asset.category}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[expense.status]}>
                    {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(expense.amount)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(expense)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      {expense.receipt_url && (
                        <DropdownMenuItem
                          onClick={() => window.open(expense.receipt_url!, '_blank')}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Receipt
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(expense)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

