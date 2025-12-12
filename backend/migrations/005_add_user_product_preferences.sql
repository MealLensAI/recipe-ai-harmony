-- ═══════════════════════════════════════════════════════════════════
-- ADD USER PRODUCT PREFERENCES TABLE
-- ═══════════════════════════════════════════════════════════════════
-- This migration creates a new table to store user product preferences
-- (whether they are using the cooking or health-focused product)
-- This is separate from existing tables to allow easy rollback if needed

-- Create user_product_preferences table
CREATE TABLE IF NOT EXISTS public.user_product_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    product_type TEXT NOT NULL CHECK (product_type IN ('cooking', 'health')),
    has_health_condition BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_preference UNIQUE (user_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_product_preferences_user_id ON public.user_product_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_product_preferences_product_type ON public.user_product_preferences(product_type);
CREATE INDEX IF NOT EXISTS idx_user_product_preferences_has_health_condition ON public.user_product_preferences(has_health_condition);

-- Enable RLS (Row Level Security)
ALTER TABLE public.user_product_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_product_preferences
-- Service role can access all
CREATE POLICY "service_role_all_product_preferences" ON public.user_product_preferences
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Users can view their own preferences
CREATE POLICY "Users can view their own product preferences" ON public.user_product_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own product preferences" ON public.user_product_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update their own product preferences" ON public.user_product_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_product_preferences TO authenticated;
GRANT ALL ON public.user_product_preferences TO service_role;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_product_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_user_product_preferences_updated_at
    BEFORE UPDATE ON public.user_product_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_product_preferences_updated_at();

-- Create RPC function for upserting product preferences
CREATE OR REPLACE FUNCTION public.upsert_user_product_preference(
    p_user_id UUID,
    p_product_type TEXT,
    p_has_health_condition BOOLEAN
)
RETURNS TABLE (
    status TEXT,
    message TEXT,
    preference_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    preference_id UUID;
BEGIN
    -- Validate product_type
    IF p_product_type NOT IN ('cooking', 'health') THEN
        RETURN QUERY SELECT 
            'error'::TEXT as status,
            'Invalid product_type. Must be "cooking" or "health"'::TEXT as message,
            NULL::UUID as preference_id;
        RETURN;
    END IF;
    
    -- Upsert the preference
    INSERT INTO public.user_product_preferences (user_id, product_type, has_health_condition, created_at, updated_at)
    VALUES (p_user_id, p_product_type, p_has_health_condition, NOW(), NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
        product_type = EXCLUDED.product_type,
        has_health_condition = EXCLUDED.has_health_condition,
        updated_at = NOW()
    RETURNING id INTO preference_id;
    
    RETURN QUERY SELECT 
        'success'::TEXT as status,
        'Product preference saved successfully'::TEXT as message,
        preference_id;
        
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
        'error'::TEXT as status,
        SQLERRM::TEXT as message,
        NULL::UUID as preference_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.upsert_user_product_preference(UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_user_product_preference(UUID, TEXT, BOOLEAN) TO service_role;
