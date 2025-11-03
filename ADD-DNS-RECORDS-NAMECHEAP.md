# Add DNS Records in Namecheap for send.asset-tracer.com

## Your domain uses Namecheap nameservers
You need to add the DNS records in **Namecheap**, not Cloudflare.

---

## Step-by-Step Instructions

### 1. Login to Namecheap
- Go to: https://www.namecheap.com/myaccount/login/
- Enter your credentials

### 2. Navigate to DNS Management
- Click: **Domain List** (in the left sidebar)
- Find: `asset-tracer.com`
- Click: **Manage** button

### 3. Go to Advanced DNS
- Click the **Advanced DNS** tab at the top

---

## Add Record #1: SPF (TXT Record)

1. Click: **Add New Record** button
2. Fill in the following:
   - **Type:** Select `TXT Record` from dropdown
   - **Host:** `send`
   - **Value:** `v=spf1 include:amazonses.com ~all`
   - **TTL:** Automatic (or 1 min)
3. Click: **Save Changes** (green checkmark icon)

**Important:**
- Use just `send` as the host (NOT `send.asset-tracer.com`)
- Namecheap automatically appends your domain name

---

## Add Record #2: MX Record

1. Click: **Add New Record** button
2. Fill in the following:
   - **Type:** Select `MX Record` from dropdown
   - **Host:** `send`
   - **Value:** `feedback-smtp.us-east-1.amazonses.com`
   - **Priority:** `10`
   - **TTL:** Automatic (or 1 min)
3. Click: **Save Changes** (green checkmark icon)

**Important:**
- Use just `send` as the host (NOT `send.asset-tracer.com`)
- Priority must be `10`
- Do NOT include "10" in the value field - use a separate Priority field

---

## Visual Guide for Namecheap

### For TXT Record:
```
┌─────────────────────────────────────────────────────────┐
│ Type: [TXT Record ▼]                                    │
│ Host: [send                    ]                        │
│ Value: [v=spf1 include:amazonses.com ~all            ] │
│ TTL:  [Automatic ▼]                                     │
│ [✓ Save Changes]                                        │
└─────────────────────────────────────────────────────────┘
```

### For MX Record:
```
┌─────────────────────────────────────────────────────────┐
│ Type: [MX Record ▼]                                     │
│ Host: [send                    ]                        │
│ Value: [feedback-smtp.us-east-1.amazonses.com        ] │
│ Priority: [10]                                          │
│ TTL:  [Automatic ▼]                                     │
│ [✓ Save Changes]                                        │
└─────────────────────────────────────────────────────────┘
```

---

## After Adding Records

### 1. Wait for Propagation
- Namecheap DNS updates usually take 5-30 minutes
- Sometimes faster if you set TTL to "1 min"

### 2. Verify the Records
Run this PowerShell script to check:
```powershell
.\verify-send-subdomain-dns.ps1
```

Expected output:
- ✓ SPF Record Found: `v=spf1 include:amazonses.com ~all`
- ✓ MX Record Found: `feedback-smtp.us-east-1.amazonses.com` (Priority: 10)

### 3. Check Resend Dashboard
- Go to: https://resend.com/domains
- Your domain `asset-tracer.com` should show **"Verified"**
- All 3 records (DKIM, SPF, MX) should be green checkmarks

---

## Common Namecheap Issues

### Issue 1: "Host already exists"
**Solution:** Check if you already have a record with host `send`. If so, edit it instead of creating a new one.

### Issue 2: "Invalid value format"
**Solution:** 
- For TXT: Copy-paste the exact value without quotes
- For MX: Do NOT include the priority number in the value field

### Issue 3: Records not showing up
**Solution:**
- Flush your DNS cache: `ipconfig /flushdns`
- Wait 10-15 more minutes
- Use online tool: https://mxtoolbox.com/SuperTool.aspx

---

## What You're Adding

**Record 1 - SPF (TXT):**
- Tells email servers that Amazon SES is authorized to send emails for `send.asset-tracer.com`

**Record 2 - MX:**
- Routes bounce notifications and feedback to Amazon SES
- Priority 10 means "first choice" mail server

---

## Next Steps After Verification

Once Resend shows "Verified":
1. ✅ Your domain is ready to send emails!
2. Update Vercel with production Resend API key
3. Test email notifications
4. Customers receive professional emails from `noreply@send.asset-tracer.com`

---

## Need Help?

If you get stuck:
1. Take a screenshot of the Namecheap Advanced DNS page
2. Show me what you see
3. I'll help troubleshoot

**Current Status:**
- ✅ DKIM record exists (1/3)
- ⏳ SPF record - **ADD IN NAMECHEAP NOW**
- ⏳ MX record - **ADD IN NAMECHEAP NOW**

