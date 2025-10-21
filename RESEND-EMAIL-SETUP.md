# 📧 Resend Email Setup Guide

Complete setup guide for email notifications with Resend in AssetTracer.

---

## ✅ What's Been Implemented

### 1. **Resend Integration** ✅
- Resend SDK installed and configured
- React Email templates created
- Email sending logic implemented

### 2. **Email Templates** ✅
Three beautiful, responsive email templates:

#### 📋 Invoice Reminders
- **File:** `emails/InvoiceReminderEmail.tsx`
- **Features:**
  - Invoice number, amount, due date
  - Status indicator (due/overdue)
  - Color-coded urgency
  - "View Invoice" button

#### 📅 Maintenance Alerts
- **File:** `emails/MaintenanceAlertEmail.tsx`
- **Features:**
  - Multiple alerts in one email
  - Priority badges (High/Medium/Low)
  - Invoice and asset reminders
  - "View Dashboard" button

#### 📊 Weekly Reports
- **File:** `emails/WeeklyReportEmail.tsx`
- **Features:**
  - Revenue, expenses, net profit
  - Color-coded financial metrics
  - Weekly highlights
  - "View Full Report" button

### 3. **Automated Cron Jobs** ✅
- **File:** `asset-tracer/vercel.json`
- **Daily:** Invoice reminders (9 AM daily)
- **Weekly:** Financial reports (9 AM every Monday)

### 4. **API Endpoints** ✅
- `/api/cron/send-invoice-reminders` - Daily invoice checks
- `/api/cron/send-weekly-reports` - Weekly financial reports

---

## 🚀 Setup Instructions

### Step 1: Get Resend API Key

