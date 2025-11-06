'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Plus, Search, TrendingUp, FileText, CheckCircle, DollarSign, Filter, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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

type QuotationStatus = 'all' | 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'invoiced';

export default function QuotationsPage() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const { limits, canCreateQuotation, canCreateInvoice, getUpgradeMessage, redirectToUpgrade, tier, isLoading: subscriptionLoading } = useSubscription();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuotationStatus>('all');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'view' | 'edit'>('list'); // New state for panel mode
  const [currentPage, setCurrentPage] = useState(1);
  
  // Pagination constants
  const ITEMS_PER_PAGE = 100;

  // Fetch quotations
  const { data, error, mutate, isLoading } = useSWR<{ quotations: Quotation[] }>(
    '/api/quotations',
    {
      keepPreviousData: true, // Keep previous data while fetching (prevents flicker)
      revalidateOnMount: false, // Use cached data if available
    }
  );

  // Fetch invoices to check quota (lower priority)
  const { data: invoicesData } = useSWR<{ invoices: any[] }>(
    '/api/invoices',
    {
      keepPreviousData: true,
      revalidateOnMount: false,
    }
  );

  const quotations = data?.quotations || [];
  const invoices = invoicesData?.invoices || [];

  // Calculate quotations created this month (using UTC to match backend)
  const quotationsThisMonth = useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    // Format as ISO string without milliseconds to match backend filter format
    const firstDayISO = firstDayOfMonth.toISOString().split('.')[0] + 'Z';
    
    const count = quotations.filter((q) => {
      if (!q.created_at) {
        console.warn('Quotation missing created_at:', q.id);
        return false;
      }
      // Parse the created_at timestamp and compare with first day of month
      const quotationDate = new Date(q.created_at);
      // Use getTime() for precise comparison to avoid timezone issues
      return quotationDate.getTime() >= firstDayOfMonth.getTime();
    }).length;
    
    // Debug logging
    console.log('[Quotations Frontend] Monthly count:', {
      count,
      totalQuotations: quotations.length,
      firstDayOfMonth: firstDayISO,
      firstDayOfMonthFull: firstDayOfMonth.toISOString(),
      quotationsWithDates: quotations.map(q => ({ 
        id: q.id, 
        created_at: q.created_at,
        created_at_parsed: new Date(q.created_at).toISOString(),
        isIncluded: q.created_at ? new Date(q.created_at).getTime() >= firstDayOfMonth.getTime() : false
      })),
    });
    
    return count;
  }, [quotations]);

  // Calculate invoices created this month (for convert to invoice quota check, using UTC to match backend)
  const invoicesThisMonth = useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    
    return invoices.filter((inv) => {
      // Use created_at if available, otherwise use issue_date
      const dateField = inv.created_at || inv.issue_date;
      if (!dateField) {
        return false;
      }
      const invoiceDate = new Date(dateField);
      // Use getTime() for precise comparison to avoid timezone issues
      return invoiceDate.getTime() >= firstDayOfMonth.getTime();
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

  /**
   * Calculate pagination values
   */
  const totalPages = Math.ceil(filteredQuotations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedQuotations = filteredQuotations.slice(startIndex, endIndex);

  // Reset to page 1 when filters change or if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [searchQuery, statusFilter, currentPage, totalPages]);

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
      toast.error('Free Plan - You\'ve reached the limit for quotations. Upgrade to Pro for unlimited access.', {
        description: `Free plan allows ${limits.maxQuotationsPerMonth} quotations per month. You've created ${quotationsThisMonth} this month.`,
        duration: 5000,
        action: {
          label: 'Upgrade to Pro',
          onClick: redirectToUpgrade,
        },
      });
      return;
    }

    // Debug logging
    console.log('[Quotations Create] Check:', {
      quotationsThisMonth,
      maxAllowed: limits.maxQuotationsPerMonth,
      canCreate: canCreateQuotation(quotationsThisMonth),
      tier,
      subscriptionLoading,
    });
    
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
      
      // Get selected template
      const selectedTemplate = orgData?.quotation_template || 'classic';
      
      // Dynamically import PDF libraries (client-side only)
      const { pdf } = await import('@react-pdf/renderer');
      const { getQuotationTemplate } = await import('@/lib/pdf/templates');
      
      // Get the appropriate template component
      const template = getQuotationTemplate(selectedTemplate as 'classic' | 'compact');
      const QuotationComponent = template.component;
      
      // Generate PDF with organization data
      const blob = await pdf(
        <QuotationComponent 
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
            disabled={subscriptionLoading || !canCreateQuotation(quotationsThisMonth)}
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
        {filteredQuotations.length > 0 ? (
          <>
            Showing{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {startIndex + 1}
            </span>
            {' - '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {Math.min(endIndex, filteredQuotations.length)}
            </span>
            {' of '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {filteredQuotations.length}
            </span>
            {' quotation' + (filteredQuotations.length !== 1 ? 's' : '')}
            {filteredQuotations.length !== quotations.length && (
              <>
                {' (filtered from '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {quotations.length}
                </span>
                {' total)'}
              </>
            )}
          </>
        ) : (
          <>No quotations found</>
        )}
      </div>

      {/* Quotations Table */}
      <QuotationTable
        quotations={paginatedQuotations}
        onView={handleView}
        onEdit={handleEdit}
        onClone={handleClone}
        onConvertToInvoice={handleConvertToInvoice}
        onDownloadPDF={handleDownloadPDF}
        onDelete={handleDelete}
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
  const canCreate = canCreateQuotation(quotationsThisMonth);
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Subscription Badge - Show when limit reached */}
      {tier === 'free' && !canCreate && (
        <div className="px-6 pt-6 pb-2">
          <SubscriptionBadge feature="quotations" showUpgrade={true} />
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
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
            disabled={!canCreate || subscriptionLoading}
            currentCount={quotationsThisMonth}
            maxCount={limits.maxQuotationsPerMonth}
          />
        </div>

        {/* Right Panel - View or Edit */}
        <div className="flex-1 overflow-hidden">
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

          {viewMode === 'edit' && selectedQuotation && (
            <QuotationEditPanel
              quotation={selectedQuotation}
              onBack={handleBackToList}
              onSave={handleSave}
            />
          )}
        </div>
      </div>
    </div>
  );
}
