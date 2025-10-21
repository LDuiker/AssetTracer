'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Plus, Search, TrendingUp, FileText, CheckCircle, DollarSign, Filter, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QuotationTable, QuotationListPanel, QuotationViewPanel, QuotationEditPanel } from '@/components/quotations';
import { SubscriptionBadge } from '@/components/subscription';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import { toast } from 'sonner';
import type { Quotation, CreateQuotationInput } from '@/types';
import { motion } from 'framer-motion';

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch');
  }
  return res.json();
};

type QuotationStatus = 'all' | 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'invoiced';

export default function QuotationsPage() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const { limits, canCreateQuotation, canCreateInvoice, getUpgradeMessage, redirectToUpgrade } = useSubscription();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuotationStatus>('all');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'view' | 'edit'>('list'); // New state for panel mode

  // Fetch quotations
  const { data, error, mutate, isLoading } = useSWR<{ quotations: Quotation[] }>(
    '/api/quotations',
    fetcher
  );

  // Fetch invoices to check quota
  const { data: invoicesData } = useSWR<{ invoices: any[] }>(
    '/api/invoices',
    fetcher
  );

  const quotations = data?.quotations || [];
  const invoices = invoicesData?.invoices || [];

  // Calculate quotations created this month
  const quotationsThisMonth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return quotations.filter((q) => {
      const quotationDate = new Date(q.created_at);
      return quotationDate.getMonth() === currentMonth && 
             quotationDate.getFullYear() === currentYear;
    }).length;
  }, [quotations]);

  // Calculate invoices created this month (for convert to invoice quota check)
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

  // Filter quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter((quotation) => {
      // Status filter
      if (statusFilter !== 'all' && quotation.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        return (
          quotation.quotation_number.toLowerCase().includes(search) ||
          quotation.client?.name?.toLowerCase().includes(search) ||
          quotation.client?.company?.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [quotations, searchQuery, statusFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = quotations.length;
    const rejected = quotations.filter((q) => q.status === 'rejected').length;
    const accepted = quotations.filter((q) => q.status === 'accepted').length;
    const totalValue = quotations.reduce((sum, q) => sum + q.total, 0);
    
    // Calculate conversion rate (accepted / total quotations) * 100
    const conversionRate = total > 0 
      ? (accepted / total) * 100 
      : 0;

    return { total, rejected, accepted, totalValue, conversionRate };
  }, [quotations]);

  /**
   * Handle create quotation
   */
  const handleCreate = () => {
    // Check subscription limit
    if (!canCreateQuotation(quotationsThisMonth)) {
      toast.error(getUpgradeMessage('quotations'), {
        description: `Free plan allows ${limits.maxQuotationsPerMonth} quotations per month. You've created ${quotationsThisMonth} this month.`,
        duration: 5000,
        action: {
          label: 'Upgrade',
          onClick: redirectToUpgrade,
        },
      });
      return;
    }

    router.push('/quotations/new');
  };

  /**
   * Handle view quotation
   */
  const handleView = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setViewMode('view');
  };

  /**
   * Handle edit quotation
   */
  const handleEdit = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setViewMode('edit');
  };

  /**
   * Handle clone quotation
   */
  const handleClone = (quotation: Quotation) => {
    // Create a clone without the id and with updated dates
    const clonedQuotation = {
      ...quotation,
      id: undefined, // Remove id so it creates a new one
      quotation_number: undefined, // Will be auto-generated
      status: 'draft' as const,
      issue_date: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    setSelectedQuotation(clonedQuotation as any);
    setViewMode('edit');

    toast.info(`Cloning quotation ${quotation.quotation_number}`);
  };

  /**
   * Handle back to list
   */
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedQuotation(null);
  };

  /**
   * Handle status change
   */
  const handleStatusChange = async (quotationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      const { quotation } = await response.json();

      // Optimistically update
      mutate(
        (data) => ({
          quotations: data!.quotations.map((q) =>
            q.id === quotation.id ? quotation : q
          ),
        }),
        { revalidate: false }
      );

      // Update selected quotation if it's the one being viewed
      if (selectedQuotation?.id === quotationId) {
        setSelectedQuotation(quotation);
      }

      // Revalidate in background
      mutate();
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  };

  /**
   * Handle convert to invoice
   */
  const handleConvertToInvoice = async (quotation: Quotation) => {
    // Check invoice quota before converting
    if (!canCreateInvoice(invoicesThisMonth)) {
      toast.error(getUpgradeMessage('invoices'), {
        description: `Free plan allows ${limits.maxInvoicesPerMonth} invoices per month. You've created ${invoicesThisMonth} this month. Cannot convert quotation.`,
        duration: 5000,
        action: {
          label: 'Upgrade',
          onClick: redirectToUpgrade,
        },
      });
      return;
    }

    // Confirm action
    const confirmed = window.confirm(
      `Convert quotation ${quotation.quotation_number} to an invoice?\n\nThis will create a new invoice with the same items and mark the quotation as converted.`
    );

    if (!confirmed) {
      return;
    }

    const loadingToast = toast.loading('Converting to invoice...');

    try {
      const response = await fetch(`/api/quotations/${quotation.id}/convert-to-invoice`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to convert to invoice');
      }

      const { invoice, invoiceId } = await response.json();

      toast.dismiss(loadingToast);
      toast.success(`Invoice ${invoice.invoice_number} created successfully!`, {
        description: 'Redirecting to invoice...',
        duration: 3000,
      });

      // Revalidate quotations to reflect the conversion
      mutate();

      // Redirect to invoices page after a short delay
      setTimeout(() => {
        router.push('/invoices');
      }, 1500);

    } catch (error) {
      console.error('Error converting to invoice:', error);
      toast.dismiss(loadingToast);
      toast.error(error instanceof Error ? error.message : 'Failed to convert to invoice');
    }
  };

  /**
   * Handle download PDF
   */
  const handleDownloadPDF = async (quotation: Quotation) => {
    try {
      toast.loading('Generating PDF...');
      
      // Fetch full quotation data with items (the list might not have all fields populated)
      const quotationResponse = await fetch(`/api/quotations/${quotation.id}`);
      if (!quotationResponse.ok) {
        const errorData = await quotationResponse.json().catch(() => ({}));
        throw new Error(`Failed to fetch quotation details: ${errorData.error || quotationResponse.statusText}`);
      }
      const quotationData = await quotationResponse.json();
      const fullQuotation = quotationData.quotation;
      
      // Fetch organization data
      const orgResponse = await fetch('/api/organization/settings');
      const orgResult = orgResponse.ok ? await orgResponse.json() : null;
      const orgData = orgResult?.organization || null;
      
      // Dynamically import PDF libraries (client-side only)
      const { pdf } = await import('@react-pdf/renderer');
      const { QuotationPDF } = await import('@/lib/pdf/quotation-pdf');
      
      // Generate PDF with organization data
      const blob = await pdf(
        <QuotationPDF 
          quotation={fullQuotation} 
          organization={orgData}
        />
      ).toBlob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${quotation.quotation_number}.pdf`;
      link.click();
      
      // Cleanup
      URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss();
      toast.error('Failed to generate PDF');
    }
  };

  /**
   * Handle delete quotation
   */
  const handleDelete = async (quotation: Quotation) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete quotation ${quotation.quotation_number}?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) {
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading('Deleting quotation...');

    try {
      console.log('🗑️ Deleting quotation:', quotation.id);
      
      const response = await fetch(`/api/quotations/${quotation.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Delete failed:', error);
        throw new Error(error.error || 'Failed to delete quotation');
      }

      const result = await response.json();
      console.log('Delete successful:', result);

      // Optimistically update
      mutate(
        (data) => ({
          quotations: data!.quotations.filter((q) => q.id !== quotation.id),
        }),
        { revalidate: false }
      );

      // Revalidate in background
      mutate();

      toast.dismiss(loadingToast);
      toast.success(`Quotation ${quotation.quotation_number} deleted successfully`);
    } catch (error) {
      console.error('Error deleting quotation:', error);
      toast.dismiss(loadingToast);
      toast.error(error instanceof Error ? error.message : 'Failed to delete quotation');
      mutate(); // Revalidate on error
    }
  };

  /**
   * Handle save quotation (create or update)
   */
  const handleSave = async (data: CreateQuotationInput) => {
    try {
      // Check if we're updating (selectedQuotation has an id) or creating (no id)
      const isUpdate = selectedQuotation && selectedQuotation.id;
      
      if (isUpdate) {
        // Update existing quotation
        const response = await fetch(`/api/quotations/${selectedQuotation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update quotation');
        }

        const { quotation } = await response.json();

        // Optimistically update
        mutate(
          (data) => ({
            quotations: data!.quotations.map((q) =>
              q.id === quotation.id ? quotation : q
            ),
          }),
          { revalidate: false }
        );

        toast.success('Quotation updated successfully');
        // Switch to view mode after update
        setViewMode('view');
      } else {
        // Create new quotation
        const response = await fetch('/api/quotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || error.error || 'Failed to create quotation');
        }

        const { quotation } = await response.json();

        // Optimistically update
        mutate(
          (data) => ({
            quotations: [quotation, ...(data?.quotations || [])],
          }),
          { revalidate: false }
        );

        toast.success('Quotation created successfully');
        // Select the new quotation and switch to view mode
        setSelectedQuotation(quotation);
        setViewMode('view');
      }

      // Revalidate in background
      mutate();
    } catch (error) {
      console.error('Error saving quotation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save quotation');
      throw error; // Re-throw to keep dialog open
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold text-lg mb-2">Error Loading Quotations</h3>
          <p className="text-red-600 text-sm mb-4">
            {error.message || 'Failed to load quotations. Please try again.'}
          </p>
          
          {/* Troubleshooting Steps */}
          <div className="mt-4 bg-white rounded-lg p-4 border border-red-100">
            <h4 className="font-semibold text-gray-900 mb-2">Troubleshooting:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Check browser console (F12) for detailed error messages</li>
              <li>Run <code className="bg-gray-100 px-2 py-1 rounded">DIAGNOSE-QUOTATIONS.sql</code> in Supabase SQL Editor</li>
              <li>Verify quotations tables exist in Supabase</li>
              <li>Check if you have clients created (quotations need clients)</li>
              <li>Verify your user is linked to an organization</li>
            </ol>
          </div>
          
          <div className="mt-4 flex gap-3">
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
        <SubscriptionBadge feature="quotations" showUpgrade={!canCreateQuotation(quotationsThisMonth)} />

        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Quotations
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create and manage quotations for your clients
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-primary-blue hover:bg-blue-700 w-full md:w-auto"
            size="lg"
            disabled={!canCreateQuotation(quotationsThisMonth)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Quotation
            {!canCreateQuotation(quotationsThisMonth) && (
              <span className="ml-2 text-xs opacity-75">
                ({quotationsThisMonth}/{limits.maxQuotationsPerMonth} this month)
              </span>
            )}
          </Button>
        </div>

      {/* Analytics Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Rejected Quotes */}
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
                    Rejected Quotes
                  </p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {stats.rejected}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Accepted Quotes */}
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
                    Accepted Quotes
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {stats.accepted}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quote Value (Sum) */}
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
                    Quote Value
                  </p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(stats.totalValue)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Conversion Rate */}
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
                    Conversion Rate
                  </p>
                  <p className={`text-3xl font-bold ${
                    stats.conversionRate >= 50 
                      ? 'text-green-600 dark:text-green-400' 
                      : stats.conversionRate >= 25 
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                  }`}>
                    {stats.conversionRate.toFixed(1)}%
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                  stats.conversionRate >= 50 
                    ? 'bg-green-100 dark:bg-green-900/20' 
                    : stats.conversionRate >= 25 
                      ? 'bg-yellow-100 dark:bg-yellow-900/20'
                      : 'bg-red-100 dark:bg-red-900/20'
                }`}>
                  <FileText className={`h-6 w-6 ${
                    stats.conversionRate >= 50 
                      ? 'text-green-600 dark:text-green-400' 
                      : stats.conversionRate >= 25 
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
            placeholder="Search by quotation number, client name, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="w-full md:w-48">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as QuotationStatus)}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="invoiced">Invoiced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredQuotations.length} of {quotations.length} quotations
      </div>

      {/* Quotations Table */}
      <QuotationTable
        quotations={filteredQuotations}
        onView={handleView}
        onEdit={handleEdit}
        onClone={handleClone}
        onConvertToInvoice={handleConvertToInvoice}
        onDownloadPDF={handleDownloadPDF}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
    );
  }

  // Split Panel View (View or Edit mode)
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left Panel - Quotation List */}
      <div className="w-96 flex-shrink-0">
        <QuotationListPanel
          quotations={filteredQuotations}
          selectedQuotation={selectedQuotation}
          onSelect={handleView}
          onCreate={handleCreate}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={(value) => setStatusFilter(value as QuotationStatus)}
        />
      </div>

      {/* Right Panel - View or Edit */}
      <div className="flex-1">
        {viewMode === 'view' && selectedQuotation && (
          <QuotationViewPanel
            quotation={selectedQuotation}
            onBack={handleBackToList}
            onEdit={() => setViewMode('edit')}
            onClone={() => handleClone(selectedQuotation)}
            onConvertToInvoice={() => handleConvertToInvoice(selectedQuotation)}
            onDownloadPDF={() => handleDownloadPDF(selectedQuotation)}
            onDelete={() => handleDelete(selectedQuotation)}
            onStatusChange={handleStatusChange}
          />
        )}

        {viewMode === 'edit' && (
          <QuotationEditPanel
            quotation={selectedQuotation}
            onBack={handleBackToList}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}
