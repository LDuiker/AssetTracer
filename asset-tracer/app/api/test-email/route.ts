import { NextRequest, NextResponse } from 'next/server';
import { resend, isResendConfigured, EMAIL_FROM } from '@/lib/resend';
import { render } from '@react-email/render';
import InvoiceReminderEmail from '@/emails/InvoiceReminderEmail';

export async function GET(request: NextRequest) {
  try {
    // Check if Resend is configured
    if (!isResendConfigured()) {
      return NextResponse.json({ 
        error: 'Resend is not configured. Please set RESEND_API_KEY in your environment variables.' 
      }, { status: 500 });
    }

    // Get email from query params
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get('email');

    if (!testEmail) {
      return NextResponse.json({ 
        error: 'Please provide an email address: /api/test-email?email=your@email.com' 
      }, { status: 400 });
    }

    // Test 1: Simple HTML email
    const simpleResult = await resend.emails.send({
      from: EMAIL_FROM,
      to: testEmail,
      subject: '🎉 Test Email from AssetTracer',
      html: `
        <h1 style="color: #3b82f6;">Email is working!</h1>
        <p>Resend is configured correctly.</p>
        <p><strong>Time sent:</strong> ${new Date().toLocaleString()}</p>
      `,
    });

    // Test 2: React Email template
    const templateHtml = await render(
      InvoiceReminderEmail({
        organizationName: 'Test Company',
        customerName: 'Test User',
        invoiceNumber: 'INV-TEST-001',
        amount: '1,234.56',
        currency: 'USD',
        dueDate: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        status: 'due',
      })
    );

    const templateResult = await resend.emails.send({
      from: EMAIL_FROM,
      to: testEmail,
      subject: '📋 Test Invoice Reminder Template',
      html: templateHtml,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Test emails sent successfully!',
      simple: simpleResult,
      template: templateResult,
      note: 'Check your inbox (and spam folder)',
    });

  } catch (error: unknown) {
    console.error('Test email error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send test email';
    return NextResponse.json({ 
      error: message,
      details: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    }, { status: 500 });
  }
}

