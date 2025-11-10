import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Invoice } from '@/types';

// Register fonts (optional - uses default fonts if not registered)
// Font.register({
//   family: 'Roboto',
//   src: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxK.woff2',
// });

/**
 * Styles for the invoice PDF
 */
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333333',
  },
  // Header section
  header: {
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#2563EB',
    marginBottom: 8,
  },
  companyAddress: {
    fontSize: 9,
    lineHeight: 1.4,
    color: '#666666',
  },
  invoiceTitle: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
    textAlign: 'right',
  },
  // Invoice details section
  detailsSection: {
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailsColumn: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 9,
    color: '#666666',
    width: 80,
  },
  detailValue: {
    fontSize: 10,
    color: '#333333',
    flex: 1,
  },
  // Bill To section
  billToBox: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 4,
    border: '1px solid #E5E7EB',
  },
  billToTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  billToName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
    marginBottom: 4,
  },
  billToText: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.4,
  },
  // Line items table
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    padding: 8,
    borderRadius: 4,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #E5E7EB',
    padding: 10,
  },
  tableRowAlt: {
    backgroundColor: '#F9FAFB',
  },
  tableCell: {
    fontSize: 9,
    color: '#333333',
  },
  tableCellBold: {
    fontFamily: 'Helvetica-Bold',
  },
  // Column widths
  colDescription: {
    flex: 3,
  },
  colQuantity: {
    flex: 1,
    textAlign: 'right',
  },
  colPrice: {
    flex: 1,
    textAlign: 'right',
  },
  colAmount: {
    flex: 1,
    textAlign: 'right',
  },
  // Totals section
  totalsSection: {
    marginTop: 20,
    marginLeft: 'auto',
    width: 250,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 10,
  },
  totalLabel: {
    fontSize: 10,
    color: '#666666',
  },
  totalValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
  },
  totalSeparator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 4,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  grandTotalValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  // Status badge
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusPaid: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  statusSent: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
  },
  statusDraft: {
    backgroundColor: '#F3F4F6',
    color: '#374151',
  },
  statusOverdue: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  // Notes section
  notesSection: {
    marginTop: 30,
  },
  notesTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.5,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTop: '1px solid #E5E7EB',
    paddingTop: 15,
  },
  footerText: {
    fontSize: 8,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 1.4,
  },
});

/**
 * Format currency values
 */
const formatCurrency = (value: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(value);
};

/**
 * Format date
 */
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Get status badge style
 */
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'paid':
      return styles.statusPaid;
    case 'sent':
      return styles.statusSent;
    case 'overdue':
      return styles.statusOverdue;
    default:
      return styles.statusDraft;
  }
};

interface InvoiceTemplateProps {
  invoice: Invoice;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
}

/**
 * Invoice PDF Template Component
 */
export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  invoice,
  companyName = 'Asset Tracer',
  companyAddress = '123 Business Street\nSuite 100\nNew York, NY 10001',
  companyPhone = '+1 (555) 123-4567',
  companyEmail = 'billing@assettracer.com',
  companyWebsite = 'www.assettracer.com',
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companyAddress}>{companyAddress}</Text>
            <Text style={styles.companyAddress}>{companyPhone}</Text>
            <Text style={styles.companyAddress}>{companyEmail}</Text>
            <Text style={styles.companyAddress}>{companyWebsite}</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={[styles.statusBadge, getStatusStyle(invoice.status)]}>
              <Text style={styles.statusText}>{invoice.status}</Text>
            </View>
          </View>
        </View>

        {/* Invoice Details and Bill To */}
        <View style={styles.detailsSection}>
          {/* Invoice Details */}
          <View style={styles.detailsColumn}>
            <Text style={styles.sectionTitle}>Invoice Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Invoice #:</Text>
              <Text style={styles.detailValue}>{invoice.invoice_number}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Issue Date:</Text>
              <Text style={styles.detailValue}>{formatDate(invoice.issue_date)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Due Date:</Text>
              <Text style={styles.detailValue}>{formatDate(invoice.due_date)}</Text>
            </View>
            {invoice.payment_date && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Paid Date:</Text>
                <Text style={styles.detailValue}>{formatDate(invoice.payment_date)}</Text>
              </View>
            )}
          </View>

          {/* Bill To */}
          <View style={styles.detailsColumn}>
            <View style={styles.billToBox}>
              <Text style={styles.billToTitle}>Bill To</Text>
              <Text style={styles.billToName}>{invoice.client?.name || 'Client Name'}</Text>
              {invoice.client?.company && (
                <Text style={styles.billToText}>{invoice.client.company}</Text>
              )}
              {invoice.client?.address && (
                <Text style={styles.billToText}>{invoice.client.address}</Text>
              )}
              {invoice.client?.city && invoice.client?.state && (
                <Text style={styles.billToText}>
                  {invoice.client.city}, {invoice.client.state} {invoice.client.postal_code}
                </Text>
              )}
              {invoice.client?.email && (
                <Text style={styles.billToText}>{invoice.client.email}</Text>
              )}
              {invoice.client?.phone && (
                <Text style={styles.billToText}>{invoice.client.phone}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Subject */}
        {invoice.subject && (
          <View style={{ marginBottom: 20, marginTop: 20, paddingTop: 15, borderTop: '1px solid #E5E7EB' }}>
            <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#333333' }}>
              Subject: {invoice.subject}
            </Text>
          </View>
        )}

        {/* Line Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colQuantity]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Price</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
          </View>

          {/* Table Rows */}
          {invoice.items?.map((item, index) => (
            <View
              key={item.id}
              style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
            >
              <Text style={[styles.tableCell, styles.colDescription]}>{item.description}</Text>
              <Text style={[styles.tableCell, styles.colQuantity]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>
                {formatCurrency(item.unit_price, invoice.currency)}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellBold, styles.colAmount]}>
                {formatCurrency(item.amount, invoice.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.subtotal, invoice.currency)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.tax_total, invoice.currency)}
            </Text>
          </View>
          <View style={styles.totalSeparator} />
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Due:</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(invoice.total, invoice.currency)}
            </Text>
          </View>
          {invoice.paid_amount > 0 && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Amount Paid:</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(invoice.paid_amount, invoice.currency)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, styles.tableCellBold]}>Balance Due:</Text>
                <Text style={[styles.totalValue, { color: '#DC2626' }]}>
                  {formatCurrency(invoice.balance, invoice.currency)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          {invoice.terms && (
            <Text style={styles.footerText}>{invoice.terms}</Text>
          )}
          <Text style={styles.footerText}>
            Thank you for your business!
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoiceTemplate;

