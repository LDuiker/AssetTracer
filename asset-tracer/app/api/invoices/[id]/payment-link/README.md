# Invoice Payment Link API

## Overview

This API endpoint generates and retrieves DPO payment links for invoices, allowing customers to pay online securely.

---

## Endpoints

### POST `/api/invoices/[id]/payment-link`

Generate a new payment link for an invoice.

#### Request

**Method**: `POST`  
**URL**: `/api/invoices/{invoice-id}/payment-link`  
**Authentication**: Required (user must be logged in)  
**Body**: None (empty POST request)

#### Response

**Success (201)**:
```json
{
  "success": true,
  "paymentUrl": "https://secure.3gdirectpay.com/payv2.php?ID=ABC123XYZ",
  "paymentToken": "ABC123XYZ",
  "amount": 150.00,
  "currency": "USD",
  "invoiceNumber": "INV-2024-001",
  "message": "Payment link generated successfully"
}
```

**Error (400 - Already Paid)**:
```json
{
  "error": "Invoice is already paid",
  "message": "This invoice has already been paid and cannot be paid again."
}
```

**Error (400 - No Client Email)**:
```json
{
  "error": "Client email is required",
  "message": "The client associated with this invoice does not have an email address. Please add one before generating a payment link."
}
```

**Error (400 - DPO API Failure)**:
```json
{
  "error": "Payment link generation failed",
  "message": "Payment gateway configuration error. Please contact support.",
  "details": "Invalid company token",
  "errorCode": "904"
}
```

**Error (404)**:
```json
{
  "error": "Invoice not found"
}
```

**Error (401)**:
```json
{
  "error": "Unauthorized"
}
```

**Error (500)**:
```json
{
  "error": "Payment gateway not configured",
  "message": "Payment system is not properly configured. Please contact support."
}
```

---

### GET `/api/invoices/[id]/payment-link`

Retrieve existing payment link for an invoice.

#### Request

**Method**: `GET`  
**URL**: `/api/invoices/{invoice-id}/payment-link`  
**Authentication**: Required

#### Response

**Success (200) - Has Payment Link**:
```json
{
  "hasPaymentLink": true,
  "paymentUrl": "https://secure.3gdirectpay.com/payv2.php?ID=ABC123XYZ",
  "paymentToken": "ABC123XYZ",
  "amount": 150.00,
  "currency": "USD",
  "invoiceNumber": "INV-2024-001",
  "status": "sent"
}
```

**Success (200) - No Payment Link**:
```json
{
  "hasPaymentLink": false,
  "message": "No payment link has been generated for this invoice."
}
```

---

## Usage Examples

### Example 1: Generate Payment Link

```typescript
// Frontend - Generate payment link button
async function handleGeneratePaymentLink(invoiceId: string) {
  try {
    const response = await fetch(`/api/invoices/${invoiceId}/payment-link`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      toast.error(error.message || 'Failed to generate payment link');
      return;
    }

    const data = await response.json();
    
    // Copy link to clipboard
    await navigator.clipboard.writeText(data.paymentUrl);
    toast.success('Payment link copied to clipboard!');
    
    // Or redirect customer
    // window.open(data.paymentUrl, '_blank');
    
  } catch (error) {
    console.error('Error generating payment link:', error);
    toast.error('An unexpected error occurred');
  }
}
```

### Example 2: Check Existing Payment Link

```typescript
// Frontend - Check if payment link exists
async function checkPaymentLink(invoiceId: string) {
  try {
    const response = await fetch(`/api/invoices/${invoiceId}/payment-link`, {
      credentials: 'include',
    });

    const data = await response.json();
    
    if (data.hasPaymentLink) {
      console.log('Payment URL:', data.paymentUrl);
      console.log('Status:', data.status);
      
      // Show payment link to user
      setPaymentUrl(data.paymentUrl);
    } else {
      // No payment link yet, show generate button
      setShowGenerateButton(true);
    }
    
  } catch (error) {
    console.error('Error checking payment link:', error);
  }
}
```

### Example 3: Send Payment Link via Email

