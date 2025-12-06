from flask import Blueprint, request, jsonify, current_app
import os
import uuid # For generating unique IDs
import json # For handling JSON strings
from marshmallow import Schema, fields, ValidationError

# Import utilities and services
from utils.file_utils import allowed_file
from utils.auth_utils import get_user_id_from_token
from werkzeug.utils import secure_filename

food_detection_bp = Blueprint('food_detection', __name__)

class DetectionHistorySchema(Schema):
    recipe_type = fields.Str(required=True)
    suggestion = fields.Str(required=False, allow_none=True, load_default="")
    instructions = fields.Str(required=False, allow_none=True, load_default="")
    ingredients = fields.Str(required=False, allow_none=True, load_default="")
    detected_foods = fields.Str(required=False, allow_none=True, load_default="")
    analysis_id = fields.Str(required=False, allow_none=True, load_default="")
    # Support both legacy and new field names for compatibility
    youtube = fields.Str(required=False, allow_none=True, load_default="")
    youtube_link = fields.Str(required=False, allow_none=True, load_default="")
    google = fields.Str(required=False, allow_none=True, load_default="")
    google_link = fields.Str(required=False, allow_none=True, load_default="")
    resources = fields.Str(required=False, allow_none=True, load_default="")
    resources_link = fields.Str(required=False, allow_none=True, load_default="")

@food_detection_bp.route('/process', methods=['POST'])
def process_food_input():
  """
  Receives initial food input (image or ingredient list) and AI-detected
  ingredients/suggestions from the frontend. Stores this data in detection_history.
  """
  supabase_service = current_app.supabase_service
  user_id, error = get_user_id_from_token()
  
  if error:
      return jsonify({'status': 'error', 'message': f'Authentication required: {error}'}), 401

  input_type = request.form.get('image_or_ingredient_list')
  
  # NOTE: The frontend doesn't send detected_ingredients and food_suggestions
  # The /process endpoint just receives the raw input (image or text)
  # The AI processing happens in the AI API, not here
  # So we skip saving to history here - let the frontend save after AI processing

  analysis_id = str(uuid.uuid4()) # Generate a unique analysis ID for tracking
  input_data_value = None
  
  if input_type == 'ingredient_list':
      ingredients_text = request.form.get('ingredient_list')
      if not ingredients_text:
          return jsonify({'status': 'error', 'message': 'Ingredient list is required.'}), 400
      input_data_value = ingredients_text
      print(f"Received ingredient list from user {user_id}: {ingredients_text}")

  elif input_type == 'image':
      if 'image' not in request.files:
          return jsonify({'status': 'error', 'message': 'No image uploaded.'}), 400
      file = request.files['image']
      if file and allowed_file(file.filename): # allowed_file now only checks extension
          # Upload image to Supabase Storage
          filename = secure_filename(file.filename)
          # Use a unique path to avoid overwrites, e.g., user_id/analysis_id/filename
          storage_path = f"detection_images/{user_id}/{analysis_id}/{filename}"
          image_url, upload_error = supabase_service.upload_file(file, 'detection_images', storage_path)
          if upload_error:
              print(f"Error uploading image to Supabase Storage: {upload_error}")
              return jsonify({'status': 'error', 'message': f'Failed to upload image: {upload_error}'}), 500
          input_data_value = image_url
          print(f'Image uploaded to Supabase Storage: {image_url} for user {user_id}')
      else:
          return jsonify({'status': 'error', 'message': 'Invalid file type.'}), 400
  else:
      return jsonify({'status': 'error', 'message': 'Invalid input type.'}), 400

  # Don't save to history here - the frontend will save after AI processing
  # This endpoint just receives the input and generates an analysis_id
  
  return jsonify({
      'status': 'success',
      'analysis_id': analysis_id,
      'message': 'Input received. Frontend will process with AI and save to history.'
  }), 200

