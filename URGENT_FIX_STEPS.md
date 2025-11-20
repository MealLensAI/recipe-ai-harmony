# 🚨 URGENT: Fix Infinite Recursion NOW

## The Problem
You're seeing: `infinite recursion detected in policy for relation "enterprises"`

**This is happening because the OLD policies from migration 003 are still active in your Supabase database.**

## ✅ SOLUTION: Run This SQL NOW

### Step 1: Open Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your project
3. Click **"SQL Editor"** (left sidebar)
4. Click **"New Query"**

### Step 2: Copy This ENTIRE SQL

Open the file: `FIX_RECURSION_NOW.sql`

Or copy this:

```sql
-- Drop ALL bad policies
DROP POLICY IF EXISTS "owners_can_read_own_enterprise" ON enterprises CASCADE;
DROP POLICY IF EXISTS "owners_can_update_own_enterprise" ON enterprises CASCADE;
DROP POLICY IF EXISTS "authenticated_users_can_create_enterprise" ON enterprises CASCADE;
DROP POLICY IF EXISTS "owners_can_delete_own_enterprise" ON enterprises CASCADE;
DROP POLICY IF EXISTS "owners_can_insert_invitations" ON invitations CASCADE;
DROP POLICY IF EXISTS "owners_can_read_invitations" ON invitations CASCADE;
DROP POLICY IF EXISTS "owners_can_update_invitations" ON invitations CASCADE;
DROP POLICY IF EXISTS "owners_can_delete_invitations" ON invitations CASCADE;
DROP POLICY IF EXISTS "invited_users_can_read_own_invitation" ON invitations CASCADE;
DROP POLICY IF EXISTS "owners_can_read_org_users" ON organization_users CASCADE;
DROP POLICY IF EXISTS "owners_can_insert_org_users" ON organization_users CASCADE;
DROP POLICY IF EXISTS "owners_can_update_org_users" ON organization_users CASCADE;
DROP POLICY IF EXISTS "owners_can_delete_org_users" ON organization_users CASCADE;
DROP POLICY IF EXISTS "users_can_read_own_membership" ON organization_users CASCADE;
DROP POLICY IF EXISTS "service_role_can_read_org_users" ON organization_users CASCADE;
DROP POLICY IF EXISTS "service_role_can_insert_org_users" ON organization_users CASCADE;
DROP POLICY IF EXISTS "service_role_can_update_org_users" ON organization_users CASCADE;
DROP POLICY IF EXISTS "service_role_can_delete_org_users" ON organization_users CASCADE;

-- Disable RLS temporarily
ALTER TABLE enterprises DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE enterprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

-- Create GOOD policies (no recursion)

-- ENTERPRISES
CREATE POLICY "service_role_full_access_enterprises" ON enterprises
    TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "users_read_own_enterprises" ON enterprises
    FOR SELECT TO authenticated USING (created_by = auth.uid());

CREATE POLICY "users_create_enterprises" ON enterprises
    FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- INVITATIONS
CREATE POLICY "service_role_full_access_invitations" ON invitations
    TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "users_read_own_invitations" ON invitations
    FOR SELECT TO authenticated USING (email = auth.email() OR invited_by = auth.uid());

-- ORGANIZATION_USERS
CREATE POLICY "service_role_full_access_org_users" ON organization_users
    TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "users_read_own_membership" ON organization_users
    FOR SELECT TO authenticated USING (user_id = auth.uid());
```

### Step 3: Click "RUN"

Click the **"Run"** button at the bottom right.

### Step 4: Verify Success

You should see: **"Success. No rows returned"**

Then run this to verify:
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('enterprises', 'invitations', 'organization_users');
```

You should see 7 policies total:
- 3 for enterprises
- 2 for invitations  
- 2 for organization_users

### Step 5: Test Your App

1. **Refresh your browser** (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
2. **Go to Enterprise Dashboard**
3. **Try to view your organization**
4. **Try to invite a user**

**It should work now!** ✅

## Why This Works

### Before (BAD - Causes Recursion):
```sql
-- This policy references enterprises table FROM invitations table
CREATE POLICY "owners_can_read_invitations" ON invitations
    USING (
        EXISTS (
            SELECT 1 FROM enterprises  -- ❌ RECURSION!
            WHERE enterprises.id = invitations.enterprise_id
            AND enterprises.created_by = auth.uid()
        )
    );
```

### After (GOOD - No Recursion):
```sql
-- This policy only checks the invitations table itself
CREATE POLICY "service_role_full_access_invitations" ON invitations
    TO service_role
    USING (true)  -- ✅ Simple, no table references
    WITH CHECK (true);
```

## What Changed

1. **Service role gets full access** - Backend uses admin client
2. **No cross-table references** - No recursion possible
3. **Backend handles permissions** - Code checks `enterprises.created_by`
4. **Simple and fast** - No complex queries

## After Applying

✅ No more infinite recursion
✅ Owner can view organizations
✅ Owner can invite users
✅ Everything works!

## If Still Not Working

1. Make sure you ran the ENTIRE SQL script
2. Hard refresh your browser (Ctrl+Shift+R)
3. Check backend logs for any other errors
4. Verify policies exist:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename IN ('enterprises', 'invitations', 'organization_users');
   ```

**Run the SQL NOW and it will be fixed!** 🚀
