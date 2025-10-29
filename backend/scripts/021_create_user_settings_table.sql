-- =============================================================================
-- USER SETTINGS TABLE MIGRATION
-- =============================================================================
-- This script creates a user_settings table to store user health profiles and settings
-- instead of relying on localStorage

-- =============================================================================
-- 1. CREATE USER SETTINGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    settings_type TEXT NOT NULL DEFAULT 'health_profile', -- 'health_profile', 'preferences', etc.
    settings_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, settings_type)
);

-- =============================================================================
-- 2. ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. CREATE RLS POLICIES
-- =============================================================================

-- Users can view their own settings
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own settings
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
CREATE POLICY "Users can insert their own settings" ON public.user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
CREATE POLICY "Users can update their own settings" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own settings
DROP POLICY IF EXISTS "Users can delete their own settings" ON public.user_settings;
CREATE POLICY "Users can delete their own settings" ON public.user_settings
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_type ON public.user_settings(settings_type);
CREATE INDEX IF NOT EXISTS idx_user_settings_updated_at ON public.user_settings(updated_at);

-- =============================================================================
-- 5. CREATE RPC FUNCTIONS FOR USER SETTINGS
-- =============================================================================

-- Function to upsert user settings
CREATE OR REPLACE FUNCTION public.upsert_user_settings(
    p_user_id UUID,
    p_settings_type TEXT,
    p_settings_data JSONB
)
RETURNS JSON AS $$
DECLARE
    result_record RECORD;
BEGIN
    -- Insert or update the settings
    INSERT INTO public.user_settings (user_id, settings_type, settings_data, updated_at)
    VALUES (p_user_id, p_settings_type, p_settings_data, NOW())
    ON CONFLICT (user_id, settings_type)
    DO UPDATE SET
        settings_data = EXCLUDED.settings_data,
        updated_at = NOW()
    RETURNING * INTO result_record;
    
    -- Return success response
    RETURN json_build_object(
        'status', 'success',
        'message', 'Settings saved successfully',
        'data', row_to_json(result_record)
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'status', 'error',
            'message', 'Failed to save settings: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user settings
CREATE OR REPLACE FUNCTION public.get_user_settings(
    p_user_id UUID,
    p_settings_type TEXT DEFAULT 'health_profile'
)
RETURNS JSON AS $$
DECLARE
    result_record RECORD;
BEGIN
    -- Get the settings
    SELECT * INTO result_record
    FROM public.user_settings
    WHERE user_id = p_user_id AND settings_type = p_settings_type;
    
    IF FOUND THEN
        RETURN json_build_object(
            'status', 'success',
            'data', row_to_json(result_record)
        );
    ELSE
        RETURN json_build_object(
            'status', 'success',
            'data', NULL,
            'message', 'No settings found'
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'status', 'error',
            'message', 'Failed to get settings: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete user settings
CREATE OR REPLACE FUNCTION public.delete_user_settings(
    p_user_id UUID,
    p_settings_type TEXT
)
RETURNS JSON AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete the settings
    DELETE FROM public.user_settings
    WHERE user_id = p_user_id AND settings_type = p_settings_type;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    IF deleted_count > 0 THEN
        RETURN json_build_object(
            'status', 'success',
            'message', 'Settings deleted successfully'
        );
    ELSE
        RETURN json_build_object(
            'status', 'error',
            'message', 'No settings found to delete'
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'status', 'error',
            'message', 'Failed to delete settings: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 6. ADD COMMENTS
-- =============================================================================

COMMENT ON TABLE public.user_settings IS 'Stores user-specific settings and health profiles';
COMMENT ON COLUMN public.user_settings.user_id IS 'Reference to auth.users.id';
COMMENT ON COLUMN public.user_settings.settings_type IS 'Type of settings (health_profile, preferences, etc.)';
COMMENT ON COLUMN public.user_settings.settings_data IS 'JSONB data containing the actual settings';
