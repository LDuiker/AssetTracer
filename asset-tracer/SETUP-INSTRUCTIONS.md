# Setup Instructions - Company Profile & Logo

## Quick Setup Guide

Follow these steps to enable company branding on your invoices and quotations.

---

## Step 1: Database Setup

### **A. Add Company Profile Fields**

**Run in Supabase SQL Editor**:
```sql
-- File: supabase/ADD-COMPANY-PROFILE-FIELDS.sql
```

This adds these columns to `organizations` table:
- `company_email`
- `company_phone`
- `company_address`
- `company_city`
- `company_state`
- `company_postal_code`
- `company_country`
- `company_website`
- `company_logo_url`

---

### **B. Create Logo Storage Bucket**

**Run in Supabase SQL Editor**:
```sql
-- File: supabase/CREATE-COMPANY-LOGOS-BUCKET.sql
```

This creates:
- Storage bucket: `company-logos` (public)
- RLS policies for secure uploads
- Public read access for PDFs

---

## Step 2: Add Your Company Profile

1. **Navigate to Settings**:
   - Click your profile icon in top-right
   - Select "Settings"
   - Go to "Organization" tab

2. **Fill in Company Details**:
   
   **Basic Info** (appears in header):
   - ✅ Company Name (e.g., "Acme Corporation")
   - ✅ Email (e.g., "info@acme.com")
   - ✅ Phone (e.g., "+1 (555) 123-4567")
   
   **Address** (formatted automatically):
   - ✅ Street Address (e.g., "123 Business Street")
   - ✅ City (e.g., "New York")
   - ✅ State/Province (e.g., "NY")
   - ✅ Postal Code (e.g., "10001")
   - ✅ Country (e.g., "United States")
   
   **Additional**:
   - ✅ Website (e.g., "www.acme.com")

3. **Upload Your Logo**:
   
   **Logo Guidelines**:
   - Recommended size: **200 x 80 pixels**
   - Max file size: **2MB**
   - Formats: PNG, JPG, SVG, WebP
   - Transparent background (PNG) recommended
   - Landscape orientation works best
   
   **Upload Steps**:
   - Click "Upload Logo" button
   - Select your logo file
   - Preview appears instantly
   - Adjust if needed (click "Change Logo")

4. **Save Changes**:
   - Scroll to bottom
   - Click "Save Changes" button
   - Wait for success message

---

## Step 3: Test Your Branding

### **Generate a Test PDF**:

1. **Create a Test Quotation or Invoice**:
   - Go to Quotations or Invoices page
   - Create a new item (or use existing one)
   - Fill in required details
   - Save

2. **Download PDF**:
   - Click the 3-dot menu on any quotation/invoice
   - Select "Download PDF"
   - Wait for "PDF downloaded successfully" message

3. **Open & Verify**:
   - Open the downloaded PDF
   - Check header for:
     ✅ Your company name
     ✅ Your logo (top-right)
     ✅ Email, phone, address
     ✅ Website

---

## What You'll See

### **PDF Header Example**:

```
┌─────────────────────────────────────────────────────────────┐
│  Acme Corporation                          [YOUR LOGO]      │
│  Email: info@acme.com                                       │
│  Phone: +1 (555) 123-4567                                   │
│  123 Business Street                                        │
│  New York, NY                                               │
│  10001, United States                                       │
│  Web: www.acme.com                                          │
├═════════════════════════════════════════════════════════════┤
│                                                             │
│  QUOTATION / INVOICE                                        │
│  ...rest of document...                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Common Issues

### **Issue 1: Logo Not Showing**

**Solution**:
1. Verify storage bucket exists:
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'company-logos';
   ```
2. Re-run `CREATE-COMPANY-LOGOS-BUCKET.sql` if empty
3. Re-upload logo in Settings
4. Save settings

---

### **Issue 2: Company Info Missing**

**Solution**:
1. Verify fields exist:
   ```sql
   SELECT company_email, company_phone, company_address 
   FROM organizations 
   LIMIT 1;
   ```
2. Re-run `ADD-COMPANY-PROFILE-FIELDS.sql` if error
3. Re-save company profile in Settings

---

### **Issue 3: PDF Shows "Your Company"**

**Cause**: Company name not set

**Solution**:
1. Go to Settings → Organization
2. Fill in "Company Name" field
3. Save changes
4. Re-download PDF

---

## Verification Checklist

Before considering setup complete:

- [ ] Both SQL scripts run successfully in Supabase
- [ ] Company profile fields visible in Settings → Organization
- [ ] Company name saved in Settings
- [ ] Logo uploaded and preview showing
- [ ] All changes saved (success message shown)
- [ ] Test PDF downloaded
- [ ] Test PDF shows company name in header
- [ ] Test PDF shows logo (if uploaded)
- [ ] Test PDF shows contact details

---

## Support

### **Need Help?**

1. **Check Database**:
   ```sql
   -- Verify company profile columns
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'organizations' 
     AND column_name LIKE 'company_%';
   
   -- Should return 9 rows
   ```

2. **Check Storage Bucket**:
   ```sql
   -- Verify bucket exists
   SELECT * FROM storage.buckets WHERE id = 'company-logos';
   
   -- Should return 1 row with public = true
   ```

3. **Check Current Data**:
   ```sql
   -- View your organization's data
   SELECT name, company_email, company_phone, company_logo_url
   FROM organizations
   WHERE id = 'your-org-id';
   ```

---

## Files Reference

| File | Purpose | When to Run |
|------|---------|-------------|
| `ADD-COMPANY-PROFILE-FIELDS.sql` | Creates DB columns | Once (initial setup) |
| `CREATE-COMPANY-LOGOS-BUCKET.sql` | Creates storage | Once (initial setup) |
| Settings → Organization | Enter company data | Update anytime |

---

## Next Steps

After setup complete:
1. ✅ Add your company profile to Settings
2. ✅ Upload your logo
3. ✅ Test with a quotation/invoice
4. ✅ Share professional PDFs with clients!

**Your documents are now professionally branded! 🎉**

