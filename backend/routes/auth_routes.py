from flask import Blueprint, request, jsonify, current_app
from typing import Optional
import os
import json
from services.auth_service import AuthService
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


def _handle_firebase_login(token: str, supabase_service) -> tuple[dict, int]:
    """Handle Firebase third-party login.
    
    Args:
        token: Firebase authentication token
        supabase_service: Supabase service instance for session management
        
    Returns:
        tuple: (response_data, status_code)
    """
    from datetime import datetime
    import uuid
    
    try:
        auth_service = get_auth_service()
        if not auth_service:
            return {'status': 'error', 'message': 'Authentication service not configured'}, 500
            
        user_id, auth_type = auth_service.get_supabase_user_id_from_token(f'Bearer {token}')
        if not user_id:
            current_app.logger.warning("Firebase login failed: Invalid or expired token")
            return {'status': 'error', 'message': 'Invalid or expired Firebase token'}, 401
            
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
            current_app.logger.error(f"Failed to save session: {error}")
            return {'status': 'error', 'message': 'Failed to record session'}, 500
            
        return {
            'status': 'success',
            'message': 'Login successful',
            'user_id': user_id,
            'auth_type': auth_type,
            'session_id': session_id,
            'session_created_at': created_at
        }, 200
        
    except Exception as e:
        current_app.logger.error(f"Firebase login error: {str(e)}")
        return {'status': 'error', 'message': 'Authentication failed'}, 401


def _handle_supabase_login(email: str, password: str, supabase, supabase_service) -> tuple[dict, int]:
    """Handle Supabase email/password login."""
    from datetime import datetime
    import uuid
    try:
        # Attempt to authenticate with Supabase
        response = supabase.auth.sign_in_with_password({
            'email': email,
            'password': password
        })
        if not response.user:
            current_app.logger.warning(f"Supabase login failed for {email}: No user in response")
            return {'status': 'error', 'message': 'Invalid email or password'}, 401
        # Get user profile
        profile = supabase.table('profiles').select('id').eq('email', email).execute()
        if not profile.data:
            current_app.logger.error(f"User {email} exists in auth but missing profile")
            return {'status': 'error', 'message': 'User profile not found'}, 400
        user_id = profile.data[0]['id']
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
        return {
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
        }, 200
    except Exception as e:
        current_app.logger.error(f"Supabase login error for {email}: {str(e)}")
        return {'status': 'error', 'message': 'Login failed'}, 401


@auth_bp.route('/login', methods=['POST'])
def login_user():
    """
    Login endpoint that supports both Firebase (for third-party) and Supabase (for traditional email/password) authentication.
    
    - If Authorization header with Bearer token is present: treat as Firebase (third-party) login.
    - If email and password are present in the body: treat as Supabase (traditional) login.
    """
    # Get services
    supabase = get_supabase_client()
    supabase_service = getattr(current_app, 'supabase_service', None)
    
    # Validate services
    if not all([supabase, supabase_service]):
        return jsonify({
            'status': 'error',
            'message': 'Authentication service is not properly configured'
        }), 500

    # Parse request data
    try:
        data = request.get_json() or {}
    except Exception as e:
        current_app.logger.error(f"Error parsing JSON data: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Invalid request data'
        }), 400
    
    # Check for Firebase token (third-party login)
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        response, status = _handle_firebase_login(auth_header.split(' ')[1], supabase_service)
        return jsonify(response), status
    
    # Check for Supabase email/password (traditional login)
    email = data.get('email')
    password = data.get('password')
    if email and password:
        response, status = _handle_supabase_login(email, password, supabase, supabase_service)
        return jsonify(response), status

    # If neither method is provided
    current_app.logger.warning("No valid authentication method provided in login request")
    return jsonify({
        'status': 'error',
        'message': 'Must provide either a Firebase token or email and password.'
    }), 400





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
    
    # Return cleaned data if validation passes
    return {
        'email': email,
        'password': password,
        'first_name': first_name,
        'last_name': last_name
    }, None, None


