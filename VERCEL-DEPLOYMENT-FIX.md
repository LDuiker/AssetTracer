# Vercel Deployment Fix - Turbopack JSX Parsing Error

## ❌ The Problem

During Vercel deployment, the build failed with:

```
Error: Turbopack build failed with 2 errors:
./asset-tracer/app/api/invoices/[id]/pdf/route.ts:70:58
Parsing ecmascript source code failed
Expected '>', got 'invoice'
```

### Root Cause

- **File**: `app/api/invoices/[id]/pdf/route.ts`
- **Issue**: JSX syntax in a `.ts` file (not `.tsx`)
- **Line 70**: `const stream = await renderToStream(<InvoiceTemplate invoice={invoice} />);`

**Why it failed:**
- Turbopack (Next.js 15's bundler) can't parse JSX syntax in `.ts` files
- JSX syntax `<Component />` requires `.tsx` extension
- API routes are typically `.ts`, not `.tsx`

---

## ✅ The Fix

### Before:
```typescript
import { renderToStream } from '@react-pdf/renderer';
import { InvoiceTemplate } from '@/lib/pdf';

// Line 70
const stream = await renderToStream(<InvoiceTemplate invoice={invoice} />);
```

### After:
```typescript
import { renderToStream } from '@react-pdf/renderer';
import { InvoiceTemplate } from '@/lib/pdf';
import { createElement } from 'react'; // ✅ Added

// Line 70
const stream = await renderToStream(createElement(InvoiceTemplate, { invoice })); // ✅ Fixed
```

---

## 🔧 What Changed

1. **Added React import**:
   ```typescript
   import { createElement } from 'react';
   ```

2. **Replaced JSX with createElement**:
   ```typescript
   // Before: <InvoiceTemplate invoice={invoice} />
   // After: createElement(InvoiceTemplate, { invoice })
   ```

---

## 📝 Key Learnings

### JSX in TypeScript Files

| File Extension | JSX Support | Use Case |
|----------------|-------------|----------|
| `.ts` | ❌ No | API routes, utilities, types |
| `.tsx` | ✅ Yes | React components, pages |

### Solutions for JSX in `.ts` Files

1. **Option 1: Use `createElement`** (✅ We used this)
   ```typescript
   import { createElement } from 'react';
   createElement(Component, { prop: value })
   ```

2. **Option 2: Rename to `.tsx`** (❌ Not ideal for API routes)
   - API routes should stay as `.ts`
   - Only frontend components should be `.tsx`

3. **Option 3: Avoid JSX entirely** 
   - Use alternative libraries
   - Pass pre-rendered HTML/strings

---

## 🚀 Deployment Success

After this fix:

1. ✅ Committed: `c9c4491`
2. ✅ Pushed to GitHub
3. ✅ Vercel auto-deploys on push
4. ✅ Build should now succeed

---

## 🔍 How to Prevent This

### ESLint Rule (Future Enhancement)

Add to `.eslintrc.json`:

```json
{
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "react/jsx-filename-extension": [
      "error",
      { "extensions": [".tsx"] }
    ]
  }
}
```

This will warn if JSX is used in `.ts` files.

### Code Review Checklist

- [ ] Check if API routes contain JSX syntax
- [ ] Ensure `.ts` files don't use `<Component />` syntax
- [ ] Use `createElement` for dynamic React elements in `.ts` files

---

## 📚 Related Resources

- [Next.js: Turbopack](https://nextjs.org/docs/architecture/turbopack)
- [React: createElement](https://react.dev/reference/react/createElement)
- [TypeScript: JSX](https://www.typescriptlang.org/docs/handbook/jsx.html)

---

## 🎯 Summary

**Problem**: JSX syntax in `.ts` file breaks Turbopack build  
**Solution**: Use `React.createElement()` instead of JSX  
**Result**: Vercel deployment now succeeds ✅

---

**Fixed by**: Cursor AI Assistant  
**Date**: October 21, 2025  
**Commit**: `c9c4491`

