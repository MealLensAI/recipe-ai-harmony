# Invitation Link Fix Guide

## 🚨 Current Issue
The invitation emails are still using `http://localhost:5173/accept-invitation` instead of the production URL `https://www.meallensai.com/accept-invitation`.

## 🔧 Steps to Fix

### 1. Restart Backend Server
The backend needs to be restarted to pick up the `FRONTEND_URL` environment variable:

```bash
# Stop the current backend server (Ctrl+C in the terminal)
# Then restart it:
cd backend && python app.py
```

### 2. Verify Environment Variable
Check that `FRONTEND_URL` is properly set:

```bash
grep "FRONTEND_URL" backend/.env
```

Should show:
```
FRONTEND_URL=https://www.meallensai.com
```

### 3. Test the Fix
1. **Create a new invitation** from your organization dashboard
2. **Check the email** - it should now contain `https://www.meallensai.com/accept-invitation`
3. **Click the link** - it should work correctly

## 🔍 Debug Information

The backend now includes debug logging. When you create an invitation, check the backend logs for:

```
🔍 Frontend URL detection: env=https://www.meallensai.com, origin=http://localhost:5173, final=https://www.meallensai.com
```

This will show:
- `env`: The environment variable value
- `origin`: The request origin (localhost in development)
- `final`: The URL that will be used (should be production URL)

## 🎯 Expected Result

After restarting the backend:
- ✅ Invitation emails will use `https://www.meallensai.com/accept-invitation`
- ✅ Users clicking links will go to your live site
- ✅ No more "Invalid Invitation" errors

## 🚀 Quick Test

1. **Restart backend server**
2. **Create new invitation**
3. **Check email URL** - should be production URL
4. **Click link** - should work correctly

The fix is ready - just restart your backend server! 🎉
