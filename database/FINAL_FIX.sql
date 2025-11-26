-- ============================================================================
-- FINAL FIX - Run this ONCE in Supabase SQL Editor
-- This will work even if policies already exist
-- ============================================================================

-- Drop ALL policies (using IF EXISTS so no errors if they don't exist)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on enterprises
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'enterprises') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON enterprises CASCADE';
    END LOOP;
    
    -- Drop all policies on invitations
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'invitations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON invitations CASCADE';
    END LOOP;
    
    -- Drop all policies on organization_users
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organization_users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON organization_users CASCADE';
    END LOOP;
END $$;

-- Disable and re-enable RLS to ensure clean state
ALTER TABLE enterprises DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users DISABLE ROW LEVEL SECURITY;

ALTER TABLE enterprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

-- Now create the correct policies (guaranteed no conflicts)

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

-- Verify
SELECT '✅ SUCCESS! All policies fixed.' as status;

SELECT tablename, policyname, ARRAY_TO_STRING(roles, ', ') as roles
FROM pg_policies
WHERE tablename IN ('enterprises', 'invitations', 'organization_users')
ORDER BY tablename, policyname;
