# ⚡ Production Deployment - Quick Start

**Time Required:** ~5 minutes  
**Risk Level:** Low (all changes in transaction, can rollback)

---

## 🎯 What We're Deploying

All the financial reporting fixes from staging:
- ✅ Purchase costs save correctly
- ✅ Net profit calculates accurately  
- ✅ Expenses auto-create transactions
- ✅ Asset revenue tracking works
- ✅ Monthly reports show correct averages

---

## 🚀 Deploy in 3 Steps

### **1. Backup (30 seconds)**
```
Supabase Dashboard → Settings → Database → Create Backup
```
Wait for confirmation before proceeding.

---

### **2. Run SQL Script (20 seconds)**

**Open:** Supabase SQL Editor (Production: `ftelnmursmitpjwjbyrw`)

**Copy and Paste:** Entire contents of `DEPLOY-REPORTING-FIXES-TO-PRODUCTION.sql`

**Click:** "Run"

**Wait for:** "✅ PRODUCTION DEPLOYMENT COMPLETE!"

---

### **3. Test Dashboard (2 minutes)**

**Go to:** https://www.asset-tracer.com

**Check:**
- [ ] Net Profit shows (not 0)
- [ ] Dashboard loads without errors
- [ ] Reports page displays monthly data
- [ ] Asset costs show correctly

---

## ✅ Done!

If all checks pass, you're good to go!

---

## ⚠️ If Something Goes Wrong

**Restore backup:**
```
Supabase Dashboard → Settings → Database → Backups → Restore
```

**Or contact me for help!**

---

## 📖 Need More Details?

See `PRODUCTION-DEPLOYMENT-CHECKLIST.md` for:
- Detailed troubleshooting
- Rollback procedures  
- Success criteria
- Post-deployment monitoring

---

**Deploy with confidence!** 💪

