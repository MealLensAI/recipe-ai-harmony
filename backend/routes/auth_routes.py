from flask import Blueprint, request, jsonify, current_app, Response
from typing import Optional
import os
import json
from datetime import datetime
from services.auth_service import AuthService
from services.subscription_service import SubscriptionService
from supabase import Client
from utils.auth_utils import get_user_id_from_token

auth_bp = Blueprint('auth', __name__)


def get_auth_service() -> Optional[AuthService]:
    """Helper function to get the AuthService from the app context."""
    if hasattr(current_app, 'auth_service'):
        return current_app.auth_service
    return None


def get_supabase_client(use_admin: bool = False) -> Optional[Client]:
    """
    Helper function to get the Supabase client from the app context.
    
    Args:
        use_admin: If True, returns a client with service role key for admin operations
    """
    if not hasattr(current_app, 'supabase_service') or not current_app.supabase_service:
        current_app.logger.error("Supabase service not initialized in app context")
        return None
    
    try:
        if use_admin:
            return current_app.supabase_service.supabase
        else:
            from supabase import create_client
            anon_key = os.environ.get('SUPABASE_ANON_KEY')
            if not anon_key:
                current_app.logger.warning("SUPABASE_ANON_KEY not found, falling back to service role key")
                return current_app.supabase_service.supabase
            return create_client(
                current_app.supabase_service.supabase_url,
                anon_key
            )
    except Exception as e:
        current_app.logger.error(f"Error getting Supabase client: {str(e)}")
        return None


## Supabase-only authentication


