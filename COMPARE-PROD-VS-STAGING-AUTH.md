# 🔍 COMPARE PRODUCTION VS STAGING AUTH SETTINGS

## Production works ✅ | Staging broken ❌

Compare these EXACT settings between both projects.

---

## ✅ **STEP 1: Auth → Configuration**

### **Production:**
https://supabase.com/dashboard/project/ftelnmursmitpjwjbyrw/auth/configuration

### **Staging:**
https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/configuration

**Compare these settings:**

| Setting | Production | Staging | Match? |
|---------|-----------|---------|--------|
| Enable email confirmations | ? | ? | ? |
| Confirm email | ? | ? | ? |
| Secure email change | ? | ? | ? |
| Require email verification | ? | ? | ? |

---

## ✅ **STEP 2: Auth → Providers → Google**

### **Production:**
https://supabase.com/dashboard/project/ftelnmursmitpjwjbyrw/auth/providers

### **Staging:**
https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/providers

Click on **Google** provider in BOTH:

| Setting | Production | Staging | Match? |
|---------|-----------|---------|--------|
| Enabled | ? | ? | ? |
| Client ID (first 10 chars) | ? | ? | ? |
| Client Secret (first 10 chars) | ? | ? | ? |
| Skip nonce check | ? | ? | ? |
| Use PKCE flow | ? | ? | ? |
| Authorized Client IDs | ? | ? | ? |

⚠️ **CRITICAL:** Are you using the **SAME** Google OAuth Client ID for both, or DIFFERENT ones?

---

## ✅ **STEP 3: Auth → URL Configuration**

### **Production:**
https://supabase.com/dashboard/project/ftelnmursmitpjwjbyrw/auth/url-configuration

### **Staging:**
https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/url-configuration

| Setting | Production | Staging | Match? |
|---------|-----------|---------|--------|
| Site URL | ? | ? | ? |
| Redirect URLs (list all) | ? | ? | ? |

---

## ✅ **STEP 4: Settings → Auth (JWT Settings)**

### **Production:**
https://supabase.com/dashboard/project/ftelnmursmitpjwjbyrw/settings/auth

### **Staging:**
https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/settings/auth

| Setting | Production | Staging | Match? |
|---------|-----------|---------|--------|
| JWT Expiry (seconds) | ? | ? | ? |
| Auto refresh tokens | ? | ? | ? |

---

## ✅ **STEP 5: Auth → Hooks**

### **Production:**
https://supabase.com/dashboard/project/ftelnmursmitpjwjbyrw/auth/hooks

### **Staging:**
https://supabase.com/dashboard/project/ougntjrrskfsuognjmcw/auth/hooks

| Hooks | Production | Staging | Match? |
|-------|-----------|---------|--------|
| Any hooks enabled? | ? | ? | ? |

---

## 📋 **HOW TO DO THIS:**

1. Open **TWO browser tabs side by side**
2. Tab 1: Production Supabase (ftelnmursmitpjwjbyrw)
3. Tab 2: Staging Supabase (ougntjrrskfsuognjmcw)
4. Go through each section above
5. **Tell me ANY differences you find**

---

## 🎯 **MOST LIKELY DIFFERENCES:**

Based on common issues:

1. **"Confirm email" is different** → Production: OFF, Staging: ON
2. **Google Client ID is different** → Using different OAuth apps
3. **Site URL format is different** → One has trailing slash, other doesn't
4. **Redirect URLs missing in staging** → Staging doesn't have all the URLs production has

---

**Go through the comparison now and tell me ANY setting that's different between production and staging!**