```typescript
// Server action - Generate and send payment link
import { createPaymentToken } from '@/lib/payments/dpo';
import { sendEmail } from '@/lib/email';

async function sendPaymentLinkEmail(invoiceId: string) {
  // Generate payment link
  const response = await fetch(`${APP_URL}/api/invoices/${invoiceId}/payment-link`, {
    method: 'POST',
    headers: {
      'Cookie': cookies().toString(),
    },
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message);
  }

  // Send email to client
  await sendEmail({
    to: invoice.client.email,
    subject: `Payment Required: Invoice ${data.invoiceNumber}`,
    template: 'payment-link',
    data: {
      invoiceNumber: data.invoiceNumber,
      amount: data.amount,
      currency: data.currency,
      paymentUrl: data.paymentUrl,
      clientName: invoice.client.name,
    },
  });

  return data.paymentUrl;
}
```

---

## Business Logic

### Pre-Flight Checks

1. **Authentication**: User must be logged in
2. **Organization**: User must have a valid organization
3. **Invoice Exists**: Invoice must exist in database
4. **Not Already Paid**: Invoice status cannot be 'paid'
5. **Has Client**: Invoice must have an associated client
6. **Client Email**: Client must have a valid email address
7. **Valid Amount**: Invoice amount must be > 0

### Payment Link Generation Process

1. **Fetch Invoice Data**:
   - Get invoice with client details
   - Verify organization ownership

2. **Get Currency**:
   - Priority 1: Invoice currency
   - Priority 2: Organization default currency
   - Priority 3: Default to 'USD'

3. **Prepare Payment Details**:
   - Amount: `invoice.total_amount`
   - Currency: From step 2
   - Reference: `invoice.invoice_number`
   - Customer Email: `invoice.client.email`
   - Customer Name: `invoice.client.name` or `invoice.client.company`
   - Customer Phone: `invoice.client.phone` (optional)
   - Redirect URL: `{APP_URL}/invoices/{id}/payment-success`
   - Back URL: `{APP_URL}/invoices/{id}`
   - Description: "Payment for Invoice {invoice_number}"

4. **Call DPO API**:
   - Create payment token via `createPaymentToken()`
   - Handle DPO errors

5. **Update Invoice**:
   - Save `payment_link` to database
   - Save `payment_token` to database
   - Update `updated_at` timestamp

6. **Return Response**:
   - Include payment URL
   - Include payment token
   - Include invoice details

---

## Error Handling

### DPO Error Code Mapping

| DPO Code | User Message | Recommendation |
|----------|--------------|----------------|
| `904` | "Payment gateway configuration error. Please contact support." | Check `DPO_COMPANY_TOKEN` |
| `901` | "Duplicate payment reference. Please try again." | Generate new reference or set `CompanyRefUnique=0` |
| `INVALID_EMAIL` | "Invalid client email address." | Update client email |
| `INVALID_CURRENCY` | "Currency '{currency}' is not supported." | Use supported currency |
| `INVALID_AMOUNT` | "Invalid invoice amount." | Check invoice amount |

### Common Errors

#### Error: "Payment gateway not configured"
**Cause**: `DPO_COMPANY_TOKEN` environment variable not set  
**Fix**: Add DPO credentials to `.env.local`

#### Error: "Invoice is already paid"
**Cause**: Attempting to generate payment link for paid invoice  
**Fix**: Check invoice status before generating link

#### Error: "Client email is required"
**Cause**: Client has no email address  
**Fix**: Add email to client record

#### Error: "Organization not found"
**Cause**: User not linked to organization  
**Fix**: Run `SETUP-USER-ORG.sql` script

---

## Database Changes

### Required Migration

Run this SQL script before using the payment link API:

```sql
-- File: supabase/ADD-PAYMENT-COLUMNS.sql

-- Add default_currency to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS default_currency VARCHAR(3) DEFAULT 'USD';

-- Add payment columns to invoices
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS payment_link TEXT;

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS payment_token TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_invoices_payment_token 
ON invoices(payment_token) 
WHERE payment_token IS NOT NULL;
```

### Column Descriptions

