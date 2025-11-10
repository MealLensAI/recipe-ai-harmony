# Quick Start: New Modular Architecture

## 🚀 Get Started in 2 Minutes

### Step 1: Run the New Architecture

```bash
cd backend
.\venv\Scripts\activate
python app_new.py
```

You should see:
```
============================================================
🚀 MealLens AI Backend Server
============================================================
Environment: development
Server: http://127.0.0.1:5001
Debug Mode: True
Health Check: http://127.0.0.1:5001/health
============================================================
```

### Step 2: Test Health Check

Open your browser or use curl:
```bash
curl http://127.0.0.1:5001/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "supabase": true,
    "auth": true,
    "payment": true,
    "subscription": true,
    "email": true
  },
  "version": "1.0.0"
}
```

### Step 3: Test Existing Endpoints

All your existing endpoints work exactly the same:

```bash
# Test profile endpoint (requires auth)
curl http://127.0.0.1:5001/api/profile

# Test with frontend
# Frontend is already running on http://localhost:5173/
# Just use the app normally - everything works!
```

## ✅ That's It!

Your backend is now running with the new modular architecture!

## 📊 What's Different?

### Better Logging
```
2025-11-10 12:50:36 - INFO - Creating Flask application
2025-11-10 12:50:36 - INFO - Initializing extensions...
2025-11-10 12:50:36 - INFO - Initializing services...
2025-11-10 12:50:36 - INFO - Supabase service initialized successfully
2025-11-10 12:50:36 - INFO - Auth service initialized successfully
2025-11-10 12:50:36 - INFO - Payment service initialized successfully
2025-11-10 12:50:36 - INFO - Flask application created successfully
```

### Health Check Endpoint
```bash
# Check if all services are healthy
curl http://127.0.0.1:5001/health

# Returns service status
{
  "status": "healthy",  # or "degraded" if optional services fail
  "services": {
    "supabase": true,   # Required
    "auth": true,       # Required
    "payment": true,    # Optional
    "subscription": true, # Optional
    "email": true       # Optional
  }
}
```

### Better Error Handling
```bash
# If a service is unavailable
curl http://127.0.0.1:5001/api/settings

# Returns clear error
{
  "status": "error",
  "message": "Service unavailable",
  "error_type": "service_unavailable"
}
```

## 🔄 Switch Between Old and New

### Run Old Version
```bash
python app.py
```

### Run New Version
```bash
python app_new.py
```

### Run Both (Different Ports)
```bash
# Terminal 1: Old version
python app.py

# Terminal 2: New version
FLASK_PORT=5002 python app_new.py
```

## 🧪 Testing

### Test Service Initialization
```bash
python -c "from core.app_factory import create_app; app = create_app(); print('✅ Works!')"
```

### Test Configuration
```bash
python -c "from config.settings import get_config; config = get_config(); print(f'Supabase URL: {config.SUPABASE_URL}')"
```

### Test DI Container
```bash
python -c "from core.service_registry import get_service; supabase = get_service('supabase_service'); print(f'✅ Supabase service: {supabase}')"
```

## 📝 Common Tasks

### Add a New Service

1. Create service in `services/my_service.py`:
```python
class MyService:
    def __init__(self, dependency):
        self.dependency = dependency
    
    def do_something(self):
        return "Hello!"
```

2. Register in `core/service_registry.py`:
```python
def init_services(config):
    # ... existing services ...
    
    # Add your service
    my_service = MyService(some_dependency)
    container.register_singleton('my_service', my_service)
```

3. Add helper in `core/dependencies.py`:
```python
def get_my_service():
    return get_service('my_service')
```

4. Use in routes:
```python
from core.dependencies import get_my_service

@bp.route('/my-endpoint')
def my_endpoint():
    service = get_my_service()
    result = service.do_something()
    return jsonify({'result': result})
```

### Add Environment Variable

1. Add to `.env`:
```env
MY_NEW_SETTING=value
```

2. Add to `config/settings.py`:
```python
class Config:
    MY_NEW_SETTING = os.environ.get('MY_NEW_SETTING', 'default')
```

3. Use anywhere:
```python
from config.settings import get_config

config = get_config()
print(config.MY_NEW_SETTING)
```

### Add a New Route

1. Create route file in `routes/my_routes.py`:
```python
from flask import Blueprint
from core.dependencies import get_supabase_service

my_bp = Blueprint('my_module', __name__)

@my_bp.route('/my-endpoint')
def my_endpoint():
    supabase = get_supabase_service()
    # ... logic ...
    return jsonify({'status': 'success'})
```

2. Register in `core/blueprints.py`:
```python
def register_blueprints(app):
    # ... existing blueprints ...
    
    from routes.my_routes import my_bp
    app.register_blueprint(my_bp, url_prefix='/api/my-module')
```

## 🎯 Key Differences

### Service Access

**Old Way:**
```python
from flask import current_app
supabase = current_app.supabase_service
```

**New Way:**
```python
from core.dependencies import get_supabase_service
supabase = get_supabase_service()
```

### Configuration

**Old Way:**
```python
supabase_url = os.environ.get("SUPABASE_URL")
```

**New Way:**
```python
from config.settings import get_config
config = get_config()
supabase_url = config.SUPABASE_URL
```

### App Creation

**Old Way:**
```python
app = Flask(__name__)
# 300+ lines of setup...
```

**New Way:**
```python
from core.app_factory import create_app
app = create_app()
```

## 🐛 Troubleshooting

### Service Not Found
```python
service = get_my_service()
if not service:
    return jsonify({'error': 'Service unavailable'}), 503
```

### Configuration Error
```bash
# Check if .env file exists
ls .env

# Check if variables are loaded
python -c "from config.settings import get_config; config = get_config(); config.validate()"
```

### Import Error
```bash
# Make sure you're in the backend directory
cd backend

# Activate virtual environment
.\venv\Scripts\activate

# Check Python path
python -c "import sys; print(sys.path)"
```

## 📚 Learn More

- **ARCHITECTURE.md** - Complete architecture documentation
- **MIGRATION_GUIDE.md** - Step-by-step migration
- **SCALABILITY_ANALYSIS.md** - Performance comparison
- **BEFORE_AFTER_COMPARISON.md** - Visual comparison

## 🎉 You're Ready!

The new architecture is:
- ✅ Running
- ✅ Tested
- ✅ Production-ready
- ✅ Backward compatible
- ✅ Easy to use

Start building with confidence! 🚀

---

**Questions?** Check the documentation or test the endpoints yourself!
