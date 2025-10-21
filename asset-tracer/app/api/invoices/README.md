# Invoice API Routes

Complete CRUD API for managing invoices with line items, PDF generation, and transaction handling.

## Routes

### `GET /api/invoices`
Fetch all invoices for the authenticated user's organization.

**Authentication**: Required

**Response**:
```json
{
  "invoices": [
    {
      "id": "uuid",
      "organization_id": "uuid",
      "client_id": "uuid",
      "invoice_number": "INV-202410-0001",
      "issue_date": "2024-10-01",
      "due_date": "2024-11-01",
      "status": "sent",
      "currency": "USD",
      "subtotal": 2600.00,
      "tax_total": 260.00,
      "total": 2860.00,
      "paid_amount": 0,
      "balance": 2860.00,
      "notes": "Thank you for your business",
      "terms": "Net 30",
      "created_at": "2024-10-01T10:00:00Z",
      "updated_at": "2024-10-01T10:00:00Z",
      "client": {
        "id": "uuid",
        "name": "Acme Corp",
        "email": "billing@acme.com",
        "phone": "+1 (555) 123-4567",
        "company": "Acme Corporation",
        "address": "123 Main St",
        "city": "New York",
        "state": "NY",
        "postal_code": "10001",
        "country": "USA"
      }
    }
  ]
}
```

**Status Codes**:
- `200` - Success
- `401` - Unauthorized (not signed in)
- `403` - Forbidden (no organization)
- `500` - Server error

---

### `POST /api/invoices`
Create a new invoice with line items.

**Authentication**: Required

**Request Body**:
```json
{
  "client_id": "uuid",
  "issue_date": "2024-10-01",
  "due_date": "2024-11-01",
  "status": "draft",
  "currency": "USD",
  "notes": "Thank you for your business",
  "terms": "Net 30",
  "items": [
    {
      "description": "Web Design Services",
      "quantity": 1,
      "unit_price": 2000.00,
      "tax_rate": 10
    },
    {
      "description": "Monthly Hosting",
      "quantity": 12,
      "unit_price": 50.00,
      "tax_rate": 10
    }
  ]
}
```

**Validation Rules**:
- `client_id`: Required, must exist in organization
- `issue_date`: Required, valid date
- `due_date`: Required, valid date
- `status`: Required, one of: `draft`, `sent`, `paid`, `overdue`, `cancelled`
- `currency`: Required, string
- `items`: Required, array with at least 1 item
  - `description`: Required, non-empty string
  - `quantity`: Required, number >= 1
  - `unit_price`: Required, number >= 0
  - `tax_rate`: Required, number 0-100

**Response**:
```json
{
  "invoice": {
    "id": "uuid",
    "invoice_number": "INV-202410-0001",
    "subtotal": 2600.00,
    "tax_total": 260.00,
    "total": 2860.00,
    "balance": 2860.00,
    "client": { /* client object */ },
    "items": [
      {
        "id": "uuid",
        "invoice_id": "uuid",
        "description": "Web Design Services",
        "quantity": 1,
        "unit_price": 2000.00,
        "tax_rate": 10,
        "amount": 2000.00,
        "tax_amount": 200.00,
        "total": 2200.00
      },
      {
        "id": "uuid",
        "invoice_id": "uuid",
        "description": "Monthly Hosting",
        "quantity": 12,
        "unit_price": 50.00,
        "tax_rate": 10,
        "amount": 600.00,
        "tax_amount": 60.00,
        "total": 660.00
      }
    ]
  }
}
```

**Features**:
- ✅ Auto-generates invoice number (format: `INV-YYYYMM-XXXX`)
- ✅ Validates client exists and belongs to organization
- ✅ Calculates subtotal, tax_total, and total automatically
- ✅ Creates invoice and items in transaction
- ✅ Rolls back invoice if items creation fails

**Status Codes**:
- `201` - Created successfully
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Client not found
- `500` - Server error

---

### `GET /api/invoices/[id]`
Fetch a single invoice with client and items.

**Authentication**: Required

**Response**:
```json
{
  "invoice": {
    "id": "uuid",
    "invoice_number": "INV-202410-0001",
    "client": { /* client object */ },
    "items": [ /* array of invoice items */ ],
    /* ... all invoice fields ... */
  }
}
```

**Status Codes**:
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Invoice not found
- `500` - Server error

---

### `PATCH /api/invoices/[id]`
Update an existing invoice.

**Authentication**: Required

**Request Body** (all fields optional):
```json
{
  "client_id": "uuid",
  "issue_date": "2024-10-01",
  "due_date": "2024-11-01",
  "status": "sent",
  "currency": "USD",
  "notes": "Updated notes",
  "terms": "Net 30",
  "items": [
    {
      "description": "Updated item",
      "quantity": 2,
      "unit_price": 1500.00,
      "tax_rate": 10
    }
  ]
}
```

**Features**:
- Partial updates (only send fields to change)
- If `items` provided, replaces all items and recalculates totals
- Validates organization ownership

**Response**:
```json
{
  "invoice": {
    /* updated invoice with client and items */
  }
}
```

**Status Codes**:
- `200` - Updated successfully
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Invoice not found
- `500` - Server error

---

### `DELETE /api/invoices/[id]`
Delete an invoice and its items.

**Authentication**: Required

**Response**:
```json
{
  "message": "Invoice deleted successfully"
}
```

