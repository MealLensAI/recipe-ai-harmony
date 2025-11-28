-- ═══════════════════════════════════════════════════════════════════
-- ADD SETTINGS HISTORY TABLE
-- ═══════════════════════════════════════════════════════════════════
-- This migration adds a user_settings_history table to track all changes
-- to user settings for audit and change tracking purposes.

-- Create user_settings_history table
CREATE TABLE IF NOT EXISTS public.user_settings_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    settings_type TEXT NOT NULL,
    settings_data JSONB NOT NULL,
    previous_settings_data JSONB, -- Previous version for comparison
    changed_fields TEXT[], -- Array of field names that changed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_settings_history_user_id ON public.user_settings_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_history_type ON public.user_settings_history(settings_type);
CREATE INDEX IF NOT EXISTS idx_user_settings_history_created_at ON public.user_settings_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_settings_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings_history
-- Service role can access all
CREATE POLICY "service_role_all_settings_history" ON public.user_settings_history
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Users can view their own history
CREATE POLICY "Users can view their own settings history" ON public.user_settings_history
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users cannot insert/update/delete their own history (only backend can)
-- This ensures history integrity

-- Grant permissions
GRANT SELECT ON public.user_settings_history TO authenticated;
GRANT ALL ON public.user_settings_history TO service_role;

-- ═══════════════════════════════════════════════════════════════════
-- UPDATE upsert_user_settings FUNCTION TO SAVE HISTORY
-- ═══════════════════════════════════════════════════════════════════

-- Drop existing function
DROP FUNCTION IF EXISTS public.upsert_user_settings(UUID, TEXT, JSONB);

-- Create updated function with history tracking
CREATE OR REPLACE FUNCTION public.upsert_user_settings(
    p_user_id UUID,
    p_settings_type TEXT,
    p_settings_data JSONB
)
RETURNS TABLE (
    status TEXT,
    message TEXT,
    settings_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    settings_id UUID;
    existing_data JSONB;
    changed_fields TEXT[] := ARRAY[]::TEXT[];
    key TEXT;
BEGIN
    -- Get existing settings data if it exists
    SELECT settings_data INTO existing_data
    FROM public.user_settings
    WHERE user_id = p_user_id AND settings_type = p_settings_type;
    
    -- If updating, detect changed fields
    IF existing_data IS NOT NULL THEN
        -- Compare JSONB objects to find changed fields
        FOR key IN SELECT jsonb_object_keys(p_settings_data)
        LOOP
            IF existing_data->>key IS DISTINCT FROM p_settings_data->>key THEN
                changed_fields := array_append(changed_fields, key);
            END IF;
        END LOOP;
        
        -- Also check for removed fields
        FOR key IN SELECT jsonb_object_keys(existing_data)
        LOOP
            IF NOT (p_settings_data ? key) THEN
                changed_fields := array_append(changed_fields, key || ' (removed)');
            END IF;
        END LOOP;
    END IF;
    
    -- Upsert the settings
    INSERT INTO public.user_settings (user_id, settings_type, settings_data, created_at, updated_at)
    VALUES (p_user_id, p_settings_type, p_settings_data, NOW(), NOW())
    ON CONFLICT (user_id, settings_type)
    DO UPDATE SET
        settings_data = EXCLUDED.settings_data,
        updated_at = NOW()
    RETURNING id INTO settings_id;
    
    -- Save to history (always, even for first insert)
    INSERT INTO public.user_settings_history (
        user_id,
        settings_type,
        settings_data,
        previous_settings_data,
        changed_fields,
        created_at,
        created_by
    )
    VALUES (
        p_user_id,
        p_settings_type,
        p_settings_data,
        existing_data,
        changed_fields,
        NOW(),
        p_user_id
    );
    
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.upsert_user_settings(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_user_settings(UUID, TEXT, JSONB) TO service_role;

