# DPO Group Payment Integration

## Overview

This module provides a complete integration with **DPO Group** (Direct Pay Online), a leading payment gateway provider in Africa. DPO supports multiple payment methods including cards, mobile money, and bank transfers across 50+ countries.

---

## Features

✅ **Create Payment Tokens** - Generate secure payment links  
✅ **Verify Payments** - Check payment status and get transaction details  
✅ **Webhook Verification** - Secure webhook signature validation  
✅ **TypeScript Support** - Fully typed interfaces  
✅ **Error Handling** - Comprehensive error reporting  
✅ **XML Support** - Native DPO API format  

---

## Configuration

### Environment Variables

Add these to your `.env.local` file:

```bash
# DPO Configuration
DPO_COMPANY_TOKEN=your-company-token-here
DPO_SERVICE_TYPE=3854
DPO_TEST_MODE=true
DPO_WEBHOOK_SECRET=your-webhook-secret-here
```

### Getting DPO Credentials

1. **Sign up** at [DPO Group](https://www.dpogroup.com/)
2. **Get your Company Token** from the DPO dashboard
3. **Get your Service Type** (default: 3854 for standard payments)
4. **Generate Webhook Secret** for secure webhook handling

---

## API Functions

### 1. Create Payment Token

Generate a payment token and redirect URL for a customer.

**Function**: `createPaymentToken(params)`

**Parameters**:
```typescript
{
  amount: number;           // Payment amount (e.g., 100.00)
  currency: string;         // 3-letter currency code (e.g., 'USD', 'KES')
  reference: string;        // Your unique reference/order ID
  customerEmail: string;    // Customer's email address
  customerPhone?: string;   // Customer's phone number (optional)
  customerName?: string;    // Customer's name (optional)
  redirectUrl: string;      // URL to redirect after payment
  backUrl?: string;         // URL for "Back" button (optional)
  description?: string;     // Payment description (optional)
  metaData?: Record<string, string>; // Additional metadata (optional)
}
```

**Response**:
```typescript
{
  success: boolean;
  token?: string;           // Payment token (e.g., "ABC123XYZ")
  paymentUrl?: string;      // Full payment URL to redirect customer to
  reference?: string;       // Your reference echoed back
  error?: string;           // Error message if failed
  errorCode?: string;       // Error code if failed
  rawResponse?: string;     // Raw XML response from DPO
}
```

**Example Usage**:
```typescript
import { createPaymentToken } from '@/lib/payments/dpo';

// In your API route or server action
const result = await createPaymentToken({
  amount: 150.00,
  currency: 'USD',
  reference: 'INV-2024-001',
  customerEmail: 'customer@example.com',
  customerName: 'John Doe',
  redirectUrl: 'https://myapp.com/payment/success',
  backUrl: 'https://myapp.com/payment/cancel',
  description: 'Invoice #2024-001 Payment',
});

if (result.success) {
  console.log('Payment URL:', result.paymentUrl);
  console.log('Token:', result.token);
  
  // Redirect customer to result.paymentUrl
  // Or return it to frontend to redirect
  return { paymentUrl: result.paymentUrl };
} else {
  console.error('Payment creation failed:', result.error);
  throw new Error(result.error);
}
```

---

### 2. Verify Payment Token

Check the status of a payment and get transaction details.

**Function**: `verifyPaymentToken(params)`

**Parameters**:
```typescript
{
  token: string;  // Payment token to verify
}
```

**Response**:
```typescript
{
  success: boolean;
  transactionToken?: string;
  reference?: string;           // Your original reference
  amount?: number;              // Transaction amount
  currency?: string;            // Transaction currency
  status?: 'PAID' | 'PENDING' | 'FAILED' | 'CANCELLED';
  statusDescription?: string;   // Human-readable status
  transactionId?: string;       // DPO transaction ID
  customerName?: string;
  customerEmail?: string;
  paymentMethod?: string;       // e.g., "VISA", "Mobile Money"
  paymentDate?: string;         // Settlement date
  error?: string;
  errorCode?: string;
  rawResponse?: string;
}
```

**Example Usage**:
```typescript
import { verifyPaymentToken } from '@/lib/payments/dpo';

// After customer returns from payment page
const token = searchParams.get('token');

const result = await verifyPaymentToken({ token });

if (result.success && result.status === 'PAID') {
  console.log('Payment successful!');
  console.log('Amount:', result.amount);
  console.log('Reference:', result.reference);
  console.log('Transaction ID:', result.transactionId);
  
  // Update your database
  await updateInvoiceStatus(result.reference, 'paid');
  
  // Show success message to customer
  return { success: true, message: 'Payment successful!' };
} else {
  console.error('Payment not successful:', result.status);
  return { success: false, message: 'Payment failed or pending' };
}
```

---

### 3. Verify Webhook Signature

Verify that a webhook request is genuinely from DPO.

**Function**: `verifyWebhookSignature(payload, signature)`

**Parameters**:
```typescript
payload: WebhookPayload | string;  // The webhook data
signature: string | null;           // Signature from headers
```

**Response**:
```typescript
boolean  // true if valid, false if invalid
```

**Example Usage**:
```typescript
import { verifyWebhookSignature } from '@/lib/payments/dpo';

// In your webhook API route: app/api/webhooks/dpo/route.ts
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const signature = request.headers.get('x-dpo-signature');
    
    // Verify signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return new Response('Unauthorized', { status: 401 });
    }
    
    console.log('Webhook verified successfully');
    
    // Process the webhook
    const { TransactionToken, Reference, Amount, Currency } = payload;
    
    // Verify the payment status
    const verification = await verifyPaymentToken({ token: TransactionToken });
    
    if (verification.success && verification.status === 'PAID') {
      // Update your database
      await markInvoiceAsPaid(Reference);
      
      console.log(`Payment confirmed for reference: ${Reference}`);
    }
    
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
```

---

### 4. Verify Webhook Token (Alternative)

Some DPO implementations use token-based verification instead of signatures.

**Function**: `verifyWebhookToken(token)`

**Parameters**:
```typescript
token: string;  // Transaction token from webhook
```

**Response**:
```typescript
boolean  // true if token is valid and payment is PAID
```

**Example Usage**:
```typescript
import { verifyWebhookToken } from '@/lib/payments/dpo';

export async function POST(request: Request) {
  const payload = await request.json();
  const { TransactionToken } = payload;
  
  // Verify token directly with DPO
  const isValid = await verifyWebhookToken(TransactionToken);
  
  if (!isValid) {
    return new Response('Invalid token or payment not completed', { status: 400 });
  }
  
  // Process successful payment
  await processPayment(payload);
  
  return new Response('OK', { status: 200 });
}
```

---

## Complete Payment Flow

### Step 1: Create Payment Token

```typescript
// app/api/invoices/[id]/pay/route.ts
import { createPaymentToken } from '@/lib/payments/dpo';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const invoiceId = params.id;
  
  // Fetch invoice from database
  const invoice = await getInvoiceById(invoiceId);
  
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }
  
  // Create payment token
  const result = await createPaymentToken({
    amount: invoice.total_amount,
    currency: invoice.currency,
    reference: invoice.invoice_number,
    customerEmail: invoice.client.email,
    customerName: invoice.client.name,
    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoiceId}/payment-result`,
    description: `Payment for Invoice ${invoice.invoice_number}`,
  });
  
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }
  
  // Save token to database for later verification
  await savePaymentToken(invoiceId, result.token!);
  
  return NextResponse.json({
    paymentUrl: result.paymentUrl,
    token: result.token,
  });
}
```

### Step 2: Handle Payment Return

```typescript
// app/invoices/[id]/payment-result/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyPaymentToken } from '@/lib/payments/dpo';

