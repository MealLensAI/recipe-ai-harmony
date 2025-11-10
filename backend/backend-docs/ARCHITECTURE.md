# Backend Architecture - Modular Monolithic Design

## Overview

This backend follows a **Modular Monolithic Architecture** designed for scalability, maintainability, and testability. The architecture separates concerns into distinct modules while keeping everything in a single deployable unit.

## Architecture Principles

### 1. **Separation of Concerns**
- Each module has a single, well-defined responsibility
- Business logic is separated from routing logic
- Configuration is centralized and environment-aware

### 2. **Dependency Injection**
- Services are managed through a DI container
- Loose coupling between components
- Easy to mock for testing

### 3. **Layered Architecture**
```
┌─────────────────────────────────────┐
│         Routes Layer                │  ← HTTP endpoints
├─────────────────────────────────────┤
│      Business Logic Layer           │  ← Services
├─────────────────────────────────────┤
│      Data Access Layer              │  ← Supabase/Database
├─────────────────────────────────────┤
│      Infrastructure Layer           │  ← Config, DI, Extensions
└─────────────────────────────────────┘
```

### 4. **Modular Design**
Each module can be developed, tested, and deployed independently while sharing common infrastructure.

## Directory Structure

```
backend/
├── config/                    # Configuration management
│   ├── __init__.py
│   └── settings.py           # Environment-based configuration
│
├── core/                      # Core infrastructure
│   ├── __init__.py
│   ├── app_factory.py        # Application factory
│   ├── blueprints.py         # Blueprint registration
│   ├── container.py          # DI container
│   ├── dependencies.py       # Dependency helpers
│   ├── extensions.py         # Flask extensions
│   └── service_registry.py   # Service initialization
│
├── routes/                    # HTTP route handlers
│   ├── auth_routes.py        # Authentication endpoints
│   ├── user_settings_routes.py
│   ├── food_detection_routes.py
│   ├── meal_plan_routes.py
│   ├── payment_routes.py
│   ├── subscription_routes.py
│   ├── enterprise_routes.py
│   └── ...
│
├── services/                  # Business logic layer
│   ├── auth_service.py       # Authentication logic
│   ├── supabase_service.py   # Database operations
│   ├── payment_service.py    # Payment processing
│   ├── subscription_service.py
│   ├── email_service.py
│   └── ...
│
├── utils/                     # Utility functions
│   ├── auth_utils.py         # Auth helpers
│   ├── file_utils.py         # File operations
│   └── ...
│
├── app.py                     # Legacy entry point (deprecated)
├── app_new.py                 # New entry point (uses factory)
└── requirements.txt           # Python dependencies
```

## Key Components

### 1. Configuration Management (`config/`)

**Purpose**: Centralize all configuration and environment variables

**Features**:
- Environment-based configuration (dev, prod, test)
- Type-safe configuration access
- Validation of required variables
- Feature flags

**Usage**:
```python
from config.settings import get_config

config = get_config('production')
print(config.SUPABASE_URL)
```

### 2. Dependency Injection Container (`core/container.py`)

**Purpose**: Manage service lifecycle and dependencies

**Features**:
- Singleton pattern for services
- Factory pattern for lazy initialization
- Thread-safe operations
- Easy testing with mock services

**Usage**:
```python
from core.container import get_container

container = get_container()
container.register_singleton('my_service', MyService())
service = container.get('my_service')
```

### 3. Application Factory (`core/app_factory.py`)

**Purpose**: Create and configure Flask application instances

**Features**:
- Environment-aware configuration
- Automatic service initialization
- Blueprint registration
- Error handling setup
- Health check endpoint

**Usage**:
```python
from core.app_factory import create_app

app = create_app('production')
app.run()
```

### 4. Service Registry (`core/service_registry.py`)

**Purpose**: Initialize and register all services

**Features**:
- Centralized service initialization
- Dependency resolution
- Graceful degradation for optional services
- Logging and error handling

### 5. Dependency Helpers (`core/dependencies.py`)

**Purpose**: Provide easy access to services in routes

**Features**:
- Type-safe service access
- Clean API for routes
- Decoupled from Flask context

**Usage**:
```python
from core.dependencies import get_supabase_service

def my_route():
    supabase = get_supabase_service()
    # Use service...
```

## Benefits of This Architecture

### 1. **Scalability**
- Easy to add new modules/features
- Services can be extracted to microservices later
- Horizontal scaling ready
- Database connection pooling

