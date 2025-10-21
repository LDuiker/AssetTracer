'use client';

import { MoreVertical, Edit, Trash2, FileText, Send, CheckCircle, XCircle, Clock, Copy, Download } from 'lucide-react';
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
import type { Quotation } from '@/types';

interface QuotationTableProps {
  quotations: Quotation[];
  onView: (quotation: Quotation) => void;
  onEdit: (quotation: Quotation) => void;
  onClone?: (quotation: Quotation) => void;
  onConvertToInvoice?: (quotation: Quotation) => void;
  onDownloadPDF?: (quotation: Quotation) => void;
  onDelete: (quotation: Quotation) => void;
  isLoading?: boolean;
}

type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'invoiced';

/**
 * Get status badge configuration
 */
const getStatusConfig = (status: QuotationStatus) => {
  const statusConfig = {
    draft: {
      label: 'Draft',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      icon: FileText,
    },
    sent: {
      label: 'Sent',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      icon: Send,
    },
    accepted: {
      label: 'Accepted',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      icon: CheckCircle,
    },
    rejected: {
      label: 'Rejected',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      icon: XCircle,
    },
    expired: {
      label: 'Expired',
      className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      icon: Clock,
    },
    invoiced: {
      label: 'Invoiced',
      className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      icon: FileText,
    },
  };

  return statusConfig[status] || statusConfig.draft;
};

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
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
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
        No quotations found
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        Create your first quotation to start sending proposals to clients.
      </p>
    </div>
  );
}

/**
 * QuotationTable component displays a list of quotations in a table format
 */
export function QuotationTable({
  quotations,
  onView,
  onEdit,
  onClone,
  onConvertToInvoice,
  onDownloadPDF,
  onDelete,
  isLoading = false,
}: QuotationTableProps) {

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Quotation #</TableHead>
              <TableHead className="min-w-[180px]">Client</TableHead>
              <TableHead className="min-w-[110px]">Issue Date</TableHead>
              <TableHead className="min-w-[110px]">Valid Until</TableHead>
              <TableHead className="min-w-[120px] text-right">Total</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="w-[60px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : quotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64">
                  <EmptyState />
                </TableCell>
              </TableRow>
            ) : (
              quotations.map((quotation) => {
                const statusConfig = getStatusConfig(quotation.status as QuotationStatus);
                const StatusIcon = statusConfig.icon;

                return (
                  <TableRow 
                    key={quotation.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => onView(quotation)}
                  >
                    <TableCell className="font-medium">
                      {quotation.quotation_number}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {quotation.client?.name || 'Unknown Client'}
                        </span>
                        {quotation.client?.company && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {quotation.client.company}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(quotation.issue_date)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(quotation.valid_until)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrencyAmount(quotation.total, quotation.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig.className}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {/* Disable Edit for invoiced quotations */}
                          {!(quotation.status === 'invoiced' || quotation.converted_to_invoice_id) && (
                            <DropdownMenuItem onClick={() => onEdit(quotation)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          
                          {onClone && (
                            <DropdownMenuItem onClick={() => onClone(quotation)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Clone
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          {onConvertToInvoice && quotation.status === 'accepted' && !quotation.converted_to_invoice_id && (
                            <DropdownMenuItem 
                              onClick={() => onConvertToInvoice(quotation)}
                              className="text-purple-600 focus:text-purple-600"
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Convert to Invoice
                            </DropdownMenuItem>
                          )}
                          
                          {onDownloadPDF && (
                            <DropdownMenuItem onClick={() => onDownloadPDF(quotation)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          {/* Always show Delete option */}
                          <DropdownMenuItem
                            onClick={() => onDelete(quotation)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
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

