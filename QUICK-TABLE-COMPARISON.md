# Quick Table Comparison - Staging vs Production

## 🎯 Goal
Copy missing tables from your staging database (ougntjrrskfsuognjmcw) to production.

---

## 📋 Step-by-Step Process

### **Step 1: Check Production (What You Have Now)**

1. Open **Production** Supabase SQL Editor
2. Run this query:

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

3. **Copy the list and paste it here in chat**

---

### **Step 2: Check Staging (What You Want)**

1. Open **Staging** Supabase SQL Editor (project: ougntjrrskfsuognjmcw)
2. Run the same query:

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

3. **Copy the list and paste it here in chat**

---

### **Step 3: I'll Create Missing Tables**

Once you share both lists, I'll:
1. Identify the 3 missing tables (14 - 11 = 3)
2. Export their schema from staging
3. Create SQL to add them to production
4. You run it → Done! ✅

---

## 🚀 Quick Method (If You Have Staging Access)

### **Option A: Export Full Schema from Staging**

1. Go to your **Staging** project dashboard
2. Settings → Database → Connection String
3. Use `pg_dump` to export schema:

```bash
pg_dump -h <host> -U postgres -d postgres --schema-only --table=<table_name> > table_schema.sql
```

### **Option B: Use Supabase CLI**

```bash
supabase db dump --project-ref ougntjrrskfsuognjmcw --schema public > staging-schema.sql
```

---

## 📊 Expected Output Format

When you paste the table lists, they should look like:

**Production (11 tables):**
```
assets
clients
expenses
invoice_items
invoices
organizations
quotation_items
quotations
team_invitations
transactions
users
```

**Staging (14 tables):**
```
assets
clients
[... plus 3 more tables ...]
```

---

## ⚡ Fastest Way

**Just paste these two things in chat:**

1. Output from running this in **PRODUCTION**:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

2. Output from running this in **STAGING**:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

I'll handle the rest! 🚀

