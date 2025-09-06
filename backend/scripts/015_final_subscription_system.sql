-- =============================================================================
-- FINAL SUBSCRIPTION SYSTEM - Handles existing policies gracefully
-- =============================================================================
-- This script creates the missing tables and functions for the subscription system
-- while working with your existing user_subscriptions table structure.

-- =============================================================================
-- CREATE MISSING TABLES (only if they don't exist)
-- =============================================================================

-- Payment transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id),
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT NOT NULL,
    payment_reference TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    paystack_reference TEXT,
    paystack_transaction_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User trials table
CREATE TABLE IF NOT EXISTS public.user_trials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature usage tracking table
CREATE TABLE IF NOT EXISTS public.feature_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    usage_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, feature_name)
);

-- Paystack webhooks table
CREATE TABLE IF NOT EXISTS public.paystack_webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    paystack_reference TEXT,
    data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =============================================================================

-- Add end_date column to user_subscriptions if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_subscriptions' 
                   AND column_name = 'end_date') THEN
        ALTER TABLE public.user_subscriptions 
        ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add firebase_uid column to user_subscriptions if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_subscriptions' 
                   AND column_name = 'firebase_uid') THEN
        ALTER TABLE public.user_subscriptions 
        ADD COLUMN firebase_uid TEXT;
    END IF;
END $$;

-- =============================================================================
-- CREATE RPC FUNCTIONS
-- =============================================================================

