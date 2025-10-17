-- =============================================================================
-- ADD SICKNESS TRACKING TO MEAL PLANS
-- =============================================================================
-- This script adds sickness tracking columns to the meal_plan_management table
-- to support distinguishing between regular and sickness-aware meal plans

-- Add sickness tracking columns to meal_plan_management table
ALTER TABLE public.meal_plan_management 
ADD COLUMN IF NOT EXISTS has_sickness BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sickness_type TEXT DEFAULT '';

-- Add index for sickness queries
CREATE INDEX IF NOT EXISTS idx_meal_plan_sickness ON public.meal_plan_management (user_id, has_sickness);

-- Update existing records to have default values (optional - only if you want to set defaults for existing data)
-- UPDATE public.meal_plan_management 
-- SET has_sickness = false, sickness_type = '' 
-- WHERE has_sickness IS NULL OR sickness_type IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.meal_plan_management.has_sickness IS 'Whether this meal plan was created with sickness settings enabled';
COMMENT ON COLUMN public.meal_plan_management.sickness_type IS 'Type of sickness/health condition when plan was created (e.g., diabetes, hypertension)';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'meal_plan_management' 
AND table_schema = 'public'
ORDER BY ordinal_position;
