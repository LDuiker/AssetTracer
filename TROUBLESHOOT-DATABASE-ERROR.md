# Troubleshooting: "relation 'assets' does not exist"

## 🔍 Diagnose the Problem

### Step 1: Verify Which Database You're Looking At

**Question:** Where are you seeing this error?

- ⭐ **In your deployed app** (e.g., on Vercel)?
- 💻 **In your local development** (localhost:3000)?
- 🗄️ **In Supabase SQL Editor**?

**Important:** Each environment has its OWN database!

---

### Step 2: Check Your Environment Variables

#### If error is in **deployed app** (Vercel):

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Check: `NEXT_PUBLIC_SUPABASE_URL`
   - Does it point to your production Supabase project?
   - Copy the URL

5. Go to that Supabase project
6. Verify it has tables (see Step 3)

#### If error is in **local development**:

1. Open `asset-tracer/.env.local`
2. Check: `NEXT_PUBLIC_SUPABASE_URL`
3. Go to that Supabase project
4. Verify it has tables

---

### Step 3: Verify Tables Exist in Supabase

1. Go to: https://supabase.com/dashboard
2. Select the **CORRECT** project (check URL matches your env variable)
3. Click **"Table Editor"** in left sidebar
4. Do you see these tables?
   - assets ✓
   - clients ✓
   - expenses ✓
   - invoices ✓
   - organizations ✓
   - users ✓

**If NO tables:** The migrations haven't been run! (Go to Solution A)

**If tables exist:** Environment variable mismatch! (Go to Solution B)

---

## ✅ Solution A: Tables Don't Exist (Most Common)

**You need to run the database migrations!**

### Quick Fix:

1. **Open Supabase SQL Editor:**
   - Go to your Supabase project
   - Click "SQL Editor" in sidebar

2. **Run this ONE file first:**
   ```
   asset-tracer/supabase/tables-schema.sql
   ```
   - Open the file in VS Code
   - Copy ALL contents (Ctrl+A, Ctrl+C)
   - Paste into Supabase SQL Editor
   - Click "Run"
   - Wait for green checkmark

3. **Verify it worked:**
   - Go to "Table Editor"
   - You should now see 11+ tables
   - Including "assets"!

4. **Run remaining migrations:**
   - See `PRODUCTION-DATABASE-SETUP.md`
   - Or run: `.\run-migrations.ps1`

---

## ✅ Solution B: Environment Variable Mismatch

**Your app is pointing to the wrong database!**

### For Production (Vercel):

1. Go to Vercel Dashboard
2. Your project → Settings → Environment Variables
3. Update these variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

4. **Important:** Redeploy your app after changing env variables
5. Go to Deployments → Click "..." → Redeploy

### For Local Development:

1. Open `asset-tracer/.env.local`
2. Update:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```
3. Restart your dev server:
```bash
cd asset-tracer
npx next dev -p 3000
```

---

## ✅ Solution C: Wrong Supabase Project

**You might have multiple projects and ran migrations on the wrong one!**

1. List all your Supabase projects:
   - Go to https://supabase.com/dashboard
   - How many projects do you see?

2. For EACH project:
   - Click on it
   - Go to Table Editor
   - Check if tables exist

3. Find the project WITH tables

4. Update your environment variables to point to that project

---

## 🔍 Verification Script

Run this in Supabase SQL Editor to see what exists:

```sql
-- See all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected output:**
```
table_name
-----------
assets
clients
expenses
inventory_items
invoice_items
invoices
organizations
quotation_items
quotations
team_invitations
transactions
users
```

**If you see EMPTY results:** No tables exist! Run migrations!

---

## 🎯 Quick Checklist

**Step 1: Identify where error occurs**
- [ ] Deployed app (Vercel)?
- [ ] Local development?
- [ ] Supabase SQL Editor?

**Step 2: Find which Supabase project is being used**
- [ ] Check environment variables
- [ ] Copy the Supabase URL

**Step 3: Go to that Supabase project**
- [ ] Open Table Editor
- [ ] Count how many tables exist

**Step 4: If 0 tables:**
- [ ] Run `tables-schema.sql` in SQL Editor
- [ ] Verify tables now appear
- [ ] Run remaining 17 migrations

**Step 5: If tables exist but still getting error:**
- [ ] Check environment variables again
- [ ] Make sure URL matches
- [ ] Restart/redeploy your app

---

## 💡 Common Mistakes

### Mistake 1: Running migrations in wrong project
**Problem:** You have 3 Supabase projects (local, staging, production) and ran migrations in the wrong one.

**Solution:** Verify which project your app is using, then run migrations there.

### Mistake 2: Environment variables not updated
**Problem:** Created new Supabase project but forgot to update env variables.

**Solution:** Update ALL places:
- Local: `.env.local`
- Vercel: Project Settings → Environment Variables

### Mistake 3: Partial migration
**Problem:** Only ran some migrations, not all.

**Solution:** Run all 18 essential migrations in order.

### Mistake 4: Migration errors ignored
**Problem:** Migration had errors but you didn't notice.

**Solution:** Check for red error messages. Each migration should show green checkmark.

---

## 🆘 Still Not Working?

### Debug Steps:

1. **Confirm exact error message:**
   - Copy the FULL error
   - Where does it appear?
   - What action triggers it?

2. **Test with SQL directly:**
   - Go to Supabase SQL Editor
   - Run: `SELECT * FROM assets LIMIT 1;`
   - Does it work or error?

3. **Check Supabase logs:**
   - Supabase Dashboard → Logs
   - Look for connection errors

4. **Verify RLS policies:**
   - Table Editor → Select "assets"
   - Click "..." → View Policies
   - Are policies enabled?

---

## 📞 Information to Provide

If still stuck, provide:

1. **Where error occurs:**
   - Deployed app URL?
   - Local development?

2. **Supabase project URL:**
   - What's your NEXT_PUBLIC_SUPABASE_URL?

3. **Tables that exist:**
   - Run verification SQL
   - Share the list of tables

4. **Full error message:**
   - Copy entire error
   - Include stack trace if available

---

## 🎯 Most Likely Solution

**90% of the time, the solution is:**

1. Go to your Supabase production project
2. Click "SQL Editor"
3. Paste contents of `tables-schema.sql`
4. Click "Run"
5. Done!

**The migration probably just hasn't been run yet.**

---

## 📚 Helpful Files

- `VERIFY-DATABASE.sql` - Check what tables exist
- `PRODUCTION-DATABASE-SETUP.md` - Step-by-step migration guide
- `MIGRATION-INDEX.md` - Complete list of all migrations
- `run-migrations.ps1` - PowerShell helper script
- `tables-schema.sql` - The main migration that creates all tables

---

**Start with the verification script to diagnose the problem, then follow the appropriate solution!** 🎯