def _handle_supabase_login(email: str, password: str, supabase, supabase_service) -> tuple[dict, int]:
    """Handle Supabase email/password login."""
    from datetime import datetime
    import uuid
    try:
        # Normalize email for consistent lookups and auth
        normalized_email = str(email or '').strip().lower()
        
        # Helper: robust existence check using profiles, then admin get_user_by_email, then paginated list
        def _user_exists_by_email(norm_email: str) -> bool:
            # 1) profiles table via ADMIN client (bypasses RLS), case-insensitive
            try:
                admin_client_local = get_supabase_client(use_admin=True)
                if admin_client_local:
                    profile_check_local = admin_client_local.table('profiles').select('id,email').ilike('email', norm_email).execute()
                    if bool(profile_check_local.data):
                        return True
            except Exception as profiles_err:
                current_app.logger.warning(f"Admin profiles check failed for {norm_email}: {str(profiles_err)}")

            # 2) admin get_user_by_email if available
            try:
                admin_client_local = admin_client_local or get_supabase_client(use_admin=True)
                if admin_client_local and hasattr(admin_client_local, 'auth') and hasattr(admin_client_local.auth, 'admin'):
                    try:
                        user_res = getattr(admin_client_local.auth.admin, 'get_user_by_email', None)
                        if callable(user_res):
                            res = admin_client_local.auth.admin.get_user_by_email(norm_email)
                            # supabase-py may return dict-like or object with 'user'
                            maybe_user = getattr(res, 'user', None)
                            if maybe_user is None and isinstance(res, dict):
                                maybe_user = res.get('user') or res.get('data')
                            if maybe_user is not None:
                                return True
                    except Exception as get_email_err:
                        current_app.logger.info(f"admin.get_user_by_email unavailable/failed, falling back to list: {str(get_email_err)}")

                    # 3) paginated list fallback
                    try:
                        per_page = 200
                        for page in range(1, 11):
                            try:
                                # try kwargs then positional for compatibility
                                try:
                                    admin_res = admin_client_local.auth.admin.list_users(page=page, per_page=per_page)
                                except TypeError:
                                    admin_res = admin_client_local.auth.admin.list_users(page, per_page)
                            except Exception as list_err:
                                current_app.logger.warning(f"Admin list_users failed on page {page}: {str(list_err)}")
                                break

                            users_list = []
                            try:
                                data_obj = getattr(admin_res, 'data', None)
                                if isinstance(data_obj, dict) and isinstance(data_obj.get('users'), list):
                                    users_list = data_obj.get('users')
                                else:
                                    users_list = getattr(admin_res, 'users', None) or (data_obj if isinstance(data_obj, list) else [])
                            except Exception:
                                users_list = []

                            if not users_list:
                                break

                            for u in users_list:
                                try:
                                    u_email = getattr(u, 'email', None)
                                    if not u_email and isinstance(u, dict):
                                        u_email = u.get('email')
                                    if isinstance(u_email, str) and u_email.strip().lower() == norm_email:
                                        return True
                                except Exception:
                                    continue

                            try:
                                if len(users_list) < per_page:
                                    break
                            except Exception:
                                break
                    except Exception as paging_err:
                        current_app.logger.warning(f"Admin pagination check failed for {norm_email}: {str(paging_err)}")
            except Exception as admin_err:
                current_app.logger.warning(f"Admin existence check failed for {norm_email}: {str(admin_err)}")

            return False

        user_exists = _user_exists_by_email(normalized_email)
        
        # Attempt to authenticate with Supabase
        response = supabase.auth.sign_in_with_password({
            'email': normalized_email,
            'password': password
        })
        
        if not response.user:
            current_app.logger.warning(f"Supabase login failed for {email}: No user in response")
            if not user_exists:
                return {'status': 'error', 'message': "You don't have an account. Please sign up to create one."}, 401
            else:
                return {'status': 'error', 'message': 'Incorrect email or password. Please check your credentials and try again.'}, 401
        # Prefer profiles.id when available; otherwise fall back to Supabase auth user ID
        user_id = None
        try:
            profile = supabase.table('profiles').select('id').ilike('email', normalized_email).execute()
            if profile.data:
                user_id = profile.data[0]['id']
        except Exception:
            user_id = None
        if not user_id:
            user_id = response.user.id
        # Record session
        session_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        success, error = supabase_service.save_session(
            user_id=user_id,
            session_id=session_id,
            session_data={},
            created_at=created_at
        )
        if not success:
            current_app.logger.error(f"Failed to save session for {email}: {error}")
            return {'status': 'error', 'message': 'Failed to record session'}, 500
        current_app.logger.info(f"Successful login for user {email}")
        # Extract tokens from session if available
        access_token = getattr(getattr(response, 'session', None), 'access_token', None)
        refresh_token = getattr(getattr(response, 'session', None), 'refresh_token', None)
        # Build JSON response
        payload = {
            'status': 'success',
            'message': 'Login successful',
            'user_id': user_id,
            'auth_type': 'supabase',
            'session_id': session_id,
            'session_created_at': created_at,
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user_data': {
                'id': response.user.id,
                'email': response.user.email,
                'metadata': response.user.user_metadata
            }
        }

        # Set httpOnly cookies for secure token storage
        from flask import make_response
        resp = make_response(jsonify(payload))
        
        # Determine cookie settings based on environment
        is_dev = current_app.debug or (request.host.split(':')[0] in ['127.0.0.1', 'localhost'])
        cookie_secure = False if is_dev else True
        cookie_samesite = 'Lax' if is_dev else 'None'
        
        # Set access token cookie (24 hours)
        if access_token:
            try:
                resp.set_cookie(
                    'access_token',
                    value=access_token,
                    max_age=24 * 60 * 60,  # 24 hours
                    secure=cookie_secure,
                    httponly=True,
                    samesite=cookie_samesite,
                    path='/'
                )
            except Exception as e:
                current_app.logger.warning(f"Failed to set access_token cookie: {str(e)}")
        
        # Set refresh token cookie (7 days)
        if refresh_token:
            try:
                resp.set_cookie(
                    'refresh_token',
                    value=refresh_token,
                    max_age=7 * 24 * 60 * 60,  # 7 days
                    secure=cookie_secure,
                    httponly=True,
                    samesite=cookie_samesite,
                    path='/'
                )
            except Exception as e:
                current_app.logger.warning(f"Failed to set refresh_token cookie: {str(e)}")
        
        # Set session ID cookie
        if session_id:
            try:
                resp.set_cookie(
                    'session_id',
                    value=session_id,
                    max_age=7 * 24 * 60 * 60,  # 7 days
                    secure=cookie_secure,
                    httponly=True,
                    samesite=cookie_samesite,
                    path='/'
                )
            except Exception as e:
                current_app.logger.warning(f"Failed to set session_id cookie: {str(e)}")

        return resp, 200
    except Exception as e:
        current_app.logger.error(f"Supabase login error for {email}: {str(e)}")
        error_msg = str(e).lower()

