# Detection History Fix

## Problem
The detection history feature is not working because the required database RPC functions are missing in Supabase.

When users use the **Food Detection** or **Ingredient Detection** features:
- The frontend sends data to the backend to save to history
- The backend tries to call `add_detection_history` RPC function
- **This function doesn't exist**, so the data is never saved
- When users visit the History page, there's no data to display

## Solution
You need to create the missing RPC functions in your Supabase database.

### Option 1: Run via SQL Editor (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** (in the left sidebar)
4. Click **New Query**
5. Copy and paste the contents of `backend/scripts/020_create_detection_history_functions.sql`
6. Click **Run** (or press Ctrl/Cmd + Enter)

### Option 2: Run via Python Script

If you have `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` environment variables set:

```bash
cd backend/scripts
python run_detection_history_migration.py
```

## What the Fix Does

The SQL script creates two RPC functions:

1. **`add_detection_history`** - Saves new detection history entries
2. **`update_detection_history`** - Updates existing entries with resources (YouTube, Google links)

These functions are called by the backend when:
- Users detect food from images
- Users detect ingredients and get recipe suggestions
- Resources (YouTube videos, Google articles) are loaded

## Testing the Fix

After running the SQL script:

1. Go to the app and use either:
   - Food Detection page
   - Ingredient Detection (AI Response) page
2. Complete a detection flow (upload image or enter ingredients)
3. Navigate to the **History** page
4. You should now see your detection history!

## Files Created/Modified

- `backend/scripts/020_create_detection_history_functions.sql` - SQL script to create RPC functions
- `backend/scripts/run_detection_history_migration.py` - Python script to run the migration
- `HISTORY_FIX.md` - This file (documentation)

## Technical Details

The backend code at `backend/services/supabase_service.py` line 200 calls:
```python
result = self.supabase.rpc('add_detection_history', insert_data).execute()
```

This RPC function was referenced but never created in the database, causing all history saves to fail silently.

The SQL functions properly:
- Insert data into `detection_history` table
- Handle errors gracefully
- Return success/error status in a consistent format
- Are secured with `SECURITY DEFINER` to bypass RLS
- Have proper permissions granted to authenticated users

---

**Note:** After running this fix, all future detections will be saved to history. Past detections (before the fix) cannot be recovered since they were never saved to the database.

