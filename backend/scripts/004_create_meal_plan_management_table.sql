-- Create meal_plan_management table and RLS policies
-- This table stores weekly meal plans per user

-- Create extension for gen_random_uuid if not present
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table
CREATE TABLE IF NOT EXISTS public.meal_plan_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  meal_plan JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_week UNIQUE (user_id, start_date)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_meal_plan_user ON public.meal_plan_management (user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_user_start ON public.meal_plan_management (user_id, start_date);
CREATE INDEX IF NOT EXISTS idx_meal_plan_updated_at ON public.meal_plan_management (updated_at DESC);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_meal_plan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_meal_plan_set_updated_at ON public.meal_plan_management;
CREATE TRIGGER trg_meal_plan_set_updated_at
BEFORE UPDATE ON public.meal_plan_management
FOR EACH ROW
EXECUTE FUNCTION public.set_meal_plan_updated_at();

-- Enable Row Level Security
ALTER TABLE public.meal_plan_management ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own meal plans (management)" ON public.meal_plan_management;
DROP POLICY IF EXISTS "Users can insert their own meal plans (management)" ON public.meal_plan_management;
DROP POLICY IF EXISTS "Users can update their own meal plans (management)" ON public.meal_plan_management;
DROP POLICY IF EXISTS "Users can delete their own meal plans (management)" ON public.meal_plan_management;

CREATE POLICY "Users can view their own meal plans (management)"
  ON public.meal_plan_management
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal plans (management)"
  ON public.meal_plan_management
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans (management)"
  ON public.meal_plan_management
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans (management)"
  ON public.meal_plan_management
  FOR DELETE
  USING (auth.uid() = user_id);
