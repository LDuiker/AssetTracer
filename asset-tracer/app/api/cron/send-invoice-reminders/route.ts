import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resend, isResendConfigured, EMAIL_FROM } from '@/lib/resend';
import { render } from '@react-email/render';
import InvoiceReminderEmail from '@/emails/InvoiceReminderEmail';

type OrganizationWithUsers = {
  id: string;
  name: string | null;
  default_currency: string | null;
  email_notifications_enabled: boolean;
  users: Array<{
    id: string;
    email: string | null;
    full_name: string | null;
  }>;
};

type InvoiceWithClient = {
  invoice_number: string;
  total_amount: number | null;
  total: number | null;
  due_date: string | null;
  status: string | null;
  clients: {
    name: string | null;
    email: string | null;
  } | null;
};

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
      .eq('email_notifications_enabled', true)
      .returns<OrganizationWithUsers[]>();

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
        .select('invoice_number, total_amount, total, due_date, status, clients(name, email)')
        .eq('organization_id', org.id)
        .in('status', ['sent', 'pending'])
        .not('due_date', 'is', null)
        .returns<InvoiceWithClient[]>();

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
        const userEmail = org.users?.[0]?.email ?? null;
        if (!userEmail) continue;

        try {
          const amountValue = invoice.total_amount ?? invoice.total ?? 0;
          const normalizedAmount =
            typeof amountValue === 'number' ? amountValue : Number(amountValue ?? 0);

          const emailHtml = await render(
            InvoiceReminderEmail({
              organizationName: org.name,
              customerName: invoice.clients?.name || 'Customer',
              invoiceNumber: invoice.invoice_number,
              amount: normalizedAmount.toFixed(2),
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

  } catch (error: unknown) {
    console.error('Error sending invoice reminders:', error);
    const message = error instanceof Error ? error.message : 'Failed to send invoice reminders';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

