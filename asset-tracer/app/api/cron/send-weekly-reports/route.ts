import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resend, isResendConfigured, EMAIL_FROM } from '@/lib/resend';
import { render } from '@react-email/render';
import WeeklyReportEmail from '@/emails/WeeklyReportEmail';

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

type InvoiceSummary = {
  total_amount: number | null;
  status: string | null;
};

type ExpenseSummary = {
  amount: number | null;
};

type AssetSummary = {
  id: string;
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

    // Calculate date range for the past week
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);

    const formatWeekRange = (start: Date, end: Date) => {
      const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
      return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`;
    };

    // For each organization, gather weekly stats and send report
    for (const org of orgs) {
      try {
        // Get invoices created this week
        const { data: invoices, error: invoicesError } = await supabase
          .from('invoices')
          .select('total_amount, status')
          .eq('organization_id', org.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .returns<InvoiceSummary[]>();

        if (invoicesError) {
          console.error('Error fetching weekly invoices:', invoicesError);
          continue;
        }

        // Get expenses for this week
        const { data: expenses, error: expensesError } = await supabase
          .from('expenses')
          .select('amount')
          .eq('organization_id', org.id)
          .gte('date', startDate.toISOString())
          .lte('date', endDate.toISOString())
          .returns<ExpenseSummary[]>();

        if (expensesError) {
          console.error('Error fetching weekly expenses:', expensesError);
          continue;
        }

        // Get assets added this week
        const { data: assets, error: assetsError } = await supabase
          .from('assets')
          .select('id')
          .eq('organization_id', org.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .returns<AssetSummary[]>();

        if (assetsError) {
          console.error('Error fetching weekly assets:', assetsError);
          continue;
        }

        // Calculate totals
        const totalRevenue = invoices
          ?.filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

        const totalExpenses = expenses
          ?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;

        const netProfit = totalRevenue - totalExpenses;

        // Create highlights
        const highlights: string[] = [];
        
        if (invoices && invoices.length > 0) {
          highlights.push(`${invoices.length} new invoice${invoices.length !== 1 ? 's' : ''} created`);
        }
        
        const paidInvoices = invoices?.filter(inv => inv.status === 'paid').length || 0;
        if (paidInvoices > 0) {
          highlights.push(`${paidInvoices} payment${paidInvoices !== 1 ? 's' : ''} received`);
        }
        
        if (assets && assets.length > 0) {
          highlights.push(`${assets.length} new asset${assets.length !== 1 ? 's' : ''} added`);
        }

        if (totalRevenue > 0) {
          highlights.push(`Generated ${org.default_currency || 'USD'} ${totalRevenue.toFixed(2)} in revenue`);
        }

        if (highlights.length === 0) {
          highlights.push('No activity this week');
        }

        // Get the user's email for sending
        const primaryUser = org.users?.[0];
        const userEmail = primaryUser?.email ?? null;
        const userName = primaryUser?.full_name || 'User';
        
        if (!userEmail) continue;

        const emailHtml = await render(
          WeeklyReportEmail({
            organizationName: org.name,
            userName,
            weekOf: formatWeekRange(startDate, endDate),
            totalRevenue: totalRevenue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
            totalExpenses: totalExpenses.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
            netProfit: netProfit.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
            currency: org.default_currency || 'USD',
            highlights,
            reportsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reports`,
          })
        );

        await resend.emails.send({
          from: EMAIL_FROM,
          to: userEmail,
          subject: `📊 Your Weekly Financial Report - ${org.name}`,
          html: emailHtml,
        });

        emailsSent++;
        console.log(`✅ Sent weekly report to ${userEmail} for ${org.name}`);
      } catch (emailError) {
        console.error(`Error sending weekly report for org ${org.id}:`, emailError);
      }
    }

    return NextResponse.json({ 
      message: 'Weekly reports sent successfully',
      sent: emailsSent,
      organizations: orgs.length,
    });

  } catch (error: unknown) {
    console.error('Error sending weekly reports:', error);
    const message = error instanceof Error ? error.message : 'Failed to send weekly reports';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

