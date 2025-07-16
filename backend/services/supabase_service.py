import os
from supabase import create_client, Client
from werkzeug.datastructures import FileStorage

class SupabaseService:
    def __init__(self, supabase_url: str, supabase_key: str = None):
        """
        Initializes Supabase client.

        Args:
            supabase_url (str): The URL of your Supabase project.
            supabase_key (str): Your Supabase service role key. If not provided, will use SUPABASE_SERVICE_ROLE_KEY env var.
        """
        if not supabase_url:
            raise ValueError("Supabase URL is required")
        if not supabase_key:
            supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if not supabase_key:
            raise ValueError("Supabase service role key is required. Set SUPABASE_SERVICE_ROLE_KEY in your environment.")
        self.supabase: Client = create_client(supabase_url, supabase_key)
        print("Supabase client initialized with service role key.")

    def upload_file(self, file: FileStorage, bucket_name: str, file_path: str) -> tuple[str | None, str | None]:
        """
        Uploads a file to Supabase Storage.

        Args:
            file (FileStorage): The file object from Flask's request.files.
            bucket_name (str): The name of the Supabase Storage bucket.
            file_path (str): The path within the bucket where the file will be stored.

        Returns:
            tuple[str | None, str | None]: (public_url, None) on success, (None, error_message) on failure.
        """
        try:
            # Read file content
            file_content = file.read()
            
            # Upload to Supabase Storage
            response = self.supabase.storage.from_(bucket_name).upload(file_path, file_content, {
                "content-type": file.content_type
            })
            
            if response.status_code == 200:
                # Get public URL
                public_url_response = self.supabase.storage.from_(bucket_name).get_public_url(file_path)
                return public_url_response, None
            else:
                return None, f"Upload failed with status {response.status_code}: {response.json()}"
        except Exception as e:
            return None, str(e)

    def save_feedback(self, user_id: str | None, feedback_text: str) -> tuple[bool, str | None]:
        """
        Saves user feedback to the 'feedback' table using RPC.

        Args:
            user_id (str | None): The Supabase user ID, or None if unauthenticated.
            feedback_text (str): The feedback message.

        Returns:
            tuple[bool, str | None]: (True, None) on success, (False, error_message) on failure.
        """
        try:
            result = self.supabase.rpc('submit_feedback', {
                'p_user_id': user_id,
                'p_feedback_text': feedback_text
            }).execute()
            
            if result.data and result.data[0].get('status') == 'success':
                return True, None
            else:
                error = result.data[0].get('message') if result.data else 'Unknown error'
                return False, error
        except Exception as e:
            return False, str(e)

    def insert_ai_session(self, user_id: str, session_data: dict) -> dict:
        """
        Stores AI session data in Supabase.

        Args:
            user_id (str): The Supabase user ID.
            session_data (dict): The AI session data containing prompt, response, timestamp, and metadata.

        Returns:
            dict: The inserted session data including the generated ID.
        """
        try:
            result = self.supabase.table('ai_sessions').insert({
                'user_id': user_id,
                'prompt': session_data['prompt'],
                'response': session_data['response'],
                'timestamp': session_data['timestamp'],
                'metadata': session_data.get('metadata', {})
            }).execute()

            if result.data and len(result.data) > 0:
                return result.data[0]
            else:
                raise Exception("Failed to insert AI session data")

        except Exception as e:
            raise Exception(f"Error storing AI session data: {str(e)}")

    def save_detection_history(self, user_id: str | None, firebase_uid: str | None, detection_type: str,
                            input_data: str, detected_foods: str, recipe_suggestion: str | None = None,
                            recipe_instructions: str | None = None, recipe_ingredients: str | None = None,
                            analysis_id: str | None = None, youtube_link: str | None = None,
                            google_link: str | None = None, resources_link: str | None = None) -> tuple[bool, str | None]:
        """
        Saves a food detection event using RPC.

        Args:
            user_id (str | None): The Supabase user ID.
            firebase_uid (str | None): The Firebase UID if authenticated via Firebase.
            detection_type (str): Type of detection (e.g., 'ingredient_detection_flow', 'food_detection_flow').
            input_data (str): The raw input data (e.g., image URL, ingredient list string).
            detected_foods (str): JSON string of detected food items array.
            recipe_suggestion (str | None): The suggested recipe name.
            recipe_instructions (str | None): The generated cooking instructions.
            recipe_ingredients (str | None): JSON string of ingredients array.
            analysis_id (str | None): A unique ID for the analysis session.
            youtube_link (str | None): YouTube resource link.
            google_link (str | None): Google resource link.
            resources_link (str | None): Combined resources HTML string.

        Returns:
            tuple[bool, str | None]: (True, None) on success, (False, error_message) on failure.
        """
        try:
            result = self.supabase.rpc('add_detection_history', {
                'p_user_id': user_id,
                'p_detection_type': detection_type,
                'p_input_data': input_data,
                'p_detected_foods': detected_foods,
                'p_recipe_suggestion': recipe_suggestion,
                'p_recipe_instructions': recipe_instructions,
                'p_recipe_ingredients': recipe_ingredients,
                'p_analysis_id': analysis_id,
                'p_youtube_link': youtube_link,
                'p_google_link': google_link,
                'p_resources_link': resources_link
            }).execute()
            
            if result.data and result.data[0].get('status') == 'success':
                return True, None
            else:
                error = result.data[0].get('message') if result.data else 'Unknown error'
                return False, error
        except Exception as e:
            return False, str(e)

    def update_detection_history(self, analysis_id: str, user_id: str, updates: dict) -> tuple[bool, str | None]:
        """
        Updates an existing food detection event using RPC.

        Args:
            analysis_id (str): The unique ID of the analysis session to update.
            user_id (str): The Supabase user ID (for RLS check).
            updates (dict): A dictionary of fields to update.

        Returns:
            tuple[bool, str | None]: (True, None) on success, (False, error_message) on failure.
        """
        try:
            # Convert updates to RPC parameters
            rpc_params = {
                'p_analysis_id': analysis_id,
                'p_user_id': user_id
            }
            
            # Add update fields
            for key, value in updates.items():
                rpc_params[f'p_{key}'] = value
            
            result = self.supabase.rpc('update_detection_history', rpc_params).execute()
            
            if result.data and result.data[0].get('status') == 'success':
                return True, None
            else:
                error = result.data[0].get('message') if result.data else 'No record found or user not authorized to update this record.'
                return False, error
        except Exception as e:
            return False, str(e)

    def get_detection_history(self, user_id: str) -> tuple[list | None, str | None]:
        """
        Retrieves a user's food detection history using RPC.

        Args:
            user_id (str): The Supabase user ID.

        Returns:
            tuple[list | None, str | None]: (list of history records, None) on success,
                                          (None, error_message) on failure.
        """
        try:
            result = self.supabase.rpc('get_user_detection_history', {
                'p_user_id': user_id
            }).execute()
            
            if result.data and result.data[0].get('status') == 'success':
                return result.data[0].get('data', []), None
            else:
                error = result.data[0].get('message') if result.data else 'Failed to fetch detection history'
                return None, error
        except Exception as e:
            return None, str(e)

    def save_meal_plan(self, user_id: str, plan_data: dict) -> tuple[bool, str | None]:
        """
        Saves a user's meal plan using RPC.

        Args:
            user_id (str): The Supabase user ID.
            plan_data (dict): The meal plan data (JSONB).

        Returns:
            tuple[bool, str | None]: (True, None) on success, (False, error_message) on failure.
        """
        try:
            result = self.supabase.rpc('upsert_meal_plan', {
                'p_user_id': user_id,
                'p_plan_data': plan_data
            }).execute()
            
            if result.data and result.data[0].get('status') == 'success':
                return True, None
            else:
                error = result.data[0].get('message') if result.data else 'Failed to save meal plan'
                return False, error
        except Exception as e:
            return False, str(e)

    def get_meal_plans(self, user_id: str) -> tuple[list | None, str | None]:
        """
        Retrieves a user's meal plans using RPC.

        Args:
            user_id (str): The Supabase user ID.

        Returns:
            tuple[list | None, str | None]: (list of meal plans, None) on success,
                                          (None, error_message) on failure.
        """
        try:
            result = self.supabase.rpc('get_user_meal_plans', {
                'p_user_id': user_id
            }).execute()
            
            if result.data and result.data[0].get('status') == 'success':
                return result.data[0].get('data', []), None
            else:
                error = result.data[0].get('message') if result.data else 'Failed to fetch meal plans'
                return None, error
        except Exception as e:
            return None, str(e)

    def save_session(self, user_id: str, session_id: str, session_data: dict, created_at: str) -> tuple[bool, str | None]:
        """
        Saves a new session record using RPC.
        
        Args:
            user_id (str): The Supabase user ID.
            session_id (str): Unique session identifier.
            session_data (dict): Session-specific data (JSONB).
            created_at (str): ISO timestamp of session creation.
        
        Returns:
            tuple[bool, str | None]: (True, None) on success, (False, error_message) on failure.
        """
        try:
            result = self.supabase.rpc('save_session', {
                'p_user_id': user_id,
                'p_session_id': session_id,
                'p_session_data': session_data,
                'p_created_at': created_at
            }).execute()
            
            if result.data and result.data[0].get('status') == 'success':
                return True, None
            else:
                error = result.data[0].get('message') if result.data else 'Failed to save session'
                return False, error
        except Exception as e:
            return False, str(e)

    def get_session(self, user_id: str, session_id: str) -> tuple[dict | None, str | None]:
        """
        Retrieves a specific session by ID for the given user.
        
        Args:
            user_id (str): The Supabase user ID.
            session_id (str): The session ID to retrieve.
        
        Returns:
            tuple[dict | None, str | None]: (session_data, None) on success,
                                          (None, error_message) on failure.
        """
        try:
            result = self.supabase.rpc('get_session', {
                'p_user_id': user_id,
                'p_session_id': session_id
            }).execute()
            
            if result.data and result.data[0].get('status') == 'success':
                return result.data[0].get('data'), None
            else:
                error = result.data[0].get('message') if result.data else 'Session not found'
                return None, error
        except Exception as e:
            return None, str(e)

    def update_session(self, user_id: str, session_id: str, session_data: dict) -> tuple[bool, str | None]:
        """
        Updates an existing session record.
        
        Args:
            user_id (str): The Supabase user ID.
            session_id (str): The session ID to update.
            session_data (dict): Updated session data (JSONB).
        
        Returns:
            tuple[bool, str | None]: (True, None) on success, (False, error_message) on failure.
        """
        try:
            result = self.supabase.rpc('update_session', {
                'p_user_id': user_id,
                'p_session_id': session_id,
                'p_session_data': session_data
            }).execute()
            
            if result.data and result.data[0].get('status') == 'success':
                return True, None
            else:
                error = result.data[0].get('message') if result.data else 'Failed to update session'
                return False, error
        except Exception as e:
            return False, str(e)

    def list_user_sessions(self, user_id: str) -> tuple[list | None, str | None]:
        """
        Lists all sessions for a user.
        
        Args:
            user_id (str): The Supabase user ID.
        
        Returns:
            tuple[list | None, str | None]: (list of sessions, None) on success,
                                          (None, error_message) on failure.
        """
        try:
            result = self.supabase.rpc('list_user_sessions', {
                'p_user_id': user_id
            }).execute()
            
            if result.data and result.data[0].get('status') == 'success':
                return result.data[0].get('data', []), None
            else:
                error = result.data[0].get('message') if result.data else 'Failed to list sessions'
                return None, error
        except Exception as e:
            return None, str(e)

    def save_shared_recipe(self, user_id: str | None, recipe_type: str, suggestion: str | None,
                          instructions: str | None, ingredients: str | None, detected_foods: str | None,
                          analysis_id: str | None, youtube: str | None, google: str | None,
                          resources: str | None) -> tuple[bool, str | None]:
        """
        Saves a shared recipe using RPC.

        Args:
            user_id (str | None): The Supabase user ID of the sharer.
            recipe_type (str): 'ingredient_detection' or 'food_detection'.
            suggestion (str | None): Recipe name/suggestion.
            instructions (str | None): HTML string of instructions.
            ingredients (str | None): JSON string of ingredients array.
            detected_foods (str | None): JSON string of detected foods array.
            analysis_id (str | None): Unique ID for the initial analysis.
            youtube (str | None): Raw YouTube link.
            google (str | None): Raw Google link.
            resources (str | None): Combined HTML string for resources.

        Returns:
            tuple[bool, str | None]: (True, None) on success, (False, error_message) on failure.
        """
        try:
            result = self.supabase.rpc('share_recipe', {
                'p_user_id': user_id,
                'p_recipe_type': recipe_type,
                'p_suggestion': suggestion,
                'p_instructions': instructions,
                'p_ingredients': ingredients,
                'p_detected_foods': detected_foods,
                'p_analysis_id': analysis_id,
                'p_youtube': youtube,
                'p_google': google,
                'p_resources': resources
            }).execute()
            
            if result.data and result.data[0].get('status') == 'success':
                return True, None
            else:
                error = result.data[0].get('message') if result.data else 'Failed to save shared recipe'
                return False, error
        except Exception as e:
            return False, str(e)