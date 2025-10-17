# Sick Smart Plan Update - Medical-Grade Enhancement

## Overview

The `sick_smart_plan` endpoint has been updated to work exactly like the `ai_nutrition_plan` endpoint, providing medical-grade meal planning with comprehensive health profiles and detailed nutritional breakdowns.

## Key Changes

### 1. **Enhanced API Parameters**

The `sick_smart_plan` endpoint now accepts the same comprehensive health profile parameters as `ai_nutrition_plan`:

```javascript
// Required Parameters
- image_or_ingredient_list: 'image' or 'ingredient_list'
- image: Image file (if using image)
- ingredient_list: Comma-separated ingredients (if using ingredient list)
- age: User's age
- weight: Weight in kg
- height: Height in cm
- gender: 'male' or 'female'
- activity_level: 'sedentary', 'light', 'moderate', or 'active'
- condition: Medical condition (e.g., 'diabetes', 'hypertension')
- goal: 'heal' or 'manage'
- location: User's location

// Budget Parameters
- budget_state: 'true' or 'false'
- budget: Budget amount (required if budget_state is 'true')
```

### 2. **Budget State Logic**

- **`budget_state = false`**: Used when generating meal plans from user-provided ingredients (image or list)
  - Budget is set to `0`
  - AI focuses on creating meal plans using available ingredients

- **`budget_state = true`**: Used for auto-generation based on location and budget
  - Budget is required and must be a valid number
  - AI generates meal plans considering local availability and budget constraints

### 3. **API Response Structure**

The `sick_smart_plan` now returns the same enhanced response as `ai_nutrition_plan`:

```json
{
  "success": true,
  "health_assessment": {
    "bmi": 22.9,
    "bmi_category": "Normal",
    "bmr": 1667.0,
    "daily_calories": 2584.0
  },
  "user_info": {
    "age": 35,
    "weight": 70,
    "height": 175,
    "gender": "male",
    "activity_level": "moderate",
    "condition": "diabetes",
    "goal": "heal",
    "location": "nigeria"
  },
  "detected_ingredients": ["rice", "chicken", "tomatoes"],
  "meal_plan": [
    {
      "day": "Monday",
      "breakfast_name": "Oatmeal with Berries",
      "breakfast_calories": 275,
      "breakfast_protein": 8,
      "breakfast_carbs": 40,
      "breakfast_fat": 9,
      "breakfast_benefit": "Balances blood sugar with fiber",
      "breakfast_ingredients": ["oats", "berries", "milk"],
      // ... lunch, dinner, snack with same detailed structure
    }
  ]
}
```

### 4. **Frontend Implementation**

#### **Regular Sick Smart Plan (Ingredient/Image Input)**
```typescript
// User provides ingredients or image
formData.append('image_or_ingredient_list', inputType);
formData.append('ingredient_list', ingredientList); // or image
formData.append('age', healthProfilePayload.age.toString());
formData.append('weight', healthProfilePayload.weight.toString());
formData.append('height', healthProfilePayload.height.toString());
formData.append('gender', healthProfilePayload.gender);
formData.append('activity_level', healthProfilePayload.activity_level);
formData.append('condition', healthProfilePayload.condition);
formData.append('goal', healthProfilePayload.goal);
formData.append('location', healthProfilePayload.location);
formData.append('budget_state', 'false');
formData.append('budget', '0');
```

#### **Auto-Generated Sick Smart Plan (Location/Budget Based)**
```typescript
// Auto-generation with location and budget
formData.append('image_or_ingredient_list', 'ingredient_list');
formData.append('ingredient_list', ''); // Empty for auto-generation
formData.append('age', healthProfilePayload.age.toString());
formData.append('weight', healthProfilePayload.weight.toString());
formData.append('height', healthProfilePayload.height.toString());
formData.append('gender', healthProfilePayload.gender);
formData.append('activity_level', healthProfilePayload.activity_level);
formData.append('condition', healthProfilePayload.condition);
formData.append('goal', healthProfilePayload.goal);
formData.append('location', location); // User's location
formData.append('budget_state', 'true');
formData.append('budget', budget); // User's budget
```

### 5. **Validation Requirements**

Users with health conditions must now complete their full health profile to use sick smart plan:

- ✅ Age
- ✅ Gender
- ✅ Height (cm)
- ✅ Weight (kg)
- ✅ Activity Level
- ✅ Health Condition
- ✅ Health Goal
- ✅ Location

If the profile is incomplete, users receive a clear error message directing them to complete it in Settings.

### 6. **UI Enhancements**

The sick smart plan now displays the same enhanced UI as medical AI:

1. **Health Assessment Card**
   - BMI and category
   - BMR (Basal Metabolic Rate)
   - Daily calorie target
   - User profile summary

2. **Enhanced Recipe Cards**
   - Food images (fetched from API)
   - Detailed macros (calories, protein, carbs, fat)
   - Health benefits specific to the condition
   - Meal type badges
   - Visual indicators

3. **Visual Indicators**
   - "🏥 Medical-Grade Plan" badge when health assessment is present
   - Color-coded meal type badges
   - Loading states for images
   - Fallback images for each meal type

### 7. **Data Flow**

```
User with Health Condition
    ↓
Complete Health Profile in Settings
    ↓
Choose Input Method:
    - Upload Image / Enter Ingredients → budget_state = false
    - Auto-Generate (Location + Budget) → budget_state = true
    ↓
sick_smart_plan API Call
    ↓
Enhanced Response with Health Assessment
    ↓
Display Health Assessment Card + Enhanced Recipe Cards
```

## Migration from Old System

### **Before:**
- Only required `sickness` parameter
- Basic meal plan response
- No nutritional breakdowns
- No health assessment
- Simple recipe cards

### **After:**
- Requires complete health profile
- Enhanced meal plan with detailed nutrition
- Health assessment (BMI, BMR, calories)
- Meal-specific health benefits
- Enhanced recipe cards with images and macros
- Location-aware recommendations

## Benefits

1. **Medical-Grade Planning**: Same quality as the dedicated medical AI nutrition plan
2. **Ingredient Flexibility**: Works with user's available ingredients
3. **Budget-Aware**: Can generate plans based on location and budget
4. **Comprehensive Data**: Full nutritional breakdown for every meal
5. **Health Tracking**: BMI, BMR, and daily calorie targets
6. **Visual Appeal**: Enhanced UI with food images and detailed information
7. **Condition-Specific**: Health benefits tailored to the user's condition

## API Endpoint

```
POST http://34.170.200.225:7017/sick_smart_plan
Content-Type: multipart/form-data
```

## Notes

- The old `auto_sick_smart_plan` endpoint is no longer used
- All sick users now use the unified `sick_smart_plan` endpoint
- The `budget_state` parameter determines the generation mode
- Health profile completion is now mandatory for all health-aware features
- Response structure matches `ai_nutrition_plan` for consistency

