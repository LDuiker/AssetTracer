# Email Notifications System - Implementation Guide

## ✅ What's Been Implemented

### 1. Database Schema ✅
- Added `email_notifications_enabled` column to `organizations` table
- Business plan users can toggle email notifications on/off
- Defaults to `true` for Business plan, `false` for others

### 2. API Endpoints ✅
**Location:** `asset-tracer/app/api/notifications/preferences/route.ts`

#### GET `/api/notifications/preferences`
- Fetches current notification preference for the user's organization
- Returns: `{ email_notifications_enabled: boolean, subscription_tier: string }`
- **Business plan only**

#### PATCH `/api/notifications/preferences`
- Updates notification preference
- Body: `{ email_notifications_enabled: boolean }`
- **Business plan only** - returns 403 for Free/Pro users

### 3. Frontend UI ✅
**Location:** `asset-tracer/app/(dashboard)/settings/page.tsx`

- **Tab Restriction:** Notifications tab is disabled for Free & Pro users
- **Toggle Control:** Business users can enable/disable all email notifications
- **Real-time Sync:** Preferences are fetched on load and saved on change
- **Visual Feedback:** Toast notifications for success/error states
- **Graceful Fallback:** Shows upgrade prompt for non-Business users

---

## 📧 Email Types Included

When `email_notifications_enabled` is `true`, Business users receive:

### 1. Invoice Reminders
- **Trigger:** When invoices are due or overdue
- **Content:** Invoice details, due date, amount owed, payment link
- **Frequency:** Daily check for due/overdue invoices

### 2. Scheduled Reminders & Maintenance Alerts
- **Trigger:** Asset maintenance schedules and invoice due dates
- **Content:** Upcoming maintenance tasks, scheduled due dates
- **Frequency:** Based on schedule (daily/weekly)

### 3. Weekly Reports
- **Trigger:** Every Monday at 9 AM (user's timezone)
- **Content:** Financial summaries, revenue vs expenses, asset utilization
- **Frequency:** Weekly

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

Run the SQL migration in Supabase SQL Editor:

```bash
# File location
./ADD-EMAIL-NOTIFICATIONS.sql
```

Or run directly in Supabase:

```sql
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_organizations_email_notifications 
ON organizations(email_notifications_enabled);

UPDATE organizations 
SET email_notifications_enabled = CASE 
  WHEN subscription_tier = 'business' THEN true
  ELSE false
END
WHERE email_notifications_enabled IS NULL;
```

### Step 2: Verify Database

Check that the column was added:

```sql
SELECT 
  id,
  name,
  subscription_tier,
  email_notifications_enabled
FROM organizations
ORDER BY created_at DESC
LIMIT 10;
```

### Step 3: Test the UI

1. **Refresh browser:** `Ctrl+Shift+R`
2. **Navigate to:** Settings → Notifications tab
3. **As Business user:**
   - Toggle ON/OFF
   - Click "Save Preferences"
   - See success toast
4. **As Free/Pro user:**
   - See disabled tab with "Business" badge
   - Click tab to see upgrade prompt

---

## 🔧 Next Steps: Implement Email Sending

### Option 1: Supabase Edge Functions (Recommended)

Create scheduled Edge Functions to send emails:

```typescript
// supabase/functions/send-weekly-reports/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get organizations with email notifications enabled
  const { data: orgs } = await supabase
    .from('organizations')
    .select('*')
    .eq('subscription_tier', 'business')
    .eq('email_notifications_enabled', true)

  // Send emails using Resend, SendGrid, or similar
  for (const org of orgs || []) {
    await sendWeeklyReport(org)
  }

  return new Response(JSON.stringify({ sent: orgs?.length || 0 }))
})
```

**Schedule with Supabase Cron:**
```sql
SELECT cron.schedule(
  'weekly-reports',
  '0 9 * * 1', -- Every Monday at 9 AM
  $$ SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/send-weekly-reports',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) $$
);
```

### Option 2: Vercel Cron Jobs

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-invoice-reminders",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/send-weekly-reports",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

Create API route:

```typescript
// app/api/cron/send-weekly-reports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // Get organizations with notifications enabled
  const { data: orgs } = await supabase
    .from('organizations')
    .select('*, users(*)')
    .eq('subscription_tier', 'business')
    .eq('email_notifications_enabled', true);

  // Send emails...

  return NextResponse.json({ sent: orgs?.length || 0 });
}
```

### Option 3: External Service (Zapier, Make.com)

1. **Webhook Trigger:** Create a webhook endpoint
2. **Schedule:** Set up daily/weekly triggers
3. **Query Database:** Fetch orgs with notifications enabled
4. **Send Emails:** Use Gmail, SendGrid, Mailgun, etc.

---

## 📨 Email Service Recommendations

### 1. Resend (Recommended)
- **Pros:** Developer-friendly, React Email templates, good deliverability
- **Free Tier:** 3,000 emails/month
- **Setup:**
```bash
npm install resend
```

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'AssetTracer <notifications@yourapp.com>',
  to: user.email,
  subject: 'Weekly Financial Report',
  html: '<p>Your weekly report...</p>',
});
```

### 2. SendGrid
- **Pros:** Robust, good documentation
- **Free Tier:** 100 emails/day

### 3. Postmark
- **Pros:** Best deliverability, great for transactional emails
- **Free Tier:** 100 emails/month

---

## 🎯 Email Templates

### Invoice Reminder Template

**Subject:** Invoice #INV-{invoice_number} Due {due_date}

**Body:**
```
Hi {customer_name},

