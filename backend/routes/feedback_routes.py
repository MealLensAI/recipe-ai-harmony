from flask import Blueprint, request, jsonify, current_app

feedback_bp = Blueprint('feedback', __name__)

@feedback_bp.route('/feedback', methods=['POST'])
def feedback():
    """
    Handles user feedback submission and stores it in the database.
    """
    auth_service = current_app.auth_service
    supabase_service = current_app.supabase_service
    user_id, auth_type = auth_service.get_supabase_user_id_from_token(request.headers.get('Authorization'))
    
    feedback_text = request.form.get('feedback_text') # Assuming feedback is sent as form data

    if not feedback_text:
        return jsonify({'status': 'error', 'message': 'Feedback text is required.'}), 400

    success, error = supabase_service.save_feedback(user_id, feedback_text)
    if success:
        return jsonify({'status': 'success', 'message': 'Feedback received.'}), 201
    else:
        print(f"Error saving feedback to Supabase: {error}")
        return jsonify({'status': 'error', 'message': 'Failed to save feedback.'}), 500