@auth_bp.route('/api/auth/refresh', methods=['POST'])
def refresh_token():
    """
    Refresh access token using refresh token.
    Supports both cookie-based and header-based refresh tokens.
    """
    try:
        # Try to get refresh token from cookie first (most secure)
        refresh_token = request.cookies.get('refresh_token')
        
        # Fallback to request body if no cookie
        if not refresh_token:
            data = request.get_json() or {}
            refresh_token = data.get('refresh_token')
        
        if not refresh_token:
            return jsonify({
                'status': 'error',
                'message': 'Refresh token required'
            }), 401

        supabase = get_supabase_client(use_admin=True)
        if not supabase:
            return jsonify({
                'status': 'error',
                'message': 'Service unavailable'
            }), 500

        # Use Supabase to refresh the token
        try:
            response = supabase.auth.refresh_session(refresh_token)
            
            if not response or not hasattr(response, 'session'):
                return jsonify({
                    'status': 'error',
                    'message': 'Invalid refresh token'
                }), 401

            new_access_token = response.session.access_token
            new_refresh_token = response.session.refresh_token
            
            # Get user info
            user_id = response.user.id
            
            # Create response with new tokens
            from flask import make_response
            resp = make_response(jsonify({
                'status': 'success',
                'access_token': new_access_token,
                'refresh_token': new_refresh_token,
                'user_id': user_id
            }))
            
            # Set new tokens in HTTP-only cookies
            is_dev = current_app.debug or (request.host.split(':')[0] in ['127.0.0.1', 'localhost'])
            cookie_secure = False if is_dev else True
            cookie_samesite = 'Lax' if is_dev else 'None'
            
            resp.set_cookie(
                'access_token',
                value=new_access_token,
                max_age=24 * 60 * 60,  # 24 hours
                secure=cookie_secure,
                httponly=True,
                samesite=cookie_samesite,
                path='/'
            )
            
            resp.set_cookie(
                'refresh_token',
                value=new_refresh_token,
                max_age=7 * 24 * 60 * 60,  # 7 days
                secure=cookie_secure,
                httponly=True,
                samesite=cookie_samesite,
                path='/'
            )
            
            return resp, 200
            
        except Exception as refresh_error:
            current_app.logger.error(f"Token refresh error: {str(refresh_error)}")
            return jsonify({
                'status': 'error',
                'message': 'Token refresh failed'
            }), 401

    except Exception as e:
        current_app.logger.error(f"Refresh token endpoint error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Internal server error'
        }), 500


@auth_bp.route('/login', methods=['POST'])
def login_user():
    """
    Supabase email/password login. Returns access and refresh tokens; also sets httpOnly cookie.
    """
    supabase = get_supabase_client()
    supabase_service = getattr(current_app, 'supabase_service', None)

    if not all([supabase, supabase_service]):
        return jsonify({'status': 'error', 'message': 'Authentication service is not properly configured'}), 500

    try:
        data = request.get_json() or {}
    except Exception as e:
        current_app.logger.error(f"Error parsing JSON data: {e}")
        return jsonify({'status': 'error', 'message': 'Invalid request data'}), 400

    email = data.get('email')
    password = data.get('password')
    if email and password:
        response, status = _handle_supabase_login(email, password, supabase, supabase_service)
        if isinstance(response, Response):
            return response, status
        return jsonify(response), status

    current_app.logger.warning("No email/password provided in login request")
    return jsonify({'status': 'error', 'message': 'Email and password are required.'}), 400

