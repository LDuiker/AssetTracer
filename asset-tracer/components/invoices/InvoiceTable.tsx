'use client';

import { MoreVertical, Edit, Trash2, Download, CheckCircle, FileText, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrencyAmount } from '@/lib/utils/currency';
import type { Invoice, InvoiceStatus } from '@/types';

interface InvoiceTableProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onClone: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  onDownloadPDF: (invoice: Invoice) => void;
  onMarkAsPaid: (invoice: Invoice) => void;
  isLoading?: boolean;
}

/**
 * Get badge styling based on invoice status
 */
const getStatusBadge = (status: InvoiceStatus) => {
  const statusConfig = {
    draft: {
      variant: 'secondary' as const,
      className: 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300',
    },
    sent: {
      variant: 'default' as const,
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
    },
    paid: {
      variant: 'default' as const,
      className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300',
    },
    overdue: {
      variant: 'default' as const,
      className: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-300',
    },
    cancelled: {
      variant: 'secondary' as const,
      className: 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300',
    },
  };

  return statusConfig[status] || statusConfig.draft;
};

// Note: formatCurrency is now provided by the component via useCurrency hook

/**
 * Format date
 */
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Loading skeleton for table rows
 */
function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-6 mb-4">
        <FileText className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        No invoices found
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        Create your first invoice to start billing your clients.
      </p>
    </div>
  );
}

/**
 * InvoiceTable component displays a list of invoices in a table format
 */
export function InvoiceTable({
  invoices,
  onView,
  onEdit,
  onClone,
  onDelete,
  onDownloadPDF,
  onMarkAsPaid,
  isLoading = false,
}: InvoiceTableProps) {

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Invoice #</TableHead>
              <TableHead className="min-w-[180px]">Client</TableHead>
              <TableHead className="min-w-[120px]">Issue Date</TableHead>
              <TableHead className="min-w-[120px]">Due Date</TableHead>
              <TableHead className="min-w-[120px] text-right">Total</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64">
                  <EmptyState />
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => {
                const statusBadge = getStatusBadge(invoice.status);
                const isPaid = invoice.status === 'paid';
                const canMarkAsPaid = !isPaid && invoice.status !== 'cancelled';

                return (
                  <TableRow 
                    key={invoice.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => onView(invoice)}
                  >
                    <TableCell className="font-medium">
                      <span className="text-gray-900 dark:text-gray-100">
                        {invoice.invoice_number}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {invoice.client?.name || 'Unknown Client'}
                        </span>
                        {invoice.client?.email && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {invoice.client.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700 dark:text-gray-300">
                        {formatDate(invoice.issue_date)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700 dark:text-gray-300">
                        {formatDate(invoice.due_date)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      <span className="text-gray-900 dark:text-gray-100">
                        {formatCurrencyAmount(invoice.total, invoice.currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadge.variant} className={statusBadge.className}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* Disable Edit for paid invoices */}
                          {invoice.status !== 'paid' && (
                            <DropdownMenuItem
                              onClick={() => onEdit(invoice)}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem
                            onClick={() => onDownloadPDF(invoice)}
                            className="cursor-pointer"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            <span>Download PDF</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => onClone(invoice)}
                            className="cursor-pointer"
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            <span>Clone</span>
                          </DropdownMenuItem>
                          
                          {canMarkAsPaid && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onMarkAsPaid(invoice)}
                                className="cursor-pointer text-green-600 dark:text-green-400 focus:text-green-600 focus:bg-green-50 dark:focus:bg-green-900/20"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                <span>Mark as Paid</span>
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          {/* Disable Delete for paid invoices */}
                          {invoice.status !== 'paid' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onDelete(invoice)}
                                className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

