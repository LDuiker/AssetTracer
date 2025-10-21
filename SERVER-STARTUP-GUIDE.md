# Server Startup & Troubleshooting Guide

## ✅ **GOOD NEWS: Your Server IS Running!**

The "localhost refused to connect" error is now resolved. You're getting a Polar.sh checkout error, which means the server is running and accessible.

---

## 🎉 Current Status

✅ **Server Running**: Your Next.js development server is running successfully  
✅ **Port 3000**: The server is accessible at http://localhost:3000  
✅ **Database Connected**: Supabase is working properly  
✅ **Authentication Working**: You're logged in and can access the app  

⚠️ **Polar.sh Not Configured**: You need to add your Polar.sh API credentials

---

## 🔧 How to Start the Server (For Reference)

### **From PowerShell:**

```powershell
# Navigate to the correct directory (IMPORTANT!)
cd "C:\Users\Lighting Department\Documents\GitHub\AssetTracer\asset-tracer"

# Start the server on port 3000
npm run dev -- -p 3000

# Keep this terminal window open while working
```

### **Common Mistake:**
❌ **Wrong Directory**: `C:\Users\Lighting Department\Documents\GitHub\AssetTracer`  
✅ **Correct Directory**: `C:\Users\Lighting Department\Documents\GitHub\AssetTracer\asset-tracer`

**Notice**: You need to be in the `asset-tracer` subdirectory, not the parent directory!

---

## 🔑 Fixing the Polar.sh Checkout Error

The error "Failed to create checkout session" is happening because your Polar.sh API credentials are still placeholders.

### **Current Credentials** (in `.env.local`):
```bash
POLAR_API_KEY=your_polar_api_key_here          # ❌ Placeholder
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret_here  # ❌ Placeholder
NEXT_PUBLIC_POLAR_PUBLISHABLE_KEY=your_polar_publishable_key_here  # ❌ Placeholder
```

### **Solution:**

You have two options:

#### **Option 1: Add Real Polar.sh Credentials** (Recommended for Production)

1. **Get Your Polar.sh Credentials**:
   - Go to [https://polar.sh](https://polar.sh)
   - Sign up/Login to your account
   - Navigate to Settings → API Keys
   - Copy your:
     - API Key (starts with `polar_sk_test_` or `polar_sk_live_`)
     - Publishable Key (starts with `polar_pk_test_` or `polar_pk_live_`)
     - Webhook Secret (from Webhooks section)

2. **Update `.env.local`**:
   ```bash
   POLAR_API_KEY=polar_sk_test_your_actual_key_here
   POLAR_WEBHOOK_SECRET=whsec_your_actual_secret_here
   NEXT_PUBLIC_POLAR_PUBLISHABLE_KEY=polar_pk_test_your_actual_key_here
   ```

3. **Restart the Server**:
   ```powershell
   # Stop the server (Ctrl+C)
   # Then start it again
   npm run dev -- -p 3000
   ```

#### **Option 2: Temporarily Disable Subscription Features** (For Testing)

If you want to test the app without Polar.sh first, you can:

1. **Skip the upgrade buttons** - Just use the app without trying to upgrade subscriptions
2. **Test other features** - Assets, invoices, clients, etc. will all work fine
3. **Add Polar.sh credentials later** when you're ready to test billing

---

## 🐛 Troubleshooting Common Issues

### **Issue: "ENOENT: no such file or directory" error**

**Symptom:**
```
npm error enoent Could not read package.json
```

**Solution:**
You're in the wrong directory. Use:
```powershell
cd "C:\Users\Lighting Department\Documents\GitHub\AssetTracer\asset-tracer"
```

---

### **Issue: "The token '&&' is not a valid statement separator"**

**Symptom:**
```powershell
cd asset-tracer && npm run dev
# Error: The token '&&' is not valid
```

**Solution:**
PowerShell doesn't support `&&`. Use separate commands:
```powershell
cd asset-tracer
npm run dev
```

Or use semicolons:
```powershell
cd asset-tracer; npm run dev
```

---

### **Issue: Port 3000 is already in use**

**Symptom:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
Kill the process using port 3000:
```powershell
# Find the process
netstat -ano | findstr :3000

# Kill it (replace PID with the actual process ID)
Stop-Process -Id PID -Force

# Or kill all Node processes
Stop-Process -Name "node" -Force
```

---

### **Issue: Environment variables not loading**

**Symptom:**
- Supabase errors
- Polar.sh errors
- "Missing environment variable" messages

**Solution:**
1. Verify `.env.local` exists in the `asset-tracer` directory
2. Check that there are no line breaks in long values
3. Restart the server after changing `.env.local`

---

## 📊 Verify Server is Running

### **Method 1: Check in Browser**
Open: http://localhost:3000

You should see your AssetTracer application.

### **Method 2: Check Process**
```powershell
Get-Process -Name "node" -ErrorAction SilentlyContinue
```

Should show Node.js processes running.

### **Method 3: Test Port**
```powershell
Test-NetConnection -ComputerName localhost -Port 3000
```

Should show `TcpTestSucceeded: True` when server is running.

---

## 🎯 Quick Reference

### **Environment Variables Location**
```
C:\Users\Lighting Department\Documents\GitHub\AssetTracer\asset-tracer\.env.local
```

### **Start Server Command**
```powershell
npm run dev -- -p 3000
```

### **Stop Server**
```
Ctrl + C (in the terminal where server is running)
```

### **Check Server Status**
```powershell
Get-Process -Name "node"
```

---

## 📝 Summary

Your server setup is **working correctly**! The only issue is that Polar.sh credentials need to be configured if you want to test subscription upgrades.

### **What's Working:**
- ✅ Server runs on port 3000
- ✅ Supabase database connected
- ✅ Authentication working
- ✅ Application accessible
- ✅ All core features available

### **What Needs Configuration:**
- ⚠️ Polar.sh API credentials (for billing/subscriptions)

### **Next Steps:**
1. Follow the Polar.sh Sandbox Setup Guide I created earlier
2. Add your Polar.sh credentials to `.env.local`
3. Restart the server
4. Test the subscription upgrade flow

---

## 🔗 Related Guides

- **Polar.sh Setup**: See `POLAR-SANDBOX-SETUP-GUIDE.md` for detailed instructions
- **Polar.sh Integration**: See `POLAR-INTEGRATION-GUIDE.md` for technical details

---

**Need Help?** The server is running correctly. Any issues you're experiencing now are related to Polar.sh configuration, not server connectivity.

