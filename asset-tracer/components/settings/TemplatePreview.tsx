'use client';

import { useState } from 'react';
import { Eye, EyeOff, FileText, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import type { Invoice, Quotation, InvoiceStatus } from '@/types';

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
const sampleInvoice: Invoice = {
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
const sampleQuotation: Quotation = {
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
  const invoice = sampleInvoice;
  const formatAddr = () => {
    const parts = [];
    if (organization.company_address) parts.push(organization.company_address);
    const cityState = [];
    if (organization.company_city) cityState.push(organization.company_city);
    if (organization.company_state) cityState.push(organization.company_state);
    if (cityState.length > 0) parts.push(cityState.join(', '));
    const postalCountry = [];
    if (organization.company_postal_code) postalCountry.push(organization.company_postal_code);
    if (organization.company_country) postalCountry.push(organization.company_country);
    if (postalCountry.length > 0) parts.push(postalCountry.join(', '));
    return parts;
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
      {/* Company Header */}
      <div className="border-b-2 border-[#2563EB] pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {organization.company_logo_url ? (
              <img 
                src={organization.company_logo_url} 
                alt="Company Logo" 
                className="h-16 mb-2 object-contain"
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {organization.name || 'Your Company'}
              </h1>
            )}
            {organization.company_email && (
              <p className="text-sm text-gray-600">Email: {organization.company_email}</p>
            )}
            {organization.company_phone && (
              <p className="text-sm text-gray-600">Phone: {organization.company_phone}</p>
            )}
            {formatAddr().map((line, index) => (
              <p key={index} className="text-sm text-gray-600">{line}</p>
            ))}
            {organization.company_website && (
              <p className="text-sm text-gray-600">Web: {organization.company_website}</p>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-900 mb-1">INVOICE</h2>
            <p className="text-lg font-semibold text-[#2563EB]">#{invoice.invoice_number}</p>
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Invoice Information</h3>
          <p className="text-sm text-gray-600">Issue Date: {formatDate(invoice.issue_date)}</p>
          <p className="text-sm text-gray-600">Due Date: {formatDate(invoice.due_date)}</p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Bill To</h3>
          <p className="text-sm text-gray-900 font-medium">{invoice.client?.name}</p>
          {invoice.client?.company && (
            <p className="text-sm text-gray-600">{invoice.client.company}</p>
          )}
          {invoice.client?.email && (
            <p className="text-sm text-gray-600">{invoice.client.email}</p>
          )}
        </div>
      </div>

      {/* Subject */}
      {invoice.subject && (
        <div className="mb-4">
          <p className="font-semibold text-gray-900">Subject: {invoice.subject}</p>
        </div>
      )}

      {/* Items Table */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="grid grid-cols-4 gap-4 bg-gray-100 p-3 font-semibold text-sm text-gray-900 border-b border-gray-300">
            <div>Description</div>
            <div className="text-center">Qty</div>
            <div className="text-right">Unit Price</div>
            <div className="text-right">Total</div>
          </div>
          {invoice.items?.map((item, index) => (
            <div 
              key={index} 
              className={`grid grid-cols-4 gap-4 p-3 text-sm ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <div className="text-gray-900">{item.description}</div>
              <div className="text-center text-gray-600">{item.quantity}</div>
              <div className="text-right text-gray-600">
                {formatCurrency(item.unit_price, invoice.currency)}
              </div>
              <div className="text-right font-semibold text-gray-900">
                {formatCurrency(item.total, invoice.currency)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="ml-auto w-64 mb-6">
        <div className="flex justify-between py-2 border-b border-gray-300">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-300">
          <span className="text-gray-600">Tax:</span>
          <span className="font-medium">{formatCurrency(invoice.tax_total, invoice.currency)}</span>
        </div>
        <div className="flex justify-between py-3 bg-[#2563EB]/10 rounded">
          <span className="font-bold text-gray-900">Total:</span>
          <span className="font-bold text-[#2563EB] text-lg">
            {formatCurrency(invoice.total, invoice.currency)}
          </span>
        </div>
      </div>

      {/* Notes & Terms */}
      {invoice.notes && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-1">Notes</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}
      {invoice.terms && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-1">Terms & Conditions</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {organization.invoice_terms || invoice.terms}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
        <p>Generated on {new Date().toLocaleDateString()}</p>
        <p className="mt-1">Thank you for your business!</p>
      </div>
    </div>
  );
}

function QuotationPreview({ organization }: TemplatePreviewProps) {
  const quotation = sampleQuotation;
  const formatAddr = () => {
    const parts = [];
    if (organization.company_address) parts.push(organization.company_address);
    const cityState = [];
    if (organization.company_city) cityState.push(organization.company_city);
    if (organization.company_state) cityState.push(organization.company_state);
    if (cityState.length > 0) parts.push(cityState.join(', '));
    const postalCountry = [];
    if (organization.company_postal_code) postalCountry.push(organization.company_postal_code);
    if (organization.company_country) postalCountry.push(organization.company_country);
    if (postalCountry.length > 0) parts.push(postalCountry.join(', '));
    return parts;
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
      {/* Company Header */}
      <div className="border-b-2 border-[#2563EB] pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {organization.company_logo_url ? (
              <img 
                src={organization.company_logo_url} 
                alt="Company Logo" 
                className="h-16 mb-2 object-contain"
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {organization.name || 'Your Company'}
              </h1>
            )}
            {organization.company_email && (
              <p className="text-sm text-gray-600">Email: {organization.company_email}</p>
            )}
            {organization.company_phone && (
              <p className="text-sm text-gray-600">Phone: {organization.company_phone}</p>
            )}
            {formatAddr().map((line, index) => (
              <p key={index} className="text-sm text-gray-600">{line}</p>
            ))}
            {organization.company_website && (
              <p className="text-sm text-gray-600">Web: {organization.company_website}</p>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-900 mb-1">QUOTATION</h2>
            <p className="text-lg font-semibold text-[#2563EB]">#{quotation.quotation_number}</p>
          </div>
        </div>
      </div>

      {/* Quotation Details */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Quotation Information</h3>
          <p className="text-sm text-gray-600">Issue Date: {formatDate(quotation.issue_date)}</p>
          <p className="text-sm text-gray-600">Valid Until: {formatDate(quotation.valid_until)}</p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Client Information</h3>
          <p className="text-sm text-gray-900 font-medium">{quotation.client?.name}</p>
          {quotation.client?.company && (
            <p className="text-sm text-gray-600">{quotation.client.company}</p>
          )}
          {quotation.client?.email && (
            <p className="text-sm text-gray-600">{quotation.client.email}</p>
          )}
        </div>
      </div>

      {/* Subject */}
      {quotation.subject && (
        <div className="mb-4">
          <p className="font-semibold text-gray-900">Subject: {quotation.subject}</p>
        </div>
      )}

      {/* Items Table */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="grid grid-cols-5 gap-4 bg-gray-100 p-3 font-semibold text-sm text-gray-900 border-b border-gray-300">
            <div>Description</div>
            <div className="text-center">Qty</div>
            <div className="text-right">Unit Price</div>
            <div className="text-center">Tax %</div>
            <div className="text-right">Total</div>
          </div>
          {quotation.items?.map((item, index) => (
            <div 
              key={index} 
              className={`grid grid-cols-5 gap-4 p-3 text-sm ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <div className="text-gray-900">{item.description}</div>
              <div className="text-center text-gray-600">{item.quantity}</div>
              <div className="text-right text-gray-600">
                {formatCurrency(item.unit_price, quotation.currency)}
              </div>
              <div className="text-center text-gray-600">{item.tax_rate}%</div>
              <div className="text-right font-semibold text-gray-900">
                {formatCurrency(item.total, quotation.currency)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="ml-auto w-64 mb-6">
        <div className="flex justify-between py-2 border-b border-gray-300">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium">{formatCurrency(quotation.subtotal, quotation.currency)}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-300">
          <span className="text-gray-600">Tax:</span>
          <span className="font-medium">{formatCurrency(quotation.tax_total, quotation.currency)}</span>
        </div>
        <div className="flex justify-between py-3 bg-[#2563EB]/10 rounded">
          <span className="font-bold text-gray-900">Total:</span>
          <span className="font-bold text-[#2563EB] text-lg">
            {formatCurrency(quotation.total, quotation.currency)}
          </span>
        </div>
      </div>

      {/* Notes & Terms */}
      {quotation.notes && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-1">Notes</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.notes}</p>
        </div>
      )}
      {quotation.terms && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-1">Terms & Conditions</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {organization.quotation_terms || quotation.terms}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
        <p>Generated on {new Date().toLocaleDateString()}</p>
        <p className="mt-1">Thank you for your business!</p>
      </div>
    </div>
  );
}

export function TemplatePreview({ organization }: TemplatePreviewProps) {
  const [showPreview, setShowPreview] = useState(false);

  if (!showPreview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Template Preview
          </CardTitle>
          <CardDescription>
            Preview how your invoices and quotations will look with your current settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setShowPreview(true)} 
            variant="outline"
            className="w-full"
          >
            <Eye className="mr-2 h-4 w-4" />
            Show Preview
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Template Preview
            </CardTitle>
            <CardDescription>
              This is how your documents will appear when downloaded as PDF
            </CardDescription>
          </div>
          <Button 
            onClick={() => setShowPreview(false)} 
            variant="ghost" 
            size="sm"
          >
            <EyeOff className="mr-2 h-4 w-4" />
            Hide Preview
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="invoice" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invoice" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Invoice Template
            </TabsTrigger>
            <TabsTrigger value="quotation" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Quotation Template
            </TabsTrigger>
          </TabsList>
          <TabsContent value="invoice" className="mt-6">
            <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
              <InvoicePreview organization={organization} />
            </div>
          </TabsContent>
          <TabsContent value="quotation" className="mt-6">
            <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
              <QuotationPreview organization={organization} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