-- Function to get user subscription status
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
    
    -- Get active subscription
    SELECT json_build_object(
        'id', us.id,
        'plan_id', us.plan_id,
        'plan_name', sp.name,
        'status', us.status,
        'start_date', us.start_date,
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
        'user_id', v_user_id,
        'subscription', v_subscription,
        'trial', v_trial,
        'has_active_subscription', v_subscription IS NOT NULL,
        'has_active_trial', v_trial IS NOT NULL AND (v_trial->>'end_date')::timestamp > NOW(),
        'is_trial_expired', v_trial IS NOT NULL AND (v_trial->>'end_date')::timestamp <= NOW(),
        'is_subscription_expired', v_subscription IS NOT NULL AND (v_subscription->>'end_date')::timestamp <= NOW()
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user trial
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
    
    -- Create trial
    v_start_date := NOW();
    v_end_date := v_start_date + (p_duration_days || ' days')::INTERVAL;
    
    INSERT INTO public.user_trials (user_id, start_date, end_date, is_used)
    VALUES (v_user_id, v_start_date, v_end_date, true)
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

-- Function to activate user subscription
CREATE OR REPLACE FUNCTION public.activate_user_subscription(
    p_user_id UUID DEFAULT NULL,
    p_firebase_uid TEXT DEFAULT NULL,
    p_plan_id UUID DEFAULT NULL,
    p_duration_days INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_plan_id UUID;
    v_subscription_id UUID;
    v_start_date TIMESTAMP WITH TIME ZONE;
    v_end_date TIMESTAMP WITH TIME ZONE;
    v_plan_duration INTEGER;
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
    
    -- Get plan duration
    IF p_duration_days IS NOT NULL THEN
        v_plan_duration := p_duration_days;
    ELSIF p_plan_id IS NOT NULL THEN
        SELECT duration_days INTO v_plan_duration
        FROM public.subscription_plans
        WHERE id = p_plan_id;
    ELSE
        RETURN json_build_object(
            'success', false,
            'error', 'Plan ID or duration days required'
        );
    END IF;
    
    -- Create subscription
    v_start_date := NOW();
    v_end_date := v_start_date + (v_plan_duration || ' days')::INTERVAL;
    
    INSERT INTO public.user_subscriptions (user_id, plan_id, status, start_date, end_date, firebase_uid)
    VALUES (v_user_id, p_plan_id, 'active', v_start_date, v_end_date, p_firebase_uid)
    RETURNING id INTO v_subscription_id;
    
    RETURN json_build_object(
        'success', true,
        'subscription_id', v_subscription_id,
        'start_date', v_start_date,
        'end_date', v_end_date,
        'duration_days', v_plan_duration
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can use a feature
CREATE OR REPLACE FUNCTION public.can_user_use_feature(
    p_user_id UUID DEFAULT NULL,
    p_firebase_uid TEXT DEFAULT NULL,
    p_feature_name TEXT DEFAULT 'app_access'
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_has_active_subscription BOOLEAN;
    v_has_active_trial BOOLEAN;
    v_can_use BOOLEAN;
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
    
    -- Check for active subscription
    SELECT EXISTS(
        SELECT 1 FROM public.user_subscriptions 
        WHERE user_id = v_user_id 
        AND status = 'active'
        AND (end_date IS NULL OR end_date > NOW())
    ) INTO v_has_active_subscription;
    
    -- Check for active trial
    SELECT EXISTS(
        SELECT 1 FROM public.user_trials 
        WHERE user_id = v_user_id 
        AND end_date > NOW()
    ) INTO v_has_active_trial;
    
    v_can_use := v_has_active_subscription OR v_has_active_trial;
    
    RETURN json_build_object(
        'success', true,
        'can_use', v_can_use,
        'has_active_subscription', v_has_active_subscription,
        'has_active_trial', v_has_active_trial,
        'feature_name', p_feature_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record feature usage
CREATE OR REPLACE FUNCTION public.record_feature_usage(
    p_user_id UUID DEFAULT NULL,
    p_firebase_uid TEXT DEFAULT NULL,
    p_feature_name TEXT DEFAULT 'app_access'
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
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
    
    -- Insert or update feature usage
    INSERT INTO public.feature_usage (user_id, feature_name, usage_count, last_used_at)
    VALUES (v_user_id, p_feature_name, 1, NOW())
    ON CONFLICT (user_id, feature_name)
    DO UPDATE SET 
        usage_count = feature_usage.usage_count + 1,
        last_used_at = NOW(),
        updated_at = NOW();
    
    RETURN json_build_object(
        'success', true,
        'feature_name', p_feature_name,
        'usage_recorded', true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY (only if not already enabled)
-- =============================================================================

DO $$ 
BEGIN
    -- Enable RLS on tables if not already enabled
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'user_subscriptions' AND relrowsecurity = true) THEN
        ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'payment_transactions' AND relrowsecurity = true) THEN
        ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'user_trials' AND relrowsecurity = true) THEN
        ALTER TABLE public.user_trials ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'feature_usage' AND relrowsecurity = true) THEN
        ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'paystack_webhooks' AND relrowsecurity = true) THEN
        ALTER TABLE public.paystack_webhooks ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- =============================================================================
-- CREATE ROW LEVEL SECURITY POLICIES (only if they don't exist)
-- =============================================================================

-- User subscriptions policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_subscriptions' AND policyname = 'Users can view their own subscriptions') THEN
        CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_subscriptions' AND policyname = 'Users can insert their own subscriptions') THEN
        CREATE POLICY "Users can insert their own subscriptions" ON public.user_subscriptions
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_subscriptions' AND policyname = 'Users can update their own subscriptions') THEN
        CREATE POLICY "Users can update their own subscriptions" ON public.user_subscriptions
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Payment transactions policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_transactions' AND policyname = 'Users can view their own payment transactions') THEN
        CREATE POLICY "Users can view their own payment transactions" ON public.payment_transactions
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_transactions' AND policyname = 'Users can insert their own payment transactions') THEN
        CREATE POLICY "Users can insert their own payment transactions" ON public.payment_transactions
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- User trials policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_trials' AND policyname = 'Users can view their own trials') THEN
        CREATE POLICY "Users can view their own trials" ON public.user_trials
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_trials' AND policyname = 'Users can insert their own trials') THEN
        CREATE POLICY "Users can insert their own trials" ON public.user_trials
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Feature usage policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feature_usage' AND policyname = 'Users can view their own feature usage') THEN
        CREATE POLICY "Users can view their own feature usage" ON public.feature_usage
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feature_usage' AND policyname = 'Users can insert their own feature usage') THEN
        CREATE POLICY "Users can insert their own feature usage" ON public.feature_usage
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feature_usage' AND policyname = 'Users can update their own feature usage') THEN
        CREATE POLICY "Users can update their own feature usage" ON public.feature_usage
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Paystack webhooks policies (admin only)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paystack_webhooks' AND policyname = 'Only service role can access webhooks') THEN
        CREATE POLICY "Only service role can access webhooks" ON public.paystack_webhooks
            FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- =============================================================================
-- CREATE INDEXES FOR PERFORMANCE (only if they don't exist)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end_date ON public.user_subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_firebase_uid ON public.user_subscriptions(firebase_uid);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription_id ON public.payment_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_paystack_reference ON public.payment_transactions(paystack_reference);

CREATE INDEX IF NOT EXISTS idx_user_trials_user_id ON public.user_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trials_end_date ON public.user_trials(end_date);

CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON public.feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_name ON public.feature_usage(feature_name);

CREATE INDEX IF NOT EXISTS idx_paystack_webhooks_event_type ON public.paystack_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_paystack_webhooks_processed ON public.paystack_webhooks(processed);

-- =============================================================================
-- GRANT PERMISSIONS (only if not already granted)
-- =============================================================================

-- Grant permissions to authenticated users
DO $$ 
BEGIN
    -- Grant permissions on user_subscriptions
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_privileges 
                   WHERE table_name = 'user_subscriptions' 
                   AND grantee = 'authenticated' 
                   AND privilege_type = 'SELECT') THEN
        GRANT SELECT, INSERT, UPDATE ON public.user_subscriptions TO authenticated;
    END IF;
    
    -- Grant permissions on payment_transactions
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_privileges 
                   WHERE table_name = 'payment_transactions' 
                   AND grantee = 'authenticated' 
                   AND privilege_type = 'SELECT') THEN
        GRANT SELECT, INSERT ON public.payment_transactions TO authenticated;
    END IF;
    
    -- Grant permissions on user_trials
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_privileges 
                   WHERE table_name = 'user_trials' 
                   AND grantee = 'authenticated' 
                   AND privilege_type = 'SELECT') THEN
        GRANT SELECT, INSERT ON public.user_trials TO authenticated;
    END IF;
    
    -- Grant permissions on feature_usage
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_privileges 
                   WHERE table_name = 'feature_usage' 
                   AND grantee = 'authenticated' 
                   AND privilege_type = 'SELECT') THEN
        GRANT SELECT, INSERT, UPDATE ON public.feature_usage TO authenticated;
    END IF;
