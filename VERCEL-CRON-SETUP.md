# ⏰ Vercel Cron Jobs Setup

## Issue: Cron Job Limit

Vercel free/hobby plans limit you to **2 Cron Jobs per team**. To avoid using up the limit in staging, we removed cron jobs from `vercel.json`.

---

## Setup Cron Jobs for Production Only

### Via Vercel Dashboard (Recommended)

1. **Go to Production Project Settings**
   ```
   https://vercel.com/dashboard → Your Project → Settings → Cron Jobs
   ```

2. **Add Invoice Reminders Cron**
   - **Path**: `/api/cron/send-invoice-reminders`
   - **Schedule**: `0 9 * * *` (Daily at 9 AM)
   - **Environment**: Production only

3. **Add Weekly Reports Cron**
   - **Path**: `/api/cron/send-weekly-reports`
   - **Schedule**: `0 9 * * 1` (Mondays at 9 AM)
   - **Environment**: Production only

---

## Cron Schedule Reference

| Schedule | Description |
|----------|-------------|
| `0 9 * * *` | Daily at 9 AM UTC |
| `0 9 * * 1` | Every Monday at 9 AM UTC |
| `0 */6 * * *` | Every 6 hours |
| `*/15 * * * *` | Every 15 minutes |

---

## What Each Cron Does

### 1. Invoice Reminders (`/api/cron/send-invoice-reminders`)
- Runs: **Daily at 9 AM**
- Sends email reminders for:
  - Overdue invoices
  - Invoices due in 3 days
  - Upcoming scheduled maintenance

### 2. Weekly Reports (`/api/cron/send-weekly-reports`)
- Runs: **Every Monday at 9 AM**
- Sends weekly summary emails to Business plan users:
  - Total revenue
  - Outstanding invoices
  - Asset utilization
  - Key metrics

---

## Testing Cron Jobs

### Local Testing
```powershell
# Test invoice reminders
Invoke-RestMethod -Uri "http://localhost:3000/api/cron/send-invoice-reminders" `
  -Headers @{ "Authorization" = "Bearer YOUR_CRON_SECRET" }

# Test weekly reports
Invoke-RestMethod -Uri "http://localhost:3000/api/cron/send-weekly-reports" `
  -Headers @{ "Authorization" = "Bearer YOUR_CRON_SECRET" }
```

### Production Testing
```powershell
# Replace with your production URL and CRON_SECRET
Invoke-RestMethod -Uri "https://www.asset-tracer.com/api/cron/send-invoice-reminders" `
  -Headers @{ "Authorization" = "Bearer YOUR_PRODUCTION_CRON_SECRET" }
```

---

## Security

The cron endpoints are protected by:
1. ✅ `Authorization: Bearer CRON_SECRET` header check
2. ✅ Vercel's internal cron trigger authentication
3. ✅ Rate limiting (max 1 execution per scheduled interval)

---

## Alternative: Upgrade Vercel Plan

If you need cron jobs in both staging and production:

1. **Hobby Plan** (Free)
   - 2 Cron Jobs total

2. **Pro Plan** ($20/month)
   - 10 Cron Jobs
   - Better performance
   - Custom domains

3. **Enterprise**
   - Unlimited Cron Jobs
   - Contact sales

---

## Current Status

- ✅ **Production**: Configure cron jobs via dashboard
- ✅ **Staging**: No cron jobs (testing doesn't require them)
- ✅ **Cron endpoints**: Still functional, just not auto-triggered
- ✅ **Manual testing**: Use Authorization header

---

## Why Staging Doesn't Need Crons

Staging is for:
- ✅ Testing UI/UX
- ✅ Testing database operations
- ✅ Testing subscription flows
- ✅ Testing quotation conversion

**NOT for:**
- ❌ Sending real emails on schedule
- ❌ Background job execution
- ❌ Production-like automation

Manual API testing is sufficient for staging.

---

**Production cron jobs should be configured via Vercel Dashboard after deployment.**

