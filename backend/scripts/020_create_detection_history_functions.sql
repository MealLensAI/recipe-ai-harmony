-- ================================================
-- RPC Functions for detection_history table
-- ================================================

-- Add detection history entry
CREATE OR REPLACE FUNCTION public.add_detection_history(
  p_user_id UUID,
  p_recipe_type TEXT,
  p_suggestion TEXT DEFAULT NULL,
  p_instructions TEXT DEFAULT NULL,
  p_ingredients TEXT DEFAULT NULL,
  p_detected_foods TEXT DEFAULT NULL,
  p_analysis_id TEXT DEFAULT NULL,
  p_youtube TEXT DEFAULT NULL,
  p_google TEXT DEFAULT NULL,
  p_resources TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.detection_history (
    user_id,
    detection_type,
    recipe_suggestion,
    recipe_instructions,
    recipe_ingredients,
    detected_foods,
    analysis_id,
    youtube_link,
    google_link,
    resources_link
  )
  VALUES (
    p_user_id,
    p_recipe_type,
    p_suggestion,
    p_instructions,
    p_ingredients,
    p_detected_foods,
    p_analysis_id,
    p_youtube,
    p_google,
    p_resources
  )
  RETURNING id INTO new_id;
  
  RETURN jsonb_build_array(
    jsonb_build_object(
      'status', 'success',
      'id', new_id,
      'user_id', p_user_id
    )
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_array(
    jsonb_build_object(
      'status', 'error',
      'message', SQLERRM,
      'detail', SQLSTATE
    )
  );
END;
$$;

-- Update detection history entry
CREATE OR REPLACE FUNCTION public.update_detection_history(
  p_analysis_id TEXT,
  p_user_id UUID,
  p_recipe_suggestion TEXT DEFAULT NULL,
  p_recipe_instructions TEXT DEFAULT NULL,
  p_recipe_ingredients TEXT DEFAULT NULL,
  p_youtube_link TEXT DEFAULT NULL,
  p_google_link TEXT DEFAULT NULL,
  p_resources_link TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INT;
BEGIN
  UPDATE public.detection_history
  SET 
    recipe_suggestion = COALESCE(p_recipe_suggestion, recipe_suggestion),
    recipe_instructions = COALESCE(p_recipe_instructions, recipe_instructions),
    recipe_ingredients = COALESCE(p_recipe_ingredients, recipe_ingredients),
    youtube_link = COALESCE(p_youtube_link, youtube_link),
    google_link = COALESCE(p_google_link, google_link),
    resources_link = COALESCE(p_resources_link, resources_link)
  WHERE analysis_id = p_analysis_id AND user_id = p_user_id
  RETURNING 1 INTO updated_count;
  
  IF updated_count > 0 THEN
    RETURN jsonb_build_array(
      jsonb_build_object(
        'status', 'success',
        'analysis_id', p_analysis_id
      )
    );
  ELSE
    RETURN jsonb_build_array(
      jsonb_build_object(
        'status', 'error',
        'message', 'No record found or user not authorized to update this record.'
      )
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_array(
    jsonb_build_object(
      'status', 'error',
      'message', SQLERRM,
      'detail', SQLSTATE
    )
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.add_detection_history(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_detection_history(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, anon;

