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
    Extracts name, start_date, and end_date from meal_plan JSON if missing at the top level.
    """
    try:
        user_id, error = get_user_id_from_token()
        if error:
            return jsonify({'status': 'error', 'message': f'Authentication failed: {error}'}), 401

        supabase_service = current_app.supabase_service
        meal_plans, error = supabase_service.get_meal_plans(user_id)
        print(f"[DEBUG] Data fetched from meal_plan_management for user {user_id}: {meal_plans}")  # Debug print

        # Parse meal_plan and extract fields if missing
        if meal_plans is not None:
            if isinstance(meal_plans, dict):
                meal_plans = [meal_plans]
            for plan in meal_plans:
                meal_plan_obj = plan.get('meal_plan')
                # Parse if string
                if isinstance(meal_plan_obj, str):
                    try:
                        meal_plan_obj = json.loads(meal_plan_obj)
                    except Exception as e:
                        print(f"[DEBUG] Failed to parse meal_plan for plan {plan.get('id')}: {e}")
                        meal_plan_obj = {}
                # If plan_data key, use it
                if isinstance(meal_plan_obj, dict) and 'plan_data' in meal_plan_obj:
                    meal_plan_obj = meal_plan_obj['plan_data']
                # Extract fields robustly
                plan['name'] = plan.get('name') or meal_plan_obj.get('name')
                plan['start_date'] = plan.get('start_date') or meal_plan_obj.get('startDate')
                plan['end_date'] = plan.get('end_date') or meal_plan_obj.get('endDate')
                plan['meal_plan'] = meal_plan_obj
                # Log the extracted fields for debugging
                current_app.logger.info(f"[EXTRACTED] Plan ID: {plan.get('id')}, Name: {plan.get('name')}, Start: {plan.get('start_date')}, End: {plan.get('end_date')}")
            print('[DEBUG] Final meal_plans to return:', meal_plans)
        
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
    Normalizes the data before saving. Only accepts JSON.
    """
    try:
        user_id, error = get_user_id_from_token()
        if error:
            return jsonify({'status': 'error', 'message': f'Authentication failed: {error}'}), 401

        supabase_service = current_app.supabase_service

        if not request.is_json:
            return jsonify({'status': 'error', 'message': 'Request must be JSON.'}), 400
        plan_data = request.get_json()
        if not plan_data:
            return jsonify({'status': 'error', 'message': 'Meal plan data is required.'}), 400

        # Normalize the plan data before saving
        normalized_plan = supabase_service.normalize_meal_plan_entry(plan_data, user_id)

        # Save to meal_plan_management table via RPC
        success, error = supabase_service.save_meal_plan(user_id, normalized_plan)
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

@meal_plan_bp.route('/meal_plan/<plan_id>', methods=['GET'])
def get_single_meal_plan(plan_id):
    """
    Retrieves a single meal plan by ID for the authenticated user.
    """
    try:
        user_id, error = get_user_id_from_token()
        if error:
            return jsonify({'status': 'error', 'message': f'Authentication failed: {error}'}), 401

        supabase_service = current_app.supabase_service
        meal_plans, error = supabase_service.get_meal_plans(user_id)
        if error or not meal_plans:
            return jsonify({'status': 'error', 'message': 'No meal plans found.'}), 404

        if isinstance(meal_plans, dict):
            meal_plans = [meal_plans]
        plan = next((p for p in meal_plans if str(p.get('id')) == str(plan_id)), None)
        if not plan:
            return jsonify({'status': 'error', 'message': 'Meal plan not found.'}), 404

        # Extraction logic (reuse from GET /meal_plan)
        meal_plan_obj = plan.get('meal_plan')
        if isinstance(meal_plan_obj, str):
            try:
                meal_plan_obj = json.loads(meal_plan_obj)
            except Exception:
                meal_plan_obj = {}
        if isinstance(meal_plan_obj, dict) and 'plan_data' in meal_plan_obj:
            meal_plan_obj = meal_plan_obj['plan_data']
        plan['name'] = plan.get('name') or meal_plan_obj.get('name')
        plan['start_date'] = plan.get('start_date') or meal_plan_obj.get('startDate')
        plan['end_date'] = plan.get('end_date') or meal_plan_obj.get('endDate')
        plan['meal_plan'] = meal_plan_obj

        return jsonify({'status': 'success', 'meal_plan': plan}), 200
    except Exception as e:
        log_error("Unexpected error in get_single_meal_plan", e)
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500

