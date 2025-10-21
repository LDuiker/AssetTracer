# Invoice Components

React components for creating and managing invoices.

## InvoiceForm

A comprehensive form component for creating and editing invoices with real-time calculations.

### Features

✅ **Client Selection** - Searchable dropdown with client name and email
✅ **Invoice Details** - Dates, status, currency, and tax rate
✅ **Dynamic Line Items** - Add/remove items with automatic calculations
✅ **Real-time Calculations** - Subtotal, tax, and total update live
✅ **Validation** - Zod schema validation with error messages
✅ **Responsive Design** - Mobile-friendly layout
✅ **Dark Mode** - Full dark mode support

### Usage

```typescript
import { InvoiceForm } from '@/components/invoices';
import type { Client } from '@/types';

function CreateInvoicePage() {
  const clients: Client[] = [/* ... */];

  const handleSubmit = async (data) => {
    // Create invoice via API
    await fetch('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <InvoiceForm
      clients={clients}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
```

### Props

```typescript
interface InvoiceFormProps {
  initialData?: Invoice | null;  // For edit mode
  clients: Client[];              // List of available clients
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  onCancel: () => void;
}
```

### Form Data Structure

```typescript
{
  client_id: string;               // Selected client ID
  issue_date: string;              // YYYY-MM-DD format
  due_date: string;                // YYYY-MM-DD format
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  currency: string;                // USD, EUR, GBP, etc.
  tax_rate: number;                // Percentage (e.g., 10 for 10%)
  notes: string | null;            // Optional notes
  terms: string | null;            // Payment terms
  items: [                         // At least one item required
    {
      description: string;         // Item description
      quantity: number;            // Quantity (min 1)
      unit_price: number;          // Price per unit (min 0)
    }
  ];
}
```

### Form Sections

#### 1. Client Information
- **Client Selection**: Dropdown showing client name and email
- Required field with validation

#### 2. Invoice Details
- **Issue Date**: Date when invoice was created (defaults to today)
- **Due Date**: Payment due date (defaults to 30 days from now)
- **Status**: Draft, Sent, Paid, Overdue, or Cancelled
- **Currency**: USD, EUR, GBP, CAD, or AUD
- **Tax Rate**: Percentage for tax calculation

#### 3. Line Items
- **Dynamic array** of items with Add/Remove buttons
- Each item has:
  - Description (required)
  - Quantity (min 1)
  - Unit Price (min 0)
  - Amount (auto-calculated: quantity × unit_price)
- Minimum 1 item required

#### 4. Invoice Summary
- **Subtotal**: Sum of all item amounts
- **Tax**: Subtotal × (tax_rate / 100)
- **Total**: Subtotal + Tax
- Real-time updates as items change

#### 5. Additional Information
- **Payment Terms**: Text area for terms (optional)
- **Notes**: Text area for additional notes (optional)

### Calculations

The form performs real-time calculations:

```typescript
// For each line item
const amount = quantity × unit_price;

// Invoice totals
const subtotal = sum of all item amounts;
const taxAmount = subtotal × (tax_rate / 100);
const total = subtotal + taxAmount;
```

**Example:**

```
Item 1: 5 × $100 = $500
Item 2: 2 × $250 = $500
----------------------------
Subtotal:         $1,000
Tax (10%):          $100
----------------------------
Total:           $1,100
```

### Validation Rules

**Required Fields:**
- Client
- Issue Date
- Due Date
- Status
- Currency
- Tax Rate
- At least one line item

**Line Item Validation:**
- Description: Required, min 1 character
- Quantity: Min 1
- Unit Price: Min 0

**Date Validation:**
- Must be valid date format (YYYY-MM-DD)

**Tax Rate Validation:**
- Must be between 0 and 100

### Default Values

When creating a new invoice:
- Issue Date: Today
- Due Date: 30 days from today
- Status: Draft
- Currency: USD
- Tax Rate: 10%
- Terms: "Payment due within 30 days"
- Items: One empty item

### Edit Mode

Pass `initialData` to pre-populate the form:

```typescript
<InvoiceForm
  initialData={existingInvoice}
  clients={clients}
  onSubmit={handleUpdate}
  onCancel={handleCancel}
/>
```

The form will:
- Pre-fill all fields with existing data
- Map invoice items to form items
- Show "Update Invoice" instead of "Create Invoice"

### Styling

The form uses a clean, sectioned layout:

1. **Section Headers**: Clear titles with descriptions
2. **Separators**: Visual breaks between sections
3. **Color Coding**: 
   - Primary blue for total
   - Red for delete actions
   - Gray for readonly fields
4. **Spacing**: Consistent padding and gaps
5. **Responsive**: Stacks on mobile, multi-column on desktop

### Accessibility

- ✅ Proper form labels
- ✅ Error messages linked to fields
- ✅ Keyboard navigation
- ✅ Screen reader friendly
- ✅ Focus states

### Performance

- Uses `useFieldArray` for efficient array management
- `watch` for reactive calculations
- Optimized re-renders
- No unnecessary API calls

### Integration Example

```typescript
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { InvoiceForm } from '@/components/invoices';

export default function CreateInvoicePage() {
  // Fetch clients
  const { data: clientsData } = useSWR('/api/clients');
  const clients = clientsData?.clients || [];

  const handleSubmit = async (data) => {
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create invoice');
      }

      toast.success('Invoice created successfully');
      router.push('/invoices');
    } catch (error) {
      toast.error('Failed to create invoice');
      throw error; // Keep form open on error
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create Invoice</h1>
      <InvoiceForm
        clients={clients}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  );
}
```

### Future Enhancements

- [ ] Invoice number auto-generation
- [ ] Client quick-add from form
- [ ] Item templates/presets
- [ ] Discount support
- [ ] Multiple tax rates per item
- [ ] PDF preview
- [ ] Save as draft functionality
- [ ] Recurring invoice setup

### Related Components

- `InvoiceTable` - Display list of invoices (to be created)
- `InvoiceDialog` - Modal wrapper for form (to be created)
- `InvoicePreview` - PDF preview (to be created)

### Dependencies

- `react-hook-form` - Form management
- `zod` - Schema validation
- `@hookform/resolvers` - Zod resolver
- `shadcn/ui` - UI components
- `lucide-react` - Icons

