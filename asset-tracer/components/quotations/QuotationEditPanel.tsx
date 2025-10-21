'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuotationForm } from './QuotationForm';
import type { Quotation, CreateQuotationInput } from '@/types';

interface QuotationEditPanelProps {
  quotation?: Quotation | null;
  onBack: () => void;
  onSave: (data: CreateQuotationInput) => Promise<void>;
}

export function QuotationEditPanel({
  quotation,
  onBack,
  onSave,
}: QuotationEditPanelProps) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {quotation?.id ? 'Edit Quotation' : 'Create Quotation'}
          </h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <QuotationForm
          quotation={quotation}
          onSubmit={onSave}
          onCancel={onBack}
        />
      </div>
    </div>
  );
}

