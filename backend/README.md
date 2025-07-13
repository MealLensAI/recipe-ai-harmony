# Minimal Session Backend

This backend provides only user session creation, persistence, and retrieval using Flask and flask-session.

## Endpoints
- `POST /api/session` — Create a session (requires `{ "user_id": "..." }` in JSON body)
- `GET /api/session` — Retrieve current session info

## Running Locally
```
source venv/bin/activate
python session_manager.py
```

## Requirements
- Python 3.8+
- Flask
- flask-session

Sessions are stored in `backend/sessions/` (filesystem-based).
