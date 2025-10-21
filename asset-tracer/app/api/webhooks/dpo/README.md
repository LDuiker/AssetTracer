# DPO Webhook Handler

## Overview

Handles payment notifications from DPO Group. This webhook is called by DPO's servers when payment status changes, allowing automatic invoice updates without user intervention.

---

## Endpoint

### POST `/api/webhooks/dpo`

Receives payment notifications from DPO.

**Authentication**: None required (public endpoint)  
**Content-Type**: `application/xml`, `application/json`, or `text/plain`  
**Called By**: DPO's servers

---

## Webhook Flow

```
1. Customer completes payment on DPO
   ↓
2. DPO processes payment
   ↓
3. DPO sends webhook to /api/webhooks/dpo
   ↓
4. Webhook verifies signature (if configured)
   ↓
5. Webhook parses payload (XML/JSON)
   ↓
6. Webhook verifies payment with DPO API
   ↓
7. Webhook finds invoice by reference number
   ↓
8. Webhook updates invoice status to 'paid'
   ↓
9. Webhook creates transaction record
   ↓
10. Webhook returns 200 OK to DPO
```

---

## Request Format

### DPO XML Payload Example

```xml
<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <TransactionToken>ABC123XYZ</TransactionToken>
  <CompanyRef>INV-2024-001</CompanyRef>
  <TransactionApproval>Y</TransactionApproval>
  <TransactionAmount>150.00</TransactionAmount>
  <TransactionCurrency>USD</TransactionCurrency>
  <PaymentMethod>VISA</PaymentMethod>
  <CustomerName>John Doe</CustomerName>
  <CustomerEmail>john@example.com</CustomerEmail>
</API3G>
```

### DPO JSON Payload Example

```json
{
  "TransactionToken": "ABC123XYZ",
  "CompanyRef": "INV-2024-001",
  "TransactionApproval": "Y",
  "TransactionAmount": "150.00",
  "TransactionCurrency": "USD",
  "PaymentMethod": "VISA",
  "CustomerName": "John Doe",
  "CustomerEmail": "john@example.com"
}
```

---

## Response Format

### Success Response

```json
{
  "received": true,
  "processed": true,
  "invoiceNumber": "INV-2024-001",
  "transactionId": "DPO12345",
  "message": "Payment processed successfully"
}
```

### Already Processed

```json
{
  "received": true,
  "processed": true,
  "reason": "Invoice already paid"
}
```

### Payment Not Successful

```json
{
  "received": true,
  "processed": false,
  "reason": "Payment status: PENDING"
}
```

### Invoice Not Found

```json
{
  "received": true,
  "processed": false,
  "reason": "Invoice not found"
}
```

### Error Response

```json
{
  "received": true,
  "processed": false,
  "error": "Internal server error"
}
```

---

## Processing Logic

### 1. Signature Verification

```typescript
// Verify webhook is from DPO
const signature = request.headers.get('x-dpo-signature');
const isValid = verifyWebhookSignature(rawBody, signature);

if (!isValid) {
  return 401 Unauthorized
}
```

### 2. Payload Parsing

```typescript
// Parse XML or JSON
const payload = parseXMLWebhook(rawBody);

// Extract fields
const transactionToken = payload.TransactionToken;
const reference = payload.CompanyRef; // Invoice number
const status = payload.TransactionApproval;
const amount = parseFloat(payload.TransactionAmount);
```

### 3. Payment Verification

```typescript
// Verify with DPO API
const verification = await verifyPaymentToken({ token: transactionToken });

if (!verification.success || verification.status !== 'PAID') {
  return { processed: false }
}
```

### 4. Invoice Update

```typescript
// Find invoice
const invoice = await supabase
  .from('invoices')
  .select('*')
  .eq('invoice_number', reference)
  .single();

// Update status
await supabase
  .from('invoices')
  .update({
    status: 'paid',
    paid_amount: amount,
    balance: 0,
    payment_date: new Date().toISOString(),
  })
  .eq('id', invoice.id);
```

### 5. Transaction Record

```typescript
// Create transaction record
await supabase
  .from('transactions')
  .insert({
    organization_id: invoice.organization_id,
    type: 'income',
    category: 'sales',
    amount: amount,
    transaction_date: paymentDate,
    description: `Payment for Invoice ${reference}`,
    reference_number: transactionToken,
    invoice_id: invoice.id,
  });
```

---

## Edge Cases Handled

### 1. Invoice Already Paid

**Scenario**: Webhook receives notification for already-paid invoice  
**Handling**: Log event, return success (idempotent)  
**Response**: `{ processed: true, reason: "Invoice already paid" }`

### 2. Invoice Not Found

**Scenario**: Reference number doesn't match any invoice  
**Handling**: Log error, return error  
**Response**: `{ processed: false, reason: "Invoice not found" }`

