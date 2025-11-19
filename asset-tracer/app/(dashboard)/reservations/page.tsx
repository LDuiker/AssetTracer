'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Plus, Calendar, Search, Filter, List, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReservationFormDialog } from '@/components/reservations/ReservationFormDialog';
import { ReservationViewDialog } from '@/components/reservations/ReservationViewDialog';
import { ReservationsCalendar } from '@/components/reservations/ReservationsCalendar';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import type { Reservation } from '@/types/reservation';
import { toast } from 'sonner';

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

export default function ReservationsPage() {
  const { data, error, isLoading, mutate } = useSWR<{ reservations: Reservation[] }>(
    '/api/reservations'
  );

  const reservationsData = data?.reservations;
  const reservations = useMemo<Reservation[]>(() => reservationsData ?? [], [reservationsData]);
  
  // Subscription limits
  const { tier, limits, canCreateReservation } = useSubscription();
  
  // Calculate monthly reservation count
  const monthlyReservationCount = useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return reservations.filter((r) => new Date(r.created_at) >= firstDayOfMonth).length;
  }, [reservations]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [initialDate, setInitialDate] = useState<Date | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch =
        searchQuery === '' ||
        reservation.title.toLowerCase().includes(searchLower) ||
        (reservation.project_name?.toLowerCase().includes(searchLower) ?? false) ||
        (reservation.description?.toLowerCase().includes(searchLower) ?? false);

      const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reservations, searchQuery, statusFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleCreate = () => {
    // Check monthly reservation limit
    if (!canCreateReservation(monthlyReservationCount)) {
      const maxAllowed = limits.maxReservationsPerMonth;
      toast.error('Monthly reservation limit reached', {
        description: `Your ${tier === 'free' ? 'Free' : 'Pro'} plan allows ${maxAllowed} reservations per month. You've created ${monthlyReservationCount} this month. ${tier === 'free' ? 'Upgrade to Pro for 200 reservations/month, or Business for unlimited.' : 'Upgrade to Business for unlimited reservations.'}`,
        action: {
          label: 'Upgrade',
          onClick: () => {
            window.location.href = '/settings?tab=billing';
          },
        },
      });
      return;
    }
    
    setSelectedReservation(null);
    setInitialDate(null);
    setIsFormOpen(true);
  };

  const handleView = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsViewOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    mutate();
  };

  const handleViewClose = () => {
    setIsViewOpen(false);
    setSelectedReservation(null);
    mutate();
  };

  const handleCalendarDateClick = (date: Date) => {
    // Open form with pre-filled date
    setSelectedReservation(null);
    setInitialDate(date);
    setIsFormOpen(true);
  };

  const handleCalendarReservationClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsViewOpen(true);
  };

  const handleExportCSV = async () => {
    try {
      setIsExportingCSV(true);
      toast.loading('Exporting reservations to CSV...');

      const response = await fetch('/api/reservations/export/csv', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reservations-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.dismiss();
      toast.success('Reservations exported to CSV successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.dismiss();
      toast.error('Failed to export reservations to CSV');
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      toast.loading('Generating PDF...');

      const response = await fetch('/api/reservations/export/pdf', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reservations-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.dismiss();
      toast.success('Reservations exported to PDF successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.dismiss();
      toast.error('Failed to export reservations to PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading reservations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 p-6 text-center">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
            Failed to load reservations
          </h3>
          <p className="text-sm text-red-700 dark:text-red-400 mb-4">
            {error.message || 'An error occurred while fetching reservations'}
          </p>
          <Button onClick={() => mutate()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reservations</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage equipment reservations for your projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            disabled={isExportingCSV || isExportingPDF || isLoading || reservations.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isExportingCSV ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button
            onClick={handleExportPDF}
            variant="outline"
            disabled={isExportingCSV || isExportingPDF || isLoading || reservations.length === 0}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            {isExportingPDF ? 'Generating...' : 'Export PDF'}
          </Button>
          <Button 
            onClick={handleCreate} 
            className="gap-2"
            disabled={!canCreateReservation(monthlyReservationCount)}
            title={!canCreateReservation(monthlyReservationCount) ? `Monthly limit reached (${monthlyReservationCount}/${limits.maxReservationsPerMonth})` : ''}
          >
            <Plus className="h-4 w-4" />
            New Reservation
            {!canCreateReservation(monthlyReservationCount) && (
              <span className="ml-2 text-xs opacity-75">
                ({monthlyReservationCount}/{limits.maxReservationsPerMonth})
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* View Toggle and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'calendar')}>
          <TabsList>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {viewMode === 'list' && (
          <>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search reservations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {/* Reservations View */}
      {viewMode === 'calendar' ? (
        <ReservationsCalendar
          reservations={filteredReservations}
          onDateClick={handleCalendarDateClick}
          onReservationClick={handleCalendarReservationClick}
        />
      ) : filteredReservations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No reservations found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first reservation to get started'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button onClick={handleCreate}>Create Reservation</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredReservations.map((reservation) => (
            <Card
              key={reservation.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleView(reservation)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 mb-2">
                      {reservation.title}
                      <Badge className={statusColors[reservation.status]}>
                        {reservation.status}
                      </Badge>
                      {reservation.priority !== 'normal' && (
                        <Badge className={priorityColors[reservation.priority]} variant="outline">
                          {reservation.priority}
                        </Badge>
                      )}
                    </CardTitle>
                    {reservation.project_name && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Project: {reservation.project_name}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-1">Dates</p>
                    <p className="font-medium">
                      {formatDate(reservation.start_date)} - {formatDate(reservation.end_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-1">Assets</p>
                    <p className="font-medium">
                      {reservation.assets?.length || 0} asset{reservation.assets?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {reservation.location && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 mb-1">Location</p>
                      <p className="font-medium">{reservation.location}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <ReservationFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setInitialDate(null);
          }
        }}
        reservation={selectedReservation}
        initialDate={initialDate}
        onSuccess={handleFormSuccess}
      />

      {selectedReservation && (
        <ReservationViewDialog
          open={isViewOpen}
          onOpenChange={setIsViewOpen}
          reservation={selectedReservation}
          onUpdate={handleViewClose}
          onDelete={handleViewClose}
        />
      )}
    </div>
  );
}