@auth_bp.route('/logout', methods=['POST'])
def logout_user():
    """
    Secure logout: Clear all HTTP-only cookies and invalidate session.
    Clients should also clear local storage tokens.
    """
    from flask import make_response
    from datetime import datetime, timedelta
    resp = make_response(jsonify({'status': 'success', 'message': 'Logged out'}))
    
    # Determine cookie settings
    is_dev = current_app.debug or (request.host.split(':')[0] in ['127.0.0.1', 'localhost'])
    cookie_secure = False if is_dev else True
    cookie_samesite = 'Lax' if is_dev else 'None'
    
    # Clear all authentication cookies
    cookies_to_clear = ['access_token', 'refresh_token', 'session_id']
    for cookie_name in cookies_to_clear:
        try:
            resp.set_cookie(
                cookie_name,
                value='',
                max_age=0,
                expires=datetime.utcnow() - timedelta(days=1),
                secure=cookie_secure,
                httponly=True,
                samesite=cookie_samesite,
                path='/'
            )
        except Exception as e:
            current_app.logger.warning(f"Failed to clear {cookie_name} cookie: {str(e)}")
    
    return resp, 200





def _validate_registration_data(data: dict) -> tuple[dict, int]:
    """Validate registration data and return error response if invalid.
    
    Args:
        data: Dictionary containing registration data
        
    Returns:
        tuple: (validated_data, error_response) where error_response is None if validation passes
    """
    # Check required fields
    required_fields = ['email', 'password', 'first_name', 'last_name']
    missing_fields = [field for field in required_fields if not data.get(field)]
    
    if missing_fields:
        return None, {
            'status': 'error',
            'message': 'Missing required fields',
            'missing_fields': missing_fields,
            'error_type': 'validation_error'
        }, 400
        
    # Extract and clean fields
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    signup_type = data.get('signup_type', 'individual').strip().lower()
    
    # Validate email format
    if '@' not in email or '.' not in email.split('@')[-1]:
        return None, {
            'status': 'error',
            'message': 'Invalid email format',
            'error_type': 'validation_error'
        }, 400
        
    # Validate password strength
    if len(password) < 6:
        return None, {
            'status': 'error',
            'message': 'Password must be at least 6 characters long',
            'error_type': 'validation_error'
        }, 400
    
    # Validate signup_type
    if signup_type not in ['individual', 'organization']:
        return None, {
            'status': 'error',
            'message': 'Invalid signup_type. Must be "individual" or "organization"',
            'error_type': 'validation_error'
        }, 400
    
    # Return cleaned data if validation passes
    return {
        'email': email,
        'password': password,
        'first_name': first_name,
        'last_name': last_name,
        'signup_type': signup_type
    }, None, None


def _check_user_exists(supabase: Client, email: str) -> Optional[str]:
    """
    Check if a user with the given email already exists.
    Returns the user_id if found, otherwise None.
    """
    try:
        # Check profiles table first
        try:
            profiles_result = supabase.table('profiles').select('id').eq('email', email).single().execute()
            if profiles_result.data:
                current_app.logger.info(f"User found in profiles: {email}")
                return profiles_result.data['id']
        except Exception as profiles_error:
            # User not found in profiles
            pass
        
        # Since we can't directly query auth.users, we'll rely on the error handling
        # in the user creation process to catch existing users
        current_app.logger.info(f"No existing user found in profiles for email: {email}")
        return None
        
    except Exception as e:
        current_app.logger.error(f"Error checking user existence: {str(e)}")
        return None


