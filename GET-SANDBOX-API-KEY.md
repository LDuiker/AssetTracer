# Get Polar Sandbox API Key

## 🔑 Step 1: Get Your Sandbox API Key

1. **Go to Polar Sandbox Dashboard:**
   - https://sandbox.polar.sh/settings
   - Login with your account

2. **Find the API Key:**
   - Look for "API Keys" or "Access Tokens" section
   - Copy the API key (it should start with `polar_oat_` or similar)

3. **Make sure it's for SANDBOX, not Production:**
   - Sandbox keys work with: `https://sandbox-api.polar.sh`
   - Production keys work with: `https://api.polar.sh`

---

## 🚀 Step 2: Run the Script

Once you have your sandbox API key, run:

```powershell
.\get-yearly-price-ids-sandbox.ps1 -PolarApiKey "your_sandbox_api_key_here" -ProProductId "6b702adf-253f-48b1-bd2b-66d5ed8e6fbe" -BusinessProductId "2fc222e8-0e50-4eb7-beb3-ca28c4010d52"
```

**Replace `your_sandbox_api_key_here` with your actual sandbox API key.**

---

## ⚠️ If You Don't Have a Sandbox API Key

If you don't have a sandbox account or API key:

1. **Create a Sandbox Account:**
   - Go to: https://sandbox.polar.sh
   - Sign up for a free sandbox account

2. **Or use Production API:**
   - If these products are in production, we'll need to use the production API instead
   - But for staging, sandbox is recommended

---

**Once you have the sandbox API key, let me know and I'll run the script to get the Price IDs!**

