from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
from dotenv import load_dotenv
load_dotenv()  # This loads the environment variables from .env file
from supabase import create_client, Client
import firebase_admin
from firebase_admin import credentials, auth
import json
import base64

from flask_cors import CORS, cross_origin # Import CORS

# Import services
from services.auth_service import AuthService
from services.supabase_service import SupabaseService

# Import blueprints for routes
from routes.food_detection_routes import food_detection_bp
from routes.feedback_routes import feedback_bp
from routes.meal_plan_routes import meal_plan_bp
from routes.auth_routes import auth_bp
from routes.ai_session_routes import ai_session_bp

def create_app():
  """
  Factory function to create and configure the Flask application.
  """
  app = Flask(__name__)
  CORS(app) # Enable CORS for all routes

  # Initialize Supabase clients
  supabase_url = os.environ.get("SUPABASE_URL")
  supabase_service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
  
  if not supabase_url or not supabase_service_role_key:
      raise ValueError("Missing required Supabase credentials in .env file")
  
  # Create Supabase client with service role key for admin operations
  app.supabase_service = SupabaseService(supabase_url, supabase_service_role_key)
  
  # Initialize AuthService with regular Supabase client
  firebase_creds = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
   
  if not firebase_creds:
      print("Warning: FIREBASE_SERVICE_ACCOUNT_JSON not set. Authentication features will be disabled.")
      app.auth_service = None
  else:
      # Check if it's a file path
      if os.path.exists(firebase_creds):
          try:
              with open(firebase_creds, 'r') as f:
                  firebase_config = json.load(f)
              # Convert to base64 string
              firebase_creds = base64.b64encode(json.dumps(firebase_config).encode('utf-8')).decode('utf-8')
          except Exception as e:
              print(f"Error reading Firebase credentials from file: {str(e)}")
              firebase_creds = None
      
      try:
          app.auth_service = AuthService(firebase_creds, app.supabase_service.supabase)
      except Exception as e:
          print(f"Warning: Failed to initialize AuthService: {str(e)}")
          print("Authentication features will be disabled.")
          app.auth_service = None

  # Register blueprints
  app.register_blueprint(food_detection_bp, url_prefix='/')
  app.register_blueprint(feedback_bp, url_prefix='/')
  app.register_blueprint(meal_plan_bp, url_prefix='/')
  app.register_blueprint(auth_bp, url_prefix='/')
  app.register_blueprint(ai_session_bp, url_prefix='/')

  return app

if __name__ == '__main__':
  app = create_app()
  app.run(debug=True)
