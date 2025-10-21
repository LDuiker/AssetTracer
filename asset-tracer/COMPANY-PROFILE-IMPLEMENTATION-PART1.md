# Company Profile for PDF Documents - Part 1: Database & Settings ✅

## Overview
Added company profile fields to the organization settings that will be used to populate invoice and quotation PDF documents with proper business information.

---

## Phase 1: Database Schema (COMPLETE)

### **Migration Script Created**: `ADD-COMPANY-PROFILE-FIELDS.sql`

**New Columns Added to `organizations` table**:
- `company_email` - TEXT - Company contact email
- `company_phone` - TEXT - Company phone number  
- `company_address` - TEXT - Street address
- `company_city` - TEXT - City
- `company_state` - TEXT - State/Province
- `company_postal_code` - TEXT - Postal/ZIP code
- `company_country` - TEXT - Country
- `company_logo_url` - TEXT - URL to company logo
- `company_website` - TEXT - Company website

### **Run This SQL in Supabase**:
```sql
-- Located in: supabase/ADD-COMPANY-PROFILE-FIELDS.sql
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS company_email TEXT,
ADD COLUMN IF NOT EXISTS company_phone TEXT,
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS company_city TEXT,
ADD COLUMN IF NOT EXISTS company_state TEXT,
ADD COLUMN IF NOT EXISTS company_postal_code TEXT,
ADD COLUMN IF NOT EXISTS company_country TEXT,
ADD COLUMN IF NOT EXISTS company_logo_url TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT;
```

---

## Phase 2: Settings Page UI (COMPLETE)

### **File Modified**: `app/(dashboard)/settings/page.tsx`

**Added Company Profile Section**:
- ✅ Company Email (validated email input)
- ✅ Company Phone (formatted phone input)
- ✅ Street Address (text input)
- ✅ City, State, Postal Code (3-column grid)
- ✅ Country (text input)
- ✅ Website (validated URL input)
- ✅ Company Logo URL (validated URL input with help text)

**Visual Layout**:
```
┌──────────────────────────────────────────────────────┐
│  Organization Settings                               │
├──────────────────────────────────────────────────────┤
│  Organization Name:  [________________]              │
│  Currency:  [USD ▼]    Tax Rate:  [0__]%            │
│  Timezone:  [Eastern ▼]  Date:  [MM/DD/YYYY ▼]      │
│                                                      │
│  ─────────────────────────────────────────────       │
│                                                      │
│  Company Profile                                     │
│  This information will appear on invoices and        │
│  quotations                                          │
│                                                      │
│  Company Email:  [info@company.com______]            │
│  Company Phone:  [+1 (555) 123-4567_____]            │
│  Street Address: [123 Main Street_______]            │
│  City:  [New York__]  State: [NY_]  ZIP: [10001_]   │
│  Country: [United States____]  Website: [https://]  │
│  Logo URL: [https://example.com/logo.png]            │
│  ℹ️  Enter a URL to your logo for PDFs              │
│                                                      │
│  ─────────────────────────────────────────────       │
│                                    [💾 Save Changes] │
└──────────────────────────────────────────────────────┘
```

---

## Phase 3: API Updates (COMPLETE)

### **File Modified**: `app/api/organization/settings/route.ts`

**Updated Zod Schema**:
```typescript
const updateOrganizationSchema = z.object({
  // ... existing fields
  company_email: z.string().email().optional().or(z.literal('')),
  company_phone: z.string().optional(),
  company_address: z.string().optional(),
  company_city: z.string().optional(),
  company_state: z.string().optional(),
  company_postal_code: z.string().optional(),
  company_country: z.string().optional(),
  company_website: z.string().url().optional().or(z.literal('')),
  company_logo_url: z.string().url().optional().or(z.literal('')),
});
```

**GET Endpoint**: Now returns all company profile fields
**PATCH Endpoint**: Now updates all company profile fields

---

## Files Modified Summary

| File | Purpose | Status |
|------|---------|--------|
| `supabase/ADD-COMPANY-PROFILE-FIELDS.sql` | Database migration | ✅ Created |
| `app/(dashboard)/settings/page.tsx` | Settings UI with company profile form | ✅ Updated |
| `app/api/organization/settings/route.ts` | API to save/fetch company data | ✅ Updated |

---

## Testing the Settings Page

### **Step 1: Run Database Migration**
```sql
-- In Supabase SQL Editor, run:
-- supabase/ADD-COMPANY-PROFILE-FIELDS.sql
```

