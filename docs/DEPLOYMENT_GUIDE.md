# MealLens AI Deployment Guide

## 🚀 Production Deployment Setup

### Backend: Render
- **URL:** https://meallensai.onrender.com
- **Status:** ✅ Deployed

### Frontend: Vercel
- **Setup Required:** Environment Variables

---

## 📋 Vercel Deployment Steps

### 1. Set Environment Variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables** → Add:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_API_URL` | `https://meallensai.onrender.com` | Production, Preview, Development |
| `VITE_AI_API_URL` | `http://35.238.225.150:7017` | Production, Preview, Development |

**⚠️ Important:** 
- Do NOT include `/api` in `VITE_API_URL` - it's added automatically by the code
- Click "Save" after adding each variable

### 2. Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click "⋯" menu → **Redeploy**
4. Select "Use existing Build Cache" → **Redeploy**

---

## 🧪 Local Development Options

### Option 1: Use Local Backend (Default - Recommended)
```bash
# No .env file needed - uses Vite proxy to localhost:5000
cd backend && python app.py    # Terminal 1
cd frontend && npm run dev     # Terminal 2
```

### Option 2: Test Against Production Backend
Create `frontend/.env.local`:
```env
VITE_API_URL=https://meallensai.onrender.com
```

Then:
```bash
cd frontend && npm run dev
```

---

## 🔧 How It Works

### Development (No VITE_API_URL):
```
Frontend Request → Vite Proxy → localhost:5000 → Local Backend
```

### Production (VITE_API_URL set):
```
Frontend Request → https://meallensai.onrender.com/api/... → Render Backend
```

### Code Reference:
```typescript
// frontend/src/lib/config.ts
api: {
    base_url: import.meta.env.VITE_API_URL || '',  // Empty = use Vite proxy
}

// frontend/src/lib/api.ts
const API_BASE_URL = `${APP_CONFIG.api.base_url}/api`
// Development: '/api' (proxied)
// Production: 'https://meallensai.onrender.com/api'
```

---

## ✅ Verification Checklist

After deployment:

- [ ] Vercel environment variables set
- [ ] Frontend redeployed
- [ ] Can login on production site
- [ ] Can create recipes
- [ ] Can upload food images
- [ ] Enterprise features work (if applicable)
- [ ] Payment flow works

---

## 🐛 Troubleshooting

### Issue: "Request timeout" or "Network Error"
**Solution:** Check that `VITE_API_URL` is set correctly in Vercel (without `/api` suffix)

### Issue: CORS errors
**Solution:** Ensure backend allows your Vercel domain in CORS settings

### Issue: Auth not working
**Solution:** Check that backend session/cookie settings allow cross-origin requests

---

## 📝 Environment Variables Reference

### Frontend (`frontend/.env.local` or Vercel)
```env
# Required for production
VITE_API_URL=https://meallensai.onrender.com

# Optional (has default)
VITE_AI_API_URL=http://35.238.225.150:7017
```

### Backend (`backend/.env`)
See `backend/.env.example` for complete list.

Key variables:
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `OPENAI_API_KEY`
- `FLASK_ENV=production`
- Allowed origins for CORS

---

## 🔐 Security Notes

1. **Never commit `.env` or `.env.local` files**
2. **Rotate API keys regularly**
3. **Use environment-specific keys** (dev vs prod)
4. **Enable HTTPS only** in production
5. **Set secure cookie flags** in backend

---

## 📚 Additional Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/environment-variables)
- [Render Deployment Docs](https://render.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

