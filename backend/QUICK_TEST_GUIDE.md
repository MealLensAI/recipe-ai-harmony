# Quick Testing Guide - Recipe AI Harmony Backend

## 🚀 Running the Tests

### Option 1: Automated Test Script (Recommended)

```bash
# Make sure server is running first
python app.py

# In a new terminal, run the test script
cd backend
python test_endpoints.py
```

This will test **all 68 endpoints** automatically and give you a colored report!

---

### Option 2: Manual Testing with cURL

#### Step 1: Start the Server

```bash
cd /Users/oluu/Works/meallensai/recipe-ai-harmony/backend
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5001
```

---

#### Step 2: Test Endpoints Manually

**1. Test Server is Running:**
```bash
curl http://localhost:5001/
```

**2. Register a User:**
```bash
curl -X POST http://localhost:5001/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "first_name": "Test",
    "last_name": "User",
    "signup_type": "individual"
  }'
```

Expected response:
```json
{
  "status": "success",
  "message": "User registered successfully",
  "user_id": "some-uuid",
  "email": "test@example.com"
}
```

**3. Login:**
```bash
curl -X POST http://localhost:5001/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

Expected response:
```json
{
  "status": "success",
  "message": "Login successful",
  "access_token": "eyJ...",
  "user_id": "some-uuid"
}
```

**Copy the `access_token` from the response!**

**4. Get Profile (with token):**
```bash
# Replace YOUR_TOKEN with the actual token from login
curl -X GET http://localhost:5001/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**5. Create a Meal Plan:**
```bash
curl -X POST http://localhost:5001/api/meal_plan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Week 1 Plan",
    "startDate": "2025-01-01",
    "endDate": "2025-01-07",
    "mealPlan": [
      {
        "day": "Monday",
        "breakfast": "Oatmeal",
        "lunch": "Chicken Salad",
        "dinner": "Salmon with Rice"
      }
    ]
  }'
```

**6. Get Meal Plans:**
```bash
curl -X GET http://localhost:5001/api/meal_plan \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**7. Save Food Detection:**
```bash
curl -X POST http://localhost:5001/api/food_detection/detection_history \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipe_type": "ingredient_detection",
    "suggestion": "Grilled Chicken",
    "instructions": "1. Grill chicken\n2. Serve",
    "ingredients": "[\"chicken\", \"olive oil\"]"
  }'
```

**8. Get Subscription Status:**
```bash
# Replace USER_ID with your actual user_id from registration
curl -X GET "http://localhost:5001/api/subscription/status?user_id=YOUR_USER_ID"
```

**9. Save User Settings:**
```bash
curl -X POST http://localhost:5001/api/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "settings_type": "health_profile",
    "settings_data": {
      "age": 30,
      "weight": 70,
      "height": 175,
      "dietary_restrictions": ["gluten-free"]
    }
  }'
```

**10. Submit Feedback:**
```bash
curl -X POST http://localhost:5001/api/feedback \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "feedback_text=Great app! This is a test."
```

---

### Option 3: Using Postman/Insomnia

1. **Import Collection:**
   - Create a new collection
   - Set base URL: `http://localhost:5001`
   - Add endpoints from `API_DOCUMENTATION.md`

2. **Setup Environment:**
   - Create variable: `access_token`
   - Create variable: `user_id`
   - Create variable: `base_url` = `http://localhost:5001`

3. **Test Flow:**
   - POST /api/register
   - POST /api/login (save `access_token` to environment)
   - GET /api/profile (use `{{access_token}}` in Authorization header)
   - Continue testing other endpoints...

---

## 📊 Endpoint Testing Checklist

### ✅ Critical Endpoints (Must Work)

- [ ] `POST /api/register` - User registration
- [ ] `POST /api/login` - User login
- [ ] `GET /api/profile` - Get user profile
- [ ] `POST /api/meal_plan` - Create meal plan
- [ ] `GET /api/meal_plan` - Get meal plans
- [ ] `POST /api/food_detection/detection_history` - Save detection
- [ ] `GET /api/food_detection/detection_history` - Get history
- [ ] `POST /api/settings` - Save settings
- [ ] `GET /api/settings` - Get settings

### ⚠️ Optional Endpoints (May Need Configuration)

- [ ] `POST /api/payment/initialize-payment` - Requires Paystack
- [ ] `POST /api/enterprise/<id>/invite` - Requires SMTP
- [ ] `POST /api/forgot-password` - Requires SMTP
- [ ] Payment webhooks - Requires Paystack webhook setup

---

## 🔍 Troubleshooting

### Issue: "Server is not running"
**Solution:**
```bash
cd /Users/oluu/Works/meallensai/recipe-ai-harmony/backend
python app.py
```

### Issue: "401 Unauthorized"
**Solution:** Make sure you're passing the token correctly:
```bash
-H "Authorization: Bearer YOUR_ACTUAL_TOKEN_HERE"
```

