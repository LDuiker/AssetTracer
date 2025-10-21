# Schema Migrations Index

## 📋 All Database Migrations for AssetTracer

This document lists all SQL migrations in the correct order for deployment.

---

## 🎯 Essential Migrations (Run These in Order)

### 1. Core Schema Setup

#### **Step 1: Base Schema**
```sql
asset-tracer/supabase/tables-schema.sql
```
**Purpose:** Creates all base tables (users, organizations, assets, clients, invoices, etc.)

#### **Step 2: Functions and Triggers**
```sql
asset-tracer/supabase/functions.sql
```
**Purpose:** Creates database functions and triggers for automation

---

### 2. User & Organization Setup

#### **Step 3: User Organization Setup**
```sql
asset-tracer/supabase/SETUP-USER-ORG.sql
```
**Purpose:** Sets up user-organization relationships and triggers

#### **Step 4: User Triggers (Latest Version)**
```sql
asset-tracer/supabase/CREATE-USER-TRIGGER-V2.sql
```
**Purpose:** Auto-creates organization when user signs up

---

### 3. Feature Additions (In Order)

#### **Step 5: Asset Schema Fixes**
```sql
asset-tracer/supabase/FIX-ASSETS-SCHEMA.sql
asset-tracer/supabase/add-created-by-to-assets.sql
```
**Purpose:** Adds `created_by` field to assets table

#### **Step 6: User Profile Fields**
```sql
asset-tracer/supabase/ADD-USER-PHONE.sql
```
**Purpose:** Adds phone number to user profiles

#### **Step 7: Payment Integration**
```sql
asset-tracer/supabase/ADD-PAYMENT-COLUMNS.sql
```
**Purpose:** Adds DPO payment tracking columns to invoices

#### **Step 8: Company Profile**
```sql
asset-tracer/supabase/ADD-COMPANY-PROFILE-FIELDS.sql
asset-tracer/supabase/CREATE-COMPANY-LOGOS-BUCKET.sql
```
**Purpose:** Company details and logo storage

#### **Step 9: Organization Settings**
```sql
asset-tracer/supabase/ADD-ORGANIZATION-SETTINGS.sql
```
**Purpose:** Adds settings fields to organizations table

---

### 4. Quotations System

#### **Step 10: Create Quotations**
```sql
asset-tracer/supabase/CREATE-QUOTATIONS-TABLES.sql
```
**Purpose:** Creates quotations and quotation_items tables

#### **Step 11: Add Asset Reference**
```sql
asset-tracer/supabase/ADD-ASSET-ID-TO-QUOTATION-ITEMS.sql
```
**Purpose:** Links quotation items to assets

#### **Step 12: Add Conversion Tracking**
```sql
asset-tracer/supabase/ADD-CONVERTED-TO-INVOICE-COLUMN.sql
asset-tracer/supabase/ADD-INVOICED-STATUS-TO-QUOTATIONS.sql
```
**Purpose:** Tracks when quotations are converted to invoices

#### **Step 13: Add Subject Fields**
```sql
asset-tracer/supabase/ADD-SUBJECT-FIELDS.sql
```
**Purpose:** Adds email subject fields for quotations

#### **Step 14: Add Default Notes**
```sql
asset-tracer/supabase/ADD-DEFAULT-NOTES-AND-TERMS.sql
```
**Purpose:** Adds default notes and terms to quotations/invoices

---

### 5. Subscription & Billing

#### **Step 15: Subscription Tier**
```sql
asset-tracer/supabase/ADD-SUBSCRIPTION-TIER.sql
```
**Purpose:** Adds subscription_tier column to organizations

#### **Step 16: Polar Integration**
```sql
asset-tracer/supabase/ADD-POLAR-INTEGRATION.sql
```
**Or use the complete version:**
```sql
COMPLETE-POLAR-MIGRATION.sql
```
**Purpose:** Adds all Polar.sh billing fields to organizations

