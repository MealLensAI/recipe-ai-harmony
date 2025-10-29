# URL Configuration Guide

This guide explains how to configure URLs for both development and production environments.

## 🎯 How It Works

The system automatically detects the correct frontend URL using this priority order:

1. **Environment Variable** (`FRONTEND_URL`) - if set, uses this value
2. **Request Origin Header** - auto-detects from the frontend making the request
3. **Fallback** - uses production URL as default

## 🔧 Configuration

### Backend Configuration (`backend/.env`)

```bash
# Frontend URL Configuration
# For development: FRONTEND_URL=http://localhost:5173
# For production: FRONTEND_URL=https://www.meallensai.com
FRONTEND_URL=https://www.meallensai.com
```

### Development Setup

**Option 1: Use Environment Variable (Recommended)**
```bash
# In backend/.env
FRONTEND_URL=http://localhost:5173
```

**Option 2: Auto-Detection (Default)**
```bash
# Remove or comment out FRONTEND_URL in backend/.env
# The system will auto-detect from request origin
```

### Production Setup

```bash
# In backend/.env
FRONTEND_URL=https://www.meallensai.com
```

## 🚀 Environment-Specific Configurations

### Development Environment
- **Frontend**: `http://localhost:5173` (Vite dev server)
- **Backend**: `http://localhost:5001` (Flask dev server)
- **Vite Config**: Uses proxy to forward `/api` requests to backend

### Production Environment
- **Frontend**: `https://www.meallensai.com`
- **Backend**: Your production backend URL
- **No Proxy**: Direct API calls to production backend

## 📧 Email Links Behavior

### Development
- If `FRONTEND_URL=http://localhost:5173` → Email links use `http://localhost:5173/accept-invitation`
- If no `FRONTEND_URL` set → Auto-detects from request origin

### Production
- If `FRONTEND_URL=https://www.meallensai.com` → Email links use `https://www.meallensai.com/accept-invitation`
- If no `FRONTEND_URL` set → Auto-detects from request origin

## 🔄 Switching Between Environments

### For Development Testing
```bash
# In backend/.env
FRONTEND_URL=http://localhost:5173
```

### For Production Deployment
```bash
# In backend/.env
FRONTEND_URL=https://www.meallensai.com
```

### For Auto-Detection (Both Environments)
```bash
# In backend/.env - comment out or remove FRONTEND_URL
# FRONTEND_URL=https://www.meallensai.com
```

## 🛠️ Troubleshooting

### Issue: Email links still use localhost in production
**Solution**: Set `FRONTEND_URL=https://www.meallensai.com` in your production backend environment

### Issue: Development links use production URL
**Solution**: Set `FRONTEND_URL=http://localhost:5173` in your development backend environment

### Issue: Want auto-detection for both environments
**Solution**: Remove `FRONTEND_URL` from backend/.env and let the system auto-detect

## 📝 Code Implementation

The system uses this helper function:

```python
def get_frontend_url():
    """Get the frontend URL from environment or auto-detect from request origin"""
    frontend_url = os.environ.get('FRONTEND_URL')
    if not frontend_url:
        # Auto-detect from request origin (works for both dev and production)
        frontend_url = request.headers.get('Origin', 'https://www.meallensai.com')
    return frontend_url
```

This ensures:
- ✅ **Development**: Uses localhost when running locally
- ✅ **Production**: Uses production domain when deployed
- ✅ **Flexibility**: Can override with environment variables
- ✅ **Fallback**: Always has a working URL