### 3. Payment Not Successful

**Scenario**: Webhook for cancelled/failed payment  
**Handling**: Log event, don't update invoice  
**Response**: `{ processed: false, reason: "Payment status: FAILED" }`

### 4. Amount Mismatch

**Scenario**: Payment amount differs from invoice total  
**Handling**: Log warning, continue (may be currency conversion)  
**Response**: Continue processing with actual amount

### 5. Duplicate Webhooks

**Scenario**: DPO sends same webhook multiple times  
**Handling**: Check if already paid, skip update  
**Response**: Success (idempotent operation)

### 6. Invalid Signature

**Scenario**: Signature verification fails  
**Handling**: Reject webhook  
**Response**: 401 Unauthorized

### 7. Malformed Payload

**Scenario**: Unable to parse XML/JSON  
**Handling**: Log error, return error  
**Response**: 400 Bad Request

---

## Logging

### Log Events

All webhook events are extensively logged:

**Webhook Received**:
```
[DPO Webhook] Received webhook notification
[DPO Webhook] Content-Type: application/xml
[DPO Webhook] Raw XML payload: <API3G>...</API3G>
[DPO Webhook] Parsed payload: { TransactionToken: "...", ... }
```

**Signature Verification**:
```
[DPO Webhook] Signature present: true
[DPO Webhook] ✓ Signature verified successfully
```

**Payment Verification**:
```
[DPO Webhook] Verifying payment with DPO API...
[DPO Webhook] DPO verification result: { success: true, status: "PAID", ... }
[DPO Webhook] ✓ Payment is successful, processing...
```

**Invoice Update**:
```
[DPO Webhook] Looking up invoice with number: INV-2024-001
[DPO Webhook] ✓ Invoice found: { id: "...", status: "sent", ... }
[DPO Webhook] Updating invoice status to paid...
[DPO Webhook] ✓ Invoice updated successfully
```

**Transaction Creation**:
```
[DPO Webhook] Creating transaction record...
[DPO Webhook] ✓ Transaction record created successfully
```

**Success**:
```
[DPO Webhook] ✅ Webhook processed successfully
[DPO Webhook] Invoice: INV-2024-001
[DPO Webhook] Amount: 150.00 USD
[DPO Webhook] Transaction ID: DPO12345
[DPO Webhook] Duration: 245 ms
```

**Errors**:
```
[DPO Webhook] ❌ Invalid webhook signature
[DPO Webhook] ❌ Invoice not found: INV-2024-999
[DPO Webhook] ❌ Payment verification failed: Invalid token
[DPO Webhook] ❌ Failed to update invoice: Database error
```

---

## Configuration

### DPO Dashboard Setup

