# Test 11: Error Message Sanitization Guide

## Overview
This test verifies that error messages in production mode don't expose sensitive information like:
- Stack traces
- Database connection strings
- Internal file paths
- API keys or secrets
- Detailed error messages that reveal system architecture

## Implementation Status: ✅ **IMPLEMENTED**

Error sanitization is implemented in `lib/utils/error-handler.ts`:
- ✅ Checks `NODE_ENV === 'development'` to determine mode
- ✅ In production: Returns generic error messages
- ✅ In development: Returns detailed error messages for debugging
- ✅ Stack traces only included in development mode
- ✅ Safe error messages (like "not found", "unauthorized") are allowed

## How It Works

### Development Mode
- Full error messages exposed
- Stack traces included in response
- Error details available for debugging

### Production Mode (NODE_ENV !== 'development')
- Generic error messages only
- No stack traces
- No sensitive details
- Only safe, user-friendly messages allowed

## Test Procedures

### Test 11.1: Verify Generic Error Messages in Production

**Steps:**
1. Ensure you're testing on staging/production (not localhost)
2. Trigger an API error by making an invalid request:
   ```javascript
   // In browser console (on staging site)
   fetch('/api/assets/invalid-id-12345', {
     credentials: 'include'
   })
   .then(r => r.json())
   .then(data => console.log('Error response:', data));
   ```

**Expected Result:**
- ✅ Error message is generic: `"Asset not found or access denied."`
- ✅ No stack trace in response
- ✅ No file paths or internal details
- ✅ Response format: `{ error: "..." }` (no `details` field)

### Test 11.2: Verify No Stack Traces

**Steps:**
1. Trigger a server error (e.g., invalid database query):
   ```javascript
   // Try to create an asset with invalid data that causes a DB error
   fetch('/api/assets', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     credentials: 'include',
     body: JSON.stringify({
       name: 'Test',
       purchase_cost: -1000, // Invalid but might pass validation
       current_value: 500,
       status: 'active'
     })
   })
   .then(r => r.json())
   .then(data => {
     console.log('Error response:', data);
     console.log('Has stack trace?', JSON.stringify(data).includes('at '));
   });
   ```

**Expected Result:**
- ✅ No `stack` property in response
- ✅ No `details.stack` field
- ✅ No file paths like `/app/api/...` or `at Object.`
- ✅ Generic error message only

### Test 11.3: Verify Error Code Present but Details Hidden

**Steps:**
1. Make a request that triggers a 500 error
2. Check the response:

```javascript
fetch('/api/nonexistent-endpoint', {
  credentials: 'include'
})
.then(r => {
  console.log('Status:', r.status);
  return r.json();
})
.then(data => {
  console.log('Response:', data);
  console.log('Has error code?', r.status >= 400);
  console.log('Has sensitive details?', 
    JSON.stringify(data).includes('password') ||
    JSON.stringify(data).includes('token') ||
    JSON.stringify(data).includes('key') ||
    JSON.stringify(data).includes('secret')
  );
});
```

**Expected Result:**
- ✅ Status code is present (400, 401, 404, 500, etc.)
- ✅ Error message is generic
- ✅ No sensitive keywords (password, token, key, secret) in response
- ✅ No database connection strings
- ✅ No API keys or credentials

### Test 11.4: Verify Safe Error Messages Are Allowed

Some error messages are safe to expose because they're user-friendly and don't reveal system internals:

**Safe Messages:**
- "Unauthorized. Please sign in."
- "Not found"
- "Validation failed"
- "Organization not found"
- "Limit reached"

**Steps:**
1. Test various error scenarios:
   ```javascript
   // Test unauthorized
   fetch('/api/assets', { credentials: 'omit' })
     .then(r => r.json())
     .then(d => console.log('Unauthorized:', d));
   
   // Test not found
   fetch('/api/assets/invalid-id', { credentials: 'include' })
     .then(r => r.json())
     .then(d => console.log('Not found:', d));
   ```

**Expected Result:**
- ✅ Safe error messages are returned as-is
- ✅ Still no stack traces or sensitive details
- ✅ Messages are user-friendly

## Verification Checklist

- [ ] Error messages are generic in production
- [ ] No stack traces in error responses
- [ ] No file paths or internal details exposed
- [ ] No sensitive information (passwords, tokens, keys)
- [ ] HTTP status codes are present
- [ ] Safe error messages are allowed
- [ ] Error handler is used consistently across API routes

## Common Issues to Check

### ❌ Bad: Exposing Stack Traces
```json
{
  "error": "Database connection failed",
  "stack": "Error: Database connection failed\n    at Object.query (/app/lib/db.js:45:12)..."
}
```

### ✅ Good: Generic Error Message
```json
{
  "error": "Internal server error. Please try again later."
}
```

### ❌ Bad: Exposing Sensitive Details
```json
{
  "error": "Connection to postgresql://user:password@host:5432/db failed"
}
```

### ✅ Good: Safe Error Message
```json
{
  "error": "Asset not found or access denied."
}
```

## Manual Testing Script

Run this in browser console on staging/production:

```javascript
// Test error sanitization
async function testErrorSanitization() {
  const tests = [
    {
      name: 'Invalid asset ID',
      url: '/api/assets/invalid-id-12345',
      method: 'GET'
    },
    {
      name: 'Invalid endpoint',
      url: '/api/nonexistent',
      method: 'GET'
    },
    {
      name: 'Invalid request body',
      url: '/api/assets',
      method: 'POST',
      body: { invalid: 'data' }
    }
  ];
  
  for (const test of tests) {
    try {
      const response = await fetch(test.url, {
        method: test.method,
        headers: test.body ? { 'Content-Type': 'application/json' } : {},
        credentials: 'include',
        body: test.body ? JSON.stringify(test.body) : undefined
      });
      
      const data = await response.json();
      
      console.log(`\n${test.name}:`);
      console.log('Status:', response.status);
      console.log('Response:', data);
      console.log('Has stack trace?', JSON.stringify(data).includes('at '));
      console.log('Has file paths?', JSON.stringify(data).includes('/app/') || JSON.stringify(data).includes('\\'));
      console.log('Has sensitive data?', 
        JSON.stringify(data).toLowerCase().includes('password') ||
        JSON.stringify(data).toLowerCase().includes('token') ||
        JSON.stringify(data).toLowerCase().includes('secret')
      );
    } catch (error) {
      console.error(`Error testing ${test.name}:`, error);
    }
  }
}

testErrorSanitization();
```

## Expected Results

All tests should show:
- ✅ Generic error messages
- ✅ No stack traces
- ✅ No file paths
- ✅ No sensitive information
- ✅ Appropriate HTTP status codes

