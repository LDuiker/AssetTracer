# Add Missing DNS Records for send.asset-tracer.com

## Problem
Resend requires DNS records for the **subdomain** `send.asset-tracer.com`, not just the root domain `asset-tracer.com`.

**Currently Missing:**
- SPF (TXT) record for `send.asset-tracer.com`
- MX record for `send.asset-tracer.com`

---

## Records to Add

### 1. SPF Record (TXT)
```
Type: TXT
Name: send.asset-tracer.com
Value: v=spf1 include:amazonses.com ~all
TTL: 3600 (or Auto)
```

**For Cloudflare:**
- Go to: https://dash.cloudflare.com/
- Select your domain: `asset-tracer.com`
- Click: **DNS** → **Records**
- Click: **Add record**
- Settings:
  - **Type:** TXT
  - **Name:** send
  - **Content:** `v=spf1 include:amazonses.com ~all`
  - **TTL:** Auto
  - **Proxy status:** DNS only (gray cloud)
- Click: **Save**

### 2. MX Record
```
Type: MX
Name: send.asset-tracer.com
Value: 10 feedback-smtp.us-east-1.amazonses.com
Priority: 10
TTL: 3600 (or Auto)
```

**For Cloudflare:**
- Click: **Add record**
- Settings:
  - **Type:** MX
  - **Name:** send
  - **Mail server:** feedback-smtp.us-east-1.amazonses.com
  - **Priority:** 10
  - **TTL:** Auto
- Click: **Save**

---

## Important Notes

### Subdomain vs Root Domain

**What you had before:**
- SPF for `asset-tracer.com`
- MX for `asset-tracer.com`

**What Resend needs:**
- SPF for `send.asset-tracer.com`
- MX for `send.asset-tracer.com`

The subdomain approach is common with email services because it:
- Isolates email reputation from your main domain
- Allows better tracking and control
- Keeps your root domain's email separate from transactional emails

### After Adding Records

1. **Wait 5-10 Minutes**
   - DNS propagation is usually faster for subdomains
   - Cloudflare is typically very fast

2. **Check Resend Dashboard**
   - Go to: https://resend.com/domains
   - Your domain should show "Verified" status
   - All 3 records (DKIM, SPF, MX) should be green

3. **Test Email Sending**
   - Once verified, test with the production API key
   - Send to: mrlduiker@gmail.com (your verified email)

---

## Verification Command (PowerShell)

After adding the records, verify them:

```powershell
# Check SPF (TXT) record
Resolve-DnsName -Name send.asset-tracer.com -Type TXT

# Check MX record
Resolve-DnsName -Name send.asset-tracer.com -Type MX
```

Expected results:
- TXT should show: `v=spf1 include:amazonses.com ~all`
- MX should show: `feedback-smtp.us-east-1.amazonses.com` with priority 10

---

## Troubleshooting

### If records don't appear after 10 minutes:

1. **Check the Name field:**
   - Use just `send` (not the full `send.asset-tracer.com`)
   - Cloudflare automatically appends your domain

2. **Check Proxy Status:**
   - Must be "DNS only" (gray cloud)
   - Email records cannot be proxied

3. **Flush DNS cache:**
   ```powershell
   ipconfig /flushdns
   ```

4. **Use online tool:**
   - https://mxtoolbox.com/SuperTool.aspx
   - Enter: `send.asset-tracer.com`
   - Check TXT and MX records

---

## Current Status

- ✅ DKIM record exists (1 of 3)
- ⏳ SPF record - **ADD NOW**
- ⏳ MX record - **ADD NOW**

Once both records are added and verified, your domain will be fully configured for sending emails via Resend!

---

## What Happens Next

After domain verification:
1. Update Vercel environment variables with production Resend API key
2. Test email notifications (invoices, quotes, etc.)
3. Your customers will receive professional emails from `noreply@send.asset-tracer.com`

