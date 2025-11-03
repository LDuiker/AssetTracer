# 🔧 Fix Resend SPF Records Issue

## Problem
After adding DNS records and waiting 24 hours, you're getting:
```
❌ SPF records don't match the expected configuration
```

## Common Causes

### 1. **Multiple SPF Records** (Most Common)
DNS only allows **ONE** SPF (TXT) record per domain. If you have Render hosting + Resend emails, you need to **combine** them.

### 2. **Incorrect SPF Syntax**
Missing parts, extra spaces, or wrong format

### 3. **DNS Provider Not Saving**
Some providers have quirks with TXT records

### 4. **TTL/Propagation Issues**
DNS hasn't fully propagated yet

---

## 🔍 Step 1: Check Current SPF Records

Run this command to see what SPF records exist:

### Option A: Online Tool (Easiest)
1. Go to: https://mxtoolbox.com/SuperTool.aspx
2. Enter your domain: `asset-tracer.com`
3. Click "TXT Lookup"
4. Look for records starting with `v=spf1`

### Option B: Command Line
```powershell
# Windows PowerShell
nslookup -type=txt asset-tracer.com

# Or use dig (if available)
dig asset-tracer.com TXT
```

### What to Look For:
```
✅ GOOD: Single SPF record
v=spf1 include:resend.com ~all

❌ BAD: Multiple SPF records
v=spf1 include:render.com ~all
v=spf1 include:resend.com ~all

❌ BAD: Missing Resend
v=spf1 include:render.com ~all
(No mention of resend.com)

❌ BAD: Wrong syntax
v=spf1 resend.com ~all
(Missing "include:")
```

---

## 🛠️ Step 2: Fix Based on What You Found

### Scenario A: You Have Multiple SPF Records

**Problem:** DNS only allows ONE SPF record. You need to combine them.

**If you have Render + Resend:**
```
WRONG (2 separate records):
v=spf1 include:render.com ~all
v=spf1 include:resend.com ~all

RIGHT (1 combined record):
v=spf1 include:render.com include:resend.com ~all
```

**If you have other services (Gmail, SendGrid, etc.):**
```
Example with multiple services:
v=spf1 include:render.com include:resend.com include:_spf.google.com ~all
```

**Action:**
1. Go to your DNS provider (where you manage your domain)
2. Delete ALL existing SPF records
3. Create ONE new TXT record:
   - **Name:** `@` (or leave blank, depending on provider)
   - **Value:** `v=spf1 include:render.com include:resend.com ~all`
   - **TTL:** Automatic or 3600

### Scenario B: You Have Wrong SPF Syntax

**Check for these issues:**
- Missing `v=spf1` at the start
- Missing `include:` before domain names
- Missing `~all` or `-all` at the end
- Extra quotes or spaces

**Correct format:**
```
v=spf1 include:resend.com ~all
```

**Common mistakes:**
```
❌ v=spf1 resend.com ~all         (missing "include:")
❌ spf1 include:resend.com ~all   (missing "v=")
❌ v=spf1 include:resend.com      (missing "~all")
❌ v=spf1 include: resend.com ~all (space after colon)
```

### Scenario C: SPF Record Doesn't Exist Yet

If you don't see ANY SPF record, create one:

1. **Go to your DNS provider**
2. **Add a new TXT record:**
   - **Type:** TXT
   - **Name:** `@` (or blank, or your domain name)
   - **Value:** `v=spf1 include:resend.com ~all`
   - **TTL:** 3600 or Automatic

### Scenario D: Using Render for Hosting

If you're hosting on Render, they might need their own SPF entry.

**Check Render's documentation:**
- Render doesn't typically require SPF for hosting
- But if you use Render for email, combine it:
  ```
  v=spf1 include:render.com include:resend.com ~all
  ```

**If you're ONLY using Render for hosting (not email):**
- Just use Resend's SPF:
  ```
  v=spf1 include:resend.com ~all
  ```

---

## 📋 Step 3: Verify Your Fix

### Check Resend Dashboard
1. Go to: https://resend.com/domains
2. Find your domain
3. Click **"Verify"** or **"Check DNS"**
4. Wait for green checkmark ✅

