-- =============================================================================
-- COMPLETE SUBSCRIPTION SYSTEM
-- =============================================================================
-- This script creates the complete subscription system with all necessary tables,
-- functions, and policies for user subscriptions, trials, and payments.

-- =============================================================================
-- CREATE TABLES
-- =============================================================================

-- User subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_renew BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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
-- CREATE INDEXES
-- =============================================================================

-- User subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end_date ON public.user_subscriptions(end_date);

-- Payment transactions indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference ON public.payment_transactions(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_paystack_ref ON public.payment_transactions(paystack_reference);

-- User trials indexes
CREATE INDEX IF NOT EXISTS idx_user_trials_user_id ON public.user_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trials_end_date ON public.user_trials(end_date);

-- Feature usage indexes
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON public.feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature ON public.feature_usage(feature_name);

-- =============================================================================
-- CREATE FUNCTIONS
-- =============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to get user subscription status
CREATE OR REPLACE FUNCTION public.get_user_subscription_status(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    trial_info JSON;
    subscription_info JSON;
BEGIN
    -- Get trial information
    SELECT json_build_object(
        'isActive', CASE WHEN ut.end_date > NOW() THEN true ELSE false END,
        'startDate', ut.start_date,
        'endDate', ut.end_date,
        'isExpired', CASE WHEN ut.end_date <= NOW() THEN true ELSE false END,
        'remainingTime', EXTRACT(EPOCH FROM (ut.end_date - NOW())),
        'remainingHours', EXTRACT(EPOCH FROM (ut.end_date - NOW())) / 3600,
        'remainingMinutes', (EXTRACT(EPOCH FROM (ut.end_date - NOW())) % 3600) / 60,
        'formattedRemainingTime', 
            CASE 
                WHEN ut.end_date <= NOW() THEN 'Expired'
                ELSE CONCAT(
                    FLOOR(EXTRACT(EPOCH FROM (ut.end_date - NOW())) / 3600), 'h ',
                    FLOOR((EXTRACT(EPOCH FROM (ut.end_date - NOW())) % 3600) / 60), 'm'
                )
            END,
        'progressPercentage', 
            CASE 
                WHEN ut.end_date <= NOW() THEN 100
                ELSE GREATEST(0, LEAST(100, 
                    (EXTRACT(EPOCH FROM (NOW() - ut.start_date)) / 
                     EXTRACT(EPOCH FROM (ut.end_date - ut.start_date))) * 100
                ))
            END
    ) INTO trial_info
    FROM public.user_trials ut
    WHERE ut.user_id = p_user_id
    ORDER BY ut.created_at DESC
    LIMIT 1;

    -- Get subscription information
    SELECT json_build_object(
        'isActive', CASE WHEN us.end_date > NOW() AND us.status = 'active' THEN true ELSE false END,
        'planName', sp.name,
        'planDisplayName', sp.display_name,
        'startDate', us.start_date,
        'endDate', us.end_date,
        'isExpired', CASE WHEN us.end_date <= NOW() OR us.status != 'active' THEN true ELSE false END,
        'remainingTime', EXTRACT(EPOCH FROM (us.end_date - NOW())),
        'remainingHours', EXTRACT(EPOCH FROM (us.end_date - NOW())) / 3600,
        'remainingMinutes', (EXTRACT(EPOCH FROM (us.end_date - NOW())) % 3600) / 60,
        'formattedRemainingTime', 
            CASE 
                WHEN us.end_date <= NOW() OR us.status != 'active' THEN 'Expired'
                ELSE CONCAT(
                    FLOOR(EXTRACT(EPOCH FROM (us.end_date - NOW())) / 3600), 'h ',
                    FLOOR((EXTRACT(EPOCH FROM (us.end_date - NOW())) % 3600) / 60), 'm'
                )
            END,
        'progressPercentage', 
            CASE 
                WHEN us.end_date <= NOW() OR us.status != 'active' THEN 100
                ELSE GREATEST(0, LEAST(100, 
                    (EXTRACT(EPOCH FROM (NOW() - us.start_date)) / 
                     EXTRACT(EPOCH FROM (us.end_date - us.start_date))) * 100
                ))
            END,
        'status', us.status
    ) INTO subscription_info
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id
    ORDER BY us.created_at DESC
    LIMIT 1;

    -- Build final result
    result := json_build_object(
        'trialInfo', COALESCE(trial_info, 'null'::json),
        'subscriptionInfo', COALESCE(subscription_info, 'null'::json),
        'hasActiveSubscription', CASE WHEN subscription_info IS NOT NULL AND (subscription_info->>'isActive')::boolean THEN true ELSE false END,
        'isTrialExpired', CASE WHEN trial_info IS NOT NULL AND (trial_info->>'isExpired')::boolean THEN true ELSE false END,
        'isSubscriptionExpired', CASE WHEN subscription_info IS NOT NULL AND (subscription_info->>'isExpired')::boolean THEN true ELSE false END,
        'canAccess', CASE 
            WHEN subscription_info IS NOT NULL AND (subscription_info->>'isActive')::boolean THEN true
            WHEN trial_info IS NOT NULL AND (trial_info->>'isActive')::boolean THEN true
            ELSE false
        END
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user trial
CREATE OR REPLACE FUNCTION public.create_user_trial(p_user_id UUID, p_duration_hours INTEGER DEFAULT 24)
RETURNS JSON AS $$
DECLARE
    trial_id UUID;
    end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Check if user already has an active trial
    IF EXISTS (
        SELECT 1 FROM public.user_trials 
        WHERE user_id = p_user_id 
        AND end_date > NOW()
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User already has an active trial'
        );
    END IF;

    -- Calculate end date
    end_date := NOW() + (p_duration_hours || ' hours')::INTERVAL;

    -- Create trial
    INSERT INTO public.user_trials (user_id, end_date)
    VALUES (p_user_id, end_date)
    RETURNING id INTO trial_id;

    RETURN json_build_object(
        'success', true,
        'trialId', trial_id,
        'endDate', end_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to activate user subscription
CREATE OR REPLACE FUNCTION public.activate_user_subscription(
    p_user_id UUID,
    p_plan_id UUID,
    p_duration_days INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    subscription_id UUID;
    plan_duration INTEGER;
    start_date TIMESTAMP WITH TIME ZONE;
    end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get plan duration
    IF p_duration_days IS NOT NULL THEN
        plan_duration := p_duration_days;
    ELSE
        SELECT duration_days INTO plan_duration
        FROM public.subscription_plans
        WHERE id = p_plan_id;
    END IF;

    -- Calculate dates
    start_date := NOW();
    end_date := start_date + (plan_duration || ' days')::INTERVAL;

    -- Create subscription
    INSERT INTO public.user_subscriptions (user_id, plan_id, start_date, end_date, status)
    VALUES (p_user_id, p_plan_id, start_date, end_date, 'active')
    RETURNING id INTO subscription_id;

    RETURN json_build_object(
        'success', true,
        'subscriptionId', subscription_id,
        'startDate', start_date,
        'endDate', end_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- CREATE TRIGGERS
-- =============================================================================

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_trials_updated_at
    BEFORE UPDATE ON public.user_trials
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_usage_updated_at
    BEFORE UPDATE ON public.feature_usage
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- CREATE ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paystack_webhooks ENABLE ROW LEVEL SECURITY;

-- User subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON public.user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON public.user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Payment transactions policies
CREATE POLICY "Users can view their own payment transactions" ON public.payment_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment transactions" ON public.payment_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User trials policies
CREATE POLICY "Users can view their own trials" ON public.user_trials
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trials" ON public.user_trials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Feature usage policies
CREATE POLICY "Users can view their own feature usage" ON public.feature_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feature usage" ON public.feature_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feature usage" ON public.feature_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- Paystack webhooks policies (service role only)
CREATE POLICY "Service role can manage webhooks" ON public.paystack_webhooks
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.user_subscriptions TO authenticated;
GRANT SELECT, INSERT ON public.payment_transactions TO authenticated;
GRANT SELECT, INSERT ON public.user_trials TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.feature_usage TO authenticated;

-- Grant permissions to service role
GRANT ALL ON public.user_subscriptions TO service_role;
GRANT ALL ON public.payment_transactions TO service_role;
GRANT ALL ON public.user_trials TO service_role;
GRANT ALL ON public.feature_usage TO service_role;
GRANT ALL ON public.paystack_webhooks TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_user_subscription_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_trial(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_user_subscription(UUID, UUID, INTEGER) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_user_subscription_status(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_user_trial(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.activate_user_subscription(UUID, UUID, INTEGER) TO service_role;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_subscriptions', 'payment_transactions', 'user_trials', 'feature_usage', 'paystack_webhooks')
ORDER BY table_name;

-- Verify functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_subscription_status', 'create_user_trial', 'activate_user_subscription')
ORDER BY routine_name;

-- Verify subscription plans
SELECT * FROM public.subscription_plans ORDER BY price_usd;
