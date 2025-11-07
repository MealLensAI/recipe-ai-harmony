# Getting Started with Recipe AI Harmony Backend

## Quick Start Guide

Welcome to the Recipe AI Harmony backend! This guide will help you understand and work with your codebase.

## What You Have

### 🎯 **Main Application**
A **Flask-based REST API** for a nutrition and meal planning platform with:
- User authentication via Supabase
- Food detection and analysis
- Personalized meal planning
- Subscription management
- Payment processing (Paystack)
- Enterprise/organization features
- Email notifications

### 📊 **Current Issues & Confusion**

Based on the codebase review, here are the main areas that need attention:

#### 1. **Mixed Coding Styles**
- Some routes use RPC functions (database stored procedures)
- Others use direct table operations
- **Recommendation**: Standardize on direct table operations for consistency

#### 2. **Error Handling**
- Some endpoints return different error formats
- Try-except blocks don't always provide helpful messages
- **Recommendation**: Use the standardized error format throughout

#### 3. **Environment Configuration**
- Many optional services (Payment, SMTP) with complex initialization
- **Recommendation**: Document which services are required vs optional

#### 4. **Authentication Methods**
- Supports both header-based and cookie-based tokens
- Complex fallback logic
- **Recommendation**: Simplify to primarily use header-based auth

#### 5. **Subscription Logic**
- Multiple subscription services (SubscriptionService, LifecycleSubscriptionService)
- Overlapping functionality
- **Recommendation**: Merge into single subscription service

### 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│ Flask Application (app.py)                                   │
│ - Loads environment variables                                │
│ - Initializes services                                       │
│ - Registers route blueprints                                 │
│ - Configures CORS                                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Route Layer (routes/)                                        │
│ - auth_routes: Login, register, password reset              │
│ - food_detection_routes: Image/ingredient analysis           │
│ - meal_plan_routes: Meal planning CRUD                       │
│ - subscription_routes: Subscription management               │
│ - payment_routes: Payment processing                         │
│ - enterprise_routes: Organization management                 │
│ - + 4 more route modules                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Service Layer (services/)                                    │
│ - SupabaseService: Database operations                      │
│ - AuthService: Token validation                             │
│ - SubscriptionService: Subscription logic                   │
│ - PaymentService: Paystack integration                      │
│ - EmailService: SMTP notifications                          │
│ - LifecycleSubscriptionService: User lifecycle              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ External Services                                            │
│ - Supabase (Database + Auth + Storage)                      │
│ - Paystack (Payments)                                        │
│ - SMTP Server (Emails)                                       │
└─────────────────────────────────────────────────────────────┘
```

## 📁 **File Structure**

```
backend/
├── app.py                          # Main application entry point
│                                   # - Initializes Flask
│                                   # - Loads services
│                                   # - Registers blueprints
│
├── routes/                         # API endpoint handlers
│   ├── auth_routes.py             # /api/login, /api/register, etc.
│   ├── food_detection_routes.py   # /api/food_detection/*
│   ├── meal_plan_routes.py        # /api/meal_plan/*
│   ├── subscription_routes.py     # /api/subscription/*
│   ├── payment_routes.py          # /api/payment/*
│   ├── lifecycle_routes.py        # /api/lifecycle/*
│   ├── enterprise_routes.py       # /api/enterprise/*
│   ├── user_settings_routes.py    # /api/settings
│   ├── feedback_routes.py         # /api/feedback
│   └── ai_session_routes.py       # /api/api/store-session
│
├── services/                       # Business logic
│   ├── supabase_service.py        # Database operations wrapper
│   ├── auth_service.py            # JWT token validation
│   ├── subscription_service.py    # Subscription logic
│   ├── payment_service.py         # Paystack integration
│   ├── lifecycle_subscription_service.py  # User lifecycle
│   └── email_service.py           # SMTP email sending
│
└── utils/                          # Helper functions
    ├── auth_utils.py              # get_user_id_from_token()
    └── file_utils.py              # allowed_file()
```

## 🔧 **Setup Instructions**

### 1. Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file:

```env
# Required - Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Optional - Payment Processing
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx

# Optional - Email Notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@meallensai.com
FROM_NAME=MeallensAI

# Required - Frontend URLs
FRONTEND_BASE_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# Optional - Testing
SUB_TIME_UNIT=days  # Change to 'minutes' for fast testing
```

### 3. Run the Application

```bash
python app.py
```

The server starts on `http://localhost:5001`

## 🧪 **Testing the API**

### Using cURL

**Register a user:**
```bash
curl -X POST http://localhost:5001/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User",
    "signup_type": "individual"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5001/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Get Profile (with token):**
```bash
curl -X GET http://localhost:5001/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Postman

1. Import the endpoints from `API_DOCUMENTATION.md`
2. Set up an environment variable for `access_token`
3. Use `{{access_token}}` in Authorization headers

## 🐛 **Common Issues & Solutions**

