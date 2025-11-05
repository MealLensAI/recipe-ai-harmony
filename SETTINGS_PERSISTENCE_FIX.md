# Settings Persistence Fix

## Problem
User settings and trial information were being stored in browser localStorage instead of the Supabase database. This caused:
- Settings to be lost when users cleared their browser cookies/cache
- Trial hours to reset when clearing browser data
- Inconsistent data across devices and browsers

## Root Cause
The frontend code was using localStorage as the primary storage mechanism instead of using the backend database (Supabase) as the source of truth.

## Changes Made

### 1. Trial Service (`src/lib/trialService.ts`)
**Changed:**
- `getTrialInfo()`: Now async, fetches trial data from backend instead of localStorage
- `isTrialExpired()`: Now async, uses backend data
- `getFormattedRemainingTime()`: Now async, uses backend data  
- `getTrialProgress()`: Now async, calculates progress from backend trial dates
- `initializeTrial()`: Now a no-op (trials are created by backend during registration)

**Impact:**
- Trial information is now always fetched from Supabase
- Trial start/end times persist across browser sessions and devices
- Clearing cookies/cache no longer resets trial time

### 2. Trial Hook (`src/hooks/useTrial.ts`)
**Changed:**
- Updated to use async `getTrialInfo()` method
- Added state management for `progressPercentage` and `formattedRemainingTime`
- Removed comment suggesting localStorage is acceptable for trials

**Impact:**
- React components now display trial information from database
- Trial status updates properly reflect backend state

### 3. Subscription Hook (`src/hooks/useSubscription.ts`)
**Changed:**
- Updated `updateSubscriptionInfo()` to await async methods
- Fixed `hasActiveSubscription()` to be awaited
- Fixed trial duration calculation to use actual dates from backend

**Impact:**
- Subscription status correctly reflects database state
- No more localStorage dependency for subscription info

### 4. Health Settings Hook (`src/hooks/useSicknessSettings.ts`)
**Changed:**
- Removed localStorage fallback in `loadSettings()`
- Removed localStorage updates in `updateSettings()`
- Removed localStorage saves in `saveSettings()`
- Added logging for backend operations

**Impact:**
- Health profile settings are ONLY stored in and retrieved from Supabase
- No more localStorage dependency that could cause stale data
- Settings persist properly across browsers and devices

## Backend Support
The backend already had proper infrastructure in place:
- `user_trials` table in Supabase stores trial information
- `user_settings` table stores health profile settings
- API endpoints exist for fetching and saving both
- Trials are automatically created during user registration

## Testing Instructions

### Test 1: Health Settings Persistence
1. Log in to the app
2. Go to Settings page
3. Set your health condition (Yes/No)
4. Save the settings
5. Open browser DevTools → Application → Local Storage
6. Clear ALL local storage data
7. Refresh the page
8. **Expected Result:** Your health settings should still be there (loaded from database)

### Test 2: Trial Time Persistence
1. Log in to the app
2. Note the trial time remaining (e.g., "173h 57m remaining")
3. Open browser DevTools → Application
4. Clear Cookies, Local Storage, and Cache
5. Log in again
6. **Expected Result:** Trial time should be the same as before (or slightly less due to time passing)

### Test 3: Cross-Device Sync
1. Log in on Browser A
2. Change health settings
3. Log in on Browser B (different browser or device)
4. **Expected Result:** Health settings should match what you set on Browser A

## Migration Notes
- Existing users with localStorage data will see their settings reset on first login after this update
- This is expected and correct behavior - they should re-enter their settings
- All new settings will be properly stored in the database going forward

## Files Modified
1. `src/lib/trialService.ts` - Trial data now from backend
2. `src/hooks/useTrial.ts` - Use async trial methods
3. `src/hooks/useSubscription.ts` - Use async methods properly
4. `src/hooks/useSicknessSettings.ts` - Remove localStorage dependencies

## Verification
✅ Build passes: `npm run build` (successful)
✅ No TypeScript errors
✅ No linter errors
✅ All async method calls properly awaited

## Next Steps
1. Deploy to production
2. Monitor user reports to ensure settings persist correctly
3. Consider adding a migration script to copy existing localStorage data to database (optional)

