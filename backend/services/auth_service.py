import os
import json
import base64
import firebase_admin
from firebase_admin import credentials, auth
from supabase import Client # Import Client for type hinting
from typing import Optional, Tuple

class AuthService:
    """
    Manages user authentication and mapping between Firebase and Supabase.
    """
    def __init__(self, firebase_service_account_json: str, supabase_admin_client: Client):
        """
        Initializes the AuthService with Firebase and Supabase admin clients.

        Args:
            firebase_service_account_json (str): Base64 encoded JSON string of Firebase service account.
            supabase_admin_client (Client): Supabase client initialized with service_role key.
        """
        self.firebase_app = None
        self.supabase_admin = supabase_admin_client
        self._initialize_firebase(firebase_service_account_json)

    def _initialize_firebase(self, firebase_service_account_json: str):
        """
        Initializes the Firebase Admin SDK.
        """
        if not firebase_service_account_json:
            print("FIREBASE_SERVICE_ACCOUNT_JSON environment variable not set. Firebase authentication will be disabled.")
            return

        try:
            # First try to read from file path
            if os.path.exists(firebase_service_account_json):
                with open(firebase_service_account_json, 'r') as f:
                    firebase_config = json.load(f)
            else:
                # If not a file path, try base64 decoding
                try:
                    firebase_config = json.loads(base64.b64decode(firebase_service_account_json))
                except:
                    # If that fails, assume it's raw JSON string
                    firebase_config = json.loads(firebase_service_account_json)
            
            cred = credentials.Certificate(firebase_config)
            self.firebase_app = firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully.")
        except Exception as e:
            print(f"Error initializing Firebase Admin SDK: {str(e)}")
            self.firebase_app = None

    def _verify_supabase_token(self, token: str) -> Tuple[Optional[str], str]:
        """
        Verifies a Supabase JWT token and returns the user ID.
        
        Args:
            token (str): Supabase JWT token
            
        Returns:
            Tuple[Optional[str], str]: (user_id, auth_type) or (None, '') if verification fails
        """
        try:
            # Use Supabase admin client to verify the token
            # This will decode the JWT and verify it's valid
            user = self.supabase_admin.auth.get_user(token)
            if user and user.user:
                # Get the profile for this user
                profile_data = self.supabase_admin.table('profiles').select('id').eq('id', user.user.id).single().execute()
                if profile_data.data:
                    return profile_data.data['id'], 'supabase'
                else:
                    print(f"No profile found for Supabase user {user.user.id}")
                    return None, ''
            else:
                print("Invalid Supabase token")
                return None, ''
        except Exception as e:
            print(f"Error verifying Supabase token: {str(e)}")
            return None, ''

    def _verify_firebase_token(self, token: str) -> Tuple[Optional[str], str]:
        """
        Verifies a Firebase ID token and returns the corresponding Supabase user ID.
        
        Args:
            token (str): Firebase ID token
            
        Returns:
            Tuple[Optional[str], str]: (user_id, auth_type) or (None, '') if verification fails
        """
        if not self.firebase_app:
            print("Firebase app not initialized")
            return None, ''
            
        try:
            # Verify Firebase token
            decoded_token = auth.verify_id_token(token)
            firebase_uid = decoded_token['uid']
            firebase_email = decoded_token.get('email')
            firebase_display_name = decoded_token.get('name')

            # Check if user exists in Supabase profiles
            try:
                profile_data = self.supabase_admin.table('profiles').select('id').eq('firebase_uid', firebase_uid).single().execute()
                if profile_data.data:
                    return profile_data.data['id'], 'firebase'
                # Get or create profile for this user
                profile_response = self.supabase_admin.table('profiles').select('id').eq('supabase_user_id', decoded_token['uid']).limit(1).execute()
                if profile_response and profile_response.data and len(profile_response.data) > 0:
                    return profile_response.data[0]['id'], 'firebase'
                # Create new profile
                new_profile = self.supabase_admin.table('profiles').insert({
                    'supabase_user_id': decoded_token['uid'],
                    'firebase_uid': firebase_uid,
                    'email': firebase_email,
                    'name': firebase_display_name,
                    'created_at': 'now()'
                }).execute()
                if new_profile and new_profile.data and len(new_profile.data) > 0:
                    return new_profile.data[0]['id'], 'firebase'
                else:
                    print(f"Failed to create profile for Supabase user {decoded_token['uid']}")
                    return None, ''
            except Exception as e:
                print(f"Error verifying Firebase token: {str(e)}")
                return None, ''
        except Exception as e:
            print(f"Firebase token verification or mapping failed: {e}")
            return None, ''

    def get_supabase_user_id_from_token(self, token: str) -> Tuple[Optional[str], str]:
        """
        Verifies a token (Firebase or Supabase) and returns the corresponding Supabase user ID.
        
        Args:
            token (str): Firebase ID token or Supabase JWT token (with or without 'Bearer ' prefix)
            
        Returns:
            Tuple[Optional[str], str]: (user_id, auth_type) or (None, '') if verification fails
        """
        print(f"\n--- Verifying token ---")  # Debug
        print(f"Token length: {len(token) if token else 0}")
        print(f"Token starts with: {token[:30]}..." if token else "No token provided")
        
        if not token:
            print("No token provided")
            return None, ''
            
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
            print("Removed 'Bearer ' prefix from token")
            
        # Try to verify as Supabase token first (most common for email/password login)
        print("Attempting to verify as Supabase token...")
        user_id, auth_type = self._verify_supabase_token(token)
        if user_id:
            print(f"Successfully verified as Supabase token. User ID: {user_id}")
            return user_id, auth_type
            
        # If Supabase verification fails, try Firebase
        print("Supabase verification failed, attempting Firebase verification...")
        user_id, auth_type = self._verify_firebase_token(token)
        if user_id:
            print(f"Successfully verified as Firebase token. User ID: {user_id}")
            return user_id, auth_type
            
        print("Both Supabase and Firebase token verification failed")
        return None, ''