# Google OAuth Setup Guide

## ✅ What We Just Fixed

Created the auth callback route to handle Google OAuth redirects properly.

## 🔧 Final Step: Update Supabase Settings

### 1. Open Supabase Dashboard
Go to: https://supabase.com/dashboard

### 2. Select Your Project
Click on your **AssetTracer** project

### 3. Update Site URL and Redirect URLs

**Navigate to**: Authentication → URL Configuration

#### **Site URL** (set to your local dev URL):
```
http://localhost:3000
```

#### **Redirect URLs** (add these):
```
http://localhost:3000/auth/callback
http://localhost:3000/dashboard
```

**How to add**:
1. Scroll to **Redirect URLs** section
2. Click **"Add URL"**
3. Enter: `http://localhost:3000/auth/callback`
4. Click **"Add URL"** again
5. Enter: `http://localhost:3000/dashboard`
6. Click **Save**

---

## 🧪 Test the OAuth Flow

### Step 1: Clear Cookies
1. Open your browser DevTools (F12)
2. Go to **Application** → **Cookies**
3. Delete all cookies for `localhost:3000`

### Step 2: Try Sign In
1. Go to: http://localhost:3000/login
2. Click **"Sign in with Google"**
3. Choose your Google account
4. You should be redirected to: `http://localhost:3000/dashboard` ✅

---

## 📝 OAuth Flow Explanation

Here's what happens now:

```
1. User clicks "Sign in with Google"
   ↓
2. Redirected to Google sign-in
   ↓
3. User approves
   ↓
4. Google redirects to: /auth/callback?code=xxx
   ↓
5. Callback route exchanges code for session
   ↓
6. User redirected to: /dashboard ✅
```

---

## ❌ Troubleshooting

### "Invalid redirect URL"
**Solution**: Add `http://localhost:3000/auth/callback` to Supabase Redirect URLs

### Still redirecting to landing page
**Solution**: 
1. Clear browser cookies
2. Check Supabase logs (Dashboard → Authentication → Logs)
3. Check browser console for errors

### "Failed to fetch session"
**Solution**: Restart your dev server:
```bash
# Stop the server (Ctrl+C)
npm run dev
```

---

## 🎉 Success!

Once configured, you should:
1. ✅ Sign in with Google
2. ✅ Be redirected to dashboard
3. ✅ Stay logged in (session persists)

---

## 🚀 Next Steps

After successful login:
1. Create an organization in Supabase (if you haven't)
2. Link your user to an organization
3. Test the financial APIs
4. Build dashboard UI

---

## 📚 For Production

When deploying to production, remember to:
1. Update **Site URL** to your production domain
2. Add production **Redirect URLs**:
   - `https://yourdomain.com/auth/callback`
   - `https://yourdomain.com/dashboard`
3. Update Google OAuth credentials with production URLs

