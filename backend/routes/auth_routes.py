from flask import Blueprint, request, jsonify, current_app
from typing import Optional, Tuple, Dict, Any
from services.auth_service import AuthService

# Import Supabase client
from supabase import Client

auth_bp = Blueprint('auth', __name__)


def get_auth_service() -> Optional[AuthService]:
    """Helper function to get the AuthService from the app context."""
    if hasattr(current_app, 'auth_service'):
        return current_app.auth_service
    return None


def get_supabase_client() -> Optional[Client]:
    """Helper function to get the Supabase client from the app context."""
    if hasattr(current_app, 'supabase_service'):
        return current_app.supabase_service.supabase
    return None

@auth_bp.route('/test_auth', methods=['GET'])
def test_auth():
    """
    Test endpoint to verify authentication is working.
    Returns the authenticated user's information.
    """
    auth_service = get_auth_service()
    supabase = get_supabase_client()
    
    if not auth_service:
        return jsonify({'status': 'error', 'message': 'Authentication service is not configured'}), 503
    if not supabase:
        return jsonify({'status': 'error', 'message': 'Supabase service is not configured'}), 503
        
    # Get the token from the Authorization header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'status': 'error', 'message': 'Missing or invalid Authorization header'}), 401
    
    try:
        # Verify the token and get the user ID
        user_id, auth_type = auth_service.get_supabase_user_id_from_token(auth_header)
        
        if not user_id:
            return jsonify({'status': 'error', 'message': 'Invalid or expired token'}), 401
            
        # Get user profile from Supabase
        try:
            profile_data = supabase.table('profiles').select('*').eq('id', user_id).single().execute()
            user_data = profile_data.data
        except Exception as e:
            return jsonify({'status': 'error', 'message': f'Failed to fetch user profile: {str(e)}'}), 500
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Authentication error: {str(e)}'}), 500
        
    return jsonify({
        'status': 'success',
        'user_id': user_id,
        'auth_type': auth_type,
        'user_data': user_data,
        'message': 'Authentication successful!'
    }), 200


