'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AssetForm } from '@/components/assets';
import { toast } from 'sonner';
import type { CreateAssetInput } from '@/types';

export default function NewAssetPage() {
  const router = useRouter();

  const handleSubmit = async (data: CreateAssetInput) => {
    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create asset');
      }

      const { asset } = await response.json();
      
      toast.success('Asset created successfully', {
        description: `${asset.name} has been added to your inventory.`,
      });

      // Redirect back to assets page and refresh
      router.push('/assets');
      router.refresh(); // Force data refresh
    } catch (error) {
      console.error('Error creating asset:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create asset');
      throw error; // Re-throw to let form handle it
    }
  };

  const handleCancel = () => {
    router.push('/assets');
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
              Back to Assets
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Asset
            </h1>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-5xl mx-auto">
          <AssetForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}