def _create_user_with_client_auth(supabase: Client, email: str, password: str, 
                               first_name: str, last_name: str, signup_type: str = 'individual') -> tuple[Optional[str], Optional[dict]]:
    """Attempt to create a user using client auth.
    
    Args:
        supabase: Supabase client instance
        email: User's email
        password: User's password
        first_name: User's first name
        last_name: User's last name
        
    Returns:
        tuple: (user_id, error_response) where error_response is None if successful
    """
    try:
        current_app.logger.info(f"Attempting client auth signup for {email}")
        current_app.logger.info(f"[SIGNUP] Creating user with signup_type: '{signup_type}'")
        
        auth_data = {
            "email": email,
            "password": str(password),
            "options": {
                "data": {}
            }
        }
        
        # Add user metadata if available
        if first_name or last_name or signup_type:
            metadata_to_add = {
                k: v for k, v in {
                    "first_name": first_name,
                    "last_name": last_name,
                    "full_name": f"{first_name} {last_name}" if first_name and last_name else None,
                    "signup_type": signup_type
                }.items() if v is not None
            }
            current_app.logger.info(f"[SIGNUP] Metadata being added to user: {metadata_to_add}")
            auth_data["options"]["data"].update(metadata_to_add)
        
        auth_response = supabase.auth.sign_up(auth_data)
        
        if auth_response and hasattr(auth_response, 'user') and auth_response.user:
            user_id = auth_response.user.id
            current_app.logger.info(f"Successfully created user via client auth: {user_id}")
            # Verify metadata was saved
            if hasattr(auth_response.user, 'user_metadata'):
                current_app.logger.info(f"[SIGNUP] User metadata saved: {auth_response.user.user_metadata}")
            return user_id, None
            
        current_app.logger.warning("Client auth signup returned no user")
        return None, {
            'status': 'error',
            'message': 'Failed to create user',
            'error_type': 'auth_error'
        }
        
    except Exception as e:
        current_app.logger.warning(f"Client auth signup failed: {str(e)}")
        return None, {
            'status': 'error',
            'message': 'Failed to create user using client auth',
            'error_type': 'auth_error',
            'details': str(e)
        }


def _create_user_with_admin_api(supabase: Client, email: str, password: str,
                             first_name: str, last_name: str, signup_type: str = 'individual') -> tuple[Optional[str], Optional[dict]]:
    """Attempt to create a user using the admin API.
    
    Args:
        supabase: Supabase client instance
        email: User's email
        password: User's password
        first_name: User's first name
        last_name: User's last name
        
    Returns:
        tuple: (user_id, error_response) where error_response is None if successful
    """
    try:
        current_app.logger.info(f"Attempting admin API user creation for {email}")
        current_app.logger.info(f"[SIGNUP] Creating user via admin API with signup_type: '{signup_type}'")
        
        # Prepare minimal user data for admin API (avoid unsupported fields)
        user_data = {
            'email': email,
            'password': str(password),
            'email_confirm': True,
            'user_metadata': {
                'first_name': first_name or "",
                'last_name': last_name or "",
                'signup_type': signup_type
            }
        }
        
        # Add full_name if both names are provided
        if first_name and last_name:
            user_data['user_metadata']['full_name'] = f"{first_name} {last_name}"
        
        # Clean up metadata to remove None values
        user_data['user_metadata'] = {
            k: v for k, v in user_data['user_metadata'].items() 
            if v is not None and v != ""
        }
        current_app.logger.info(f"[SIGNUP] Admin API metadata to save: {user_data['user_metadata']}")
        
        # Create user using admin API
        response = supabase.auth.admin.create_user(user_data)
        
        if response and hasattr(response, 'user') and response.user:
            user_id = response.user.id
            current_app.logger.info(f"Successfully created user via admin API: {user_id}")
            # Verify metadata was saved
            if hasattr(response.user, 'user_metadata'):
                current_app.logger.info(f"[SIGNUP] Admin API user metadata saved: {response.user.user_metadata}")
            return user_id, None
            
        current_app.logger.error("Admin API returned no user data")
        return None, {
            'status': 'error',
            'message': 'Failed to create user',
            'error_type': 'auth_error',
            'details': 'No user data in response'
        }
        
    except Exception as e:
        error_msg = str(e)
        current_app.logger.error(f"Admin API user creation failed: {error_msg}")
        
        # Provide better error messages for common cases
        if 'already registered' in error_msg.lower() or 'already exists' in error_msg.lower():
            return None, {
                'status': 'error',
                'message': 'An account with this email already exists. Please login instead.',
                'error_type': 'user_already_exists',
                'suggestion': 'login'
            }
        elif 'not allowed' in error_msg.lower():
            return None, {
                'status': 'error',
                'message': 'User creation not allowed. This email may already be registered.',
                'error_type': 'user_already_exists',
                'suggestion': 'login'
            }
        else:
            return None, {
                'status': 'error',
                'message': 'Failed to create user using admin API',
                'error_type': 'auth_error',
                'details': error_msg
            }


