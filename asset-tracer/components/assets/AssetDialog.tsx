'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AssetForm } from './AssetForm';
import type { Asset, CreateAssetInput } from '@/types';

interface AssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset | null;
  onSave: (data: CreateAssetInput) => Promise<void>;
  isCloning?: boolean;
}

/**
 * AssetDialog component - A controlled dialog for creating and editing assets
 * Wraps AssetForm inside a Dialog component
 */
export function AssetDialog({ open, onOpenChange, asset, onSave, isCloning = false }: AssetDialogProps) {
  const isEditMode = !!asset && !isCloning;
  const dialogTitle = isCloning 
    ? 'Clone Asset' 
    : isEditMode 
      ? 'Edit Asset' 
      : 'Create Asset';
  const dialogDescription = isCloning
    ? 'Create a copy of this asset with all details pre-filled.'
    : isEditMode
      ? 'Make changes to the asset details below.'
      : 'Add a new asset to your inventory.';

  /**
   * Handle form submission
   * Calls the onSave callback and closes dialog on success
   */
  const handleSubmit = async (data: CreateAssetInput) => {
    try {
      await onSave(data);
      // Close dialog after successful save
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the parent component
      throw error;
    }
  };

  /**
   * Handle cancel action
   * Closes the dialog without saving
   */
  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        
        <AssetForm
          initialData={asset}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isCloning={isCloning}
        />
      </DialogContent>
    </Dialog>
  );
}