@food_detection_bp.route('/instructions', methods=['POST'])
def update_instructions():
  """
  Receives cooking instructions and ingredients for a chosen recipe suggestion
  from the frontend and updates the corresponding detection history entry.
  """
  supabase_service = current_app.supabase_service
  user_id, error = get_user_id_from_token()

  if error:
      return jsonify({'status': 'error', 'message': f'Authentication required: {error}'}), 401

  data = request.get_json()
  food_analysis_id = data.get('food_analysis_id')
  food_choice_index = data.get('food_choice_index') # This is the chosen suggestion text
  instructions_text = data.get('instructions_text')
  recipe_ingredients_str = data.get('recipe_ingredients') # Expected as JSON string

  if not food_analysis_id or not instructions_text or not recipe_ingredients_str:
      return jsonify({'status': 'error', 'message': 'Missing required data for instructions update.'}), 400

  updates = {
      'recipe_suggestion': food_choice_index,
      'recipe_instructions': instructions_text,
      'recipe_ingredients': recipe_ingredients_str # Store as JSON string
  }

  success, error = supabase_service.update_detection_history(
      analysis_id=food_analysis_id,
      user_id=user_id,
      updates=updates
  )
  if not success:
      print(f"Error updating detection history with instructions: {error}")
      return jsonify({'status': 'error', 'message': f'Failed to update instructions: {error}'}), 500

  return jsonify({'status': 'success', 'message': 'Instructions updated successfully.'}), 200

@food_detection_bp.route('/resources', methods=['POST'])
def update_resources():
  """
  Receives YouTube, Google, and combined resources links from the frontend
  and updates the corresponding detection history entry.
  """
  supabase_service = current_app.supabase_service
  user_id, error = get_user_id_from_token()

  if error:
      return jsonify({'status': 'error', 'message': f'Authentication required: {error}'}), 401

  data = request.get_json()
  food_analysis_id = data.get('food_analysis_id')
  youtube_link = data.get('youtube_link')
  google_link = data.get('google_link')
  resources_link = data.get('resources_link') # Combined HTML string

  if not food_analysis_id:
      return jsonify({'status': 'error', 'message': 'Missing food_analysis_id for resources update.'}), 400

  updates = {
      'youtube_link': youtube_link,
      'google_link': google_link,
      'resources_link': resources_link
  }

  success, error = supabase_service.update_detection_history(
      analysis_id=food_analysis_id,
      user_id=user_id,
      updates=updates
  )
  if not success:
      print(f"Error updating detection history with resources: {error}")
      return jsonify({'status': 'error', 'message': f'Failed to update resources: {error}'}), 500

  return jsonify({'status': 'success', 'message': 'Resources updated successfully.'}), 200

@food_detection_bp.route('/food_detect', methods=['POST'])
def food_detect():
  """
  Receives an image, AI-detected foods, and instructions from the frontend.
  Stores this data in detection_history.
  """
  supabase_service = current_app.supabase_service
  user_id, error = get_user_id_from_token()
  
  if error:
      return jsonify({'status': 'error', 'message': f'Authentication required: {error}'}), 401

  if 'image' not in request.files:
      return jsonify({'status': 'error', 'message': 'No image uploaded.'}), 400
  file = request.files['image']

  detected_foods_str = request.form.get('detected_foods')
  instructions_text = request.form.get('instructions_text')

  if not detected_foods_str or not instructions_text:
      return jsonify({'status': 'error', 'message': 'Detected foods and instructions are required.'}), 400

  try:
      detected_foods = json.loads(detected_foods_str)
  except json.JSONDecodeError:
      return jsonify({'status': 'error', 'message': 'Invalid JSON for detected_foods.'}), 400

  analysis_id = str(uuid.uuid4()) # Generate a unique analysis ID

  if file and allowed_file(file.filename):
      filename = secure_filename(file.filename)
      # Upload image to Supabase Storage
      storage_path = f"detection_images/{user_id}/{analysis_id}/{filename}"
      image_url, upload_error = supabase_service.upload_file(file, 'detection_images', storage_path)
      if upload_error:
          print(f"Error uploading image to Supabase Storage: {upload_error}")
          return jsonify({'status': 'error', 'message': f'Failed to upload image: {upload_error}'}), 500
      input_data_value = image_url
      print(f'Image uploaded to Supabase Storage: {image_url} for user {user_id}')
  else:
      return jsonify({'status': 'error', 'message': 'Invalid file type.'}), 400

  # Store this complete detection event in detection_history
  success, error = supabase_service.save_detection_history(
      user_id=user_id,
      recipe_type='food_detection_flow',  # FIXED: was detection_type
      instructions=instructions_text,  # FIXED: was recipe_instructions
      detected_foods=json.dumps(detected_foods), # Store as JSON string
      analysis_id=analysis_id
  )
  if not success:
      print(f"Error saving food detection history: {error}")
      return jsonify({'status': 'error', 'message': 'Failed to save food detection history.'}), 500

  return jsonify({
      'status': 'success',
      'analysis_id': analysis_id,
      'message': 'Food detection data received and saved.'
  }), 200

