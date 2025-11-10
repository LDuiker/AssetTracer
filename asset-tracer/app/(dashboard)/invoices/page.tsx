'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Plus, Search, FileText, CheckCircle, DollarSign, Filter, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InvoiceTable, InvoiceListPanel, InvoiceViewPanel, InvoiceEditPanel } from '@/components/invoices';
import { SubscriptionBadge } from '@/components/subscription';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { toast } from 'sonner';
import type { Invoice, CreateInvoiceInput } from '@/types';
import { InvoiceStatus } from '@/types';
import { motion } from 'framer-motion';

type InvoiceStatus = 'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export default function InvoicesPage() {
  const router = useRouter();
  const { limits, canCreateInvoice, getUpgradeMessage, redirectToUpgrade, tier, isLoading: subscriptionLoading } = useSubscription();
  const { formatCurrency } = useCurrency();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'view' | 'edit'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Pagination constants
  const ITEMS_PER_PAGE = 100;

  // Fetch invoices
  const { data, error, mutate, isLoading } = useSWR<{ invoices: Invoice[] }>(
    '/api/invoices'
  );

  const invoicesData = data?.invoices;
  const invoices = useMemo<Invoice[]>(() => invoicesData ?? [], [invoicesData]);

  // Calculate invoices created this month (using UTC to match backend)
  const invoicesThisMonth = useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    // Format as ISO string without milliseconds to match backend filter format
    const firstDayISO = firstDayOfMonth.toISOString().split('.')[0] + 'Z';
    
    const count = invoices.filter((inv) => {
      // Use created_at if available, otherwise use issue_date
      const dateField = inv.created_at || inv.issue_date;
      if (!dateField) {
        console.warn('Invoice missing created_at and issue_date:', inv.id);
        return false;
      }
      const invoiceDate = new Date(dateField);
      // Use getTime() for precise comparison to avoid timezone issues
      return invoiceDate.getTime() >= firstDayOfMonth.getTime();
    }).length;
    
    // Debug logging
    console.log('[Invoices Frontend] Monthly count:', {
      count,
      totalInvoices: invoices.length,
      firstDayOfMonth: firstDayISO,
      firstDayOfMonthFull: firstDayOfMonth.toISOString(),
      invoicesWithDates: invoices.map(inv => ({ 
        id: inv.id, 
        created_at: inv.created_at, 
        issue_date: inv.issue_date,
        created_at_parsed: inv.created_at ? new Date(inv.created_at).toISOString() : null,
        issue_date_parsed: inv.issue_date ? new Date(inv.issue_date).toISOString() : null,
        isIncluded: (inv.created_at || inv.issue_date) ? new Date(inv.created_at || inv.issue_date).getTime() >= firstDayOfMonth.getTime() : false
      })),
    });
    
    return count;
  }, [invoices]);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // Status filter
      if (statusFilter !== 'all' && invoice.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        return (
          invoice.invoice_number.toLowerCase().includes(search) ||
          invoice.client?.name?.toLowerCase().includes(search) ||
          invoice.client?.company?.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [invoices, searchQuery, statusFilter]);

  /**
   * Calculate pagination values
   */
  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  // Reset to page 1 when filters change or if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [searchQuery, statusFilter, currentPage, totalPages]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = invoices.length;
    const paid = invoices.filter((i) => i.status === 'paid').length;
    const unpaid = invoices.filter((i) => i.status !== 'paid').length;
    const overdue = invoices.filter((i) => i.status === 'overdue').length;
    const totalValue = invoices.reduce((sum, i) => sum + i.total, 0);
    const totalPaid = invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + i.total, 0);
    const totalPending = totalValue - totalPaid;
    
    // Calculate payment rate (paid / total invoices) * 100
    const paymentRate = total > 0 
      ? (paid / total) * 100 
      : 0;

    return { total, unpaid, paid, overdue, totalValue, totalPaid, totalPending, paymentRate };
  }, [invoices]);

  /**
   * Handle create invoice
   */
  const handleCreate = () => {
    // Check subscription limit
    if (!canCreateInvoice(invoicesThisMonth)) {
      toast.error('Free Plan - You\'ve reached the limit for invoices. Upgrade to Pro for unlimited access.', {
        description: `Free plan allows ${limits.maxInvoicesPerMonth} invoices per month. You've created ${invoicesThisMonth} this month.`,
        duration: 5000,
        action: {
          label: 'Upgrade to Pro',
          onClick: redirectToUpgrade,
        },
      });
      return;
    }

    // Debug logging
    console.log('[Invoices Create] Check:', {
      invoicesThisMonth,
      maxAllowed: limits.maxInvoicesPerMonth,
      canCreate: canCreateInvoice(invoicesThisMonth),
      tier,
      subscriptionLoading,
    });
    
    // Check subscription limit
    if (!canCreateInvoice(invoicesThisMonth)) {
      toast.error(getUpgradeMessage('invoices'), {
        description: `Free plan allows ${limits.maxInvoicesPerMonth} invoices per month. You've created ${invoicesThisMonth} this month.`,
        duration: 5000,
        action: {
          label: 'Upgrade',
          onClick: redirectToUpgrade,
        },
      });
      return;
    }

    router.push('/invoices/new');
  };

  /**
   * Handle view invoice
   */
  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewMode('view');
  };

  /**
   * Handle clone invoice
   */
  const handleClone = (invoice: Invoice) => {
    // Create a clone without the id and with updated dates
    const clonedInvoice: Invoice = {
      ...invoice,
      id: '',
      invoice_number: '',
      status: InvoiceStatus.DRAFT,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_date: null,
      payment_method: null,
      paid_amount: 0,
      balance: invoice.total,
      updated_at: new Date().toISOString(),
    };

    setSelectedInvoice(clonedInvoice);
    setViewMode('edit');

    toast.info(`Cloning invoice ${invoice.invoice_number}`);
  };

  /**
   * Handle back to list
   */
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedInvoice(null);
  };

  /**
   * Handle save invoice
   */
  const handleSave = async (data: CreateInvoiceInput) => {
    if (!selectedInvoice) return;

    try {
      // If no id, this is a new invoice (from clone)
      const isNewInvoice = !selectedInvoice.id;
      
      const url = isNewInvoice ? '/api/invoices' : `/api/invoices/${selectedInvoice.id}`;
      const method = isNewInvoice ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || `Failed to ${isNewInvoice ? 'create' : 'update'} invoice`);
      }

      const { invoice } = await response.json();

      // Update cache
      if (isNewInvoice) {
        // Add new invoice to the list
        mutate(
          {
            invoices: [invoice, ...invoices],
          },
          { revalidate: false }
        );
      } else {
        // Update existing invoice
        mutate(
          {
            invoices: invoices.map((i) =>
              i.id === invoice.id ? invoice : i
            ),
          },
          { revalidate: false }
        );
      }

      setSelectedInvoice(invoice);
      setViewMode('view');
      toast.success(`Invoice ${isNewInvoice ? 'created' : 'updated'} successfully`);
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save invoice');
      throw error;
    }
  };

  /**
   * Handle delete invoice
   */
  const handleDelete = async (invoice: Invoice) => {
    if (!window.confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete invoice');
      }

      // Update cache
      mutate(
        { invoices: invoices.filter((i) => i.id !== invoice.id) },
        { revalidate: false }
      );

      if (selectedInvoice?.id === invoice.id) {
        setSelectedInvoice(null);
        setViewMode('list');
      }
      
      toast.success('Invoice deleted successfully');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete invoice'
      );
    }
  };

  /**
   * Handle status change
   */
  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      const { invoice } = await response.json();

      // Update cache
      mutate(
        {
          invoices: invoices.map((i) =>
            i.id === invoice.id ? invoice : i
          ),
        },
        { revalidate: false }
      );

      setSelectedInvoice(invoice);
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  };

  /**
   * Handle download PDF
   */
  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      toast.loading('Generating PDF...');
      
      // Fetch full invoice data with items (the list might not have items populated)
      const invoiceResponse = await fetch(`/api/invoices/${invoice.id}`);
      if (!invoiceResponse.ok) {
        throw new Error('Failed to fetch invoice details');
      }
      const invoiceData = await invoiceResponse.json();
      const fullInvoice = invoiceData.invoice;
      
      // Debug logging
      console.log('Full Invoice Data:', {
        id: fullInvoice.id,
        subject: fullInvoice.subject,
        itemsCount: fullInvoice.items?.length || 0,
        items: fullInvoice.items
      });
      
      // Fetch organization data
      const orgResponse = await fetch('/api/organization/settings');
      const orgResult = orgResponse.ok ? await orgResponse.json() : null;
      const orgData = orgResult?.organization || null;
      
      // Get selected template
      const selectedTemplate = orgData?.invoice_template || 'classic';
      
      // Dynamically import PDF libraries (client-side only)
      const { pdf } = await import('@react-pdf/renderer');
      const { getInvoiceTemplate } = await import('@/lib/pdf/templates');
      
      // Get the appropriate template component
      const template = getInvoiceTemplate(selectedTemplate as 'classic' | 'compact');
      const InvoiceComponent = template.component;
      
      // Generate PDF with organization data
      const blob = await pdf(
        <InvoiceComponent 
          invoice={fullInvoice} 
          organization={orgData}
        />
      ).toBlob();
      
      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.dismiss();
      toast.error('Failed to download PDF');
    }
  };

  /**
   * Handle mark as paid
   */
  const handleMarkAsPaid = async (invoice: Invoice) => {
    if (!window.confirm(`Mark invoice ${invoice.invoice_number} as paid?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/mark-paid`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark invoice as paid');
      }

      const { invoice: updatedInvoice } = await response.json();

      // Update cache
      mutate(
        {
          invoices: invoices.map((i) =>
            i.id === updatedInvoice.id ? updatedInvoice : i
          ),
        },
        { revalidate: false }
      );

      if (selectedInvoice?.id === invoice.id) {
        setSelectedInvoice(updatedInvoice);
      }
      
      toast.success('Invoice marked as paid');
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to mark invoice as paid'
      );
    }
  };

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 p-6">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
            Failed to load invoices
          </h3>
          <p className="text-sm text-red-700 dark:text-red-400 mb-4">
            {error.message || 'An error occurred while fetching invoices'}
          </p>
          <div className="flex gap-3">
            <Button onClick={() => mutate()} variant="outline">
              Retry
            </Button>
            <Button 
              onClick={() => window.location.href = '/clients'} 
              variant="outline"
            >
              Go to Clients
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render split-panel layout
  if (viewMode === 'list') {
    // Full width list view with analytics
    return (
      <div className="p-6 space-y-6">
        {/* Subscription Badge */}
        <SubscriptionBadge feature="invoices" showUpgrade={!canCreateInvoice(invoicesThisMonth)} />

        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Invoices
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create and manage invoices for your clients
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-primary-blue hover:bg-blue-700 w-full md:w-auto"
            size="lg"
            disabled={subscriptionLoading || !canCreateInvoice(invoicesThisMonth)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Invoice
            {!canCreateInvoice(invoicesThisMonth) && (
              <span className="ml-2 text-xs opacity-75">
                ({invoicesThisMonth}/{limits.maxInvoicesPerMonth} this month)
              </span>
            )}
          </Button>
        </div>

        {/* Analytics Summary Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Unpaid Invoices */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Unpaid Invoices
                    </p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {stats.unpaid}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Paid Invoices */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Paid Invoices
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {stats.paid}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Payments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Total Payments
                    </p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {formatCurrency(stats.totalPaid)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Payment Rate
                    </p>
                    <p className={`text-3xl font-bold ${
                      stats.paymentRate >= 50 
                        ? 'text-green-600 dark:text-green-400' 
                        : stats.paymentRate >= 25 
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stats.paymentRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                    stats.paymentRate >= 50 
                      ? 'bg-green-100 dark:bg-green-900/20' 
                      : stats.paymentRate >= 25 
                        ? 'bg-yellow-100 dark:bg-yellow-900/20'
                        : 'bg-red-100 dark:bg-red-900/20'
                  }`}>
                    <FileText className={`h-6 w-6 ${
                      stats.paymentRate >= 50 
                        ? 'text-green-600 dark:text-green-400' 
                        : stats.paymentRate >= 25 
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by invoice number, client name, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="w-full md:w-48">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as InvoiceStatus)}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredInvoices.length > 0 ? (
            <>
              Showing{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {startIndex + 1}
              </span>
              {' - '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {Math.min(endIndex, filteredInvoices.length)}
              </span>
              {' of '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {filteredInvoices.length}
              </span>
              {' invoice' + (filteredInvoices.length !== 1 ? 's' : '')}
              {filteredInvoices.length !== invoices.length && (
                <>
                  {' (filtered from '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {invoices.length}
                  </span>
                  {' total)'}
                </>
              )}
            </>
          ) : (
            <>No invoices found</>
          )}
        </div>

        {/* Invoices Table */}
        <InvoiceTable
          invoices={paginatedInvoices}
          onView={handleView}
          onEdit={(invoice) => {
            setSelectedInvoice(invoice);
            setViewMode('edit');
          }}
          onClone={handleClone}
          onDelete={handleDelete}
          onDownloadPDF={handleDownloadPDF}
          onMarkAsPaid={handleMarkAsPaid}
          isLoading={isLoading}
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {currentPage}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {totalPages}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {/* Show first page if not near start */}
                {currentPage > 3 && (
                  <>
                    <Button
                      variant={1 === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      className="h-8 w-8 p-0"
                    >
                      1
                    </Button>
                    {currentPage > 4 && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                  </>
                )}

                {/* Show pages around current page */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  if (pageNum < 1 || pageNum > totalPages) return null;

                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="h-8 w-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                {/* Show last page if not near end */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                    <Button
                      variant={totalPages === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="h-8 w-8 p-0"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>

              {/* Next Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Split Panel View (View or Edit mode)
  const canCreate = canCreateInvoice(invoicesThisMonth);
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Subscription Badge - Show when limit reached */}
      {tier === 'free' && !canCreate && (
        <div className="px-6 pt-6 pb-2">
          <SubscriptionBadge feature="invoices" showUpgrade={true} />
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Invoice List */}
        <div className="w-96 flex-shrink-0">
          <InvoiceListPanel
            invoices={filteredInvoices}
            selectedInvoice={selectedInvoice}
            onSelect={handleView}
            onCreate={handleCreate}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={(value) => setStatusFilter(value as InvoiceStatus)}
            disabled={!canCreate || subscriptionLoading}
            currentCount={invoicesThisMonth}
            maxCount={limits.maxInvoicesPerMonth}
          />
        </div>

        {/* Right Panel - View or Edit */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'view' && selectedInvoice && (
            <InvoiceViewPanel
              invoice={selectedInvoice}
              onBack={handleBackToList}
              onEdit={() => setViewMode('edit')}
              onClone={() => handleClone(selectedInvoice)}
              onDelete={() => handleDelete(selectedInvoice)}
              onStatusChange={handleStatusChange}
              onDownloadPDF={() => handleDownloadPDF(selectedInvoice)}
              onMarkAsPaid={() => handleMarkAsPaid(selectedInvoice)}
            />
          )}

          {viewMode === 'edit' && selectedInvoice && (
            <InvoiceEditPanel
              invoice={selectedInvoice}
              onBack={handleBackToList}
              onSave={handleSave}
            />
          )}
        </div>
      </div>
    </div>
  );
}
