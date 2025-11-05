# Backend Settings API Fix

## Problem
User settings API was returning a 500 error when trying to save health profile settings. The error indicated a JSON parsing issue with the RPC function.

## Root Cause
The RPC function `upsert_user_settings` may not have been created in the Supabase database, or there was an issue with JSON serialization between Python and PostgreSQL.

## Solution
Updated the backend to use a **dual approach**:
1. **First try**: Use RPC function (`upsert_user_settings`) for optimal performance
2. **Fallback**: Use direct table insert/update if RPC fails

This ensures the API works regardless of whether the RPC functions are properly set up in Supabase.

## Files Modified

### 1. `backend/services/supabase_service.py`

#### save_user_settings()
- Added fallback to direct table operations
- Checks if record exists before deciding to INSERT or UPDATE
- Better error handling and logging
- JSON serialization fix for RPC calls

#### get_user_settings()
- Added fallback to direct table SELECT
- Returns `None` instead of error when no settings found (not an error state)
- Better error handling

### 2. New Script: `backend/scripts/022_ensure_user_settings_table.sql`
- Simplified SQL script to ensure `user_settings` table exists
- Can be run safely multiple times (uses IF NOT EXISTS)
- Creates necessary RLS policies
- Creates indexes for performance

## Database Setup

If the `user_settings` table doesn't exist in your Supabase database, run this SQL:

```sql
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    settings_type TEXT NOT NULL DEFAULT 'health_profile',
    settings_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, settings_type)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON public.user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON public.user_settings
    FOR DELETE USING (auth.uid() = user_id);
```

## Testing

### Test 1: Save Settings
1. Log in to the app
2. Go to Settings page
3. Select "Yes, I have a health condition"
4. Fill in health information
5. Click "Save Health Profile"
6. **Expected**: Success message, no 500 error

### Test 2: Load Settings
1. Save some settings (as above)
2. Refresh the page
3. **Expected**: Settings are loaded and displayed correctly

### Test 3: Update Settings
1. Change existing settings
2. Click "Save Health Profile"
3. **Expected**: Settings are updated successfully

## How It Works Now

```
Frontend (api.ts)
  ↓
  POST /api/settings
  ↓
Backend (user_settings_routes.py)
  ↓
  supabase_service.save_user_settings()
  ↓
  Try: RPC upsert_user_settings()
  ↓
  If fails: Direct table INSERT/UPDATE ✅
  ↓
  Success!
```

## Benefits
- ✅ Works even if RPC functions aren't set up
- ✅ Better error handling and logging
- ✅ Fallback mechanism for reliability
- ✅ No changes needed to frontend
- ✅ Backward compatible

## Next Steps
1. Restart the backend server
2. Test saving health settings
3. If working, optionally run the full `021_create_user_settings_table.sql` to set up RPC functions for better performance

