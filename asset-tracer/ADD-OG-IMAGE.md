# Add OG Image Instructions

## 📸 Step 1: Save Your Dashboard Screenshot

1. **Take a screenshot** of your dashboard (the one you showed me)
2. **Crop/Resize** the image to **1200x630 pixels** (standard OG image size)
3. **Save the file** as `og-image.jpg` or `og-image.png`
4. **Place it** in the `asset-tracer/public/` directory

### File Location:
```
asset-tracer/public/og-image.jpg
```

## 🎨 Image Requirements

- **Dimensions:** 1200x630 pixels (1.91:1 aspect ratio)
- **Format:** JPG or PNG
- **File size:** Under 1MB (recommended: 200-500KB)
- **Content:** Your dashboard screenshot showing the assets table

## ✅ Step 2: Verify

After adding the file, the OG image will be automatically used at:
- `/og-image.jpg` (or `/og-image.png` if you used PNG)

## 🔍 Testing

Once deployed, test the OG image:
1. Visit: `https://www.asset-tracer.com/og-image.jpg`
2. Test with Facebook Debugger: https://developers.facebook.com/tools/debug/
3. Test with Twitter Card Validator: https://cards-dev.twitter.com/validator

## 📝 Notes

- The code has been updated to reference `/og-image.jpg`
- All metadata (homepage, privacy, terms) will use this image
- The image will be used for social media sharing previews

