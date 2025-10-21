# Asset Date Field Fix - Empty String to Null

## Problem
When creating or updating assets, if the `purchase_date` field was left empty in the form, it was being sent as an empty string `""` instead of `null`. PostgreSQL rejected this with the error:

```
invalid input syntax for type date: ""
```

Error code: `22007` (invalid datetime format)

## Root Cause
The form was sending:
- **Expected:** `purchase_date: null` or `purchase_date: "2024-01-15"`
- **Actual:** `purchase_date: ""` (empty string)

PostgreSQL DATE fields accept either:
- A valid date string (e.g., "2024-01-15")
- NULL
- But NOT an empty string ""

## Solution
Added data transformation in both API routes to convert empty strings to `null` before sending to the database.

### Files Changed

**1. `app/api/assets/route.ts` (POST - Create Asset)**
```typescript
const assetData = validationResult.data as CreateAssetInput;

// Transform empty strings to null for date fields
if (assetData.purchase_date === '') {
  assetData.purchase_date = null;
}
```

**2. `app/api/assets/[id]/route.ts` (PATCH - Update Asset)**
```typescript
const updateData = validationResult.data as UpdateAssetInput;

// Transform empty strings to null for date fields
if (updateData.purchase_date === '') {
  updateData.purchase_date = null;
}
```

## How It Works Now

### Before (Broken):
```
Form input: purchase_date = ""
   ↓
Sent to API: { purchase_date: "" }
   ↓
PostgreSQL: ❌ ERROR: invalid input syntax for type date: ""
```

### After (Fixed):
```
Form input: purchase_date = ""
   ↓
Transform in API: purchase_date = null
   ↓
Sent to DB: { purchase_date: null }
   ↓
PostgreSQL: ✅ Saved successfully with NULL value
```

## Testing

### Test Case 1: Create Asset WITHOUT Purchase Date
1. Go to Assets page
2. Click "Add Asset"
3. Fill in required fields (Name, Status, etc.)
4. **Leave Purchase Date EMPTY**
5. Click Save
6. ✅ Should save successfully

### Test Case 2: Create Asset WITH Purchase Date
1. Go to Assets page
2. Click "Add Asset"
3. Fill in all fields including Purchase Date
4. Click Save
5. ✅ Should save successfully with the date

### Test Case 3: Update Asset - Remove Purchase Date
1. Edit an existing asset that has a purchase date
2. Clear the purchase date field
3. Click Save
4. ✅ Should update successfully, setting purchase_date to NULL

## Alternative Solutions Considered

### Option 1: Fix at Form Level
**Pros:** Prevents empty strings from being sent at all
**Cons:** Would need to update multiple forms across the app
**Verdict:** Rejected - API should be defensive

### Option 2: Update Zod Schema
```typescript
purchase_date: z.string().min(1).optional().nullable()
```
**Pros:** Rejects empty strings during validation
**Cons:** Would reject the request before transformation
**Verdict:** Rejected - Transformation approach is more user-friendly

### Option 3: Database Constraint
**Pros:** Enforces at database level
**Cons:** Doesn't solve the user experience issue
**Verdict:** Rejected - Need to handle at API level

### Option 4: Current Solution (Transform at API)
**Pros:** 
- Handles the issue cleanly
- User-friendly (doesn't reject the request)
- Works for both create and update
- Defensive programming
**Cons:** None significant
**Verdict:** ✅ Implemented

## Future Improvements

### If More Date Fields Are Added:
If you add more date fields to assets in the future (e.g., `warranty_expiration`, `maintenance_date`), you'll need to add similar transformations:

```typescript
// Generic approach for multiple date fields
const dateFields = ['purchase_date', 'warranty_expiration', 'maintenance_date'];
dateFields.forEach(field => {
  if (assetData[field] === '') {
    assetData[field] = null;
  }
});
```

### Create a Utility Function:
```typescript
// lib/utils/transformDates.ts
export function transformEmptyDatesToNull<T extends Record<string, any>>(
  data: T,
  dateFields: (keyof T)[]
): T {
  const transformed = { ...data };
  dateFields.forEach(field => {
    if (transformed[field] === '') {
      transformed[field] = null as any;
    }
  });
  return transformed;
}

// Usage
const assetData = transformEmptyDatesToNull(
  validationResult.data,
  ['purchase_date']
);
```

## Summary

- ✅ Fixed asset creation with empty date fields
- ✅ Fixed asset updates that clear date fields
- ✅ No linter errors
- ✅ Ready to test

The fix is minimal, defensive, and handles the edge case gracefully without breaking existing functionality.

