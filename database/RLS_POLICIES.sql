-- ============================================================================
-- Row Level Security (RLS) Policies for Enterprise System
-- ============================================================================
-- 
-- CRITICAL: These policies MUST be applied to Supabase for the invitation
-- system to work correctly.
--
-- The owner (enterprises.created_by) must be able to:
-- 1. Insert invitations
-- 2. Select invitations
-- 3. Update invitations
-- 4. Delete invitations
--
-- ============================================================================

-- ============================================================================
-- INVITATIONS TABLE POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "owners_can_insert_invitations" ON invitations;
DROP POLICY IF EXISTS "owners_can_select_invitations" ON invitations;
DROP POLICY IF EXISTS "owners_can_update_invitations" ON invitations;
DROP POLICY IF EXISTS "owners_can_delete_invitations" ON invitations;
DROP POLICY IF EXISTS "public_can_verify_invitations" ON invitations;

-- Enable RLS on invitations table
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Owners can INSERT invitations
-- This allows the enterprise owner to create invitations
CREATE POLICY "owners_can_insert_invitations" 
ON invitations 
FOR INSERT 
TO authenticated
WITH CHECK (
    -- User must be the owner of the enterprise they're inviting to
    EXISTS (
        SELECT 1 FROM enterprises 
        WHERE enterprises.id = invitations.enterprise_id 
        AND enterprises.created_by = auth.uid()
    )
    AND
    -- The invited_by field must match the current user
    invited_by = auth.uid()
);

-- Policy 2: Owners can SELECT invitations
-- This allows the enterprise owner to view all invitations for their organization
CREATE POLICY "owners_can_select_invitations" 
ON invitations 
FOR SELECT 
TO authenticated
USING (
    -- User must be the owner of the enterprise
    EXISTS (
        SELECT 1 FROM enterprises 
        WHERE enterprises.id = invitations.enterprise_id 
        AND enterprises.created_by = auth.uid()
    )
);

-- Policy 3: Owners can UPDATE invitations
-- This allows the enterprise owner to update invitation status (e.g., cancel)
CREATE POLICY "owners_can_update_invitations" 
ON invitations 
FOR UPDATE 
TO authenticated
USING (
    -- User must be the owner of the enterprise
    EXISTS (
        SELECT 1 FROM enterprises 
        WHERE enterprises.id = invitations.enterprise_id 
        AND enterprises.created_by = auth.uid()
    )
)
WITH CHECK (
    -- User must be the owner of the enterprise
    EXISTS (
        SELECT 1 FROM enterprises 
        WHERE enterprises.id = invitations.enterprise_id 
        AND enterprises.created_by = auth.uid()
    )
);

-- Policy 4: Owners can DELETE invitations
-- This allows the enterprise owner to delete invitations
CREATE POLICY "owners_can_delete_invitations" 
ON invitations 
FOR DELETE 
TO authenticated
USING (
    -- User must be the owner of the enterprise
    EXISTS (
        SELECT 1 FROM enterprises 
        WHERE enterprises.id = invitations.enterprise_id 
        AND enterprises.created_by = auth.uid()
    )
);

-- Policy 5: Public can verify invitations (for accepting invitations)
-- This allows anyone with a valid token to view the invitation details
CREATE POLICY "public_can_verify_invitations" 
ON invitations 
FOR SELECT 
TO anon, authenticated
USING (
    -- Allow viewing invitations that are pending
    status = 'pending'
);

-- ============================================================================
-- ORGANIZATION_USERS TABLE POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "owners_can_insert_org_users" ON organization_users;
DROP POLICY IF EXISTS "owners_can_select_org_users" ON organization_users;
DROP POLICY IF EXISTS "owners_can_update_org_users" ON organization_users;
DROP POLICY IF EXISTS "owners_can_delete_org_users" ON organization_users;
DROP POLICY IF EXISTS "users_can_view_own_membership" ON organization_users;

-- Enable RLS on organization_users table
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Owners can INSERT organization users
-- This allows the enterprise owner to add users to their organization
CREATE POLICY "owners_can_insert_org_users" 
ON organization_users 
FOR INSERT 
TO authenticated
WITH CHECK (
    -- User must be the owner of the enterprise
    EXISTS (
        SELECT 1 FROM enterprises 
        WHERE enterprises.id = organization_users.enterprise_id 
        AND enterprises.created_by = auth.uid()
    )
);

