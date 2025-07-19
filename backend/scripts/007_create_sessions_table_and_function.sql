-- Create a sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.sessions (
    session_id uuid PRIMARY KEY,
    user_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    session_data jsonb
);

-- Create or replace the save_session function
CREATE OR REPLACE FUNCTION public.save_session(
    p_created_at timestamptz,
    p_session_data jsonb,
    p_session_id uuid,
    p_user_id uuid
) RETURNS void AS $$
BEGIN
    INSERT INTO public.sessions (created_at, session_data, session_id, user_id)
    VALUES (p_created_at, p_session_data, p_session_id, p_user_id)
    ON CONFLICT (session_id) DO UPDATE
        SET session_data = EXCLUDED.session_data,
            created_at = EXCLUDED.created_at,
            user_id = EXCLUDED.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.save_session(timestamptz, jsonb, uuid, uuid) TO anon, authenticated;
