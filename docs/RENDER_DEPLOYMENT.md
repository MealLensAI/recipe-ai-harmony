# Render Backend Deployment Guide

## 🚀 Current Status
- **Backend URL:** https://meallensai.onrender.com
- **Status:** ✅ Live
- **Port:** 5000 (configured in Render)

---

## ⚠️ Issues Found & Fixed

### Issue 1: Flask Development Server in Production
**Problem:** Using Flask's built-in server (`app.run()`) in production is:
- ❌ Not secure
- ❌ Not production-ready
- ❌ Single-threaded (slow)

**Solution:** Use Gunicorn (production WSGI server)

---

## 🔧 Deployment Configuration

### Files Added/Updated:

1. **`backend/requirements.txt`** - Added `gunicorn`
2. **`backend/Procfile`** - Render start command
3. **`backend/render.yaml`** - Render service configuration (optional)
4. **`backend/app.py`** - Updated to use environment variables

### Gunicorn Configuration (Procfile):
```bash
web: gunicorn --bind 0.0.0.0:$PORT --workers 4 --threads 2 --timeout 120 app:app
```

**Settings:**
- `--workers 4`: 4 worker processes (handles concurrent requests)
- `--threads 2`: 2 threads per worker
- `--timeout 120`: 120 seconds timeout (for long AI requests)
- `--bind 0.0.0.0:$PORT`: Binds to Render's assigned PORT

---

## 📝 Render Configuration

### In Render Dashboard:

1. **Build Command:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start Command:**
   ```bash
   gunicorn --bind 0.0.0.0:$PORT --workers 4 --threads 2 --timeout 120 app:app
   ```
   
   Or simply:
   ```bash
   gunicorn app:app
   ```
   (Uses Procfile if present)

3. **Environment Variables:** (Already set)
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `OPENAI_API_KEY`
   - `PORT` (auto-set by Render)
   - `FLASK_ENV=production`
   - Other API keys and secrets

---

## 🔄 Deployment Steps

### Option 1: Auto-Deploy (Recommended)
1. Push changes to GitHub
2. Render auto-deploys from `main` branch
3. Done! ✅

### Option 2: Manual Deploy
1. Go to Render Dashboard
2. Click "Manual Deploy" → "Deploy latest commit"
3. Wait for build to complete

---

## ✅ Verification

After deployment, check:

1. **No development server warning:**
   ```
   ✅ Should see: [INFO] Booting worker with pid: ...
   ❌ Should NOT see: WARNING: This is a development server...
   ```

2. **Test health endpoint:**
   ```bash
   curl https://meallensai.onrender.com/api/health
   ```

3. **Test auth endpoint:**
   ```bash
   curl https://meallensai.onrender.com/api/auth/status
   ```

---

## 🐛 Troubleshooting

### Issue: Service won't start
- Check Render logs for errors
- Verify all environment variables are set
- Ensure `requirements.txt` includes `gunicorn`

### Issue: Timeout errors
- Increase `--timeout` value in start command
- Check if AI API calls are hanging

### Issue: 404 on root path
- **This is normal!** API endpoints are at `/api/*`
- Example: `https://meallensai.onrender.com/api/meal_plan`

---

## 📊 Performance Recommendations

### Current Configuration (Good for Most Cases):
- **Workers:** 4
- **Threads per worker:** 2
- **Total capacity:** 8 concurrent requests

### For Higher Traffic:
```bash
gunicorn --bind 0.0.0.0:$PORT --workers 8 --threads 4 --timeout 120 app:app
```
- **Workers:** 8
- **Threads per worker:** 4
- **Total capacity:** 32 concurrent requests

### For Lower Traffic (Free Tier):
```bash
gunicorn --bind 0.0.0.0:$PORT --workers 2 --threads 2 --timeout 120 app:app
```
- **Workers:** 2
- **Threads per worker:** 2
- **Total capacity:** 4 concurrent requests

---

## 🔐 Security Checklist

- [x] Using production WSGI server (Gunicorn)
- [x] `FLASK_ENV=production` set
- [x] Debug mode disabled
- [x] All secrets in environment variables
- [ ] HTTPS enforced (Render does this automatically)
- [ ] CORS configured for your domain only
- [ ] Rate limiting enabled (if applicable)

---

## 📚 Additional Resources

- [Gunicorn Documentation](https://docs.gunicorn.org/)
- [Render Deployment Docs](https://render.com/docs/deploy-flask)
- [Flask Production Best Practices](https://flask.palletsprojects.com/en/latest/deploying/)

---

## 🎯 Next Steps

1. ✅ Commit and push these changes
2. ✅ Wait for Render to auto-deploy
3. ✅ Verify deployment in Render logs
4. ✅ Test API endpoints
5. ✅ Update frontend env vars in Vercel (if not already done)

