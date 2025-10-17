# Meal Plans Persistence Fix

## Issue Description

When users toggled their sickness status (from "has sickness" to "no sickness" or vice versa), all their saved meal plans would disappear from the UI, even though they were still stored in the database.

## Root Causes

### 1. **Missing Health Data in Fetched Plans**
The `useMealPlans` hook was fetching meal plans from the backend but not including the `healthAssessment` and `userInfo` fields in the response mapping. This meant that medical-grade plans (created with sick smart plan or medical AI) were losing their enhanced data when fetched.

**Before:**
```typescript
const plans = result.meal_plans.map((plan: any) => ({
  id: plan.id,
  name: plan.name,
  startDate: plan.start_date,
  endDate: plan.end_date,
  mealPlan: plan.meal_plan,
  createdAt: plan.created_at,
  updatedAt: plan.updated_at,
  // Missing: healthAssessment and userInfo
}));
```

**After:**
```typescript
const plans = result.meal_plans.map((plan: any) => ({
  id: plan.id,
  name: plan.name,
  startDate: plan.start_date,
  endDate: plan.end_date,
  mealPlan: plan.meal_plan,
  createdAt: plan.created_at,
  updatedAt: plan.updated_at,
  healthAssessment: plan.health_assessment,  // Added
  userInfo: plan.user_info                    // Added
}));
```

### 2. **No Refresh on Sickness Status Change**
The meal plans were only loaded once when the component mounted. When users changed their sickness status in Settings, there was no mechanism to refresh the displayed plans, making it appear as if the plans had disappeared.

## Solution

### 1. **Include Health Data in Fetched Plans**

Updated `src/hooks/useMealPlans.ts` in two places:

- **Initial fetch** (lines 87-97): Added `healthAssessment` and `userInfo` to the plan mapping
- **Refresh function** (lines 381-391): Added the same fields to the refresh mapping

This ensures that medical-grade plans retain their health assessment data and nutritional information when fetched from the database.

### 2. **Auto-Refresh on Sickness Status Change**

Updated `src/pages/Index.tsx` to automatically refresh meal plans when sickness settings change:

```typescript
// Added sickness settings to the hook destructuring
const { getSicknessInfo, getHealthProfilePayload, isHealthProfileComplete, settings: sicknessSettings } = useSicknessSettings();

// Added useEffect to refresh plans when sickness status changes
useEffect(() => {
  console.log('[Index] Sickness settings changed, refreshing meal plans');
  refreshMealPlans();
}, [sicknessSettings.hasSickness, refreshMealPlans]);
```

This `useEffect` hook:
- Listens for changes to `sicknessSettings.hasSickness`
- Automatically calls `refreshMealPlans()` whenever the sickness status changes
- Ensures that meal plans are always visible regardless of sickness status

## Benefits

1. **Data Persistence**: Health assessment and nutritional data are now preserved across page refreshes
2. **Seamless Switching**: Users can toggle sickness status without losing their meal plans
3. **Real-time Updates**: The UI automatically refreshes when settings change
4. **No Data Loss**: All meal plans remain accessible in both sick and healthy modes
5. **Enhanced Plans Preserved**: Medical-grade plans with BMI, BMR, and calorie data are fully preserved

## Technical Details

### Files Modified

1. **`src/hooks/useMealPlans.ts`**
   - Line 95-96: Added health data to initial fetch mapping
   - Line 389-390: Added health data to refresh mapping

2. **`src/pages/Index.tsx`**
   - Line 70: Added `settings: sicknessSettings` to destructuring
   - Lines 82-85: Added useEffect to refresh plans on sickness change

### Data Flow

```
User Changes Sickness Status in Settings
    ↓
Settings saved to localStorage
    ↓
Index.tsx detects change via sicknessSettings.hasSickness
    ↓
useEffect triggers refreshMealPlans()
    ↓
Fetch all plans from backend (including health data)
    ↓
Plans displayed with full data (including enhanced cards if applicable)
```

### Backward Compatibility

- ✅ Works with existing plans (healthAssessment and userInfo are optional)
- ✅ Regular plans (non-medical) work normally
- ✅ No changes required to the backend API
- ✅ No database migrations needed

## Testing Scenarios

### Scenario 1: User with Sickness Creates Plan, Then Disables Sickness
1. User sets health condition in Settings
2. User creates a sick smart plan or medical AI plan
3. Plan appears with health assessment card and enhanced recipe cards
4. User goes to Settings and changes to "No sickness"
5. ✅ **Result**: Plan still visible, health data preserved

### Scenario 2: User Without Sickness Creates Plan, Then Enables Sickness
1. User has no health condition
2. User creates a regular meal plan
3. Plan appears with standard recipe cards
4. User goes to Settings and sets a health condition
5. ✅ **Result**: Plan still visible, shown as regular plan

### Scenario 3: User Switches Between Sickness Types
1. User has diabetes, creates a plan
2. User changes condition to hypertension
3. ✅ **Result**: All plans remain visible

## Notes

- The meal plans are always stored in the database regardless of sickness status
- The refresh mechanism ensures the UI always shows the latest state
- Health data is optional, so regular plans work without it
- The console log helps with debugging status change triggers