1. **Sign up for Resend:**
   - Go to: [https://resend.com/signup](https://resend.com/signup)
   - Create a free account (3,000 emails/month)

2. **Create API Key:**
   - Go to: [https://resend.com/api-keys](https://resend.com/api-keys)
   - Click "Create API Key"
   - Name it: `AssetTracer Production`
   - Copy the API key (starts with `re_...`)

3. **Verify Domain (Important for Production):**
   - Go to: [https://resend.com/domains](https://resend.com/domains)
   - Click "Add Domain"
   - Enter your domain: `yourdomain.com`
   - Add the DNS records provided by Resend
   - Wait for verification (usually a few minutes)

### Step 2: Add Environment Variables

Add these to your `.env.local` file:

```bash
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# Email Configuration
EMAIL_FROM="AssetTracer <notifications@yourdomain.com>"

# Cron Secret (generate a random string)
CRON_SECRET=your_random_secret_string_here

# App URL (for email links)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Generate CRON_SECRET:**

```bash
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Or use this online: https://generate-secret.vercel.app/
```

### Step 3: Add to Production (Vercel)

1. Go to your Vercel project settings
2. Navigate to: **Settings → Environment Variables**
3. Add all 4 environment variables:
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
   - `CRON_SECRET`
   - `NEXT_PUBLIC_APP_URL`

### Step 4: Deploy to Vercel

```bash
# Commit your changes
git add .
git commit -m "Add Resend email integration"

# Push to trigger deployment
git push

# Or deploy manually
vercel --prod
```

### Step 5: Verify Cron Jobs

After deployment:

1. Go to: **Vercel Dashboard → Your Project → Cron**
2. You should see:
   - ✅ `send-invoice-reminders` (Daily at 9 AM)
   - ✅ `send-weekly-reports` (Monday at 9 AM)

---

## 🧪 Testing Locally

### Test Email Templates

Create a test file to preview emails:

```bash
# Create test script
New-Item -Path "asset-tracer/scripts/test-emails.ts" -ItemType File
```

**Content:**
```typescript
import { render } from '@react-email/components';
import InvoiceReminderEmail from '../emails/InvoiceReminderEmail';
import WeeklyReportEmail from '../emails/WeeklyReportEmail';

async function testEmails() {
  // Test Invoice Reminder
  const invoiceHtml = await render(
    InvoiceReminderEmail({
      organizationName: 'Test Company',
      customerName: 'John Doe',
      invoiceNumber: 'INV-001',
      amount: '1,500.00',
      currency: 'USD',
      dueDate: 'January 20, 2025',
      status: 'overdue',
    })
  );
  
  console.log('Invoice Reminder HTML generated');
  
  // Test Weekly Report
  const reportHtml = await render(
    WeeklyReportEmail({
      organizationName: 'Test Company',
      userName: 'John',
      weekOf: 'January 13-19, 2025',
      totalRevenue: '25,480.00',
      totalExpenses: '12,350.00',
      netProfit: '13,130.00',
      currency: 'USD',
      highlights: ['5 new invoices', '3 payments received'],
    })
  );
  
  console.log('Weekly Report HTML generated');
}

testEmails();
```

### Test API Endpoints Manually

```bash
# Test Invoice Reminders
curl http://localhost:3000/api/cron/send-invoice-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test Weekly Reports
curl http://localhost:3000/api/cron/send-weekly-reports \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Send Test Email (Quick Test)

Create a test endpoint:

```typescript
// asset-tracer/app/api/test-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { resend, EMAIL_FROM } from '@/lib/resend';

export async function GET(request: NextRequest) {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: 'your-email@example.com', // Change this!
      subject: '🎉 Test Email from AssetTracer',
      html: '<h1>Email is working!</h1><p>Resend is configured correctly.</p>',
    });

    return NextResponse.json({ success: true, message: 'Test email sent!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

Then visit: `http://localhost:3000/api/test-email`

---

## 📅 Cron Schedule Explained

### Daily Invoice Reminders
```json
"schedule": "0 9 * * *"
```
- Runs **every day at 9:00 AM UTC**
- Checks all invoices that are due or overdue
- Sends reminder emails to organization owners

### Weekly Reports
```json
"schedule": "0 9 * * 1"
```
- Runs **every Monday at 9:00 AM UTC**
- Calculates past week's financial summary
- Sends report with revenue, expenses, highlights

**Cron Format:** `minute hour day month weekday`
- `0 9 * * *` = 9:00 AM every day
- `0 9 * * 1` = 9:00 AM every Monday

### Change Schedule (if needed)

Edit `asset-tracer/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-invoice-reminders",
      "schedule": "0 8 * * *"  // 8 AM instead
    },
    {
      "path": "/api/cron/send-weekly-reports",
      "schedule": "0 10 * * 1"  // 10 AM Monday
    }
  ]
}
```

---

## 🎨 Customize Email Templates

### Change Colors

Edit the email template files:

```typescript
// Change primary button color
const button = {
  backgroundColor: '#3b82f6', // Change to your brand color
  // ...
};

// Change accent colors
const statValue = {
  color: '#10b981', // Green for positive
  // ...
};
```

### Change Logo/Branding

Add your logo to emails:

```typescript
import { Img } from '@react-email/components';

// Add to email template
<Img
  src="https://yourdomain.com/logo.png"
  width="150"
  height="40"
  alt="Company Logo"
  style={{ margin: '0 auto' }}
/>
```

### Add More Content

Emails are React components, so you can add anything:

```typescript
<Section style={customBox}>
  <Heading as="h2">New Feature!</Heading>
  <Text>Check out our new dashboard...</Text>
</Section>
```

---

## 🔒 Security Best Practices

### 1. Protect Cron Endpoints

Always verify the `CRON_SECRET`:

```typescript
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 2. Rate Limiting

On Vercel, cron jobs are already rate-limited. For manual triggers, add:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),
});
```

### 3. Email Validation

Always validate email addresses:

```typescript
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

---

## 📊 Monitoring & Analytics

### Resend Dashboard

Check email performance:
- **Deliverability:** [https://resend.com/emails](https://resend.com/emails)
- **Logs:** See sent emails, opens, clicks
- **Webhooks:** Set up webhooks for bounce handling

### Vercel Logs

Monitor cron job execution:
1. Go to Vercel Dashboard → Your Project
2. Click **Logs** tab
3. Filter by `/api/cron/`
4. See execution times and errors

### Error Tracking

Add error tracking (optional):

```bash
npm install @sentry/nextjs
```

```typescript
import * as Sentry from '@sentry/nextjs';

try {
  // Send email...
} catch (error) {
  Sentry.captureException(error);
  console.error(error);
}
```

---

## 🐛 Troubleshooting

### Emails Not Sending

**Check 1: API Key**
```bash
# Verify in .env.local
echo $RESEND_API_KEY
```

**Check 2: Domain Verification**
- Go to [https://resend.com/domains](https://resend.com/domains)
- Ensure your domain is verified (green checkmark)

**Check 3: From Address**
```bash
# Must match verified domain
EMAIL_FROM="AssetTracer <notifications@verified-domain.com>"
```

**Check 4: Logs**
```bash
# Check Resend logs
# Go to: https://resend.com/emails
```

### Cron Jobs Not Running

**Check 1: vercel.json exists**
```bash
ls asset-tracer/vercel.json
```

**Check 2: Deployed to Vercel**
- Cron jobs only work in production
- Local dev doesn't trigger crons

**Check 3: CRON_SECRET set**
```bash
# Check Vercel environment variables
vercel env ls
```

**Check 4: Manual Trigger**
```bash
curl https://yourdomain.com/api/cron/send-invoice-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Database Not Returning Data

**Check: SQL Migration**
```sql
-- Verify column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
  AND column_name = 'email_notifications_enabled';
```

---

## 📈 Usage & Costs

### Resend Free Tier
- **3,000 emails/month** free
- **100 emails/day** limit
- All features included

### Typical Usage

For **100 Business customers**:
- Daily invoice reminders: ~50 emails/day
- Weekly reports: ~100 emails/week
- Monthly total: ~1,600 emails

**Well within free tier!** 🎉

### Upgrade (if needed)

If you exceed 3,000 emails/month:
- **Pay as you go:** $1 per 1,000 emails
- **Pro plan:** $20/month for 50,000 emails

---

## ✅ Checklist

Before going live, verify:

- [ ] Resend API key added to `.env.local`
- [ ] Resend API key added to Vercel production
- [ ] Domain verified in Resend
- [ ] `EMAIL_FROM` matches verified domain
- [ ] `CRON_SECRET` generated and set
- [ ] `NEXT_PUBLIC_APP_URL` set correctly
- [ ] Deployed to Vercel
- [ ] Cron jobs visible in Vercel dashboard
- [ ] Database migration run (`ADD-EMAIL-NOTIFICATIONS.sql`)
- [ ] Business users have `email_notifications_enabled = true`
- [ ] Test email sent successfully

---

## 🎉 You're Done!

Your email notification system is fully set up! 

### What Happens Next:

1. **Every day at 9 AM UTC:**
   - System checks for due/overdue invoices
   - Sends reminders to Business users

2. **Every Monday at 9 AM UTC:**
   - System calculates weekly financial stats
   - Sends beautiful report emails

3. **Users can control:**
   - Settings → Notifications → Toggle ON/OFF
   - Only Business plan users receive emails

---

## 🆘 Need Help?

If you run into issues:

1. **Check Resend Logs:** [https://resend.com/emails](https://resend.com/emails)
2. **Check Vercel Logs:** Dashboard → Your Project → Logs
3. **Test API endpoints manually** with curl
4. **Verify environment variables** are set

---

## 📚 Additional Resources

- **Resend Docs:** [https://resend.com/docs](https://resend.com/docs)
- **React Email:** [https://react.email](https://react.email)
- **Vercel Cron:** [https://vercel.com/docs/cron-jobs](https://vercel.com/docs/cron-jobs)
- **Email Best Practices:** [https://resend.com/blog/email-best-practices](https://resend.com/blog/email-best-practices)

---

Happy emailing! 📧✨