### Check DNS Propagation
1. Go to: https://dnschecker.org/
2. Select **TXT** record type
3. Enter your domain
4. Check if the correct SPF record shows globally

### Manual Command Check
```powershell
# Should show your combined SPF record
nslookup -type=txt asset-tracer.com

# Or use online tool
# https://mxtoolbox.com/spf.aspx
```

---

## 🎯 Quick Fix Guide by DNS Provider

### Namecheap
1. Log in → Domain List → Manage
2. Advanced DNS tab
3. Find existing TXT records with `v=spf1`
4. **Delete** all SPF records
5. **Add New Record:**
   - Type: `TXT Record`
   - Host: `@`
   - Value: `v=spf1 include:resend.com ~all`
   - TTL: Automatic
6. Save

### Cloudflare
1. Log in → Select domain
2. DNS → Records
3. Find TXT records with `v=spf1`
4. **Delete** all SPF records
5. **Add Record:**
   - Type: `TXT`
   - Name: `@`
   - Content: `v=spf1 include:resend.com ~all`
   - Proxy status: DNS only (gray cloud)
   - TTL: Auto
6. Save

### GoDaddy
1. Log in → My Products → Domains
2. Click DNS next to your domain
3. Find TXT records with `v=spf1`
4. **Delete** all SPF records
5. **Add:**
   - Type: `TXT`
   - Name: `@`
   - Value: `v=spf1 include:resend.com ~all`
   - TTL: 1 Hour
6. Save

### Vercel Domains
1. Log in → Project → Settings → Domains
2. Click your domain
3. DNS Records tab
4. Find TXT records with `v=spf1`
5. **Delete** all SPF records
6. **Add Record:**
   - Type: `TXT`
   - Name: `@`
   - Value: `v=spf1 include:resend.com ~all`
   - TTL: 3600
7. Save

---

## 🔍 Step 4: Check All Required DNS Records

Resend needs **3 DNS records** (not just SPF):

### 1. SPF Record (TXT)
```
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all
```

### 2. DKIM Record (TXT)
```
Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0... (long string from Resend dashboard)
```

### 3. MX Record (Optional but Recommended)
```
Type: MX
Name: @
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10
```

**Check all three in Resend dashboard:**
https://resend.com/domains

Each should have a ✅ green checkmark.

---

## ⏱️ Step 5: Wait for DNS Propagation

After making changes:
- **Minimum:** 5 minutes
- **Typical:** 15-30 minutes
- **Maximum:** 48 hours (rare)

**Check propagation status:**
```
https://dnschecker.org/
```

---

## 🧪 Step 6: Test Email Sending

Once verified, test sending an email:

### Quick Test Script
```powershell
# Create test-resend.ps1
@'
$apiKey = "re_your_api_key_here"
$from = "notifications@asset-tracer.com"
$to = "your-email@example.com"

$body = @{
    from = $from
    to = $to
    subject = "✅ DNS Test - AssetTracer"
    html = "<h1>Success!</h1><p>Your DNS is configured correctly.</p>"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "https://api.resend.com/emails" `
    -Method POST `
    -Headers $headers `
    -Body $body
'@ | Out-File test-resend.ps1

