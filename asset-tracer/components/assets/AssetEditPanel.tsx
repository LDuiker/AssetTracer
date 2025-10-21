'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AssetForm } from './AssetForm';
import type { Asset, CreateAssetInput } from '@/types';

interface AssetEditPanelProps {
  asset: Asset;
  onBack: () => void;
  onSave: (data: CreateAssetInput) => Promise<void>;
}

export function AssetEditPanel({
  asset,
  onBack,
  onSave,
}: AssetEditPanelProps) {
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Edit Asset
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {asset.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AssetForm
          initialData={asset}
          onSubmit={onSave}
          onCancel={onBack}
        />
      </div>
    </div>
  );
}

