"""
Main application entry point.
Uses the application factory pattern for better scalability and testability.
"""
import os
from core.app_factory import create_app

# Create application instance
app = create_app(config_name=os.environ.get('FLASK_ENV', 'development'))

if __name__ == '__main__':
    # Get configuration from app
    host = app.config.get('HOST', '127.0.0.1')
    port = app.config.get('PORT', 5000)
    debug = app.config.get('DEBUG', True)
    
    print(f"\n{'='*60}")
    print(f"🚀 MealLens AI Backend Server")
    print(f"{'='*60}")
    print(f"Environment: {os.environ.get('FLASK_ENV', 'development')}")
    print(f"Server: http://{host}:{port}")
    print(f"Debug Mode: {debug}")
    print(f"Health Check: http://{host}:{port}/health")
    print(f"{'='*60}\n")
    
    app.run(host=host, port=port, debug=debug)
