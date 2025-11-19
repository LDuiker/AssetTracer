'use client';

import { useState } from 'react';
import { Calendar, Clock, MapPin, Package, Edit, Trash2, Download, User, FileText } from 'lucide-react';
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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  // Group assets by category
  const assetsByCategory = (reservation.assets || []).reduce(
    (acc, reservationAsset) => {
      const category = reservationAsset.asset?.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(reservationAsset);
      return acc;
    },
    {} as Record<string, typeof reservation.assets>
  );

  const sortedCategories = Object.keys(assetsByCategory).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return a.localeCompare(b);
  });

  return (
    <>
      <Dialog open={open && !isEditOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <DialogTitle className="text-2xl font-semibold truncate">
                    {reservation.title}
                  </DialogTitle>
                  <Badge className={statusColors[reservation.status]}>
                    {reservation.status}
                  </Badge>
                  {reservation.priority !== 'normal' && (
                    <Badge className={priorityColors[reservation.priority]} variant="outline">
                      {reservation.priority}
                    </Badge>
                  )}
                </div>
                {reservation.project_name && (
                  <DialogDescription className="text-base">
                    {reservation.project_name}
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Key Information Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>Start Date</span>
                </div>
                <p className="text-sm font-medium">
                  {formatDate(reservation.start_date)}
                  {reservation.start_time && (
                    <span className="text-gray-500 ml-1">
                      {formatTime(reservation.start_time)}
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>End Date</span>
                </div>
                <p className="text-sm font-medium">
                  {formatDate(reservation.end_date)}
                  {reservation.end_time && (
                    <span className="text-gray-500 ml-1">
                      {formatTime(reservation.end_time)}
                    </span>
                  )}
                </p>
              </div>

              {reservation.location && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span>Location</span>
                  </div>
                  <p className="text-sm font-medium">{reservation.location}</p>
                </div>
              )}

              {reservation.reserved_by_user && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <User className="h-4 w-4" />
                    <span>Reserved By</span>
                  </div>
                  <p className="text-sm font-medium">{reservation.reserved_by_user.name}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Equipment List */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold">
                  Equipment ({reservation.assets?.length || 0})
                </h3>
              </div>

              {reservation.assets && reservation.assets.length > 0 ? (
                <div className="space-y-4">
                  {sortedCategories.map((category) => {
                    const assets = assetsByCategory[category] || [];
                    return (
                      <div key={category} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {category}
                          </h4>
                        </div>
                        <div className="divide-y">
                          {assets.map((reservationAsset, index) => (
                            <div
                              key={reservationAsset.id || index}
                              className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">
                                    {reservationAsset.asset?.name || 'Unknown Asset'}
                                  </p>
                                  {reservationAsset.asset?.location && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {reservationAsset.asset.location}
                                    </p>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <Badge variant="outline" className="font-medium">
                                    {reservationAsset.quantity} {reservationAsset.quantity === 1 ? 'unit' : 'units'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No equipment reserved</p>
                </div>
              )}
            </div>

            {/* Additional Information */}
            {(reservation.description || reservation.notes) && (
              <>
                <Separator />
                <div className="space-y-4">
                  {reservation.description && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <h3 className="text-sm font-semibold">Description</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {reservation.description}
                      </p>
                    </div>
                  )}

                  {reservation.notes && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <h3 className="text-sm font-semibold">Notes</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {reservation.notes}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleDownloadPackingList}
              disabled={isDownloading || !reservation.assets || reservation.assets.length === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isDownloading ? 'Generating...' : 'Download Packing List'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(true)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
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
