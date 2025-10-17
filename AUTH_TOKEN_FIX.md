# Authentication Token Fix

## Issue

When trying to save meal plans after generating them with the Medical AI, the API was returning a **401 UNAUTHORIZED** error:

```
POST http://localhost:5173/api/meal_plan 401 (UNAUTHORIZED)
Error: Authentication failed: Token verification failed. Auth type attempted:
```

The error message showed "Auth type attempted:" with nothing after it, indicating the auth token was either missing or not being read correctly.

## Root Cause

The `useMealPlans.ts` hook was using direct `window.localStorage.getItem('access_token')` calls instead of the safer `safeGetItem` utility function that the rest of the app uses. This could cause issues in certain edge cases like:

- Private browsing mode
- localStorage being blocked
- Cross-browser inconsistencies

Additionally, the fetch requests were missing the `credentials: 'include'` option, which is needed for cookie-based authentication fallback.

## Solution

### 1. **Use Safe Storage Utilities**

Updated all localStorage access to use the `safeGetItem` utility:

**Before:**
```typescript
const response = await fetch(`${APP_CONFIG.api.base_url}/api/meal_plan`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(window.localStorage.getItem('access_token') ? 
      { 'Authorization': `Bearer ${window.localStorage.getItem('access_token')}` } 
      : {})
  },
  body: JSON.stringify(planData)
});
```

**After:**
```typescript
const token = safeGetItem('access_token');
const response = await fetch(`${APP_CONFIG.api.base_url}/api/meal_plan`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  },
  credentials: 'include',
  body: JSON.stringify(planData)
});
```

### 2. **Added Cookie-Based Auth Support**

Added `credentials: 'include'` to all fetch requests to support cookie-based authentication as a fallback:

```typescript
credentials: 'include'
```

This ensures the backend can authenticate users even if the bearer token method has issues.

### 3. **Added Debug Logging**

Added logging to help diagnose token issues:

```typescript
const token = safeGetItem('access_token');
console.log('[DEBUG] Using access token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
```

This helps identify if the token is present before making the API call.

## Changes Made

### Files Modified

**`src/hooks/useMealPlans.ts`**

1. **Imports** - Added `safeGetItem` import:
   ```typescript
   import { safeGetItem } from '@/lib/utils';
   ```

2. **Updated 7 Functions**:
   - `fetchPlans` (initial useEffect)
   - `saveMealPlan`
   - `updateMealPlan`
   - `deleteMealPlan`
   - `duplicateMealPlan`
   - `clearAllPlans`
   - `refreshMealPlans`

Each function now:
- Uses `safeGetItem('access_token')` instead of `window.localStorage.getItem('access_token')`
- Includes `credentials: 'include'` in the fetch options
- Stores the token in a variable (avoiding double-fetch)

## Benefits

1. **✅ More Reliable**: Uses battle-tested `safeGetItem` utility
2. **✅ Cross-Browser Compatible**: Handles edge cases in private mode
3. **✅ Cookie Auth Fallback**: Includes credentials for dual auth support
4. **✅ Better Performance**: Token is fetched once per request, not twice
5. **✅ Easier Debugging**: Console logs show if token is present
6. **✅ Consistent**: Aligns with how other parts of the app handle auth

## Testing

The fix should resolve the 401 error when:
- Creating new meal plans with Medical AI
- Creating meal plans with Sick Smart Plan
- Auto-generating meal plans
- Saving any type of meal plan to the database

Users should now be able to successfully save their meal plans after generation.

## Related Files

- `src/lib/utils.ts` - Contains the `safeGetItem` utility
- `src/lib/api.ts` - Centralized API service that already uses this pattern
- `src/hooks/useMealPlans.ts` - Updated to use safe storage methods