-- Policy 2: Owners can SELECT organization users
-- This allows the enterprise owner to view all users in their organization
CREATE POLICY "owners_can_select_org_users" 
ON organization_users 
FOR SELECT 
TO authenticated
USING (
    -- User must be the owner of the enterprise
    EXISTS (
        SELECT 1 FROM enterprises 
        WHERE enterprises.id = organization_users.enterprise_id 
        AND enterprises.created_by = auth.uid()
    )
    OR
    -- OR user is viewing their own membership
    user_id = auth.uid()
);

-- Policy 3: Owners can UPDATE organization users
-- This allows the enterprise owner to update user roles and status
CREATE POLICY "owners_can_update_org_users" 
ON organization_users 
FOR UPDATE 
TO authenticated
USING (
    -- User must be the owner of the enterprise
    EXISTS (
        SELECT 1 FROM enterprises 
        WHERE enterprises.id = organization_users.enterprise_id 
        AND enterprises.created_by = auth.uid()
    )
)
WITH CHECK (
    -- User must be the owner of the enterprise
    EXISTS (
        SELECT 1 FROM enterprises 
        WHERE enterprises.id = organization_users.enterprise_id 
        AND enterprises.created_by = auth.uid()
    )
);

-- Policy 4: Owners can DELETE organization users
-- This allows the enterprise owner to remove users from their organization
CREATE POLICY "owners_can_delete_org_users" 
ON organization_users 
FOR DELETE 
TO authenticated
USING (
    -- User must be the owner of the enterprise
    EXISTS (
        SELECT 1 FROM enterprises 
        WHERE enterprises.id = organization_users.enterprise_id 
        AND enterprises.created_by = auth.uid()
    )
);

-- Policy 5: Users can view their own membership
-- This allows users to see which organizations they belong to
CREATE POLICY "users_can_view_own_membership" 
ON organization_users 
FOR SELECT 
TO authenticated
USING (
    user_id = auth.uid()
);

-- ============================================================================
-- ENTERPRISES TABLE POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_can_insert_enterprises" ON enterprises;
DROP POLICY IF EXISTS "owners_can_select_enterprises" ON enterprises;
DROP POLICY IF EXISTS "owners_can_update_enterprises" ON enterprises;
DROP POLICY IF EXISTS "members_can_view_their_enterprises" ON enterprises;

-- Enable RLS on enterprises table
ALTER TABLE enterprises ENABLE ROW LEVEL SECURITY;

-- Policy 1: Authenticated users can INSERT enterprises
-- This allows any authenticated user to create an organization
CREATE POLICY "users_can_insert_enterprises" 
ON enterprises 
FOR INSERT 
TO authenticated
WITH CHECK (
    -- User must be setting themselves as the creator
    created_by = auth.uid()
);

-- Policy 2: Owners can SELECT their enterprises
-- This allows the enterprise owner to view their organization
CREATE POLICY "owners_can_select_enterprises" 
ON enterprises 
FOR SELECT 
TO authenticated
USING (
    -- User must be the owner
    created_by = auth.uid()
);

-- Policy 3: Owners can UPDATE their enterprises
-- This allows the enterprise owner to update their organization
CREATE POLICY "owners_can_update_enterprises" 
ON enterprises 
FOR UPDATE 
TO authenticated
USING (
    -- User must be the owner
    created_by = auth.uid()
)
WITH CHECK (
    -- User must be the owner
    created_by = auth.uid()
);

-- Policy 4: Members can view enterprises they belong to
-- This allows organization members to view the organization details
CREATE POLICY "members_can_view_their_enterprises" 
ON enterprises 
FOR SELECT 
TO authenticated
USING (
    -- User is a member of this organization
    EXISTS (
        SELECT 1 FROM organization_users 
        WHERE organization_users.enterprise_id = enterprises.id 
        AND organization_users.user_id = auth.uid()
    )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify the policies are working correctly

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('invitations', 'organization_users', 'enterprises');

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('invitations', 'organization_users', 'enterprises')
ORDER BY tablename, policyname;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- 1. These policies ensure that:
--    - Only enterprise owners can invite users
--    - Only enterprise owners can manage their organization
--    - Users can view their own memberships
--    - Public can verify invitation tokens
--
-- 2. The owner is identified by enterprises.created_by
--    - The owner is NOT in the organization_users table
--    - The owner has full access through these policies
--
-- 3. If invitations are failing with 500 errors, check:
--    - RLS is enabled on the invitations table
--    - The "owners_can_insert_invitations" policy exists
--    - The user is authenticated
--    - The user is the owner of the enterprise
--
-- 4. To apply these policies:
--    - Copy this entire file
--    - Go to Supabase Dashboard > SQL Editor
--    - Paste and run the SQL
--    - Verify with the verification queries at the end
--
-- ============================================================================
