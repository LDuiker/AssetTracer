'use client';

import { useState } from 'react';
import { Calendar, Clock, MapPin, Package, Edit, Trash2, X, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { ReservationFormDialog } from './ReservationFormDialog';
import type { Reservation } from '@/types/reservation';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

interface ReservationViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: Reservation;
  onUpdate: () => void;
  onDelete: () => void;
}

export function ReservationViewDialog({
  open,
  onOpenChange,
  reservation,
  onUpdate,
  onDelete,
}: ReservationViewDialogProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${reservation.title}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete reservation');
      }

      toast.success('Reservation deleted successfully');
      onDelete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete reservation');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPackingList = async () => {
    try {
      setIsDownloading(true);
      toast.loading('Generating packing list...');

      const response = await fetch(`/api/reservations/${reservation.id}/packing-list`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to generate packing list');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `packing-list-${reservation.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.dismiss();
      toast.success('Packing list downloaded successfully');
    } catch (error) {
      console.error('Error downloading packing list:', error);
      toast.dismiss();
      toast.error('Failed to download packing list');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <Dialog open={open && !isEditOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="flex items-center gap-2 mb-2">
                  {reservation.title}
                  <Badge className={statusColors[reservation.status]}>
                    {reservation.status}
                  </Badge>
                  {reservation.priority !== 'normal' && (
                    <Badge className={priorityColors[reservation.priority]} variant="outline">
                      {reservation.priority}
                    </Badge>
                  )}
                </DialogTitle>
                {reservation.project_name && (
                  <DialogDescription>Project: {reservation.project_name}</DialogDescription>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPackingList}
                  disabled={isDownloading || !reservation.assets || reservation.assets.length === 0}
                  title="Download packing list"
                >
                  <Download className="h-4 w-4 mr-1" />
                  {isDownloading ? 'Generating...' : 'Packing List'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Dates and Times */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Dates</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(reservation.start_date)} - {formatDate(reservation.end_date)}
                  </p>
                </div>
              </div>

              {(reservation.start_time || reservation.end_time) && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Times</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatTime(reservation.start_time) || 'Not set'} -{' '}
                      {formatTime(reservation.end_time) || 'Not set'}
                    </p>
                  </div>
                </div>
              )}

              {reservation.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Location</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {reservation.location}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Reserved Assets */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Reserved Assets ({reservation.assets?.length || 0})
                </h3>
              </div>
              {reservation.assets && reservation.assets.length > 0 ? (
                <div className="space-y-2">
                  {reservation.assets.map((reservationAsset) => (
                    <div
                      key={reservationAsset.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {reservationAsset.asset?.name || 'Unknown Asset'}
                        </p>
                        {reservationAsset.asset?.category && (
                          <p className="text-xs text-gray-500">
                            {reservationAsset.asset.category}
                            {reservationAsset.asset.location && ` • ${reservationAsset.asset.location}`}
                          </p>
                        )}
                      </div>
                      {reservationAsset.quantity > 1 && (
                        <Badge variant="outline">Qty: {reservationAsset.quantity}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No assets reserved</p>
              )}
            </div>

            {/* Description */}
            {reservation.description && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {reservation.description}
                  </p>
                </div>
              </>
            )}

            {/* Notes */}
            {reservation.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Notes
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{reservation.notes}</p>
                </div>
              </>
            )}

            {/* Reserved By */}
            {reservation.reserved_by_user && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Reserved By
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {reservation.reserved_by_user.name} ({reservation.reserved_by_user.email})
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <ReservationFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        reservation={reservation}
        onSuccess={() => {
          setIsEditOpen(false);
          onUpdate();
        }}
      />
    </>
  );
}

