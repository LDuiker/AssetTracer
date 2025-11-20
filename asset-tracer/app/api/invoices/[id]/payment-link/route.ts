import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPaymentToken } from '@/lib/payments/dpo';

/**
 * POST /api/invoices/[id]/payment-link
 * Generate a DPO payment link for an invoice
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    const supabase = await createClient();

    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const organizationId = userData.organization_id;

    // Fetch invoice with client details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients (
          id,
          name,
          email,
          phone,
          company
        )
      `)
      .eq('id', invoiceId)
      .eq('organization_id', organizationId)
      .single();

    if (invoiceError || !invoice) {
      console.error('Invoice fetch error:', invoiceError);
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Verify invoice is not already paid
    if (invoice.status === 'paid') {
      return NextResponse.json(
        { 
          error: 'Invoice is already paid',
          message: 'This invoice has already been paid and cannot be paid again.'
        },
        { status: 400 }
      );
    }

    // Verify invoice has required details
    if (!invoice.client) {
      return NextResponse.json(
        { error: 'Invoice has no associated client' },
        { status: 400 }
      );
    }

    if (!invoice.client.email) {
      return NextResponse.json(
        { 
          error: 'Client email is required',
          message: 'The client associated with this invoice does not have an email address. Please add one before generating a payment link.'
        },
        { status: 400 }
      );
    }

    if (!invoice.total || invoice.total <= 0) {
      return NextResponse.json(
        { 
          error: 'Invalid invoice amount',
          message: 'Invoice amount must be greater than zero.'
        },
        { status: 400 }
      );
    }

    // Get organization settings for default currency
    const { data: orgSettings } = await supabase
      .from('organizations')
      .select('default_currency')
      .eq('id', organizationId)
      .single();

    const currency = invoice.currency || orgSettings?.default_currency || 'USD';

    // Prepare payment details
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUrl = `${appUrl}/invoices/${invoiceId}/payment-success`;
    const backUrl = `${appUrl}/invoices/${invoiceId}`;

    console.log('[Payment Link] Creating DPO payment token for invoice:', {
      invoiceId,
      invoiceNumber: invoice.invoice_number,
      amount: invoice.total,
      currency,
      clientEmail: invoice.client.email,
    });

    // Create payment token with DPO
    const paymentResult = await createPaymentToken({
      amount: invoice.total,
      currency: currency,
      reference: invoice.invoice_number,
      customerEmail: invoice.client.email,
      customerName: invoice.client.name || invoice.client.company,
      customerPhone: invoice.client.phone || undefined,
      redirectUrl: redirectUrl,
      backUrl: backUrl,
      description: `Payment for Invoice ${invoice.invoice_number}${invoice.client.company ? ` - ${invoice.client.company}` : ''}`,
    });

    // Handle DPO API errors
    if (!paymentResult.success) {
      console.error('[Payment Link] DPO payment token creation failed:', {
        error: paymentResult.error,
        errorCode: paymentResult.errorCode,
        invoiceId,
      });

      // Map DPO error codes to user-friendly messages
      let errorMessage = paymentResult.error || 'Failed to create payment link';
      
      switch (paymentResult.errorCode) {
        case '904':
          errorMessage = 'Payment gateway configuration error. Please contact support.';
          break;
        case '901':
          errorMessage = 'Duplicate payment reference. Please try again.';
          break;
        case 'INVALID_EMAIL':
          errorMessage = 'Invalid client email address.';
          break;
        case 'INVALID_CURRENCY':
          errorMessage = `Currency '${currency}' is not supported.`;
          break;
        case 'INVALID_AMOUNT':
          errorMessage = 'Invalid invoice amount.';
          break;
      }

      return NextResponse.json(
        {
          error: 'Payment link generation failed',
          message: errorMessage,
          details: paymentResult.error,
          errorCode: paymentResult.errorCode,
        },
        { status: 400 }
      );
    }

    console.log('[Payment Link] DPO payment token created successfully:', {
      token: paymentResult.token,
      invoiceId,
      invoiceNumber: invoice.invoice_number,
    });

    // Update invoice with payment link and token
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        payment_link: paymentResult.paymentUrl,
        payment_token: paymentResult.token,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .eq('organization_id', organizationId);

    if (updateError) {
      console.error('[Payment Link] Failed to update invoice:', updateError);
      // Don't fail the request, payment link is still valid
      // Just log the error
    }

    // Log payment link generation
    console.log('[Payment Link] Payment link generated successfully:', {
      invoiceId,
      invoiceNumber: invoice.invoice_number,
      paymentUrl: paymentResult.paymentUrl,
      amount: invoice.total,
      currency,
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        paymentUrl: paymentResult.paymentUrl,
        paymentToken: paymentResult.token,
        amount: invoice.total,
        currency: currency,
        invoiceNumber: invoice.invoice_number,
        message: 'Payment link generated successfully',
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('[Payment Link] Unexpected error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      // Check for DPO configuration errors
      if (error.message.includes('DPO_COMPANY_TOKEN')) {
        return NextResponse.json(
          {
            error: 'Payment gateway not configured',
            message: 'Payment system is not properly configured. Please contact support.',
          },
          { status: 500 }
        );
      }

      return createErrorResponse(
        error,
        'Internal server error',
        500
      );
    }

    return createErrorResponse(
      error,
      'An unexpected error occurred while generating the payment link.',
      500
    );
  }
}

/**
 * GET /api/invoices/[id]/payment-link
 * Retrieve existing payment link for an invoice
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params;
    const supabase = await createClient();

    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const organizationId = userData.organization_id;

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, invoice_number, payment_link, payment_token, total, currency, status')
      .eq('id', invoiceId)
      .eq('organization_id', organizationId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Check if payment link exists
    if (!invoice.payment_link) {
      return NextResponse.json(
        {
          hasPaymentLink: false,
          message: 'No payment link has been generated for this invoice.',
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        hasPaymentLink: true,
        paymentUrl: invoice.payment_link,
        paymentToken: invoice.payment_token,
        amount: invoice.total,
        currency: invoice.currency || 'USD',
        invoiceNumber: invoice.invoice_number,
        status: invoice.status,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[Payment Link GET] Unexpected error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred.',
      },
      { status: 500 }
    );
  }
}

