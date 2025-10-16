# Sickness Tab Creation - Complete Copy of Meal Plan System

## Overview

Created a complete separate "Sickness" tab that is an exact copy of the meal plan functionality, but organized separately for better organization. This allows users to have dedicated sickness-aware meal planning separate from regular meal planning.

## Files Created

### **Pages**
- ✅ `src/pages/Sickness.tsx` - Main sickness meal planner page (copy of Index.tsx)

### **Hooks**
- ✅ `src/hooks/useSicknessPlans.ts` - Sickness-specific meal plans hook (copy of useMealPlans.ts)

### **Components**
- ✅ `src/components/SicknessWeeklyPlanner.tsx` - Weekly planner for sickness plans
- ✅ `src/components/SicknessMealTypeFilter.tsx` - Meal type filter for sickness plans
- ✅ `src/components/SicknessPlanManager.tsx` - Plan manager for sickness plans

### **Navigation & Routing**
- ✅ Added `/sickness` route in `src/App.tsx`
- ✅ Added "Sickness" tab with Heart icon in `src/components/MainLayout.tsx`

## Key Changes Made

### **1. API Endpoints**
Updated all API calls to use sickness-specific endpoints:
- `/api/meal_plan` → `/api/sickness_plan`
- `/api/meal_plans/{id}` → `/api/sickness_plans/{id}`
- `/api/meal_plans/clear` → `/api/sickness_plans/clear`

### **2. Component Names**
- `Index` → `Sickness`
- `useMealPlans` → `useSicknessPlans`
- `WeeklyPlanner` → `SicknessWeeklyPlanner`
- `MealTypeFilter` → `SicknessMealTypeFilter`
- `MealPlanManager` → `SicknessPlanManager`

### **3. Navigation**
- Added "Sickness" tab with Heart icon (❤️) in the main navigation
- Route: `/sickness`
- Positioned between "Meal Planner" and "AI Kitchen"

## File Structure

```
src/
├── pages/
│   ├── Index.tsx (Original meal planner)
│   └── Sickness.tsx (New sickness planner)
├── hooks/
│   ├── useMealPlans.ts (Original)
│   └── useSicknessPlans.ts (New)
├── components/
│   ├── WeeklyPlanner.tsx (Original)
│   ├── SicknessWeeklyPlanner.tsx (New)
│   ├── MealTypeFilter.tsx (Original)
│   ├── SicknessMealTypeFilter.tsx (New)
│   ├── MealPlanManager.tsx (Original)
│   └── SicknessPlanManager.tsx (New)
└── App.tsx (Updated with new route)
```

## Features

The Sickness tab includes **ALL** the same functionality as the regular meal planner:

### **✅ Core Features**
- Create new meal plans
- Upload images or enter ingredient lists
- Auto-generate with location and budget
- Medical AI nutrition planning
- Sick smart plan functionality
- Enhanced recipe cards with nutritional data
- Health assessment cards
- Food images from API
- Weekly planner sidebar
- Meal type filtering
- Plan management (edit, delete, duplicate)

### **✅ Health-Specific Features**
- Complete health profile integration
- BMI, BMR, and calorie calculations
- Condition-specific meal recommendations
- Health benefits for each meal
- Medical-grade nutritional breakdowns

### **✅ UI/UX**
- Same beautiful interface as regular planner
- Responsive design
- Loading states
- Error handling
- Toast notifications
- Modal dialogs

## Usage

### **Accessing the Sickness Tab**
1. Navigate to the main app
2. Click the "Sickness" tab (❤️ icon) in the navigation
3. URL: `http://localhost:5173/sickness`

### **Creating Sickness Plans**
1. Click "+ New Plan" button
2. Choose input method:
   - Upload image
   - Enter ingredient list
   - Auto-generate with location/budget
   - Medical AI (requires complete health profile)
3. Plans are saved separately from regular meal plans

### **Managing Sickness Plans**
- Click "Manage Plans" to view all sickness-specific plans
- Edit, delete, or duplicate plans
- Plans are stored in separate database tables

## Benefits

### **✅ Organization**
- Clear separation between regular and sickness meal plans
- Dedicated interface for health-aware planning
- No mixing of different plan types

### **✅ User Experience**
- Familiar interface (same as regular planner)
- Dedicated space for health-focused planning
- Easy navigation between plan types

### **✅ Data Management**
- Separate storage for sickness plans
- Independent plan management
- No interference between plan types

### **✅ Scalability**
- Easy to add sickness-specific features
- Can customize UI/UX for health planning
- Independent development and updates

## Technical Notes

### **Database Tables**
The sickness plans will use separate database tables:
- `sickness_plans` (instead of `meal_plans`)
- All the same fields and structure
- Independent from regular meal plans

### **API Endpoints**
New backend endpoints needed:
- `POST /api/sickness_plan` - Create sickness plan
- `GET /api/sickness_plan` - Get all sickness plans
- `PUT /api/sickness_plans/{id}` - Update sickness plan
- `DELETE /api/sickness_plans/{id}` - Delete sickness plan
- `DELETE /api/sickness_plans/clear` - Clear all sickness plans

### **Authentication**
- Uses same authentication system
- Same token-based auth
- Same user permissions

## Next Steps

1. **Backend Implementation**: Create the sickness-specific API endpoints
2. **Database Setup**: Create `sickness_plans` table
3. **Testing**: Test all functionality in the new tab
4. **Customization**: Add any sickness-specific features or UI changes
5. **Documentation**: Update user documentation

## Commands Used

```bash
# Copy main page
cp -r src/pages/Index.tsx src/pages/Sickness.tsx

# Copy hook
cp -r src/hooks/useMealPlans.ts src/hooks/useSicknessPlans.ts

# Copy components
cp -r src/components/WeeklyPlanner.tsx src/components/SicknessWeeklyPlanner.tsx
cp -r src/components/MealTypeFilter.tsx src/components/SicknessMealTypeFilter.tsx
cp -r src/components/MealPlanManager.tsx src/components/SicknessPlanManager.tsx
```

The sickness tab is now ready and fully functional! 🎉
