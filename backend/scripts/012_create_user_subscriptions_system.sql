-- =============================================================================
-- USER SUBSCRIPTIONS SYSTEM MIGRATION
-- =============================================================================
-- This script creates all necessary tables for user-specific subscriptions
-- and payment tracking in Supabase

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. SUBSCRIPTION PLANS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    price_usd DECIMAL(10,2) NOT NULL,
    duration_days INTEGER NOT NULL,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, display_name, price_usd, duration_days, features) VALUES
    ('weekly', 'Weekly Plan', 2.00, 7, '["Basic meal planning", "Food detection", "Recipe suggestions"]'),
    ('biweekly', 'Bi-Weekly Plan', 5.00, 14, '["Weekly features", "Recipe collections", "Meal history"]'),
    ('monthly', 'Monthly Plan', 10.00, 28, '["Bi-weekly features", "Nutrition tracking", "Advanced analytics"]'),
    ('yearly', 'Yearly Plan', 100.00, 365, '["Monthly features", "API access", "Priority support"]')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- 2. USER SUBSCRIPTIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    firebase_uid TEXT,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_renew BOOLEAN DEFAULT false,
    cancel_at_period_end BOOLEAN DEFAULT false,
    paystack_subscription_id TEXT,
    paystack_customer_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_firebase_uid ON public.user_subscriptions(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end_date ON public.user_subscriptions(end_date);

-- =============================================================================
-- 3. PAYMENT TRANSACTIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    firebase_uid TEXT,
    subscription_id UUID REFERENCES public.user_subscriptions(id),
    paystack_transaction_id TEXT UNIQUE,
    paystack_reference TEXT UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
    payment_method VARCHAR(50),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for payment transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_firebase_uid ON public.payment_transactions(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_paystack_reference ON public.payment_transactions(paystack_reference);

-- =============================================================================
-- 4. USER TRIALS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_trials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    firebase_uid TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user trials
CREATE INDEX IF NOT EXISTS idx_user_trials_user_id ON public.user_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trials_firebase_uid ON public.user_trials(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_user_trials_is_active ON public.user_trials(is_active);

-- =============================================================================
-- 5. FEATURE USAGE TRACKING TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.feature_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    firebase_uid TEXT,
    feature_name VARCHAR(100) NOT NULL,
    usage_count INTEGER DEFAULT 1,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for feature usage
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON public.feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_firebase_uid ON public.feature_usage(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_date ON public.feature_usage(feature_name, usage_date);

-- =============================================================================
-- 6. PAYSTACK WEBHOOKS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.paystack_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    paystack_event_id TEXT UNIQUE,
    paystack_reference TEXT,
    event_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for webhooks
CREATE INDEX IF NOT EXISTS idx_paystack_webhooks_event_type ON public.paystack_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_paystack_webhooks_processed ON public.paystack_webhooks(processed);

-- =============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paystack_webhooks ENABLE ROW LEVEL SECURITY;

-- Subscription plans - readable by all authenticated users
CREATE POLICY "subscription_plans_read_policy" ON public.subscription_plans
    FOR SELECT USING (auth.role() = 'authenticated');

-- User subscriptions - users can only see their own
CREATE POLICY "user_subscriptions_read_policy" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id OR firebase_uid = auth.jwt() ->> 'firebase_uid');

CREATE POLICY "user_subscriptions_insert_policy" ON public.user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id OR firebase_uid = auth.jwt() ->> 'firebase_uid');

CREATE POLICY "user_subscriptions_update_policy" ON public.user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id OR firebase_uid = auth.jwt() ->> 'firebase_uid');

-- Payment transactions - users can only see their own
CREATE POLICY "payment_transactions_read_policy" ON public.payment_transactions
    FOR SELECT USING (auth.uid() = user_id OR firebase_uid = auth.jwt() ->> 'firebase_uid');

CREATE POLICY "payment_transactions_insert_policy" ON public.payment_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id OR firebase_uid = auth.jwt() ->> 'firebase_uid');

-- User trials - users can only see their own
CREATE POLICY "user_trials_read_policy" ON public.user_trials
    FOR SELECT USING (auth.uid() = user_id OR firebase_uid = auth.jwt() ->> 'firebase_uid');

CREATE POLICY "user_trials_insert_policy" ON public.user_trials
    FOR INSERT WITH CHECK (auth.uid() = user_id OR firebase_uid = auth.jwt() ->> 'firebase_uid');

-- Feature usage - users can only see their own
CREATE POLICY "feature_usage_read_policy" ON public.feature_usage
    FOR SELECT USING (auth.uid() = user_id OR firebase_uid = auth.jwt() ->> 'firebase_uid');