@food_detection_bp.route('/food_detect_resources', methods=['POST'])
def update_food_detect_resources():
  """
  Receives YouTube, Google, and combined resources links for detected food items
  from the frontend and updates the corresponding detection history entry.
  """
  supabase_service = current_app.supabase_service
  user_id, error = get_user_id_from_token()

  if error:
      return jsonify({'status': 'error', 'message': f'Authentication required: {error}'}), 401

  data = request.get_json()
  food_analysis_id = data.get('food_analysis_id')
  youtube_link = data.get('youtube_link')
  google_link = data.get('google_link')
  resources_link = data.get('resources_link') # JSON string with full resources

  current_app.logger.info(f"[FOOD_DETECT_RESOURCES] Updating resources for analysis_id: {food_analysis_id}, user: {user_id}")
  current_app.logger.info(f"[FOOD_DETECT_RESOURCES] Resources data: youtube_link={bool(youtube_link)}, google_link={bool(google_link)}, resources_link length={len(resources_link) if resources_link else 0}")

  if not food_analysis_id:
      current_app.logger.error("[FOOD_DETECT_RESOURCES] Missing food_analysis_id")
      return jsonify({'status': 'error', 'message': 'Missing food_analysis_id for resources update.'}), 400

  # Build updates dict - only include non-empty values
  updates = {}
  if youtube_link and youtube_link.strip():
      updates['youtube_link'] = youtube_link
  if google_link and google_link.strip():
      updates['google_link'] = google_link
  if resources_link and resources_link.strip() and resources_link != "{}":
      updates['resources_link'] = resources_link

  current_app.logger.info(f"[FOOD_DETECT_RESOURCES] Update payload: {list(updates.keys())}")

  success, error = supabase_service.update_detection_history(
      analysis_id=food_analysis_id,
      user_id=user_id,
      updates=updates
  )
  if not success:
      current_app.logger.error(f"[FOOD_DETECT_RESOURCES] Error updating food detection history with resources: {error}")
      return jsonify({'status': 'error', 'message': f'Failed to update resources: {error}'}), 500

  current_app.logger.info(f"[FOOD_DETECT_RESOURCES] ✅ Successfully updated resources for analysis_id: {food_analysis_id}")
  return jsonify({'status': 'success', 'message': 'Food detection resources updated successfully.'}), 200

@food_detection_bp.route('/share_recipe', methods=['POST'])
def share_recipe():
  """
  Receives complete recipe data from the frontend and saves it to the
  'shared_recipes' table.
  """
  supabase_service = current_app.supabase_service
  user_id, error = get_user_id_from_token()

  if error:
      return jsonify({'status': 'error', 'message': f'Authentication required to share recipes: {error}'}), 401

  data = request.get_json()
  if not data:
      return jsonify({'status': 'error', 'message': 'Recipe data is required.'}), 400

  # Extract data for shared_recipes table
  recipe_type = data.get('recipe_type') # 'ingredient_detection' or 'food_detection'
  suggestion = data.get('suggestion')
  instructions = data.get('instructions')
  ingredients = data.get('ingredients') # JSON string of array
  detected_foods = data.get('detected_foods') # JSON string of array
  analysis_id = data.get('analysis_id')
  youtube = data.get('youtube')
  google = data.get('google')
  resources = data.get('resources') # Combined HTML string

  if not recipe_type or not instructions:
      return jsonify({'status': 'error', 'message': 'Recipe type and instructions are required to share.'}), 400

  success, error = supabase_service.save_shared_recipe(
      user_id=user_id,
      recipe_type=recipe_type,
      suggestion=suggestion,
      instructions=instructions,
      ingredients=ingredients,
      detected_foods=detected_foods,
      analysis_id=analysis_id,
      youtube=youtube,
      google=google,
      resources=resources
  )

  if success:
      return jsonify({'status': 'success', 'message': 'Recipe shared successfully.'}), 201
  else:
      print(f"Error saving shared recipe: {error}")
      return jsonify({'status': 'error', 'message': 'Failed to share recipe.'}), 500

