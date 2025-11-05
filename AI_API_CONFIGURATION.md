# AI API Configuration

## Overview

The AI API URL has been refactored to use environment variables instead of hardcoded values throughout the codebase. This allows for easier configuration across different environments (development, staging, production).

## Environment Variable

### Variable Name
```
VITE_AI_API_URL
```

### Default Value
If not set, the application will default to: `http://35.238.225.150:7017`

## Setup Instructions

### 1. Create Environment File

Create a `.env` file in the project root (if it doesn't exist):

```bash
# .env
VITE_AI_API_URL=http://35.238.225.150:7017
```

### 2. For Different Environments

**Development:**
```bash
VITE_AI_API_URL=http://localhost:7017
```

**Production:**
```bash
VITE_AI_API_URL=https://your-production-ai-api.com
```

### 3. Restart Development Server

After changing the `.env` file, restart your development server:

```bash
npm run dev
```

## Files Modified

The following files have been updated to use the environment variable:

1. **src/lib/config.ts** - Added `ai_api_url` to APP_CONFIG
2. **src/pages/Index.tsx** - Updated all AI API calls
3. **src/pages/Sickness.tsx** - Updated all AI API calls
4. **src/pages/AIResponsePage.tsx** - Updated all AI API calls
5. **src/pages/DetectFoodPage.tsx** - Updated all AI API calls
6. **src/hooks/useTutorialContent.ts** - Updated all AI API calls

## Usage in Code

The AI API URL is now accessed via:

```typescript
import { APP_CONFIG } from '@/lib/config';

// Use in API calls
const response = await fetch(`${APP_CONFIG.api.ai_api_url}/your-endpoint`, {
  method: 'POST',
  // ...
});
```

## Endpoints Using This Configuration

- `/process` - Ingredient processing
- `/generate_meals_from_ingredients` - Health meal generation
- `/instructions` - Cooking instructions
- `/resources` - YouTube and Google resources
- `/sick_meal_plan_instructions` - Sickness-specific instructions
- `/meal_plan_instructions` - Regular meal plan instructions
- `/ai_nutrition_plan` - Medical AI nutrition plans
- `/sick_smart_plan` - Therapeutic meal plans
- `/smart_plan` - Regular smart plans
- `/auto_generate_plan` - Auto-generated plans
- `/food_detect` - Food detection
- `/food_detect_resources` - Food detection resources

## Notes

- The environment variable must start with `VITE_` to be exposed to the frontend in Vite applications
- Changes to `.env` files require a server restart
- The default production URL is maintained as a fallback if the environment variable is not set
- This configuration is part of the centralized `APP_CONFIG` object for consistency

## Troubleshooting

**Issue**: API calls not reaching the correct URL

**Solution**: 
1. Verify `.env` file exists in project root
2. Ensure variable name is exactly `VITE_AI_API_URL`
3. Restart the development server
4. Check browser console for the actual URL being called

**Issue**: Environment variable not being picked up

**Solution**:
1. Make sure you're using `VITE_` prefix
2. Restart your development server completely
3. Clear browser cache if needed