#### **Step 17: Email Notifications**
```sql
ADD-EMAIL-NOTIFICATIONS.sql
```
**Purpose:** Adds email notification preferences for Business plan

---

### 6. Team Management

#### **Step 18: Team Features**
```sql
asset-tracer/supabase/ADD-TEAM-MANAGEMENT.sql
```
**Purpose:** Adds roles, invitations, and team member management

---

## 🔧 Maintenance & Fix Migrations

### User Fixes
- `asset-tracer/supabase/FIX-EXISTING-AUTH-USERS.sql` - Fix existing users without orgs
- `asset-tracer/supabase/FIX-USER-PROFILE-UPDATES.sql` - Fix user profile update issues
- `FIX-LARONA-USER.sql` - Cleanup specific stuck user
- `CLEANUP-STUCK-USER.sql` - Generic stuck user cleanup

### Quotations Fixes
- `asset-tracer/supabase/COMPLETE-INVOICED-FIX.sql` - Fix invoiced status
- `asset-tracer/supabase/FORCE-UPDATE-INVOICED-STATUS.sql` - Force update status

### Subscription Fixes
- `QUICK-FIX-UPDATE-TIER.sql` - Manually update subscription tier
- `asset-tracer/supabase/UPGRADE-TO-PRO-MANUAL.sql` - Manually upgrade to Pro
- `asset-tracer/supabase/UPGRADE-TO-BUSINESS-MANUAL.sql` - Manually upgrade to Business

### Schema Fixes
- `VERIFY-AND-FIX.sql` - Verify and fix schema issues
- `FIX-DELETE-RLS-POLICY.sql` - Fix RLS policies for deletions

---

## ✅ Verification Scripts

Use these to verify your database setup:

```sql
-- Check schema
asset-tracer/supabase/check-schema.sql
asset-tracer/supabase/check-assets-schema.sql

-- Verify specific features
asset-tracer/supabase/VERIFY-TRIGGER.sql
asset-tracer/supabase/VERIFY-INVOICE-SCHEMA.sql
asset-tracer/supabase/VERIFY-QUOTATIONS-SETUP.sql
asset-tracer/supabase/VERIFY-AND-FIX-SUBJECT-COLUMN.sql
asset-tracer/supabase/VERIFY-DEFAULT-NOTES-COLUMNS.sql
asset-tracer/supabase/VERIFY-ANALYTICS-DATA.sql
asset-tracer/supabase/VERIFY-INVOICED-STATUS.sql

-- Test queries
asset-tracer/supabase/TEST-QUOTATIONS.sql
asset-tracer/supabase/TEST-QUOTATIONS-QUERY.sql
asset-tracer/supabase/CHECK-INVOICE-DATA.sql
```

---

## 🚀 Complete Schema

If you want to see the complete final schema:

```sql
asset-tracer/supabase/complete-schema.sql
```
**Purpose:** Reference document showing the complete final database structure

---

## 📦 Quick Deployment Script

For a **fresh database deployment** (Staging or Production), run these in order:

### Minimal Essential Migrations (18 files)