### Issue: "Missing Authorization header"
**Solution:** You forgot to include the Authorization header. Add:
```bash
-H "Authorization: Bearer YOUR_TOKEN"
```

### Issue: "Invalid token"
**Solutions:**
1. Token may have expired - login again to get a new token
2. Token is malformed - copy the entire token (it starts with "eyJ...")
3. Token has extra spaces - make sure no spaces before/after

### Issue: "Supabase client not initialized"
**Solution:** Check your `.env` file has:
```env
SUPABASE_URL=your-url
SUPABASE_SERVICE_ROLE_KEY=your-key
```

### Issue: "Payment service not available"
**Solution:** This is optional. If you don't need payments, you can ignore this.

### Issue: "Email not sent"
**Solution:** This is optional. If you don't need emails, you can ignore this.

---

## 🎯 Quick Verification Script

Save this as `quick_test.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:5001"
EMAIL="test_$(date +%s)@example.com"
PASSWORD="TestPass123"

echo "🧪 Testing Recipe AI Harmony Backend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Register
echo "1️⃣  Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"first_name\": \"Test\",
    \"last_name\": \"User\",
    \"signup_type\": \"individual\"
  }")

if echo "$REGISTER_RESPONSE" | grep -q "success"; then
  echo "✅ Registration successful"
  USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"user_id":"[^"]*' | cut -d'"' -f4)
  echo "   User ID: $USER_ID"
else
  echo "❌ Registration failed"
  echo "$REGISTER_RESPONSE"
  exit 1
fi

# 2. Login
echo ""
echo "2️⃣  Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
  echo "✅ Login successful"
  ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
  echo "   Token: ${ACCESS_TOKEN:0:30}..."
else
  echo "❌ Login failed"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

# 3. Get Profile
echo ""
echo "3️⃣  Getting profile..."
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/api/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$PROFILE_RESPONSE" | grep -q "success"; then
  echo "✅ Profile retrieved"
  echo "   Email: $(echo "$PROFILE_RESPONSE" | grep -o '"email":"[^"]*' | cut -d'"' -f4)"
else
  echo "❌ Profile retrieval failed"
  echo "$PROFILE_RESPONSE"
fi

# 4. Create Meal Plan
echo ""
echo "4️⃣  Creating meal plan..."
MEAL_PLAN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/meal_plan" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Plan",
    "startDate": "2025-01-01",
    "endDate": "2025-01-07",
    "mealPlan": [{"day": "Monday", "breakfast": "Oatmeal"}]
  }')

if echo "$MEAL_PLAN_RESPONSE" | grep -q "success"; then
  echo "✅ Meal plan created"
else
  echo "❌ Meal plan creation failed"
  echo "$MEAL_PLAN_RESPONSE"
fi

# 5. Get Subscription Status
echo ""
echo "5️⃣  Checking subscription..."
SUB_RESPONSE=$(curl -s -X GET "$BASE_URL/api/subscription/status?user_id=$USER_ID")

if echo "$SUB_RESPONSE" | grep -q "success"; then
  echo "✅ Subscription status retrieved"
  CAN_ACCESS=$(echo "$SUB_RESPONSE" | grep -o '"can_access_app":[^,}]*' | cut -d':' -f2)
  echo "   Can access app: $CAN_ACCESS"
else
  echo "❌ Subscription check failed"
  echo "$SUB_RESPONSE"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Basic tests complete!"
echo ""
echo "📝 Test User Credentials:"
echo "   Email: $EMAIL"
echo "   Password: $PASSWORD"
echo "   User ID: $USER_ID"
echo "   Token: ${ACCESS_TOKEN:0:50}..."
```

Run it:
```bash
chmod +x quick_test.sh
./quick_test.sh
```

---

## 📈 Expected Test Results

### ✅ Working Endpoints (Should PASS)
- Authentication (register, login, profile)
- Food Detection (save, get, delete)
- Meal Planning (create, get, update, delete)
- User Settings (save, get, delete)
- Subscription Status
- Feedback

### ⚠️ May Skip (If Not Configured)
- Payment endpoints (needs Paystack)
- Email invitations (needs SMTP)
- Some enterprise features (needs RPC functions)

### ❌ Known Issues
- Some RPC functions may not exist in Supabase
- Payment webhooks require Paystack setup
- Email features require SMTP configuration

---

## 🎉 Success Indicators

Your backend is working if you can:

✅ Register a new user  
✅ Login and receive a token  
✅ Access protected endpoints with the token  
✅ Create and retrieve meal plans  
✅ Save and retrieve food detection history  
✅ Check subscription status  

---

## 📞 Next Steps

After testing:

1. **Document Working Endpoints** - Note which endpoints work
2. **Configure Optional Services** - Set up Paystack/SMTP if needed
3. **Fix Failing Endpoints** - Address any failures
4. **Integration Testing** - Test with your frontend
5. **Load Testing** - Test with multiple concurrent users

---

**Happy Testing! 🚀**