@meal_plan_bp.route('/meal_plan/<plan_id>/<day>', methods=['GET'])
def get_single_day_plan(plan_id, day):
    """
    Retrieves a single day's plan from a meal plan by ID and day name.
    """
    try:
        user_id, error = get_user_id_from_token()
        if error:
            return jsonify({'status': 'error', 'message': f'Authentication failed: {error}'}), 401

        supabase_service = current_app.supabase_service
        meal_plans, error = supabase_service.get_meal_plans(user_id)
        if error or not meal_plans:
            return jsonify({'status': 'error', 'message': 'No meal plans found.'}), 404

        if isinstance(meal_plans, dict):
            meal_plans = [meal_plans]
        plan = next((p for p in meal_plans if str(p.get('id')) == str(plan_id)), None)
        if not plan:
            return jsonify({'status': 'error', 'message': 'Meal plan not found.'}), 404

        meal_plan_obj = plan.get('meal_plan')
        if isinstance(meal_plan_obj, str):
            try:
                meal_plan_obj = json.loads(meal_plan_obj)
            except Exception:
                meal_plan_obj = {}
        if isinstance(meal_plan_obj, dict) and 'plan_data' in meal_plan_obj:
            meal_plan_obj = meal_plan_obj['plan_data']
        day_plan = None
        if isinstance(meal_plan_obj, dict) and 'mealPlan' in meal_plan_obj:
            day_plan = next((d for d in meal_plan_obj['mealPlan'] if d.get('day') == day), None)
        elif isinstance(meal_plan_obj, list):
            day_plan = next((d for d in meal_plan_obj if d.get('day') == day), None)
        if not day_plan:
            return jsonify({'status': 'error', 'message': 'Day not found in meal plan.'}), 404
        return jsonify({'status': 'success', 'day_plan': day_plan}), 200
    except Exception as e:
        log_error("Unexpected error in get_single_day_plan", e)
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500

@meal_plan_bp.route('/meal_plan/<plan_id>/<day>/<meal_type>', methods=['GET'])
def get_single_meal(plan_id, day, meal_type):
    """
    Retrieves a single meal from a day's plan by meal type (breakfast, lunch, dinner, snack).
    """
    try:
        user_id, error = get_user_id_from_token()
        if error:
            return jsonify({'status': 'error', 'message': f'Authentication failed: {error}'}), 401

        supabase_service = current_app.supabase_service
        meal_plans, error = supabase_service.get_meal_plans(user_id)
        if error or not meal_plans:
            return jsonify({'status': 'error', 'message': 'No meal plans found.'}), 404

        if isinstance(meal_plans, dict):
            meal_plans = [meal_plans]
        plan = next((p for p in meal_plans if str(p.get('id')) == str(plan_id)), None)
        if not plan:
            return jsonify({'status': 'error', 'message': 'Meal plan not found.'}), 404

        meal_plan_obj = plan.get('meal_plan')
        if isinstance(meal_plan_obj, str):
            try:
                meal_plan_obj = json.loads(meal_plan_obj)
            except Exception:
                meal_plan_obj = {}
        if isinstance(meal_plan_obj, dict) and 'plan_data' in meal_plan_obj:
            meal_plan_obj = meal_plan_obj['plan_data']
        day_plan = None
        if isinstance(meal_plan_obj, dict) and 'mealPlan' in meal_plan_obj:
            day_plan = next((d for d in meal_plan_obj['mealPlan'] if d.get('day') == day), None)
        elif isinstance(meal_plan_obj, list):
            day_plan = next((d for d in meal_plan_obj if d.get('day') == day), None)
        if not day_plan:
            return jsonify({'status': 'error', 'message': 'Day not found in meal plan.'}), 404
        meal_value = day_plan.get(meal_type)
        meal_ingredients = day_plan.get(f'{meal_type}_ingredients')
        if meal_value is None:
            return jsonify({'status': 'error', 'message': f'{meal_type} not found for {day}.'}), 404
        return jsonify({'status': 'success', 'meal': meal_value, 'ingredients': meal_ingredients}), 200
    except Exception as e:
        log_error("Unexpected error in get_single_meal", e)
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500