1. Log in to [DPO Dashboard](https://secure.3gdirectpay.com/)
2. Navigate to **Settings > Webhooks**
3. Add webhook URL:
   - **Development**: Use ngrok or similar tunnel
   - **Production**: `https://yourapp.com/api/webhooks/dpo`
4. Select events to notify:
   - ✅ Payment Success
   - ✅ Payment Failed
   - ✅ Payment Cancelled
5. Save webhook configuration

### Environment Variables

```bash
# Required for signature verification
DPO_WEBHOOK_SECRET=your-webhook-secret-here

# DPO API credentials (for verification)
DPO_COMPANY_TOKEN=your-company-token
DPO_TEST_MODE=true
```

### Middleware Configuration

**IMPORTANT**: The webhook endpoint is excluded from authentication in `middleware.ts`:

```typescript
const publicRoutes = [
  '/api/webhooks', // Webhooks from external services
]
```

This allows DPO's servers to call the webhook without authentication.

---

## Testing

### Local Testing with ngrok

1. **Install ngrok**:
   ```bash
   npm install -g ngrok
   ```

2. **Expose local server**:
   ```bash
   ngrok http 3000
   ```

3. **Configure webhook URL** in DPO dashboard:
   ```
   https://your-ngrok-url.ngrok.io/api/webhooks/dpo
   ```

4. **Make test payment** using DPO test cards

5. **Check server logs** for webhook events

### Manual Testing

Send a test webhook using curl:

```bash
curl -X POST http://localhost:3000/api/webhooks/dpo \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <TransactionToken>TEST123</TransactionToken>
  <CompanyRef>INV-2024-001</CompanyRef>
  <TransactionApproval>Y</TransactionApproval>
  <TransactionAmount>150.00</TransactionAmount>
  <TransactionCurrency>USD</TransactionCurrency>
</API3G>'
```

### Health Check

```bash
# Check webhook endpoint is accessible
curl http://localhost:3000/api/webhooks/dpo

# Response:
{
  "status": "ok",
  "service": "DPO Webhook Handler",
  "timestamp": "2024-10-04T10:30:00.000Z",
  "webhookSecretConfigured": true
}
```

---

## Monitoring

### Metrics to Track

1. **Webhook Receipt Rate**: Number of webhooks received per hour
2. **Processing Success Rate**: Percentage of successfully processed webhooks
3. **Processing Time**: Average time to process webhook
4. **Error Rate**: Percentage of failed webhooks by error type
5. **Duplicate Rate**: Percentage of duplicate webhooks

### Alerts to Set Up

1. **High Error Rate**: Alert if >5% of webhooks fail
2. **Processing Delays**: Alert if processing time >5 seconds
3. **Signature Failures**: Alert on invalid signature attempts
4. **Invoice Not Found**: Alert on missing invoice references

### Dashboard Queries

**Successful Payments (Last 24 Hours)**:
```sql
SELECT COUNT(*) 
FROM invoices 
WHERE status = 'paid' 
  AND payment_date > NOW() - INTERVAL '24 hours';
```

**Webhook Processing Errors**:
```sql
-- Check server logs for:
grep "❌" logs/webhook.log | tail -100
```

---

## Security

### Implemented Security Measures

1. ✅ **Signature Verification**: HMAC-SHA256 signature check
2. ✅ **Payment Verification**: Double-check with DPO API
3. ✅ **Idempotency**: Handle duplicate webhooks gracefully
4. ✅ **Error Sanitization**: Don't expose internal errors
5. ✅ **Input Validation**: Validate all webhook data
6. ✅ **Organization Scoping**: Only update invoices for valid organizations

### Best Practices

1. **Always verify signature** if webhook secret is configured
2. **Always verify payment** with DPO API (don't trust webhook alone)
3. **Check invoice status** before updating (idempotency)
4. **Validate amount** matches expected (with tolerance)
5. **Log everything** for audit trail
6. **Return 200 OK** even on errors (prevent retries for permanent errors)
7. **Handle duplicates** gracefully

---

## Troubleshooting

### Issue: Webhooks not received

**Possible Causes**:
- Webhook URL not configured in DPO dashboard
- Firewall blocking DPO IP addresses
- Server not accessible from internet
- ngrok tunnel expired (dev environment)

**Solution**:
1. Check webhook configuration in DPO dashboard
2. Verify URL is correct and accessible
3. Check server logs for any incoming requests
4. Test with curl to verify endpoint works

### Issue: Invalid signature errors

**Possible Causes**:
- Webhook secret mismatch
- Payload modification in transit
- Incorrect signature header

**Solution**:
1. Verify `DPO_WEBHOOK_SECRET` matches DPO dashboard
2. Check signature header name (`x-dpo-signature`)
3. Log raw payload and signature for debugging

### Issue: Invoice not found

**Possible Causes**:
- Invoice number mismatch
- Invoice deleted
- Wrong organization

**Solution**:
1. Check invoice number in webhook payload
2. Verify invoice exists in database
3. Check organization ID matches

### Issue: Payment already processed

**Scenario**: Not an error - duplicate webhook  
**Action**: No action needed (idempotent behavior)

### Issue: Amount mismatch

**Possible Causes**:
- Currency conversion
- Fees deducted
- Rounding differences

**Solution**:
1. Check if amounts are close (tolerance)
2. Verify currency matches
3. Check if gateway fees applied

---

## Future Enhancements

### Immediate
1. **Email Notifications**: Send confirmation emails on successful payment
2. **Webhook Retry Logic**: Handle failed webhooks with retry
3. **Webhook Queue**: Process webhooks asynchronously

### Advanced
1. **Webhook Logging**: Store webhook payloads in database
2. **Webhook Analytics**: Dashboard showing webhook statistics
3. **Multiple Webhooks**: Support other payment gateways
4. **Webhook Testing**: UI for testing webhook handling
5. **Webhook Replay**: Ability to replay failed webhooks

---

## Related Files

- `lib/payments/dpo.ts` - DPO integration module
- `app/api/invoices/[id]/payment-link/route.ts` - Generate payment links
- `app/api/invoices/[id]/verify-payment/route.ts` - Verify payments
- `app/(dashboard)/invoices/[id]/payment-success/page.tsx` - Success page
- `middleware.ts` - Authentication middleware

---

## API Reference

### Health Check

**GET** `/api/webhooks/dpo`

**Response**:
```json
{
  "status": "ok",
  "service": "DPO Webhook Handler",
  "timestamp": "2024-10-04T10:30:00.000Z",
  "webhookSecretConfigured": true
}
```

### Process Webhook

**POST** `/api/webhooks/dpo`

**Headers**:
- `Content-Type`: `application/xml` or `application/json`
- `x-dpo-signature` (optional): HMAC signature

**Body**: XML or JSON payload from DPO

**Response**: See "Response Format" section above

---

**Last Updated**: October 4, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

