# Sickness-Aware Meal Planning Feature

## Overview

The sickness-aware meal planning feature allows users to specify their health conditions and receive personalized meal recommendations that take into account their specific dietary needs and restrictions.

## Features

### 1. Settings Page
- Users can access the settings page via the navigation menu
- Toggle to indicate if they have a sickness/health condition
- Text input to specify the type of sickness (e.g., diabetes, hypertension, celiac disease)
- Settings are saved to localStorage and persist across sessions

### 2. Health-Aware Meal Planning
- When a user has specified a sickness, the system uses different API endpoints:
  - **Normal users**: `https://ai-utu2.onrender.com/smart_plan`
  - **Sick users**: `http://34.170.200.225:5001/sick_smart_plan`
  - **Auto-generation for sick users**: `${API_BASE_URL}/auto_sick_smart_plan`
  - **Auto-generation for healthy users**: `${API_BASE_URL}/auto_generate_plan`
- The sickness information is passed as a form parameter to the API
- Users can auto-generate meal plans based on their health status, location, and budget

### 3. Health-Aware Recipe Instructions
- Recipe instructions are also customized based on sickness:
  - **Normal users**: `https://ai-utu2.onrender.com/meal_plan_instructions`
  - **Sick users**: `http://34.170.200.225:5001/sick_meal_plan_instructions`
- The sickness information is included in the request body

### 4. Visual Indicators
- Health-aware meal plans show an orange indicator badge
- Input modal displays a warning when sickness-aware planning is active
- Clear indication of which condition the meal plan is customized for

## API Endpoints

### For Sick Users

#### Meal Plan Generation
```
POST http://34.170.200.225:5001/sick_smart_plan
Content-Type: multipart/form-data

Parameters:
- image_or_ingredient_list: "image" or "ingredient_list"
- ingredient_list: string (if using ingredient list)
- image: file (if using image upload)
- sickness: string (the type of sickness)
```

#### Auto-Generation for Sick Users
```
POST ${API_BASE_URL}/auto_sick_smart_plan
Content-Type: multipart/form-data

Parameters:
- sickness: string (the type of sickness)
- location: string (user's location for local ingredients)
- budget: string (weekly budget in Naira)
```

#### Auto-Generation for Healthy Users
```
POST ${API_BASE_URL}/auto_generate_plan
Content-Type: multipart/form-data

Parameters:
- location: string (user's location for local ingredients)
- budget: string (weekly budget in Naira)
```

#### Recipe Instructions
```
POST http://34.170.200.225:5001/sick_meal_plan_instructions
Content-Type: application/json

Body:
{
  "food_name": "Chicken Fried Rice",
  "ingredients": ["sugar", "flour"],
  "sickness": "diabetes"
}
```

## Implementation Details

### Frontend Components

1. **Settings Page** (`src/pages/Settings.tsx`)
   - Radio buttons for sickness selection
   - Text input for sickness type
   - Form validation and error handling

2. **Sickness Settings Hook** (`src/hooks/useSicknessSettings.ts`)
   - Manages sickness settings state
   - Provides methods to update and save settings
   - Returns sickness information for API calls

3. **Updated Meal Planning** (`src/pages/Index.tsx`)
   - Modified `handleSubmit` function to use appropriate endpoints
   - Added visual indicators for health-aware planning
   - Includes sickness information in API requests

4. **Updated Tutorial Content** (`src/hooks/useTutorialContent.ts`)
   - Modified `generateContent` function to use sick endpoints
   - Includes sickness information in instruction requests

### Data Flow

1. User sets sickness information in Settings page
2. Settings are saved to localStorage
3. When generating meal plans, the system checks for sickness info
4. If sickness exists, use sick endpoints with sickness parameter
5. If no sickness, use normal endpoints
6. Visual indicators show when health-aware planning is active

## Usage

1. Navigate to Settings page
2. Select "Yes, I have a sickness"
3. Enter the type of sickness (e.g., "diabetes")
4. Save settings
5. Create a new meal plan - it will automatically use health-aware endpoints
6. View recipes with customized instructions for your condition

### Auto-Generation Features

#### For Users with Health Conditions:
1. Set your sickness information in Settings
2. Go to meal planner and click "Create New Plan"
3. Select "Auto Generate" option (with sickness icon)
4. Provide your location and weekly budget
5. Click "Auto-Generate Meal Plan"
6. The system will create a personalized meal plan based on your health condition, location, and budget

#### For Healthy Users:
1. Go to meal planner and click "Create New Plan"
2. Select "Auto Generate" option (with chef hat icon)
3. Provide your location and weekly budget
4. Click "Auto-Generate Meal Plan"
5. The system will create a personalized meal plan based on your location and budget

## Future Enhancements

- Backend API endpoint to save sickness settings to database
- More granular sickness categories
- Integration with medical databases for better recommendations
- Support for multiple conditions
- Dietary restriction management
- Allergy tracking and warnings 