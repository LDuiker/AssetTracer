# 🚀 Production Environment Setup Guide

Complete guide for setting up your `.env.production` file.

---

## 📋 Prerequisites

Before filling out `.env.production`, you need:

1. ✅ **Supabase** production project created
2. ✅ **Polar.sh** account with LIVE products created
3. ✅ **Resend** account with domain verified
4. ✅ **Vercel** account (for deployment)

---

## 🔐 Step-by-Step Setup

### **1. Supabase Configuration**

#### Get Your Supabase Credentials:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your **PRODUCTION** project
3. Go to **Settings** → **API**
4. Copy the following:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...  # Public anon key
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...     # Service role key (keep secret!)
```

⚠️ **Important:**
- Use the **production** project, not staging/local
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code

---

### **2. Polar.sh LIVE Configuration**

#### Switch from Sandbox to LIVE:

1. Go to [Polar Settings](https://polar.sh/settings)
2. Click **"Go Live"** if not already live
3. Create your products:
   - **Pro Plan**: $29/month
   - **Business Plan**: $99/month
4. Get your credentials:

```env
POLAR_API_KEY=polar_sk_live_...  # NOT polar_sk_sandbox_!
NEXT_PUBLIC_POLAR_SANDBOX=false  # CRITICAL!
NEXT_PUBLIC_POLAR_ORGANIZATION_ID=your-org-id
```

#### Get Price IDs:

1. Go to **Products** in Polar dashboard
2. Click on **Pro Plan**
3. Copy the **Price ID** (starts with `price_`)
4. Repeat for **Business Plan**

```env
NEXT_PUBLIC_POLAR_PRO_PRICE_ID=price_xxxxxxxxxxxx
NEXT_PUBLIC_POLAR_BUSINESS_PRICE_ID=price_xxxxxxxxxxxx
```

⚠️ **Critical:**
- **DO NOT** use sandbox keys in production!
- Test with sandbox first, then switch to live
- Sandbox keys start with `polar_sk_sandbox_`
- Live keys start with `polar_sk_live_`

---

### **3. Resend Email Configuration**

#### Verify Your Domain:

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click **"Add Domain"**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records (SPF, DKIM, DMARC) to your domain provider
5. Wait for verification ✅

#### Get API Key:

1. Go to [API Keys](https://resend.com/api-keys)
2. Create a new API key
3. Copy it immediately (shown only once!)

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com  # Must be verified domain!
```

⚠️ **Important:**
- Cannot use `@gmail.com` or `@resend.dev` in production
- Domain must be fully verified (green checkmark)
- Use subdomain like `noreply@` or `notifications@`

---

### **4. Webhook Secrets**

#### Polar Webhook:

1. Go to Polar dashboard → **Webhooks**
2. Click **"Create Webhook"**
3. URL: `https://your-domain.com/api/webhooks/polar`
4. Select events:
   - ✅ `subscription.created`
   - ✅ `subscription.updated`
   - ✅ `subscription.canceled`
5. Copy the **Webhook Secret**

```env
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxx
```

#### DPO Webhook (if applicable):

```env
DPO_WEBHOOK_SECRET=your-dpo-secret-here
```

---

### **5. Generate CRON_SECRET**

Run the helper script:

```powershell
.\generate-cron-secret.ps1
```

This will generate a secure random secret and copy it to your clipboard.

```env
CRON_SECRET=Ab3Cd5Ef7Gh9Ij1Kl3Mn5Op7Qr9St1Uv3Wx5Yz==
```

⚠️ **Important:**
- Use the same secret in Vercel environment variables
- This protects your cron endpoints from unauthorized access

---

### **6. Environment Identifier**

```env
NEXT_PUBLIC_ENV=production
```

This helps identify which environment is running.

---

## 🚀 Deployment Checklist

Before deploying to Vercel:

- [ ] ✅ All placeholders in `.env.production` replaced
- [ ] ✅ Supabase project is **production** (not local/staging)
- [ ] ✅ Polar keys are **LIVE** (`polar_sk_live_...`)
- [ ] ✅ `NEXT_PUBLIC_POLAR_SANDBOX=false`
- [ ] ✅ Email domain verified in Resend
- [ ] ✅ DNS records added (SPF, DKIM, DMARC)
- [ ] ✅ Strong `CRON_SECRET` generated
- [ ] ✅ Polar webhook created and pointing to production URL
- [ ] ✅ All database migrations run in production Supabase
- [ ] ✅ RLS policies enabled on all tables

---

## 📤 Adding to Vercel

### Option 1: Manual Entry

1. Go to Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://xxxxx.supabase.co`
   - Environment: **Production** ✅
5. Repeat for all variables

### Option 2: Bulk Import (Recommended)

1. Copy all contents of `.env.production`
2. In Vercel, click **"Add Environment Variables"**
3. Click **"Paste .env"**
4. Select **Production** environment
5. Click **"Add"**

⚠️ **Note:** 
- Variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Other variables are server-side only
- Never put secrets in `NEXT_PUBLIC_` variables

---

## 🧪 Testing Production Setup

After deployment:

### 1. Test Authentication
```bash
# Visit your production URL
https://your-domain.com/login

# Sign up with a test email
# Verify you can log in
```

### 2. Test Subscriptions
```bash
# Go to pricing page
https://your-domain.com/#pricing

# Click "Get Started" on Pro plan
# Use Polar test card: 4242 4242 4242 4242
# Verify subscription created
```

### 3. Test Emails
```bash
# Trigger an email notification
# Check spam folder if not received
# Verify sender is your verified domain
```

### 4. Check Logs
```bash
# Vercel dashboard → Your Project → Logs
# Look for errors
# Verify cron jobs are running
```

---

## 🆘 Troubleshooting

### Emails Not Sending
- ✅ Check domain verification in Resend
- ✅ Verify DNS records propagated (use mxtoolbox.com)
- ✅ Check spam folder
- ✅ Verify `EMAIL_FROM` matches verified domain

### Subscriptions Not Working
- ✅ Confirm using LIVE keys (not sandbox)
- ✅ Check `NEXT_PUBLIC_POLAR_SANDBOX=false`
- ✅ Verify Price IDs are from LIVE products
- ✅ Check webhook is receiving events

### Database Errors
- ✅ Verify all migrations run in production Supabase
- ✅ Check RLS policies are enabled
- ✅ Confirm `SUPABASE_SERVICE_ROLE_KEY` is correct

### Cron Jobs Not Running
- ✅ Verify `CRON_SECRET` in Vercel matches `.env.production`
- ✅ Check Vercel Cron configuration in `vercel.json`
- ✅ Review cron logs in Vercel dashboard

---

## 🔒 Security Best Practices

1. **Never commit `.env.production` to git**
   - Already protected by `.gitignore` ✅

2. **Rotate secrets regularly**
   - Every 90 days recommended
   - After team member leaves

3. **Use environment-specific keys**
   - Different keys for staging/production
   - Never share production keys

4. **Monitor API usage**
   - Check Supabase usage dashboard
   - Monitor Polar transaction logs
   - Review Resend email sending

5. **Enable 2FA**
   - Supabase account
   - Vercel account
   - Polar account
   - Resend account

---

## 📚 Additional Resources

- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Polar.sh Documentation](https://docs.polar.sh)
- [Resend Documentation](https://resend.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## ✅ Quick Reference

```env
# Supabase (from dashboard → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Polar (LIVE keys only!)
POLAR_API_KEY=polar_sk_live_...
NEXT_PUBLIC_POLAR_SANDBOX=false
NEXT_PUBLIC_POLAR_ORGANIZATION_ID=org_...
NEXT_PUBLIC_POLAR_PRO_PRICE_ID=price_...
NEXT_PUBLIC_POLAR_BUSINESS_PRICE_ID=price_...

# Resend (verified domain)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# Webhooks
POLAR_WEBHOOK_SECRET=whsec_...
DPO_WEBHOOK_SECRET=your-secret

# Security
CRON_SECRET=generated-by-script

# Environment
NEXT_PUBLIC_ENV=production
```

---

**Ready to deploy? 🚀**

Once all values are filled in, commit your code (excluding `.env.production`) and deploy to Vercel!

