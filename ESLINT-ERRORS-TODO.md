# ESLint Errors - To Fix in Development

## ⚠️ Current Status

**Production Build**: ✅ ESLint disabled (`ignoreDuringBuilds: true`)  
**Development**: ❌ 54+ ESLint errors  
**Action Required**: Fix errors below and re-enable ESLint

---

## 🚨 Critical Errors (Must Fix)

### 1. TypeScript `any` Type (54 instances)

**Rule**: `@typescript-eslint/no-explicit-any`

Using `any` defeats the purpose of TypeScript. Replace with proper types.

**Files affected:**
- `app/(dashboard)/assets/[id]/page.tsx` - 2 instances
- `app/(dashboard)/dashboard/page.tsx` - 3 instances
- `app/(dashboard)/invoices/page.tsx` - 1 instance
- `app/(dashboard)/quotations/page.tsx` - 2 instances
- `app/(dashboard)/settings/page.tsx` - 2 instances
- `app/accept-invite/page.tsx` - 1 instance
- `app/api/**/*.ts` - 30+ instances across API routes
- `lib/polar.ts` - 10 instances
- `lib/db/*.ts` - 6 instances
- `components/**/*.tsx` - 2 instances

**Fix pattern:**
```typescript
// ❌ BAD
catch (error: any) {
  console.error(error);
}

// ✅ GOOD
catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  }
}
```

---

### 2. Unescaped Quotes/Apostrophes (12 instances)

**Rule**: `react/no-unescaped-entities`

HTML entities must be escaped in JSX.

**Files affected:**
- `app/(dashboard)/invoices/[id]/payment-success/page.tsx`
- `app/(dashboard)/settings/page.tsx`
- `app/accept-invite/page.tsx`
- `app/checkout/page.tsx`
- `app/page.tsx` - 5 instances
- `components/settings/BillingSection.tsx` - 7 instances
- `components/settings/TeamSection.tsx`

**Fix pattern:**
```tsx
// ❌ BAD
<p>Don't use apostrophes directly</p>
<p>Or "quotes" like this</p>

// ✅ GOOD
<p>Don&apos;t use apostrophes directly</p>
<p>Or &quot;quotes&quot; like this</p>

// ✅ BETTER (use proper quotes)
<p>{"Don't use apostrophes directly"}</p>
<p>{'Or "quotes" like this'}</p>
```

---

### 3. HTML Link Instead of Next Link (1 instance)

**Rule**: `@next/next/no-html-link-for-pages`

Use Next.js `<Link />` for internal navigation.

**File**: `app/(dashboard)/layout.tsx:103`

**Fix:**
```tsx
// ❌ BAD
<a href="/assets/">Assets</a>

// ✅ GOOD
import Link from 'next/link';
<Link href="/assets/">Assets</Link>
```

---

### 4. Empty Interface (1 instance)

**Rule**: `@typescript-eslint/no-empty-object-type`

**File**: `components/ui/textarea.tsx:5`

**Fix:**
```typescript
// ❌ BAD
interface TextareaProps {}

// ✅ GOOD (use type)
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

// ✅ OR (if extending)
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  // Add custom props here if needed
}
```

---

### 5. Should Use `const` Instead of `let` (2 instances)

**Rule**: `prefer-const`

**Files:**
- `lib/db/invoices.ts:384`
- `lib/db/quotations.ts:280`

**Fix:**
```typescript
// ❌ BAD
let updateData: any = {
  // ...never reassigned
}

// ✅ GOOD
const updateData: any = {
  // ...
}
```

---

## ⚠️ Warnings (Should Fix)

### 1. Unused Variables (50+ instances)

**Rule**: `@typescript-eslint/no-unused-vars`

Remove or use these variables:

**Common patterns:**
```typescript
// ❌ BAD
import { useState, useEffect } from 'react'; // useState unused
const [data, error] = useApi(); // error unused
function handler(request: Request) {} // request unused

// ✅ GOOD
import { useEffect } from 'react'; // Only import what's used
const [data] = useApi(); // Omit unused destructured values
function handler(_request: Request) {} // Prefix with _ if intentionally unused
```

---

### 2. React Hooks Dependency Issues (10+ instances)

**Rule**: `react-hooks/exhaustive-deps`

