# Currency Hardcode Fix - Complete

## Problem
Currency symbols and values were hardcoded to "$" and "USD" throughout the application, ignoring the global currency setting configured in Settings → Organization.

## Solution
Updated all components and API routes to use the organization's `default_currency` setting instead of hardcoded values.

## Files Fixed

### 1. Asset Components

#### `components/assets/AssetListPanel.tsx`
**Before:**
```typescript
Value: {formatCurrencyAmount(asset.current_value, 'USD')}
```

**After:**
```typescript
const { formatCurrency } = useCurrency();
// ...
Value: {formatCurrency(asset.current_value)}
```

#### `components/assets/AssetForm.tsx`
**Before:**
```tsx
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
  $
</span>
```

**After:**
```tsx
const { getCurrencySymbol } = useCurrency();
const currencySymbol = getCurrencySymbol();
// ...
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
  {currencySymbol}
</span>
```

**Impact:** Purchase Cost and Current Value fields now show correct currency symbol (P for BWP, $ for USD, etc.)

### 2. API Routes

#### `app/api/reports/financials/route.ts`
**Before:**
```typescript
currency: 'USD', // Default, could be made dynamic
```

**After:**
```typescript
// Get organization settings for currency
const { data: orgData } = await supabase
  .from('organizations')
  .select('default_currency')
  .eq('id', userData.organization_id)
  .single();

const organizationCurrency = orgData?.default_currency || 'USD';
// ...
currency: organizationCurrency,
```

**Impact:** Dashboard financial summary now uses organization's currency

#### `app/api/expenses/route.ts`
**Before:**
```typescript
currency: z.string().default('USD'), // In schema
// No currency assignment before creating expense
```

**After:**
```typescript
// Get organization's default currency
const { data: orgData } = await supabase
  .from('organizations')
  .select('default_currency')
  .eq('id', userData.organization_id)
  .single();

const defaultCurrency = orgData?.default_currency || 'USD';

// Use organization's currency if not provided in request
if (!validatedData.currency) {
  validatedData.currency = defaultCurrency;
}
```

**Impact:** New expenses automatically use organization's currency

### 3. Previously Fixed (Already Working)

These were fixed in previous updates and are working correctly:

- ✅ Invoice forms - Use organization currency
- ✅ Quotation forms - Use organization currency  
- ✅ Invoice PDF - Uses invoice's currency setting
- ✅ Quotation PDF - Uses quotation's currency setting
- ✅ Dashboard charts - Use currency context
- ✅ Settings page - Currency selector works

## How It Works Now

### Currency Flow

```
1. User sets currency in Settings → Organization
   ↓
2. Saved to organizations.default_currency in database
   ↓
3. CurrencyContext fetches and provides globally
   ↓
4. All components use:
   - formatCurrency(amount) - formats with org currency
   - getCurrencySymbol() - gets symbol (P, $, €, etc.)
   ↓
5. Display shows correct currency everywhere!
```

### Supported Currencies

| Currency | Code | Symbol | Display |
|----------|------|--------|---------|
| **Botswana Pula** | BWP | P | BWP 1,234.56 |
| **US Dollar** | USD | $ | $1,234.56 |
| **Euro** | EUR | € | €1,234.56 |
| **British Pound** | GBP | £ | £1,234.56 |
| **South African Rand** | ZAR | R | R1,234.56 |

## Testing

### Test 1: Change Currency in Settings
1. Go to **Settings → Organization**
2. Change **Default Currency** (e.g., from USD to BWP)
3. Click **Save Changes**
4. ✅ Currency should update throughout the app

### Test 2: Verify Assets Page
1. Go to **Assets** page
2. Check asset list - values should show in your currency
3. Click on an asset to view details
4. ✅ Purchase cost, current value, revenue should all use your currency

### Test 3: Create New Asset
1. Click **Create Asset**
2. Check the input field prefixes
3. ✅ Should show your currency symbol (not $)

