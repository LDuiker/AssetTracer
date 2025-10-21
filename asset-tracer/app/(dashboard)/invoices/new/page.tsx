'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceForm } from '@/components/invoices';
import { toast } from 'sonner';
import type { CreateInvoiceInput } from '@/types';

export default function NewInvoicePage() {
  const router = useRouter();

  const handleSubmit = async (data: CreateInvoiceInput) => {
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create invoice');
      }

      const { invoice } = await response.json();
      
      toast.success('Invoice created successfully', {
        description: `Invoice ${invoice.invoice_number} has been created.`,
      });

      // Redirect back to invoices page and refresh
      router.push('/invoices');
      router.refresh(); // Force data refresh
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create invoice');
      throw error; // Re-throw to let form handle it
    }
  };

  const handleCancel = () => {
    router.push('/invoices');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Sticky Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Invoice
            </h1>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-5xl mx-auto">
          <InvoiceForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}

