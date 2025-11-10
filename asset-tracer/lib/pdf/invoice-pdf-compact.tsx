import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Invoice } from '@/types';

// Organization data type
interface OrganizationData {
  name: string;
  company_email?: string;
  company_phone?: string;
  company_address?: string;
  company_city?: string;
  company_state?: string;
  company_postal_code?: string;
  company_country?: string;
  company_website?: string;
  company_logo_url?: string;
}

// Compact PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 3,
    borderBottomColor: '#1e293b',
  },
  headerLeft: {
    flex: 2,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  companyDetails: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 2,
  },
  documentTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  documentNumber: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  infoColumn: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 7,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 9,
    color: '#1e293b',
    marginBottom: 8,
  },
  clientBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  clientName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  clientText: {
    fontSize: 8,
    color: '#475569',
    marginBottom: 2,
  },
  subjectBox: {
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 4,
    marginBottom: 20,
  },
  subjectText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 9,
    color: '#1e293b',
  },
  tableCellBold: {
    fontWeight: 'bold',
  },
  colDesc: { width: '55%' },
  colQty: { width: '10%', textAlign: 'right' },
  colPrice: { width: '20%', textAlign: 'right' },
  colTotal: { width: '15%', textAlign: 'right' },
  totals: {
    marginTop: 10,
    marginLeft: 'auto',
    width: 250,
    borderTopWidth: 2,
    borderTopColor: '#1e293b',
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 9,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
  },
  grandTotalLabel: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  grandTotalValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  notesBox: {
    backgroundColor: '#f8fafc',
    borderLeftWidth: 3,
    borderLeftColor: '#1e293b',
    padding: 12,
    marginBottom: 15,
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 8,
    color: '#475569',
    lineHeight: 1.5,
  },
  termsBox: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    padding: 12,
    marginBottom: 15,
  },
  termsTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  termsText: {
    fontSize: 8,
    color: '#78350f',
    lineHeight: 1.5,
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#94a3b8',
  },
  logo: {
    width: 120,
    height: 40,
    objectFit: 'contain',
  },
});

interface InvoicePDFCompactProps {
  invoice: Invoice;
  organization?: OrganizationData;
}

export function InvoicePDFCompact({ invoice, organization }: InvoicePDFCompactProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format address
  const formatAddress = () => {
    const parts = [];
    if (organization?.company_address) parts.push(organization.company_address);
    
    const cityState = [];
    if (organization?.company_city) cityState.push(organization.company_city);
    if (organization?.company_state) cityState.push(organization.company_state);
    if (cityState.length > 0) parts.push(cityState.join(', '));
    
    const postalCountry = [];
    if (organization?.company_postal_code) postalCountry.push(organization.company_postal_code);
    if (organization?.company_country) postalCountry.push(organization.company_country);
    if (postalCountry.length > 0) parts.push(postalCountry.join(', '));
    
    return parts;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with logo and invoice title */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {organization?.company_logo_url ? (
              <Image src={organization.company_logo_url} style={styles.logo} alt="Company Logo" />
            ) : (
              <Text style={styles.companyName}>{organization?.name || 'Your Company'}</Text>
            )}
            {organization?.company_email && (
              <Text style={styles.companyDetails}>✉ {organization.company_email}</Text>
            )}
            {organization?.company_phone && (
              <Text style={styles.companyDetails}>📞 {organization.company_phone}</Text>
            )}
            {formatAddress().map((line, index) => (
              <Text key={index} style={styles.companyDetails}>{line}</Text>
            ))}
            {organization?.company_website && (
              <Text style={styles.companyDetails}>🌐 {organization.company_website}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.documentTitle}>INVOICE</Text>
            <Text style={styles.documentNumber}>#{invoice.invoice_number}</Text>
          </View>
        </View>

        {/* Info grid: dates and status */}
        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Issue Date</Text>
            <Text style={styles.infoValue}>{formatDate(invoice.issue_date)}</Text>
            <Text style={styles.infoLabel}>Due Date</Text>
            <Text style={styles.infoValue}>{formatDate(invoice.due_date)}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>
              {invoice.status === 'paid' && '✓ PAID'}
              {invoice.status === 'sent' && '📤 SENT'}
              {invoice.status === 'overdue' && '⚠ OVERDUE'}
              {invoice.status === 'draft' && '📝 DRAFT'}
              {invoice.status === 'cancelled' && '✗ CANCELLED'}
            </Text>
            {invoice.payment_date && (
              <>
                <Text style={styles.infoLabel}>Paid Date</Text>
                <Text style={styles.infoValue}>{formatDate(invoice.payment_date)}</Text>
              </>
            )}
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.clientBox}>
          <Text style={styles.clientName}>Bill To</Text>
          <Text style={styles.clientText}>{invoice.client?.name || 'N/A'}</Text>
          {invoice.client?.company && (
            <Text style={styles.clientText}>{invoice.client.company}</Text>
          )}
          {invoice.client?.email && (
            <Text style={styles.clientText}>{invoice.client.email}</Text>
          )}
          {invoice.client?.phone && (
            <Text style={styles.clientText}>{invoice.client.phone}</Text>
          )}
        </View>

        {/* Subject */}
        {invoice.subject && (
          <View style={styles.subjectBox}>
            <Text style={styles.subjectText}>{invoice.subject}</Text>
          </View>
        )}

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>
          {invoice.items?.map((item, index) => {
            const itemTotal = item.quantity * item.unit_price;
            return (
              <View key={index} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                <Text style={[styles.tableCell, styles.colDesc]}>{item.description}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.colPrice]}>
                  {formatCurrency(item.unit_price)}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellBold, styles.colTotal]}>
                  {formatCurrency(itemTotal)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.tax_total)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Due</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
          </View>
          {invoice.paid_amount > 0 && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Paid:</Text>
                <Text style={styles.totalValue}>{formatCurrency(invoice.paid_amount)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: '#dc2626' }]}>Balance:</Text>
                <Text style={[styles.totalValue, { color: '#dc2626' }]}>
                  {formatCurrency(invoice.balance)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Terms */}
        {invoice.terms && (
          <View style={styles.termsBox}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>{invoice.terms}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </Text>
          <Text style={styles.footerText}>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
}

