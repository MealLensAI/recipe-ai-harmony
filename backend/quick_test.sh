#!/bin/bash

BASE_URL="http://localhost:5001"
EMAIL="test_$(date +%s)@example.com"
PASSWORD="TestPass123"

echo "🧪 Testing Recipe AI Harmony Backend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Base URL: $BASE_URL"
echo "👤 Test Email: $EMAIL"
echo ""

# Check if server is running
echo "🔍 Checking if server is running..."
if ! curl -s --max-time 5 "$BASE_URL" > /dev/null 2>&1; then
  echo "❌ Server is not running at $BASE_URL"
  echo ""
  echo "Please start the server first:"
  echo "  cd /Users/oluu/Works/meallensai/recipe-ai-harmony/backend"
  echo "  python app.py"
  exit 1
fi
echo "✅ Server is running!"
echo ""

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
  echo "   Response: $REGISTER_RESPONSE"
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
  echo "   Response: $LOGIN_RESPONSE"
  exit 1
fi

# 3. Get Profile
echo ""
echo "3️⃣  Getting profile..."
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/api/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$PROFILE_RESPONSE" | grep -q "success"; then
  echo "✅ Profile retrieved"
  PROFILE_EMAIL=$(echo "$PROFILE_RESPONSE" | grep -o '"email":"[^"]*' | cut -d'"' -f4)
  echo "   Email: $PROFILE_EMAIL"
else
  echo "❌ Profile retrieval failed"
  echo "   Response: $PROFILE_RESPONSE"
fi

# 4. Create Meal Plan
echo ""
echo "4️⃣  Creating meal plan..."
MEAL_PLAN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/meal_plan" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Meal Plan",
    "startDate": "2025-01-01",
    "endDate": "2025-01-07",
    "mealPlan": [
      {
        "day": "Monday",
        "breakfast": "Oatmeal with fruits",
        "lunch": "Chicken salad",
        "dinner": "Salmon with rice"
      }
    ]
  }')

if echo "$MEAL_PLAN_RESPONSE" | grep -q "success"; then
  echo "✅ Meal plan created"
else
  echo "❌ Meal plan creation failed"
  echo "   Response: $MEAL_PLAN_RESPONSE"
fi

# 5. Get Meal Plans
echo ""
echo "5️⃣  Getting meal plans..."
GET_MEAL_PLANS=$(curl -s -X GET "$BASE_URL/api/meal_plan" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$GET_MEAL_PLANS" | grep -q "success"; then
  echo "✅ Meal plans retrieved"
  PLAN_COUNT=$(echo "$GET_MEAL_PLANS" | grep -o '"meal_plans":\[' | wc -l)
  echo "   Found meal plans"
else
  echo "❌ Meal plans retrieval failed"
fi

# 6. Save Detection History
echo ""
echo "6️⃣  Saving food detection..."
DETECTION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/food_detection/detection_history" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipe_type": "ingredient_detection",
    "suggestion": "Grilled Chicken",
    "instructions": "1. Season chicken\n2. Grill for 15 minutes",
    "ingredients": "[\"chicken breast\", \"olive oil\", \"salt\"]",
    "detected_foods": "[\"chicken\"]"
  }')

if echo "$DETECTION_RESPONSE" | grep -q "success"; then
  echo "✅ Food detection saved"
else
  echo "❌ Food detection save failed"
  echo "   Response: $DETECTION_RESPONSE"
fi

# 7. Get Detection History
echo ""
echo "7️⃣  Getting detection history..."
GET_DETECTION=$(curl -s -X GET "$BASE_URL/api/food_detection/detection_history" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$GET_DETECTION" | grep -q "detection_history"; then
  echo "✅ Detection history retrieved"
else
  echo "❌ Detection history retrieval failed"
fi

# 8. Save User Settings
echo ""
echo "8️⃣  Saving user settings..."
SETTINGS_RESPONSE=$(curl -s -X POST "$BASE_URL/api/settings" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "settings_type": "health_profile",
    "settings_data": {
      "age": 30,
      "weight": 70,
      "height": 175,
      "dietary_restrictions": ["gluten-free"],
      "allergies": ["peanuts"]
    }
  }')

if echo "$SETTINGS_RESPONSE" | grep -q "success"; then
  echo "✅ Settings saved"
else
  echo "❌ Settings save failed"
fi

# 9. Get Subscription Status
echo ""
echo "9️⃣  Checking subscription status..."
SUB_RESPONSE=$(curl -s -X GET "$BASE_URL/api/subscription/status?user_id=$USER_ID")

if echo "$SUB_RESPONSE" | grep -q "success"; then
  echo "✅ Subscription status retrieved"
  CAN_ACCESS=$(echo "$SUB_RESPONSE" | grep -o '"can_access_app":[^,}]*' | cut -d':' -f2)
  echo "   Can access app: $CAN_ACCESS"
else
  echo "⚠️  Subscription check may need configuration"
fi

# 10. Submit Feedback
echo ""
echo "🔟 Submitting feedback..."
FEEDBACK_RESPONSE=$(curl -s -X POST "$BASE_URL/api/feedback" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "feedback_text=Great app! This is a test feedback.")

if echo "$FEEDBACK_RESPONSE" | grep -q "success"; then
  echo "✅ Feedback submitted"
else
  echo "⚠️  Feedback submission may need form-data format"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Basic endpoint tests complete!"
echo ""
echo "📝 Test User Credentials:"
echo "   Email: $EMAIL"
echo "   Password: $PASSWORD"
echo "   User ID: $USER_ID"
echo ""
echo "🔑 Access Token (save this for manual testing):"
echo "   ${ACCESS_TOKEN}"
echo ""
echo "📚 For comprehensive testing, run:"
echo "   python test_endpoints.py"
echo ""
echo "📖 For API documentation, see:"
echo "   API_DOCUMENTATION.md"
echo ""