def _create_user_profile(supabase: Client, user_id: str, email: str, 
                       first_name: str, last_name: str, signup_type: str) -> tuple[bool, Optional[dict]]:
    """
    Ensure a profile row exists (upsert) for the given user.
    Supabase triggers sometimes fail to run in certain environments, so we explicitly upsert here.
    """
    try:
        current_app.logger.info(f"Upserting profile for user {user_id}")

        timestamp = datetime.utcnow().isoformat()
        display_name = f"{first_name} {last_name}".strip()
        profile_payload = {
            'id': user_id,
            'email': email,
            'first_name': first_name or None,
            'last_name': last_name or None,
            'display_name': display_name or None,
            'signup_type': signup_type,
            'updated_at': timestamp
        }

        # Preserve existing created_at if the profile already exists
        existing = supabase.table('profiles').select('created_at').eq('id', user_id).execute()
        if existing.data and len(existing.data) > 0:
            profile_payload['created_at'] = existing.data[0].get('created_at')
        else:
            profile_payload['created_at'] = timestamp

        result = supabase.table('profiles').upsert(
            profile_payload,
            on_conflict='id'
        ).execute()

        if result.data is None:
            error_msg = 'Supabase returned no data for profile upsert'
            current_app.logger.error(error_msg)
            return False, {
                'status': 'error',
                'message': 'Failed to persist profile record',
                'error_type': 'profile_upsert_failed',
                'details': error_msg
            }

        current_app.logger.info(f"Profile upserted for user {user_id}")
        return True, None
    except Exception as e:
        error_msg = f"Unexpected error upserting profile: {str(e)}"
        current_app.logger.error(error_msg)
        return False, {
            'status': 'error',
            'message': 'Failed to save user profile',
            'error_type': 'server_error',
            'details': str(e)
        }


@auth_bp.route('/register', methods=['POST'])
def register_user():
    """
    Register a new user with email and password using Supabase Auth.
    First attempts client auth, falls back to admin API if needed.
    """
    current_app.logger.info("Starting user registration process")
    
    # Get the Supabase client with service role key
    if not hasattr(current_app, 'supabase_service') or not current_app.supabase_service:
        error_msg = 'Authentication service is not properly configured'
        current_app.logger.error(error_msg)
        return jsonify({
            'status': 'error',
            'message': error_msg,
            'error_type': 'config_error'
        }), 500
    
    supabase = current_app.supabase_service.supabase
    
    # Parse and validate request data
    try:
        # Parse and validate request data
        data = request.get_json() or {}
        validated_data, error_response, status_code = _validate_registration_data(data)
        if error_response:
            return jsonify(error_response), status_code
            
        # Extract validated data
        email = validated_data['email']
        password = validated_data['password']
        first_name = validated_data['first_name']
        last_name = validated_data['last_name']
        signup_type = validated_data['signup_type']
        
        current_app.logger.info(f"Processing registration for email: {email}")
        current_app.logger.info(f"[SIGNUP] signup_type received: '{signup_type}'")
        
        # Check if user already exists before attempting creation
        existing_user = _check_user_exists(supabase, email)
        if existing_user:
            current_app.logger.info(f"User already exists: {email}")
            return jsonify({
                'status': 'error',
                'message': 'An account with this email already exists. Please login instead.',
                'error_type': 'user_already_exists',
                'suggestion': 'login'
            }), 409
        
        # 1. Try to create user with client auth first
        user_id, error_response = _create_user_with_client_auth(
            supabase, email, password, first_name, last_name, signup_type
        )
        
        # 2. If client auth fails, try admin API
        if not user_id:
            current_app.logger.info("Falling back to admin API for user creation")
            user_id, error_response = _create_user_with_admin_api(
                supabase, email, password, first_name, last_name, signup_type
            )
            
            if not user_id:
                return jsonify(error_response), 400
        
        # 3. Ensure profile row exists (upsert) since the Supabase trigger may not be present in all environments
        profile_created, profile_error = _create_user_profile(
            supabase, user_id, email, first_name, last_name, signup_type
        )
        if not profile_created:
            return jsonify(profile_error), 500

        current_app.logger.info(f"Successfully completed registration for user {user_id}")
        # Create a trial for the new user in Supabase (non-blocking best-effort)
        try:
            subscription_service = SubscriptionService()
            trial_result = subscription_service.create_user_trial(user_id=user_id, duration_days=30)
            if not trial_result.get('success'):
                current_app.logger.warning(f"Failed to create trial for user {user_id}: {trial_result.get('error')}")
            else:
                current_app.logger.info(f"Trial created for user {user_id}: {trial_result}")
        except Exception as trial_err:
            current_app.logger.warning(f"Error creating trial for user {user_id}: {str(trial_err)}")

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


