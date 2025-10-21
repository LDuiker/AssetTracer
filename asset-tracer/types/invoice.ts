/**
 * Invoice and quotation type definitions
 */

/**
 * Invoice status enum
 */
export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

/**
 * Client interface
 */
export interface Client {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  tax_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Invoice item interface (line items on an invoice)
 */
export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number; // quantity * unit_price
  tax_amount: number; // amount * (tax_rate / 100)
  total: number; // amount + tax_amount
  created_at: string;
  updated_at: string;
}

/**
 * Invoice interface
 */
export interface Invoice {
  id: string;
  organization_id: string;
  client_id: string;
  invoice_number: string;
  subject: string | null; // Subject/title of the invoice
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  subtotal: number; // Sum of all item amounts
  tax_total: number; // Sum of all item tax amounts
  total: number; // subtotal + tax_total
  paid_amount: number;
  balance: number; // total - paid_amount
  currency: string; // e.g., 'USD', 'EUR'
  notes: string | null;
  terms: string | null;
  payment_method: string | null;
  payment_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Relations (populated when needed)
  client?: Client;
  items?: InvoiceItem[];
}

/**
 * Quotation item interface (line items on a quotation)
 */
export interface QuotationItem {
  id: string;
  quotation_id: string;
  asset_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number; // quantity * unit_price
  tax_amount: number; // amount * (tax_rate / 100)
  total: number; // amount + tax_amount
  created_at: string;
  updated_at: string;
}

/**
 * Quotation interface
 */
export interface Quotation {
  id: string;
  organization_id: string;
  client_id: string;
  quotation_number: string;
  subject: string | null; // Subject/title of the quotation
  issue_date: string;
  valid_until: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'invoiced';
  subtotal: number; // Sum of all item amounts
  tax_total: number; // Sum of all item tax amounts
  total: number; // subtotal + tax_total
  currency: string; // e.g., 'USD', 'EUR'
  notes: string | null;
  terms: string | null;
  accepted_date: string | null;
  converted_to_invoice_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Relations (populated when needed)
  client?: Client;
  items?: QuotationItem[];
}

/**
 * Input type for creating a client
 */
export type CreateClientInput = Omit<
  Client,
  'id' | 'organization_id' | 'created_at' | 'updated_at'
>;

/**
 * Input type for updating a client
 */
export type UpdateClientInput = Partial<CreateClientInput>;

/**
 * Input type for creating an invoice item
 */
export type CreateInvoiceItemInput = Omit<
  InvoiceItem,
  'id' | 'invoice_id' | 'amount' | 'tax_amount' | 'total' | 'created_at' | 'updated_at'
>;

/**
 * Input type for creating an invoice
 */
export type CreateInvoiceInput = Omit<
  Invoice,
  | 'id'
  | 'organization_id'
  | 'invoice_number'
  | 'subtotal'
  | 'tax_total'
  | 'total'
  | 'balance'
  | 'paid_amount'
  | 'created_by'
  | 'created_at'
  | 'updated_at'
  | 'client'
  | 'items'
> & {
  items: CreateInvoiceItemInput[];
};

/**
 * Input type for updating an invoice
 */
export type UpdateInvoiceInput = Partial<
  Omit<
    Invoice,
    | 'id'
    | 'organization_id'
    | 'invoice_number'
    | 'subtotal'
    | 'tax_total'
    | 'total'
    | 'balance'
    | 'created_by'
    | 'created_at'
    | 'updated_at'
    | 'client'
    | 'items'
  >
> & {
  items?: CreateInvoiceItemInput[];
};

/**
 * Input type for creating a quotation item
 */
export type CreateQuotationItemInput = Omit<
  QuotationItem,
  'id' | 'quotation_id' | 'amount' | 'tax_amount' | 'total' | 'created_at' | 'updated_at'
>;

/**
 * Input type for creating a quotation
 */
export type CreateQuotationInput = Omit<
  Quotation,
  | 'id'
  | 'organization_id'
  | 'quotation_number'
  | 'subtotal'
  | 'tax_total'
  | 'total'
  | 'created_by'
  | 'created_at'
  | 'updated_at'
  | 'client'
  | 'items'
> & {
  items: CreateQuotationItemInput[];
};

/**
 * Input type for updating a quotation
 */
export type UpdateQuotationInput = Partial<
  Omit<
    Quotation,
    | 'id'
    | 'organization_id'
    | 'quotation_number'
    | 'subtotal'
    | 'tax_total'
    | 'total'
    | 'created_by'
    | 'created_at'
    | 'updated_at'
    | 'client'
    | 'items'
  >
> & {
  items?: CreateQuotationItemInput[];
};

