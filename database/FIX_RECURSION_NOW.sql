-- ============================================================================
-- EMERGENCY FIX: Remove Infinite Recursion Policies
-- RUN THIS IN SUPABASE SQL EDITOR RIGHT NOW!
-- ============================================================================

-- Step 1: Drop ALL existing policies that cause recursion
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

-- Step 2: Disable RLS temporarily to clear everything
ALTER TABLE enterprises DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS
ALTER TABLE enterprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create SIMPLE policies that work with service role

-- ============================================================================
-- ENTERPRISES TABLE - Simple Policies
-- ============================================================================

-- Service role (backend) has full access
CREATE POLICY "service_role_full_access_enterprises" ON enterprises
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Users can read their own enterprises
CREATE POLICY "users_read_own_enterprises" ON enterprises
    FOR SELECT
    TO authenticated
    USING (created_by = auth.uid());

-- Users can create enterprises
CREATE POLICY "users_create_enterprises" ON enterprises
    FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

-- ============================================================================
-- INVITATIONS TABLE - Simple Policies
-- ============================================================================

-- Service role (backend) has full access
CREATE POLICY "service_role_full_access_invitations" ON invitations
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Users can read invitations sent to them or by them
CREATE POLICY "users_read_own_invitations" ON invitations
    FOR SELECT
    TO authenticated
    USING (email = auth.email() OR invited_by = auth.uid());

-- ============================================================================
-- ORGANIZATION_USERS TABLE - Simple Policies
-- ============================================================================

-- Service role (backend) has full access
CREATE POLICY "service_role_full_access_org_users" ON organization_users
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Users can read their own membership
CREATE POLICY "users_read_own_membership" ON organization_users
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================================================
-- VERIFICATION - Check policies are correct
-- ============================================================================

SELECT 
    schemaname,
    tablename, 
    policyname, 
    ARRAY_TO_STRING(roles, ', ') as roles,
    cmd
FROM pg_policies
WHERE tablename IN ('enterprises', 'invitations', 'organization_users')
ORDER BY tablename, policyname;

-- You should see:
-- enterprises: service_role_full_access_enterprises, users_read_own_enterprises, users_create_enterprises
-- invitations: service_role_full_access_invitations, users_read_own_invitations
-- organization_users: service_role_full_access_org_users, users_read_own_membership

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT 'RLS policies fixed! Refresh your browser and try again.' as message;