This is a friendly reminder that Invoice #INV-{invoice_number} is {status}.

Amount Due: {amount}
Due Date: {due_date}

[View Invoice] [Pay Now]

Best regards,
{organization_name}
```

### Weekly Report Template

**Subject:** Your Weekly Financial Report - {week_of}

**Body:**
```
Hi {user_name},

Here's your weekly financial summary for {organization_name}:

📊 Financial Overview
Total Revenue: {total_revenue}
Total Expenses: {total_expenses}
Net Profit: {net_profit}

📈 This Week's Highlights
- {highlight_1}
- {highlight_2}
- {highlight_3}

[View Full Report]

Best regards,
AssetTracer Team
```

---

## 🔒 Security Considerations

1. **Cron Secret:** Always verify cron job requests with a secret token
2. **Rate Limiting:** Prevent abuse of email endpoints
3. **Unsubscribe Link:** Include unsubscribe option in all emails (legal requirement)
4. **Email Verification:** Only send to verified email addresses
5. **Bounce Handling:** Track and handle bounced emails

---

## 🧪 Testing

### Test API Endpoint

```bash
# Get current preferences
curl http://localhost:3000/api/notifications/preferences \
  -H "Cookie: your-session-cookie"

# Update preferences
curl -X PATCH http://localhost:3000/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"email_notifications_enabled": true}'
```

### Test Email Sending (when implemented)

```bash
# Manually trigger cron job (with cron secret)
curl http://localhost:3000/api/cron/send-weekly-reports \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 📊 Monitoring & Analytics

Track email performance:

1. **Delivery Rate:** % of emails successfully delivered
2. **Open Rate:** % of emails opened
3. **Click Rate:** % of links clicked
4. **Unsubscribe Rate:** % of users who unsubscribe
5. **Bounce Rate:** % of emails that bounced

Use tools like:
- Resend Analytics
- SendGrid Analytics
- PostHog (for user behavior)

---

## ✅ Summary

| Feature | Status |
|---------|--------|
| Database Schema | ✅ Complete |
| API Endpoints | ✅ Complete |
| Frontend UI | ✅ Complete |
| Business Plan Restriction | ✅ Complete |
| Email Sending Logic | ⏳ To Implement |
| Scheduled Jobs | ⏳ To Implement |
| Email Templates | ⏳ To Implement |

---

## 🎉 What Works Now

1. ✅ Business users can toggle email notifications
2. ✅ Preferences are saved to database
3. ✅ Free/Pro users see upgrade prompt
4. ✅ Tab is properly restricted
5. ✅ UI shows what emails they'll receive

---

## 🚧 What's Next

To complete the email system:

1. **Choose email provider** (Resend recommended)
2. **Set up scheduled jobs** (Supabase Cron or Vercel Cron)
3. **Create email templates** (HTML/React Email)
4. **Implement sending logic** (API routes or Edge Functions)
5. **Add unsubscribe functionality**
6. **Monitor deliverability**

---

Need help implementing the email sending? Let me know which option you prefer! 🚀