```sql
-- 1. Base Setup (2 files)
asset-tracer/supabase/tables-schema.sql
asset-tracer/supabase/functions.sql

-- 2. User Setup (2 files)
asset-tracer/supabase/SETUP-USER-ORG.sql
asset-tracer/supabase/CREATE-USER-TRIGGER-V2.sql

-- 3. Asset Features (2 files)
asset-tracer/supabase/FIX-ASSETS-SCHEMA.sql
asset-tracer/supabase/add-created-by-to-assets.sql

-- 4. User & Company (3 files)
asset-tracer/supabase/ADD-USER-PHONE.sql
asset-tracer/supabase/ADD-COMPANY-PROFILE-FIELDS.sql
asset-tracer/supabase/CREATE-COMPANY-LOGOS-BUCKET.sql

-- 5. Payment & Settings (2 files)
asset-tracer/supabase/ADD-PAYMENT-COLUMNS.sql
asset-tracer/supabase/ADD-ORGANIZATION-SETTINGS.sql

-- 6. Quotations (4 files)
asset-tracer/supabase/CREATE-QUOTATIONS-TABLES.sql
asset-tracer/supabase/ADD-ASSET-ID-TO-QUOTATION-ITEMS.sql
asset-tracer/supabase/ADD-CONVERTED-TO-INVOICE-COLUMN.sql
asset-tracer/supabase/ADD-SUBJECT-FIELDS.sql
asset-tracer/supabase/ADD-DEFAULT-NOTES-AND-TERMS.sql
asset-tracer/supabase/ADD-INVOICED-STATUS-TO-QUOTATIONS.sql

-- 7. Subscriptions (2 files)
COMPLETE-POLAR-MIGRATION.sql
ADD-EMAIL-NOTIFICATIONS.sql

-- 8. Team Management (1 file)
asset-tracer/supabase/ADD-TEAM-MANAGEMENT.sql
```

---

## 📂 File Organization

### Main Migrations Directory
```
asset-tracer/supabase/
├── tables-schema.sql          (Base tables)
├── functions.sql              (Functions & triggers)
├── CREATE-QUOTATIONS-TABLES.sql
├── ADD-POLAR-INTEGRATION.sql
├── ADD-TEAM-MANAGEMENT.sql
└── ... (other migrations)
```

### Root Directory (Quick Fixes)
```
AssetTracer/
├── COMPLETE-POLAR-MIGRATION.sql
├── ADD-EMAIL-NOTIFICATIONS.sql
├── FIX-LARONA-USER.sql
├── CLEANUP-STUCK-USER.sql
└── ... (other quick fixes)
```

---

## 🎯 For Deployment

### Staging Database
1. Create new Supabase project: `assettracer-staging`
2. Run all 18 essential migrations in order (see above)
3. Run verification scripts to confirm
4. Ready to test!

### Production Database
1. Create new Supabase project: `assettracer-production`
2. Run same 18 essential migrations in order
3. Run verification scripts
4. Configure RLS policies (already in migrations)
5. Ready to launch!

---

## 🔍 Migration Categories

### Core Schema (Must Run)
- ✅ `tables-schema.sql`
- ✅ `functions.sql`
- ✅ `SETUP-USER-ORG.sql`
- ✅ `CREATE-USER-TRIGGER-V2.sql`

### Feature Additions (Should Run)
- ✅ Asset features
- ✅ Quotations system
- ✅ Payment integration
- ✅ Company profiles
- ✅ Subscription billing
- ✅ Team management
- ✅ Email notifications

### Fixes & Maintenance (Run as Needed)
- 🔧 User fixes
- 🔧 Quotation fixes
- 🔧 Subscription fixes
- 🔧 RLS policy fixes

### Verification (Testing Only)
- ✓ Schema verification
- ✓ Feature testing
- ✓ Data integrity checks

---

## 💡 Pro Tips

### For Clean Deployment
1. Always start with `tables-schema.sql`
2. Run migrations in the order listed above
3. Verify each major section before moving on
4. Keep staging and production in sync

### For Debugging
1. Check `complete-schema.sql` for reference
2. Use verification scripts after each migration
3. Test with real data in staging first

### For Updates
1. Test migration in local dev first
2. Apply to staging
3. Verify thoroughly
4. Apply to production
5. Create rollback plan if needed

---

## 📞 Need Help?

If a migration fails:
1. Check the error message
2. Look for similar verification script
3. Check if table/column already exists
4. May need to adjust migration for existing data
5. Refer to specific migration documentation

---

## 🗂️ Quick Reference

**Total Migrations:** 56 SQL files
**Essential for Deployment:** 18 files
**Verification Scripts:** 15 files
**Fix Scripts:** 10 files
**Test Scripts:** 13 files

---

**Last Updated:** 2025-10-21
**Database Version:** AssetTracer v1.0
**Compatible with:** Supabase PostgreSQL 15+