**Files:**
- `app/(dashboard)/assets/page.tsx`
- `app/(dashboard)/clients/page.tsx`
- `app/(dashboard)/inventory/page.tsx`
- `app/(dashboard)/invoices/page.tsx`
- `app/(dashboard)/quotations/page.tsx`
- `app/(dashboard)/settings/page.tsx`

**Fix pattern:**
```typescript
// ⚠️ WARNING
const assets = data?.assets || [];
const filtered = useMemo(() => {
  return assets.filter(...);
}, [searchTerm]); // 'assets' should be in deps

// ✅ FIXED
const assets = useMemo(() => data?.assets || [], [data]);
const filtered = useMemo(() => {
  return assets.filter(...);
}, [assets, searchTerm]);
```

---

### 3. Missing Image `alt` Props (2 instances)

**Rule**: `jsx-a11y/alt-text`

**Files:**
- `lib/pdf/invoice-pdf.tsx:231`
- `lib/pdf/quotation-pdf.tsx:232`

**Fix:**
```tsx
// ❌ BAD
<Image src="/logo.png" />

// ✅ GOOD
<Image src="/logo.png" alt="Company Logo" />
```

---

### 4. Using `<img>` Instead of Next `<Image />` (2 instances)

**Rule**: `@next/next/no-img-element`

**Files:**
- `app/(dashboard)/assets/[id]/page.tsx:345`
- `app/(dashboard)/settings/page.tsx:950`

**Fix:**
```tsx
// ❌ BAD
<img src={url} />

// ✅ GOOD
import Image from 'next/image';
<Image src={url} alt="Description" width={500} height={300} />
```

---

## 📋 Action Plan

### Phase 1: Critical Fixes (Required for ESLint re-enable)
1. [ ] Fix all `@typescript-eslint/no-explicit-any` (54 instances)
2. [ ] Fix all `react/no-unescaped-entities` (12 instances)
3. [ ] Fix `no-html-link-for-pages` (1 instance)
4. [ ] Fix `no-empty-object-type` (1 instance)
5. [ ] Fix `prefer-const` (2 instances)

### Phase 2: Warnings (Improve code quality)
1. [ ] Remove unused variables (50+ instances)
2. [ ] Fix React hooks dependencies (10+ instances)
3. [ ] Add `alt` props to images (2 instances)
4. [ ] Replace `<img>` with `<Image />` (2 instances)

### Phase 3: Re-enable ESLint
1. [ ] Test locally: `npm run build`
2. [ ] Verify no errors
3. [ ] Remove `ignoreDuringBuilds: true` from `next.config.ts`
4. [ ] Remove `ignoreBuildErrors: true` from `next.config.ts`
5. [ ] Commit and deploy

---

## 🛠️ How to Fix Locally

### 1. See all ESLint errors:
```bash
cd asset-tracer
npm run lint
```

### 2. Auto-fix what's possible:
```bash
npm run lint -- --fix
```

### 3. Test build locally:
```bash
npm run build
```

---

## 📝 Files Summary

| Category | Count | Priority |
|----------|-------|----------|
| `any` type errors | 54 | 🔴 Critical |
| Unescaped entities | 12 | 🔴 Critical |
| Unused variables | 50+ | 🟡 Warning |
| React hooks deps | 10+ | 🟡 Warning |
| Other critical | 4 | 🔴 Critical |

**Total Errors**: 70 (Critical)  
**Total Warnings**: 60+

---

## 🎯 Quick Wins

Start with these easy fixes:

1. **Unescaped quotes** (12 instances) - Find & Replace:
   - `'` → `&apos;` or `{"`'`"}`
   - `"` → `&quot;` or `{'"`"}`'`

2. **Unused imports** - Remove or comment out

3. **`prefer-const`** (2 instances) - Change `let` to `const`

4. **Empty interface** (1 instance) - Use `type` instead

---

**Estimated Time**: 4-6 hours to fix all errors  
**Priority**: Medium (app works, but code quality issue)  
**Status**: Production deployment not blocked (ESLint disabled)

---

**Last Updated**: 2025-10-21  
**Next.js Config**: `next.config.ts` (ESLint disabled)  
**Re-enable When**: All critical errors fixed