END $$;

-- Grant permissions to service role
DO $$ 
BEGIN
    -- Grant permissions on user_subscriptions
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_privileges 
                   WHERE table_name = 'user_subscriptions' 
                   AND grantee = 'service_role' 
                   AND privilege_type = 'SELECT') THEN
        GRANT ALL ON public.user_subscriptions TO service_role;
    END IF;
    
    -- Grant permissions on payment_transactions
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_privileges 
                   WHERE table_name = 'payment_transactions' 
                   AND grantee = 'service_role' 
                   AND privilege_type = 'SELECT') THEN
        GRANT ALL ON public.payment_transactions TO service_role;
    END IF;
    
    -- Grant permissions on user_trials
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_privileges 
                   WHERE table_name = 'user_trials' 
                   AND grantee = 'service_role' 
                   AND privilege_type = 'SELECT') THEN
        GRANT ALL ON public.user_trials TO service_role;
    END IF;
    
    -- Grant permissions on feature_usage
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_privileges 
                   WHERE table_name = 'feature_usage' 
                   AND grantee = 'service_role' 
                   AND privilege_type = 'SELECT') THEN
        GRANT ALL ON public.feature_usage TO service_role;
    END IF;
    
    -- Grant permissions on paystack_webhooks
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_privileges 
                   WHERE table_name = 'paystack_webhooks' 
                   AND grantee = 'service_role' 
                   AND privilege_type = 'SELECT') THEN
        GRANT ALL ON public.paystack_webhooks TO service_role;
    END IF;
END $$;

-- Grant execute permissions on functions
DO $$ 
BEGIN
    -- Grant execute permissions to authenticated
    IF NOT EXISTS (SELECT 1 FROM information_schema.routine_privileges 
                   WHERE routine_name = 'get_user_subscription_status' 
                   AND grantee = 'authenticated') THEN
        GRANT EXECUTE ON FUNCTION public.get_user_subscription_status TO authenticated;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.routine_privileges 
                   WHERE routine_name = 'create_user_trial' 
                   AND grantee = 'authenticated') THEN
        GRANT EXECUTE ON FUNCTION public.create_user_trial TO authenticated;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.routine_privileges 
                   WHERE routine_name = 'activate_user_subscription' 
                   AND grantee = 'authenticated') THEN
        GRANT EXECUTE ON FUNCTION public.activate_user_subscription TO authenticated;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.routine_privileges 
                   WHERE routine_name = 'can_user_use_feature' 
                   AND grantee = 'authenticated') THEN
        GRANT EXECUTE ON FUNCTION public.can_user_use_feature TO authenticated;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.routine_privileges 
                   WHERE routine_name = 'record_feature_usage' 
                   AND grantee = 'authenticated') THEN
        GRANT EXECUTE ON FUNCTION public.record_feature_usage TO authenticated;
    END IF;
    
    -- Grant execute permissions to service_role
    IF NOT EXISTS (SELECT 1 FROM information_schema.routine_privileges 
                   WHERE routine_name = 'get_user_subscription_status' 
                   AND grantee = 'service_role') THEN
        GRANT EXECUTE ON FUNCTION public.get_user_subscription_status TO service_role;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.routine_privileges 
                   WHERE routine_name = 'create_user_trial' 
                   AND grantee = 'service_role') THEN
        GRANT EXECUTE ON FUNCTION public.create_user_trial TO service_role;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.routine_privileges 
                   WHERE routine_name = 'activate_user_subscription' 
                   AND grantee = 'service_role') THEN
        GRANT EXECUTE ON FUNCTION public.activate_user_subscription TO service_role;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.routine_privileges 
                   WHERE routine_name = 'can_user_use_feature' 
                   AND grantee = 'service_role') THEN
        GRANT EXECUTE ON FUNCTION public.can_user_use_feature TO service_role;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.routine_privileges 
                   WHERE routine_name = 'record_feature_usage' 
                   AND grantee = 'service_role') THEN
        GRANT EXECUTE ON FUNCTION public.record_feature_usage TO service_role;
    END IF;
END $$;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Subscription system setup completed successfully!';
    RAISE NOTICE '📊 Created tables: user_subscriptions, payment_transactions, user_trials, feature_usage, paystack_webhooks';
    RAISE NOTICE '🔧 Created functions: get_user_subscription_status, create_user_trial, activate_user_subscription, can_user_use_feature, record_feature_usage';
    RAISE NOTICE '🔒 Enabled Row Level Security and created policies';
    RAISE NOTICE '📈 Created performance indexes';
    RAISE NOTICE '🎯 Your subscription system is now ready to use!';
END $$;
