# ✅ Staging OAuth Configuration Checklist

## Issue: Redirect Back to Login Page

This happens when OAuth callback URLs are not configured correctly.

---

## 🔧 Fix Steps

### 1. **Vercel Environment Variables**

Go to: **Vercel Dashboard → Settings → Environment Variables**

Verify these are set for **Preview** environment:

| Variable | Correct Value |
|----------|---------------|
| `NEXT_PUBLIC_APP_URL` | `https://assettracer-staging.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ougntjrrskfsuognjmcw.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (your staging anon key) |

**Important**: Use `https://` not `http://`!

---

### 2. **Supabase URL Configuration**

Go to: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/url-configuration

**Site URL**:
```
https://assettracer-staging.vercel.app
```

**Redirect URLs** (add all):
```
https://assettracer-staging.vercel.app/auth/callback
https://assettracer-staging.vercel.app/*
http://localhost:3000/auth/callback
http://localhost:3000/*
```

---

### 3. **Supabase OAuth Providers**

Go to: https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/providers

**Google Provider**:
- [x] Enabled
- Client ID: (your Google OAuth client ID)
- Client Secret: (your Google OAuth client secret)

**⚠️ Important**: Use the **same** Google OAuth credentials as production, or create separate ones for staging.

---

### 4. **Google Cloud Console** (if separate credentials)

If using separate OAuth credentials for staging:

Go to: https://console.cloud.google.com/apis/credentials

1. **Select your OAuth 2.0 Client ID**
2. **Add Authorized redirect URI**:
   ```
   https://ougntjrrskfsuognjmcw.supabase.co/auth/v1/callback
   ```

---

## 🧪 Testing

After configuration:

1. **Clear browser cache** or use **incognito mode**
2. **Go to**: https://assettracer-staging.vercel.app
3. **Click**: "Continue with Google"
4. **Expected**: Redirects to dashboard after login
5. **If fails**: Check browser console (F12) for errors

---

## 🐛 Debugging

### Check Current Configuration

**In browser console** (F12), on staging site:

```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('App URL:', process.env.NEXT_PUBLIC_APP_URL);
```

### Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Redirects to login | Callback URL not in Supabase | Add to Redirect URLs |
| 400 error | Google OAuth URI not authorized | Add to Google Console |
| localhost works, staging doesn't | App URL not set | Update Vercel env vars |
| "Provider not enabled" | Google OAuth not enabled | Enable in Supabase |

---

## 📋 Quick Fix Command

If you need to quickly update local `.env.staging`:

```powershell
# Update the URL to https
$content = Get-Content "asset-tracer\.env.staging" -Raw
$content = $content -replace "NEXT_PUBLIC_APP_URL=http://", "NEXT_PUBLIC_APP_URL=https://"
$content | Out-File -FilePath "asset-tracer\.env.staging" -Encoding UTF8 -Force
Write-Host "Updated APP_URL to use https://" -ForegroundColor Green
```

---

## ✅ Final Checklist

Before testing again:

- [ ] Vercel env vars updated (https:// URL)
- [ ] Supabase Site URL set to staging domain
- [ ] Supabase Redirect URLs include staging domain
- [ ] Google OAuth provider enabled in Supabase
- [ ] Google Cloud Console has callback URI
- [ ] Redeployed staging after env var changes
- [ ] Cleared browser cache / using incognito

---

**After completing all steps, wait for Vercel deployment to finish, then try logging in again!**

