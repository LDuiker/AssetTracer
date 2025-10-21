'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Plus, Search, TrendingUp, FileText, CheckCircle, DollarSign, Filter, Clock } from 'lucide-react';
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
import { motion } from 'framer-motion';

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch');
  }
  return res.json();
};

type InvoiceStatus = 'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export default function InvoicesPage() {
  const router = useRouter();
  const { limits, canCreateInvoice, getUpgradeMessage, redirectToUpgrade } = useSubscription();
  const { formatCurrency } = useCurrency();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'view' | 'edit'>('list');

  // Fetch invoices
  const { data, error, mutate, isLoading } = useSWR<{ invoices: Invoice[] }>(
    '/api/invoices',
    fetcher
  );

  const invoices = data?.invoices || [];

  // Calculate invoices created this month
  const invoicesThisMonth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return invoices.filter((inv) => {
      const invoiceDate = new Date(inv.issue_date);
      return invoiceDate.getMonth() === currentMonth && 
             invoiceDate.getFullYear() === currentYear;
    }).length;
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
   * Handle edit invoice
   */
  const handleEdit = () => {
    setViewMode('edit');
  };

  /**
   * Handle clone invoice
   */
  const handleClone = (invoice: Invoice) => {
    // Create a clone without the id and with updated dates
    const clonedInvoice = {
      ...invoice,
      id: undefined, // Remove id so it creates a new one
      invoice_number: undefined, // Will be auto-generated
      status: 'draft' as const,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paid_date: undefined, // Clear paid date
      payment_link: undefined, // Clear payment link
    };

    setSelectedInvoice(clonedInvoice as any);
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
      
      // Dynamically import PDF libraries (client-side only)
      const { pdf } = await import('@react-pdf/renderer');
      const { InvoicePDF } = await import('@/lib/pdf/invoice-pdf');
      
      // Generate PDF with organization data
      const blob = await pdf(
        <InvoicePDF 
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
            disabled={!canCreateInvoice(invoicesThisMonth)}
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
          Showing {filteredInvoices.length} of {invoices.length} invoices
        </div>

        {/* Invoices Table */}
        <InvoiceTable
          invoices={filteredInvoices}
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
      </div>
    );
  }

  // Split Panel View (View or Edit mode)
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
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
        />
      </div>

      {/* Right Panel - View or Edit */}
      <div className="flex-1">
        {viewMode === 'view' && selectedInvoice && (
          <InvoiceViewPanel
            invoice={selectedInvoice}
            onBack={handleBackToList}
            onEdit={handleEdit}
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
            onBack={() => setViewMode('view')}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}
