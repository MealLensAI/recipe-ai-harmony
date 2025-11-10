# 🚀 Quick Start Guide

## Start Development Servers

### Backend (Terminal 1)
```cmd
cd C:\Projects\meallens-ai\recipe-ai-harmony\backend
.\venv\Scripts\activate
python app.py
```
✅ Should see: `Running on http://127.0.0.1:5001`

### Frontend (Terminal 2)
```cmd
cd C:\Projects\meallens-ai\recipe-ai-harmony
npm run dev
```
✅ Should see: `Local: http://localhost:5173/`

## Access Application

🌐 **Open in Browser**: http://localhost:5173/

## Test Features

### ✅ Settings (Now Working!)
1. Go to http://localhost:5173/settings
2. Fill in health profile
3. Click "Save Health Profile"
4. Should see success message

### ✅ History (Now Working!)
1. Go to http://localhost:5173/history
2. Should load without errors
3. View your detection history

## Stop Servers

Press `Ctrl+C` in each terminal

## Troubleshooting

### Backend Not Starting?
```cmd
cd backend
.\venv\Scripts\activate
python --version
# Should show: Python 3.11.9
```

### Connection Errors?
- Check backend is running on port 5001
- Check frontend is running on port 5173
- No firewall blocking ports

### Still Having Issues?
1. Stop both servers (Ctrl+C)
2. Start backend first
3. Wait for "Running on http://127.0.0.1:5001"
4. Then start frontend
5. Clear browser cache (Ctrl+Shift+Delete)

---

**Quick Check**: Visit http://127.0.0.1:5001/api/profile
- Should see JSON response (even if error) = Backend is working ✅
- Connection refused = Backend not running ❌
