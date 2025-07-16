-- Update 'profiles' table to include firebase_uid and email for mapping
-- This allows us to link Firebase UIDs to Supabase user IDs
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Drop the old detection_history table if it exists to replace it with the new schema
DROP TABLE IF EXISTS public.detection_history;

-- Create the new 'detection_history' table with the specified schema
-- It includes user_id (Supabase UUID) and firebase_uid (Firebase string UID)
-- One of these will be NULL depending on the original authentication method,
-- but the backend will ensure a Supabase user_id is always used for RLS.
CREATE TABLE public.detection_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NULL, -- Supabase user ID
  firebase_uid TEXT NULL, -- Original Firebase UID (for logging/reference)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  detection_type TEXT NOT NULL, -- e.g., 'image', 'ingredient_list'
  input_data TEXT, -- Original input (e.g., image filename, ingredient list string)
  detected_foods TEXT, -- Comma-separated list of detected foods
  recipe_suggestion TEXT, -- The 'suggestion' from shared_recipes
  recipe_instructions TEXT, -- The 'instructions' from shared_recipes
  recipe_ingredients TEXT, -- The 'ingredients' from shared_recipes
  analysis_id TEXT, -- Corresponds to 'analysis_id'
  youtube_link TEXT, -- Corresponds to 'youtube'
  google_link TEXT, -- Corresponds to 'google'
  resources_link TEXT, -- Corresponds to 'resources'
  -- Ensure at least one of user_id or firebase_uid is present for a valid entry
  CONSTRAINT chk_user_id_or_firebase_uid CHECK (user_id IS NOT NULL OR firebase_uid IS NOT NULL)
);

-- Re-apply Row Level Security (RLS) for the updated tables
-- RLS ensures users can only access their own data based on their Supabase user_id

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detection_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

-- Policies for 'profiles' table (assuming they were already set, re-creating for clarity)
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for 'detection_history' table
DROP POLICY IF EXISTS "Users can view their own detection history." ON public.detection_history;
DROP POLICY IF EXISTS "Users can insert their own detection history." ON public.detection_history;
CREATE POLICY "Users can view their own detection history." ON public.detection_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own detection history." ON public.detection_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for 'feedback' table (assuming they were already set, re-creating for clarity)
DROP POLICY IF EXISTS "Users can insert feedback." ON public.feedback;
DROP POLICY IF EXISTS "Users can view their own feedback." ON public.feedback;
CREATE POLICY "Users can insert feedback." ON public.feedback FOR INSERT WITH CHECK (true); -- Allow all users to insert feedback
CREATE POLICY "Users can view their own feedback." ON public.feedback FOR SELECT USING (auth.uid() = user_id);

-- Policies for 'meal_plans' table (assuming they were already set, re-creating for clarity)
DROP POLICY IF EXISTS "Users can view their own meal plans." ON public.meal_plans;
DROP POLICY IF EXISTS "Users can insert their own meal plans." ON public.meal_plans;
DROP POLICY IF EXISTS "Users can update their own meal plans." ON public.meal_plans;
DROP POLICY IF EXISTS "Users can delete their own meal plans." ON public.meal_plans;
CREATE POLICY "Users can view their own meal plans." ON public.meal_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own meal plans." ON public.meal_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own meal plans." ON public.meal_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own meal plans." ON public.meal_plans FOR DELETE USING (auth.uid() = user_id);
