# 📋 Staging Setup Credentials Checklist

Use this checklist to gather all credentials before starting the staging setup.

---

## ✅ What You'll Need

### 1. Staging Supabase Project

- [ ] **Project Reference ID**: `ougntjrrskfsuognjmcw`
- [ ] **Project URL**: `https://ougntjrrskfsuognjmcw.supabase.co`
- [ ] **Anon Key**: (Get from: Settings → API)
  ```
  Settings → API → Project API keys → anon public
  ```
- [ ] **Service Role Key**: (Get from: Settings → API)
  ```
  Settings → API → Project API keys → service_role (secret!)
  ```

**Where to find**: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/settings/api

---

### 2. Vercel Staging Project

- [ ] **Project Name**: `assettracer-staging` (or your name)
- [ ] **Project URL**: `https://assettracer-staging.vercel.app`
- [ ] **Team/Username**: (Your Vercel username)

**Where to find**: https://vercel.com/dashboard

---

### 3. Google OAuth (If Setting Up New)

- [ ] **Client ID**: (from Google Cloud Console)
- [ ] **Client Secret**: (from Google Cloud Console)
- [ ] **Authorized Redirect URIs**: Add staging callback URL

**Where to find**: https://console.cloud.google.com/apis/credentials

---

### 4. Polar Sandbox (For Testing Subscriptions)

- [ ] **API Key**: (Sandbox mode)
- [ ] **Product IDs**:
  - Pro Monthly: `4bd7788b-d3dd-4f17-837a-3a5a56341b05`
  - Business Monthly: `bbb245ef-6915-4c75-b59f-f14d61abb414`
- [ ] **Webhook URL**: `https://assettracer-staging.vercel.app/api/webhooks/polar`

**Where to find**: https://sandbox.polar.sh/dashboard

---

## 📝 Vercel Environment Variables

Copy these to Vercel → Settings → Environment Variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ougntjrrskfsuognjmcw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key-here

# Polar (Sandbox)
POLAR_API_KEY=your-sandbox-api-key-here
NEXT_PUBLIC_POLAR_SANDBOX=true

# Resend (optional for email testing)
RESEND_API_KEY=your-resend-api-key-here
EMAIL_FROM=staging@yourdomain.com

# Cron Secret (generate new one)
CRON_SECRET=your-random-32-char-string-here

# Environment
NEXT_PUBLIC_ENV=staging
```

---

## 🔑 Generate Cron Secret

Run this in PowerShell to generate a secure secret:

```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

Or use: https://generate-secret.vercel.app/32

---

## 🔗 Supabase Auth Configuration

Go to: Authentication → URL Configuration

### Site URL
```
https://assettracer-staging.vercel.app
```

### Redirect URLs (Add all of these)
```
https://assettracer-staging.vercel.app/**
https://assettracer-staging.vercel.app/auth/callback
http://localhost:3000/**
http://localhost:3000/auth/callback
```

---

## 🎯 Quick Links

| Service | Link |
|---------|------|
| Staging Supabase | https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw |
| Supabase SQL Editor | https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/sql |
| Supabase Auth Settings | https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/url-configuration |
| Supabase API Keys | https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/settings/api |
| Vercel Dashboard | https://vercel.com/dashboard |
| Vercel Env Vars | https://vercel.com/[your-project]/settings/environment-variables |
| Vercel Deployments | https://vercel.com/[your-project]/deployments |
| Google Cloud Console | https://console.cloud.google.com/apis/credentials |
| Polar Sandbox | https://sandbox.polar.sh/dashboard |

---

## 📋 Setup Order

Follow this order to set up staging:

1. ✅ **Database**: Run `SETUP-STAGING-FROM-PRODUCTION.sql`
2. ✅ **Verify**: Run `VERIFY-STAGING-SCHEMA.sql`
3. ✅ **Supabase Auth**: Configure redirect URLs
4. ✅ **Vercel Env**: Update environment variables
5. ✅ **Vercel Deploy**: Redeploy (cache OFF)
6. ✅ **Test**: Sign in with Google

---

## 🔐 Security Notes

### ⚠️ NEVER commit these to Git:
- Supabase Service Role Key
- Polar API Key
- Resend API Key
- Cron Secret
- Google OAuth Client Secret

### ✅ Safe to commit:
- Supabase URL
- Supabase Anon Key (public)
- Polar Product IDs

### 🛡️ Best Practices:
- Keep staging secrets separate from production
- Use different Polar account (sandbox vs live)
- Use different email domain for staging
- Don't mix staging and production data

---

## ✅ Pre-Flight Checklist

Before you start:

- [ ] Have access to Supabase staging project
- [ ] Have access to Vercel project
- [ ] Have staging Supabase credentials copied
- [ ] Have production database to reference
- [ ] Know your staging URL
- [ ] Have SQL scripts ready (`SETUP-STAGING-FROM-PRODUCTION.sql`)

---

## 🆘 Where to Get Help

If you're missing credentials:

| Missing | Where to Get It |
|---------|----------------|
| Supabase Project | Create new at https://supabase.com/dashboard |
| Supabase Keys | Project Settings → API |
| Vercel Project | Import from GitHub at https://vercel.com/new |
| Google OAuth | Create at https://console.cloud.google.com |
| Polar Account | Sign up at https://sandbox.polar.sh |
| Resend API Key | Sign up at https://resend.com |

---

## 💾 Save This Information

**Tip**: Create a `.env.staging.local` file (DON'T commit) with all these values:

```bash
# .env.staging.local (for local reference only - DO NOT COMMIT!)
NEXT_PUBLIC_SUPABASE_URL=https://ougntjrrskfsuognjmcw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
POLAR_API_KEY=polar_...
CRON_SECRET=...
```

---

**Ready?** → Go to `STAGING-CLONE-QUICKSTART.md` to start the setup!

