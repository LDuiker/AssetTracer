# Environment Variables Setup for DPO Integration

## Required Environment Variables

Add these variables to your `.env.local` file:

```bash
# DPO Payment Gateway Configuration
DPO_COMPANY_TOKEN=your-dpo-company-token-here
DPO_SERVICE_TYPE=3854
DPO_TEST_MODE=true
DPO_WEBHOOK_SECRET=your-webhook-secret-here
```

## Variable Descriptions

### DPO_COMPANY_TOKEN
- **Required**: Yes
- **Description**: Your unique company token from DPO
- **How to get**: Log in to your DPO dashboard and navigate to Settings > API Configuration
- **Example**: `9F416C11-127B-4DE2-AC7A-0A0C06C3XXXX`

### DPO_SERVICE_TYPE
- **Required**: No (defaults to 3854)
- **Description**: Service type code for your payment service
- **Default**: `3854` (standard payment service)
- **Other values**: Contact DPO support for custom service types

### DPO_TEST_MODE
- **Required**: No (defaults to false)
- **Description**: Enable test mode for development
- **Values**: 
  - `true` - Use test environment (no real charges)
  - `false` - Use production environment (real charges)
- **Recommendation**: Set to `true` during development

### DPO_WEBHOOK_SECRET
- **Required**: For webhook verification
- **Description**: Secret key for verifying webhook signatures
- **How to generate**: Use a strong random string (e.g., from `openssl rand -hex 32`)
- **Example**: `a7b3c9d2e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5`
- **Configuration**: Add this secret to your DPO webhook settings

## Complete Example

Here's a complete example of your `.env.local` file:

```bash
# Supabase Configuration (existing)
NEXT_PUBLIC_SUPABASE_URL=https://ougntjrrskfsuognjmcw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration (existing)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# DPO Payment Gateway (NEW)
DPO_COMPANY_TOKEN=9F416C11-127B-4DE2-AC7A-0A0C06C3XXXX
DPO_SERVICE_TYPE=3854
DPO_TEST_MODE=true
DPO_WEBHOOK_SECRET=a7b3c9d2e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5
```

## Getting Your DPO Credentials

### Step 1: Sign Up
1. Visit [DPO Group website](https://www.dpogroup.com/)
2. Click "Get Started" or "Sign Up"
3. Complete the registration form
4. Verify your email address

### Step 2: Complete KYC
1. Log in to your DPO dashboard
2. Navigate to Account Settings
3. Upload required documents:
   - Business registration
   - Tax documents
   - ID verification
4. Wait for approval (usually 1-3 business days)

### Step 3: Get Company Token
1. Log in to DPO dashboard
2. Go to Settings > API Configuration
3. Copy your **Company Token**
4. Paste it into your `.env.local` as `DPO_COMPANY_TOKEN`

### Step 4: Configure Webhooks
1. In DPO dashboard, go to Settings > Webhooks
2. Add your webhook URL:
   - Development: Use ngrok or similar tool
   - Production: `https://yourdomain.com/api/webhooks/dpo`
3. Generate a webhook secret
4. Save the secret as `DPO_WEBHOOK_SECRET`

### Step 5: Test Mode
1. For development, keep `DPO_TEST_MODE=true`
2. Use test card numbers provided by DPO
3. Switch to `DPO_TEST_MODE=false` when going live

## Generating Webhook Secret

Use any of these methods to generate a secure webhook secret:

### Method 1: OpenSSL (Recommended)
```bash
openssl rand -hex 32
```

### Method 2: Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Method 3: Online Generator
Visit [RandomKeygen.com](https://randomkeygen.com/) and use the "Fort Knox Passwords"

## Security Notes

⚠️ **Important Security Guidelines**:

1. **Never commit** `.env.local` to version control
2. **Add** `.env.local` to your `.gitignore` file
3. **Never expose** these values in client-side code
4. **Rotate** your webhook secret periodically
5. **Use different** tokens for development and production
6. **Keep** your company token secret and secure
7. **Monitor** your DPO dashboard for suspicious activity

## Troubleshooting

### Error: "DPO_COMPANY_TOKEN is not configured"
**Solution**: Add `DPO_COMPANY_TOKEN` to your `.env.local` file and restart your dev server.

### Error: "Invalid company token (904)"
**Solution**: 
1. Check that you copied the full token from DPO dashboard
2. Ensure there are no extra spaces or line breaks
3. Verify you're using the correct token for test/production mode

### Webhooks not working
**Solution**:
1. Check that `DPO_WEBHOOK_SECRET` is set
2. Verify webhook URL is configured in DPO dashboard
3. Ensure your server is accessible from the internet
4. Check webhook logs in DPO dashboard

### Test mode not working
**Solution**:
1. Ensure `DPO_TEST_MODE=true` (not `TRUE` or `True`)
2. Restart your dev server after changing env variables
3. Clear browser cache and cookies

## Environment-Specific Configuration

### Development
```bash
DPO_COMPANY_TOKEN=test-token-from-dpo
DPO_SERVICE_TYPE=3854
DPO_TEST_MODE=true
DPO_WEBHOOK_SECRET=dev-webhook-secret-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Staging
```bash
DPO_COMPANY_TOKEN=staging-token-from-dpo
DPO_SERVICE_TYPE=3854
DPO_TEST_MODE=true
DPO_WEBHOOK_SECRET=staging-webhook-secret-here
NEXT_PUBLIC_APP_URL=https://staging.yourapp.com
```

### Production
```bash
DPO_COMPANY_TOKEN=production-token-from-dpo
DPO_SERVICE_TYPE=3854
DPO_TEST_MODE=false
DPO_WEBHOOK_SECRET=production-webhook-secret-here
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

## Deployment Platforms

### Vercel
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable:
   - Name: `DPO_COMPANY_TOKEN`
   - Value: your token
   - Environment: Select appropriate (Production, Preview, Development)
4. Repeat for all DPO variables
5. Redeploy your application

### Netlify
1. Go to Site settings > Build & deploy > Environment
2. Click "Edit variables"
3. Add each DPO variable
4. Save and redeploy

### Railway/Render
1. Navigate to Environment tab
2. Add each variable as a new environment variable
3. Restart your service

## Verification

After setup, verify your configuration:

1. Start your dev server: `npm run dev`
2. Check server logs for DPO configuration errors
3. Try creating a test payment token
4. Verify test mode is active in DPO dashboard

```typescript
// Test in API route or server action
import { getDPOConfig } from '@/lib/payments/dpo';

try {
  const config = getDPOConfig();
  console.log('DPO configured successfully:', {
    testMode: config.testMode,
    serviceType: config.serviceType,
  });
} catch (error) {
  console.error('DPO configuration error:', error);
}
```

## Support

If you need help:
- **DPO Support**: support@dpogroup.com
- **DPO Documentation**: https://docs.dpogroup.com/
- **DPO Dashboard**: https://secure.3gdirectpay.com/

---

**Last Updated**: October 4, 2025

