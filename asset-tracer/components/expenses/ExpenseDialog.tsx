'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExpenseForm } from './ExpenseForm';
import type { Expense, CreateExpenseInput } from '@/types';

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
  onSave: (data: CreateExpenseInput) => Promise<void>;
}

export function ExpenseDialog({
  open,
  onOpenChange,
  expense,
  onSave,
}: ExpenseDialogProps) {
  const handleSubmit = async (data: CreateExpenseInput) => {
    await onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {expense ? 'Edit Expense' : 'Create New Expense'}
          </DialogTitle>
          <DialogDescription>
            {expense
              ? 'Update the expense details below.'
              : 'Fill in the details to create a new expense record.'}
          </DialogDescription>
        </DialogHeader>
        <ExpenseForm
          expense={expense}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