# Run it
.\test-resend.ps1
```

**Check Resend Logs:**
https://resend.com/emails

Should show "Delivered" status ✅

---

## 🐛 Troubleshooting

### Issue: "SPF record doesn't match"

**Solution 1: Delete and recreate**
1. Delete ALL TXT records containing `v=spf1`
2. Wait 5 minutes
3. Create ONE new SPF record
4. Wait 15 minutes
5. Verify in Resend

**Solution 2: Check for hidden characters**
- Copy SPF value from a plain text editor
- Don't copy from PDF or Word docs
- Use: `v=spf1 include:resend.com ~all`

**Solution 3: Contact DNS provider**
Some providers have bugs with TXT records. Contact support.

### Issue: "Multiple SPF records detected"

**Solution:**
1. List all your email services (Resend, Gmail, SendGrid, etc.)
2. Combine them into ONE record:
   ```
   v=spf1 include:resend.com include:_spf.google.com include:sendgrid.net ~all
   ```
3. Delete all other SPF records
4. Create the combined record

### Issue: "Changes not taking effect"

**Solution:**
1. Clear your DNS cache:
   ```powershell
   ipconfig /flushdns
   ```

2. Check with external tool (not your local machine):
   ```
   https://mxtoolbox.com/spf.aspx
   ```

3. Wait longer (up to 48 hours in worst case)

### Issue: "Record exists but Resend doesn't see it"

**Solution:**
1. Check the **exact** record name in DNS:
   - Should be `@` or blank
   - NOT your domain name
   - NOT `asset-tracer.com`

2. Check TTL isn't too high:
   - Should be 3600 (1 hour) or Auto
   - NOT 86400 (24 hours)

---

## 📊 Diagnostic Checklist

Run through this checklist:

- [ ] Can see SPF record with `nslookup -type=txt yourdomain.com`
- [ ] Only ONE SPF record exists
- [ ] SPF includes `include:resend.com`
- [ ] SPF ends with `~all` or `-all`
- [ ] SPF starts with `v=spf1`
- [ ] DKIM record exists at `resend._domainkey`
- [ ] All records show green checkmark in Resend
- [ ] DNS propagation complete (check dnschecker.org)
- [ ] Test email sent successfully
- [ ] Test email received (check spam folder)

---

## 🚨 Common SPF Mistakes

### 1. Multiple SPF Records
```
❌ WRONG:
v=spf1 include:render.com ~all
v=spf1 include:resend.com ~all

✅ RIGHT:
v=spf1 include:render.com include:resend.com ~all
```

### 2. Wrong Record Name
```
❌ WRONG:
Name: asset-tracer.com
Name: www
Name: mail

✅ RIGHT:
Name: @
(or leave blank on some providers)
```

### 3. Missing "include:"
```
❌ WRONG:
v=spf1 resend.com ~all

✅ RIGHT:
v=spf1 include:resend.com ~all
```

### 4. Wrong Ending
```
❌ WRONG:
v=spf1 include:resend.com

✅ RIGHT:
v=spf1 include:resend.com ~all
```

---

## 🎓 Understanding SPF Endings

- `~all` = **Soft fail** (recommended) - Allows but marks as suspicious
- `-all` = **Hard fail** - Rejects non-authorized senders
- `?all` = **Neutral** - No policy
- `+all` = **Pass all** - NOT recommended (allows anyone)

**Use `~all` for Resend** (this is what they expect)

---

## 🆘 Still Not Working?

### Option 1: Screenshot Your DNS Records
1. Take screenshot of ALL your TXT records
2. Check if you see multiple `v=spf1` entries
3. Share with Resend support or delete duplicates

### Option 2: Use DNS Diagnostic Tool
```
https://mxtoolbox.com/SuperTool.aspx
```
Enter your domain and check all records

### Option 3: Contact Resend Support
https://resend.com/support

Provide:
- Your domain name
- Screenshot of DNS records
- Error message from Resend dashboard

### Option 4: Temporary Workaround
Use Resend's default sending domain while fixing DNS:
```
EMAIL_FROM="AssetTracer <onboarding@resend.dev>"
```
This works immediately but emails show "via resend.dev"

---

## ✅ Success Criteria

You'll know it's working when:
- ✅ Resend dashboard shows green checkmark for SPF
- ✅ Resend dashboard shows green checkmark for DKIM
- ✅ Test email sends successfully
- ✅ Test email arrives in inbox (not spam)
- ✅ Email shows from your domain (not resend.dev)

---

## 📝 What's Your DNS Provider?

Tell me where your domain is hosted and I can give you exact step-by-step instructions:
- [ ] Namecheap
- [ ] Cloudflare
- [ ] GoDaddy
- [ ] Vercel
- [ ] AWS Route 53
- [ ] Other: __________

Also, are you using Render for hosting? If so, do they provide any email services or just web hosting?

---

Let me know what you see when you check your current SPF records and I'll help you fix it! 🚀

