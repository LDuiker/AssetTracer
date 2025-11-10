import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || 'AssetTracer <notifications@asset-tracer.com>';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, name')
      .eq('id', user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { data: organization } = await supabase
      .from('organizations')
      .select('name, subscription_tier, email_notifications_enabled')
      .eq('id', userData.organization_id)
      .single();

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Send test email
    const emailResult = await resend.emails.send({
      from: EMAIL_FROM,
      to: user.email!,
      subject: '🎉 AssetTracer Email Notification Test',
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 40px auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #3b82f6; margin-bottom: 20px; }
    .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .info-box { background: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>✅ Email Notifications Working!</h1>
    
    <div class="success">
      <p><strong>🎉 Success!</strong></p>
      <p>Your AssetTracer email notification system is configured and working correctly.</p>
    </div>

    <div class="info-box">
      <p><strong>📧 Test Details:</strong></p>
      <ul>
        <li><strong>Organization:</strong> ${organization.name}</li>
        <li><strong>Plan:</strong> ${organization.subscription_tier?.toUpperCase() || 'FREE'}</li>
        <li><strong>User:</strong> ${userData.name || user.email}</li>
        <li><strong>Email:</strong> ${user.email}</li>
        <li><strong>Notifications:</strong> ${organization.email_notifications_enabled ? 'Enabled ✓' : 'Disabled ✗'}</li>
      </ul>
    </div>

    <h2>🚀 What's Next?</h2>
    <p>Your AssetTracer application can now send:</p>
    <ul>
      <li>📋 <strong>Invoice Reminders</strong> - Daily at 9 AM UTC for overdue invoices</li>
      <li>📊 <strong>Weekly Financial Reports</strong> - Every Monday at 9 AM UTC</li>
      <li>🔔 <strong>Maintenance Alerts</strong> - When maintenance is due</li>
    </ul>

    <h3>✅ Verified Configuration:</h3>
    <ul>
      <li>✓ Resend API Key: Valid</li>
      <li>✓ Domain: asset-tracer.com</li>
      <li>✓ Email Sending: Working</li>
      <li>✓ Database Integration: Connected</li>
      <li>✓ User Authentication: Active</li>
    </ul>

    <div class="footer">
      <p>Sent from AssetTracer ${process.env.NODE_ENV === 'production' ? 'Production' : 'Staging'}</p>
      <p>Domain: asset-tracer.com | Powered by Resend</p>
    </div>
  </div>
</body>
</html>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      email_id: emailResult.data?.id,
      sent_to: user.email,
      organization: organization.name,
      tier: organization.subscription_tier,
      instructions: 'Check your inbox (and spam folder) for the test email',
    });

  } catch (error: unknown) {
    console.error('Test email error:', error);
    const message = error instanceof Error ? error.message : '';
    
    // Provide specific error messages
    if (message.includes('403') || message.includes('Forbidden')) {
      return NextResponse.json({
        error: 'Domain not verified yet',
        details: 'Your DNS records are still propagating. Please wait 15-30 minutes and try again.',
        dns_status: 'Check https://resend.com/domains for verification status',
      }, { status: 403 });
    }

    return NextResponse.json({
      error: 'Failed to send test email',
      details: message || 'Unknown error',
      tip: 'Make sure DNS records are verified in Resend dashboard',
    }, { status: 500 });
  }
}

