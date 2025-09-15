-- =============================================================================
-- USER LIFECYCLE MANAGEMENT SYSTEM
-- =============================================================================
-- This script adds user state management to track the complete user lifecycle:
-- new -> trial_used -> paid -> expired -> paid (renewal cycle)

-- =============================================================================
-- 1. ADD USER STATE COLUMN TO PROFILES TABLE
-- =============================================================================

-- Add user_state column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_state TEXT DEFAULT 'new' 
CHECK (user_state IN ('new', 'trial_used', 'paid', 'expired'));

-- Create index for user_state
CREATE INDEX IF NOT EXISTS idx_profiles_user_state ON public.profiles(user_state);

-- =============================================================================
-- 2. UPDATE USER TRIALS TABLE
-- =============================================================================

-- Add is_used column to user_trials if it doesn't exist
ALTER TABLE public.user_trials 
ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT false;

-- Create index for is_used
CREATE INDEX IF NOT EXISTS idx_user_trials_is_used ON public.user_trials(is_used);

-- =============================================================================
-- 3. CREATE USER STATE MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function to get user's current state and access info
CREATE OR REPLACE FUNCTION public.get_user_lifecycle_status(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    user_profile RECORD;
    active_trial RECORD;
    active_subscription RECORD;
    result JSON;
BEGIN
    -- Get user profile with state
    SELECT * INTO user_profile 
    FROM public.profiles 
    WHERE id = p_user_id;
    
    IF user_profile IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Get active trial (if any)
    SELECT * INTO active_trial
    FROM public.user_trials 
    WHERE user_id = p_user_id 
    AND end_date > NOW()
    AND is_used = false
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Get active subscription (if any)
    SELECT * INTO active_subscription
    FROM public.user_subscriptions 
    WHERE user_id = p_user_id 
    AND status = 'active'
    AND end_date > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Build result based on user state
    result := json_build_object(
        'user_state', user_profile.user_state,
        'has_active_trial', active_trial IS NOT NULL,
        'has_active_subscription', active_subscription IS NOT NULL,
        'can_access_app', CASE 
            WHEN active_subscription IS NOT NULL THEN true
            WHEN active_trial IS NOT NULL AND user_profile.user_state = 'new' THEN true
            ELSE false
        END,
        'trial_info', CASE 
            WHEN active_trial IS NOT NULL THEN json_build_object(
                'id', active_trial.id,
                'start_date', active_trial.start_date,
                'end_date', active_trial.end_date,
                'is_used', active_trial.is_used,
                'remaining_time', EXTRACT(EPOCH FROM (active_trial.end_date - NOW())) * 1000
            )
            ELSE null
        END,
        'subscription_info', CASE 
            WHEN active_subscription IS NOT NULL THEN json_build_object(
                'id', active_subscription.id,
                'plan_id', active_subscription.plan_id,
                'start_date', active_subscription.start_date,
                'end_date', active_subscription.end_date,
                'remaining_time', EXTRACT(EPOCH FROM (active_subscription.end_date - NOW())) * 1000
            )
            ELSE null
        END,
        'message', CASE 
            WHEN user_profile.user_state = 'new' AND active_trial IS NOT NULL THEN 'Trial active'
            WHEN user_profile.user_state = 'trial_used' THEN 'Trial expired - please subscribe'
            WHEN user_profile.user_state = 'paid' AND active_subscription IS NOT NULL THEN 'Subscription active'
            WHEN user_profile.user_state = 'expired' THEN 'Subscription expired - please renew'
            ELSE 'No access'
        END
    );
    
    RETURN json_build_object(
        'success', true,
        'data', result
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize trial for new user
CREATE OR REPLACE FUNCTION public.initialize_user_trial(p_user_id UUID, p_duration_hours INTEGER DEFAULT 48)
RETURNS JSON AS $$
DECLARE
    user_profile RECORD;
    trial_id UUID;
    end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get user profile
    SELECT * INTO user_profile 
    FROM public.profiles 
    WHERE id = p_user_id;
    
    IF user_profile IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Check if user is in 'new' state
    IF user_profile.user_state != 'new' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User is not eligible for trial'
        );
    END IF;
    
    -- Check if user already has an active trial
    IF EXISTS (
        SELECT 1 FROM public.user_trials 
        WHERE user_id = p_user_id 
        AND end_date > NOW()
        AND is_used = false
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User already has an active trial'
        );
    END IF;
    
    -- Calculate end date
    end_date := NOW() + (p_duration_hours || ' hours')::INTERVAL;
    
    -- Create trial
    INSERT INTO public.user_trials (user_id, end_date, is_used)
    VALUES (p_user_id, end_date, false)
    RETURNING id INTO trial_id;
    
    RETURN json_build_object(
        'success', true,
        'trial_id', trial_id,
        'end_date', end_date,
        'duration_hours', p_duration_hours
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark trial as used and update user state
CREATE OR REPLACE FUNCTION public.mark_trial_used(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    user_profile RECORD;
    trial_record RECORD;
BEGIN
    -- Get user profile
    SELECT * INTO user_profile 
    FROM public.profiles 
    WHERE id = p_user_id;
    
    IF user_profile IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Get the most recent trial
    SELECT * INTO trial_record
    FROM public.user_trials 
    WHERE user_id = p_user_id 
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF trial_record IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No trial found for user'
        );
    END IF;
    
    -- Mark trial as used
    UPDATE public.user_trials 
    SET is_used = true, updated_at = NOW()
    WHERE id = trial_record.id;
    
    -- Update user state to trial_used
    UPDATE public.profiles 
    SET user_state = 'trial_used', updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Trial marked as used'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to activate subscription and update user state
CREATE OR REPLACE FUNCTION public.activate_user_subscription_lifecycle(
    p_user_id UUID,
    p_plan_id UUID,
    p_duration_days INTEGER,
    p_paystack_data JSONB DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
    user_profile RECORD;
    subscription_id UUID;
    start_date TIMESTAMP WITH TIME ZONE;
    end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get user profile
    SELECT * INTO user_profile 
    FROM public.profiles 
    WHERE id = p_user_id;
    
    IF user_profile IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Calculate dates
    start_date := NOW();
    end_date := start_date + (p_duration_days || ' days')::INTERVAL;
    
    -- Create subscription
    INSERT INTO public.user_subscriptions (user_id, plan_id, status, start_date, end_date)
    VALUES (p_user_id, p_plan_id, 'active', start_date, end_date)
    RETURNING id INTO subscription_id;
    
    -- Mark any existing trial as used
    UPDATE public.user_trials 
    SET is_used = true, updated_at = NOW()
    WHERE user_id = p_user_id AND is_used = false;
    
    -- Update user state to paid
    UPDATE public.profiles 
    SET user_state = 'paid', updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Create payment transaction record
    INSERT INTO public.payment_transactions (
        user_id, subscription_id, plan_id, amount, currency, 
        payment_method, status, paystack_reference, paystack_transaction_id, metadata
    ) VALUES (
        p_user_id, subscription_id, p_plan_id, 
        COALESCE((p_paystack_data->>'amount')::DECIMAL, 0),
        COALESCE(p_paystack_data->>'currency', 'USD'),
        'paystack', 'completed',
        p_paystack_data->>'reference',
        p_paystack_data->>'transaction_id',
        p_paystack_data
    );
    
    RETURN json_build_object(
        'success', true,
        'subscription_id', subscription_id,
        'start_date', start_date,
        'end_date', end_date,
        'duration_days', p_duration_days
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark subscription as expired
CREATE OR REPLACE FUNCTION public.mark_subscription_expired(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    user_profile RECORD;
    subscription_record RECORD;
BEGIN
    -- Get user profile
    SELECT * INTO user_profile 
    FROM public.profiles 
    WHERE id = p_user_id;
    
    IF user_profile IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Get the most recent subscription
    SELECT * INTO subscription_record
    FROM public.user_subscriptions 
    WHERE user_id = p_user_id 
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF subscription_record IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No subscription found for user'
        );
    END IF;
    
    -- Mark subscription as expired
    UPDATE public.user_subscriptions 
    SET status = 'expired', updated_at = NOW()
    WHERE id = subscription_record.id;
    
    -- Update user state to expired
    UPDATE public.profiles 
    SET user_state = 'expired', updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Subscription marked as expired'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. CREATE ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- =============================================================================
-- 5. CREATE TEST MODE FUNCTION
-- =============================================================================

-- Function to set test mode (1 minute durations)
CREATE OR REPLACE FUNCTION public.set_test_mode(p_user_id UUID, p_test_mode BOOLEAN DEFAULT true)
RETURNS JSON AS $$
DECLARE
    user_profile RECORD;
    test_duration_hours INTEGER;
BEGIN
    -- Get user profile
    SELECT * INTO user_profile 
    FROM public.profiles 
    WHERE id = p_user_id;
    
    IF user_profile IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Set test duration (1 minute = 1/60 hours)
    test_duration_hours := CASE 
        WHEN p_test_mode THEN 1/60  -- 1 minute
        ELSE 48  -- 48 hours (normal)
    END;
    
    -- Update user profile with test mode flag
    UPDATE public.profiles 
    SET 
        user_state = CASE 
            WHEN p_test_mode AND user_state = 'new' THEN 'new'
            ELSE user_state
        END,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN json_build_object(
        'success', true,
        'test_mode', p_test_mode,
        'test_duration_hours', test_duration_hours,
        'message', CASE 
            WHEN p_test_mode THEN 'Test mode enabled (1 minute durations)'
            ELSE 'Test mode disabled (normal durations)'
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 6. CREATE HELPER FUNCTIONS
-- =============================================================================

-- Function to get user state display info
CREATE OR REPLACE FUNCTION public.get_user_state_display(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    user_profile RECORD;
    result JSON;
BEGIN
    -- Get user profile
    SELECT * INTO user_profile 
    FROM public.profiles 
    WHERE id = p_user_id;
    
    IF user_profile IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Build display info based on state
    result := json_build_object(
        'user_state', user_profile.user_state,
        'display_message', CASE user_profile.user_state
            WHEN 'new' THEN 'Welcome! You have a free trial.'
            WHEN 'trial_used' THEN 'Your trial has expired. Please subscribe to continue.'
            WHEN 'paid' THEN 'You have an active subscription.'
            WHEN 'expired' THEN 'Your subscription has expired. Please renew to continue.'
            ELSE 'Unknown state'
        END,
        'show_trial_timer', user_profile.user_state = 'new',
        'show_subscription_timer', user_profile.user_state = 'paid',
        'show_payment_prompt', user_profile.user_state IN ('trial_used', 'expired'),
        'can_access_app', user_profile.user_state IN ('new', 'paid')
    );
    
    RETURN json_build_object(
        'success', true,
        'data', result
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Indexes for user_trials
CREATE INDEX IF NOT EXISTS idx_user_trials_user_id_end_date ON public.user_trials(user_id, end_date);
CREATE INDEX IF NOT EXISTS idx_user_trials_user_id_is_used ON public.user_trials(user_id, is_used);

-- Indexes for user_subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id_status ON public.user_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id_end_date ON public.user_subscriptions(user_id, end_date);

-- =============================================================================
-- 8. COMMENTS AND DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN public.profiles.user_state IS 'User lifecycle state: new, trial_used, paid, expired';
COMMENT ON COLUMN public.user_trials.is_used IS 'Whether the trial has been used and expired';
COMMENT ON FUNCTION public.get_user_lifecycle_status(UUID) IS 'Get comprehensive user lifecycle status';
COMMENT ON FUNCTION public.initialize_user_trial(UUID, INTEGER) IS 'Initialize trial for new user';
COMMENT ON FUNCTION public.mark_trial_used(UUID) IS 'Mark trial as used and update user state';
COMMENT ON FUNCTION public.activate_user_subscription_lifecycle(UUID, UUID, INTEGER, JSONB) IS 'Activate subscription and update user state';
COMMENT ON FUNCTION public.mark_subscription_expired(UUID) IS 'Mark subscription as expired';
COMMENT ON FUNCTION public.set_test_mode(UUID, BOOLEAN) IS 'Enable/disable test mode with 1-minute durations';
COMMENT ON FUNCTION public.get_user_state_display(UUID) IS 'Get user state display information for UI';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- The user lifecycle management system is now ready!
-- 
-- User States:
-- 1. 'new' - Brand new user (gets trial)
-- 2. 'trial_used' - Trial expired, must pay
-- 3. 'paid' - Has active subscription
-- 4. 'expired' - Subscription expired, must renew
--
-- Key Functions:
-- - get_user_lifecycle_status(user_id) - Get complete user status
-- - initialize_user_trial(user_id, duration_hours) - Start trial
-- - mark_trial_used(user_id) - Mark trial as expired
-- - activate_user_subscription_lifecycle(user_id, plan_id, days, paystack_data) - Activate subscription
-- - mark_subscription_expired(user_id) - Mark subscription as expired
-- - set_test_mode(user_id, enabled) - Enable 1-minute test mode
-- - get_user_state_display(user_id) - Get UI display info