CREATE POLICY "feature_usage_insert_policy" ON public.feature_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id OR firebase_uid = auth.jwt() ->> 'firebase_uid');

-- Webhooks - only service role can access
CREATE POLICY "paystack_webhooks_service_policy" ON public.paystack_webhooks
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- 8. FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at 
    BEFORE UPDATE ON public.subscription_plans 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at 
    BEFORE UPDATE ON public.user_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at 
    BEFORE UPDATE ON public.payment_transactions 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_trials_updated_at 
    BEFORE UPDATE ON public.user_trials 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get user's current subscription status
CREATE OR REPLACE FUNCTION public.get_user_subscription_status(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    current_subscription RECORD;
    current_trial RECORD;
BEGIN
    -- Get current active subscription
    SELECT 
        us.id,
        us.status,
        us.start_date,
        us.end_date,
        sp.name as plan_name,
        sp.display_name as plan_display_name,
        sp.price_usd,
        sp.duration_days,
        sp.features
    INTO current_subscription
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id 
        AND us.status = 'active' 
        AND us.end_date > NOW()
    ORDER BY us.end_date DESC
    LIMIT 1;

    -- Get current trial
    SELECT 
        start_date,
        end_date,
        is_active
    INTO current_trial
    FROM public.user_trials
    WHERE user_id = p_user_id 
        AND is_active = true
    LIMIT 1;

    -- Build result
    result = jsonb_build_object(
        'has_active_subscription', current_subscription.id IS NOT NULL,
        'subscription', CASE 
            WHEN current_subscription.id IS NOT NULL THEN
                jsonb_build_object(
                    'id', current_subscription.id,
                    'plan_name', current_subscription.plan_name,
                    'plan_display_name', current_subscription.plan_display_name,
                    'price_usd', current_subscription.price_usd,
                    'duration_days', current_subscription.duration_days,
                    'features', current_subscription.features,
                    'start_date', current_subscription.start_date,
                    'end_date', current_subscription.end_date,
                    'remaining_days', EXTRACT(DAY FROM (current_subscription.end_date - NOW())),
                    'remaining_hours', EXTRACT(HOUR FROM (current_subscription.end_date - NOW())),
                    'remaining_minutes', EXTRACT(MINUTE FROM (current_subscription.end_date - NOW())),
                    'progress_percentage', 
                        CASE 
                            WHEN current_subscription.duration_days > 0 THEN
                                ROUND(
                                    ((EXTRACT(EPOCH FROM (NOW() - current_subscription.start_date)) / 
                                     (EXTRACT(EPOCH FROM (current_subscription.end_date - current_subscription.start_date)))) * 100
                                )
                            ELSE 0
                        END
                )
            ELSE NULL
        END,
        'trial', CASE 
            WHEN current_trial.id IS NOT NULL THEN
                jsonb_build_object(
                    'start_date', current_trial.start_date,
                    'end_date', current_trial.end_date,
                    'is_active', current_trial.is_active,
                    'remaining_days', EXTRACT(DAY FROM (current_trial.end_date - NOW())),
                    'remaining_hours', EXTRACT(HOUR FROM (current_trial.end_date - NOW())),
                    'remaining_minutes', EXTRACT(MINUTE FROM (current_trial.end_date - NOW())),
                    'progress_percentage',
                        CASE 
                            WHEN current_trial.end_date > current_trial.start_date THEN
                                ROUND(
                                    ((EXTRACT(EPOCH FROM (NOW() - current_trial.start_date)) / 
                                     (EXTRACT(EPOCH FROM (current_trial.end_date - current_trial.start_date)))) * 100
                                )
                            ELSE 0
                        END
                )
            ELSE NULL
        END,
        'can_access_app', 
            CASE 
                WHEN current_subscription.id IS NOT NULL THEN true
                WHEN current_trial.is_active AND current_trial.end_date > NOW() THEN true
                ELSE false
            END
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can use a specific feature
CREATE OR REPLACE FUNCTION public.can_user_use_feature(p_user_id UUID, p_feature_name TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    current_subscription RECORD;
    feature_usage_count INTEGER;
    plan_features JSONB;
BEGIN
    -- Get current active subscription
    SELECT 
        us.id,
        sp.name as plan_name,
        sp.features as plan_features
    INTO current_subscription
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id 
        AND us.status = 'active' 
        AND us.end_date > NOW()
    ORDER BY us.end_date DESC
    LIMIT 1;

    -- Get current month usage for this feature
    SELECT COALESCE(SUM(usage_count), 0)
    INTO feature_usage_count
    FROM public.feature_usage
    WHERE user_id = p_user_id 
        AND feature_name = p_feature_name
        AND usage_date >= DATE_TRUNC('month', CURRENT_DATE);

    -- Check if feature is available in plan
    plan_features = COALESCE(current_subscription.plan_features, '[]'::jsonb);

    result = jsonb_build_object(
        'can_use', 
            CASE 
                WHEN current_subscription.id IS NOT NULL THEN true
                ELSE false
            END,
        'feature_name', p_feature_name,
        'plan_name', COALESCE(current_subscription.plan_name, 'none'),
        'current_usage', feature_usage_count,
        'feature_available', plan_features ? p_feature_name,
        'message', 
            CASE 
                WHEN current_subscription.id IS NULL THEN 'No active subscription'
                WHEN NOT (plan_features ? p_feature_name) THEN 'Feature not available in current plan'
                ELSE 'Feature available'
            END
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record feature usage
CREATE OR REPLACE FUNCTION public.record_feature_usage(p_user_id UUID, p_feature_name TEXT, p_count INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO public.feature_usage (user_id, firebase_uid, feature_name, usage_count, usage_date)
    VALUES (
        p_user_id,
        (SELECT firebase_uid FROM public.profiles WHERE id = p_user_id LIMIT 1),
        p_feature_name,
        p_count,
        CURRENT_DATE
    )
    ON CONFLICT (user_id, feature_name, usage_date)
    DO UPDATE SET 
        usage_count = public.feature_usage.usage_count + p_count,
        updated_at = NOW();

    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user trial
CREATE OR REPLACE FUNCTION public.create_user_trial(p_user_id UUID, p_duration_days INTEGER DEFAULT 7)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user already has a trial
    IF EXISTS (SELECT 1 FROM public.user_trials WHERE user_id = p_user_id AND is_active = true) THEN
        RETURN false;
    END IF;

    -- Create new trial
    INSERT INTO public.user_trials (user_id, firebase_uid, end_date)
    VALUES (
        p_user_id,
        (SELECT firebase_uid FROM public.profiles WHERE id = p_user_id LIMIT 1),
        NOW() + INTERVAL '1 day' * p_duration_days
    );

    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to activate subscription
CREATE OR REPLACE FUNCTION public.activate_user_subscription(
    p_user_id UUID, 
    p_plan_name TEXT, 
    p_paystack_data JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
    plan_record RECORD;
    subscription_id UUID;
    result JSONB;
BEGIN
    -- Get plan details
    SELECT id, duration_days INTO plan_record
    FROM public.subscription_plans
    WHERE name = p_plan_name AND is_active = true
    LIMIT 1;

    IF plan_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Plan not found');
    END IF;

    -- Cancel any existing active subscriptions
    UPDATE public.user_subscriptions
    SET status = 'cancelled', updated_at = NOW()
    WHERE user_id = p_user_id AND status = 'active';

    -- Create new subscription
    INSERT INTO public.user_subscriptions (
        user_id, 
        firebase_uid, 
        plan_id, 
        start_date, 
        end_date,
        paystack_subscription_id,
        paystack_customer_id,
        metadata
    )
    VALUES (
        p_user_id,
        (SELECT firebase_uid FROM public.profiles WHERE id = p_user_id LIMIT 1),
        plan_record.id,
        NOW(),
        NOW() + INTERVAL '1 day' * plan_record.duration_days,
        p_paystack_data->>'subscription_id',
        p_paystack_data->>'customer_id',
        p_paystack_data
    )
    RETURNING id INTO subscription_id;

    -- Deactivate trial if exists
    UPDATE public.user_trials
    SET is_active = false, updated_at = NOW()
    WHERE user_id = p_user_id AND is_active = true;

    result = jsonb_build_object(
        'success', true,
        'subscription_id', subscription_id,
        'plan_name', p_plan_name,
        'duration_days', plan_record.duration_days,
        'end_date', NOW() + INTERVAL '1 day' * plan_record.duration_days
    );

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 9. GRANT PERMISSIONS
-- =============================================================================

-- Grant permissions to authenticated users
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_subscriptions TO authenticated;
GRANT SELECT, INSERT ON public.payment_transactions TO authenticated;
GRANT SELECT, INSERT ON public.user_trials TO authenticated;
GRANT SELECT, INSERT ON public.feature_usage TO authenticated;

-- Grant permissions to service role
GRANT ALL ON public.paystack_webhooks TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_subscription_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_use_feature(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_feature_usage(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_trial(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_user_subscription(UUID, TEXT, JSONB) TO authenticated;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Verify tables were created
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'subscription_plans',
        'user_subscriptions', 
        'payment_transactions',
        'user_trials',
        'feature_usage',
        'paystack_webhooks'
    )
ORDER BY tablename;


