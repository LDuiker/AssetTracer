/**
 * PDF Template Registry
 * 
 * This file manages available PDF templates for invoices and quotations.
 * Each template has a unique ID, name, description, and component reference.
 */

import { InvoicePDF } from './invoice-pdf';
import { InvoicePDFCompact } from './invoice-pdf-compact';
import { QuotationPDF } from './quotation-pdf';
import { QuotationPDFCompact } from './quotation-pdf-compact';

export type TemplateType = 'classic' | 'compact';

export interface Template {
  id: TemplateType;
  name: string;
  description: string;
  preview: string; // URL or path to preview image
}

export const invoiceTemplates = {
  classic: {
    id: 'classic' as TemplateType,
    name: 'Classic',
    description: 'Professional traditional layout with clean lines and ample spacing',
    component: InvoicePDF,
  },
  compact: {
    id: 'compact' as TemplateType,
    name: 'Compact',
    description: 'Modern minimalist design with enhanced visual hierarchy',
    component: InvoicePDFCompact,
  },
};

export const quotationTemplates = {
  classic: {
    id: 'classic' as TemplateType,
    name: 'Classic',
    description: 'Professional traditional layout with clean lines and ample spacing',
    component: QuotationPDF,
  },
  compact: {
    id: 'compact' as TemplateType,
    name: 'Compact',
    description: 'Modern minimalist design with enhanced visual hierarchy',
    component: QuotationPDFCompact,
  },
};

/**
 * Get an invoice template by ID
 */
export function getInvoiceTemplate(type: TemplateType) {
  return invoiceTemplates[type];
}

/**
 * Get a quotation template by ID
 */
export function getQuotationTemplate(type: TemplateType) {
  return quotationTemplates[type];
}

/**
 * Get all available invoice templates
 */
export function getAllInvoiceTemplates() {
  return Object.values(invoiceTemplates);
}

/**
 * Get all available quotation templates
 */
export function getAllQuotationTemplates() {
  return Object.values(quotationTemplates);
}

