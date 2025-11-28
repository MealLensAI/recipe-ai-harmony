-- ════════════════════════════════════════════════════════════════════
-- 003 - HARDEN ENTERPRISES RLS POLICIES
-- ════════════════════════════════════════════════════════════════════
-- Run this script inside the Supabase SQL editor (or psql) connected to
-- the primary database. It removes every existing RLS policy on
-- public.enterprises and recreates a minimal, multi-tenant safe set:
--   • service_role: unrestricted access for backend jobs
--   • authenticated owners: full read/write on the enterprises they own
--   • authenticated members: read-only access to enterprises they belong to
--
-- This closes the gaps that previously left the table readable/writeable
-- by the `public`/`anon` role and that created duplicate/conflicting
-- policies.
-- ════════════════════════════════════════════════════════════════════

-- Drop *all* existing policies on public.enterprises (regardless of name)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT polname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'enterprises'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.enterprises', pol.polname);
    END LOOP;
END $$;

-- Enforce RLS for every role (even table owner)
ALTER TABLE public.enterprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprises FORCE ROW LEVEL SECURITY;

-- Allow backend/service role clients to bypass RLS entirely
CREATE POLICY service_role_all_enterprises
    ON public.enterprises
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Owners can see their own organizations. Members can see organizations
-- they have an active membership in (organization_users.status = 'active').
CREATE POLICY enterprises_select_owner_or_member
    ON public.enterprises
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1
            FROM public.organization_users ou
            WHERE ou.enterprise_id = public.enterprises.id
              AND ou.user_id = auth.uid() 
              AND COALESCE(ou.status, 'active') = 'active'
        )
    );

-- Only allow authenticated users to create enterprises for themselves.
CREATE POLICY enterprises_insert_own_record
    ON public.enterprises
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);
  
-- Owners can update their organizations. WITH CHECK prevents changing
-- created_by to someone else.
CREATE POLICY enterprises_update_own_record
    ON public.enterprises
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Only owners can delete their organizations.
CREATE POLICY enterprises_delete_own_record
    ON public.enterprises
    FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- Optional sanity checks (uncomment to inspect):
-- SELECT polname, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'enterprises';

