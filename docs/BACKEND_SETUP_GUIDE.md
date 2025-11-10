# Backend Setup Guide

## Issue
Your system has Python 3.13.0a5 (alpha), which has compatibility issues with pydantic-core (required by Supabase).

## Solutions

### Option 1: Install Python 3.11 or 3.12 (Recommended)

1. Download Python 3.11 or 3.12 from https://www.python.org/downloads/
2. Install it (make sure to add to PATH)
3. Create a virtual environment:
   ```cmd
   cd recipe-ai-harmony\backend
   python3.11 -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```

### Option 2: Use pyenv (if available on Windows)

```cmd
pyenv install 3.11.9
pyenv local 3.11.9
cd recipe-ai-harmony\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Option 3: Use Docker

Create a `Dockerfile` in the backend directory:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "app.py"]
```

Then run:
```cmd
cd recipe-ai-harmony\backend
docker build -t meallens-backend .
docker run -p 5001:5001 --env-file .env meallens-backend
```

## Current Status

- **Frontend**: Running on http://localhost:5173/ ✅
- **Backend**: Not running (Python compatibility issue) ❌

## What's Affected

Without the backend running:
1. **Settings**: Cannot save health profile settings
2. **History**: Cannot fetch detection history
3. **Authentication**: May have issues
4. **Meal Plans**: Cannot save/load meal plans

## Quick Test

Once you get Python 3.11/3.12 installed, run:
```cmd
cd recipe-ai-harmony\backend
python --version  # Should show 3.11.x or 3.12.x
pip install -r requirements.txt
python app.py
```

The backend should start on http://127.0.0.1:5001/
