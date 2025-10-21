import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resend, isResendConfigured, EMAIL_FROM } from '@/lib/resend';
import { render } from '@react-email/render';
import InvoiceReminderEmail from '@/emails/InvoiceReminderEmail';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (for security)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Resend is configured
    if (!isResendConfigured()) {
      return NextResponse.json({ 
        error: 'Resend is not configured. Please set RESEND_API_KEY environment variable.' 
      }, { status: 500 });
    }

    const supabase = await createClient();

    // Get all organizations with Business plan and email notifications enabled
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, default_currency, email_notifications_enabled, users!inner(id, email, full_name)')
      .eq('subscription_tier', 'business')
      .eq('email_notifications_enabled', true);

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
    }

    if (!orgs || orgs.length === 0) {
      return NextResponse.json({ message: 'No organizations with email notifications enabled', sent: 0 });
    }

    let emailsSent = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // For each organization, check for due/overdue invoices
    for (const org of orgs) {
      // Get invoices that are due or overdue
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*, clients(name, email)')
        .eq('organization_id', org.id)
        .in('status', ['sent', 'pending'])
        .not('due_date', 'is', null);

      if (invoicesError || !invoices || invoices.length === 0) {
        continue;
      }

      // Filter invoices that are due today or overdue
      const relevantInvoices = invoices.filter(invoice => {
        if (!invoice.due_date) return false;
        const dueDate = new Date(invoice.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate <= today;
      });

      // Send email for each relevant invoice
      for (const invoice of relevantInvoices) {
        const dueDate = new Date(invoice.due_date);
        const isOverdue = dueDate < today;

        // Get the user's email for sending
        const userEmail = (org.users as any)?.email;
        if (!userEmail) continue;

        try {
          const emailHtml = await render(
            InvoiceReminderEmail({
              organizationName: org.name,
              customerName: invoice.clients?.name || 'Customer',
              invoiceNumber: invoice.invoice_number,
              amount: invoice.total_amount?.toFixed(2) || '0.00',
              currency: org.default_currency || 'USD',
              dueDate: dueDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              status: isOverdue ? 'overdue' : 'due',
              invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invoices`,
            })
          );

          await resend.emails.send({
            from: EMAIL_FROM,
            to: userEmail,
            subject: isOverdue 
              ? `⚠️ Invoice ${invoice.invoice_number} is Overdue` 
              : `📋 Invoice ${invoice.invoice_number} Due Today`,
            html: emailHtml,
          });

          emailsSent++;
          console.log(`✅ Sent invoice reminder for ${invoice.invoice_number} to ${userEmail}`);
        } catch (emailError) {
          console.error(`Error sending email for invoice ${invoice.invoice_number}:`, emailError);
        }
      }
    }

    return NextResponse.json({ 
      message: 'Invoice reminders sent successfully',
      sent: emailsSent,
      organizations: orgs.length,
    });

  } catch (error: any) {
    console.error('Error sending invoice reminders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send invoice reminders' },
      { status: 500 }
    );
  }
}

