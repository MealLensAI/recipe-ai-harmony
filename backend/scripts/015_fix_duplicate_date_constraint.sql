-- Fix duplicate date constraint to allow same date for different health profiles
-- This allows users to have both sickness and non-sickness meal plans for the same week

-- Drop the existing unique constraint that only considers user_id and start_date
ALTER TABLE public.meal_plan_management DROP CONSTRAINT IF EXISTS unique_user_week;

-- Create a new unique constraint that includes has_sickness
-- This allows the same user to have multiple meal plans for the same week
-- as long as they have different has_sickness values
ALTER TABLE public.meal_plan_management 
ADD CONSTRAINT unique_user_week_health_profile 
UNIQUE (user_id, start_date, has_sickness);

-- Add a comment explaining the constraint
COMMENT ON CONSTRAINT unique_user_week_health_profile ON public.meal_plan_management IS 
'Allows users to have separate meal plans for the same week based on health profile (sickness vs non-sickness)';