@food_detection_bp.route('/detection_history', methods=['POST'])
def create_detection_history():
    """
    Receives detection data from the frontend and inserts it into detection_history via Supabase.
    Allows all expected fields using Marshmallow schema validation, including shared_recipes fields.
    """
    supabase_service = current_app.supabase_service
    user_id, error = get_user_id_from_token()

    if error:
        return jsonify({'status': 'error', 'message': f'Authentication failed: {error}'}), 401

    # Accept both JSON and form data
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()

    print(f"[DETECTION_HISTORY] Received payload from user {user_id}:", data)  # Debug print

    schema = DetectionHistorySchema()
    try:
        validated = schema.load(data)
        print(f"[DETECTION_HISTORY] Validated payload:", {
            'recipe_type': validated.get('recipe_type'),
            'has_suggestion': bool(validated.get('suggestion')),
            'has_instructions': bool(validated.get('instructions')),
            'has_ingredients': bool(validated.get('ingredients')),
            'has_detected_foods': bool(validated.get('detected_foods')),
            'analysis_id': validated.get('analysis_id')
        })
    except ValidationError as err:
        print(f"[DETECTION_HISTORY] Validation error: {err.messages}")
        return jsonify({'status': 'error', 'message': err.messages}), 400

    # Stringify detected_foods and ingredients to match Supabase text columns
    if isinstance(validated.get('detected_foods'), list):
        validated['detected_foods'] = json.dumps(validated['detected_foods'])
    if isinstance(validated.get('ingredients'), list):
        validated['ingredients'] = json.dumps(validated['ingredients'])

    # Support both legacy and new field names for backwards compatibility
    youtube_url = validated.get('youtube_link') or validated.get('youtube') or ''
    google_url = validated.get('google_link') or validated.get('google') or ''
    resources_json = validated.get('resources_link') or validated.get('resources') or ''

    print("Payload being passed to save_detection_history:", {
        'user_id': user_id,
        'recipe_type': validated.get('recipe_type'),
        'suggestion': validated.get('suggestion'),
        'has_instructions': bool(validated.get('instructions')),
        'has_ingredients': bool(validated.get('ingredients')),
        'has_detected_foods': bool(validated.get('detected_foods')),
        'analysis_id': validated.get('analysis_id'),
        'has_youtube': bool(youtube_url),
        'has_google': bool(google_url),
        'has_resources': bool(resources_json and resources_json != '{}')
    })

    # Insert all validated fields, including shared_recipes fields
    print(f"[DETECTION_HISTORY] Attempting to save for user {user_id}...")
    success, error = supabase_service.save_detection_history(
        user_id=user_id,
        recipe_type=validated.get('recipe_type'),
        suggestion=validated.get('suggestion'),
        instructions=validated.get('instructions'),
        ingredients=validated.get('ingredients'),
        detected_foods=validated.get('detected_foods'),
        analysis_id=validated.get('analysis_id'),
        youtube_url=youtube_url,
        google_url=google_url,
        resources_json=resources_json
    )
    if not success:
        error_msg = str(error) if error else "Unknown error"
        print(f"[ERROR] Failed to save detection history for user {user_id}: {error_msg}")
        return jsonify({'status': 'error', 'message': f'Failed to save detection history: {error_msg}'}), 500

    print(f"[DETECTION_HISTORY] ✅ Successfully saved detection history for user {user_id}")
    return jsonify({'status': 'success', 'message': 'Detection history saved.'}), 201

@food_detection_bp.route('/detection_history', methods=['GET'])
def get_detection_history():
    """
    Retrieves a user's food detection history from the database. Requires authentication.
    """
    try:
        user_id, error = get_user_id_from_token()
        
        if error:
            current_app.logger.warning(f"Authentication failed: {error}")
            return jsonify({'status': 'error', 'message': f'Authentication failed: {error}'}), 401

        current_app.logger.info(f"Fetching detection history for user: {user_id}")
        
        supabase_service = current_app.supabase_service
        detection_history, error = supabase_service.get_detection_history(user_id)
        
        if detection_history is not None:
            record_count = len(detection_history) if detection_history else 0
            current_app.logger.info(f"Successfully retrieved {record_count} records for user {user_id}")
            
            response_data = {
                'status': 'success', 
                'detection_history': detection_history
            }
            
            return jsonify(response_data), 200
        else:
            current_app.logger.error(f"Database error for user {user_id}: {error}")
            return jsonify({'status': 'error', 'message': f'Failed to retrieve detection history: {error}'}), 500
            
    except Exception as e:
        current_app.logger.error(f"Unexpected error in get_detection_history: {str(e)}")
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500

