# 🚀 Clone Production to Staging - Quick Start

You've deleted your staging database and need to clone production. Here's the fastest path forward.

---

## ⚡ Super Quick Method (10 minutes)

### Step 1: Run Setup SQL Script

1. Go to your **STAGING** Supabase project:
   ```
   https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/sql
   ```

2. Open the file: **`SETUP-STAGING-FROM-PRODUCTION.sql`**

3. Copy ALL contents and paste into Supabase SQL Editor

4. Click **RUN**

5. Wait for green checkmark ✅

**This creates:**
- ✅ All 14 tables with correct schema
- ✅ OAuth trigger for automatic user creation
- ✅ All RLS policies for security
- ✅ Storage bucket for company logos

---

### Step 2: Verify Setup

1. In Supabase SQL Editor, open: **`VERIFY-STAGING-SCHEMA.sql`**

2. Copy, paste, and run

3. Check results - should show:
   - ✅ 14 tables created
   - ✅ OAuth trigger installed
   - ✅ RLS policies active

---

### Step 3: Configure Supabase Auth

1. Go to: **Authentication** → **URL Configuration**

2. Set **Site URL**:
   ```
   https://assettracer-staging.vercel.app
   ```

3. Add **Redirect URLs**:
   ```
   https://assettracer-staging.vercel.app/**
   https://assettracer-staging.vercel.app/auth/callback
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```

4. **Save**

---

### Step 4: Update Vercel

1. Go to Vercel → Your staging project → **Settings** → **Environment Variables**

2. Update:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://ougntjrrskfsuognjmcw.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [Get from Supabase Settings > API]
   SUPABASE_SERVICE_ROLE_KEY = [Get from Supabase Settings > API]
   ```

3. Go to **Deployments** → Latest → **...** → **Redeploy**

4. ⚠️ **UNCHECK** "Use existing Build Cache"

5. Click **Redeploy**

---

### Step 5: Test

1. Open **INCOGNITO** browser

2. Go to: `https://assettracer-staging.vercel.app`

3. Click **Sign in with Google**

4. Expected: ✅ Login → ✅ Dashboard

---

## 🤖 Automated Method (PowerShell)

Run this PowerShell script from project root:

```powershell
.\setup-staging-quick.ps1
```

This script will:
- Guide you through each step
- Open relevant URLs automatically
- Verify each step before proceeding
- Give you a checklist to follow

---

## 📄 Files You Need

| File | Purpose | When to Use |
|------|---------|-------------|
| `SETUP-STAGING-FROM-PRODUCTION.sql` | Creates all tables, triggers, policies | **RUN THIS FIRST** |
| `VERIFY-STAGING-SCHEMA.sql` | Checks everything is correct | Run after setup |
| `CLONE-PRODUCTION-TO-STAGING.md` | Detailed guide | If you need more info |
| `setup-staging-quick.ps1` | Interactive setup wizard | For guided setup |

---

## ⚠️ Important Notes

1. **This does NOT copy production data** - staging starts with clean database
2. **OAuth trigger** will auto-create users when they sign in
3. **RLS policies** ensure users only see their organization's data
4. **Vercel cache** must be cleared or it will deploy old code

---

## 🆘 Troubleshooting

### Issue: "Table already exists" error
**Solution**: Some tables already exist. This is OK, script will skip them.

### Issue: Redirect loop after login
**Solution**: 
1. Check OAuth trigger: Run `VERIFY-STAGING-SCHEMA.sql`
2. If missing, run: `INSTALL-OAUTH-TRIGGER-NOW.sql`

### Issue: "Organization not found" error
**Solution**:
1. Check RLS policies: Run `VERIFY-STAGING-SCHEMA.sql`
2. If missing, run: `FIX-RLS-POLICIES-V2.sql`

### Issue: Vercel shows old code
**Solution**: Redeploy with cache UNCHECKED

---

## ✅ Success Checklist

After setup, you should have:

- [ ] 14 tables in staging database
- [ ] OAuth trigger installed (verified with SQL script)
- [ ] RLS policies active on all tables
- [ ] Supabase auth URLs point to staging
- [ ] Vercel env vars point to staging database
- [ ] Vercel redeployed successfully
- [ ] Can sign in with Google
- [ ] Dashboard loads

---

## 🎯 What's Different: Staging vs Production

| Aspect | Production | Staging |
|--------|-----------|---------|
| **Database** | Production project | ougntjrrskfsuognjmcw |
| **URL** | asset-tracer.com | assettracer-staging.vercel.app |
| **Data** | Real users & data | Clean/test data |
| **Polar** | Live mode | Sandbox mode |
| **Emails** | Real emails | Test emails |
| **Schema** | ✅ Same | ✅ Same (cloned) |

---

## 📚 Next Steps After Setup

1. **Test core features**:
   - Create assets
   - Create clients
   - Create quotations
   - Convert quotation to invoice

2. **Test subscriptions** (if needed):
   - Use Polar sandbox
   - Test upgrade flow
   - Test webhook handling

3. **Test team features** (if needed):
   - Invite team members
   - Test permissions

---

## 🚨 Emergency: Something's Broken?

If things go wrong, you can start fresh:

1. Run: **`NUCLEAR-FIX-STAGING-NOW.sql`**
   - This deletes ALL data
   - Reinstalls triggers
   - Fixes RLS policies

2. Follow this guide again from Step 3

---

## 💡 Pro Tips

1. **Always use incognito** when testing OAuth to avoid cache issues
2. **Check Vercel commit hash** to ensure latest code is deployed
3. **Keep staging clean** - delete test data regularly
4. **Document any differences** between staging and production

---

**Ready?** → Run `SETUP-STAGING-FROM-PRODUCTION.sql` in Supabase SQL Editor!

**Need help?** → Run `.\setup-staging-quick.ps1` for guided setup

**Stuck?** → See `CLONE-PRODUCTION-TO-STAGING.md` for detailed troubleshooting

