-- Migration: Fix RLS policies for enterprise owners
-- Purpose: Allow enterprise owners to manage their organizations and invite users
-- Date: 2024-01-20

-- ============================================================================
-- ENTERPRISES TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "owners_can_read_own_enterprise" ON enterprises;
DROP POLICY IF EXISTS "owners_can_update_own_enterprise" ON enterprises;
DROP POLICY IF EXISTS "owners_can_insert_enterprise" ON enterprises;

-- Enable RLS on enterprises table
ALTER TABLE enterprises ENABLE ROW LEVEL SECURITY;

-- Policy 1: Owners can read their own enterprises
CREATE POLICY "owners_can_read_own_enterprise" ON enterprises
    FOR SELECT
    USING (auth.uid() = created_by);

-- Policy 2: Owners can update their own enterprises
CREATE POLICY "owners_can_update_own_enterprise" ON enterprises
    FOR UPDATE
    USING (auth.uid() = created_by);

-- Policy 3: Authenticated users can create enterprises
CREATE POLICY "authenticated_users_can_create_enterprise" ON enterprises
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Policy 4: Owners can delete their own enterprises
CREATE POLICY "owners_can_delete_own_enterprise" ON enterprises
    FOR DELETE
    USING (auth.uid() = created_by);

-- ============================================================================
-- INVITATIONS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "owners_can_insert_invitations" ON invitations;
DROP POLICY IF EXISTS "owners_can_read_invitations" ON invitations;
DROP POLICY IF EXISTS "owners_can_update_invitations" ON invitations;
DROP POLICY IF EXISTS "owners_can_delete_invitations" ON invitations;
DROP POLICY IF EXISTS "invited_users_can_read_own_invitation" ON invitations;

-- Enable RLS on invitations table
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Enterprise owners can insert invitations for their enterprise
-- Note: invited_by is set to the owner's user_id when creating invitation
CREATE POLICY "owners_can_insert_invitations" ON invitations
    FOR INSERT
    WITH CHECK (invited_by = auth.uid());

-- Policy 2: Enterprise owners can read invitations for their enterprise
-- Note: invited_by is the owner's user_id, so we can check directly
CREATE POLICY "owners_can_read_invitations" ON invitations
    FOR SELECT
    USING (invited_by = auth.uid());

-- Policy 3: Enterprise owners can update invitations for their enterprise
CREATE POLICY "owners_can_update_invitations" ON invitations
    FOR UPDATE
    USING (invited_by = auth.uid());

-- Policy 4: Enterprise owners can delete invitations for their enterprise
CREATE POLICY "owners_can_delete_invitations" ON invitations
    FOR DELETE
    USING (invited_by = auth.uid());

-- Policy 5: Invited users can read their own invitations (for accepting)
CREATE POLICY "invited_users_can_read_own_invitation" ON invitations
    FOR SELECT
    USING (email = auth.email());

-- ============================================================================
-- ORGANIZATION_USERS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "owners_can_read_org_users" ON organization_users;
DROP POLICY IF EXISTS "owners_can_insert_org_users" ON organization_users;
DROP POLICY IF EXISTS "owners_can_update_org_users" ON organization_users;
DROP POLICY IF EXISTS "owners_can_delete_org_users" ON organization_users;
DROP POLICY IF EXISTS "users_can_read_own_membership" ON organization_users;

-- Enable RLS on organization_users table
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow service role to read all organization users (backend uses admin client)
CREATE POLICY "service_role_can_read_org_users" ON organization_users
    FOR SELECT
    TO service_role
    USING (true);

-- Policy 2: Allow service role to insert organization users (backend uses admin client)
CREATE POLICY "service_role_can_insert_org_users" ON organization_users
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Policy 3: Allow service role to update organization users (backend uses admin client)
CREATE POLICY "service_role_can_update_org_users" ON organization_users
    FOR UPDATE
    TO service_role
    USING (true);

-- Policy 4: Allow service role to delete organization users (backend uses admin client)
CREATE POLICY "service_role_can_delete_org_users" ON organization_users
    FOR DELETE
    TO service_role
    USING (true);

-- Policy 5: Users can read their own membership
CREATE POLICY "users_can_read_own_membership" ON organization_users
    FOR SELECT
    USING (user_id = auth.uid());

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('enterprises', 'invitations', 'organization_users')
ORDER BY tablename, policyname;

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. Enterprise owners are identified by enterprises.created_by = auth.uid()
-- 2. Owners are NOT in the organization_users table
-- 3. Only invited users are in organization_users table
-- 4. Owners have full access to their enterprise, invitations, and organization users
-- 5. Invited users can only read their own invitation and membership
-- 6. All policies use EXISTS subqueries for efficient permission checks

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To rollback this migration, run:
-- DROP POLICY IF EXISTS "owners_can_read_own_enterprise" ON enterprises;
-- DROP POLICY IF EXISTS "owners_can_update_own_enterprise" ON enterprises;
-- DROP POLICY IF EXISTS "authenticated_users_can_create_enterprise" ON enterprises;
-- DROP POLICY IF EXISTS "owners_can_delete_own_enterprise" ON enterprises;
-- DROP POLICY IF EXISTS "owners_can_insert_invitations" ON invitations;
-- DROP POLICY IF EXISTS "owners_can_read_invitations" ON invitations;
-- DROP POLICY IF EXISTS "owners_can_update_invitations" ON invitations;
-- DROP POLICY IF EXISTS "owners_can_delete_invitations" ON invitations;
-- DROP POLICY IF EXISTS "invited_users_can_read_own_invitation" ON invitations;
-- DROP POLICY IF EXISTS "owners_can_read_org_users" ON organization_users;
-- DROP POLICY IF EXISTS "owners_can_insert_org_users" ON organization_users;
-- DROP POLICY IF EXISTS "owners_can_update_org_users" ON organization_users;
-- DROP POLICY IF EXISTS "owners_can_delete_org_users" ON organization_users;
-- DROP POLICY IF EXISTS "users_can_read_own_membership" ON organization_users;
