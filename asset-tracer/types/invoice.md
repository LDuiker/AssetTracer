# Invoice & Quotation Types

Comprehensive TypeScript type definitions for invoicing and quotation functionality.

## Overview

This file contains all type definitions related to:
- **Clients**: Customer information
- **Invoices**: Billing documents with line items
- **Quotations**: Price quotes that can be converted to invoices
- **Invoice Items**: Line items on invoices
- **Quotation Items**: Line items on quotations

## Types Reference

### InvoiceStatus Enum

```typescript
enum InvoiceStatus {
  DRAFT = 'draft',       // Invoice is being prepared
  SENT = 'sent',         // Invoice has been sent to client
  PAID = 'paid',         // Invoice has been fully paid
  OVERDUE = 'overdue',   // Invoice is past due date
  CANCELLED = 'cancelled' // Invoice has been cancelled
}
```

### Client Interface

Represents a customer or business entity.

```typescript
interface Client {
  id: string;
  organization_id: string;
  name: string;                    // Client's full name
  email: string;                   // Primary contact email
  phone: string | null;            // Contact phone number
  company: string | null;          // Company name
  address: string | null;          // Street address
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  tax_id: string | null;           // Tax identification number
  notes: string | null;            // Additional notes
  created_at: string;
  updated_at: string;
}
```

**Usage Example:**
```typescript
const client: Client = {
  id: 'client-123',
  organization_id: 'org-456',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  company: 'Acme Inc.',
  address: '123 Main St',
  city: 'New York',
  state: 'NY',
  postal_code: '10001',
  country: 'USA',
  tax_id: '12-3456789',
  notes: 'VIP client',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};
```

### InvoiceItem Interface

Individual line item on an invoice.

```typescript
interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;             // Item description
  quantity: number;                // Number of units
  unit_price: number;              // Price per unit
  tax_rate: number;                // Tax percentage (e.g., 10 for 10%)
  amount: number;                  // quantity × unit_price
  tax_amount: number;              // amount × (tax_rate / 100)
  total: number;                   // amount + tax_amount
  created_at: string;
  updated_at: string;
}
```

**Calculation Example:**
```typescript
const item: InvoiceItem = {
  id: 'item-1',
  invoice_id: 'inv-123',
  description: 'Dell Laptop XPS 15',
  quantity: 2,
  unit_price: 1500,
  tax_rate: 10,
  amount: 3000,        // 2 × 1500
  tax_amount: 300,     // 3000 × 0.10
  total: 3300,         // 3000 + 300
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};
```

### Invoice Interface

Complete invoice document.

```typescript
interface Invoice {
  id: string;
  organization_id: string;
  client_id: string;
  invoice_number: string;          // Unique invoice number (e.g., INV-0001)
  issue_date: string;              // When invoice was issued
  due_date: string;                // Payment due date
  status: InvoiceStatus;
  subtotal: number;                // Sum of all item amounts
  tax_total: number;               // Sum of all item tax amounts
  total: number;                   // subtotal + tax_total
  paid_amount: number;             // Amount paid so far
  balance: number;                 // total - paid_amount
  currency: string;                // e.g., 'USD', 'EUR', 'GBP'
  notes: string | null;            // Additional notes for client
  terms: string | null;            // Payment terms
  payment_method: string | null;   // How payment was made
  payment_date: string | null;     // When payment was received
  created_by: string;              // User who created the invoice
  created_at: string;
  updated_at: string;
  
  // Optional relations
  client?: Client;                 // Populated client data
  items?: InvoiceItem[];           // Invoice line items
}
```

### QuotationItem Interface

Individual line item on a quotation.

```typescript
interface QuotationItem {
  id: string;
  quotation_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number;                  // quantity × unit_price
  tax_amount: number;              // amount × (tax_rate / 100)
  total: number;                   // amount + tax_amount
  created_at: string;
  updated_at: string;
}
```

### Quotation Interface

Price quote that can be converted to an invoice.

```typescript
interface Quotation {
  id: string;
  organization_id: string;
  client_id: string;
  quotation_number: string;        // Unique quote number (e.g., QUO-0001)
  issue_date: string;
  valid_until: string;             // Expiration date of quote
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  subtotal: number;
  tax_total: number;
  total: number;
  currency: string;
  notes: string | null;
  terms: string | null;
  accepted_date: string | null;    // When client accepted quote
  converted_to_invoice_id: string | null; // If converted to invoice
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Optional relations
  client?: Client;
  items?: QuotationItem[];
}
```

## Input Types

### CreateClientInput

Used when creating a new client.

```typescript
type CreateClientInput = Omit<
  Client,
  'id' | 'organization_id' | 'created_at' | 'updated_at'
>;

// Example usage
const newClient: CreateClientInput = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '+1234567890',
  company: 'Smith & Co',
  // ... other fields
};
```

### UpdateClientInput

Used when updating an existing client (all fields optional).

```typescript
type UpdateClientInput = Partial<CreateClientInput>;

// Example usage
const updates: UpdateClientInput = {
  email: 'newemail@example.com',
  phone: '+0987654321',
};
```

### CreateInvoiceInput

Used when creating a new invoice.