@auth_bp.route('/login', methods=['POST'])
def login_user():
    """
    Login endpoint that supports both Firebase (for third-party) and Supabase (for traditional email/password) authentication.
    
    - If Authorization header with Bearer token is present: treat as Firebase (third-party) login.
    - If email and password are present in the body: treat as Supabase (traditional) login.
    """
    import uuid
    from datetime import datetime
    auth_service = get_auth_service()
    supabase = get_supabase_client()
    supabase_service = getattr(current_app, 'supabase_service', None)
    
    if not auth_service:
        return jsonify({
            'status': 'error',
            'message': 'Authentication service is not configured'
        }), 500
    if not supabase:
        return jsonify({
            'status': 'error',
            'message': 'Supabase service is not configured'
        }), 500
    if not supabase_service:
        return jsonify({
            'status': 'error',
            'message': 'Supabase service is not configured'
        }), 500

    # Parse request data
    try:
        data = request.get_json() or {}
    except Exception as e:
        print(f"Error parsing JSON data: {e}")
        data = {}
    
    # Check for Firebase token (third-party login)
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        print("[LOGIN] Firebase (third-party) login attempt.")
        try:
            user_id, auth_type = auth_service.get_supabase_user_id_from_token(f'Bearer {token}')
            if not user_id:
                print("[LOGIN] Firebase login error: Invalid or expired Firebase token")
                return jsonify({
                    'status': 'error',
                    'message': 'Invalid or expired Firebase token'
                }), 401
            # --- Record session ---
            session_id = str(uuid.uuid4())
            created_at = datetime.utcnow().isoformat()
            session_data = {}
            success, error = supabase_service.save_session(
                user_id=user_id,
                session_id=session_id,
                session_data=session_data,
                created_at=created_at
            )
            if not success:
                return jsonify({
                    'status': 'error',
                    'message': f'Login succeeded but failed to record session: {error}'
                }), 500
            return jsonify({
                'status': 'success',
                'message': 'Login successful',
                'user_id': user_id,
                'auth_type': auth_type,
                'session_id': session_id,
                'session_created_at': created_at
            }), 200
        except Exception as e:
            print("[LOGIN] Firebase login error:", str(e))
            return jsonify({
                'status': 'error',
                'message': f'Firebase login error: {str(e)}'
            }), 401
    
    # Check for Supabase email/password (traditional login)
    email = data.get('email') if data else None
    password = data.get('password') if data else None
    if email and password:
        print(f"[LOGIN] Supabase (traditional) login attempt: email={email}")
        try:
            response = supabase.auth.sign_in_with_password({
                'email': email,
                'password': password
            })
            print("[LOGIN] Supabase login response:", response)
            if not response.user:
                print("[LOGIN] Supabase login failed: No user in response")
                return jsonify({
                    'status': 'error',
                    'message': 'Invalid email or password'
                }), 401
            # Get user ID from profile table
            profile = supabase.table('profiles').select('id').eq('email', email).execute()
            print("[LOGIN] Supabase profile lookup:", profile)
            if not profile.data or len(profile.data) == 0:
                print("[LOGIN] Supabase login failed: User exists in auth but missing profile")
                return jsonify({
                    'status': 'error',
                    'message': 'User exists in auth but missing profile'
                }), 400
            user_id = profile.data[0]['id']
            # --- Record session ---
            session_id = str(uuid.uuid4())
            created_at = datetime.utcnow().isoformat()
            session_data = {}  # Add more info if needed
            success, error = supabase_service.save_session(
                user_id=user_id,
                session_id=session_id,
                session_data=session_data,
                created_at=created_at
            )
            if not success:
                print(f"[LOGIN] Supabase login succeeded but failed to record session: {error}")
                return jsonify({
                    'status': 'error',
                    'message': f'Login succeeded but failed to record session: {error}'
                }), 500
            print("[LOGIN] Supabase login successful")
            return jsonify({
                'status': 'success',
                'message': 'Login successful',
                'user_id': user_id,
                'auth_type': 'supabase',
                'session_id': session_id,
                'session_created_at': created_at,
                'user_data': {
                    'id': response.user.id,
                    'email': response.user.email,
                    'metadata': response.user.user_metadata
                }
            }), 200
        except Exception as e:
            print("[LOGIN] Supabase login error:", str(e))
            return jsonify({
                'status': 'error',
                'message': f'Supabase login error: {str(e)}'
            }), 401

    # If neither method is provided
    print("[LOGIN] No valid authentication method provided.")
    return jsonify({
        'status': 'error',
        'message': 'Must provide either a Firebase token (for third-party login) or email and password (for traditional login).'
    }), 400


@auth_bp.route('/test-supabase', methods=['GET'])
def test_supabase():
    """Test endpoint to verify Supabase connection and list users"""
    try:
        supabase = get_supabase_client()
        if not supabase:
            return jsonify({
                'status': 'error',
                'message': 'Supabase client not initialized',
                'error_type': 'config_error'
            }), 500
            
        # Test auth admin access
        try:
            print("[DEBUG] Attempting to list users...")
            users = supabase.auth.admin.list_users()
            print(f"[DEBUG] Found {len(users.users) if users and hasattr(users, 'users') else 0} users")
            
            # Test database access
            try:
                print("[DEBUG] Attempting to query profiles table...")
                result = supabase.table('profiles').select('*').limit(1).execute()
                print(f"[DEBUG] Profiles query result: {result}")
                profiles_accessible = True
            except Exception as db_error:
                print(f"[WARNING] Could not query profiles table: {db_error}")
                profiles_accessible = False
            
            return jsonify({
                'status': 'success',
                'message': 'Supabase connection successful',
                'user_count': len(users.users) if users and hasattr(users, 'users') else 0,
                'profiles_accessible': profiles_accessible
            })
            
        except Exception as auth_error:
            print(f"[ERROR] Supabase auth error: {auth_error}")
            return jsonify({
                'status': 'error',
                'message': 'Failed to access Supabase Auth',
                'error': str(auth_error),
                'error_type': 'auth_error'
            }), 500
            
    except Exception as e:
        print(f"[ERROR] Test endpoint error: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Test endpoint failed',
            'error': str(e),
            'error_type': 'test_error'
        }), 500


