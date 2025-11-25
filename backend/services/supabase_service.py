import os
import json
from supabase import create_client, Client
from werkzeug.datastructures import FileStorage
from datetime import datetime
class SupabaseService:
    def __init__(self, supabase_url: str, supabase_key: str = None):
        """
        Initializes Supabase client.

        Args:
            supabase_url (str): The URL of your Supabase project.
            supabase_key (str): Your Supabase service role key. If not provided, will use SUPABASE_SERVICE_ROLE_KEY env var.
        """
        print(f"[DEBUG] Initializing Supabase client with URL: {supabase_url}")
        self.supabase_url = supabase_url  # Make supabase_url accessible as an attribute
        
        if not supabase_url:
            error_msg = "Supabase URL is required"
            print(f"[ERROR] {error_msg}")
            raise ValueError(error_msg)
            
        if not supabase_key:
            print("[DEBUG] No supabase_key provided, checking environment variables")
            supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
            
        if not supabase_key:
            error_msg = "Supabase service role key is required. Set SUPABASE_SERVICE_ROLE_KEY in your environment."
            print(f"[ERROR] {error_msg}")
            raise ValueError(error_msg)
            
        # Friendly status message (no key info)
        print("[INFO] Supabase service role key loaded.")
        
        # Check if key format looks like JWT (no payload print)
        key_parts = supabase_key.split('.') if supabase_key else []
        if not (supabase_key and len(key_parts) == 3):
            print("[WARNING] Supabase key format doesn't look like a valid JWT.")
        else:
            print("[INFO] Supabase key format looks valid.")
        
        try:
            print("[DEBUG] Creating Supabase client...")
            
            # Create the client (service role key provides full access)
            self.supabase: Client = create_client(supabase_url, supabase_key)
            
            # Store the key for verification
            self._service_role_key = supabase_key
            print("[INFO] Supabase client initialized successfully.")
                
            print("Supabase client initialized with service role key.")
            
        except Exception as e:
            error_msg = f"Failed to initialize Supabase client: {str(e)}"
            print(f"[ERROR] {error_msg}")
            if hasattr(e, 'args'):
                print(f"[ERROR] Error args: {e.args}")
            if hasattr(e, 'details'):
                print(f"[ERROR] Error details: {e.details}")
            raise

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
            # Try RPC first, fallback to direct insert
            try:
                result = self.supabase.rpc('submit_feedback', {
                    'p_user_id': user_id,
                    'p_feedback_text': feedback_text
                }).execute()
                
                if result.data and len(result.data) > 0 and result.data[0].get('status') == 'success':
                    return True, None
            except Exception as rpc_error:
                print(f"RPC failed, using direct insert: {rpc_error}")
            
            # Fallback: Direct table insert
            result = self.supabase.table('feedback').insert({
                'user_id': user_id,
                'feedback_text': feedback_text,
                'created_at': datetime.utcnow().isoformat() + 'Z'
            }).execute()
            
            if result.data:
                return True, None
            else:
                return False, 'Failed to save feedback'
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

    def save_detection_history(self, user_id: str, recipe_type: str, suggestion: str = None,
                              instructions: str = None, ingredients: str = None, detected_foods: str = None,
                              analysis_id: str = None, youtube: str = None, google: str = None, resources: str = None
                            ) -> tuple[bool, str | None]:
        try:
            # First try RPC function
            try:
                insert_data = {
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
                }
                insert_data = {k: v for k, v in insert_data.items() if v is not None}
                result = self.supabase.rpc('add_detection_history', insert_data).execute()
                if result.data and len(result.data) > 0:
                    data = result.data[0] if isinstance(result.data, list) else result.data
                    if data.get('status') == 'success':
                        print(f"✅ Detection history saved via RPC for user {user_id}")
                        return True, None
                    else:
                        error = data.get('message', 'RPC returned non-success status')
                        print(f"⚠️ RPC error: {error}, falling back to direct insert")
                        # Fall through to direct insert
            except Exception as rpc_error:
                print(f"⚠️ RPC failed: {rpc_error}, falling back to direct insert")
                # Fall through to direct insert
            
            # Fallback: Direct table insert
            print(f"📝 Using direct table insert for detection history")
            direct_insert = {
                'user_id': user_id,
                'recipe_type': recipe_type,  # FIXED: detection_type → recipe_type (matches table schema)
            }
            
            # Only add non-empty optional fields (prevents empty string to JSONB issues)
            if suggestion:
                direct_insert['suggestion'] = suggestion
            if instructions:
                direct_insert['instructions'] = instructions
            if ingredients:
                direct_insert['ingredients'] = ingredients
            if detected_foods:
                direct_insert['detected_foods'] = detected_foods
            if analysis_id:
                direct_insert['analysis_id'] = analysis_id
            if youtube:
                direct_insert['youtube'] = youtube
            if google:
                direct_insert['google'] = google
            if resources:
                direct_insert['resources'] = resources
            
            result = self.supabase.table('detection_history').insert(direct_insert).execute()
            
            if result.data:
                print(f"✅ Detection history saved via direct insert for user {user_id}")
                return True, None
            else:
                print(f"❌ Direct insert failed")
                return False, 'Failed to save detection history via direct insert'
                
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Error in save_detection_history: {error_msg}")
            return False, error_msg

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
            
            if result.data and len(result.data) > 0 and result.data[0].get('status') == 'success':
                return True, None
            else:
                error = result.data[0].get('message') if (result.data and len(result.data) > 0) else 'No record found or user not authorized to update this record.'
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
            
            if result.data:
                if len(result.data) > 0 and isinstance(result.data[0], dict) and result.data[0].get('status') == 'error':
                    error = result.data[0].get('message', 'Failed to fetch detection history')
                    # Fallback to direct table query
                    table_result = self.supabase.table('detection_history').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
                    return table_result.data or [], None
                else:
                    return result.data, None
            else:
                # Fallback to direct table query when RPC returns no data
                table_result = self.supabase.table('detection_history').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
                return table_result.data or [], None
        except Exception:
            # Final fallback: direct table query
            try:
                table_result = self.supabase.table('detection_history').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
                return table_result.data or [], None
            except Exception as e2:
                return None, str(e2)

    def delete_detection_history(self, user_id: str, record_id: str) -> tuple[bool, str | None]:
        """
        Deletes a specific detection history record for a user.
        """
        try:
            result = self.supabase.table('detection_history').delete().eq('id', record_id).eq('user_id', user_id).execute()
            if result.data:
                return True, None
            return False, 'Record not found or not authorized'
        except Exception as e:
            return False, str(e)

    def normalize_meal_plan_entry(self, raw_plan, user_id=None):
        import uuid
        from datetime import datetime

        # If already normalized (has mealPlan at top level), use it directly
        if 'mealPlan' in raw_plan:
            meal_plan_obj = raw_plan
        else:
            meal_plan_obj = raw_plan.get('meal_plan')
            if isinstance(meal_plan_obj, str):
                try:
                    meal_plan_obj = json.loads(meal_plan_obj)
                except Exception:
                    meal_plan_obj = {}
            if isinstance(meal_plan_obj, dict) and 'plan_data' in meal_plan_obj:
                meal_plan_obj = meal_plan_obj['plan_data']

        name = raw_plan.get('name') or (meal_plan_obj.get('name') if meal_plan_obj else None)
        start_date = raw_plan.get('start_date') or raw_plan.get('startDate') or (meal_plan_obj.get('startDate') if meal_plan_obj else None)
        end_date = raw_plan.get('end_date') or raw_plan.get('endDate') or (meal_plan_obj.get('endDate') if meal_plan_obj else None)
        meal_plan = raw_plan.get('mealPlan') or (meal_plan_obj.get('mealPlan') if isinstance(meal_plan_obj, dict) else meal_plan_obj)

        if not user_id:
            user_id = raw_plan.get('user_id')
        if not raw_plan.get('id'):
            plan_id = str(uuid.uuid4())
        else:
            plan_id = raw_plan.get('id')
        now = datetime.utcnow().isoformat() + 'Z'
        return {
            "id": plan_id,
            "user_id": user_id,
            "name": name,
            "start_date": start_date,
            "end_date": end_date,
            "meal_plan": meal_plan,
            "created_at": raw_plan.get('created_at', now),
            "updated_at": raw_plan.get('updated_at', now)
        }

    def save_meal_plan(self, user_id: str, plan_data: dict):
        """
        Saves a user's meal plan using direct table insertion to match React code structure.
        Returns the inserted meal plan data.
        """
        try:
            print(f"[DEBUG] Saving meal plan for user: {user_id}, plan_data: {plan_data}")

            # Extract data from plan_data to match React structure
            name = plan_data.get('name')
            start_date = plan_data.get('startDate') or plan_data.get('start_date')
            end_date = plan_data.get('endDate') or plan_data.get('end_date')
            meal_plan = plan_data.get('mealPlan') or plan_data.get('meal_plan')
            has_sickness = plan_data.get('has_sickness', False)
            sickness_type = plan_data.get('sickness_type', '')
            
            print(f"[DEBUG] Extracted data - name: {name}, start_date: {start_date}, end_date: {end_date}")
            print(f"[DEBUG] sickness data - has_sickness: {has_sickness}, sickness_type: {sickness_type}")
            print(f"[DEBUG] meal_plan data: {meal_plan}")
            print(f"[DEBUG] meal_plan type: {type(meal_plan)}")

            # Create insert data matching React structure
            insert_data = {
                'user_id': user_id,
                'name': name,
                'start_date': start_date,
                'end_date': end_date,
                'meal_plan': meal_plan,
                'has_sickness': has_sickness,
                'sickness_type': sickness_type,
                'created_at': plan_data.get('created_at') or datetime.utcnow().isoformat() + 'Z',
                'updated_at': plan_data.get('updated_at') or datetime.utcnow().isoformat() + 'Z'
            }

            # Insert directly into table using Python client syntax
            result = self.supabase.table('meal_plan_management').insert(insert_data).execute()

            print(f"[DEBUG] Supabase insert result: data={result.data}")

            if result.data and len(result.data) > 0:
                # Get the inserted record (first item in the array)
                inserted_data = result.data[0]
                
                print(f"[DEBUG] inserted_data = {inserted_data}")
                
                # Return data in the format expected by frontend
                return {
                    'id': inserted_data['id'],
                    'name': inserted_data['name'],
                    'startDate': inserted_data['start_date'],
                    'endDate': inserted_data['end_date'],
                    'mealPlan': inserted_data['meal_plan'],
                    'createdAt': inserted_data['created_at'],
                    'updatedAt': inserted_data['updated_at'],
                    'hasSickness': inserted_data.get('has_sickness', False),
                    'sicknessType': inserted_data.get('sickness_type', '')
                }
            else:
                print(f"[ERROR] Supabase insert error: No data returned")
                return None, 'Failed to save meal plan'

        except Exception as e:
            print(f"[ERROR] Exception in save_meal_plan: {e}")
            return None, str(e)
    # def save_meal_plan(self, user_id: str, plan_data: dict) -> tuple[bool, str | None]:
    #     """
    #     Saves a user's meal plan using RPC.
    #     """
    #     try:
    #         print(f"[DEBUG] Saving meal plan for user: {user_id}, plan_data: {plan_data}")
    #         # Normalize the plan_data before saving
    #         normalized_plan = self.normalize_meal_plan_entry(plan_data, user_id)
    #         plan_data_json = json.dumps(normalized_plan)
    #         result = self.supabase.rpc('upsert_meal_plan', {
    #             'p_user_id': user_id,
    #             'p_plan_data': plan_data_json
    #         }).execute()
    #         print(f"[DEBUG] Supabase RPC result: data={result.data} count={getattr(result, 'count', None)}")
    #         if result.data:
    #             if isinstance(result.data, dict) and result.data.get('status') == 'success':
    #                 return True, None
    #             elif isinstance(result.data, list) and result.data and result.data[0].get('status') == 'success':
    #                 return True, None
    #             else:
    #                 if isinstance(result.data, dict):
    #                     error = result.data.get('message', 'Failed to save meal plan')
    #                 elif isinstance(result.data, list) and result.data:
    #                     error = result.data[0].get('message', 'Failed to save meal plan')
    #                 else:
    #                     error = 'Failed to save meal plan'
    #                 print(f"[ERROR] Supabase RPC error: {error}")
    #                 return False, error
    #         else:
    #             print(f"[ERROR] Supabase RPC error: No data returned")
    #             return False, 'Failed to save meal plan'
    #     except Exception as e:
    #         print(f"[ERROR] Exception in save_meal_plan: {e}")
    #         return False, str(e)t

    def get_meal_plans(self, user_id: str) -> tuple[list | None, str | None]:
        """
        Retrieves a user's meal plans using direct table query.

        Args:
            user_id (str): The Supabase user ID.

        Returns:
            tuple[list | None, str | None]: (list of meal plans, None) on success,
                                          (None, error_message) on failure.
        """
        try:
            print(f"[DEBUG] Fetching meal plans for user: {user_id}")
            
            # Query the meal_plan_management table directly
            result = self.supabase.table('meal_plan_management').select('*').eq('user_id', user_id).order('updated_at', desc=True).execute()
            
            print(f"[DEBUG] Query result: {result.data}")
            
            if result.data is not None:
                # Return the list of meal plans
                return result.data, None
            else:
                return [], None
        except Exception as e:
            print(f"[ERROR] Exception in get_meal_plans: {e}")
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
        fallback_error = None
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
                fallback_error = result.data[0].get('message') if result.data else 'Failed to save session'
        except Exception as e:
            fallback_error = str(e)

        # Fallback to direct table insert if RPC is unavailable or failed
        try:
            payload = {
                'id': session_id,
                'user_id': user_id,
                'login_at': created_at,
            }
            if session_data:
                try:
                    payload['device_info'] = json.dumps(session_data)
                except Exception:
                    payload['device_info'] = str(session_data)
            result = self.supabase.table('user_sessions').insert(payload).execute()
            if result.data:
                return True, None
            return False, fallback_error or 'Failed to save session'
        except Exception as insert_error:
            return False, fallback_error or f'Failed to save session via fallback: {str(insert_error)}'

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
            
            # The RPC function returns the data directly as a JSONB array
            # or null if no records, or an error object if there's an exception
            if result.data:
                if isinstance(result.data[0], dict) and result.data[0].get('status') == 'error':
                    # Error case
                    error = result.data[0].get('message', 'Failed to list sessions')
                    return None, error
                else:
                    # Success case - data is returned directly as array
                    return result.data[0] if result.data[0] is not None else [], None
            else:
                return [], None
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

    def update_meal_plan(self, user_id: str, plan_id: str, plan_data: dict) -> tuple[bool, str | None]:
        """
        Updates an existing meal plan using RPC.

        Args:
            user_id (str): The Supabase user ID.
            plan_id (str): The meal plan ID to update.
            plan_data (dict): The updated meal plan data (JSONB).

        Returns:
            tuple[bool, str | None]: (True, None) on success, (False, error_message) on failure.
        """
        try:
            result = self.supabase.rpc('update_meal_plan', {
                'p_user_id': user_id,
                'p_plan_id': plan_id,
                'p_plan_data': plan_data
            }).execute()
            
            if result.data and result.data[0].get('status') == 'success':
                return True, None
            else:
                error = result.data[0].get('message') if result.data else 'Failed to update meal plan'
                return False, error
        except Exception as e:
            return False, str(e)

    def delete_meal_plan(self, user_id: str, plan_id: str) -> tuple[bool, str | None]:
        """
        Deletes a meal plan using direct table operations.
        """
        try:
            print(f"[DEBUG] Attempting to delete meal plan {plan_id} for user {user_id}")
            
            # Delete directly from table
            result = self.supabase.table('meal_plan_management').delete().eq('user_id', user_id).eq('id', plan_id).execute()
            
            print(f"[DEBUG] Delete result: {result}")
            
            if result.data:
                print(f"[DEBUG] Delete successful")
                return True, None
            else:
                print(f"[DEBUG] No rows deleted")
                return False, 'Meal plan not found or not authorized'
        except Exception as e:
            print(f"[DEBUG] Exception in delete_meal_plan: {e}")
            return False, str(e)

    def clear_meal_plans(self, user_id: str) -> tuple[bool, str | None]:
        """
        Clears all meal plans for a user using RPC.

        Args:
            user_id (str): The Supabase user ID.

        Returns:
            tuple[bool, str | None]: (True, None) on success, (False, error_message) on failure.
        """
        try:
            result = self.supabase.rpc('clear_user_meal_plans', {
                'p_user_id': user_id
            }).execute()
            
            if result.data and result.data[0].get('status') == 'success':
                return True, None
            else:
                error = result.data[0].get('message') if result.data else 'Failed to clear meal plans'
                return False, error
        except Exception as e:
            return False, str(e)

    def save_user_settings(self, user_id: str, settings_type: str, settings_data: dict) -> tuple[bool, str | None]:
        """
        Saves user settings using direct table insert (fallback if RPC doesn't work).

        Args:
            user_id (str): The Supabase user ID.
            settings_type (str): Type of settings (e.g., 'health_profile').
            settings_data (dict): The settings data to save.

        Returns:
            tuple[bool, str | None]: (True, None) on success, (False, error_message) on failure.
        """
        try:
            print(f"[DEBUG] save_user_settings called: user_id={user_id}, type={settings_type}")
            print(f"[DEBUG] settings_data: {settings_data}")
            
            # First try RPC function
            try:
                print(f"[DEBUG] Attempting RPC upsert_user_settings...")
                result = self.supabase.rpc('upsert_user_settings', {
                    'p_user_id': user_id,
                    'p_settings_type': settings_type,
                    'p_settings_data': json.dumps(settings_data) if isinstance(settings_data, dict) else settings_data
                }).execute()
                
                print(f"[DEBUG] RPC result: {result.data}")
                
                if result.data and len(result.data) > 0:
                    data = result.data[0] if isinstance(result.data, list) else result.data
                    if data.get('status') == 'success':
                        print(f"[SUCCESS] Settings saved via RPC")
                        return True, None
                    else:
                        error = data.get('message', 'Failed to save settings')
                        print(f"[WARNING] RPC error: {error}, falling back to direct insert")
                        # Fall through to direct insert
            except Exception as rpc_error:
                print(f"[WARNING] RPC failed: {rpc_error}, falling back to direct insert")
                # Fall through to direct insert
            
            # Fallback: Direct table upsert to guarantee persistence
            print(f"[DEBUG] Using direct table upsert for user_id={user_id}, type={settings_type}")
            
            print(f"[DEBUG] Checking if settings record exists...")
            existing = self.supabase.table('user_settings').select('*').eq('user_id', user_id).eq('settings_type', settings_type).execute()
            print(f"[DEBUG] Existing records: {existing.data}")
            record_exists = bool(existing.data and len(existing.data) > 0)
            existing_settings = existing.data[0].get('settings_data', {}) if record_exists else None
            
            normalized_settings = settings_data
            if isinstance(settings_data, dict):
                # Ensure the payload is JSON serializable and detached from React proxies
                normalized_settings = json.loads(json.dumps(settings_data))
            
            timestamp = datetime.utcnow().isoformat() + 'Z'
            upsert_payload = {
                'user_id': user_id,
                'settings_type': settings_type,
                'settings_data': normalized_settings,
                'updated_at': timestamp
            }
            if not record_exists:
                upsert_payload['created_at'] = timestamp
            
            result = (
                self.supabase
                    .table('user_settings')
                    .upsert(upsert_payload, on_conflict='user_id,settings_type')
                    .select('*')
                    .execute()
            )
            print(f"[DEBUG] Upsert result: {result.data}")
            
            if not result.data:
                print(f"[ERROR] No data returned from upsert operation")
                return False, 'Failed to save settings via upsert'
            
            persisted_record = result.data[0]
            changed_fields = []
            if isinstance(existing_settings, dict) and isinstance(normalized_settings, dict):
                for key in normalized_settings.keys():
                    if existing_settings.get(key) != normalized_settings.get(key):
                        changed_fields.append(key)
                for key in existing_settings.keys():
                    if key not in normalized_settings:
                        changed_fields.append(f"{key} (removed)")
            elif isinstance(normalized_settings, dict):
                changed_fields = list(normalized_settings.keys())
            
            try:
                history_data = {
                    'user_id': user_id,
                    'settings_type': settings_type,
                    'settings_data': persisted_record.get('settings_data', normalized_settings),
                    'previous_settings_data': existing_settings,
                    'changed_fields': changed_fields,
                    'created_at': timestamp,
                    'created_by': user_id
                }
                self.supabase.table('user_settings_history').insert(history_data).execute()
                print(f"[DEBUG] Saved settings history with {len(changed_fields)} changed fields")
            except Exception as history_error:
                print(f"[WARNING] Failed to save settings history: {history_error}")
            
            print(f"[SUCCESS] Settings saved via direct table upsert")
            return True, None
                
        except Exception as e:
            error_msg = str(e)
            print(f"[ERROR] Exception in save_user_settings: {error_msg}")
            import traceback
            traceback.print_exc()
            return False, error_msg

    def get_user_settings(self, user_id: str, settings_type: str = 'health_profile') -> tuple[dict | None, str | None]:
        """
        Retrieves user settings using direct table query (fallback if RPC doesn't work).

        Args:
            user_id (str): The Supabase user ID.
            settings_type (str): Type of settings to retrieve.

        Returns:
            tuple[dict | None, str | None]: (settings_data, None) on success,
                                          (None, error_message) on failure.
        """
        try:
            print(f"[DEBUG] get_user_settings called: user_id={user_id}, type={settings_type}")
            
            # First try RPC function
            try:
                print(f"[DEBUG] Attempting RPC get_user_settings...")
                result = self.supabase.rpc('get_user_settings', {
                    'p_user_id': user_id,
                    'p_settings_type': settings_type
                }).execute()
                
                print(f"[DEBUG] RPC result: {result.data}")
                
                if result.data and len(result.data) > 0:
                    data = result.data[0] if isinstance(result.data, list) else result.data
                    if data.get('status') == 'success':
                        print(f"[SUCCESS] Settings retrieved via RPC")
                        return data.get('data'), None
            except Exception as rpc_error:
                print(f"[WARNING] RPC failed: {rpc_error}, falling back to direct query")
                # Fall through to direct query
            
            # Fallback: Direct table query
            print(f"[DEBUG] Using direct table query...")
            result = self.supabase.table('user_settings').select('*').eq('user_id', user_id).eq('settings_type', settings_type).execute()
            print(f"[DEBUG] Query result: {result.data}")
            
            if result.data and len(result.data) > 0:
                print(f"[SUCCESS] Settings retrieved via direct query")
                return result.data[0], None
            else:
                print(f"[INFO] No settings found for user")
                return None, None  # No settings found is not an error
                
        except Exception as e:
            error_msg = str(e)
            print(f"[ERROR] Exception in get_user_settings: {error_msg}")
            import traceback
            traceback.print_exc()
            return None, error_msg

    def delete_user_settings(self, user_id: str, settings_type: str) -> tuple[bool, str | None]:
        """
        Deletes user settings using RPC.

        Args:
            user_id (str): The Supabase user ID.
            settings_type (str): Type of settings to delete.

        Returns:
            tuple[bool, str | None]: (True, None) on success, (False, error_message) on failure.
        """
        try:
            result = self.supabase.rpc('delete_user_settings', {
                'p_user_id': user_id,
                'p_settings_type': settings_type
            }).execute()
            
            if result.data and result.data[0].get('status') == 'success':
                return True, None
            else:
                error = result.data[0].get('message') if result.data else 'Failed to delete settings'
                return False, error
        except Exception as e:
            return False, str(e)