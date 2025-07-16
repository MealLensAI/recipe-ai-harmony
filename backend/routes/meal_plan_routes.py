from flask import Blueprint, request, jsonify, current_app

meal_plan_bp = Blueprint('meal_plan', __name__)

@meal_plan_bp.route('/meal_plan', methods=['POST'])
def save_meal_plan():
    """
    Saves a user's meal plan to the database. Requires authentication.
    """
    auth_service = current_app.auth_service
    supabase_service = current_app.supabase_service
    user_id, auth_type = auth_service.get_supabase_user_id_from_token(request.headers.get('Authorization'))
    
    if not user_id:
        return jsonify({'status': 'error', 'message': 'Authentication required to save meal plan.'}), 401

    plan_data = request.get_json()
    if not plan_data:
        return jsonify({'status': 'error', 'message': 'Meal plan data is required.'}), 400

    success, error = supabase_service.save_meal_plan(user_id, plan_data)
    if success:
        return jsonify({'status': 'success', 'message': 'Meal plan saved.'}), 201
    else:
        print(f"Error saving meal plan to Supabase: {error}")
        return jsonify({'status': 'error', 'message': 'Failed to save meal plan.'}), 500

@meal_plan_bp.route('/meal_plan', methods=['GET'])
def get_meal_plan():
    """
    Retrieves a user's meal plans from the database. Requires authentication.
    """
    auth_service = current_app.auth_service
    supabase_service = current_app.supabase_service
    user_id, auth_type = auth_service.get_supabase_user_id_from_token(request.headers.get('Authorization'))
    
    if not user_id:
        return jsonify({'status': 'error', 'message': 'Authentication required to retrieve meal plan.'}), 401

    meal_plans, error = supabase_service.get_meal_plans(user_id)
    if meal_plans is not None:
        return jsonify({'status': 'success', 'meal_plans': meal_plans}), 200
    else:
        print(f"Error retrieving meal plans from Supabase: {error}")
        return jsonify({'status': 'error', 'message': 'Failed to retrieve meal plans.'}), 500

@meal_plan_bp.route('/detection_history', methods=['GET'])
def get_detection_history():
    """
    Retrieves a user's food detection history from the database. Requires authentication.
    """
    auth_service = current_app.auth_service
    supabase_service = current_app.supabase_service
    user_id, auth_type = auth_service.get_supabase_user_id_from_token(request.headers.get('Authorization'))
    
    if not user_id:
        return jsonify({'status': 'error', 'message': 'Authentication required to retrieve detection history.'}), 401

    detection_history, error = supabase_service.get_detection_history(user_id)
    if detection_history is not None:
        return jsonify({'status': 'success', 'detection_history': detection_history}), 200
    else:
        print(f"Error retrieving detection history from Supabase: {error}")
        return jsonify({'status': 'error', 'message': 'Failed to retrieve detection history.'}), 500