### Test 4: Check Dashboard
1. Go to **Dashboard**
2. Check all financial metrics
3. ✅ All values should use your currency

### Test 5: Invoices & Quotations
1. Create new invoice or quotation
2. Check line items and totals
3. ✅ Should use your organization's currency

## Where USD is Still Used (Acceptable)

### 1. Database Fallbacks
**Location:** `supabase/functions.sql`
```sql
COALESCE(currency, 'USD') as currency
```
**Reason:** Fallback for NULL values only
**Impact:** None - only used when currency field is missing

### 2. Landing Page Pricing
**Location:** `components/landing/PricingCard.tsx`
```tsx
<span className="text-4xl font-bold">${price}</span>
```
**Reason:** Public pricing is always in USD
**Impact:** None - this is marketing content

### 3. Initial Defaults
**Location:** Various API routes and contexts
```typescript
const defaultCurrency = orgData?.default_currency || 'USD';
```
**Reason:** Fallback when organization has no currency set
**Impact:** Only affects new organizations before they set currency

## Verification Queries

Run these in Supabase SQL Editor to verify your data:

```sql
-- Check organization currency
SELECT 
  id,
  name,
  default_currency,
  created_at
FROM organizations;

-- Check if transactions use consistent currency
SELECT 
  currency,
  type,
  COUNT(*) as count,
  SUM(amount) as total
FROM transactions
GROUP BY currency, type
ORDER BY currency, type;

-- Check if expenses use org currency
SELECT DISTINCT currency, COUNT(*)
FROM expenses
GROUP BY currency;

-- Check if invoices/quotations use org currency
SELECT DISTINCT currency, COUNT(*)
FROM invoices
GROUP BY currency;

SELECT DISTINCT currency, COUNT(*)
FROM quotations
GROUP BY currency;
```

## Summary of Changes

| Component/Route | Before | After | Status |
|----------------|--------|-------|--------|
| AssetListPanel | 'USD' hardcoded | Uses useCurrency() | ✅ Fixed |
| AssetForm | "$" hardcoded | Uses getCurrencySymbol() | ✅ Fixed |
| Reports API | 'USD' hardcoded | Fetches org currency | ✅ Fixed |
| Expenses API | 'USD' default | Uses org currency | ✅ Fixed |
| Invoice Forms | - | Already dynamic | ✅ Working |
| Quotation Forms | - | Already dynamic | ✅ Working |
| Dashboard | - | Uses context | ✅ Working |

## Impact

**Before:**
- Set currency to BWP in settings
- Assets still showed "$" symbols
- Dashboard showed "USD" 
- Confusing for users in other countries

**After:**
- Set currency to BWP in settings
- Assets show "P" (BWP symbol)
- Dashboard shows "BWP 1,234.56"
- Consistent currency throughout app ✅

## Next Steps

### For Current Users:
1. ✅ No migration needed - changes are live
2. ✅ Currency context updates automatically
3. ✅ All components respect organization currency

### For New Features:
When adding new financial features, always:
1. Use `useCurrency()` hook for formatting
2. Use `formatCurrency(amount)` - never hardcode symbols
3. Use `getCurrencySymbol()` for input field prefixes
4. Fetch organization's `default_currency` in API routes
5. Never hardcode 'USD', '$', or other currency strings

### Example Template:
```typescript
// In component
import { useCurrency } from '@/lib/context/CurrencyContext';

export function MyComponent() {
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  const symbol = getCurrencySymbol();
  
  return (
    <div>
      <span>{symbol}</span>
      <input placeholder="0.00" />
      <p>{formatCurrency(1234.56)}</p>
    </div>
  );
}

// In API route
const { data: orgData } = await supabase
  .from('organizations')
  .select('default_currency')
  .eq('id', organizationId)
  .single();

const currency = orgData?.default_currency || 'USD';
```

## Conclusion

All hardcoded currency references have been removed from user-facing components and API routes. The application now fully respects the global currency setting configured in Settings → Organization.

**Status:** ✅ Complete - No more hardcoded currencies!

