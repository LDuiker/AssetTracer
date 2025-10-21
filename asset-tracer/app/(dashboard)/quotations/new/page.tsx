'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuotationForm } from '@/components/quotations';
import { toast } from 'sonner';
import type { CreateQuotationInput } from '@/types';

export default function NewQuotationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle save quotation
   */
  const handleSave = async (data: CreateQuotationInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create quotation');
      }

      const { quotation } = await response.json();

      toast.success('Quotation created successfully');
      
      // Redirect back to quotations page and refresh
      router.push('/quotations');
      router.refresh(); // Force data refresh
    } catch (error) {
      console.error('Error creating quotation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create quotation');
      throw error; // Re-throw to keep form open
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    router.push('/quotations');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Sticky Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleCancel}
              size="sm"
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quotations
            </Button>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Quotation
            </h1>
          </div>
        </div>
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <QuotationForm
              quotation={null}
              onSubmit={handleSave}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

