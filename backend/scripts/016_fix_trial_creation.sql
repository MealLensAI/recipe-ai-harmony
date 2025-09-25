-- Fix trial creation to set is_used = false initially
-- This fixes the issue where new users were immediately marked as having expired trials

-- Function to create user trial (FIXED VERSION)
CREATE OR REPLACE FUNCTION public.create_user_trial(
    p_user_id UUID DEFAULT NULL,
    p_firebase_uid TEXT DEFAULT NULL,
    p_duration_days INTEGER DEFAULT 7
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_trial_id UUID;
    v_start_date TIMESTAMP WITH TIME ZONE;
    v_end_date TIMESTAMP WITH TIME ZONE;
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
    
    -- Check if user already has a trial
    IF EXISTS (SELECT 1 FROM public.user_trials WHERE user_id = v_user_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User already has a trial'
        );
    END IF;
    
    -- Create trial with is_used = false initially (FIXED!)
    v_start_date := NOW();
    v_end_date := v_start_date + (p_duration_days || ' days')::INTERVAL;
    
    INSERT INTO public.user_trials (user_id, start_date, end_date, is_used)
    VALUES (v_user_id, v_start_date, v_end_date, false)
    RETURNING id INTO v_trial_id;
    
    RETURN json_build_object(
        'success', true,
        'trial_id', v_trial_id,
        'start_date', v_start_date,
        'end_date', v_end_date,
        'duration_days', p_duration_days
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_user_trial TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_trial TO service_role;

-- Also fix any existing trials that were incorrectly marked as used
-- This will help existing users who got stuck with is_used = true
UPDATE public.user_trials 
SET is_used = false 
WHERE is_used = true 
AND end_date > NOW();

-- Log the fix
DO $$
BEGIN
    RAISE NOTICE '✅ Fixed trial creation function - new trials will be created with is_used = false';
    RAISE NOTICE '✅ Fixed existing active trials that were incorrectly marked as used';
END $$;