export default function PaymentResultPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  
  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('failed');
      return;
    }
    
    // Verify payment via API route
    fetch(`/api/invoices/${params.id}/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(res => res.json())
      .then(data => {
        setStatus(data.success ? 'success' : 'failed');
      })
      .catch(() => setStatus('failed'));
  }, [searchParams, params.id]);
  
  if (status === 'loading') {
    return <div>Verifying payment...</div>;
  }
  
  if (status === 'success') {
    return (
      <div>
        <h1>Payment Successful!</h1>
        <p>Your invoice has been paid.</p>
      </div>
    );
  }
  
  return (
    <div>
      <h1>Payment Failed</h1>
      <p>Please try again or contact support.</p>
    </div>
  );
}
```

### Step 3: Verify Payment (API Route)

```typescript
// app/api/invoices/[id]/verify-payment/route.ts
import { NextResponse } from 'next/server';
import { verifyPaymentToken } from '@/lib/payments/dpo';
import { markInvoiceAsPaid } from '@/lib/db/invoices';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Verify with DPO
    const result = await verifyPaymentToken({ token });
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
    
    if (result.status === 'PAID') {
      // Update invoice in database
      await markInvoiceAsPaid(params.id, {
        amount: result.amount!,
        transactionId: result.transactionId!,
        paymentMethod: result.paymentMethod,
        paymentDate: result.paymentDate,
      });
      
      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        transactionId: result.transactionId,
      });
    } else {
      return NextResponse.json({
        success: false,
        status: result.status,
        message: result.statusDescription,
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Step 4: Handle Webhooks (Optional but Recommended)

```typescript
// app/api/webhooks/dpo/route.ts
import { NextResponse } from 'next/server';
import { verifyWebhookSignature, verifyPaymentToken } from '@/lib/payments/dpo';
import { markInvoiceAsPaid } from '@/lib/db/invoices';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const signature = request.headers.get('x-dpo-signature');
    
    // Verify webhook authenticity
    if (!verifyWebhookSignature(payload, signature)) {
      console.error('[Webhook] Invalid signature');
      return new Response('Unauthorized', { status: 401 });
    }
    
    const { TransactionToken, Reference } = payload;
    
    console.log(`[Webhook] Received payment notification for: ${Reference}`);
    
    // Double-check payment status with DPO
    const verification = await verifyPaymentToken({ token: TransactionToken });
    
    if (verification.success && verification.status === 'PAID') {
      // Update invoice status
      await markInvoiceAsPaid(Reference, {
        amount: verification.amount!,
        transactionId: verification.transactionId!,
        paymentMethod: verification.paymentMethod,
        paymentDate: verification.paymentDate,
      });
      
      console.log(`[Webhook] Payment processed for: ${Reference}`);
      
      // Send email notification
      // await sendPaymentConfirmationEmail(Reference);
    }
    
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('[Webhook] Processing error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
```

---

## Supported Currencies

```typescript
const SUPPORTED_CURRENCIES = [
  'USD',  // US Dollar
  'EUR',  // Euro
  'GBP',  // British Pound
  'ZAR',  // South African Rand
  'KES',  // Kenyan Shilling
  'TZS',  // Tanzanian Shilling
  'UGX',  // Ugandan Shilling
  'ZMW',  // Zambian Kwacha
  'MWK',  // Malawian Kwacha
  'NGN',  // Nigerian Naira
  'GHS',  // Ghanaian Cedi
  'BWP',  // Botswana Pula
  'MUR',  // Mauritian Rupee
  'RWF',  // Rwandan Franc
];
```

---

## Error Handling

### Common Error Codes

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `INVALID_AMOUNT` | Amount is zero or negative | Check amount value |
| `INVALID_CURRENCY` | Currency code is not valid | Use 3-letter ISO code |
| `INVALID_REFERENCE` | Reference is empty | Provide a unique reference |
| `INVALID_EMAIL` | Email format is invalid | Validate email address |
| `INVALID_URL` | Redirect URL is invalid | Use full URL with https:// |
| `INVALID_TOKEN` | Token is empty or invalid | Check token value |
| `CREATE_TOKEN_ERROR` | Failed to create token | Check logs for details |
| `VERIFY_TOKEN_ERROR` | Failed to verify token | Check logs for details |
| `901` | Duplicate reference | Use unique reference or set CompanyRefUnique=0 |
| `904` | Invalid company token | Check DPO_COMPANY_TOKEN |

### Error Handling Pattern

```typescript
try {
  const result = await createPaymentToken(params);
  
  if (!result.success) {
    // Handle specific errors
    switch (result.errorCode) {
      case 'INVALID_AMOUNT':
        toast.error('Invalid payment amount');
        break;
      case '904':
        console.error('DPO configuration error');
        toast.error('Payment system unavailable');
        break;
      default:
        toast.error(result.error || 'Payment failed');
    }
    return;
  }
  
  // Success
  window.location.href = result.paymentUrl!;
} catch (error) {
  console.error('Unexpected error:', error);
  toast.error('An unexpected error occurred');
}
```

---

## Testing

### Test Mode

Set `DPO_TEST_MODE=true` in your environment to use test mode.

### Test Cards

DPO provides test cards for different scenarios:

| Card Number | Scenario |
|-------------|----------|
| `4000000000000002` | Successful payment |
| `4000000000000010` | Declined payment |
| `4000000000000028` | Insufficient funds |

Use any future expiry date and any CVV.

### Testing Webhooks

Use tools like **ngrok** to expose your local server:

```bash
ngrok http 3000
```

Then configure the webhook URL in DPO dashboard:
```
https://your-ngrok-url.ngrok.io/api/webhooks/dpo
```

---

## Security Best Practices

1. **Never expose credentials** in client-side code
2. **Always verify payments** server-side before fulfilling orders
3. **Use webhook signatures** to verify authenticity
4. **Store payment tokens** securely in your database
5. **Log all payment events** for audit trail
6. **Use HTTPS** for all redirect URLs
7. **Implement rate limiting** on payment endpoints
8. **Sanitize user inputs** before sending to DPO

---

## Troubleshooting

### Issue: "Organization not found" error

**Solution**: Make sure the user is logged in and has an organization_id.

### Issue: Token creation fails with 904 error

**Solution**: Check that `DPO_COMPANY_TOKEN` is correct in your environment variables.

### Issue: Webhook not receiving events

**Solution**: 
1. Check webhook URL configuration in DPO dashboard
2. Ensure your server is accessible from the internet
3. Check webhook logs in DPO dashboard

### Issue: Payment shows as PENDING

**Solution**: 
- Customer may not have completed payment
- Check payment status in DPO dashboard
- Payment may still be processing (especially for bank transfers)

---

## References

- **DPO Documentation**: https://docs.dpogroup.com/
- **DPO Dashboard**: https://secure.3gdirectpay.com/
- **Support Email**: support@dpogroup.com

---

## License

This integration is provided as part of the AssetTracer application.

---

**Last Updated**: October 4, 2025