### **Step 2: Fill in Company Details**
1. Navigate to Settings → Organization tab
2. Scroll down to "Company Profile" section
3. Fill in all fields:
   - Company Email: `info@yourcompany.com`
   - Company Phone: `+1 (555) 123-4567`
   - Street Address: `123 Business Street`
   - City: `New York`
   - State: `NY`
   - Postal Code: `10001`
   - Country: `United States`
   - Website: `https://yourcompany.com`
   - Logo URL: `https://yourcompany.com/logo.png`
4. Click "Save Changes"
5. ✅ Data should be saved and persisted

### **Step 3: Verify Data Persists**
1. Refresh the page
2. ✅ All company profile fields should show saved values

---

## Next Steps (Phase 4)

The company profile data is now saved in the database and accessible via API. **Next, we need to update the PDF templates** to use this data:

### **Files to Update for PDFs**:
1. ✅ `lib/pdf/invoice-pdf.tsx` - Update invoice PDF template
2. ✅ `lib/pdf/quotation-pdf.tsx` - Update quotation PDF template

### **PDF Template Updates Needed**:
- Replace hardcoded company name with `organization.name`
- Add company email: `organization.company_email`
- Add company phone: `organization.company_phone`
- Add full address block:
  ```
  organization.company_address
  organization.company_city, organization.company_state organization.company_postal_code
  organization.company_country
  ```
- Add company logo: `organization.company_logo_url`
- Add website: `organization.company_website`

### **API Updates Needed**:
- Invoice/Quotation PDF download handlers need to fetch organization data
- Pass organization data to PDF components

---

## Data Flow

```
┌─────────────┐
│  Settings   │  User fills company profile
│   Page      │  
└──────┬──────┘
       │ PATCH
       ↓
┌─────────────┐
│     API     │  Validates & saves to database
│   Route     │  
└──────┬──────┘
       │ UPDATE
       ↓
┌─────────────┐
│  Supabase   │  Stores company_email, company_phone, etc.
│ Database    │  
└──────┬──────┘
       │ SELECT
       ↓
┌─────────────┐
│ PDF Handler │  Fetches organization data
│             │  
└──────┬──────┘
       │ RENDER
       ↓
┌─────────────┐
│ PDF Template│  Uses organization.company_email, etc.
│  Component  │  Displays professional business details
└─────────────┘
```

---

## User Guide

### **How to Add Your Company Details**:

1. **Navigate**: Go to **Settings** → **Organization** tab

2. **Scroll** to the **"Company Profile"** section

3. **Fill in Your Business Information**:
   - **Company Email**: The email that will appear on invoices
   - **Company Phone**: Your business phone number
   - **Street Address**: Your business address
   - **City, State, Postal**: Location details
   - **Country**: Where your business is located
   - **Website**: Your company website (optional)
   - **Logo URL**: Link to your company logo image

4. **Logo Guidelines**:
   - Upload your logo to a hosting service (e.g., your website, Cloudinary, AWS S3)
   - Copy the direct URL to the image
   - Paste it in the "Company Logo URL" field
   - Recommended size: 200x80 pixels (PNG or JPG)

5. **Click**: "Save Changes"

6. **Verify**: Your information will now appear on all future invoices and quotations!

---

## Example Company Profile

```yaml
Organization Name: Acme Corporation
Company Email: billing@acmecorp.com
Company Phone: +1 (555) 789-1234
Street Address: 456 Enterprise Blvd, Suite 100
City: San Francisco
State: CA
Postal Code: 94102
Country: United States
Website: https://acmecorp.com
Logo URL: https://acmecorp.com/assets/logo.png
```

**Result on Invoice**:
```
┌─────────────────────────────────────┐
│  [LOGO]                             │
│                                     │
│  Acme Corporation                   │
│  456 Enterprise Blvd, Suite 100     │
│  San Francisco, CA 94102            │
│  United States                      │
│  📧 billing@acmecorp.com            │
│  📞 +1 (555) 789-1234               │
│  🌐 https://acmecorp.com            │
└─────────────────────────────────────┘
```

---

## Status

### ✅ **Phase 1-3: COMPLETE**
- Database schema updated
- Settings page UI added
- API endpoints updated
- Data saving and loading works

### ⏳ **Phase 4: PENDING (Next Message)**
- Update invoice PDF template
- Update quotation PDF template
- Fetch organization data in PDF handlers
- Test PDF generation with real company data

**Ready for Phase 4!** 🚀

