-- ============================================================================
-- CLEAN ALL POLICIES AND START FRESH
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================

-- Step 1: Drop EVERY possible policy (including the good ones)
DROP POLICY IF EXISTS "owners_can_read_own_enterprise" ON enterprises CASCADE;
DROP POLICY IF EXISTS "owners_can_update_own_enterprise" ON enterprises CASCADE;
DROP POLICY IF EXISTS "authenticated_users_can_create_enterprise" ON enterprises CASCADE;
DROP POLICY IF EXISTS "owners_can_delete_own_enterprise" ON enterprises CASCADE;
DROP POLICY IF EXISTS "service_role_full_access_enterprises" ON enterprises CASCADE;
DROP POLICY IF EXISTS "users_read_own_enterprises" ON enterprises CASCADE;
DROP POLICY IF EXISTS "users_create_enterprises" ON enterprises CASCADE;

DROP POLICY IF EXISTS "owners_can_insert_invitations" ON invitations CASCADE;
DROP POLICY IF EXISTS "owners_can_read_invitations" ON invitations CASCADE;
DROP POLICY IF EXISTS "owners_can_update_invitations" ON invitations CASCADE;
DROP POLICY IF EXISTS "owners_can_delete_invitations" ON invitations CASCADE;
DROP POLICY IF EXISTS "invited_users_can_read_own_invitation" ON invitations CASCADE;
DROP POLICY IF EXISTS "service_role_full_access_invitations" ON invitations CASCADE;
DROP POLICY IF EXISTS "users_read_own_invitations" ON invitations CASCADE;

DROP POLICY IF EXISTS "owners_can_read_org_users" ON organization_users CASCADE;
DROP POLICY IF EXISTS "owners_can_insert_org_users" ON organization_users CASCADE;
DROP POLICY IF EXISTS "owners_can_update_org_users" ON organization_users CASCADE;
DROP POLICY IF EXISTS "owners_can_delete_org_users" ON organization_users CASCADE;
DROP POLICY IF EXISTS "users_can_read_own_membership" ON organization_users CASCADE;
DROP POLICY IF EXISTS "service_role_can_read_org_users" ON organization_users CASCADE;
DROP POLICY IF EXISTS "service_role_can_insert_org_users" ON organization_users CASCADE;
DROP POLICY IF EXISTS "service_role_can_update_org_users" ON organization_users CASCADE;
DROP POLICY IF EXISTS "service_role_can_delete_org_users" ON organization_users CASCADE;
DROP POLICY IF EXISTS "service_role_full_access_org_users" ON organization_users CASCADE;
DROP POLICY IF EXISTS "users_read_own_membership" ON organization_users CASCADE;

-- Step 2: Disable RLS on all tables
ALTER TABLE enterprises DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS
ALTER TABLE enterprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create ONLY the policies we need (fresh start)

-- ============================================================================
-- ENTERPRISES TABLE
-- ============================================================================

-- Service role (backend with admin client) has full access
CREATE POLICY "service_role_full_access_enterprises" ON enterprises
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated users can read their own enterprises
CREATE POLICY "users_read_own_enterprises" ON enterprises
    FOR SELECT
    TO authenticated
    USING (created_by = auth.uid());

-- Authenticated users can create enterprises
CREATE POLICY "users_create_enterprises" ON enterprises
    FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

-- ============================================================================
-- INVITATIONS TABLE
-- ============================================================================

-- Service role (backend with admin client) has full access
CREATE POLICY "service_role_full_access_invitations" ON invitations
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated users can read invitations sent to them or by them
CREATE POLICY "users_read_own_invitations" ON invitations
    FOR SELECT
    TO authenticated
    USING (email = auth.email() OR invited_by = auth.uid());

-- ============================================================================
-- ORGANIZATION_USERS TABLE
-- ============================================================================

-- Service role (backend with admin client) has full access
CREATE POLICY "service_role_full_access_org_users" ON organization_users
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated users can read their own membership
CREATE POLICY "users_read_own_membership" ON organization_users
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- List all policies to verify
SELECT 
    tablename, 
    policyname, 
    ARRAY_TO_STRING(roles, ', ') as roles,
    cmd as operation
FROM pg_policies
WHERE tablename IN ('enterprises', 'invitations', 'organization_users')
ORDER BY tablename, policyname;

-- Expected output:
-- enterprises: 3 policies (service_role_full_access, users_read_own, users_create)
-- invitations: 2 policies (service_role_full_access, users_read_own)
-- organization_users: 2 policies (service_role_full_access, users_read_own_membership)

-- ============================================================================
-- SUCCESS
-- ============================================================================

SELECT '✅ RLS policies cleaned and recreated successfully!' as status,
       'Refresh your browser and test the app' as next_step;
