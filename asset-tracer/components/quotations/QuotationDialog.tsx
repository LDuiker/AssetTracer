'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { QuotationForm } from './QuotationForm';
import type { Quotation, CreateQuotationInput } from '@/types';

interface QuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation?: Quotation | null;
  onSave: (data: CreateQuotationInput) => Promise<void>;
}

export function QuotationDialog({
  open,
  onOpenChange,
  quotation,
  onSave,
}: QuotationDialogProps) {
  const handleSubmit = async (data: CreateQuotationInput) => {
    await onSave(data);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {quotation ? 'Edit Quotation' : 'Create Quotation'}
          </DialogTitle>
          <DialogDescription>
            {quotation
              ? 'Update the quotation details and line items below.'
              : 'Fill in the details below to create a new quotation for your client.'}
          </DialogDescription>
        </DialogHeader>
        <QuotationForm
          quotation={quotation}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}

