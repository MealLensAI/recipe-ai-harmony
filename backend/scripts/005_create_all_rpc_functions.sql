    'status', 'success',
    'id', new_id,
    'user_id', p_user_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'message', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Get detection history for a user
CREATE OR REPLACE FUNCTION public.get_user_detection_history(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(to_jsonb(dh))
    FROM public.detection_history dh
    WHERE dh.user_id = p_user_id
    ORDER BY dh.created_at DESC
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'message', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- ================================================
-- RPC Functions for meal_plans table
-- ================================================

-- Create or update a meal plan
CREATE OR REPLACE FUNCTION public.upsert_meal_plan(
  p_user_id UUID,
  p_plan_data JSONB,
  p_plan_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  new_id UUID;
BEGIN
  IF p_plan_id IS NULL THEN
    -- Insert new meal plan
    INSERT INTO public.meal_plans (user_id, plan_data)
    VALUES (p_user_id, p_plan_data)
    RETURNING id INTO new_id;
    
    result := jsonb_build_object(
      'status', 'created',
      'id', new_id,
      'user_id', p_user_id
    );
  ELSE
    -- Update existing meal plan
    UPDATE public.meal_plans
    SET 
      plan_data = p_plan_data,
      created_at = NOW()
    WHERE id = p_plan_id AND user_id = p_user_id
    RETURNING id INTO new_id;
    
    IF new_id IS NULL THEN
      result := jsonb_build_object(
        'status', 'error',
        'message', 'Meal plan not found or access denied'
      );
    ELSE
      result := jsonb_build_object(
        'status', 'updated',
        'id', new_id,
        'user_id', p_user_id
      );
    END IF;
  END IF;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'message', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Get meal plans for a user
CREATE OR REPLACE FUNCTION public.get_user_meal_plans(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(to_jsonb(mp))
    FROM public.meal_plans mp
    WHERE mp.user_id = p_user_id
    ORDER BY mp.created_at DESC
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'message', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- ================================================
-- RPC Functions for feedback table
-- ================================================

-- Submit feedback
CREATE OR REPLACE FUNCTION public.submit_feedback(
  p_user_id UUID,
  p_feedback_text TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.feedback (user_id, feedback_text)
  VALUES (p_user_id, p_feedback_text)
  RETURNING id INTO new_id;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'id', new_id,
    'user_id', p_user_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'message', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- ================================================
-- RPC Functions for shared_recipes table
-- ================================================

-- Share a recipe
CREATE OR REPLACE FUNCTION public.share_recipe(
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
  INSERT INTO public.shared_recipes (
    user_id, recipe_type, suggestion, instructions, ingredients,
    detected_foods, analysis_id, youtube, google, resources
  )
  VALUES (
    p_user_id, p_recipe_type, p_suggestion, p_instructions, p_ingredients,
    p_detected_foods, p_analysis_id, p_youtube, p_google, p_resources
  )
  RETURNING id INTO new_id;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'id', new_id,
    'user_id', p_user_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'message', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Get shared recipes (with optional filtering)
CREATE OR REPLACE FUNCTION public.get_shared_recipes(
  p_limit INT DEFAULT 10,
  p_offset INT DEFAULT 0,
  p_recipe_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'status', 'success',
      'data', COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', sr.id,
              'created_at', sr.created_at,
              'recipe_type', sr.recipe_type,
              'suggestion', sr.suggestion,
              'analysis_id', sr.analysis_id
            )
          )
          FROM public.shared_recipes sr
          WHERE (p_recipe_type IS NULL OR sr.recipe_type = p_recipe_type)
          ORDER BY sr.created_at DESC
          LIMIT p_limit OFFSET p_offset
        ),
        '[]'::jsonb
      )
    )
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'message', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- ================================================
-- RPC Functions for user_sessions table
-- ================================================

-- Record user login
CREATE OR REPLACE FUNCTION public.record_login(
  p_user_id UUID,
  p_device_info TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.user_sessions (user_id, login_at, device_info, ip_address)
  VALUES (p_user_id, NOW(), p_device_info, p_ip_address)
  RETURNING id INTO new_id;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'session_id', new_id,
    'user_id', p_user_id,
    'login_time', NOW()
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'message', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Record user logout
CREATE OR REPLACE FUNCTION public.record_logout(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INT;
BEGIN
  UPDATE public.user_sessions
  SET logout_at = NOW()
  WHERE id = p_session_id AND logout_at IS NULL
  RETURNING 1 INTO updated_count;
  
  IF updated_count > 0 THEN
    RETURN jsonb_build_object(
      'status', 'success',
      'session_id', p_session_id,
      'logout_time', NOW()
    );
  ELSE
    RETURN jsonb_build_object(
      'status', 'error',
      'message', 'Session not found or already logged out',
      'session_id', p_session_id
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'message', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- ================================================
-- Grant permissions on all functions
-- ================================================

-- Grant execute permissions on all functions to authenticated users
DO $$
DECLARE
  func_record RECORD;
  func_sql TEXT;
BEGIN
  FOR func_record IN 
    SELECT proname, nspname 
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' 
    AND proname LIKE 'get_%' OR proname LIKE 'upsert_%' 
       OR proname LIKE 'add_%' OR proname LIKE 'submit_%' 
       OR proname LIKE 'record_%' OR proname = 'share_recipe'
  LOOP
    func_sql := format('GRANT EXECUTE ON FUNCTION %I.%s TO authenticated, anon', 
                      func_record.nspname, 
                      func_record.proname || 
                      (SELECT pg_get_function_identity_arguments(p.oid) 
                       FROM pg_proc p 
                       JOIN pg_namespace n ON p.pronamespace = n.oid 
                       WHERE p.proname = func_record.proname 
                       AND n.nspname = func_record.nspname LIMIT 1));
    EXECUTE func_sql;
    RAISE NOTICE 'Granted execute on %', func_record.proname;
  END LOOP;
END $$;
