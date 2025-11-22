from flask import Blueprint, request, jsonify, current_app
from utils.auth_utils import get_user_id_from_token, log_error

user_settings_bp = Blueprint('user_settings', __name__)

@user_settings_bp.route('/settings', methods=['POST'])
def save_user_settings():
    """
    Saves user settings to the database. Requires authentication.
    """
    try:
        user_id, error = get_user_id_from_token()
        if error:
            return jsonify({'status': 'error', 'message': f'Authentication failed: {error}'}), 401

        data = request.get_json()
        if not data:
            return jsonify({'status': 'error', 'message': 'Settings data is required'}), 400

        settings_type = data.get('settings_type', 'health_profile')
        settings_data = data.get('settings_data', {})

        if not settings_data:
            return jsonify({'status': 'error', 'message': 'Settings data cannot be empty'}), 400

        supabase_service = current_app.supabase_service
        success, error = supabase_service.save_user_settings(user_id, settings_type, settings_data)
        
        if success:
            return jsonify({
                'status': 'success',
                'message': 'Settings saved successfully'
            }), 200
        else:
            log_error(f"Failed to save settings for user {user_id}", Exception(error or 'Unknown error'))
            return jsonify({'status': 'error', 'message': f'Failed to save settings: {error}'}), 500

    except Exception as e:
        log_error("Unexpected error in save_user_settings", e)
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500

@user_settings_bp.route('/settings', methods=['GET'])
def get_user_settings():
    """
    Retrieves user settings from the database. Requires authentication.
    """
    try:
        user_id, error = get_user_id_from_token()
        if error:
            return jsonify({'status': 'error', 'message': f'Authentication failed: {error}'}), 401

        settings_type = request.args.get('settings_type', 'health_profile')
        
        supabase_service = current_app.supabase_service
        settings_data, error = supabase_service.get_user_settings(user_id, settings_type)
        
        if error:
            log_error(f"Failed to get settings for user {user_id}", Exception(error))
            return jsonify({'status': 'error', 'message': f'Failed to get settings: {error}'}), 500

        if settings_data:
            return jsonify({
                'status': 'success',
                'settings': settings_data.get('settings_data', {}),
                'settings_type': settings_data.get('settings_type'),
                'updated_at': settings_data.get('updated_at')
            }), 200
        else:
            return jsonify({
                'status': 'success',
                'settings': {},
                'message': 'No settings found'
            }), 200

    except Exception as e:
        log_error("Unexpected error in get_user_settings", e)
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500

@user_settings_bp.route('/settings', methods=['DELETE'])
def delete_user_settings():
    """
    Deletes user settings from the database. Requires authentication.
    """
    try:
        user_id, error = get_user_id_from_token()
        if error:
            return jsonify({'status': 'error', 'message': f'Authentication failed: {error}'}), 401

        settings_type = request.args.get('settings_type', 'health_profile')
        
        supabase_service = current_app.supabase_service
        success, error = supabase_service.delete_user_settings(user_id, settings_type)
        
        if success:
            return jsonify({
                'status': 'success',
                'message': 'Settings deleted successfully'
            }), 200
        else:
            log_error(f"Failed to delete settings for user {user_id}", Exception(error or 'Unknown error'))
            return jsonify({'status': 'error', 'message': f'Failed to delete settings: {error}'}), 500

    except Exception as e:
        log_error("Unexpected error in delete_user_settings", e)
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500


@user_settings_bp.route('/settings/history', methods=['GET'])
def get_user_settings_history():
    """
    Retrieves user settings history from the database. Requires authentication.
    Shows all changes made to user settings over time.
    """
    try:
        user_id, error = get_user_id_from_token()
        if error:
            return jsonify({'status': 'error', 'message': f'Authentication failed: {error}'}), 401

        settings_type = request.args.get('settings_type', 'health_profile')
        limit = request.args.get('limit', 50, type=int)  # Default to last 50 changes
        
        current_app.logger.info(f"[SETTINGS_HISTORY] Fetching history for user {user_id}, type: {settings_type}")
        
        supabase_service = current_app.supabase_service
        supabase = supabase_service.supabase
        
        # Query settings history
        result = supabase.table('user_settings_history')\
            .select('*')\
            .eq('user_id', user_id)\
            .eq('settings_type', settings_type)\
            .order('created_at', desc=True)\
            .limit(limit)\
            .execute()
        
        if result.data:
            current_app.logger.info(f"[SETTINGS_HISTORY] Found {len(result.data)} history records")
            return jsonify({
                'status': 'success',
                'history': result.data,
                'count': len(result.data)
            }), 200
        else:
            current_app.logger.info(f"[SETTINGS_HISTORY] No history found")
            return jsonify({
                'status': 'success',
                'history': [],
                'count': 0,
                'message': 'No settings history found'
            }), 200

    except Exception as e:
        log_error("Unexpected error in get_user_settings_history", e)
        current_app.logger.error(f"[SETTINGS_HISTORY] Error: {str(e)}", exc_info=True)
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500