**Features**:
- Deletes invoice items first (cascade)
- Then deletes invoice
- Validates organization ownership

**Status Codes**:
- `200` - Deleted successfully
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Invoice not found
- `500` - Server error

---

### `POST /api/invoices/[id]/mark-paid`
Mark an invoice as paid.

**Authentication**: Required

**Response**:
```json
{
  "invoice": {
    "id": "uuid",
    "status": "paid",
    "paid_amount": 2860.00,
    "balance": 0,
    "payment_date": "2024-10-05",
    /* ... rest of invoice ... */
  }
}
```

**Features**:
- Updates status to `paid`
- Sets `paid_amount` to `total`
- Sets `balance` to `0`
- Sets `payment_date` to today
- Returns updated invoice

**Status Codes**:
- `200` - Marked as paid successfully
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Invoice not found
- `500` - Server error

---

### `GET /api/invoices/[id]/pdf`
Generate and download invoice PDF.

**Authentication**: Required

**Response**: PDF file (binary)

**Headers**:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="invoice-{invoice_number}.pdf"`

**Features**:
- Generates professional invoice PDF
- Includes company header, client info, line items, totals
- Color-coded status badge
- Print-friendly layout

**Status Codes**:
- `200` - PDF generated successfully
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Invoice not found
- `500` - Server error

---

## Transaction Handling

### Create Invoice Flow
```
1. Validate user session ✓
2. Validate client exists and belongs to organization ✓
3. Generate invoice number (INV-YYYYMM-XXXX) ✓
4. Calculate totals from items ✓
5. Insert invoice record ✓
6. Calculate item values (amount, tax_amount, total) ✓
7. Insert invoice_items records ✓
8. If items fail → rollback invoice ✓
9. Fetch and return complete invoice ✓
```

### Update Invoice Flow
```
1. Validate user session ✓
2. Verify invoice exists and user has access ✓
3. If items provided:
   a. Recalculate totals ✓
   b. Delete old items ✓
   c. Insert new items ✓
4. Update invoice record ✓
5. Fetch and return complete invoice ✓
```

### Delete Invoice Flow
```
1. Validate user session ✓
2. Verify invoice exists and user has access ✓
3. Delete invoice_items (cascade) ✓
4. Delete invoice ✓
```

## Calculations

### Line Item Calculations
```typescript
amount = quantity × unit_price
tax_amount = amount × (tax_rate / 100)
item_total = amount + tax_amount
```

### Invoice Totals
```typescript
subtotal = sum of all item amounts
tax_total = sum of all item tax_amounts
total = subtotal + tax_total
balance = total - paid_amount
```

### Example
```
Item 1: 10 × $50 = $500
  Tax (10%): $50
  Item Total: $550

Item 2: 5 × $100 = $500
  Tax (8%): $40
  Item Total: $540

Subtotal: $1,000
Tax Total: $90
Grand Total: $1,090
```

## Invoice Number Format

```
INV-YYYYMM-XXXX

Where:
- INV = Prefix
- YYYY = Year (2024)
- MM = Month (10)
- XXXX = Sequential number (0001, 0002, etc.)

Examples:
- INV-202410-0001
- INV-202410-0002
- INV-202411-0001
```

**Generation Logic**:
1. Get current year and month
2. Count existing invoices with same prefix
3. Increment count and pad to 4 digits
4. Combine: `INV-{YYYY}{MM}-{XXXX}`

## Error Handling

### Validation Errors (400)
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "items.0.quantity",
      "message": "Quantity must be at least 1"
    },
    {
      "field": "due_date",
      "message": "Due date is required"
    }
  ]
}
```

### Not Found (404)
```json
{
  "error": "Invoice not found or access denied."
}
```

### Unauthorized (401)
```json
{
  "error": "Unauthorized. Please sign in."
}
```

### Forbidden (403)
```json
{
  "error": "User is not associated with an organization."
}
```

### Server Error (500)
```json
{
  "error": "Internal server error. Please try again later."
}
```

## Security

- ✅ Authentication required on all endpoints
- ✅ Organization-based access control
- ✅ Client validation (must belong to organization)
- ✅ Invoice ownership validation
- ✅ No data leakage in error messages
- ✅ Input validation with Zod
- ✅ SQL injection protection (Supabase)
- ✅ XSS protection (sanitized inputs)

## Database Tables

### invoices
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  invoice_number TEXT UNIQUE NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  terms TEXT,
  payment_method TEXT,
  payment_date DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### invoice_items
```sql
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  tax_rate NUMERIC(5,2) NOT NULL CHECK (tax_rate >= 0 AND tax_rate <= 100),
  amount NUMERIC(10,2) NOT NULL,
  tax_amount NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Testing

### Create Invoice
```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "client-uuid",
    "issue_date": "2024-10-01",
    "due_date": "2024-11-01",
    "status": "draft",
    "currency": "USD",
    "items": [
      {
        "description": "Web Design",
        "quantity": 1,
        "unit_price": 2000,
        "tax_rate": 10
      }
    ]
  }'
```

### Download PDF
```bash
curl -X GET http://localhost:3000/api/invoices/{id}/pdf \
  -o invoice.pdf
```

## Frontend Integration

See `/app/(dashboard)/invoices/page.tsx` for complete implementation with:
- SWR for data fetching
- Optimistic updates
- Toast notifications
- Loading states
- Error handling
- PDF download

