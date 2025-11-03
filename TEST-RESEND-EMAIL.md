# 🧪 Test Resend Email Setup

## Quick Test After DNS Verification

### Option 1: Test via Resend Dashboard (Easiest)

1. Go to: **https://resend.com/emails**
2. Click **"Send Test Email"**
3. Fill in:
   - **From:** `notifications@asset-tracer.com`
   - **To:** Your personal email
   - **Subject:** `Test Email`
   - **HTML:** `<h1>It works!</h1>`
4. Click **"Send"**
5. Check your inbox (and spam folder)

---

### Option 2: Test via API (Using PowerShell)

```powershell
# Replace these values:
$apiKey = "re_your_api_key"
$from = "AssetTracer <notifications@asset-tracer.com>"
$to = "your-email@example.com"

# Send test email
$body = @{
    from = $from
    to = $to
    subject = "🎉 AssetTracer Email Test"
    html = @"
<div style="font-family: Arial, sans-serif; padding: 20px;">
    <h1 style="color: #3b82f6;">Email Setup Successful!</h1>
    <p>Your Resend integration is working correctly.</p>
    <p style="color: #666;">Sent from AssetTracer Production</p>
</div>
"@
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.resend.com/emails" `
    -Method Post `
    -Headers @{
        "Authorization" = "Bearer $apiKey"
        "Content-Type" = "application/json"
    } `
    -Body $body
```

---

### Option 3: Test via Your App (Production)

1. Deploy your app to Vercel with the new environment variables
2. Manually trigger the test endpoint:

```bash
curl https://www.asset-tracer.com/api/test-email
```

Or create a test endpoint if it doesn't exist yet.

---

### ✅ What Success Looks Like

**In Resend Dashboard:**
- Email status: "Delivered" ✅
- Not "Bounced" or "Failed"

**In Your Inbox:**
- Email received
- NOT in spam folder
- From address shows: `AssetTracer <notifications@asset-tracer.com>`

---

### ❌ Troubleshooting

**Issue: "Domain not verified"**
- Wait longer (up to 1 hour)
- Check DNS records in Namecheap
- Verify no typos in record values

**Issue: "Invalid API key"**
- Check `RESEND_API_KEY` in Vercel
- Make sure it starts with `re_`
- Create a new API key if needed

**Issue: "Email rejected"**
- Check `EMAIL_FROM` matches verified domain
- Must be `@asset-tracer.com` (not gmail/yahoo)

**Issue: Email in spam**
- Normal for first few emails
- Add to contacts
- Send more legitimate emails to improve reputation

---

## 🚀 Next Steps

Once test email works:

1. ✅ DNS configured
2. ✅ Domain verified
3. ✅ Test email sent successfully
4. 🎯 **Ready for production!**

Your invoice reminders and weekly reports will now work automatically! 📧✨