### Issue 1: "Supabase client not initialized"
**Solution:**
```bash
# Check your .env file has correct values
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

### Issue 2: "Payment service not available"
**Solution:**
- Payment is optional. If you don't need it, ignore the warning
- To enable: Add `PAYSTACK_SECRET_KEY` to `.env`

### Issue 3: "Email not sent"
**Solution:**
- Email is optional. If you don't need it, ignore the warning
- To enable: Configure SMTP settings in `.env`
- For Gmail: Use an [App Password](https://support.google.com/accounts/answer/185833)

### Issue 4: CORS errors from frontend
**Solution:**
```env
# Add your frontend URL to ALLOWED_ORIGINS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Issue 5: Token validation fails
**Solution:**
```bash
# Ensure token is passed correctly
curl -H "Authorization: Bearer YOUR_TOKEN" ...

# Or check if token is in cookies
curl -b "access_token=YOUR_TOKEN" ...
```

## 📝 **Key Endpoints to Test**

### Authentication Flow
1. `POST /api/register` - Create account
2. `POST /api/login` - Get tokens
3. `GET /api/profile` - Verify authentication

### Food Detection Flow
1. `POST /api/food_detection/process` - Upload image/ingredients
2. `POST /api/food_detection/detection_history` - Save results
3. `GET /api/food_detection/detection_history` - View history

### Meal Planning Flow
1. `POST /api/meal_plan` - Create meal plan
2. `GET /api/meal_plan` - List meal plans
3. `GET /api/meal_plan/<id>` - Get specific plan

### Subscription Flow
1. `GET /api/subscription/plans` - View plans
2. `POST /api/subscription/create-trial` - Start trial
3. `GET /api/subscription/status?user_id=xxx` - Check status

### Payment Flow
1. `POST /api/payment/initialize-payment` - Start payment
2. **User completes payment on Paystack**
3. `GET /api/payment/verify-payment/<reference>` - Verify payment

### Enterprise Flow
1. `POST /api/enterprise/register` - Create organization
2. `POST /api/enterprise/<id>/invite` - Invite users
3. `GET /api/enterprise/<id>/users` - List members

## 🔒 **Security Checklist**

- ✅ JWT tokens for authentication
- ✅ httpOnly cookies for web clients
- ✅ CORS configuration
- ✅ Environment variables for secrets
- ✅ SQL injection protection (via Supabase)
- ⚠️ **TODO**: Rate limiting
- ⚠️ **TODO**: Input sanitization for XSS

## 🚀 **Deployment**

### Using Docker

```bash
# Build image
docker build -t recipe-ai-backend .

# Run container
docker run -d \
  -p 5001:5001 \
  --env-file .env \
  recipe-ai-backend
```

### Using Heroku

```bash
# Login and create app
heroku login
heroku create your-app-name

# Set environment variables
heroku config:set SUPABASE_URL=your-url
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your-key
# ... set other vars

# Deploy
git push heroku main
```

### Using Railway/Render

1. Connect your GitHub repository
2. Set environment variables in the dashboard
3. Deploy automatically on push

## 📚 **Documentation Files**

1. **README.md** - Overview, architecture, setup
2. **API_DOCUMENTATION.md** - Complete API reference with all endpoints
3. **GETTING_STARTED.md** - This file - quick start guide

## 🔄 **Next Steps**

### Immediate Tasks
1. ✅ Read `README.md` for architecture understanding
2. ✅ Read `API_DOCUMENTATION.md` for endpoint details
3. ⬜ Set up `.env` file with your credentials
4. ⬜ Test authentication endpoints
5. ⬜ Test one flow end-to-end

### Improvements Needed
1. **Code Cleanup**
   - Standardize error responses
   - Remove duplicate subscription services
   - Simplify authentication flow

2. **Testing**
   - Add unit tests for services
   - Add integration tests for endpoints
   - Add test data fixtures

3. **Documentation**
   - Add inline code comments
   - Create developer guide
   - Document database schema

4. **Performance**
   - Add caching for frequent queries
   - Optimize large meal plan queries
   - Add pagination for list endpoints

5. **Security**
   - Implement rate limiting
   - Add request validation middleware
   - Implement API key authentication for webhooks

## 🆘 **Need Help?**

### Debugging Tips

**1. Enable detailed logging:**
```python
# In app.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

**2. Check Supabase logs:**
- Go to Supabase Dashboard > Logs
- Check for SQL errors or permission issues

**3. Test database connection:**
```python
# Run this in Python shell
from supabase import create_client
client = create_client("YOUR_URL", "YOUR_KEY")
result = client.table("profiles").select("*").limit(1).execute()
print(result)
```

### Common Questions

**Q: Where is the database schema?**
A: It's in Supabase. Check the README for table descriptions.

**Q: How do I add a new endpoint?**
A:
1. Create route handler in appropriate routes file
2. Add authentication if needed
3. Use service layer for business logic
4. Return standardized response format

**Q: How do I test payments without real money?**
A: Use Paystack test mode credentials and test cards.

**Q: Where are uploaded images stored?**
A: In Supabase Storage under the `detection_images` bucket.

**Q: How do subscriptions expire automatically?**
A: The lifecycle service checks expiration on status requests. Consider adding a cron job for automatic checks.

---

## 🎉 **You're Ready!**

You now have:
- ✅ Complete architecture understanding
- ✅ Comprehensive API documentation
- ✅ Setup instructions
- ✅ Testing guidelines
- ✅ Troubleshooting tips

**Start by:**
1. Setting up your `.env` file
2. Running the application
3. Testing the authentication flow
4. Exploring one feature end-to-end

**Happy coding! 🚀**

