# Supabase Authentication Setup (Production)

## 🔐 Issue

Getting error when trying to log in:
```json
{
  "code": 400,
  "error_code": "validation_failed",
  "msg": "Unsupported provider: provider is not enabled"
}
```

This means **authentication providers are not enabled** in your production Supabase project.

---

## ✅ Solution: Enable Authentication Providers

### Step 1: Go to Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your **production project** (the one with your production database)

### Step 2: Enable Email Authentication

1. Click **Authentication** in the left sidebar
2. Click **Providers**
3. Find **Email** in the list
4. Click **Enable** (or the toggle switch)
5. Configure the following settings:

   ```
   ✅ Enable Email provider
   ✅ Confirm email: OFF (for testing, turn ON for production later)
   ✅ Secure email change: ON (recommended)
   ✅ Secure password change: ON (recommended)
   ```

6. Click **Save**

### Step 3: Configure Site URL and Redirect URLs

Still in **Authentication** settings:

1. Click **URL Configuration** (or **Settings** → **Authentication**)
2. Set the following:

   **Site URL**:
   ```
   https://your-vercel-app.vercel.app
   ```
   (Replace with your actual Vercel deployment URL)

   **Redirect URLs** (Add these):
   ```
   https://your-vercel-app.vercel.app/auth/callback
   https://your-vercel-app.vercel.app/dashboard
   http://localhost:3000/auth/callback
   http://localhost:3000/dashboard
   ```
   (The localhost URLs are for local development)

3. Click **Save**

### Step 4: Configure Email Templates (Optional but Recommended)

1. In **Authentication** → **Email Templates**
2. Customize the templates for:
   - Confirm signup
   - Magic Link
   - Change Email Address
   - Reset Password

3. Make sure the **Redirect URL** in templates points to:
   ```
   {{ .SiteURL }}/auth/callback
   ```

---

## 🔍 Verify Your Environment Variables

Make sure your production `.env.production` has the correct Supabase credentials:

```bash
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key...
```

### How to Find These:

1. Supabase Dashboard → **Project Settings** (gear icon)
2. Click **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

---

## 🚀 Set Environment Variables in Vercel

Your Vercel deployment needs these environment variables!

### Step 1: Go to Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select your **AssetTracer** project
3. Click **Settings** → **Environment Variables**

### Step 2: Add ALL Production Variables

Add each variable from your `.env.production` file:

| Variable Name | Value | Environments |
|---------------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Production |
| `NEXT_PUBLIC_POLAR_API_KEY` | `polar_oat_...` | Production |
| `POLAR_PRO_PRICE_ID` | `price_...` | Production |
| `POLAR_BUSINESS_PRICE_ID` | `price_...` | Production |
| `RESEND_API_KEY` | `re_...` | Production |
| `RESEND_FROM_EMAIL` | `noreply@yourdomain.com` | Production |
| `CRON_SECRET` | `your-cron-secret` | Production |

**Important**:
- Make sure to select **Production** environment for each variable
- You can also add them to **Preview** and **Development** if needed
- Click **Save** after adding each variable

### Step 3: Redeploy

After adding environment variables:

1. Go to **Deployments** tab
2. Click **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. **Uncheck** "Use existing Build Cache"
5. Click **Redeploy**

---

## ✅ Testing

After completing the above steps:

1. **Wait for Vercel redeploy** to complete (~1-2 minutes)
2. **Go to your app**: `https://your-app.vercel.app`
3. **Try to log in** with your credentials
4. **Expected result**: 
   - ✅ Login works
   - ✅ Redirected to dashboard
   - ✅ App loads correctly

---

## 🐛 Troubleshooting

### Still getting "Unsupported provider" error?

**Check**:
1. ✅ Email provider is **enabled** in Supabase Dashboard → Authentication → Providers
2. ✅ Environment variables are set in **Vercel Dashboard**
3. ✅ Vercel deployment has **completed** after setting env vars
4. ✅ You're using the **correct Supabase project** (production, not a test project)

### Getting "Invalid login credentials"?

**This is different - it means auth is working!**

**Solutions**:
1. Create a new account through the sign-up flow
2. OR use the credentials you created in your production database
3. OR check if you need to verify your email (if "Confirm email" is ON)

### Getting CORS errors?

**Check**:
1. Site URL is set correctly in Supabase
2. Redirect URLs include your Vercel domain
3. Both `http://` and `https://` versions are added if needed

### Environment variables not working?

**Remember**:
- Changing env vars in Vercel requires a **redeploy**
- Clear your browser cache
- Check browser console for specific errors

---

## 📋 Quick Checklist

- [ ] Supabase: Email provider enabled
- [ ] Supabase: Site URL configured
- [ ] Supabase: Redirect URLs configured
- [ ] Vercel: All environment variables added
- [ ] Vercel: Deployment completed
- [ ] Test: Can access app
- [ ] Test: Can create account
- [ ] Test: Can log in
- [ ] Test: Redirected to dashboard

---

## 🎯 Next Steps After Login Works

Once authentication is working:

1. **Enable email confirmation** (for production security)
   - Supabase → Authentication → Providers → Email
   - Turn ON "Confirm email"
   - Users will need to verify their email before logging in

2. **Set up email templates**
   - Customize the look and feel
   - Add your branding
   - Test all email flows

3. **Configure password requirements**
   - Supabase → Authentication → Settings
   - Set minimum password length
   - Require special characters, etc.

4. **Enable additional providers** (optional)
   - Google OAuth
   - GitHub OAuth
   - Magic Link (passwordless)

5. **Set up Row Level Security (RLS) policies**
   - Already done if you ran `complete-schema.sql`
   - But verify they're working correctly

---

**Last Updated**: October 22, 2025  
**Status**: ⏳ Pending Authentication Setup