def _create_user_with_client_auth(supabase: Client, email: str, password: str, 
                               first_name: str, last_name: str) -> tuple[Optional[str], Optional[dict]]:
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
        
        auth_data = {
            "email": email,
            "password": str(password),
            "options": {
                "data": {}
            }
        }
        
        # Add user metadata if available
        if first_name or last_name:
            auth_data["options"]["data"].update({
                k: v for k, v in {
                    "first_name": first_name,
                    "last_name": last_name,
                    "full_name": f"{first_name} {last_name}" if first_name and last_name else None
                }.items() if v is not None
            })
        
        auth_response = supabase.auth.sign_up(auth_data)
        
        if auth_response and hasattr(auth_response, 'user') and auth_response.user:
            user_id = auth_response.user.id
            current_app.logger.info(f"Successfully created user via client auth: {user_id}")
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
                             first_name: str, last_name: str) -> tuple[Optional[str], Optional[dict]]:
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
        
        # Prepare user data for admin API
        user_data = {
            'email': email,
            'password': str(password),
            'email_confirm': True,
            'user_metadata': {
                'first_name': first_name or "",
                'last_name': last_name or ""
            },
            'app_metadata': {
                'provider': 'email',
                'providers': ['email']
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
        
        # Create user using admin API
        response = supabase.auth.admin.create_user(user_data)
        
        if response and hasattr(response, 'user') and response.user:
            user_id = response.user.id
            current_app.logger.info(f"Successfully created user via admin API: {user_id}")
            return user_id, None
            
        current_app.logger.error("Admin API returned no user data")
        return None, {
            'status': 'error',
            'message': 'Failed to create user',
            'error_type': 'auth_error',
            'details': 'No user data in response'
        }
        
    except Exception as e:
        current_app.logger.error(f"Admin API user creation failed: {str(e)}")
        return None, {
            'status': 'error',
            'message': 'Failed to create user using admin API',
            'error_type': 'auth_error',
            'details': str(e)
        }


def _create_user_profile(supabase: Client, user_id: str, email: str, 
                       first_name: str, last_name: str) -> tuple[bool, Optional[dict]]:
    """
    Update user profile in the database (only if it already exists).
    Should not be called during registration, as the trigger will create the profile row.
    Use this for profile updates after registration.
    """
    try:
        current_app.logger.info(f"Updating profile for user {user_id}")
        update_data = {
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
            'updated_at': 'now()'
        }
        result = supabase.table('profiles').update(update_data).eq('id', user_id).execute()
        if result.data:
            current_app.logger.info(f"Successfully updated profile for user {user_id}")
            return True, None
        else:
            error_msg = f"Profile not found for user {user_id}"
            current_app.logger.warning(error_msg)
            return False, {
                'status': 'error',
                'message': 'Profile not found',
                'error_type': 'not_found',
                'details': error_msg
            }
    except Exception as e:
        error_msg = f"Unexpected error in profile update: {str(e)}"
        current_app.logger.error(error_msg)
        return False, {
            'status': 'error',
            'message': 'Failed to update user profile',
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
        
        current_app.logger.info(f"Processing registration for email: {email}")
        
        # 1. Try to create user with client auth first
        user_id, error_response = _create_user_with_client_auth(
            supabase, email, password, first_name, last_name
        )
        
        # 2. If client auth fails, try admin API
        if not user_id:
            current_app.logger.info("Falling back to admin API for user creation")
            user_id, error_response = _create_user_with_admin_api(
                supabase, email, password, first_name, last_name
            )
            
            if not user_id:
                return jsonify(error_response), 400
        
        # 3. Profile row will be created automatically by the DB trigger after user registration.
        # If you want to update profile fields (e.g., after registration), you can do so here.
        # For initial registration, do not manually insert into profiles.

        current_app.logger.info(f"Successfully completed registration for user {user_id}")
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
