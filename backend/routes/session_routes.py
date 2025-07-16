from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
import uuid

session_bp = Blueprint('session', __name__)

@session_bp.route('/api/session', methods=['POST'])
def create_session():
    """
    Creates a new session for the authenticated user.
    
    Request Body:
    {
        "user_id": "...",  # Supabase user ID
        "session_data": {   # Any session-specific data
            "...": "..."
        }
    }
    
    Returns:
    {
        "status": "success",
        "session_id": "...",
        "created_at": "..."
    }
    """
    auth_service = current_app.auth_service
    supabase_service = current_app.supabase_service
    
    # Get user ID from auth token
    user_id, auth_type = auth_service.get_supabase_user_id_from_token(request.headers.get('Authorization'))
    
    if not user_id:
        return jsonify({'status': 'error', 'message': 'Authentication required to create session.'}), 401
    
    # Get request data
    data = request.get_json()
    if not data:
        return jsonify({'status': 'error', 'message': 'Session data is required.'}), 400
    
    session_data = data.get('session_data', {})
    
    # Generate session ID
    session_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat()
    
    # Store session data in Supabase
    success, error = supabase_service.save_session(
        user_id=user_id,
        session_id=session_id,
        session_data=session_data,
        created_at=created_at
    )
    
    if success:
        return jsonify({
            'status': 'success',
            'session_id': session_id,
            'created_at': created_at
        }), 201
    else:
        return jsonify({'status': 'error', 'message': error}), 500

@session_bp.route('/api/session/<session_id>', methods=['GET'])
def get_session(session_id):
    """
    Retrieves a specific session by ID for the authenticated user.
    
    Returns:
    {
        "status": "success",
        "session": {
            "session_id": "...",
            "user_id": "...",
            "session_data": { ... },
            "created_at": "..."
        }
    }
    """
    auth_service = current_app.auth_service
    supabase_service = current_app.supabase_service
    
    user_id, auth_type = auth_service.get_supabase_user_id_from_token(request.headers.get('Authorization'))
    
    if not user_id:
        return jsonify({'status': 'error', 'message': 'Authentication required to retrieve session.'}), 401
    
    session, error = supabase_service.get_session(user_id, session_id)
    
    if session:
        return jsonify({
            'status': 'success',
            'session': session
        }), 200
    else:
        return jsonify({'status': 'error', 'message': error}), 404

@session_bp.route('/api/session/<session_id>', methods=['PUT'])
def update_session(session_id):
    """
    Updates an existing session.
    
    Request Body:
    {
        "session_data": {   # Updated session data
            "...": "..."
        }
    }
    
    Returns:
    {
        "status": "success",
        "message": "Session updated successfully"
    }
    """
    auth_service = current_app.auth_service
    supabase_service = current_app.supabase_service
    
    user_id, auth_type = auth_service.get_supabase_user_id_from_token(request.headers.get('Authorization'))
    
    if not user_id:
        return jsonify({'status': 'error', 'message': 'Authentication required to update session.'}), 401
    
    data = request.get_json()
    if not data or 'session_data' not in data:
        return jsonify({'status': 'error', 'message': 'Session data is required.'}), 400
    
    success, error = supabase_service.update_session(
        user_id=user_id,
        session_id=session_id,
        session_data=data['session_data']
    )
    
    if success:
        return jsonify({
            'status': 'success',
            'message': 'Session updated successfully'
        }), 200
    else:
        return jsonify({'status': 'error', 'message': error}), 500

@session_bp.route('/api/session', methods=['GET'])
def list_sessions():
    """
    Lists all sessions for the authenticated user.
    
    Returns:
    {
        "status": "success",
        "sessions": [
            {
                "session_id": "...",
                "user_id": "...",
                "session_data": { ... },
                "created_at": "..."
            },
            ...
        ]
    }
    """
    auth_service = current_app.auth_service
    supabase_service = current_app.supabase_service
    
    user_id, auth_type = auth_service.get_supabase_user_id_from_token(request.headers.get('Authorization'))
    
    if not user_id:
        return jsonify({'status': 'error', 'message': 'Authentication required to list sessions.'}), 401
    
    sessions, error = supabase_service.list_user_sessions(user_id)
    
    if sessions is not None:
        return jsonify({
            'status': 'success',
            'sessions': sessions
        }), 200
    else:
        return jsonify({'status': 'error', 'message': error}), 500
