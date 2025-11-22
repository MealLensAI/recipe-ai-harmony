-- Migration: Simple RLS for Service Role Access
-- Purpose: Allow backend (using service role) to manage all enterprise data
-- Date: 2024-01-20

-- ============================================================================
-- STRATEGY: Since backend uses admin client (service role), we grant
-- service role full access and let backend code handle permission checks
-- ============================================================================

-- ============================================================================
-- ENTERPRISES TABLE
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "owners_can_read_own_enterprise" ON enterprises;
DROP POLICY IF EXISTS "owners_can_update_own_enterprise" ON enterprises;
DROP POLICY IF EXISTS "authenticated_users_can_create_enterprise" ON enterprises;
DROP POLICY IF EXISTS "owners_can_delete_own_enterprise" ON enterprises;
DROP POLICY IF EXISTS "service_role_full_access_enterprises" ON enterprises;

-- Enable RLS
ALTER TABLE enterprises ENABLE ROW LEVEL SECURITY;

-- Allow service role (backend) full access
CREATE POLICY "service_role_full_access_enterprises" ON enterprises
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to read their own enterprises
CREATE POLICY "users_read_own_enterprises" ON enterprises
    FOR SELECT
    TO authenticated
    USING (created_by = auth.uid());

-- Allow authenticated users to create enterprises
CREATE POLICY "users_create_enterprises" ON enterprises
    FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

-- ============================================================================
-- INVITATIONS TABLE
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "owners_can_insert_invitations" ON invitations;
DROP POLICY IF EXISTS "owners_can_read_invitations" ON invitations;
DROP POLICY IF EXISTS "owners_can_update_invitations" ON invitations;
DROP POLICY IF EXISTS "owners_can_delete_invitations" ON invitations;
DROP POLICY IF EXISTS "invited_users_can_read_own_invitation" ON invitations;
DROP POLICY IF EXISTS "service_role_full_access_invitations" ON invitations;

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Allow service role (backend) full access
CREATE POLICY "service_role_full_access_invitations" ON invitations
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow invited users to read their own invitations (for accepting)
CREATE POLICY "users_read_own_invitations" ON invitations
    FOR SELECT
    TO authenticated
    USING (email = auth.email() OR invited_by = auth.uid());

-- ============================================================================
-- ORGANIZATION_USERS TABLE
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "owners_can_read_org_users" ON organization_users;
DROP POLICY IF EXISTS "owners_can_insert_org_users" ON organization_users;
DROP POLICY IF EXISTS "owners_can_update_org_users" ON organization_users;
DROP POLICY IF EXISTS "owners_can_delete_org_users" ON organization_users;
DROP POLICY IF EXISTS "users_can_read_own_membership" ON organization_users;
DROP POLICY IF EXISTS "service_role_can_read_org_users" ON organization_users;
DROP POLICY IF EXISTS "service_role_can_insert_org_users" ON organization_users;
DROP POLICY IF EXISTS "service_role_can_update_org_users" ON organization_users;
DROP POLICY IF EXISTS "service_role_can_delete_org_users" ON organization_users;
DROP POLICY IF EXISTS "service_role_full_access_org_users" ON organization_users;

-- Enable RLS
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

-- Allow service role (backend) full access
CREATE POLICY "service_role_full_access_org_users" ON organization_users
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow users to read their own membership
CREATE POLICY "users_read_own_membership" ON organization_users
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- List all policies
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('enterprises', 'invitations', 'organization_users')
ORDER BY tablename, policyname;

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. Backend uses service role (admin client) which bypasses RLS
-- 2. Service role has full access to all tables
-- 3. Backend code handles permission checks (check_user_is_org_admin)
-- 4. Regular users can only read their own data
-- 5. No infinite recursion because policies don't reference other tables
-- 6. Simple and maintainable

-- ============================================================================
-- SECURITY MODEL
-- ============================================================================

-- Backend (Service Role):
--   - Full access to all tables
--   - Permission checks in code
--   - Verifies enterprises.created_by == user_id for owner access

-- Regular Users (Authenticated):
--   - Can read their own enterprises (created_by = auth.uid())
--   - Can create new enterprises
--   - Can read their own invitations
--   - Can read their own membership
--   - Cannot modify data directly (must go through backend)
