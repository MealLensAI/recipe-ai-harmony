-- Fix the get_user_subscription_status function to match actual table schema
-- The issue is that the function references columns that don't exist in the current schema

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_user_subscription_status(UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_user_subscription_status(UUID);

-- Create the corrected function
CREATE OR REPLACE FUNCTION public.get_user_subscription_status(
    p_user_id UUID DEFAULT NULL,
    p_firebase_uid TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_subscription JSON;
    v_trial JSON;
    v_result JSON;
BEGIN
    -- Get user_id from firebase_uid if provided
    IF p_firebase_uid IS NOT NULL THEN
        SELECT id INTO v_user_id 
        FROM auth.users 
        WHERE id IN (
            SELECT id FROM public.profiles 
            WHERE firebase_uid = p_firebase_uid
        );
    ELSE
        v_user_id := p_user_id;
    END IF;
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Get active subscription (using correct column names)
    SELECT json_build_object(
        'id', us.id,
        'plan_id', us.plan_id,
        'plan_name', sp.name,
        'status', us.status,
        'start_date', us.current_period_start,
        'end_date', us.current_period_end,
        'auto_renew', us.auto_renew,
        'created_at', us.created_at,
        'updated_at', us.updated_at
    ) INTO v_subscription
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = v_user_id 
    AND us.status = 'active'
    AND (us.current_period_end IS NULL OR us.current_period_end > NOW())
    ORDER BY us.created_at DESC
    LIMIT 1;
    
    -- Get trial info
    SELECT json_build_object(
        'id', ut.id,
        'start_date', ut.start_date,
        'end_date', ut.end_date,
        'is_used', ut.is_used,
        'created_at', ut.created_at
    ) INTO v_trial
    FROM public.user_trials ut
    WHERE ut.user_id = v_user_id
    ORDER BY ut.created_at DESC
    LIMIT 1;
    
    -- Build result
    v_result := json_build_object(
        'success', true,
        'has_active_subscription', CASE WHEN v_subscription IS NOT NULL THEN true ELSE false END,
        'has_ever_had_subscription', EXISTS(
            SELECT 1 FROM public.user_subscriptions 
            WHERE user_id = v_user_id
        ),
        'subscription', v_subscription,
        'trial', v_trial,
        'can_access_app', CASE 
            WHEN v_subscription IS NOT NULL THEN true
            WHEN v_trial IS NOT NULL AND (v_trial->>'end_date')::timestamp > NOW() AND (v_trial->>'is_used')::boolean = false THEN true
            ELSE false
        END
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_subscription_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_subscription_status(UUID, TEXT) TO service_role;

-- Log the fix
DO $$
BEGIN
    RAISE NOTICE '✅ Fixed get_user_subscription_status function to use correct column names';
    RAISE NOTICE '✅ Function now properly checks trial and subscription status';
END $$;


