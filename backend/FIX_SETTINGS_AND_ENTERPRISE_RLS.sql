-- ═══════════════════════════════════════════════════════════════════
-- FIX SETTINGS & ENTERPRISE RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════
--
-- This script fixes RLS policies for:
-- 1. user_settings table (settings not saving issue)
-- 2. enterprises table (organization disappearing issue)
-- 3. organization_users table (membership issues)
-- 4. invitations table (invitation issues)
--
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────
-- 1. FIX USER_SETTINGS TABLE RLS
-- ──────────────────────────────────────────────────────────────────

-- Drop existing policies
DROP POLICY IF EXISTS "service_role_all_user_settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON public.user_settings;

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Service role bypass (CRITICAL for backend operations)
CREATE POLICY "service_role_all_user_settings" ON public.user_settings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- User policies
CREATE POLICY "Users can view their own settings" ON public.user_settings
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON public.user_settings
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON public.user_settings
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON public.user_settings
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────
-- 2. FIX ENTERPRISES TABLE RLS
-- ──────────────────────────────────────────────────────────────────

-- Drop existing policies
DROP POLICY IF EXISTS "service_role_all_enterprises" ON public.enterprises;
DROP POLICY IF EXISTS "Users can view enterprises they created" ON public.enterprises;
DROP POLICY IF EXISTS "Users can view enterprises they belong to" ON public.enterprises;
DROP POLICY IF EXISTS "Users can insert their own enterprises" ON public.enterprises;
DROP POLICY IF EXISTS "Users can update enterprises they created" ON public.enterprises;

-- Enable RLS
ALTER TABLE public.enterprises ENABLE ROW LEVEL SECURITY;

-- Service role bypass (CRITICAL for backend operations)
CREATE POLICY "service_role_all_enterprises" ON public.enterprises
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- User policies
CREATE POLICY "Users can view enterprises they created" ON public.enterprises
    FOR SELECT
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Users can view enterprises they belong to" ON public.enterprises
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_users ou
            WHERE ou.enterprise_id = id
            AND ou.user_id = auth.uid()
            AND ou.status = 'active'
        )
    );

CREATE POLICY "Users can insert their own enterprises" ON public.enterprises
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update enterprises they created" ON public.enterprises
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- ──────────────────────────────────────────────────────────────────
-- 3. FIX ORGANIZATION_USERS TABLE RLS
-- ──────────────────────────────────────────────────────────────────

-- Drop existing policies
DROP POLICY IF EXISTS "service_role_all_organization_users" ON public.organization_users;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.organization_users;
DROP POLICY IF EXISTS "Enterprise owners can view all members" ON public.organization_users;
DROP POLICY IF EXISTS "Enterprise owners can manage members" ON public.organization_users;

-- Enable RLS
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;

-- Service role bypass (CRITICAL for backend operations)
CREATE POLICY "service_role_all_organization_users" ON public.organization_users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- User policies
CREATE POLICY "Users can view their own memberships" ON public.organization_users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Enterprise owners can view all members" ON public.organization_users
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.enterprises e
            WHERE e.id = enterprise_id
            AND e.created_by = auth.uid()
        )
    );

CREATE POLICY "Enterprise owners can manage members" ON public.organization_users
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.enterprises e
            WHERE e.id = enterprise_id
            AND e.created_by = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.enterprises e
            WHERE e.id = enterprise_id
            AND e.created_by = auth.uid()
        )
    );

-- ──────────────────────────────────────────────────────────────────
-- 4. FIX INVITATIONS TABLE RLS
-- ──────────────────────────────────────────────────────────────────

-- Drop existing policies
DROP POLICY IF EXISTS "service_role_all_invitations" ON public.invitations;
DROP POLICY IF EXISTS "Users can view invitations sent to them" ON public.invitations;
DROP POLICY IF EXISTS "Enterprise owners can manage invitations" ON public.invitations;

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Service role bypass (CRITICAL for backend operations)
CREATE POLICY "service_role_all_invitations" ON public.invitations
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- User policies
CREATE POLICY "Users can view invitations sent to them" ON public.invitations
    FOR SELECT
    TO authenticated
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR invited_by = auth.uid()
    );

CREATE POLICY "Enterprise owners can manage invitations" ON public.invitations
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.enterprises e
            WHERE e.id = enterprise_id
            AND e.created_by = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.enterprises e
            WHERE e.id = enterprise_id
            AND e.created_by = auth.uid()
        )
    );

-- ──────────────────────────────────────────────────────────────────
-- 5. CREATE/FIX UPSERT_USER_SETTINGS RPC FUNCTION
-- ──────────────────────────────────────────────────────────────────

-- Drop existing function first (if it exists)
DROP FUNCTION IF EXISTS public.upsert_user_settings(UUID, TEXT, JSONB);

-- Create new function with correct return type
CREATE FUNCTION public.upsert_user_settings(
    p_user_id UUID,
    p_settings_type TEXT,
    p_settings_data JSONB
)
RETURNS TABLE(status TEXT, message TEXT, settings_id UUID) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Use INSERT ... ON CONFLICT to upsert
    INSERT INTO public.user_settings (user_id, settings_type, settings_data, created_at, updated_at)
    VALUES (p_user_id, p_settings_type, p_settings_data, NOW(), NOW())
    ON CONFLICT (user_id, settings_type)
    DO UPDATE SET
        settings_data = EXCLUDED.settings_data,
        updated_at = NOW()
    RETURNING id INTO settings_id;
    
    RETURN QUERY SELECT 
        'success'::TEXT as status,
        'Settings saved successfully'::TEXT as message,
        settings_id;
        
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
        'error'::TEXT as status,
        SQLERRM::TEXT as message,
        NULL::UUID as settings_id;
END;
$$;

-- Grant execute permission to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.upsert_user_settings(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_user_settings(UUID, TEXT, JSONB) TO service_role;

-- ──────────────────────────────────────────────────────────────────
-- 6. ENSURE UNIQUE CONSTRAINT ON USER_SETTINGS
-- ──────────────────────────────────────────────────────────────────

-- This constraint is needed for the ON CONFLICT in upsert_user_settings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_settings_user_id_settings_type_key'
    ) THEN
        ALTER TABLE public.user_settings
        ADD CONSTRAINT user_settings_user_id_settings_type_key 
        UNIQUE (user_id, settings_type);
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (Run these after applying fixes)
-- ═══════════════════════════════════════════════════════════════════

-- Check user_settings policies
-- SELECT * FROM pg_policies WHERE tablename = 'user_settings';

-- Check enterprises policies
-- SELECT * FROM pg_policies WHERE tablename = 'enterprises';

-- Check organization_users policies
-- SELECT * FROM pg_policies WHERE tablename = 'organization_users';

-- Check invitations policies
-- SELECT * FROM pg_policies WHERE tablename = 'invitations';

-- Test upsert_user_settings function
-- SELECT * FROM public.upsert_user_settings(
--     'your-user-id-here'::UUID,
--     'health_profile',
--     '{"age": 30, "weight": 70}'::JSONB
-- );

-- ═══════════════════════════════════════════════════════════════════
-- DONE! ✅
-- ═══════════════════════════════════════════════════════════════════

