# 🚨 APPLY THIS RLS FIX NOW

## ❌ Problem: Infinite Recursion Error

You're seeing:
```
infinite recursion detected in policy for relation "enterprises"
```

**Cause**: The RLS policies were referencing the same table they protect, causing infinite loops.

## ✅ Solution: Simple Service Role Policies

Since the backend uses **admin client (service role)**, we don't need complex policies. We just need to:
1. Grant service role full access
2. Let backend code handle permission checks
3. Allow users to read their own data

## 🚀 APPLY THIS MIGRATION NOW

### Step 1: Go to Supabase Dashboard

1. Open https://app.supabase.com
2. Select your project
3. Click **"SQL Editor"** in left sidebar
4. Click **"New Query"**

### Step 2: Copy and Run This SQL

Copy the **ENTIRE content** from:
```
backend/migrations/004_simple_rls_for_service_role.sql
```

Or copy this directly:

```sql
-- Drop all existing problematic policies
DROP POLICY IF EXISTS "owners_can_read_own_enterprise" ON enterprises;
DROP POLICY IF EXISTS "owners_can_update_own_enterprise" ON enterprises;
DROP POLICY IF EXISTS "authenticated_users_can_create_enterprise" ON enterprises;
DROP POLICY IF EXISTS "owners_can_delete_own_enterprise" ON enterprises;
DROP POLICY IF EXISTS "service_role_full_access_enterprises" ON enterprises;
DROP POLICY IF EXISTS "owners_can_insert_invitations" ON invitations;
DROP POLICY IF EXISTS "owners_can_read_invitations" ON invitations;
DROP POLICY IF EXISTS "owners_can_update_invitations" ON invitations;
DROP POLICY IF EXISTS "owners_can_delete_invitations" ON invitations;
DROP POLICY IF EXISTS "invited_users_can_read_own_invitation" ON invitations;
DROP POLICY IF EXISTS "service_role_full_access_invitations" ON invitations;
DROP POLICY IF EXISTS "service_role_full_access_org_users" ON organization_users;

-- Enable RLS on all tables
ALTER TABLE enterprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

-- ENTERPRISES: Service role full access
CREATE POLICY "service_role_full_access_enterprises" ON enterprises
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ENTERPRISES: Users can read their own
CREATE POLICY "users_read_own_enterprises" ON enterprises
    FOR SELECT
    TO authenticated
    USING (created_by = auth.uid());

-- ENTERPRISES: Users can create
CREATE POLICY "users_create_enterprises" ON enterprises
    FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

-- INVITATIONS: Service role full access
CREATE POLICY "service_role_full_access_invitations" ON invitations
    TO service_role
    USING (true)
    WITH CHECK (true);

-- INVITATIONS: Users can read their own
CREATE POLICY "users_read_own_invitations" ON invitations
    FOR SELECT
    TO authenticated
    USING (email = auth.email() OR invited_by = auth.uid());

-- ORGANIZATION_USERS: Service role full access
CREATE POLICY "service_role_full_access_org_users" ON organization_users
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ORGANIZATION_USERS: Users can read their own membership
CREATE POLICY "users_read_own_membership" ON organization_users
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
```

### Step 3: Click "Run"

Click the **"Run"** button in Supabase SQL Editor.

You should see: **"Success. No rows returned"**

### Step 4: Verify

Run this query to verify policies are created:
```sql
SELECT tablename, policyname, roles
FROM pg_policies
WHERE tablename IN ('enterprises', 'invitations', 'organization_users')
ORDER BY tablename, policyname;
```

You should see:
- `service_role_full_access_enterprises`
- `users_read_own_enterprises`
- `users_create_enterprises`
- `service_role_full_access_invitations`
- `users_read_own_invitations`
- `service_role_full_access_org_users`
- `users_read_own_membership`

## ✅ What This Does

### For Backend (Service Role):
- ✅ Full access to all tables
- ✅ Can read/write enterprises
- ✅ Can read/write invitations
- ✅ Can read/write organization_users
- ✅ Permission checks done in code

### For Regular Users:
- ✅ Can read their own enterprises
- ✅ Can create new enterprises
- ✅ Can read their own invitations
- ✅ Can read their own membership
- ❌ Cannot directly modify data (must go through backend)

## 🎯 Why This Works

1. **No Infinite Recursion**: Policies don't reference other tables
2. **Simple**: Service role has full access, backend handles permissions
3. **Secure**: Backend code checks `enterprises.created_by == user_id`
4. **Fast**: No complex subqueries

## 🧪 Test After Applying

1. **Refresh your browser**
2. **Go to Enterprise Dashboard**
3. **Try to invite a user**
4. **Should work without errors!**

## 🔍 Expected Behavior

### ✅ Should Work:
- Owner can view their organization
- Owner can invite users
- Owner can view invitations
- Owner can view organization users
- No 500 errors!

### ❌ Should Fail (Properly):
- Non-owners get 403 Forbidden (not 500)
- Clear error messages

## 📊 Architecture

```
Frontend Request
    ↓
Backend (uses service_role client)
    ↓
RLS: service_role = FULL ACCESS ✅
    ↓
Backend Code: Check enterprises.created_by == user_id
    ↓
If owner: Allow ✅
If not owner: 403 Forbidden ❌
```

## 🎉 After Applying

The infinite recursion error will be **GONE** and everything will work!

**Apply the migration NOW and test!** 🚀