```typescript
type CreateInvoiceInput = Omit<
  Invoice,
  'id' | 'organization_id' | 'invoice_number' | 'subtotal' | 'tax_total' | 
  'total' | 'balance' | 'paid_amount' | 'created_by' | 'created_at' | 
  'updated_at' | 'client' | 'items'
> & {
  items: CreateInvoiceItemInput[];
};

// Example usage
const newInvoice: CreateInvoiceInput = {
  client_id: 'client-123',
  issue_date: '2024-01-15',
  due_date: '2024-02-15',
  status: InvoiceStatus.DRAFT,
  currency: 'USD',
  notes: 'Thank you for your business',
  terms: 'Net 30',
  payment_method: null,
  payment_date: null,
  items: [
    {
      description: 'Consulting Services',
      quantity: 10,
      unit_price: 150,
      tax_rate: 10,
    },
  ],
};
```

### UpdateInvoiceInput

Used when updating an existing invoice.

```typescript
type UpdateInvoiceInput = Partial</* ... */> & {
  items?: CreateInvoiceItemInput[];
};

// Example usage
const updates: UpdateInvoiceInput = {
  status: InvoiceStatus.PAID,
  paid_amount: 1650,
  payment_date: '2024-01-20',
  payment_method: 'Credit Card',
};
```

## Calculations

### Invoice Totals

```typescript
// Calculate item totals
const amount = quantity * unit_price;
const tax_amount = amount * (tax_rate / 100);
const item_total = amount + tax_amount;

// Calculate invoice totals
const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
const tax_total = items.reduce((sum, item) => sum + item.tax_amount, 0);
const total = subtotal + tax_total;
const balance = total - paid_amount;
```

### Example Calculation

```typescript
// Item 1: 2 × $100 @ 10% tax
const item1_amount = 2 * 100;        // $200
const item1_tax = 200 * 0.10;        // $20
const item1_total = 200 + 20;        // $220

// Item 2: 1 × $300 @ 10% tax
const item2_amount = 1 * 300;        // $300
const item2_tax = 300 * 0.10;        // $30
const item2_total = 300 + 30;        // $330

// Invoice totals
const subtotal = 200 + 300;          // $500
const tax_total = 20 + 30;           // $50
const total = 500 + 50;              // $550
const paid_amount = 200;             // $200 paid
const balance = 550 - 200;           // $350 remaining
```

## Status Transitions

### Invoice Status Flow

```
DRAFT → SENT → PAID
  ↓       ↓      
  ↓    OVERDUE
  ↓       ↓
  → CANCELLED ←
```

### Quotation Status Flow

```
DRAFT → SENT → ACCEPTED → (Convert to Invoice)
  ↓       ↓       ↓
  ↓       ↓    REJECTED
  ↓       ↓
  ↓    EXPIRED
  ↓       ↓
  → CANCELLED ←
```

## Usage Examples

### Creating an Invoice with Items

```typescript
import { CreateInvoiceInput, InvoiceStatus } from '@/types';

const invoiceData: CreateInvoiceInput = {
  client_id: 'client-123',
  issue_date: '2024-01-15',
  due_date: '2024-02-15',
  status: InvoiceStatus.DRAFT,
  currency: 'USD',
  notes: 'Thank you for your business!',
  terms: 'Net 30',
  payment_method: null,
  payment_date: null,
  items: [
    {
      description: 'Website Design',
      quantity: 1,
      unit_price: 2000,
      tax_rate: 10,
    },
    {
      description: 'Hosting (12 months)',
      quantity: 12,
      unit_price: 50,
      tax_rate: 10,
    },
  ],
};
```

### Updating Invoice Status

```typescript
import { UpdateInvoiceInput, InvoiceStatus } from '@/types';

const markAsPaid: UpdateInvoiceInput = {
  status: InvoiceStatus.PAID,
  paid_amount: 2860,
  payment_date: '2024-01-20',
  payment_method: 'Bank Transfer',
};
```

### Converting Quotation to Invoice

```typescript
// 1. Accept quotation
const acceptQuote: UpdateQuotationInput = {
  status: 'accepted',
  accepted_date: '2024-01-20',
};

// 2. Create invoice from quotation
const invoiceFromQuote: CreateInvoiceInput = {
  client_id: quotation.client_id,
  issue_date: new Date().toISOString(),
  due_date: addDays(new Date(), 30).toISOString(),
  status: InvoiceStatus.SENT,
  currency: quotation.currency,
  notes: quotation.notes,
  terms: quotation.terms,
  items: quotation.items.map(item => ({
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    tax_rate: item.tax_rate,
  })),
};

// 3. Update quotation with invoice reference
const linkInvoice: UpdateQuotationInput = {
  converted_to_invoice_id: newInvoice.id,
};
```

## Database Schema

These types correspond to the following database tables:

- `clients`
- `invoices`
- `invoice_items`
- `quotations`
- `quotation_items`

Make sure your Supabase schema matches these type definitions.

## Related Files

- `types/asset.ts` - Asset type definitions
- `lib/db/invoices.ts` - Invoice database helpers (to be created)
- `app/api/invoices/route.ts` - Invoice API routes (to be created)
- `components/invoices/` - Invoice UI components (to be created)