**organizations.default_currency**:
- Type: VARCHAR(3)
- Default: 'USD'
- Purpose: Organization's preferred currency for payments

**invoices.payment_link**:
- Type: TEXT
- Nullable: Yes
- Purpose: Full DPO payment URL for customer

**invoices.payment_token**:
- Type: TEXT
- Nullable: Yes
- Purpose: DPO transaction token for verification

---

## Security Considerations

### Authentication & Authorization

- ✅ User must be authenticated
- ✅ Invoice must belong to user's organization
- ✅ Only organization members can generate payment links

### Data Protection

- ✅ Payment token stored securely in database
- ✅ DPO credentials never exposed to client
- ✅ All payment processing done server-side
- ✅ HTTPS enforced for redirect URLs

### Validation

- ✅ Email address validated
- ✅ Amount validated (must be > 0)
- ✅ Currency code validated (3-letter ISO)
- ✅ Invoice status checked (not already paid)

---

## Testing

### Manual Testing

1. **Prerequisites**:
   - Run `ADD-PAYMENT-COLUMNS.sql` migration
   - Set DPO credentials in `.env.local`
   - Have an unpaid invoice in database

2. **Test Payment Link Generation**:
   ```bash
   # Generate payment link
   curl -X POST http://localhost:3000/api/invoices/{invoice-id}/payment-link \
     -H "Cookie: your-session-cookie" \
     -H "Content-Type: application/json"
   ```

3. **Verify Response**:
   - Should return 201 status
   - Should include `paymentUrl`
   - Should include `paymentToken`

4. **Check Database**:
   ```sql
   SELECT payment_link, payment_token 
   FROM invoices 
   WHERE id = '{invoice-id}';
   ```

5. **Test Error Cases**:
   - Try with paid invoice (should fail with 400)
   - Try with invalid invoice ID (should fail with 404)
   - Try without authentication (should fail with 401)

### Integration Testing

```typescript
describe('Payment Link API', () => {
  it('should generate payment link for unpaid invoice', async () => {
    const response = await fetch(`/api/invoices/${invoiceId}/payment-link`, {
      method: 'POST',
      credentials: 'include',
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.paymentUrl).toContain('secure.3gdirectpay.com');
  });

  it('should reject already paid invoice', async () => {
    const response = await fetch(`/api/invoices/${paidInvoiceId}/payment-link`, {
      method: 'POST',
      credentials: 'include',
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invoice is already paid');
  });
});
```

---

## Monitoring & Logging

### Log Events

All payment link operations are logged with the following format:

```typescript
console.log('[Payment Link] Creating DPO payment token for invoice:', {
  invoiceId,
  invoiceNumber,
  amount,
  currency,
  clientEmail,
});

console.log('[Payment Link] DPO payment token created successfully:', {
  token,
  invoiceId,
  invoiceNumber,
});

console.error('[Payment Link] DPO payment token creation failed:', {
  error,
  errorCode,
  invoiceId,
});
```

### What to Monitor

1. **Success Rate**: Track payment link generation success/failure ratio
2. **DPO Errors**: Monitor DPO API error codes (especially 904, 901)
3. **Invalid Invoices**: Track attempts to create links for paid invoices
4. **Missing Client Data**: Monitor invoices with missing client emails

---

## Related Files

- `lib/payments/dpo.ts` - DPO integration module
- `lib/payments/DPO-INTEGRATION.md` - DPO API documentation
- `supabase/ADD-PAYMENT-COLUMNS.sql` - Database migration
- `app/api/invoices/[id]/payment-success/page.tsx` - Payment result handler (to be created)
- `app/api/webhooks/dpo/route.ts` - DPO webhook handler (to be created)

---

## Next Steps

### Recommended Implementations

1. **Payment Success Page** - Handle customer redirect after payment
2. **Webhook Handler** - Process DPO payment notifications
3. **Email Integration** - Send payment links to customers
4. **Invoice UI** - Add "Generate Payment Link" button
5. **Payment History** - Track all payment attempts

---

**Last Updated**: October 4, 2025  
**API Version**: 1.0.0  
**Status**: ✅ Ready for use

