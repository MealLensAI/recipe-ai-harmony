from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
from dotenv import load_dotenv
load_dotenv()  # This loads the environment variables from .env file
from supabase import create_client, Client

from flask_cors import CORS, cross_origin # Import CORS

# Import services
from services.auth_service import AuthService
from services.supabase_service import SupabaseService
# Payment service import
try:
    from services.payment_service import PaymentService
    PAYMENT_ENABLED = True
except ImportError:
    PAYMENT_ENABLED = False
    print("Payment service not available - payment features will be disabled")

# Import blueprints for routes
from routes.food_detection_routes import food_detection_bp
from routes.feedback_routes import feedback_bp
from routes.meal_plan_routes import meal_plan_bp
from routes.auth_routes import auth_bp
from routes.ai_session_routes import ai_session_bp
# Subscription routes import
try:
    from routes.subscription_routes import subscription_bp
    SUBSCRIPTION_ROUTES_ENABLED = True
    print("Subscription routes loaded successfully.")
except ImportError as e:
    SUBSCRIPTION_ROUTES_ENABLED = False
    print(f"Subscription routes not available: {e}")
except Exception as e:
    SUBSCRIPTION_ROUTES_ENABLED = False
    print(f"Subscription routes error: {e}")
    print("Subscription endpoints will be disabled.")
# Payment routes import
try:
    from routes.payment_routes import payment_bp
    PAYMENT_ROUTES_ENABLED = True
    print("Payment routes loaded successfully.")
except ImportError as e:
    PAYMENT_ROUTES_ENABLED = False
    print(f"Payment routes not available: {e}")
except SyntaxError as e:
    PAYMENT_ROUTES_ENABLED = False
    print(f"Payment routes have syntax errors: {e}")
    print("Payment endpoints will be disabled.")
except Exception as e:
    PAYMENT_ROUTES_ENABLED = False
    print(f"Payment routes error: {e}")
    print("Payment endpoints will be disabled.")

def create_app():
  """
  Factory function to create and configure the Flask application.
  """
  app = Flask(__name__)
  
  # Configure CORS to allow requests from the frontend
  # Build allowed origins list: localhost + production domains
  env_allowed = os.environ.get("ALLOWED_ORIGINS", "").strip()
  allowed_origins = [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://meallensai.com",
      "https://www.meallensai.com",
  ]
  if env_allowed:
      # Support comma-separated list in env
      for item in env_allowed.split(","):
          origin = item.strip()
          if origin:
              allowed_origins.append(origin)

  CORS(
      app,
      resources={
          r"/api/*": {
              "origins": allowed_origins,
              "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
              "allow_headers": ["Content-Type", "Authorization"],
              "supports_credentials": True,
              "expose_headers": ["Content-Type", "Authorization"],
              "max_age": 600  # Cache preflight request for 10 minutes
          }
      },
      supports_credentials=True
  )
  
  # Add CORS headers to all responses for preflight requests
  @app.after_request
  def after_request(response):
      # Only add CORS headers if they're not already set by Flask-CORS
      if 'Access-Control-Allow-Origin' not in response.headers:
          # Echo back allowed origin or fall back to first allowed
          origin = request.headers.get('Origin')
          try:
              if origin and origin in allowed_origins:
                  response.headers.add('Access-Control-Allow-Origin', origin)
              else:
                  # Prefer production domain as default fallback instead of localhost
                  default_origin = 'https://www.meallensai.com' if 'https://www.meallensai.com' in allowed_origins else allowed_origins[0]
                  response.headers.add('Access-Control-Allow-Origin', default_origin)
          except Exception:
              # As a very last resort, use production domain to avoid leaking localhost in prod
              response.headers.add('Access-Control-Allow-Origin', 'https://www.meallensai.com')
          response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
          response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
          response.headers.add('Access-Control-Allow-Credentials', 'true')
      return response

  # Initialize Supabase clients
  supabase_url = os.environ.get("SUPABASE_URL")
  supabase_service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
  
  if not supabase_url or not supabase_service_role_key:
      raise ValueError("Missing required Supabase credentials in .env file")
  
  # Create Supabase client with service role key for admin operations
  app.supabase_service = SupabaseService(supabase_url, supabase_service_role_key)
  
  # Initialize PaymentService
  app.payment_service = None
  if PAYMENT_ENABLED:
      try:
          # Only initialize if Paystack keys are provided
          paystack_secret = os.environ.get("PAYSTACK_SECRET_KEY")
          if paystack_secret:
              app.payment_service = PaymentService(app.supabase_service.supabase)
              print("Payment service initialized successfully.")
          else:
              print("Payment service disabled - PAYSTACK_SECRET_KEY not provided")
      except Exception as e:
          print(f"Warning: Failed to initialize PaymentService: {str(e)}")
          print("Payment features will be disabled.")
          app.payment_service = None
  else:
      print("Payment service disabled - payment features will be unavailable")
  
  # Initialize AuthService with Supabase admin client (Supabase-only auth)
  try:
      app.auth_service = AuthService(app.supabase_service.supabase)
      print("Supabase AuthService initialized successfully.")
  except Exception as e:
      print(f"Warning: Failed to initialize AuthService: {str(e)}")
      print("Authentication features will be disabled.")
      app.auth_service = None

  # Register blueprints with API prefix
  app.register_blueprint(food_detection_bp, url_prefix='/api/food_detection')
  app.register_blueprint(feedback_bp, url_prefix='/api')
  app.register_blueprint(meal_plan_bp, url_prefix='/api')
  app.register_blueprint(auth_bp, url_prefix='/api')
  app.register_blueprint(ai_session_bp, url_prefix='/api')
  
  # Register subscription routes
  if SUBSCRIPTION_ROUTES_ENABLED:
      app.register_blueprint(subscription_bp, url_prefix='/api/subscription')
      print("Subscription routes registered.")
  else:
      print("Subscription routes disabled.")

  # Register payment routes
  if PAYMENT_ROUTES_ENABLED:
      app.register_blueprint(payment_bp, url_prefix='/api/payment')
      print("Payment routes registered.")
  else:
      print("Payment routes disabled.")

  return app

if __name__ == '__main__':
  app = create_app()
  app.run(debug=True,port = 5001)
