'use client';

import { useState } from 'react';
import { Eye, EyeOff, FileText, Receipt, Download, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { Invoice, Quotation } from '@/types';
import { InvoiceStatus } from '@/types';

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
  default_notes?: string;
  invoice_terms?: string;
  quotation_terms?: string;
  default_currency?: string;
  default_tax_rate?: number;
}

interface TemplatePreviewProps {
  organization: OrganizationData;
}

// Sample invoice data for preview
const baseInvoice: Omit<Invoice, 'tax_rate'> = {
  id: 'preview',
  organization_id: 'preview-org',
  client_id: 'preview-client',
  invoice_number: 'INV-2025-0001',
  issue_date: new Date().toISOString(),
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  status: InvoiceStatus.SENT,
  currency: 'USD',
  subtotal: 1500.00,
  tax_total: 150.00,
  total: 1650.00,
  paid_amount: 0,
  balance: 1650.00,
  subject: 'Website Development Services',
  notes: 'Thank you for your business!',
  terms: 'Payment due within 30 days.',
  payment_method: null,
  payment_date: null,
  created_by: 'preview-user',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  items: [
    {
      id: '1',
      invoice_id: 'preview',
      description: 'Website Design & Development',
      quantity: 1,
      unit_price: 1000.00,
      tax_rate: 10,
      amount: 1000.00,
      tax_amount: 100.00,
      total: 1100.00,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      invoice_id: 'preview',
      description: 'SEO Optimization',
      quantity: 1,
      unit_price: 500.00,
      tax_rate: 10,
      amount: 500.00,
      tax_amount: 50.00,
      total: 550.00,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  client: {
    id: 'preview-client',
    organization_id: 'preview-org',
    name: 'John Doe',
    company: 'Example Company Ltd',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Business Street',
    city: 'New York',
    state: 'NY',
    postal_code: '10001',
    country: 'United States',
    tax_id: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

// Sample quotation data for preview
const baseQuotation: Quotation = {
  id: 'preview',
  organization_id: 'preview-org',
  client_id: 'preview-client',
  quotation_number: 'QUO-2025-0001',
  issue_date: new Date().toISOString(),
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'draft',
  currency: 'USD',
  subtotal: 1500.00,
  tax_total: 150.00,
  total: 1650.00,
  subject: 'Marketing Campaign Services',
  notes: 'This quotation is valid for 30 days.',
  terms: 'This quotation is valid for 30 days from the date of issue.',
  accepted_date: null,
  converted_to_invoice_id: null,
  created_by: 'preview-user',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  items: [
    {
      id: '1',
      quotation_id: 'preview',
      description: 'Social Media Management',
      quantity: 1,
      unit_price: 1000.00,
      tax_rate: 10,
      amount: 1000.00,
      tax_amount: 100.00,
      total: 1100.00,
      asset_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      quotation_id: 'preview',
      description: 'Content Creation',
      quantity: 5,
      unit_price: 100.00,
      tax_rate: 10,
      amount: 500.00,
      tax_amount: 50.00,
      total: 550.00,
      asset_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  client: {
    id: 'preview-client',
    organization_id: 'preview-org',
    name: 'Jane Smith',
    company: 'Sample Business Inc',
    email: 'jane@example.com',
    phone: '+1 (555) 987-6543',
    address: '456 Commerce Ave',
    city: 'Los Angeles',
    state: 'CA',
    postal_code: '90001',
    country: 'United States',
    tax_id: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function InvoicePreview({ organization }: TemplatePreviewProps) {
  // Calculate average tax rate from items (or use org default)
  const defaultTaxRate = organization.default_tax_rate || 10;
  const calculatedTaxRate = baseInvoice.items && baseInvoice.items.length > 0
    ? baseInvoice.items.reduce((sum, item) => sum + item.tax_rate, 0) / baseInvoice.items.length
    : defaultTaxRate;

  // Update invoice with organization settings
  const invoice = {
    ...baseInvoice,
    currency: organization.default_currency || baseInvoice.currency,
    notes: organization.default_notes || baseInvoice.notes,
    terms: organization.invoice_terms || baseInvoice.terms,
    items: baseInvoice.items?.map(item => ({
      ...item,
      tax_rate: organization.default_tax_rate || item.tax_rate,
      tax_amount: item.amount * ((organization.default_tax_rate || item.tax_rate) / 100),
      total: item.amount + (item.amount * ((organization.default_tax_rate || item.tax_rate) / 100)),
    })),
  };

  // Recalculate totals
  const subtotal = invoice.items?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const taxTotal = invoice.items?.reduce((sum, item) => sum + item.tax_amount, 0) || 0;
  const total = subtotal + taxTotal;

  // Format address (matching PDF template format)
  const formatAddress = () => {
    const parts: string[] = [];
    if (organization.company_address) parts.push(organization.company_address);
    
    const cityState: string[] = [];
    if (organization.company_city) cityState.push(organization.company_city);
    if (organization.company_state) cityState.push(organization.company_state);
    if (cityState.length > 0) parts.push(cityState.join(', '));
    
    const postalCountry: string[] = [];
    if (organization.company_postal_code) postalCountry.push(organization.company_postal_code);
    if (organization.company_country) postalCountry.push(organization.company_country);
    if (postalCountry.length > 0) parts.push(postalCountry.join(', '));
    
    return parts;
  };

  // Calculate average tax rate for display
  const avgTaxRate = invoice.items && invoice.items.length > 0
    ? Math.round((invoice.items.reduce((sum, item) => sum + item.tax_rate, 0) / invoice.items.length) * 10) / 10
    : calculatedTaxRate;

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg" style={{ maxWidth: '210mm', minHeight: '297mm', margin: '0 auto', padding: '40px', fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '10pt' }}>
      {/* Company Header - Matching PDF Template */}
      <div className="border-b-2 border-[#3b82f6] pb-4 mb-5" style={{ borderBottomWidth: '2px', borderBottomColor: '#3b82f6' }}>
        <div className="flex justify-between items-start mb-5">
          <div className="flex-1">
            {organization.company_logo_url ? (
              <img 
                src={organization.company_logo_url} 
                alt="Company Logo" 
                className="mb-2 object-contain"
                style={{ width: '140px', height: '56px', maxHeight: '56px' }}
              />
            ) : (
              <h1 className="text-lg font-bold text-gray-900 mb-2" style={{ fontSize: '18pt', fontWeight: 'bold', color: '#1f2937' }}>
                {organization.name || 'Your Company'}
              </h1>
            )}
            {organization.company_email && (
              <p className="text-xs text-gray-600 mb-0.5" style={{ fontSize: '9pt', color: '#6b7280', marginBottom: '2px' }}>
                Email: {organization.company_email}
              </p>
            )}
            {organization.company_phone && (
              <p className="text-xs text-gray-600 mb-0.5" style={{ fontSize: '9pt', color: '#6b7280', marginBottom: '2px' }}>
                Phone: {organization.company_phone}
              </p>
            )}
            {formatAddress().map((line, index) => (
              <p key={index} className="text-xs text-gray-600 mb-0.5" style={{ fontSize: '9pt', color: '#6b7280', marginBottom: '2px' }}>
                {line}
              </p>
            ))}
            {organization.company_website && (
              <p className="text-xs text-gray-600 mb-0.5" style={{ fontSize: '9pt', color: '#6b7280', marginBottom: '2px' }}>
                Web: {organization.company_website}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900 uppercase mb-1" style={{ fontSize: '14pt', fontWeight: 'bold', color: '#1f2937', textTransform: 'uppercase' }}>
              INVOICE
            </p>
            <p className="text-xs font-bold text-gray-900" style={{ fontSize: '12pt', fontWeight: 'bold', color: '#1f2937' }}>
              #{invoice.invoice_number}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Details & Client Info - Side by Side like PDF */}
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <p className="text-xs font-bold text-gray-900 mb-2" style={{ fontSize: '12pt', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
            Invoice Information
          </p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs font-bold text-gray-700" style={{ fontSize: '10pt', fontWeight: 'bold', width: '40%' }}>Issue Date:</span>
              <span className="text-xs text-gray-600" style={{ fontSize: '10pt', width: '60%' }}>{formatDate(invoice.issue_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-bold text-gray-700" style={{ fontSize: '10pt', fontWeight: 'bold', width: '40%' }}>Due Date:</span>
              <span className="text-xs text-gray-600" style={{ fontSize: '10pt', width: '60%' }}>{formatDate(invoice.due_date)}</span>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-900 mb-2" style={{ fontSize: '12pt', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
            Client Information
          </p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs font-bold text-gray-700" style={{ fontSize: '10pt', fontWeight: 'bold', width: '40%' }}>Name:</span>
              <span className="text-xs text-gray-600" style={{ fontSize: '10pt', width: '60%' }}>{invoice.client?.name || 'N/A'}</span>
            </div>
            {invoice.client?.company && (
              <div className="flex justify-between">
                <span className="text-xs font-bold text-gray-700" style={{ fontSize: '10pt', fontWeight: 'bold', width: '40%' }}>Company:</span>
                <span className="text-xs text-gray-600" style={{ fontSize: '10pt', width: '60%' }}>{invoice.client.company}</span>
              </div>
            )}
            {invoice.client?.email && (
              <div className="flex justify-between">
                <span className="text-xs font-bold text-gray-700" style={{ fontSize: '10pt', fontWeight: 'bold', width: '40%' }}>Email:</span>
                <span className="text-xs text-gray-600" style={{ fontSize: '10pt', width: '60%' }}>{invoice.client.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subject - Matching PDF Template */}
      {invoice.subject && (
        <div className="mb-4 pt-2 border-t border-gray-200">
          <p className="text-xs font-bold text-gray-900" style={{ fontSize: '12pt', fontWeight: 'bold', color: '#1f2937' }}>
            Subject: {invoice.subject}
          </p>
        </div>
      )}

      {/* Items Table - Matching PDF Template */}
      <div className="mb-4">
        <p className="text-xs font-bold text-gray-900 mb-2" style={{ fontSize: '12pt', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
          Items
        </p>
        <div className="border border-gray-200 rounded overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-4 bg-gray-100 p-2 font-bold text-xs text-gray-900" style={{ backgroundColor: '#f0f0f0', padding: '8px' }}>
            <div>Description</div>
            <div className="text-center">Qty</div>
            <div className="text-right">Unit Price</div>
            <div className="text-right">Total</div>
          </div>
          {/* Table Rows */}
          {invoice.items?.map((item, index) => {
            const itemTotal = item.quantity * item.unit_price;
            return (
              <div 
                key={index} 
                className={`grid grid-cols-4 p-2 text-xs border-b border-gray-200 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
                style={{ padding: '8px', borderBottomWidth: '1px', borderBottomColor: '#e0e0e0' }}
              >
                <div className="text-gray-900">{item.description}</div>
                <div className="text-center text-gray-600">{item.quantity}</div>
                <div className="text-right text-gray-600">{formatCurrency(item.unit_price, invoice.currency)}</div>
                <div className="text-right text-gray-900">{formatCurrency(itemTotal, invoice.currency)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Totals - Matching PDF Template */}
      <div className="flex justify-end mb-4">
        <div className="w-1/2 space-y-1">
          <div className="flex justify-end">
            <div className="flex justify-between w-full max-w-xs">
              <span className="text-xs font-bold text-gray-700 text-right pr-2" style={{ fontSize: '10pt', fontWeight: 'bold', textAlign: 'right', paddingRight: '10px', width: '50%' }}>Subtotal:</span>
              <span className="text-xs text-gray-900" style={{ fontSize: '10pt', textAlign: 'right', width: '50%' }}>{formatCurrency(subtotal, invoice.currency)}</span>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="flex justify-between w-full max-w-xs">
              <span className="text-xs font-bold text-gray-700 text-right pr-2" style={{ fontSize: '10pt', fontWeight: 'bold', textAlign: 'right', paddingRight: '10px', width: '50%' }}>Tax ({avgTaxRate.toFixed(1)}%):</span>
              <span className="text-xs text-gray-900" style={{ fontSize: '10pt', textAlign: 'right', width: '50%' }}>{formatCurrency(taxTotal, invoice.currency)}</span>
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t border-gray-300">
            <div className="flex justify-between w-full max-w-xs">
              <span className="text-sm font-bold text-gray-900 text-right pr-2" style={{ fontSize: '14pt', fontWeight: 'bold', textAlign: 'right', paddingRight: '10px', width: '50%' }}>Total:</span>
              <span className="text-sm font-bold text-blue-600" style={{ fontSize: '14pt', fontWeight: 'bold', textAlign: 'right', width: '50%', color: '#3b82f6' }}>{formatCurrency(total, invoice.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes - Matching PDF Template */}
      {invoice.notes && (
        <div className="mb-4 p-2 bg-gray-50 rounded" style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '3px' }}>
          <p className="text-xs font-bold text-gray-900 mb-1" style={{ fontSize: '12pt', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>Notes</p>
          <p className="text-xs text-gray-700 whitespace-pre-wrap" style={{ fontSize: '10pt' }}>{invoice.notes}</p>
        </div>
      )}

      {/* Terms - Matching PDF Template */}
      {invoice.terms && (
        <div className="mb-4 p-2 bg-gray-50 rounded" style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '3px' }}>
          <p className="text-xs font-bold text-gray-900 mb-1" style={{ fontSize: '12pt', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>Terms & Conditions</p>
          <p className="text-xs text-gray-700 whitespace-pre-wrap" style={{ fontSize: '10pt' }}>{invoice.terms}</p>
        </div>
      )}

      {/* Footer - Matching PDF Template */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500" style={{ marginTop: '30px', paddingTop: '10px', textAlign: 'center', color: '#666', fontSize: '8pt' }}>
        <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        <p>Thank you for your business!</p>
      </div>
    </div>
  );
}

function QuotationPreview({ organization }: TemplatePreviewProps) {
  // Update quotation with organization settings
  const quotation = {
    ...baseQuotation,
    currency: organization.default_currency || baseQuotation.currency,
    notes: organization.default_notes || baseQuotation.notes,
    terms: organization.quotation_terms || baseQuotation.terms,
    items: baseQuotation.items?.map(item => ({
      ...item,
      tax_rate: organization.default_tax_rate || item.tax_rate,
      tax_amount: item.amount * ((organization.default_tax_rate || item.tax_rate) / 100),
      total: item.amount + (item.amount * ((organization.default_tax_rate || item.tax_rate) / 100)),
    })),
  };

  // Recalculate totals
  const subtotal = quotation.items?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const taxTotal = quotation.items?.reduce((sum, item) => sum + item.tax_amount, 0) || 0;
  const total = subtotal + taxTotal;

  // Format address (matching PDF template format)
  const formatAddress = () => {
    const parts: string[] = [];
    if (organization.company_address) parts.push(organization.company_address);
    
    const cityState: string[] = [];
    if (organization.company_city) cityState.push(organization.company_city);
    if (organization.company_state) cityState.push(organization.company_state);
    if (cityState.length > 0) parts.push(cityState.join(', '));
    
    const postalCountry: string[] = [];
    if (organization.company_postal_code) postalCountry.push(organization.company_postal_code);
    if (organization.company_country) postalCountry.push(organization.company_country);
    if (postalCountry.length > 0) parts.push(postalCountry.join(', '));
    
    return parts;
  };

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg" style={{ maxWidth: '210mm', minHeight: '297mm', margin: '0 auto', padding: '40px', fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '10pt' }}>
      {/* Company Header - Matching PDF Template */}
      <div className="border-b-2 border-[#3b82f6] pb-4 mb-5" style={{ borderBottomWidth: '2px', borderBottomColor: '#3b82f6' }}>
        <div className="flex justify-between items-start mb-5">
          <div className="flex-1">
            {organization.company_logo_url ? (
              <img 
                src={organization.company_logo_url} 
                alt="Company Logo" 
                className="mb-2 object-contain"
                style={{ width: '140px', height: '56px', maxHeight: '56px' }}
              />
            ) : (
              <h1 className="text-lg font-bold text-gray-900 mb-2" style={{ fontSize: '18pt', fontWeight: 'bold', color: '#1f2937' }}>
                {organization.name || 'Your Company'}
              </h1>
            )}
            {organization.company_email && (
              <p className="text-xs text-gray-600 mb-0.5" style={{ fontSize: '9pt', color: '#6b7280', marginBottom: '2px' }}>
                Email: {organization.company_email}
              </p>
            )}
            {organization.company_phone && (
              <p className="text-xs text-gray-600 mb-0.5" style={{ fontSize: '9pt', color: '#6b7280', marginBottom: '2px' }}>
                Phone: {organization.company_phone}
              </p>
            )}
            {formatAddress().map((line, index) => (
              <p key={index} className="text-xs text-gray-600 mb-0.5" style={{ fontSize: '9pt', color: '#6b7280', marginBottom: '2px' }}>
                {line}
              </p>
            ))}
            {organization.company_website && (
              <p className="text-xs text-gray-600 mb-0.5" style={{ fontSize: '9pt', color: '#6b7280', marginBottom: '2px' }}>
                Web: {organization.company_website}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900 uppercase mb-1" style={{ fontSize: '14pt', fontWeight: 'bold', color: '#1f2937', textTransform: 'uppercase' }}>
              QUOTATION
            </p>
            <p className="text-xs font-bold text-gray-900" style={{ fontSize: '12pt', fontWeight: 'bold', color: '#1f2937' }}>
              #{quotation.quotation_number}
            </p>
          </div>
        </div>
      </div>

      {/* Quotation Details & Client Info - Side by Side like PDF */}
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <p className="text-xs font-bold text-gray-900 mb-2" style={{ fontSize: '12pt', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
            Quotation Information
          </p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs font-bold text-gray-700" style={{ fontSize: '10pt', fontWeight: 'bold', width: '40%' }}>Issue Date:</span>
              <span className="text-xs text-gray-600" style={{ fontSize: '10pt', width: '60%' }}>{formatDate(quotation.issue_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-bold text-gray-700" style={{ fontSize: '10pt', fontWeight: 'bold', width: '40%' }}>Valid Until:</span>
              <span className="text-xs text-gray-600" style={{ fontSize: '10pt', width: '60%' }}>{formatDate(quotation.valid_until)}</span>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-900 mb-2" style={{ fontSize: '12pt', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
            Client Information
          </p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs font-bold text-gray-700" style={{ fontSize: '10pt', fontWeight: 'bold', width: '40%' }}>Name:</span>
              <span className="text-xs text-gray-600" style={{ fontSize: '10pt', width: '60%' }}>{quotation.client?.name || 'N/A'}</span>
            </div>
            {quotation.client?.company && (
              <div className="flex justify-between">
                <span className="text-xs font-bold text-gray-700" style={{ fontSize: '10pt', fontWeight: 'bold', width: '40%' }}>Company:</span>
                <span className="text-xs text-gray-600" style={{ fontSize: '10pt', width: '60%' }}>{quotation.client.company}</span>
              </div>
            )}
            {quotation.client?.email && (
              <div className="flex justify-between">
                <span className="text-xs font-bold text-gray-700" style={{ fontSize: '10pt', fontWeight: 'bold', width: '40%' }}>Email:</span>
                <span className="text-xs text-gray-600" style={{ fontSize: '10pt', width: '60%' }}>{quotation.client.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subject - Matching PDF Template */}
      {quotation.subject && (
        <div className="mb-4 pt-2 border-t border-gray-200">
          <p className="text-xs font-bold text-gray-900" style={{ fontSize: '12pt', fontWeight: 'bold', color: '#1f2937' }}>
            Subject: {quotation.subject}
          </p>
        </div>
      )}

      {/* Items Table - Matching PDF Template (5 columns for quotations) */}
      <div className="mb-4">
        <p className="text-xs font-bold text-gray-900 mb-2" style={{ fontSize: '12pt', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
          Items
        </p>
        <div className="border border-gray-200 rounded overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-5 bg-gray-100 p-2 font-bold text-xs text-gray-900" style={{ backgroundColor: '#f0f0f0', padding: '8px' }}>
            <div>Description</div>
            <div className="text-center">Qty</div>
            <div className="text-right">Unit Price</div>
            <div className="text-center">Tax %</div>
            <div className="text-right">Total</div>
          </div>
          {/* Table Rows */}
          {quotation.items?.map((item, index) => (
            <div 
              key={index} 
              className={`grid grid-cols-5 p-2 text-xs border-b border-gray-200 ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
              style={{ padding: '8px', borderBottomWidth: '1px', borderBottomColor: '#e0e0e0' }}
            >
              <div className="text-gray-900">{item.description}</div>
              <div className="text-center text-gray-600">{item.quantity}</div>
              <div className="text-right text-gray-600">{formatCurrency(item.unit_price, quotation.currency)}</div>
              <div className="text-center text-gray-600">{item.tax_rate}%</div>
              <div className="text-right text-gray-900">{formatCurrency(item.total, quotation.currency)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals - Matching PDF Template */}
      <div className="flex justify-end mb-4">
        <div className="w-1/2 space-y-1">
          <div className="flex justify-end">
            <div className="flex justify-between w-full max-w-xs">
              <span className="text-xs font-bold text-gray-700 text-right pr-2" style={{ fontSize: '10pt', fontWeight: 'bold', textAlign: 'right', paddingRight: '10px', width: '50%' }}>Subtotal:</span>
              <span className="text-xs text-gray-900" style={{ fontSize: '10pt', textAlign: 'right', width: '50%' }}>{formatCurrency(subtotal, quotation.currency)}</span>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="flex justify-between w-full max-w-xs">
              <span className="text-xs font-bold text-gray-700 text-right pr-2" style={{ fontSize: '10pt', fontWeight: 'bold', textAlign: 'right', paddingRight: '10px', width: '50%' }}>Tax:</span>
              <span className="text-xs text-gray-900" style={{ fontSize: '10pt', textAlign: 'right', width: '50%' }}>{formatCurrency(taxTotal, quotation.currency)}</span>
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t border-gray-300">
            <div className="flex justify-between w-full max-w-xs">
              <span className="text-sm font-bold text-gray-900 text-right pr-2" style={{ fontSize: '14pt', fontWeight: 'bold', textAlign: 'right', paddingRight: '10px', width: '50%' }}>Total:</span>
              <span className="text-sm font-bold text-blue-600" style={{ fontSize: '14pt', fontWeight: 'bold', textAlign: 'right', width: '50%', color: '#3b82f6' }}>{formatCurrency(total, quotation.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes - Matching PDF Template */}
      {quotation.notes && (
        <div className="mb-4 p-2 bg-gray-50 rounded" style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '3px' }}>
          <p className="text-xs font-bold text-gray-900 mb-1" style={{ fontSize: '12pt', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>Notes</p>
          <p className="text-xs text-gray-700 whitespace-pre-wrap" style={{ fontSize: '10pt' }}>{quotation.notes}</p>
        </div>
      )}

      {/* Terms - Matching PDF Template */}
      {quotation.terms && (
        <div className="mb-4 p-2 bg-gray-50 rounded" style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '3px' }}>
          <p className="text-xs font-bold text-gray-900 mb-1" style={{ fontSize: '12pt', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>Terms & Conditions</p>
          <p className="text-xs text-gray-700 whitespace-pre-wrap" style={{ fontSize: '10pt' }}>{quotation.terms}</p>
        </div>
      )}

      {/* Footer - Matching PDF Template */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500" style={{ marginTop: '30px', paddingTop: '10px', textAlign: 'center', color: '#666', fontSize: '8pt' }}>
        <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        <p>Thank you for your business!</p>
      </div>
    </div>
  );
}

export function TemplatePreview({ organization }: TemplatePreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'invoice' | 'quotation'>('invoice');

  if (!showPreview) {
    return (
      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-blue-600" />
            Template Preview
          </CardTitle>
          <CardDescription className="text-sm">
            See exactly how your invoices and quotations will appear when downloaded as PDF. 
            Preview reflects your current organization settings in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setShowPreview(true)} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <Eye className="mr-2 h-5 w-5" />
            Show Preview
          </Button>
          <p className="text-xs text-gray-500 mt-3 text-center">
            💡 This preview matches your actual PDF templates exactly
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
      <CardHeader className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-blue-600" />
              Template Preview
              <Badge variant="secondary" className="ml-2 text-xs">
                Live Preview
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              This preview matches your actual PDF templates. Changes to organization settings update automatically.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setIsFullscreen(!isFullscreen)} 
              variant="outline" 
              size="sm"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen preview"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button 
              onClick={() => setShowPreview(false)} 
              variant="ghost" 
              size="sm"
            >
              <EyeOff className="mr-2 h-4 w-4" />
              Hide
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'invoice' | 'quotation')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 p-1">
            <TabsTrigger value="invoice" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Receipt className="h-4 w-4" />
              Invoice Template
            </TabsTrigger>
            <TabsTrigger value="quotation" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <FileText className="h-4 w-4" />
              Quotation Template
            </TabsTrigger>
          </TabsList>
          <TabsContent value="invoice" className="mt-0">
            <div 
              className={`bg-gray-100 rounded-lg overflow-x-auto p-4 ${isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : ''}`} 
              style={isFullscreen ? { 
                position: 'fixed', 
                top: '16px', 
                right: '16px', 
                bottom: '16px', 
                left: '16px', 
                zIndex: 50, 
                backgroundColor: '#f3f4f6', 
                padding: '16px', 
                borderRadius: '8px', 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflowY: 'auto'
              } : {}}
            >
              <div className="inline-block min-w-full">
                <InvoicePreview organization={organization} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="quotation" className="mt-0">
            <div 
              className={`bg-gray-100 rounded-lg overflow-x-auto p-4 ${isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : ''}`} 
              style={isFullscreen ? { 
                position: 'fixed', 
                top: '16px', 
                right: '16px', 
                bottom: '16px', 
                left: '16px', 
                zIndex: 50, 
                backgroundColor: '#f3f4f6', 
                padding: '16px', 
                borderRadius: '8px', 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflowY: 'auto'
              } : {}}
            >
              <div className="inline-block min-w-full">
                <QuotationPreview organization={organization} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-700">💡 Tip:</span>
            <span>This preview uses your organization settings. Update settings above to see changes instantly.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
