-- Create a function to safely create a user profile
-- This function will be called with elevated permissions to bypass RLS
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_email TEXT
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Insert the profile, handling potential conflicts
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    p_user_id, 
    p_email, 
    NOW(), 
    NOW()
  )
  ON CONFLICT (id) 
  DO UPDATE SET 
    email = EXCLUDED.email,
    updated_at = NOW()
  RETURNING jsonb_build_object(
    'status', 'success',
    'user_id', id,
    'email', email
  ) INTO result;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'message', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT) TO authenticated, anon;

-- Create a function to check if a user exists
CREATE OR REPLACE FUNCTION public.user_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = p_email
    UNION
    SELECT 1 FROM public.profiles WHERE email = p_email
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.user_exists(TEXT) TO authenticated, anon;
