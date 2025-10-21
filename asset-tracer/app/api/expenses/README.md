# Expenses API Routes

This directory contains API routes for managing expenses in the AssetTracer application.

## Routes

### `GET /api/expenses`
Fetch all expenses for the current user's organization.

**Response:**
```json
[
  {
    "id": "uuid",
    "organization_id": "uuid",
    "category": "maintenance",
    "amount": 150.00,
    "currency": "USD",
    "expense_date": "2024-01-15",
    "vendor": "ABC Supplies",
    "description": "Monthly maintenance supplies",
    "reference_number": "INV-2024-001",
    "payment_method": "credit_card",
    "asset_id": "uuid",
    "asset": {
      "id": "uuid",
      "name": "Asset Name",
      "category": "Equipment"
    },
    "project_id": null,
    "is_tax_deductible": true,
    "is_recurring": false,
    "recurring_frequency": null,
    "status": "paid",
    "approved_by": null,
    "approved_at": null,
    "notes": "Additional notes",
    "tags": ["maintenance", "urgent"],
    "receipt_url": "https://example.com/receipt.pdf",
    "created_by": "uuid",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
]
```

### `POST /api/expenses`
Create a new expense.

**Request Body:**
```json
{
  "category": "maintenance",
  "amount": 150.00,
  "currency": "USD",
  "expense_date": "2024-01-15",
  "vendor": "ABC Supplies",
  "description": "Monthly maintenance supplies",
  "reference_number": "INV-2024-001",
  "payment_method": "credit_card",
  "asset_id": "uuid",
  "is_tax_deductible": true,
  "status": "pending",
  "notes": "Additional notes",
  "receipt_url": "https://example.com/receipt.pdf"
}
```

**Response:**
```json
{
  "id": "uuid",
  "organization_id": "uuid",
  ...
}
```

### `GET /api/expenses/[id]`
Fetch a single expense by ID.

**Response:**
```json
{
  "id": "uuid",
  "organization_id": "uuid",
  ...
}
```

### `PATCH /api/expenses/[id]`
Update an existing expense.

**Request Body:** (partial update)
```json
{
  "amount": 175.00,
  "status": "paid",
  "notes": "Updated notes"
}
```

**Response:**
```json
{
  "id": "uuid",
  "organization_id": "uuid",
  ...
}
```

### `DELETE /api/expenses/[id]`
Delete an expense.

**Response:**
```json
{
  "success": true
}
```

## Categories

- `maintenance` - Regular maintenance expenses
- `repair` - Repair costs
- `supplies` - General supplies
- `utilities` - Utility bills
- `insurance` - Insurance premiums
- `fuel` - Fuel and energy costs
- `other` - Other miscellaneous expenses

## Payment Methods

- `cash`
- `credit_card`
- `debit_card`
- `bank_transfer`
- `check`
- `other`

## Status Values

- `pending` - Awaiting approval
- `approved` - Approved but not yet paid
- `rejected` - Rejected
- `paid` - Fully paid

## Error Responses

All routes may return the following error responses:

- `401 Unauthorized` - User is not authenticated
- `403 Forbidden` - User doesn't have access to the expense
- `404 Not Found` - Expense or organization not found
- `400 Bad Request` - Validation error (with details)
- `500 Internal Server Error` - Server error

## Usage Examples

### Create an expense linked to an asset
```typescript
const response = await fetch('/api/expenses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: 'Engine oil change',
    amount: 75.00,
    expense_date: '2024-01-15',
    category: 'maintenance',
    vendor: 'Auto Shop',
    asset_id: 'asset-uuid-here',
    is_tax_deductible: true,
    status: 'paid',
  }),
});
```

### Filter expenses by asset in the frontend
```typescript
import useSWR from 'swr';

const { data: expenses } = useSWR('/api/expenses', fetcher);
const assetExpenses = expenses?.filter(e => e.asset_id === assetId);
```

### Update expense status
```typescript
const response = await fetch(`/api/expenses/${expenseId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'approved',
  }),
});
```

