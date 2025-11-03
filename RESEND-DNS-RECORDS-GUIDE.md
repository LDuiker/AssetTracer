# 🌐 Resend DNS Records Setup Guide

## 📋 DNS Records You Need to Add

After adding your domain to Resend, you'll get these 3 records:

### **1. SPF Record (TXT)**
```
Type: TXT
Name: @ (or your domain)
Value: v=spf1 include:resend.com ~all
TTL: 3600
```

**Purpose:** Authorizes Resend to send emails on your behalf

---

### **2. DKIM Record (TXT)**
```
Type: TXT
Name: resend._domainkey
Value: (Long string provided by Resend - starts with "p=")
TTL: 3600
```

**Purpose:** Adds a digital signature to verify emails are from you

---

### **3. MX Record**
```
Type: MX
Name: @ (or your domain)
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10
TTL: 3600
```

**Purpose:** Handles bounce and feedback emails

---

## 🔧 Where to Add These Records

The process depends on where your domain is registered/hosted:

### **Option 1: Namecheap**

1. Log into Namecheap
2. Go to **Domain List** → Click **Manage** next to your domain
3. Go to **Advanced DNS** tab
4. Click **Add New Record** for each record above

### **Option 2: GoDaddy**

1. Log into GoDaddy
2. Go to **My Products** → **Domains**
3. Click **DNS** next to your domain
4. Click **Add** for each record

### **Option 3: Cloudflare**

1. Log into Cloudflare
2. Select your domain
3. Go to **DNS** → **Records**
4. Click **Add record** for each record

### **Option 4: Google Domains**

1. Log into Google Domains
2. Select your domain
3. Go to **DNS** settings
4. Scroll to **Custom resource records**
5. Add each record

### **Option 5: Vercel Domains**

1. Log into Vercel
2. Go to your project → **Settings** → **Domains**
3. Click on your domain
4. Go to **DNS Records**
5. Add each record

---

## 📝 Step-by-Step for Common DNS Providers

### **Example: Adding SPF Record (Namecheap)**

1. **Type:** Select `TXT Record`
2. **Host:** Enter `@`
3. **Value:** Enter `v=spf1 include:resend.com ~all`
4. **TTL:** Select `Automatic` or `1 hour`
5. Click **Save**

### **Example: Adding DKIM Record (Namecheap)**

1. **Type:** Select `TXT Record`
2. **Host:** Enter `resend._domainkey`
3. **Value:** Paste the long string from Resend (starts with `p=`)
4. **TTL:** Select `Automatic` or `1 hour`
5. Click **Save**

### **Example: Adding MX Record (Namecheap)**

1. **Type:** Select `MX Record`
2. **Host:** Enter `@`
3. **Value:** Enter `feedback-smtp.us-east-1.amazonses.com`
4. **Priority:** Enter `10`
5. **TTL:** Select `Automatic` or `1 hour`
6. Click **Save**

---

## ⏱️ DNS Propagation Time

After adding records:
- **Minimum:** 5 minutes
- **Typical:** 15-30 minutes
- **Maximum:** 24-48 hours (rare)

**Tip:** You can check propagation status at:
- https://dnschecker.org/
- https://mxtoolbox.com/

---

## ✅ Verify Domain in Resend

After adding DNS records:

1. Go back to: **https://resend.com/domains**
2. Find your domain in the list
3. Click **"Verify"** button
4. Wait for green checkmark ✅

If verification fails:
- Wait 5-10 more minutes
- Check records are exactly as Resend shows
- Make sure there are no typos
- Try the verify button again

---

## 🔍 Troubleshooting DNS Issues

### **Issue 1: "SPF record not found"**

**Solution:**
- Make sure Host is `@` (not blank, not your domain)
- Value must be: `v=spf1 include:resend.com ~all`
- No extra spaces or quotes

### **Issue 2: "DKIM record not found"**

**Solution:**
- Host must be: `resend._domainkey`
- Copy the ENTIRE value from Resend (it's very long)
- Some DNS providers auto-add quotes - that's okay

### **Issue 3: "MX record not found"**

**Solution:**
- Host must be `@`
- Value: `feedback-smtp.us-east-1.amazonses.com`
- Priority: `10`

### **Issue 4: "Multiple SPF records"**

If you already have an SPF record for another email service:

**Bad:** Two separate records
```
v=spf1 include:resend.com ~all
v=spf1 include:google.com ~all
```

**Good:** Combined into one
```
v=spf1 include:resend.com include:google.com ~all
```

---

## 📧 Update Your EMAIL_FROM

Once domain is verified, update your environment variable:

**Before (won't work):**
```bash
EMAIL_FROM="AssetTracer <notifications@gmail.com>"
```

**After (will work):**
```bash
EMAIL_FROM="AssetTracer <notifications@asset-tracer.com>"
```

The email address **must** match your verified domain!

---

## 🧪 Test Your Setup

After domain is verified:

1. **Send a test email:**
   ```bash
   curl https://api.resend.com/emails \
     -H "Authorization: Bearer YOUR_RESEND_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "AssetTracer <notifications@asset-tracer.com>",
       "to": "your-email@example.com",
       "subject": "Test Email",
       "html": "<h1>It works!</h1>"
     }'
   ```

2. **Check Resend logs:**
   - Go to: https://resend.com/emails
   - You should see the test email
   - Status should be "Delivered"

---

## 🎯 Quick Checklist

Before going live:

- [ ] Domain added to Resend
- [ ] SPF record added to DNS
- [ ] DKIM record added to DNS
- [ ] MX record added to DNS (optional but recommended)
- [ ] DNS records verified (wait 15-30 min)
- [ ] Domain shows ✅ green checkmark in Resend
- [ ] `EMAIL_FROM` updated with verified domain
- [ ] Test email sent successfully
- [ ] Test email received in inbox (not spam)

---

## 🚀 Production Environment Variables

Once DNS is set up, make sure these are in Vercel:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
EMAIL_FROM="AssetTracer <notifications@asset-tracer.com>"
CRON_SECRET=your_existing_cron_secret
NEXT_PUBLIC_APP_URL=https://www.asset-tracer.com
```

---

## 📊 Deliverability Tips

For best email deliverability:

1. **Use your own domain** (don't use gmail.com)
2. **Start slow** - send a few emails first
3. **Monitor bounce rate** - keep under 5%
4. **Warm up your domain** - gradually increase volume
5. **Add unsubscribe link** - improves reputation

---

## 🆘 Need Help?

If stuck:

1. **Check Resend Dashboard:** https://resend.com/domains
2. **Resend Support:** https://resend.com/support
3. **DNS Checker:** https://dnschecker.org/
4. **MX Toolbox:** https://mxtoolbox.com/

---

## 📝 What Domain Provider Do You Use?

Tell me your domain provider and I can give you more specific instructions!

Common providers:
- Namecheap
- GoDaddy
- Cloudflare
- Google Domains
- Vercel
- Route 53 (AWS)
- Other: ___________

---

Happy emailing! 📧✨

