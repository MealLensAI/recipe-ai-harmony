-- Create subscription and payment system for Paystack integration
-- This includes user plans, usage tracking, and payment history

-- 1. Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- 'free', 'basic', 'premium', 'enterprise'
    display_name TEXT NOT NULL, -- 'Free Plan', 'Basic Plan', 'Premium Plan'
    price_monthly DECIMAL(10,2) DEFAULT 0.00,
    price_yearly DECIMAL(10,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'NGN',
    features JSONB NOT NULL DEFAULT '{}',
    limits JSONB NOT NULL DEFAULT '{}', -- Usage limits
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create user subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'past_due'
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    paystack_subscription_id TEXT UNIQUE, -- Paystack subscription reference
    paystack_customer_id TEXT, -- Paystack customer reference
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, status) -- One active subscription per user
);

-- 3. Create usage tracking table
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id),
    feature_name TEXT NOT NULL, -- 'food_detection', 'meal_planning', 'recipe_generation'
    usage_count INTEGER DEFAULT 1,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, feature_name, usage_date)
);

-- 4. Create payment transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id),
    paystack_transaction_id TEXT UNIQUE NOT NULL,
    paystack_reference TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    status TEXT NOT NULL, -- 'pending', 'success', 'failed', 'abandoned'
    payment_method TEXT, -- 'card', 'bank_transfer', 'ussd', etc.
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Paystack webhook events table
CREATE TABLE IF NOT EXISTS public.paystack_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    paystack_event_id TEXT UNIQUE NOT NULL,
    paystack_reference TEXT,
    event_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable Row Level Security
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paystack_webhooks ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for subscription_plans (public read access)
CREATE POLICY "Allow public read access to subscription plans" 
    ON public.subscription_plans FOR SELECT USING (true);

-- 8. Create RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" 
    ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions" 
    ON public.user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" 
    ON public.user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- 9. Create RLS policies for usage_tracking
CREATE POLICY "Users can view their own usage" 
    ON public.usage_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own usage" 
    ON public.usage_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own usage" 
    ON public.usage_tracking FOR UPDATE USING (auth.uid() = user_id);

-- 10. Create RLS policies for payment_transactions
CREATE POLICY "Users can view their own payments" 
    ON public.payment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own payments" 
    ON public.payment_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 11. Create RLS policies for paystack_webhooks (admin only)
CREATE POLICY "Only service role can access webhooks" 
    ON public.paystack_webhooks FOR ALL USING (auth.role() = 'service_role');

-- 12. Insert default subscription plans
INSERT INTO public.subscription_plans (name, display_name, price_monthly, price_yearly, features, limits) VALUES
('free', 'Free Plan', 0.00, 0.00, 
 '{"food_detection": true, "meal_planning": true, "recipe_generation": true, "basic_support": true}',
 '{"food_detection_per_month": 5, "meal_planning_per_month": 3, "recipe_generation_per_month": 10}'),
('basic', 'Basic Plan', 1000.00, 10000.00,
 '{"food_detection": true, "meal_planning": true, "recipe_generation": true, "priority_support": true, "export_recipes": true}',
 '{"food_detection_per_month": 50, "meal_planning_per_month": 20, "recipe_generation_per_month": 100}'),
('premium', 'Premium Plan', 2500.00, 25000.00,
 '{"food_detection": true, "meal_planning": true, "recipe_generation": true, "priority_support": true, "export_recipes": true, "custom_meal_plans": true, "nutrition_analysis": true}',
 '{"food_detection_per_month": 200, "meal_planning_per_month": 100, "recipe_generation_per_month": 500}'),
('enterprise', 'Enterprise Plan', 5000.00, 50000.00,
 '{"food_detection": true, "meal_planning": true, "recipe_generation": true, "priority_support": true, "export_recipes": true, "custom_meal_plans": true, "nutrition_analysis": true, "api_access": true, "white_label": true}',
 '{"food_detection_per_month": -1, "meal_planning_per_month": -1, "recipe_generation_per_month": -1}')
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits,
    updated_at = NOW();

-- 13. Create function to get user's current subscription
CREATE OR REPLACE FUNCTION public.get_user_subscription(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'subscription', us,
        'plan', sp,
        'usage', ut
    ) INTO result
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    LEFT JOIN (
        SELECT 
            user_id,
            feature_name,
            SUM(usage_count) as total_usage
        FROM public.usage_tracking
        WHERE user_id = p_user_id
        AND usage_date >= DATE_TRUNC('month', CURRENT_DATE)
        GROUP BY user_id, feature_name
    ) ut ON us.user_id = ut.user_id
    WHERE us.user_id = p_user_id
    AND us.status = 'active'
    AND us.current_period_end > NOW();
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- 14. Create function to check if user can use a feature
CREATE OR REPLACE FUNCTION public.can_use_feature(p_user_id UUID, p_feature_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_sub JSONB;
    plan_limits JSONB;
    current_usage INTEGER;
    limit_value INTEGER;
    result JSONB;
BEGIN
    -- Get user's subscription
    user_sub := public.get_user_subscription(p_user_id);
    
    -- If no subscription, use free plan
    IF user_sub = '{}'::jsonb THEN
        SELECT limits INTO plan_limits
        FROM public.subscription_plans
        WHERE name = 'free';
    ELSE
        plan_limits := user_sub->'plan'->'limits';
    END IF;
    
    -- Get current usage for this month
    SELECT COALESCE(SUM(usage_count), 0) INTO current_usage
    FROM public.usage_tracking
    WHERE user_id = p_user_id
    AND feature_name = p_feature_name
    AND usage_date >= DATE_TRUNC('month', CURRENT_DATE);
    
    -- Get limit for this feature
    limit_value := (plan_limits->>(p_feature_name || '_per_month'))::INTEGER;
    
    -- Check if unlimited (-1) or within limit
    IF limit_value = -1 OR current_usage < limit_value THEN
        result := jsonb_build_object(
            'can_use', true,
            'current_usage', current_usage,
            'limit', limit_value,
            'remaining', CASE WHEN limit_value = -1 THEN -1 ELSE limit_value - current_usage END
        );
    ELSE
        result := jsonb_build_object(
            'can_use', false,
            'current_usage', current_usage,
            'limit', limit_value,
            'remaining', 0,
            'message', 'Usage limit exceeded for this month'
        );
    END IF;
    
    RETURN result;
END;
$$;

-- 15. Create function to record usage
CREATE OR REPLACE FUNCTION public.record_usage(p_user_id UUID, p_feature_name TEXT, p_count INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.usage_tracking (user_id, feature_name, usage_count, usage_date)
    VALUES (p_user_id, p_feature_name, p_count, CURRENT_DATE)
    ON CONFLICT (user_id, feature_name, usage_date)
    DO UPDATE SET usage_count = public.usage_tracking.usage_count + p_count;
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- 16. Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_subscription(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_use_feature(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.record_usage(UUID, TEXT, INTEGER) TO authenticated, anon;

-- 17. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date ON public.usage_tracking(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_feature ON public.usage_tracking(feature_name);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_paystack_ref ON public.payment_transactions(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_paystack_webhooks_event_id ON public.paystack_webhooks(paystack_event_id);
CREATE INDEX IF NOT EXISTS idx_paystack_webhooks_processed ON public.paystack_webhooks(processed); 