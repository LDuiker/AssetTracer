# Logo and Favicon Setup Guide

## Required Files

Create these image files and place them in the specified locations:

### 1. Favicon Files
Place these in the `asset-tracer/app/` directory:

```
asset-tracer/app/
├── favicon.ico          (32x32 or 16x16)
├── apple-icon.png       (180x180) - For iOS home screen
├── icon.png             (512x512) - General purpose icon
└── og-image.png         (1200x630) - For social media sharing
```

### 2. Logo Files
Place these in `asset-tracer/public/` directory:

```
asset-tracer/public/
├── logo.svg             (Vector logo - best)
├── logo-light.svg       (For dark backgrounds)
├── logo-dark.svg        (For light backgrounds)
└── logo.png             (Fallback PNG, 200x50 recommended)
```

---

## Quick Setup Instructions

### Option 1: Use a Logo Generator

**Recommended Tools:**
- [Canva](https://www.canva.com) - Free logo maker
- [LogoMakr](https://logomakr.com) - Simple online tool
- [Figma](https://figma.com) - Professional design tool

**Export Requirements:**
- Logo: SVG or PNG (transparent background)
- Favicon: 32x32 or 16x16 ICO file
- Apple Icon: 180x180 PNG
- OG Image: 1200x630 PNG/JPG

### Option 2: Convert Your Existing Logo

If you have a logo already:

**Online Converters:**
- [RealFaviconGenerator](https://realfavicongenerator.net) - Generates all sizes
- [Favicon.io](https://favicon.io) - ICO converter
- [CloudConvert](https://cloudconvert.com) - Format converter

---

## Implementation Steps

### Step 1: Add Favicon Files

1. Create your favicon (32x32 ICO file)
2. Place it in `asset-tracer/app/favicon.ico`
3. Next.js will automatically detect it!

### Step 2: Add Logo Files

1. Export your logo as SVG or PNG
2. Place in `asset-tracer/public/logo.svg` (or `logo.png`)
3. The logo will be accessible at `/logo.svg`

### Step 3: Update Metadata (Done automatically)

The `layout.tsx` has been updated to include all icon metadata.

### Step 4: Logo Component (Created for you)

A reusable `Logo` component has been created at:
`asset-tracer/components/common/Logo.tsx`

---

## File Specifications

### Favicon (.ico)
- **Size:** 16x16, 32x32, or 48x48 pixels
- **Format:** ICO (or PNG named `favicon.ico`)
- **Background:** Can be transparent or colored
- **Colors:** Keep it simple (2-3 colors max)

### Apple Touch Icon
- **Size:** 180x180 pixels
- **Format:** PNG
- **Background:** Solid color (no transparency)
- **Padding:** 20px around logo for iOS

### Open Graph Image
- **Size:** 1200x630 pixels
- **Format:** PNG or JPG
- **Text:** Should be readable at small sizes
- **Purpose:** Shows when sharing on social media

### Logo SVG/PNG
- **Width:** 150-200px (will scale)
- **Height:** 40-60px
- **Format:** SVG (preferred) or PNG
- **Background:** Transparent
- **Variants:** Light and dark versions

---

## Quick Start (No Design Skills Needed)

### 1. Text-Based Logo
If you just want a simple text logo:

```
Asset Tracer
```

**Font Suggestions:**
- Geist (already in your app)
- Inter
- Poppins
- Montserrat

### 2. Icon + Text Logo
Combine the Package icon with text:

**Current setup:** ✅ Already using this!
- Icon: Package (from Lucide)
- Text: "Asset Tracer"
- Colors: Blue (#2563EB) and Dark (#0B1226)

### 3. Custom Logo
Use Canva's free logo maker:

1. Go to [Canva.com](https://canva.com)
2. Search "Logo" templates
3. Customize with "Asset Tracer" text
4. Use colors: Blue (#2563EB) and Dark (#0B1226)
5. Download as PNG (transparent) and SVG

---

## Color Palette (For Consistency)

Your current brand colors:

```css
Primary Blue: #2563EB
Dark Navy: #0B1226
Light Gray: #F9FAFB
White: #FFFFFF
Orange Accent: #F97316
```

Use these in your logo for brand consistency!

---

## Testing Your Logo & Favicon

### After Adding Files:

1. **Restart the dev server:**
   ```bash
   Ctrl+C
   npm run dev -- -p 3000
   ```

2. **Check favicon in browser:**
   - Look at browser tab
   - Should see your icon next to "Asset Tracer"

3. **Check logo on pages:**
   - Visit http://localhost:3000
   - Logo should appear in navigation
   - Check on dashboard pages too

4. **Test mobile appearance:**
   - Open browser dev tools (F12)
   - Toggle device toolbar
   - View on mobile sizes

---

## Quick Favicon from Text

If you want a quick favicon without design software:

**Use Favicon.io:**
1. Go to [https://favicon.io/favicon-generator/](https://favicon.io/favicon-generator/)
2. Enter "AT" (for Asset Tracer)
3. Choose colors:
   - Background: #2563EB (blue)
   - Text: #FFFFFF (white)
4. Download the generated files
5. Place `favicon.ico` in `asset-tracer/app/`

---

## Where Logos Are Used

After setup, your logo will appear in:

1. **Landing Page** (`/`)
   - Header/Navigation
   - Footer

2. **Dashboard Pages** (`/dashboard/*`)
   - Sidebar (if you add one later)
   - Mobile header

3. **Browser Tab**
   - Favicon

4. **Mobile Home Screen**
   - Apple Touch Icon

5. **Social Sharing**
   - Open Graph image

---

## Need Help?

### Free Resources:
- [Canva Logo Maker](https://canva.com) - Easiest option
- [Figma](https://figma.com) - More control
- [RealFaviconGenerator](https://realfavicongenerator.net) - All favicon sizes

### Logo Design Tips:
1. Keep it simple
2. Use 2-3 colors max
3. Make it recognizable at small sizes
4. Test on light and dark backgrounds
5. Ensure it works in black & white

---

## Next Steps

1. ✅ Create your logo (SVG or PNG)
2. ✅ Generate favicon (32x32 ICO)
3. ✅ Place files in correct folders
4. ✅ Restart dev server
5. ✅ Check appearance on all pages
6. ✅ Test on mobile devices

Your logo and favicon will be live! 🎨

