import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Quotation } from '@/types';

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

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
    width: '40%',
  },
  value: {
    width: '60%',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    padding: 8,
  },
  tableCol1: { width: '40%' },
  tableCol2: { width: '15%', textAlign: 'right' },
  tableCol3: { width: '15%', textAlign: 'right' },
  tableCol4: { width: '15%', textAlign: 'right' },
  tableCol5: { width: '15%', textAlign: 'right' },
  totals: {
    marginTop: 15,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
    width: '50%',
  },
  totalLabel: {
    fontWeight: 'bold',
    width: '50%',
    textAlign: 'right',
    paddingRight: 10,
  },
  totalValue: {
    width: '50%',
    textAlign: 'right',
  },
  grandTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statusBadge: {
    padding: 5,
    borderRadius: 3,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
  },
  notes: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#666',
    fontSize: 8,
  },
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  companyInfo: {
    flex: 1,
  },
  companyDetails: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  logo: {
    width: 140,
    height: 56,
    objectFit: 'contain',
  },
  documentNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'right',
    marginTop: 3,
  },
  documentType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'right',
    textTransform: 'uppercase',
  },
  subjectText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 10,
    marginBottom: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});

interface QuotationPDFProps {
  quotation: Quotation;
  organization?: OrganizationData;
}

export function QuotationPDF({ quotation, organization }: QuotationPDFProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: quotation.currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
        {/* Company Header */}
        <View style={styles.companyHeader}>
          <View style={styles.companyInfo}>
            {organization?.company_logo_url ? (
              <Image src={organization.company_logo_url} style={styles.logo} alt="Company Logo" />
            ) : (
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>
                {organization?.name || 'Your Company'}
              </Text>
            )}
            {organization?.company_email && (
              <Text style={styles.companyDetails}>Email: {organization.company_email}</Text>
            )}
            {organization?.company_phone && (
              <Text style={styles.companyDetails}>Phone: {organization.company_phone}</Text>
            )}
            {formatAddress().map((line, index) => (
              <Text key={index} style={styles.companyDetails}>{line}</Text>
            ))}
            {organization?.company_website && (
              <Text style={styles.companyDetails}>Web: {organization.company_website}</Text>
            )}
          </View>
          <View>
            <Text style={styles.documentType}>QUOTATION</Text>
            <Text style={styles.documentNumber}>#{quotation.quotation_number}</Text>
          </View>
        </View>

        {/* Quotation Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quotation Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Issue Date:</Text>
            <Text style={styles.value}>{formatDate(quotation.issue_date)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Valid Until:</Text>
            <Text style={styles.value}>{formatDate(quotation.valid_until)}</Text>
          </View>
        </View>

        {/* Client Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{quotation.client?.name || 'N/A'}</Text>
          </View>
          {quotation.client?.company && (
            <View style={styles.row}>
              <Text style={styles.label}>Company:</Text>
              <Text style={styles.value}>{quotation.client.company}</Text>
            </View>
          )}
          {quotation.client?.email && (
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{quotation.client.email}</Text>
            </View>
          )}
        </View>

        {/* Subject */}
        {quotation.subject && (
          <View>
            <Text style={styles.subjectText}>Subject: {quotation.subject}</Text>
          </View>
        )}

        {/* Line Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCol1}>Description</Text>
              <Text style={styles.tableCol2}>Qty</Text>
              <Text style={styles.tableCol3}>Unit Price</Text>
              <Text style={styles.tableCol4}>Tax %</Text>
              <Text style={styles.tableCol5}>Total</Text>
            </View>
            {quotation.items?.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCol1}>{item.description}</Text>
                <Text style={styles.tableCol2}>{item.quantity}</Text>
                <Text style={styles.tableCol3}>{formatCurrency(item.unit_price)}</Text>
                <Text style={styles.tableCol4}>{item.tax_rate}%</Text>
                <Text style={styles.tableCol5}>{formatCurrency(item.total)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(quotation.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax:</Text>
            <Text style={styles.totalValue}>{formatCurrency(quotation.tax_total)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatCurrency(quotation.total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {quotation.notes && (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text>{quotation.notes}</Text>
          </View>
        )}

        {/* Terms */}
        {quotation.terms && (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            <Text>{quotation.terms}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </Text>
          <Text>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
}

