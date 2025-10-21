'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ClientForm } from './ClientForm';
import type { Client, CreateClientInput } from '@/types';

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onSave: (data: CreateClientInput) => Promise<void>;
}

/**
 * ClientDialog component - A controlled dialog for creating and editing clients
 */
export function ClientDialog({ open, onOpenChange, client, onSave }: ClientDialogProps) {
  const isEditMode = !!client;
  const dialogTitle = isEditMode ? 'Edit Client' : 'Create Client';
  const dialogDescription = isEditMode
    ? 'Make changes to the client details below.'
    : 'Add a new client to your organization.';

  const handleSubmit = async (data: CreateClientInput) => {
    try {
      await onSave(data);
      onOpenChange(false);
    } catch (error) {
      throw error;
    }
  };

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
        
        <ClientForm
          initialData={client}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}

