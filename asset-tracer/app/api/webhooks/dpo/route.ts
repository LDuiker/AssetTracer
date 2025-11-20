import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyWebhookSignature, verifyPaymentToken } from '@/lib/payments/dpo';

/**
 * Parse XML webhook payload from DPO
 * DPO sends webhooks in XML format
 */
function parseXMLWebhook(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  
  // Extract tag-value pairs using regex
  const tagRegex = /<([^>\/]+)>([^<]*)<\/\1>/g;
  let match;
  
  while ((match = tagRegex.exec(xml)) !== null) {
    const [, tag, value] = match;
    result[tag] = value;
  }
  
  return result;
}

/**
 * POST /api/webhooks/dpo
 * Handle payment notifications from DPO
 * 
 * ⚠️ WEBHOOKS CURRENTLY DISABLED
 * This endpoint is disabled until DPO webhook configuration is complete.
 * Payment verification is handled via the redirect flow instead.
 * 
 * IMPORTANT: This endpoint must be excluded from authentication middleware
 * as it's called by DPO's servers, not authenticated users.
 */
export async function POST(request: NextRequest) {
  // Webhooks are currently disabled - return success to prevent DPO retries
  console.log('[DPO Webhook] Webhook received but webhooks are currently disabled');
  console.log('[DPO Webhook] Payment verification is handled via redirect flow instead');
  
  return NextResponse.json(
    { 
      received: true,
      processed: false,
      message: 'Webhooks are currently disabled. Payment verification handled via redirect flow.'
    },
    { status: 200 }
  );

  /* ============================================
   * DISABLED - Uncomment when DPO webhooks are configured
   * ============================================
   * 
   * To re-enable webhooks:
   * 1. Set up DPO webhook configuration in DPO dashboard
   * 2. Configure DPO_WEBHOOK_SECRET in environment variables
   * 3. Uncomment the code below
   * 4. Remove the early return above
   * 
   * ============================================
   */
  
  /*
  const startTime = Date.now();
  const startTime = Date.now();
  
  console.log('='.repeat(80));
  console.log('[DPO Webhook] Received webhook notification');
  console.log('='.repeat(80));

  try {
    // Get request body
    const contentType = request.headers.get('content-type');
    let payload: Record<string, string> = {};
    let rawBody: string = '';

    console.log('[DPO Webhook] Content-Type:', contentType);

    // Parse payload based on content type
    if (contentType?.includes('application/xml') || contentType?.includes('text/xml')) {
      rawBody = await request.text();
      console.log('[DPO Webhook] Raw XML payload:', rawBody);
      payload = parseXMLWebhook(rawBody);
    } else if (contentType?.includes('application/json')) {
      payload = await request.json();
      rawBody = JSON.stringify(payload);
      console.log('[DPO Webhook] JSON payload:', payload);
    } else {
      // Try to parse as text and determine format
      rawBody = await request.text();
      console.log('[DPO Webhook] Raw payload:', rawBody);
      
      if (rawBody.trim().startsWith('<')) {
        // Looks like XML
        payload = parseXMLWebhook(rawBody);
      } else {
        // Try JSON
        try {
          payload = JSON.parse(rawBody);
        } catch {
          console.error('[DPO Webhook] Unable to parse payload format');
          return NextResponse.json(
            { error: 'Invalid payload format' },
            { status: 400 }
          );
        }
      }
    }

    console.log('[DPO Webhook] Parsed payload:', JSON.stringify(payload, null, 2));

    // Extract webhook signature (may be in headers or payload)
    const signature = request.headers.get('x-dpo-signature') || 
                     request.headers.get('x-signature') ||
                     payload.Signature;

    console.log('[DPO Webhook] Signature present:', !!signature);

    // Verify webhook signature (REQUIRED for security)
    const webhookSecret = process.env.DPO_WEBHOOK_SECRET;
    
    // Always attempt verification - reject if secret is missing or signature is invalid
    if (webhookSecret) {
      if (!signature) {
        console.error('[DPO Webhook] ❌ Webhook secret configured but no signature provided');
        return NextResponse.json(
          { error: 'Signature required' },
          { status: 401 }
        );
      }
      
      const isValid = verifyWebhookSignature(rawBody, signature);
      
      if (!isValid) {
        console.error('[DPO Webhook] ❌ Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
      
      console.log('[DPO Webhook] ✓ Signature verified successfully');
    } else {
      // CRITICAL: Reject webhooks when secret is not configured
      // This prevents accepting forged webhooks in production
      console.error('[DPO Webhook] ❌ Webhook secret not configured - rejecting webhook for security');
      return NextResponse.json(
        { error: 'Webhook verification not configured' },
        { status: 503 } // Service Unavailable - indicates misconfiguration
      );
    }

    // Extract transaction details from payload
    // DPO uses various field names depending on the webhook type
    const transactionToken = payload.TransactionToken || 
                            payload.TransToken || 
                            payload.ID || 
                            payload.token;
    
    const reference = payload.CompanyRef || 
                     payload.Reference || 
                     payload.reference;
    
    const transactionStatus = payload.TransactionApproval || 
                             payload.Status || 
                             payload.status;
    
    const amount = parseFloat(payload.TransactionAmount || 
                             payload.Amount || 
                             payload.amount || 
                             '0');
    
    const currency = payload.TransactionCurrency || 
                    payload.Currency || 
                    payload.currency || 
                    'USD';

    const paymentMethod = payload.PaymentMethod || 
                         payload.Method || 
                         payload.method;

    console.log('[DPO Webhook] Extracted details:', {
      transactionToken,
      reference,
      transactionStatus,
      amount,
      currency,
      paymentMethod,
    });

    // Validate required fields
    if (!transactionToken) {
      console.error('[DPO Webhook] ❌ Missing transaction token');
      return NextResponse.json(
        { error: 'Missing transaction token' },
        { status: 400 }
      );
    }

    if (!reference) {
      console.error('[DPO Webhook] ❌ Missing reference (invoice number)');
      return NextResponse.json(
        { error: 'Missing reference' },
        { status: 400 }
      );
    }

    // Verify payment status with DPO directly (double-check)
    console.log('[DPO Webhook] Verifying payment with DPO API...');
    const verification = await verifyPaymentToken({ token: transactionToken });

    console.log('[DPO Webhook] DPO verification result:', {
      success: verification.success,
      status: verification.status,
      amount: verification.amount,
      transactionId: verification.transactionId,
    });

    if (!verification.success) {
      console.error('[DPO Webhook] ❌ Payment verification failed:', verification.error);
      // Still return 200 to DPO to acknowledge receipt
      return NextResponse.json({ 
        received: true, 
        processed: false,
        reason: 'Payment verification failed'
      });
    }

    // Check if payment is successful
    const isPaid = verification.status === 'PAID' || 
                   transactionStatus === 'Y' || 
                   transactionStatus === 'A' || 
                   transactionStatus === 'APPROVED';

    if (!isPaid) {
      console.log('[DPO Webhook] ℹ️ Payment not successful, status:', verification.status);
      return NextResponse.json({ 
        received: true, 
        processed: false,
        reason: `Payment status: ${verification.status}`
      });
    }

    console.log('[DPO Webhook] ✓ Payment is successful, processing...');

    // Initialize Supabase client (server-side, no auth required)
    const supabase = await createClient();

    // Find invoice by invoice number (reference)
    console.log('[DPO Webhook] Looking up invoice with number:', reference);
    
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, organization_id, status, total_amount, currency, client_id')
      .eq('invoice_number', reference)
      .single();

    if (invoiceError || !invoice) {
      console.error('[DPO Webhook] ❌ Invoice not found:', reference, invoiceError);
      return NextResponse.json({ 
        received: true, 
        processed: false,
        reason: 'Invoice not found'
      });
    }

    console.log('[DPO Webhook] ✓ Invoice found:', {
      id: invoice.id,
      status: invoice.status,
      amount: invoice.total_amount,
    });

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      console.log('[DPO Webhook] ℹ️ Invoice already marked as paid, skipping update');
      return NextResponse.json({ 
        received: true, 
        processed: true,
        reason: 'Invoice already paid'
      });
    }

    // Verify amount matches (optional, with tolerance for minor differences)
    const expectedAmount = invoice.total_amount;
    const receivedAmount = verification.amount || amount;
    const amountDifference = Math.abs(expectedAmount - receivedAmount);
    const tolerance = 0.01; // 1 cent tolerance

    if (amountDifference > tolerance) {
      console.warn('[DPO Webhook] ⚠️ Amount mismatch:', {
        expected: expectedAmount,
        received: receivedAmount,
        difference: amountDifference,
      });
      // Continue anyway - some gateways may have rounding differences
    }

    const paymentDate = verification.paymentDate || new Date().toISOString();

    // Update invoice status
    console.log('[DPO Webhook] Updating invoice status to paid...');
    
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_amount: receivedAmount,
        balance: 0,
        payment_date: paymentDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id)
      .eq('organization_id', invoice.organization_id);

    if (updateError) {
      console.error('[DPO Webhook] ❌ Failed to update invoice:', updateError);
      return NextResponse.json({ 
        received: true, 
        processed: false,
        reason: 'Failed to update invoice'
      }, { status: 500 });
    }

    console.log('[DPO Webhook] ✓ Invoice updated successfully');

    // Create transaction record
    console.log('[DPO Webhook] Creating transaction record...');
    
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        organization_id: invoice.organization_id,
        type: 'income',
        category: 'sales',
        amount: receivedAmount,
        currency: currency,
        transaction_date: paymentDate,
        description: `Payment for Invoice ${reference} via ${paymentMethod || 'DPO'}`,
        reference_number: transactionToken,
        payment_method: paymentMethod?.toLowerCase() || 'online',
        invoice_id: invoice.id,
        client_id: invoice.client_id,
        notes: `DPO Transaction: ${verification.transactionId || transactionToken}`,
        created_by: null, // System-generated transaction
      });

    if (transactionError) {
      console.error('[DPO Webhook] ❌ Failed to create transaction:', transactionError);
      // Don't fail the webhook - invoice is already updated
      console.warn('[DPO Webhook] ⚠️ Continuing despite transaction creation failure');
    } else {
      console.log('[DPO Webhook] ✓ Transaction record created successfully');
    }

    // TODO: Send payment confirmation email
    // await sendPaymentConfirmationEmail(invoice, verification);

    const duration = Date.now() - startTime;
    
    console.log('='.repeat(80));
    console.log('[DPO Webhook] ✅ Webhook processed successfully');
    console.log('[DPO Webhook] Invoice:', reference);
    console.log('[DPO Webhook] Amount:', receivedAmount, currency);
    console.log('[DPO Webhook] Transaction ID:', verification.transactionId || transactionToken);
    console.log('[DPO Webhook] Duration:', duration, 'ms');
    console.log('='.repeat(80));

    // Return success response to DPO
    return NextResponse.json({
      received: true,
      processed: true,
      invoiceNumber: reference,
      transactionId: verification.transactionId || transactionToken,
      message: 'Payment processed successfully',
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('='.repeat(80));
    console.error('[DPO Webhook] ❌ Unexpected error processing webhook');
    console.error('[DPO Webhook] Error:', error);
    console.error('[DPO Webhook] Duration:', duration, 'ms');
    console.error('='.repeat(80));

    // Return 200 to DPO even on error to prevent retries
    // Log the error for investigation
    return NextResponse.json({
      received: true,
      processed: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

/**
 * GET /api/webhooks/dpo
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'DPO Webhook Handler',
    timestamp: new Date().toISOString(),
    webhookSecretConfigured: !!process.env.DPO_WEBHOOK_SECRET,
  });
}

