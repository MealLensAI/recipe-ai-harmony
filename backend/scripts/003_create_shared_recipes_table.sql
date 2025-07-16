-- Create a 'shared_recipes' table for publicly shareable recipes
CREATE TABLE IF NOT EXISTS public.shared_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) NULL, -- Optional: to track who shared it
  recipe_type TEXT NOT NULL, -- 'ingredient_detection' or 'food_detection'
  suggestion TEXT, -- For ingredient detection flow (recipe name)
  instructions TEXT, -- HTML string
  ingredients TEXT, -- JSON string of array for ingredient detection (e.g., ["apple", "banana"])
  detected_foods TEXT, -- JSON string of array for food detection (e.g., ["pizza", "burger"])
  analysis_id TEXT, -- Unique ID for the initial analysis (from /process)
  youtube TEXT, -- Raw YouTube link (if frontend sends it separately)
  google TEXT, -- Raw Google link (if frontend sends it separately)
  resources TEXT -- Combined HTML string for YouTube/Google sections (as sent by frontend)
);

-- Set up Row Level Security (RLS) for 'shared_recipes'
ALTER TABLE public.shared_recipes ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all shared recipes
CREATE POLICY "Allow public read access to shared recipes." ON public.shared_recipes FOR SELECT USING (true);

-- Allow authenticated users to insert shared recipes
-- If you want unauthenticated users to share, change this to WITH CHECK (true)
CREATE POLICY "Allow authenticated users to insert shared recipes." ON public.shared_recipes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
