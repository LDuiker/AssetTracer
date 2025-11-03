# Get Your Production Resend API Key

## The 403 Forbidden Error

You got a 403 error, which means the API key either:
- Was created before domain verification
- Doesn't have the right permissions
- Needs to be regenerated after verification

---

## How to Get the Correct API Key

### 1. Go to Resend API Keys Page
**URL:** https://resend.com/api-keys

### 2. Check Your Current Keys
Look at your existing API keys. You might see:
- Keys created before domain verification (these won't work)
- Test keys (limited to your own email)

### 3. Create a NEW Production Key (Recommended)

**Steps:**
1. Click: **"Create API Key"** button
2. Fill in:
   - **Name:** `AssetTracer Production`
   - **Permission:** `Sending access` (or `Full access`)
   - **Domain:** Select `asset-tracer.com` from dropdown
3. Click: **"Add"** or **"Create"**
4. **IMPORTANT:** Copy the API key immediately - you can't see it again!

### 4. Test with the New Key

Run this command with your new API key:
```powershell
.\test-email-simple.ps1 -ApiKey "re_YOUR_NEW_KEY_HERE" -ToEmail "mrlduiker@gmail.com"
```

---

## Expected Result

After using the correct production API key:
```
=== Testing Production Email via Resend ===
Sending test email to: mrlduiker@gmail.com

Sending email...

SUCCESS! Email sent!
Email ID: abc123...
Check your inbox at: mrlduiker@gmail.com
```

---

## API Key Permissions

Make sure your API key has:
- ✅ **Sending access** (at minimum)
- ✅ **Linked to asset-tracer.com domain**
- ✅ **Created AFTER domain verification**

---

## Security Notes

**For Vercel Environment Variables:**
- Use the production API key (starts with `re_`)
- Store it in Vercel as `RESEND_API_KEY`
- Keep it secret - never commit to git

---

## Troubleshooting

### Still Getting 403?
1. Check if domain is actually verified in Resend dashboard
2. Make sure you're using the key that was created AFTER verification
3. Try deleting old keys and creating a fresh one

### Key Types:
- **Test Mode Key:** Can only send to your own email
- **Production Key:** Can send to any email (what you need)

---

## Next Steps After Success

Once the test email works:
1. ✅ Save the API key securely
2. Update Vercel environment variables
3. Deploy to production
4. Test in-app email notifications (invoices, quotes, etc.)

