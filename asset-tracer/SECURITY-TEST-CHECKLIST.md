# Security Features Test Checklist

## ✅ Rate Limiting Tests

### Test 1: Authentication Endpoint Rate Limit
- [ ] Make 5 requests to `/api/auth/consent` within 15 minutes
- [ ] Verify 6th request returns `429 Too Many Requests`
- [ ] Check response includes `X-RateLimit-Limit: 5`
- [ ] Check response includes `X-RateLimit-Remaining: 0`
- [ ] Check response includes `Retry-After` header
- [ ] Wait 15 minutes and verify requests work again

### Test 2: API Endpoint Rate Limit
- [ ] Make 200 requests to `/api/assets` within 1 minute
- [ ] Verify 201st request returns `429 Too Many Requests`
- [ ] Check rate limit headers are present
- [ ] Verify rate limit resets after 1 minute

### Test 3: Rate Limit Headers
- [ ] Make a request to any API endpoint
- [ ] Verify response includes:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## ✅ CORS Tests

### Test 4: CORS Headers
- [ ] Make OPTIONS request to `/api/assets`
- [ ] Verify response includes:
  - `Access-Control-Allow-Origin`
  - `Access-Control-Allow-Methods`
  - `Access-Control-Allow-Headers`
  - `Access-Control-Allow-Credentials`
- [ ] Verify response status is `204 No Content`

### Test 5: CORS Origin Validation
- [ ] Make request from allowed origin (localhost:3000)
- [ ] Verify CORS headers are present
- [ ] Make request from disallowed origin
- [ ] Verify CORS headers are restricted

## ✅ Security Headers Tests

### Test 6: Security Headers
- [ ] Visit any page on the site
- [ ] Check response headers include:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy` (with proper directives)

## ✅ Input Sanitization Tests

### Test 7: XSS Prevention in Assets
- [ ] Create asset with name: `<script>alert('XSS')</script>`
- [ ] Verify script tags are stripped
- [ ] Create asset with description containing HTML
- [ ] Verify HTML is sanitized

### Test 8: XSS Prevention in Invoices
- [ ] Create invoice with notes: `<img src=x onerror=alert('XSS')>`
- [ ] Verify malicious HTML is removed
- [ ] Create invoice with terms containing script tags
- [ ] Verify sanitization works

### Test 9: XSS Prevention in Quotations
- [ ] Create quotation with subject containing XSS payload
- [ ] Verify payload is sanitized
- [ ] Check item descriptions are sanitized

## ✅ Authentication Tests

### Test 10: Middleware Authentication
- [ ] Access `/dashboard` without authentication
- [ ] Verify redirect to `/login`
- [ ] Access `/login` while authenticated
- [ ] Verify redirect to `/dashboard`
- [ ] Verify middleware uses `getUser()` not `getSession()`

## ✅ Error Handling Tests

### Test 11: Error Message Sanitization
- [ ] Trigger an API error in production mode
- [ ] Verify error message is generic (no sensitive details)
- [ ] Check error response doesn't expose stack traces
- [ ] Verify error code is present but details are hidden

## Manual Testing Instructions

### Rate Limiting Test Script
```bash
# Test auth endpoint rate limit (run 6 times quickly)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/consent \
    -H "Content-Type: application/json" \
    -d '{"termsAccepted": true}' \
    -v
  echo "Request $i completed"
done
```

### CORS Test Script
```bash
# Test CORS preflight
curl -X OPTIONS http://localhost:3000/api/assets \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

### Security Headers Test
```bash
# Check security headers
curl -I http://localhost:3000/ | grep -i "x-frame\|x-content\|csp\|referrer"
```

## Expected Results

✅ All rate limiting tests should show proper 429 responses  
✅ All CORS tests should show proper headers  
✅ All security headers should be present  
✅ All XSS attempts should be sanitized  
✅ All authentication should use secure methods  
✅ All error messages should be sanitized in production  

