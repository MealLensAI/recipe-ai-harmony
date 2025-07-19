from flask import Blueprint, request, jsonify, current_app
import traceback
import json

meal_plan_bp = Blueprint('meal_plan', __name__)

def log_error(message: str, error: Exception = None):
    """Centralized error logging"""
    current_app.logger.error(f"ERROR: {message}")
    if error:
        current_app.logger.error(f"Exception: {str(error)}")
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")

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
        log_error("Error extracting user ID from token", e)
        return None, f"Token processing error: {str(e)}"

@meal_plan_bp.route('/meal_plan', methods=['POST'])
def save_meal_plan():
    """
    Saves a user's meal plan to the public.meal_plan_management table. Requires authentication.
    """
    try:
        user_id, error = get_user_id_from_token()
        if error:
            return jsonify({'status': 'error', 'message': f'Authentication failed: {error}'}), 401

        supabase_service = current_app.supabase_service
        plan_data = request.get_json()
        
        if not plan_data:
            return jsonify({'status': 'error', 'message': 'Meal plan data is required.'}), 400

        # Save to meal_plan_management table via RPC
        success, error = supabase_service.save_meal_plan(user_id, plan_data)
        if success:
            return jsonify({'status': 'success', 'message': 'Meal plan saved.'}), 201
        else:
            error_str = str(error) if error is not None else 'Unknown error'
            log_error(f"Failed to save meal plan for user {user_id}", Exception(error_str))
            return jsonify({'status': 'error', 'message': f'Failed to save meal plan: {error_str}'}), 500
    except Exception as e:
        log_error("Unexpected error in save_meal_plan", e)
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500

@meal_plan_bp.route('/meal_plan', methods=['GET'])
def get_meal_plan():
    """
    Retrieves a user's meal plans from the public.meal_plan_management table. Requires authentication.
    """
    try:
        user_id, error = get_user_id_from_token()
        if error:
            return jsonify({'status': 'error', 'message': f'Authentication failed: {error}'}), 401

        supabase_service = current_app.supabase_service
        meal_plans, error = supabase_service.get_meal_plans(user_id)
        print(f"[DEBUG] Data fetched from meal_plan_management for user {user_id}: {meal_plans}")  # Debug print

        # Parse plan_data if it's a string
        if meal_plans is not None:
            if isinstance(meal_plans, dict):
                meal_plans = [meal_plans]
            for plan in meal_plans:
                if isinstance(plan.get('plan_data'), str):
                    try:
                        plan['plan_data'] = json.loads(plan['plan_data'])
                    except Exception as e:
                        print(f"[DEBUG] Failed to parse plan_data for plan {plan.get('id')}: {e}")
        
        if meal_plans is not None:
            return jsonify({'status': 'success', 'meal_plans': meal_plans}), 200
        else:
            log_error(f"Failed to retrieve meal plans for user {user_id}", Exception(error))
            return jsonify({'status': 'error', 'message': f'Failed to retrieve meal plans: {error}'}), 500
    except Exception as e:
        log_error("Unexpected error in get_meal_plan", e)
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500

@meal_plan_bp.route('/meal_plans', methods=['POST'])
def create_meal_plan():
    """
    Receives meal plan data from the frontend and inserts it into meal_plan_management via Supabase.
    Accepts the same structure as /meal_plan.
    """
    try:
        user_id, error = get_user_id_from_token()
        if error:
            return jsonify({'status': 'error', 'message': f'Authentication failed: {error}'}), 401

        supabase_service = current_app.supabase_service

        # Accept both JSON and form data
        if request.is_json:
            plan_data = request.get_json()
        else:
            plan_data = request.form.to_dict()

        # Save to meal_plan_management table via RPC
        success, error = supabase_service.save_meal_plan(user_id, plan_data)
        if not success:
            error_str = str(error) if error is not None else 'Unknown error'
            log_error(f"Failed to save meal plan for user {user_id}", Exception(error_str))
            return jsonify({'status': 'error', 'message': f'Failed to save meal plan: {error_str}'}), 500

        return jsonify({'status': 'success', 'message': 'Meal plan saved.'}), 201
    except Exception as e:
        log_error("Unexpected error in create_meal_plan", e)
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500

@meal_plan_bp.route('/meal_plans/<id>', methods=['PUT'])
def update_meal_plan(id):
    """
    Updates an existing meal plan. Requires authentication.
    """
    try:
        user_id, error = get_user_id_from_token()
        if error:
            return jsonify({'status': 'error', 'message': f'Authentication failed: {error}'}), 401

        supabase_service = current_app.supabase_service
        data = request.get_json()
        
        if not data:
            return jsonify({'status': 'error', 'message': 'Meal plan data is required.'}), 400

        # Update the meal plan
        success, error = supabase_service.update_meal_plan(user_id, id, data)
        if success:
            return jsonify({'status': 'success', 'message': 'Meal plan updated.'}), 200
        else:
            log_error(f"Failed to update meal plan {id} for user {user_id}", Exception(error))
            return jsonify({'status': 'error', 'message': f'Failed to update meal plan: {error}'}), 500
    except Exception as e:
        log_error("Unexpected error in update_meal_plan", e)
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500

@meal_plan_bp.route('/meal_plans/<id>', methods=['DELETE'])
def delete_meal_plan(id):
    """
    Deletes a meal plan. Requires authentication.
    """
    try:
        user_id, error = get_user_id_from_token()
        if error:
            return jsonify({'status': 'error', 'message': f'Authentication failed: {error}'}), 401

        supabase_service = current_app.supabase_service
        success, error = supabase_service.delete_meal_plan(user_id, id)
        
        if success:
            return jsonify({'status': 'success', 'message': 'Meal plan deleted.'}), 200
        else:
            log_error(f"Failed to delete meal plan {id} for user {user_id}", Exception(error))
            return jsonify({'status': 'error', 'message': f'Failed to delete meal plan: {error}'}), 500
    except Exception as e:
        log_error("Unexpected error in delete_meal_plan", e)
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500

@meal_plan_bp.route('/meal_plans/clear', methods=['DELETE'])
def clear_meal_plans():
    """
    Clears all meal plans for a user. Requires authentication.
    """
    try:
        user_id, error = get_user_id_from_token()
        if error:
            return jsonify({'status': 'error', 'message': f'Authentication failed: {error}'}), 401

        supabase_service = current_app.supabase_service
        success, error = supabase_service.clear_meal_plans(user_id)
        
        if success:
            return jsonify({'status': 'success', 'message': 'All meal plans cleared.'}), 200
        else:
            log_error(f"Failed to clear meal plans for user {user_id}", Exception(error))
            return jsonify({'status': 'error', 'message': f'Failed to clear meal plans: {error}'}), 500
    except Exception as e:
        log_error("Unexpected error in clear_meal_plans", e)
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500
