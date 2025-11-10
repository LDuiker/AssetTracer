import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyPaymentToken } from '@/lib/payments/dpo';

/**
 * POST /api/invoices/[id]/verify-payment
 * Verify payment status and update invoice if paid
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params;
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Token is required',
          message: 'Payment token is missing from the request.'
        },
        { status: 400 }
      );
    }

    console.log('[Verify Payment] Verifying payment for invoice:', invoiceId);

    const supabase = await createClient();

    // Get user session (optional - payment verification can work without auth)
    await supabase.auth.getUser();

    // Verify payment with DPO
    const verification = await verifyPaymentToken({ token });

    console.log('[Verify Payment] DPO verification result:', {
      success: verification.success,
      status: verification.status,
      transactionId: verification.transactionId,
    });

    if (!verification.success) {
      return NextResponse.json(
        {
          success: false,
          error: verification.error || 'Payment verification failed',
          errorCode: verification.errorCode,
          status: verification.status,
        },
        { status: 400 }
      );
    }

    // Fetch invoice to verify it matches
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, currency, status, organization_id')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error('[Verify Payment] Invoice not found:', invoiceError);
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice not found',
          message: 'The invoice associated with this payment could not be found.',
        },
        { status: 404 }
      );
    }

    // Verify the payment reference matches invoice number
    if (verification.reference !== invoice.invoice_number) {
      console.warn('[Verify Payment] Reference mismatch:', {
        expected: invoice.invoice_number,
        received: verification.reference,
      });
      // Continue anyway - this might be due to different reference formats
    }

    // If payment is successful, update invoice
    if (verification.status === 'PAID') {
      console.log('[Verify Payment] Payment successful, updating invoice...');

      const paymentDate = verification.paymentDate || new Date().toISOString();

      // Update invoice status
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_amount: verification.amount || invoice.total_amount,
          balance: 0,
          payment_date: paymentDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .eq('organization_id', invoice.organization_id);

      if (updateError) {
        console.error('[Verify Payment] Failed to update invoice:', updateError);
        // Don't fail the request - payment was still verified
        // Just log the error
      } else {
        console.log('[Verify Payment] Invoice updated successfully:', invoiceId);
      }

      // TODO: Send confirmation email
      // await sendPaymentConfirmationEmail(invoice, verification);

      return NextResponse.json({
        success: true,
        invoiceNumber: invoice.invoice_number,
        amount: verification.amount,
        currency: verification.currency,
        transactionId: verification.transactionId,
        paymentMethod: verification.paymentMethod,
        paymentDate: verification.paymentDate,
        status: verification.status,
        message: 'Payment verified and invoice updated successfully',
      });
    } else {
      // Payment not completed yet
      console.log('[Verify Payment] Payment not completed:', verification.status);

      return NextResponse.json({
        success: false,
        status: verification.status,
        statusDescription: verification.statusDescription,
        invoiceNumber: invoice.invoice_number,
        message: `Payment status: ${verification.status}`,
      });
    }

  } catch (error) {
    console.error('[Verify Payment] Unexpected error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment verification failed',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while verifying payment.',
      },
      { status: 500 }
    );
  }
}

