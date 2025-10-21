# AssetTracer Deployment Guide
## Separating Staging and Production Environments

## 🎯 Overview

This guide will help you set up separate **Staging** and **Production** environments for your AssetTracer application.

---

## 📋 Table of Contents

1. [Environment Strategy](#environment-strategy)
2. [Database Setup](#database-setup)
3. [Environment Variables](#environment-variables)
4. [Deployment Options](#deployment-options)
5. [Recommended: Vercel Deployment](#recommended-vercel-deployment)
6. [Alternative: Traditional Hosting](#alternative-traditional-hosting)
7. [Testing Your Environments](#testing-your-environments)

---

## 🏗️ Environment Strategy

### Three Environments Recommended:

1. **Local Development** (Your computer)
   - URL: `http://localhost:3000`
   - Purpose: Active development and testing

2. **Staging** (Preview/Testing)
   - URL: `https://staging.yourdomain.com` or `https://assettracer-staging.vercel.app`
   - Purpose: Final testing before production, client previews

3. **Production** (Live)
   - URL: `https://yourdomain.com` or `https://assettracer.vercel.app`
   - Purpose: Live application for real users

---

## 💾 Database Setup

### Create Separate Supabase Projects

**Best Practice:** Use separate Supabase projects for staging and production.

#### Step 1: Create Staging Database
1. Go to [supabase.com](https://supabase.com)
2. Create a new project: `assettracer-staging`
3. Region: Choose closest to your users
4. Note down:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon Key: `eyJhbGc...`
   - Service Role Key: `eyJhbGc...` (keep secret!)

#### Step 2: Create Production Database
1. Create another project: `assettracer-production`
2. Same region as staging
3. Note down same credentials

#### Step 3: Run Migrations on Both
For each database, run all your SQL migrations:

```sql
-- Run these in Supabase SQL Editor for BOTH databases:
-- 1. Run all your schema migrations
-- 2. Run ADD-POLAR-INTEGRATION.sql
-- 3. Run ADD-EMAIL-NOTIFICATIONS.sql
-- 4. Run ADD-TEAM-MANAGEMENT.sql
-- etc.
```

---

## 🔐 Environment Variables

### Local Development (`.env.local`)

Keep your current `.env.local` for local development:

```env
# Supabase - Local/Development
NEXT_PUBLIC_SUPABASE_URL=your-dev-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key

# Polar.sh - Sandbox
POLAR_API_KEY=your-sandbox-api-key
NEXT_PUBLIC_POLAR_SANDBOX=true

# Resend - Test
RESEND_API_KEY=your-test-resend-key
EMAIL_FROM=onboarding@resend.dev

# DPO Webhook (if using)
DPO_WEBHOOK_SECRET=your-dpo-webhook-secret

# Cron Secret
CRON_SECRET=your-local-cron-secret
```

### Staging Environment Variables

Create `.env.staging` (DO NOT commit to git):

```env
# Supabase - Staging
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co  # Staging project
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key

# Polar.sh - Still Sandbox for staging
POLAR_API_KEY=your-sandbox-api-key
NEXT_PUBLIC_POLAR_SANDBOX=true

# Resend - Production API (but with test email)
RESEND_API_KEY=your-production-resend-key
EMAIL_FROM=staging@yourdomain.com  # Or verified domain

# DPO Webhook
DPO_WEBHOOK_SECRET=your-dpo-webhook-secret

# Cron Secret
CRON_SECRET=generate-new-secret-for-staging

# Environment Identifier
NEXT_PUBLIC_ENV=staging
```

### Production Environment Variables

Create `.env.production` (DO NOT commit to git):

```env
# Supabase - Production
NEXT_PUBLIC_SUPABASE_URL=https://yyyyy.supabase.co  # Production project
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# Polar.sh - LIVE (not sandbox!)
POLAR_API_KEY=your-LIVE-polar-api-key
NEXT_PUBLIC_POLAR_SANDBOX=false  # IMPORTANT!

# Resend - Production
RESEND_API_KEY=your-production-resend-key
EMAIL_FROM=noreply@yourdomain.com  # Must be verified domain

# DPO Webhook
DPO_WEBHOOK_SECRET=your-dpo-webhook-secret-production

# Cron Secret
CRON_SECRET=generate-new-secret-for-production

# Environment Identifier
NEXT_PUBLIC_ENV=production
```

### Generate Secrets

Use this PowerShell command to generate secure secrets:

```powershell
# Generate CRON_SECRET
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended) ⭐

**Why Vercel?**
- Built specifically for Next.js
- Automatic deployments from Git
- Built-in staging (preview) environments
- Zero configuration needed
- Free tier available
- Excellent performance (Edge network)

### Option 2: Traditional Hosting

- DigitalOcean App Platform
- AWS (EC2, Amplify)
- Google Cloud Platform
- Heroku
- Railway
- Render

---

## 🎯 Recommended: Vercel Deployment

### Step-by-Step Setup

#### 1. Prepare Your Repository

**Update `.gitignore`** to ensure secrets aren't committed:

```gitignore
# Environment variables
.env
.env.local
.env.staging
.env.production
.env.development
.env*.local

# Next.js
.next/
out/

# Dependencies
node_modules/

# Other
.DS_Store
*.log
```

**Commit and push your code:**

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

#### 2. Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (easiest)
3. Import your repository

#### 3. Create Staging Project

1. **Import Project:**
   - Click "Add New Project"
   - Select your `AssetTracer` repository
   - Name it: `assettracer-staging`

2. **Configure Build Settings:**
   - Framework Preset: `Next.js`
   - Root Directory: `./asset-tracer` (if not at root)
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Add Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add ALL variables from your `.env.staging`
   - Set for: `Production` (in Vercel, this means deployed branch)

4. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your staging URL: `https://assettracer-staging.vercel.app`

#### 4. Create Production Project

1. **Import Again:**
   - Create a new project
   - Same repository
   - Name it: `assettracer` (or `assettracer-production`)

2. **Configure Build Settings:**
   - Same as staging

3. **Add Environment Variables:**
   - Add ALL variables from your `.env.production`
   - **IMPORTANT:** Use your PRODUCTION Supabase credentials
   - **IMPORTANT:** Set `NEXT_PUBLIC_POLAR_SANDBOX=false`

4. **Set Custom Domain (Optional):**
   - Go to Project Settings → Domains
   - Add your custom domain: `yourdomain.com`
   - Follow DNS setup instructions

5. **Deploy:**
   - Click "Deploy"
   - Your production URL: `https://assettracer.vercel.app`

#### 5. Configure Deployment Branches

**Staging:**
- Settings → Git → Production Branch
- Set to: `staging` or `develop` branch

**Production:**
- Settings → Git → Production Branch
- Set to: `main` branch

**Workflow:**
```
develop/staging branch → Auto-deploys to Staging
↓ (after testing)
main branch → Auto-deploys to Production
```

---

## 🔄 Deployment Workflow

### Recommended Git Workflow

```bash
# 1. Work on feature branch
git checkout -b feature/new-feature
# ... make changes ...
git commit -m "Add new feature"

# 2. Merge to staging branch
git checkout staging
git merge feature/new-feature
git push origin staging
# → Automatically deploys to Staging on Vercel

# 3. Test on staging
# Visit: https://assettracer-staging.vercel.app
# Test all features

# 4. If everything works, merge to main
git checkout main
git merge staging
git push origin main
# → Automatically deploys to Production on Vercel

# 5. Create a release tag (optional but recommended)
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

---

## 🔗 Update Polar Webhooks

### Staging Webhooks

1. Go to [Polar Dashboard](https://sandbox.polar.sh)
2. Settings → Webhooks
3. Add webhook for staging:
   ```
   https://assettracer-staging.vercel.app/api/webhooks/polar
   ```

### Production Webhooks

1. Go to [Polar Dashboard](https://polar.sh) (LIVE, not sandbox)
2. Settings → Webhooks
3. Add webhook for production:
   ```
   https://yourdomain.com/api/webhooks/polar
   ```

---

## 📧 Configure Resend

### Verify Your Domain

For production emails, verify your domain in Resend:

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add domain: `yourdomain.com`
3. Add DNS records (MX, TXT, CNAME)
4. Wait for verification
5. Use email: `noreply@yourdomain.com`

**Staging:** Can use `onboarding@resend.dev` for testing

**Production:** MUST use verified domain

---

## 🎨 Configure Supabase Auth

### Update Authorized URLs

**For Staging Supabase Project:**
1. Settings → Authentication → URL Configuration
2. Site URL: `https://assettracer-staging.vercel.app`
3. Redirect URLs:
   ```
   https://assettracer-staging.vercel.app/**
   https://assettracer-staging.vercel.app/auth/callback
   ```

**For Production Supabase Project:**
1. Settings → Authentication → URL Configuration
2. Site URL: `https://yourdomain.com`
3. Redirect URLs:
   ```
   https://yourdomain.com/**
   https://yourdomain.com/auth/callback
   https://assettracer.vercel.app/**  (if using Vercel domain)
   ```

---

## 🧪 Testing Your Environments

### Checklist for Each Environment

**Staging:**
- ✅ Application loads
- ✅ Can sign in with Google OAuth
- ✅ Can create assets
- ✅ Can upgrade to Pro (sandbox payment)
- ✅ Webhooks working (check Supabase logs)
- ✅ Email notifications sending (test with your email)
- ✅ Team invitations working
- ✅ All features functional

**Production:**
- ✅ All staging tests pass
- ✅ Real payment processing works (use test mode first!)
- ✅ Emails sent from verified domain
- ✅ Performance is acceptable
- ✅ Analytics/monitoring set up
- ✅ Backup strategy in place

---

## 🔒 Security Checklist

Before going live:

- ✅ All environment variables secured (not in git)
- ✅ Service role keys never exposed to client
- ✅ Supabase RLS policies enabled and tested
- ✅ API routes have authentication checks
- ✅ HTTPS enforced (Vercel does this automatically)
- ✅ CORS configured correctly
- ✅ Rate limiting considered for APIs
- ✅ No test/debug code in production build

---

## 📊 Monitoring (Optional but Recommended)

### Vercel Analytics
- Enable in Project Settings → Analytics
- Free basic analytics included

### Supabase Monitoring
- Database → Reports
- Monitor query performance, storage, bandwidth

### Error Tracking
Consider adding:
- [Sentry](https://sentry.io) for error tracking
- [LogRocket](https://logrocket.com) for session replay

---

## 🚨 Rollback Strategy

If something goes wrong in production:

### Option 1: Redeploy Previous Version
1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

### Option 2: Revert Git Commit
```bash
git revert HEAD
git push origin main
```

### Option 3: Emergency Rollback
- Keep staging working with last stable code
- Can quickly redeploy from staging if needed

---

## 📝 Environment Comparison Table

| Feature | Local | Staging | Production |
|---------|-------|---------|------------|
| URL | localhost:3000 | staging.domain.com | yourdomain.com |
| Supabase | Dev project | Staging project | Production project |
| Polar | Sandbox | Sandbox | Live |
| Emails | Test/disabled | Test emails | Real emails |
| Data | Test data | Test data | Real user data |
| Updates | Immediate | Auto on push | Auto on push |
| Access | Developer only | Team/Testers | Public |

---

## 🎉 Launch Checklist

Before launching to production:

1. **Technical:**
   - ✅ All tests pass in staging
   - ✅ Performance optimized
   - ✅ SEO metadata added
   - ✅ Favicon/logo set up
   - ✅ Error pages customized (404, 500)

2. **Business:**
   - ✅ Terms of Service added
   - ✅ Privacy Policy added
   - ✅ Pricing finalized
   - ✅ Support email set up
   - ✅ Backup strategy documented

3. **Security:**
   - ✅ All secrets secured
   - ✅ HTTPS working
   - ✅ Database backups enabled
   - ✅ RLS policies tested

4. **Monitoring:**
   - ✅ Analytics set up
   - ✅ Error tracking enabled
   - ✅ Uptime monitoring (optional)

---

## 💡 Quick Start Commands

### Local Development
```powershell
cd asset-tracer
npx next dev -p 3000
```

### Build for Production (test locally)
```powershell
cd asset-tracer
npm run build
npm start
```

### Deploy to Vercel (via Git)
```bash
# Just push to your branch:
git push origin staging   # → Deploys to staging
git push origin main      # → Deploys to production
```

---

## 🆘 Troubleshooting

### "Build failed on Vercel"
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Test build locally: `npm run build`

### "Can't connect to database"
- Verify Supabase URLs and keys
- Check Supabase project is running
- Verify environment variables are correct

### "Webhooks not working"
- Check webhook URL is correct in Polar
- Verify webhook secret matches
- Check Vercel function logs

### "OAuth redirect error"
- Verify redirect URLs in Supabase
- Ensure Site URL is set correctly
- Check that URLs match exactly (https://)

---

## 📚 Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Polar.sh API Docs](https://docs.polar.sh)

---

## 🎯 Next Steps

1. Create staging and production Supabase projects
2. Set up Vercel account
3. Deploy to staging first
4. Test thoroughly
5. Deploy to production
6. Monitor and iterate!

---

**Good luck with your launch! 🚀**