@food_detection_bp.route('/detection_history', methods=['PUT'])
def update_detection_history():
    """
    Updates an existing detection history record by analysis_id.
    Receives detection data from the frontend and updates it in detection_history via Supabase.
    """
    supabase_service = current_app.supabase_service
    user_id, error = get_user_id_from_token()

    if error:
        return jsonify({'status': 'error', 'message': f'Authentication failed: {error}'}), 401

    # Accept both JSON and form data
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()

    analysis_id = data.get('analysis_id')
    if not analysis_id:
        return jsonify({'status': 'error', 'message': 'analysis_id is required for update.'}), 400

    print(f"[UPDATE_DETECTION_HISTORY] Updating record with analysis_id: {analysis_id} for user: {user_id}")

    schema = DetectionHistorySchema()
    try:
        validated = schema.load(data)
    except ValidationError as err:
        return jsonify({'status': 'error', 'message': err.messages}), 400

    # Stringify detected_foods and ingredients to match Supabase text columns
    if isinstance(validated.get('detected_foods'), list):
        validated['detected_foods'] = json.dumps(validated['detected_foods'])
    if isinstance(validated.get('ingredients'), list):
        validated['ingredients'] = json.dumps(validated['ingredients'])

    # Support both legacy and new field names for backwards compatibility
    youtube_url = validated.get('youtube_link') or validated.get('youtube') or ''
    google_url = validated.get('google_link') or validated.get('google') or ''
    resources_json = validated.get('resources_link') or validated.get('resources') or ''

    # Build updates dict (only include fields that are provided and non-empty)
    updates = {}
    if 'suggestion' in validated and validated.get('suggestion') is not None and validated.get('suggestion').strip():
        updates['suggestion'] = validated.get('suggestion')
    if 'instructions' in validated and validated.get('instructions') is not None and validated.get('instructions').strip():
        updates['instructions'] = validated.get('instructions')
    if 'ingredients' in validated and validated.get('ingredients') is not None and validated.get('ingredients').strip():
        updates['ingredients'] = validated.get('ingredients')
    if 'detected_foods' in validated and validated.get('detected_foods') is not None and validated.get('detected_foods').strip():
        updates['detected_foods'] = validated.get('detected_foods')
    if youtube_url and youtube_url.strip():
        updates['youtube_link'] = youtube_url
    if google_url and google_url.strip():
        updates['google_link'] = google_url
    if resources_json and resources_json.strip() and resources_json != "{}":
        updates['resources_link'] = resources_json

    print(f"[UPDATE_DETECTION_HISTORY] Update payload for analysis_id {analysis_id}: {list(updates.keys())}")
    print(f"[UPDATE_DETECTION_HISTORY] Update details: has_instructions={bool(updates.get('instructions'))}, has_youtube={bool(updates.get('youtube_link'))}, has_google={bool(updates.get('google_link'))}, has_resources={bool(updates.get('resources_link'))}")

    success, error = supabase_service.update_detection_history(
        analysis_id=analysis_id,
        user_id=user_id,
        updates=updates
    )
    if not success:
        print(f"[ERROR] Failed to update detection history: {error}")
        return jsonify({'status': 'error', 'message': f'Failed to update detection history: {error}'}), 500

    return jsonify({'status': 'success', 'message': 'Detection history updated.'}), 200

@food_detection_bp.route('/detection_history/<record_id>', methods=['DELETE'])
def delete_detection_history(record_id):
    """
    Deletes a specific detection history record. Requires authentication.
    """
    try:
        user_id, error = get_user_id_from_token()
        
        if error:
            current_app.logger.warning(f"Authentication failed: {error}")
            return jsonify({'status': 'error', 'message': f'Authentication failed: {error}'}), 401

        current_app.logger.info(f"Deleting detection history record {record_id} for user: {user_id}")
        
        supabase_service = current_app.supabase_service
        success, error = supabase_service.delete_detection_history(user_id, record_id)
        
        if success:
            return jsonify({'status': 'success', 'message': 'Detection history record deleted successfully.'}), 200
        else:
            return jsonify({'status': 'error', 'message': error or 'Failed to delete record'}), 404
            
    except Exception as e:
        current_app.logger.error(f"Unexpected error in delete_detection_history: {str(e)}")
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500
