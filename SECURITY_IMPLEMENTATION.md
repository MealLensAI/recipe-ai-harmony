# Security Implementation Guide

## Overview
This document describes the security improvements implemented to protect user data and authentication tokens.

## Security Features Implemented

### 1. Encrypted Local Storage
- **File**: `frontend/src/lib/secureStorage.ts`
- **Features**:
  - AES-GCM encryption for sensitive data using Web Crypto API
  - Automatic token expiration checking
  - Fallback to obfuscation if encryption unavailable
  - Secure key derivation using PBKDF2

### 2. HTTP-Only Cookies
- **Backend**: `backend/routes/auth_routes.py`
- **Features**:
  - Access tokens stored in HTTP-only cookies (24 hours)
  - Refresh tokens stored in HTTP-only cookies (7 days)
  - Session IDs stored in HTTP-only cookies
  - Secure flag in production (HTTPS only)
  - SameSite protection (Lax in dev, None in production for cross-site)

### 3. Automatic Token Refresh
- **Backend**: `/api/auth/refresh` endpoint
- **Frontend**: `frontend/src/lib/api.ts`
- **Features**:
  - Automatic token refresh on 401 errors
  - Seamless retry of failed requests after refresh
  - Token expiration checking before requests

### 4. Secure Logout
- **Backend**: `/api/auth/logout` endpoint
- **Frontend**: `frontend/src/lib/utils.ts`
- **Features**:
  - Clears all HTTP-only cookies
  - Clears encrypted localStorage
  - Clears encryption keys
  - Invalidates session on server

## Migration Guide

### For Developers

1. **Replace localStorage calls with secure storage**:
   ```typescript
   // Old
   import { safeGetItem, safeSetItem } from '@/lib/utils'
   safeSetItem('access_token', token)
   const token = safeGetItem('access_token')
   
   // New
   import { secureSetItem, secureGetItem } from '@/lib/secureStorage'
   await secureSetItem('access_token', token)
   const token = await secureGetItem('access_token')
   ```

2. **Update API calls**:
   - The API service now automatically handles token refresh
   - No changes needed to existing API calls
   - Tokens are automatically refreshed on 401 errors

3. **Update logout**:
   ```typescript
   import { secureStorage } from '@/lib/secureStorage'
   await secureStorage.clearAll()
   ```

### For Users

- **No action required** - the migration is automatic
- Tokens are now encrypted in localStorage
- Cookies are used for additional security
- Sessions persist across browser restarts securely

## Security Best Practices

1. **Never store sensitive data in plain localStorage**
2. **Always use secure storage for tokens**
3. **Clear all storage on logout**
4. **Use HTTP-only cookies when possible**
5. **Implement token refresh for long sessions**
6. **Set appropriate cookie expiration times**

## Testing

1. Test login/logout flow
2. Test token refresh on expired tokens
3. Test clearing cache doesn't break authentication
4. Test cross-tab session sharing
5. Test secure cookie behavior in production

## Notes

- Encryption uses Web Crypto API (available in modern browsers)
- Falls back to base64 obfuscation if encryption unavailable
- Cookies are automatically included in requests via `credentials: 'include'`
- Token refresh happens automatically on 401 errors

