-- Migration: Create user_settings_history table for tracking settings changes
-- This allows organizations to track when users change their settings

CREATE TABLE IF NOT EXISTS public.user_settings_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    settings_type TEXT NOT NULL,
    settings_data JSONB NOT NULL,
    previous_settings_data JSONB,
    changed_fields TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Indexes for performance
    CONSTRAINT user_settings_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_settings_history_user_id ON public.user_settings_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_history_created_at ON public.user_settings_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_settings_history_settings_type ON public.user_settings_history(settings_type);

-- Enable RLS
ALTER TABLE public.user_settings_history ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "service_role_all_settings_history" ON public.user_settings_history
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Users can view their own history
CREATE POLICY "users_view_own_settings_history" ON public.user_settings_history
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Organization admins/owners can view their members' settings history
CREATE POLICY "org_admins_view_member_settings_history" ON public.user_settings_history
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_users ou
            WHERE ou.enterprise_id IN (
                SELECT enterprise_id FROM public.organization_users
                WHERE user_id = auth.uid() 
                AND (role_in_organization = 'owner' OR is_admin = true)
            )
            AND ou.user_id = public.user_settings_history.user_id
            AND COALESCE(ou.status, 'active') = 'active'
        )
    );

-- Grant permissions
GRANT SELECT, INSERT ON public.user_settings_history TO authenticated;
GRANT ALL ON public.user_settings_history TO service_role;

-- Add comment
COMMENT ON TABLE public.user_settings_history IS 'Tracks all changes to user settings for audit and organization monitoring purposes';

