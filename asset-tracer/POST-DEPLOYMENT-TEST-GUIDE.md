# 🧪 Post-Deployment Testing Guide - Production

**Environment:** Production (`https://www.asset-tracer.com`)  
**Date:** 2025-11-21  
**Deployment:** `29c997c`

---

## ✅ **Step 7.1: Smoke Tests**

### Test 1: Homepage Loads
- [ ] Navigate to `https://www.asset-tracer.com`
- [ ] Verify page loads without errors
- [ ] Check browser console (F12) for any JavaScript errors
- [ ] Verify page content displays correctly

**Expected:** Homepage loads successfully, no console errors

---

### Test 2: Login Page Accessible
- [ ] Navigate to `https://www.asset-tracer.com/login`
- [ ] Verify login page loads
- [ ] Verify "Sign in with Google" button is visible
- [ ] Check for any errors in console

**Expected:** Login page accessible, OAuth button visible

---

### Test 3: OAuth Flow Works
- [ ] Click "Sign in with Google"
- [ ] Complete Google authentication
- [ ] Verify redirect to dashboard
- [ ] Verify no errors during flow

**Expected:** OAuth flow completes successfully, redirects to dashboard

**Status:** ✅ Already verified in Step 4.5

---

### Test 4: Dashboard Loads After Login
- [ ] After OAuth, verify dashboard loads
- [ ] Check for any loading errors
- [ ] Verify user data displays (name, organization)
- [ ] Check browser console for errors

**Expected:** Dashboard loads with user data

---

### Test 5: Create an Asset
- [ ] Navigate to Assets page
- [ ] Click "Add Asset" or "New Asset"
- [ ] Fill in required fields:
  - Name: `Test Asset Production`
  - Category: `Test`
  - Purchase Cost: `1000`
  - Current Value: `800`
  - Status: `Active`
- [ ] Save the asset
- [ ] Verify asset appears in the list
- [ ] Verify asset details are correct

**Expected:** Asset created successfully, appears in list

---

### Test 6: Create a Client
- [ ] Navigate to Clients page
- [ ] Click "Add Client" or "New Client"
- [ ] Fill in required fields:
  - Name: `Test Client Production`
  - Email: `test@example.com`
- [ ] Save the client
- [ ] Verify client appears in the list
- [ ] Verify client details are correct

**Expected:** Client created successfully, appears in list

---

### Test 7: Create an Invoice
- [ ] Navigate to Invoices page
- [ ] Click "New Invoice"
- [ ] Fill in required fields:
  - Client: Select the test client created above
  - Issue Date: Today's date
  - Due Date: Future date
  - Add at least one line item:
    - Description: `Test Item`
    - Quantity: `1`
    - Unit Price: `100`
- [ ] Save the invoice
- [ ] Verify invoice appears in the list
- [ ] Verify invoice number is generated (format: `INV-YYYYMM-####`)
- [ ] Verify totals are calculated correctly

**Expected:** Invoice created successfully, invoice number generated, totals correct

---

### Test 8: Create a Quotation
- [ ] Navigate to Quotations page
- [ ] Click "New Quotation"
- [ ] Fill in required fields:
  - Client: Select the test client created above
  - Issue Date: Today's date
  - Valid Until: Future date
  - Add at least one line item:
    - Description: `Test Quote Item`
    - Quantity: `1`
    - Unit Price: `150`
- [ ] Save the quotation
- [ ] Verify quotation appears in the list
- [ ] Verify quotation number is generated (format: `QUO-YYYY-####`)
- [ ] Verify totals are calculated correctly

**Expected:** Quotation created successfully, quotation number generated, totals correct

---

## ✅ **Step 7.2: Security Tests**

### Test 9: Security Headers Present

**Method 1: Browser DevTools**
1. Open `https://www.asset-tracer.com` in browser
2. Press F12 → Network tab
3. Reload the page
4. Click on the main document request
5. Check Response Headers for:
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Content-Security-Policy` (present)

**Method 2: Online Tool**
1. Go to https://securityheaders.com
2. Enter `https://www.asset-tracer.com`
3. Check security score (should be A or B)

