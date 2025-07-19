-- ================================================
-- Missing Session RPC Functions
-- ================================================

-- Fix save_session to return JSONB for consistency
CREATE OR REPLACE FUNCTION public.save_session(
    p_created_at timestamptz,
    p_session_data jsonb,
    p_session_id uuid,
    p_user_id uuid
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.sessions (created_at, session_data, session_id, user_id)
    VALUES (p_created_at, p_session_data, p_session_id, p_user_id)
    ON CONFLICT (session_id) DO UPDATE
        SET session_data = EXCLUDED.session_data,
            created_at = EXCLUDED.created_at,
            user_id = EXCLUDED.user_id;
    
    RETURN jsonb_build_object(
        'status', 'success',
        'session_id', p_session_id,
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

-- Get a specific session by ID
CREATE OR REPLACE FUNCTION public.get_session(
    p_user_id UUID,
    p_session_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT jsonb_build_object(
            'status', 'success',
            'data', to_jsonb(s)
        )
        FROM public.sessions s
        WHERE s.session_id = p_session_id AND s.user_id = p_user_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'status', 'error',
        'message', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$;

-- Update an existing session
CREATE OR REPLACE FUNCTION public.update_session(
    p_user_id UUID,
    p_session_id UUID,
    p_session_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count INT;
BEGIN
    UPDATE public.sessions
    SET session_data = p_session_data,
        created_at = NOW()
    WHERE session_id = p_session_id AND user_id = p_user_id
    RETURNING 1 INTO updated_count;
    
    IF updated_count > 0 THEN
        RETURN jsonb_build_object(
            'status', 'success',
            'session_id', p_session_id,
            'user_id', p_user_id
        );
    ELSE
        RETURN jsonb_build_object(
            'status', 'error',
            'message', 'Session not found or access denied'
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

-- List all sessions for a user
CREATE OR REPLACE FUNCTION public.list_user_sessions(
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(to_jsonb(s))
        FROM public.sessions s
        WHERE s.user_id = p_user_id
        ORDER BY s.created_at DESC
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
-- Missing Detection History RPC Functions
-- ================================================

-- Update detection history record
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
        RETURN jsonb_build_object(
            'status', 'success',
            'analysis_id', p_analysis_id,
            'user_id', p_user_id
        );
    ELSE
        RETURN jsonb_build_object(
            'status', 'error',
            'message', 'Detection history record not found or access denied'
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

-- Grant execute permissions on all session functions
GRANT EXECUTE ON FUNCTION public.save_session(timestamptz, jsonb, uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_session(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_session(uuid, uuid, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_user_sessions(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_detection_history(text, uuid, text, text, text, text, text, text) TO anon, authenticated; 