@auth_bp.route('/profile', methods=['GET'])
def get_user_profile():
    """
    Get the current user's profile information.
    """
    try:
        user_id, error = get_user_id_from_token()
        if error:
            return jsonify({'status': 'error', 'message': f'Authentication failed: {error}'}), 401

        supabase = get_supabase_client(use_admin=True)
        if not supabase:
            return jsonify({'status': 'error', 'message': 'Database service not available'}), 500

        # Get user profile from profiles table
        profile_result = supabase.table('profiles').select('*').eq('id', user_id).single().execute()
        
        if not profile_result.data:
            return jsonify({'status': 'error', 'message': 'Profile not found'}), 404

        profile = profile_result.data
        
        return jsonify({
            'status': 'success',
            'profile': {
                'id': profile.get('id'),
                'email': profile.get('email'),
                'first_name': profile.get('first_name'),
                'last_name': profile.get('last_name'),
                'display_name': f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip(),
                'created_at': profile.get('created_at'),
                'updated_at': profile.get('updated_at')
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching user profile: {str(e)}")
        return jsonify({'status': 'error', 'message': 'Failed to fetch profile'}), 500


@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    """
    Change current user's password.
    Requires Authorization header. Validates current password before update.
    """
    try:
        user_id, error = get_user_id_from_token()
        if error:
            return jsonify({'status': 'error', 'message': f'Authentication failed: {error}'}), 401

        # Parse body
        data = request.get_json() or {}
        current_password = data.get('current_password')
        new_password = data.get('new_password')

        if not current_password or not new_password or len(str(new_password)) < 6:
            return jsonify({'status': 'error', 'message': 'Invalid parameters'}), 400

        # Get clients
        admin_client = get_supabase_client(use_admin=True)
        client = get_supabase_client(use_admin=False)
        if not admin_client or not client:
            return jsonify({'status': 'error', 'message': 'Database service not available'}), 500

        # Fetch email from profiles
        profile_res = admin_client.table('profiles').select('email').eq('id', user_id).single().execute()
        if not profile_res.data or not profile_res.data.get('email'):
            return jsonify({'status': 'error', 'message': 'Email not found for user'}), 404

        email = profile_res.data['email']

        # Validate current password by signing in with anon client
        try:
            auth_res = client.auth.sign_in_with_password({
                'email': email,
                'password': str(current_password)
            })
            if not getattr(auth_res, 'user', None):
                return jsonify({'status': 'error', 'message': 'Current password is incorrect'}), 401
        except Exception:
            return jsonify({'status': 'error', 'message': 'Current password is incorrect'}), 401

        # Update password using admin API
        try:
            admin_client.auth.admin.update_user_by_id(user_id, { 'password': str(new_password) })
        except Exception as e:
            return jsonify({'status': 'error', 'message': f'Failed to update password: {str(e)}'}), 500

        return jsonify({'status': 'success', 'message': 'Password updated. Please sign in again.'}), 200

    except Exception as e:
        current_app.logger.error(f"Error changing password: {str(e)}")
        return jsonify({'status': 'error', 'message': 'Server error'}), 500


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """
    Request a password reset email to be sent via Supabase Auth.
    Always returns a generic success message to prevent email enumeration.
    """
    try:
        data = request.get_json() or {}
        email = str(data.get('email', '')).strip().lower()
        provided_redirect = str(data.get('redirect_url', '')).strip()
        if not email or '@' not in email:
            # Return generic response regardless of validity to avoid enumeration
            return jsonify({'status': 'success', 'message': 'If an account exists, a reset link has been sent.'}), 200

        # Use anon client for auth action
        client = get_supabase_client(use_admin=False)
        if not client:
            # Still return generic response
            current_app.logger.error('Supabase client not available for forgot-password')
            return jsonify({'status': 'success', 'message': 'If an account exists, a reset link has been sent.'}), 200

        # Build redirect URL from environment
        frontend_base = os.environ.get('FRONTEND_BASE_URL', '').strip().rstrip('/')
        if not frontend_base:
            # Try to infer from request origin for local/dev flows
            try:
                origin = request.headers.get('Origin', '')
                if origin:
                    frontend_base = origin.rstrip('/')
            except Exception:
                frontend_base = ''
        if not frontend_base:
            frontend_base = 'https://www.meallensai.com'
        default_redirect = f"{frontend_base}/reset-password"
        redirect_url = provided_redirect or os.environ.get('RESET_PASSWORD_REDIRECT_URL', default_redirect)

        sent = False
        try:
            # supabase-py v2 signature (options dict)
            client.auth.reset_password_email(email, { 'redirect_to': redirect_url })
            sent = True
        except TypeError:
            try:
                # Alternate signature (kwarg)
                client.auth.reset_password_email(email, redirect_to=redirect_url)
                sent = True
            except Exception as inner_err:
                current_app.logger.info(f"reset_password_email kwarg form failed: {str(inner_err)}")
        except AttributeError:
            # Fallback to alternate method name if present
            try:
                reset_fn = getattr(getattr(client, 'auth', None), 'reset_password_for_email', None)
                if callable(reset_fn):
                    try:
                        reset_fn(email, { 'redirect_to': redirect_url })
                        sent = True
                    except TypeError:
                        reset_fn(email, redirect_to=redirect_url)
                        sent = True
            except Exception as e2:
                current_app.logger.warning(f"Supabase reset password method not available: {str(e2)}")

        if not sent:
            current_app.logger.warning('Failed to invoke Supabase password reset email (method mismatch or error).')

        # Always return generic success
        return jsonify({'status': 'success', 'message': 'If an account exists, a reset link has been sent.'}), 200
    except Exception as e:
        current_app.logger.error(f"Error in forgot-password: {str(e)}")
        # Do not reveal details; keep response generic
        return jsonify({'status': 'success', 'message': 'If an account exists, a reset link has been sent.'}), 200


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """
    Complete password reset using a Supabase recovery access token from the email link.
    Body: { access_token: string, new_password: string }
    """
    try:
        data = request.get_json() or {}
        access_token = str(data.get('access_token') or '').strip()
        new_password = str(data.get('new_password') or '')
        if not access_token or not new_password or len(new_password) < 6:
            return jsonify({'status': 'error', 'message': 'Invalid parameters'}), 400

        # Use admin to get user from token, then update password
        auth_service = get_auth_service()
        admin_client = get_supabase_client(use_admin=True)
        if not auth_service or not admin_client:
            return jsonify({'status': 'error', 'message': 'Auth service unavailable'}), 500

        try:
            user_obj = admin_client.auth.get_user(access_token)
            supa_user = getattr(user_obj, 'user', None) if user_obj else None
            user_id = getattr(supa_user, 'id', None) if supa_user else None
        except Exception as e:
            current_app.logger.error(f"reset-password get_user failed: {str(e)}")
            user_id = None

        if not user_id:
            return jsonify({'status': 'error', 'message': 'Invalid or expired token'}), 401

        try:
            admin_client.auth.admin.update_user_by_id(user_id, { 'password': str(new_password) })
        except Exception as e:
            return jsonify({'status': 'error', 'message': f'Failed to update password: {str(e)}'}), 500

        return jsonify({'status': 'success', 'message': 'Password reset successful. Please sign in.'}), 200
    except Exception as e:
        current_app.logger.error(f"Error in reset-password: {str(e)}")
        return jsonify({'status': 'error', 'message': 'Server error'}), 500
