-- =============================================================================
-- FIX SUBSCRIPTION PLANS TABLE
-- =============================================================================
-- This script fixes the existing subscription_plans table by adding missing columns
-- and updating the data structure

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add price_usd column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscription_plans' 
                   AND column_name = 'price_usd' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.subscription_plans ADD COLUMN price_usd DECIMAL(10,2);
    END IF;

    -- Add duration_days column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscription_plans' 
                   AND column_name = 'duration_days' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.subscription_plans ADD COLUMN duration_days INTEGER;
    END IF;

    -- Add features column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscription_plans' 
                   AND column_name = 'features' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.subscription_plans ADD COLUMN features JSONB DEFAULT '[]';
    END IF;

    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscription_plans' 
                   AND column_name = 'is_active' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.subscription_plans ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscription_plans' 
                   AND column_name = 'created_at' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.subscription_plans ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscription_plans' 
                   AND column_name = 'updated_at' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.subscription_plans ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Update existing records with default values if they're null
UPDATE public.subscription_plans 
SET 
    price_usd = CASE 
        WHEN name = 'weekly' THEN 2.00
        WHEN name = 'biweekly' THEN 5.00
        WHEN name = 'monthly' THEN 10.00
        WHEN name = 'yearly' THEN 100.00
        ELSE 10.00
    END,
    duration_days = CASE 
        WHEN name = 'weekly' THEN 7
        WHEN name = 'biweekly' THEN 14
        WHEN name = 'monthly' THEN 28
        WHEN name = 'yearly' THEN 365
        ELSE 28
    END,
    features = CASE 
        WHEN name = 'weekly' THEN '["Basic meal planning", "Food detection", "Recipe suggestions"]'::jsonb
        WHEN name = 'biweekly' THEN '["Weekly features", "Recipe collections", "Meal history"]'::jsonb
        WHEN name = 'monthly' THEN '["Bi-weekly features", "Nutrition tracking", "Advanced analytics"]'::jsonb
        WHEN name = 'yearly' THEN '["Monthly features", "API access", "Priority support"]'::jsonb
        ELSE '["Basic features"]'::jsonb
    END,
    is_active = true,
    created_at = COALESCE(created_at, NOW()),
    updated_at = NOW()
WHERE price_usd IS NULL OR duration_days IS NULL;

-- Insert new plans if they don't exist
INSERT INTO public.subscription_plans (name, display_name, price_usd, duration_days, features, is_active) 
VALUES
    ('weekly', 'Weekly Plan', 2.00, 7, '["Basic meal planning", "Food detection", "Recipe suggestions"]', true),
    ('biweekly', 'Bi-Weekly Plan', 5.00, 14, '["Weekly features", "Recipe collections", "Meal history"]', true),
    ('monthly', 'Monthly Plan', 10.00, 28, '["Bi-weekly features", "Nutrition tracking", "Advanced analytics"]', true),
    ('yearly', 'Yearly Plan', 100.00, 365, '["Monthly features", "API access", "Priority support"]', true)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    price_usd = EXCLUDED.price_usd,
    duration_days = EXCLUDED.duration_days,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'subscription_plans' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify the data
SELECT * FROM public.subscription_plans ORDER BY price_usd;