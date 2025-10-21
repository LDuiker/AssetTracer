# Quick Deployment Checklist

## 🚀 Get Your App to Production in 1 Hour

### Prerequisites
- ✅ GitHub account
- ✅ Working local application
- ✅ Code pushed to GitHub

---

## Step 1: Create Supabase Projects (15 min)

### Staging Database
1. Go to [supabase.com](https://supabase.com)
2. New Project → `assettracer-staging`
3. Save credentials:
   - URL: `_______________________`
   - Anon Key: `_______________________`
   - Service Role: `_______________________`
4. Run all your SQL migrations in SQL Editor

### Production Database
1. New Project → `assettracer-production`
2. Save credentials:
   - URL: `_______________________`
   - Anon Key: `_______________________`
   - Service Role: `_______________________`
3. Run same SQL migrations

---

## Step 2: Set Up Polar.sh (5 min)

### For Staging (keep sandbox)
- ✅ Use existing sandbox API key
- ✅ Add staging webhook URL (after Vercel setup)

### For Production
1. Go to [polar.sh](https://polar.sh) (NOT sandbox)
2. Create live account
3. Get LIVE API key: `_______________________`
4. Set up live products (Pro & Business)
5. Get live Price IDs:
   - Pro: `_______________________`
   - Business: `_______________________`

---

## Step 3: Deploy to Vercel (20 min)

### Create Staging
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. New Project → Import your repo
4. Name: `assettracer-staging`
5. Root Directory: `./asset-tracer`
6. Add environment variables (see below)
7. Deploy!
8. Save URL: `_______________________`

### Create Production
1. New Project → Same repo
2. Name: `assettracer`
3. Root Directory: `./asset-tracer`
4. Add environment variables (see below)
5. Deploy!
6. Save URL: `_______________________`

---

## Step 4: Environment Variables

### Staging Variables (in Vercel)

```env
NEXT_PUBLIC_SUPABASE_URL=your-staging-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-key
POLAR_API_KEY=your-sandbox-api-key
NEXT_PUBLIC_POLAR_SANDBOX=true
RESEND_API_KEY=your-resend-key
EMAIL_FROM=staging@yourdomain.com
CRON_SECRET=generate-random-32-chars
NEXT_PUBLIC_ENV=staging
```

### Production Variables (in Vercel)

```env
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key
POLAR_API_KEY=your-LIVE-polar-api-key
NEXT_PUBLIC_POLAR_SANDBOX=false
RESEND_API_KEY=your-resend-key
EMAIL_FROM=noreply@yourdomain.com
CRON_SECRET=different-random-32-chars
NEXT_PUBLIC_ENV=production
```

**Generate secrets:**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

---

## Step 5: Configure Auth Redirects (5 min)

### Staging Supabase
1. Settings → Authentication → URL Configuration
2. Site URL: `https://assettracer-staging.vercel.app`
3. Redirect URLs: `https://assettracer-staging.vercel.app/**`

### Production Supabase
1. Settings → Authentication → URL Configuration
2. Site URL: `https://yourdomain.com`
3. Redirect URLs: `https://yourdomain.com/**`

---

## Step 6: Set Up Webhooks (5 min)

### Staging
1. Polar Sandbox → Settings → Webhooks
2. Add: `https://assettracer-staging.vercel.app/api/webhooks/polar`

### Production
1. Polar Live → Settings → Webhooks
2. Add: `https://yourdomain.com/api/webhooks/polar`

---

## Step 7: Test Everything (10 min)

### Test Staging
- ✅ Visit staging URL
- ✅ Sign in with Google
- ✅ Create test asset
- ✅ Try upgrading to Pro (sandbox payment)
- ✅ Check webhook fired (Supabase logs)

### Test Production (carefully!)
- ✅ Visit production URL
- ✅ Sign in works
- ✅ Test with test payment card
- ✅ Verify real payment processing

---

## Step 8: Go Live! 🎉

1. Announce to users
2. Monitor for issues
3. Celebrate! 🥳

---

## 🆘 Quick Fixes

### Build Failed?
```bash
# Test build locally first:
cd asset-tracer
npm run build
```

### Can't Sign In?
- Check Supabase redirect URLs
- Verify Site URL is correct

### Webhooks Not Working?
- Check URL is correct in Polar
- Verify webhook secret matches
- Check Vercel function logs

---

## 📋 Pre-Launch Checklist

- ✅ All tests pass in staging
- ✅ Terms of Service page added
- ✅ Privacy Policy page added
- ✅ Custom domain configured (optional)
- ✅ Favicon added
- ✅ Error pages customized
- ✅ Support email set up
- ✅ Backups enabled (Supabase automatic)
- ✅ Analytics configured (Vercel Analytics)

---

## 🔄 Deployment Workflow

```
Local Development
↓ (git push origin staging)
Staging Environment → Test Here
↓ (git push origin main)
Production Environment → Live!
```

---

## 💰 Costs Estimate

### Free Tier
- **Vercel:** Free (Hobby plan)
- **Supabase:** Free (up to 500MB DB, 50,000 monthly active users)
- **Polar:** Free (0% fee on first $10k)
- **Resend:** Free (100 emails/day)

**Total:** $0/month to start! 🎉

### As You Grow
- **Vercel Pro:** $20/month (when you need more)
- **Supabase Pro:** $25/month (when you hit limits)
- **Polar:** 5% + Stripe fees (after $10k)
- **Resend:** $20/month (when you need more emails)

---

## 🎯 Critical Configuration

### Update Polar Product IDs

In `asset-tracer/app/api/subscription/upgrade/route.ts`:

```typescript
const productMapping = {
  pro: 'price_xxxxxxxxxx',      // ← Update with LIVE Price ID
  business: 'price_yyyyyyyyyy', // ← Update with LIVE Price ID
};
```

### Update next.config.js (if needed)

```javascript
module.exports = {
  // Silence the lockfile warning
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
}
```

---

## 📞 Support Resources

- **Vercel:** [vercel.com/support](https://vercel.com/support)
- **Supabase:** [supabase.com/support](https://supabase.com/support)
- **Polar:** [docs.polar.sh](https://docs.polar.sh)
- **Next.js:** [nextjs.org/docs](https://nextjs.org/docs)

---

## ⏱️ Time Breakdown

- Supabase Setup: 15 min
- Polar Setup: 5 min
- Vercel Deployment: 20 min
- Configuration: 10 min
- Testing: 10 min

**Total:** ~60 minutes to production! 🚀

---

**Need help? Refer to DEPLOYMENT-GUIDE.md for detailed instructions!**

