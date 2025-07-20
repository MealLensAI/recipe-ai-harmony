from flask import request, current_app
import traceback

def get_user_id_from_token():
    """Extract user ID from token with proper error handling"""
    try:
        auth_service = current_app.auth_service
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return None, "No Authorization header provided"
        
        user_id, auth_type = auth_service.get_supabase_user_id_from_token(auth_header)
        
        if not user_id:
            return None, f"Token verification failed. Auth type attempted: {auth_type}"
        
        return user_id, None
    except Exception as e:
        current_app.logger.error(f"Error extracting user ID from token: {str(e)}")
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return None, f"Token processing error: {str(e)}"

def log_error(message: str, error: Exception = None):
    """Centralized error logging"""
    current_app.logger.error(f"ERROR: {message}")
    if error:
        current_app.logger.error(f"Exception: {str(error)}")
        current_app.logger.error(f"Traceback: {traceback.format_exc()}") 