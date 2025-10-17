# Medical-Grade AI Nutrition Plan Update

## Overview
The sickness feature has been significantly enhanced to include comprehensive medical-grade AI nutrition planning with doctor-approved meal plans.

## What's New

### 1. **Enhanced Health Profile Collection**
Users can now provide a complete health profile in Settings:
- **Age** (10-120 years)
- **Gender** (Male/Female/Other)
- **Height** (cm, 50-250)
- **Weight** (kg, 20-300)
- **Activity Level** (Sedentary, Light, Moderate, Active, Very Active)
- **Health Condition** (e.g., diabetes, hypertension, etc.)
- **Health Goal** (Heal & Manage, Maintain, Lose Weight, Gain Weight, Improve Fitness)

### 2. **Medical-Grade AI Endpoint Integration**
- **Endpoint**: `http://127.0.0.1:7017/ai_nutrition_plan`
- **Method**: POST with JSON body containing complete health profile
- **Automatically Used**: When user has completed their full health profile

### 3. **Rich Health Assessment Display**
The new `HealthAssessmentCard` component displays:
- **BMI** (Body Mass Index) with category (Underweight/Normal/Overweight/Obese)
- **BMR** (Basal Metabolic Rate) - calories burned at rest
- **Daily Calorie Target** - personalized based on activity level and goals
- **Condition & Goal Summary**

### 4. **Enhanced Recipe Cards with Nutritional Data**
The new `EnhancedRecipeCard` component shows:
- **Full Macros**: Calories, Protein, Carbs, Fat per meal
- **Health Benefits**: Condition-specific benefits for each meal
- **Detailed Ingredients**: Complete ingredient list with measurements
- **Visual Indicators**: Color-coded by meal type with nutrition icons

### 5. **Smart Visual Indicators**
- **Medical-Grade Badge**: Shows 🏥 icon with pulsing green indicator for complete health profiles
- **Health-Aware Badge**: Orange indicator for basic health condition tracking
- **Upgrade Prompts**: Encourages users to complete profile for enhanced features

## Data Flow

### Complete Health Profile Path:
```
User fills health profile → Settings saved to localStorage → 
User creates meal plan → System detects complete profile →
Calls /ai_nutrition_plan endpoint → Receives rich nutritional data →
Saves with health assessment → Displays enhanced cards
```

### Basic Health Path (Legacy):
```
User sets condition only → Basic sick endpoints used →
Standard meal plan generated → Regular recipe cards displayed
```

## API Response Structure

### Medical AI Nutrition Plan Response:
```json
{
  "success": true,
  "health_assessment": {
    "bmi": 22.9,
    "bmi_category": "Normal",
    "bmr": 1667.0,
    "daily_calories": 2584.0
  },
  "meal_plan": [
    {
      "day": "Monday",
      "breakfast_name": "Cinnamon Spiced Oatmeal with Almond Butter",
      "breakfast_ingredients": [...],
      "breakfast_calories": 275,
      "breakfast_protein": 8,
      "breakfast_carbs": 40,
      "breakfast_fat": 9,
      "breakfast_benefit": "Balances blood sugar with fiber and healthy fats.",
      "lunch_name": "...",
      "lunch_ingredients": [...],
      // ... full day meals with complete nutritional data
    },
    // ... 7 days
  ],
  "user_info": {
    "age": 35,
    "gender": "male",
    "height": 175,
    "weight": 70,
    "activity_level": "moderate",
    "condition": "diabetes",
    "goal": "heal"
  }
}
```

## Updated Files

### Core Logic:
1. **`src/hooks/useSicknessSettings.ts`**
   - Extended interface with all health profile fields
   - Added `getHealthProfilePayload()` - formats data for API
   - Added `isHealthProfileComplete()` - validation check

2. **`src/hooks/useMealPlans.ts`**
   - Extended `MealPlan` interface with nutritional fields
   - Added `HealthAssessment` interface
   - Updated `saveMealPlan()` to accept health assessment

3. **`src/pages/Index.tsx`**
   - Added medical AI endpoint integration
   - Enhanced recipe data structure
   - Smart card rendering (enhanced vs basic)
   - Updated visual indicators

### UI Components:
4. **`src/pages/Settings.tsx`**
   - Complete health profile form
   - Validation for all fields
   - Helpful hints and tips

5. **`src/components/HealthAssessmentCard.tsx`** (NEW)
   - BMI/BMR/Calorie display
   - Color-coded health categories
   - Medical notes

6. **`src/components/EnhancedRecipeCard.tsx`** (NEW)
   - Nutritional breakdown
   - Health benefits display
   - Macro visualization

## User Experience

### For Users Without Complete Profile:
- See orange "Health-aware meal planning" badge
- Get basic customized meal plans
- See prompt to complete profile for enhanced features
- Regular recipe cards displayed

### For Users With Complete Profile:
- See green pulsing "🏥 Medical-Grade Plan" badge
- Get comprehensive nutrition analysis
- View detailed health assessment
- See enhanced recipe cards with full nutritional data
- Understand health benefits of each meal

## Backend Requirements

The backend endpoint `http://127.0.0.1:7017/ai_nutrition_plan` must:
- Accept POST requests with JSON body
- Validate health profile data
- Return structured response with:
  - Success status
  - Health assessment (BMI, BMR, calories)
  - 7-day meal plan with full nutritional data
  - User info echo

## Benefits

1. **Medical Accuracy**: Doctor-approved meal plans based on medical AI
2. **Complete Transparency**: Users see exactly what they're eating
3. **Goal-Oriented**: Plans aligned with specific health goals
4. **Educational**: Users learn health benefits of each meal
5. **Trackable**: Detailed macros help users monitor intake
6. **Personalized**: Every meal considers age, gender, activity, condition, and goals

## Configuration

No configuration needed! The feature automatically:
- Detects when health profile is complete
- Switches to medical AI endpoint
- Displays enhanced UI components
- Falls back to basic mode if profile incomplete

## Notes

- All data stored in localStorage (backend sync TODO)
- Nutritional data only shows when available
- Backward compatible with existing meal plans
- No images needed - data-driven approach
- Works seamlessly with existing trial/subscription system

## Testing Checklist

- [ ] Complete health profile in Settings
- [ ] Create new meal plan
- [ ] Verify medical-grade endpoint called
- [ ] Check health assessment card displays
- [ ] Verify enhanced recipe cards show nutrition
- [ ] Test with incomplete profile (basic mode)
- [ ] Verify visual indicators update correctly
- [ ] Check responsiveness on mobile
- [ ] Test with different health conditions
- [ ] Verify localStorage persistence