**Expected:** All security headers present

**Status:** ✅ Already verified in Step 4.1

---

### Test 10: XSS Sanitization Works

**Test in Asset Name:**
1. Navigate to Assets page
2. Create a new asset with name: `<script>alert('XSS')</script>Test Asset`
3. Save the asset
4. Verify the asset name shows as plain text (no script tags)
5. Verify no alert popup appears

**Test in Invoice Notes:**
1. Navigate to Invoices page
2. Create/edit an invoice
3. Add notes: `<img src=x onerror=alert('XSS')>Test Notes`
4. Save the invoice
5. View the invoice
6. Verify notes show as plain text (no image tag)
7. Verify no alert popup appears

**Expected:** XSS payloads are sanitized, no scripts execute

**Status:** ✅ Already verified in Step 4.2

---

### Test 11: Error Messages are Generic

1. Navigate to `https://www.asset-tracer.com/api/assets/invalid-id-12345`
2. Check the response
3. Verify error message is generic: `"Internal server error. Please try again later."`
4. Verify no stack traces in response
5. Verify no file paths exposed

**Expected:** Generic error messages, no sensitive details

**Status:** ✅ Already verified in Step 4.3

---

### Test 12: Rate Limiting Works

1. Open browser DevTools → Network tab
2. Make multiple rapid requests to an API endpoint (e.g., `/api/assets`)
3. Check response headers for:
   - `X-RateLimit-Limit`
   - `X-RateLimit-Remaining`
   - `X-RateLimit-Reset`
4. Verify headers are present

**Expected:** Rate limit headers present on responses

**Status:** ✅ Already verified in Step 4.4

---

## ✅ **Step 7.3: Performance Check**

### Test 13: Page Load Times

1. Open browser DevTools → Network tab
2. Navigate to `https://www.asset-tracer.com`
3. Check load time (should be < 3 seconds)
4. Check Time to First Byte (TTFB) (should be < 1 second)
5. Navigate to dashboard after login
6. Check dashboard load time (should be < 2 seconds)

**Expected:** Fast page load times

---

### Test 14: No Console Errors

1. Open browser DevTools → Console tab
2. Navigate through the site:
   - Homepage
   - Login page
   - Dashboard
   - Assets page
   - Invoices page
3. Check for any red error messages
4. Note any warnings (yellow messages are usually OK)

**Expected:** No critical errors in console

---

### Test 15: No Network Errors

1. Open browser DevTools → Network tab
2. Navigate through the site
3. Check for any failed requests (red status codes)
4. Verify all API calls return 200 or expected status codes
5. Check for any CORS errors

**Expected:** No failed network requests

---

## 📋 **Test Results Summary**

**Test Date:** _______________

**Tester:** _______________

| Test | Status | Notes |
|------|--------|-------|
| 1. Homepage Loads | ⏳ | |
| 2. Login Page | ⏳ | |
| 3. OAuth Flow | ✅ | Already verified |
| 4. Dashboard Loads | ⏳ | |
| 5. Create Asset | ⏳ | |
| 6. Create Client | ⏳ | |
| 7. Create Invoice | ⏳ | |
| 8. Create Quotation | ⏳ | |
| 9. Security Headers | ✅ | Already verified |
| 10. XSS Sanitization | ✅ | Already verified |
| 11. Error Messages | ✅ | Already verified |
| 12. Rate Limiting | ✅ | Already verified |
| 13. Page Load Times | ⏳ | |
| 14. No Console Errors | ⏳ | |
| 15. No Network Errors | ⏳ | |

**Overall Status:** ⏳ Pending

**Issues Found:** _______________

---

## 🎯 **Quick Test Checklist**

If you want to do a quick verification, test these critical paths:

1. ✅ **OAuth Login** - Already verified
2. ⏳ **Create Asset** - Test core functionality
3. ⏳ **Create Invoice** - Test invoice numbering
4. ⏳ **Create Quotation** - Test quotation numbering
5. ✅ **Security Headers** - Already verified

---

**Last Updated:** 2025-11-21