@auth_bp.route('/register', methods=['POST'])
def register_user():
    """
    Register a new user with email and password using Supabase Auth (admin API).
    """
    auth_service = get_auth_service()
    supabase = get_supabase_client()
    
    if not supabase:
        return jsonify({'status': 'error', 'message': 'Supabase service is not configured'}), 500

    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('firstName')
    last_name = data.get('lastName')

    if not email or not password:
        return jsonify({'status': 'error', 'message': 'Email and password are required'}), 400

    try:
        print(f"[DEBUG] Starting registration for email: {email}")
        
        # 1. Create user in Supabase Auth (admin API)
        try:
            print("[DEBUG] Attempting to create user in Supabase Auth...")
            
            # First, check if the email already exists
            try:
                existing_user = supabase.auth.admin.list_users()
                if any(user.email == email for user in (existing_user.users or [])):
                    raise Exception(f"User with email {email} already exists")
            except Exception as list_error:
                print(f"[WARNING] Could not check for existing users: {list_error}")
            
            # Prepare user data
            user_data = {
                "email": email,
                "password": password,
                "email_confirm": True
            }
            
            # Add user metadata if available
            if first_name or last_name:
                user_data["user_metadata"] = {
                    "first_name": first_name,
                    "last_name": last_name,
                    "full_name": f"{first_name} {last_name}" if first_name and last_name else None
                }
            
            print(f"[DEBUG] Creating user with data: {user_data}")
            
            # Try to create the user
            try:
                response = supabase.auth.admin.create_user(user_data)
                print(f"[DEBUG] Supabase Auth response: {response}")
                
                if not response or not hasattr(response, 'user') or not response.user:
                    error_msg = 'Invalid response from Supabase Auth: Missing user data'
                    print(f"[ERROR] {error_msg}")
                    return jsonify({
                        'status': 'error',
                        'message': 'Failed to create user in Supabase Auth',
                        'error': error_msg,
                        'error_type': 'auth_error',
                        'details': str(response.__dict__) if hasattr(response, '__dict__') else 'No response details available'
                    }), 400

                user_id = response.user.id
                print(f"[DEBUG] User created in Auth with ID: {user_id}")
                
            except Exception as create_error:
                error_msg = str(create_error)
                print(f"[ERROR] Error in supabase.auth.admin.create_user: {error_msg}")
                print(f"[ERROR] Error type: {type(create_error).__name__}")
                print(f"[ERROR] Error args: {getattr(create_error, 'args', 'No args')}")
                
                # Check for specific error cases
                if hasattr(create_error, 'details'):
                    print(f"[ERROR] Error details: {create_error.details}")
                if hasattr(create_error, 'message'):
                    print(f"[ERROR] Error message: {create_error.message}")
                
                raise Exception(f"Failed to create user in Supabase Auth: {error_msg}")
            
        except Exception as auth_error:
            error_msg = str(auth_error)
            print(f"[ERROR] Error creating user in Supabase Auth: {error_msg}")
            return jsonify({
                'status': 'error',
                'message': 'Failed to create user in Supabase Auth',
                'error': error_msg,
                'error_type': 'auth_error'
            }), 400
        
        # 2. Create user profile in the profiles table
        try:
            print("[DEBUG] Attempting to create user profile...")
            profile_data = {
                "id": user_id,
                "email": email,
                "created_at": "now()",
                "updated_at": "now()"
            }
            print(f"[DEBUG] Profile data: {profile_data}")
            
            # Test if we can query the profiles table first
            try:
                test_query = supabase.table('profiles').select('*').limit(1).execute()
                print(f"[DEBUG] Test query result: {test_query}")
            except Exception as test_error:
                print(f"[ERROR] Test query failed: {str(test_error)}")
                # Continue with the insert attempt to get the actual error
            
            # Try to insert the profile
            try:
                print("[DEBUG] Attempting to insert profile...")
                result = supabase.table('profiles').insert(profile_data).execute()
                print(f"[DEBUG] Profile created successfully: {result}")
                
            except Exception as insert_error:
                error_msg = str(insert_error)
                print(f"[ERROR] Failed to insert profile: {error_msg}")
                
                # If the error is because the user already has a profile, update it
                if 'duplicate key value violates unique constraint' in error_msg and 'profiles_pkey' in error_msg:
                    print("[DEBUG] Profile already exists, updating instead...")
                    try:
                        result = supabase.table('profiles') \
                            .update({
                                'email': email,
                                'updated_at': 'now()'
                            }) \
                            .eq('id', user_id) \
                            .execute()
                        print(f"[DEBUG] Profile updated: {result}")
                    except Exception as update_error:
                        print(f"[ERROR] Failed to update profile: {update_error}")
                        raise Exception(f"Failed to update existing profile: {update_error}")
                else:
                    # For other errors, provide more detailed error information
                    if 'relation "profiles" does not exist' in error_msg:
                        print("[ERROR] Profiles table does not exist in the database")
                        print("""
                        [ACTION REQUIRED] Please create the profiles table with the following SQL:
                        
                        CREATE TABLE IF NOT EXISTS public.profiles (
                            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
                            email TEXT UNIQUE NOT NULL,
                            firebase_uid TEXT UNIQUE,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                        );
                        
                        -- Enable Row Level Security
                        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
                        
                        -- Create policies
                        DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
                        CREATE POLICY "Users can view their own profile." 
                            ON public.profiles FOR SELECT 
                            USING (auth.uid() = id);
                            
                        DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
                        CREATE POLICY "Users can insert their own profile." 
                            ON public.profiles FOR INSERT 
                            WITH CHECK (auth.uid() = id);
                            
                        DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
                        CREATE POLICY "Users can update their own profile." 
                            ON public.profiles FOR UPDATE 
                            USING (auth.uid() = id);
                        """)
                    
                    # Re-raise the original error with more context
                    raise Exception(f"Database error creating profile: {error_msg}")
        
        except Exception as profile_error:
            error_msg = str(profile_error)
            print(f"[ERROR] Profile creation failed: {error_msg}")
            
            # Try to clean up the auth user if profile creation failed
            try:
                print(f"[DEBUG] Attempting to clean up auth user {user_id} due to profile creation failure...")
                supabase.auth.admin.delete_user(user_id)
                print("[DEBUG] Auth user cleaned up successfully")
            except Exception as cleanup_error:
                print(f"[WARNING] Failed to clean up auth user: {cleanup_error}")
            
            # Re-raise the error to be handled by the outer exception handler
            raise
        
        # 3. Return success response
        return jsonify({
            'status': 'success',
            'message': 'User registered successfully',
            'user_id': user_id,
            'email': email
        }), 201
            
    except Exception as e:
        error_msg = str(e)
        print(f"[REGISTER] Error during registration: {error_msg}")
        
        # Check for common error cases
        if 'already registered' in error_msg.lower() or \
           ('duplicate key value violates unique constraint' in error_msg.lower() and 'email' in error_msg.lower()):
            return jsonify({
                'status': 'error',
                'message': 'Email is already registered',
                'error': error_msg,
                'error_type': 'duplicate_email'
            }), 409
            
        elif 'password' in error_msg.lower():
            return jsonify({
                'status': 'error',
                'message': 'Invalid password. Password should be at least 6 characters',
                'error': error_msg,
                'error_type': 'invalid_password'
            }), 400
            
        elif 'relation "profiles" does not exist' in error_msg.lower():
            return jsonify({
                'status': 'error',
                'message': 'Database configuration error: profiles table is missing',
                'error': error_msg,
                'error_type': 'database_configuration',
                'solution': 'Please create the profiles table with the correct schema.'
            }), 500
            
        # Default error response
        return jsonify({
            'status': 'error',
            'message': 'Registration failed',
            'error': error_msg,
            'error_type': 'unknown_error'
        }), 500
        return jsonify({'status': 'error', 'message': str(e)}), 400
