"""
Application Factory for creating Flask application instances.
Implements the Factory Pattern for better testability and configuration management.
"""
import logging
from flask import Flask
from config.settings import get_config, Config
from core.extensions import init_extensions
from core.service_registry import init_services
from core.blueprints import register_blueprints

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_app(config_name: str = None) -> Flask:
    """
    Application factory function.
    Creates and configures a Flask application instance.
    
    Args:
        config_name: Configuration name (development, production, testing)
        
    Returns:
        Configured Flask application instance
    """
    logger.info(f"Creating Flask application with config: {config_name or 'default'}")
    
    # Create Flask app
    app = Flask(__name__)
    
    # Load configuration
    config = get_config(config_name)
    app.config.from_object(config)
    
    # Initialize extensions (CORS, etc.)
    logger.info("Initializing extensions...")
    init_extensions(app)
    
    # Initialize services (Supabase, Auth, Payment, etc.)
    logger.info("Initializing services...")
    if not init_services(config):
        logger.error("Failed to initialize required services")
        raise RuntimeError("Service initialization failed")
    
    # Register blueprints (routes)
    logger.info("Registering blueprints...")
    register_blueprints(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Register health check endpoint
    register_health_check(app)
    
    logger.info("Flask application created successfully")
    return app


def register_error_handlers(app: Flask) -> None:
    """
    Register global error handlers.
    
    Args:
        app: Flask application instance
    """
    from flask import jsonify
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'status': 'error',
            'message': 'Resource not found',
            'error_type': 'not_found'
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {error}")
        return jsonify({
            'status': 'error',
            'message': 'Internal server error',
            'error_type': 'server_error'
        }), 500
    
    @app.errorhandler(Exception)
    def handle_exception(error):
        logger.error(f"Unhandled exception: {error}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': 'An unexpected error occurred',
            'error_type': 'unexpected_error'
        }), 500


def register_health_check(app: Flask) -> None:
    """
    Register health check endpoint.
    
    Args:
        app: Flask application instance
    """
    from flask import jsonify
    from core.service_registry import get_service
    
    @app.route('/health', methods=['GET'])
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        services_status = {
            'supabase': get_service('supabase_service') is not None,
            'auth': get_service('auth_service') is not None,
            'payment': get_service('payment_service') is not None,
            'subscription': get_service('subscription_service') is not None,
            'email': get_service('email_service') is not None,
        }
        
        all_required_healthy = services_status['supabase'] and services_status['auth']
        
        return jsonify({
            'status': 'healthy' if all_required_healthy else 'degraded',
            'services': services_status,
            'version': '1.0.0'
        }), 200 if all_required_healthy else 503
