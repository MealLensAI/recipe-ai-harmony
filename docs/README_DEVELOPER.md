# MealLens AI - Developer Guide

## 🎯 Current Status

### ✅ Working
- **Frontend**: Running on `http://localhost:5173/`
- **Frontend Code**: All components, pages, and hooks are properly implemented
- **Dependencies**: All npm packages installed successfully

### ❌ Not Working (Requires Fix)
- **Backend Server**: Cannot start due to Python 3.13 compatibility issue
- **Settings Save**: Requires backend API
- **History Fetch**: Requires backend API

## 🔴 Critical Issue: Python Version

**Your System**: Python 3.13.0 (alpha/beta)
**Required**: Python 3.11.x or 3.12.x (stable)

**Why This Matters**: Python 3.13 is still in development and the `pydantic-core` library (required by Supabase) doesn't have compatible binary wheels yet.

## 🚀 Quick Fix Guide

### Step 1: Check Your Python Version
```cmd
cd recipe-ai-harmony\backend
python check_python.py
```

### Step 2: Install Compatible Python

#### Option A: Direct Download (Easiest)
1. Go to https://www.python.org/downloads/
2. Download Python 3.11.9 or 3.12.x
3. Run installer
4. ✅ Check "Add Python to PATH"
5. Install

#### Option B: Chocolatey (Windows Package Manager)
```cmd
choco install python311
```

#### Option C: Scoop
```cmd
scoop install python311
```

### Step 3: Set Up Backend
```cmd
# Navigate to backend
cd C:\Projects\meallens-ai\recipe-ai-harmony\backend

# Verify Python version (should show 3.11.x or 3.12.x)
python --version

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python app.py
```

### Step 4: Verify Everything Works

**Backend Should Show**:
```
Payment service initialized successfully.
Supabase AuthService initialized successfully.
* Running on http://127.0.0.1:5001
```

**Test in Browser**:
1. Frontend: `http://localhost:5173/`
2. Go to Settings page
3. Fill in health profile
4. Click "Save Health Profile"
5. Should see success message ✅

## 📁 Project Structure

```
recipe-ai-harmony/
├── backend/                    # Python Flask backend
│   ├── app.py                 # Main Flask application
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables (configured ✅)
│   ├── routes/                # API route handlers
│   ├── services/              # Business logic
│   └── utils/                 # Helper functions
│
├── src/                       # React frontend
│   ├── components/            # Reusable UI components
│   ├── pages/                 # Page components
│   │   ├── Settings.tsx       # ❌ Needs backend
│   │   └── History.tsx        # ❌ Needs backend
│   ├── hooks/                 # Custom React hooks
│   │   └── useSicknessSettings.ts  # Settings management
│   ├── lib/                   # Utilities and services
│   │   ├── api.ts            # API client
│   │   └── config.ts         # App configuration
│   └── main.tsx              # App entry point
│
├── vite.config.ts            # Vite configuration (proxy setup ✅)
└── package.json              # Node dependencies
```

## 🔧 Technical Details

### Frontend-Backend Communication

```
User Action (Settings/History)
    ↓
React Component
    ↓
Custom Hook (useSicknessSettings)
    ↓
API Service (api.ts)
    ↓
Vite Proxy (/api/* → http://127.0.0.1:5001)
    ↓
Flask Backend (app.py)
    ↓
Supabase Database
```

### Settings Save Flow

**File**: `src/pages/Settings.tsx`
```typescript
handleSave() 
  → useSicknessSettings.saveSettings()
  → api.saveUserSettings()
  → POST /api/settings
  → Backend: user_settings_routes.py
  → Supabase: user_settings table
```

### History Fetch Flow

**File**: `src/pages/History.tsx`
```typescript
useEffect()
  → api.getDetectionHistory()
  → GET /api/food_detection/detection_history
  → Backend: food_detection_routes.py
  → Supabase: shared_recipes table
```

## 🐛 Troubleshooting

### Backend Won't Start

**Check Python Version**:
```cmd
python --version
# Should show 3.11.x or 3.12.x, NOT 3.13.x
```

**Check Virtual Environment**:
```cmd
# Should see (venv) in your terminal prompt
# If not, activate it:
venv\Scripts\activate
```

**Check Dependencies**:
```cmd
pip list | findstr pydantic
# Should show pydantic and pydantic-core
```

### Settings Not Saving

**Check Backend is Running**:
```cmd
# Visit in browser:
http://127.0.0.1:5001/api/profile
# Should return JSON, not error
```

**Check Browser Console** (F12):
- Look for network errors
- Check if `/api/settings` request is being made
- Verify response status

**Check Backend Terminal**:
- Look for error messages
- Verify request is received

### History Not Loading

**Check Backend Logs**:
```cmd
# Backend terminal should show:
GET /api/food_detection/detection_history
```

**Check Browser Network Tab** (F12):
- Look for `/api/food_detection/detection_history` request
- Check response status and data

## 📝 Environment Variables

**Backend** (`.env` file - Already configured ✅):
```env
SUPABASE_URL=https://pklqumlzpklzroafmtrs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<configured>
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
FRONTEND_URL=http://localhost:5173
```

**Frontend** (uses Vite proxy):
- No additional configuration needed
- Proxy configured in `vite.config.ts`

## 🎓 Key Learnings

1. **Python Version Matters**: Always use stable Python versions (3.11, 3.12) for production dependencies
2. **Virtual Environments**: Always use venv to isolate project dependencies
3. **API Communication**: Frontend uses Vite proxy to avoid CORS issues in development
4. **State Management**: Settings and history are stored in Supabase, not localStorage
5. **Error Handling**: Both frontend and backend have comprehensive error handling

## ✅ Success Checklist

- [ ] Python 3.11 or 3.12 installed
- [ ] Virtual environment created and activated
- [ ] Backend dependencies installed
- [ ] Backend server running on port 5001
- [ ] Frontend server running on port 5173
- [ ] Settings page can save data
- [ ] History page can load data
- [ ] No errors in browser console
- [ ] No errors in backend terminal

## 🆘 Still Having Issues?

1. **Delete and recreate virtual environment**:
   ```cmd
   rmdir /s /q venv
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Clear browser cache**: Ctrl+Shift+Delete

3. **Restart both servers**:
   - Stop frontend (Ctrl+C)
   - Stop backend (Ctrl+C)
   - Start backend first
   - Then start frontend

4. **Check firewall**: Ensure ports 5001 and 5173 are not blocked

## 📚 Additional Resources

- Python Downloads: https://www.python.org/downloads/
- Vite Documentation: https://vitejs.dev/
- Flask Documentation: https://flask.palletsprojects.com/
- Supabase Documentation: https://supabase.com/docs
- React Documentation: https://react.dev/

---

**Last Updated**: November 10, 2025
**Status**: Waiting for Python version fix to enable backend
