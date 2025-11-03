# Update Vercel Environment Variables for Resend

## ✅ Email Sending is Working!

**Confirmed working configuration:**
- API Key: `re_ZQtLpG7m_2GFoQfbwNGDEF5dKHav5WRTo`
- From Email: `noreply@asset-tracer.com` (ROOT domain, NOT subdomain)

---

## 🔧 Update Vercel Environment Variables

### Step 1: Go to Vercel Dashboard
**URL:** https://vercel.com/ (your AssetTracer project)

### Step 2: Navigate to Environment Variables
1. Select your **AssetTracer** project
2. Click: **Settings** tab
3. Click: **Environment Variables** (left sidebar)

### Step 3: Add/Update These Variables

#### Variable 1: RESEND_API_KEY
```
Name: RESEND_API_KEY
Value: re_ZQtLpG7m_2GFoQfbwNGDEF5dKHav5WRTo
Environment: Production, Preview, Development (check all)
```

#### Variable 2: EMAIL_FROM (if you have this)
```
Name: EMAIL_FROM
Value: noreply@asset-tracer.com
Environment: Production, Preview, Development (check all)
```

#### Variable 3: EMAIL_FROM_NAME (optional)
```
Name: EMAIL_FROM_NAME
Value: AssetTracer
Environment: Production, Preview, Development (check all)
```

### Step 4: Save Changes
- Click **Save** for each variable
- Vercel will ask if you want to redeploy - click **Yes** or **Redeploy**

---

## 📝 CRITICAL: Use Root Domain, Not Subdomain!

**In your code, when sending emails, use:**

### ✅ CORRECT:
```typescript
from: 'AssetTracer <noreply@asset-tracer.com>'
// or
from: 'noreply@asset-tracer.com'
```

### ❌ WRONG:
```typescript
from: 'noreply@send.asset-tracer.com'  // This will fail with 403!
```

---

## 🔍 Check Your Code

Look for any places in your codebase where you're setting the "from" email address:

### Files to Check:
```bash
# Search for send.asset-tracer.com
grep -r "send.asset-tracer.com" asset-tracer/

# Search for email sending code
grep -r "from:" asset-tracer/ --include="*.ts" --include="*.tsx"
```

### Update if Found:
Change any instances of:
- `send.asset-tracer.com` → `asset-tracer.com`

---

## 🧪 Test After Deployment

Once Vercel is redeployed with new env vars:

### Test 1: Send Test Email from Your App
1. Go to your production app
2. Trigger an email (e.g., create an invoice, send a quote)
3. Check if the email arrives

### Test 2: Check Resend Dashboard
1. Go to: https://resend.com/emails
2. See your sent emails
3. Check delivery status

---

## 📧 Email Addresses You Can Use

From your verified domain `asset-tracer.com`, you can use:
- `noreply@asset-tracer.com` ✅
- `support@asset-tracer.com` ✅
- `invoices@asset-tracer.com` ✅
- `quotes@asset-tracer.com` ✅
- `team@asset-tracer.com` ✅
- Any email @ `asset-tracer.com` ✅

**Just DON'T use `@send.asset-tracer.com`!**

---

## 🎯 Summary

1. ✅ Domain verified: `asset-tracer.com`
2. ✅ API Key working: `re_ZQtLpG7m...`
3. ✅ Test email sent successfully
4. ⏳ Update Vercel environment variables
5. ⏳ Redeploy to production
6. ⏳ Test end-to-end in your app

---

## 📂 Local .env Files

For local development, update your `.env.local` or `.env`:

```bash
RESEND_API_KEY=re_ZQtLpG7m_2GFoQfbwNGDEF5dKHav5WRTo
EMAIL_FROM=noreply@asset-tracer.com
EMAIL_FROM_NAME=AssetTracer
```

---

## 🔒 Security Note

**IMPORTANT:** Never commit `.env` files with real API keys to git!

Your `.gitignore` should include:
```
.env
.env.local
.env.production
.env.*.local
```