### 2. **Maintainability**
- Clear separation of concerns
- Easy to locate and fix bugs
- Consistent patterns across codebase
- Self-documenting structure

### 3. **Testability**
- Services can be mocked easily
- Unit tests don't need Flask context
- Integration tests are isolated
- Test configuration separate from production

### 4. **Flexibility**
- Easy to swap implementations
- Feature flags for gradual rollouts
- Environment-specific behavior
- Optional services don't break the app

### 5. **Developer Experience**
- Clear onboarding path
- Consistent patterns
- Type hints and documentation
- Hot reload in development

## Migration Path

### Phase 1: Infrastructure Setup ✅
- [x] Create configuration module
- [x] Implement DI container
- [x] Build application factory
- [x] Set up service registry

### Phase 2: Service Migration
- [ ] Update routes to use DI
- [ ] Remove `current_app` dependencies
- [ ] Add type hints
- [ ] Write unit tests

### Phase 3: Enhancement
- [ ] Add caching layer
- [ ] Implement rate limiting
- [ ] Add request validation
- [ ] Set up monitoring

### Phase 4: Optimization
- [ ] Database query optimization
- [ ] Connection pooling
- [ ] Async operations
- [ ] Performance monitoring

## Design Patterns Used

### 1. **Factory Pattern**
- `create_app()` function
- Service factories in container

### 2. **Singleton Pattern**
- Service instances in container
- Configuration objects

### 3. **Dependency Injection**
- Service container
- Constructor injection in services

### 4. **Repository Pattern**
- `SupabaseService` abstracts database
- Easy to swap data sources

### 5. **Strategy Pattern**
- Different configurations for environments
- Pluggable services

## Best Practices

### 1. **Service Development**
```python
class MyService:
    """Service description"""
    
    def __init__(self, dependency: SomeDependency):
        self.dependency = dependency
    
    def do_something(self, param: str) -> Result:
        """Method description"""
        # Implementation
        pass
```

### 2. **Route Development**
```python
from core.dependencies import get_my_service

@bp.route('/endpoint', methods=['POST'])
def my_endpoint():
    """Endpoint description"""
    # Get service
    service = get_my_service()
    if not service:
        return jsonify({'error': 'Service unavailable'}), 503
    
    # Use service
    result = service.do_something(param)
    return jsonify(result), 200
```

### 3. **Configuration**
```python
# In config/settings.py
class Config:
    MY_SETTING = os.environ.get('MY_SETTING', 'default')
    
    @classmethod
    def validate(cls):
        if not cls.MY_SETTING:
            raise ValueError("MY_SETTING is required")
```

### 4. **Testing**
```python
def test_my_service():
    # Arrange
    mock_dependency = Mock()
    service = MyService(mock_dependency)
    
    # Act
    result = service.do_something('test')
    
    # Assert
    assert result.success
```

## Performance Considerations

### 1. **Database Connections**
- Connection pooling via Supabase client
- Lazy initialization of services
- Proper connection cleanup

### 2. **Caching**
- Service instances cached in container
- Configuration loaded once
- Future: Redis for data caching

### 3. **Async Operations**
- Future: Async routes for I/O operations
- Background tasks for long operations
- Queue system for async processing

## Security Considerations

### 1. **Authentication**
- JWT token validation
- Service-level auth checks
- Rate limiting (future)

### 2. **Configuration**
- Secrets in environment variables
- No hardcoded credentials
- Validation of all inputs

### 3. **CORS**
- Whitelist of allowed origins
- Proper headers configuration
- Credentials handling

## Monitoring & Logging

### 1. **Health Checks**
- `/health` endpoint
- Service status monitoring
- Database connectivity checks

### 2. **Logging**
- Structured logging
- Log levels per environment
- Error tracking (future: Sentry)

### 3. **Metrics** (Future)
- Request/response times
- Error rates
- Service availability

## Future Enhancements

### 1. **Microservices Migration**
- Each module can become a microservice
- Shared libraries for common code
- API gateway for routing

### 2. **Event-Driven Architecture**
- Message queue (RabbitMQ/Redis)
- Event sourcing
- CQRS pattern

### 3. **Advanced Features**
- GraphQL API
- WebSocket support
- Real-time notifications
- Advanced caching strategies

## Conclusion

This architecture provides a solid foundation for a scalable, maintainable backend. It follows industry best practices while remaining pragmatic and easy to understand. The modular design allows for gradual improvements and easy migration to microservices if needed.
