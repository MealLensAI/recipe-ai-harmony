# BMI → WHtR Migration Summary

## Overview
Successfully migrated the application from using BMI (Body Mass Index) to WHtR (Waist-to-Height Ratio) as the primary health indicator for chronic disease risk assessment, as per the API changes documentation.

## Date Completed
October 19, 2025

---

## Changes Made

### 1. **Backend Integration Updates**

#### Added Waist Parameter to API Calls
Updated all API calls to include the new required `waist` parameter:

**Endpoints Updated:**
- `/ai_nutrition_plan` (POST) - JSON payload
- `/sick_smart_plan` (POST) - FormData

**Files Modified:**
- `src/pages/Index.tsx` - Lines 389, 542
- `src/pages/Sickness.tsx` - Similar updates

**Sample Request (ai_nutrition_plan):**
```javascript
{
  age: 35,
  weight: 70,
  height: 175,
  waist: 85,  // NEW REQUIRED FIELD
  gender: 'male',
  activity_level: 'moderate',
  condition: 'diabetes',
  goal: 'heal',
  location: 'nigeria'
}
```

**Sample Request (sick_smart_plan - FormData):**
```javascript
formData.append('waist', healthProfilePayload.waist.toString());
// Added alongside existing fields: age, weight, height, gender, etc.
```

---

### 2. **Data Model Updates**

#### Updated HealthAssessment Interface
**Files Modified:**
- `src/hooks/useMealPlans.ts` (line 42-47)
- `src/hooks/useSicknessPlans.ts` (line 42-47)

**Before:**
```typescript
export interface HealthAssessment {
  bmi: number;
  bmi_category: string;
  bmr: number;
  daily_calories: number;
}
```

**After:**
```typescript
export interface HealthAssessment {
  whtr: number;
  whtr_category: string;
  bmr: number;
  daily_calories: number;
}
```

#### Updated SicknessSettings Interface
**File Modified:**
- `src/hooks/useSicknessSettings.ts` (line 3-13)

**Added Field:**
```typescript
waist?: number; // in cm (measured at navel level)
```

---

### 3. **UI Component Updates**

#### Settings Page - Added Waist Input Field
**File Modified:**
- `src/pages/Settings.tsx`

**New Input Field Added:**
```tsx
<div className="space-y-2">
  <Label htmlFor="waist">Waist Circumference (cm) *</Label>
  <Input
    id="waist"
    type="number"
    placeholder="e.g., 85"
    value={settings.waist || ''}
    onChange={(e) => updateSettings({ waist: parseFloat(e.target.value) || undefined })}
    min="60"
    max="150"
  />
  <p className="text-xs text-muted-foreground">
    Measure at navel (belly button) level. Used for WHtR (Waist-to-Height Ratio) calculation.
  </p>
</div>
```

**Validation Added:**
- Range: 60-150 cm
- Required for health profile completion
- Error message: "Invalid Waist Circumference - Please enter a valid waist circumference between 60 and 150 cm."

---

#### Health Assessment Card - Updated Display
**File Modified:**
- `src/components/HealthAssessmentCard.tsx`

**Changes:**
1. Renamed function: `getBMIColor()` → `getWHtRColor()`
2. Updated category matching to handle new WHtR categories:
   - "Underweight"
   - "Healthy" / "Normal"
   - "Overweight" / "increased risk"
   - "Obese" / "high risk of chronic disease"

3. Updated UI Display:
   - Label: "BMI" → "WHtR"
   - Value: Shows 2 decimal places (e.g., 0.50)
   - Added subtitle: "Waist-to-Height Ratio"
   - Updated badge to show `whtr_category`

**Visual Update:**
```tsx
<div className="text-2xl font-bold text-gray-900">
  {healthAssessment.whtr.toFixed(2)}
</div>
<div className={`mt-2 inline-block px-2 py-1 text-xs font-medium rounded ${getWHtRColor(healthAssessment.whtr_category)}`}>
  {healthAssessment.whtr_category}
</div>
<div className="text-xs text-gray-500 mt-1">Waist-to-Height Ratio</div>
```

---

### 4. **User-Facing Text Updates**

Updated all user-facing documentation references from "BMI" to "WHtR":

**Files Modified:**
- `src/pages/Index.tsx` (3 instances)
- `src/pages/Sickness.tsx` (3 instances)

**Changed From:**
```
"Health assessment (BMI, BMR, daily calorie needs)"
```

**Changed To:**
```
"Health assessment (WHtR, BMR, daily calorie needs)"
```

---

### 5. **Validation & Business Logic Updates**

#### Health Profile Validation
**File Modified:**
- `src/hooks/useSicknessSettings.ts`

**Updated Functions:**

1. `getHealthProfilePayload()` - Added waist validation
```typescript
if (!settings.waist || ...) {
  return null;
}
return {
  ...
  waist: settings.waist,
  ...
};
```

2. `isHealthProfileComplete()` - Added waist requirement
```typescript
return settings.hasSickness &&
  !!settings.age &&
  !!settings.gender &&
  !!settings.height &&
  !!settings.weight &&
  !!settings.waist &&  // NEW
  !!settings.activityLevel &&
  !!settings.goal &&
  !!settings.sicknessType &&
  !!settings.location;
```

3. `getSicknessInfo()` - Includes waist in returned object

---

## WHtR Health Categories

The application now uses the following WHtR-based health categories (as per API spec):

| WHtR Value | Category | Health Meaning |
|-----------|----------|----------------|
| < 0.40 | Underweight | Possible malnutrition |
| 0.40 - 0.49 | Healthy | Normal / low disease risk |
| 0.50 - 0.59 | Overweight (increased risk) | Increased risk of chronic disease |
| ≥ 0.60 | Obese (high risk of chronic disease) | High risk (heart, diabetes, etc.) |

**Simple Rule:** Keep your waist less than half your height.

---

## Testing Checklist

To verify the migration:

- [ ] Settings page displays waist input field
- [ ] Waist validation works (60-150 cm range)
- [ ] Incomplete profile warning includes "Waist Circumference" when missing
- [ ] API calls to `/ai_nutrition_plan` include waist parameter
- [ ] API calls to `/sick_smart_plan` include waist parameter
- [ ] Health Assessment Card displays "WHtR" instead of "BMI"
- [ ] WHtR value shows 2 decimal places (e.g., 0.50)
- [ ] WHtR category displays correctly with appropriate colors
- [ ] User-facing text mentions "WHtR" instead of "BMI"

---

## Migration Notes

### Breaking Changes
1. **Required Field:** `waist` is now mandatory for health profile completion
2. **API Responses:** Backend must return `whtr` and `whtr_category` instead of `bmi` and `bmi_category`
3. **Data Structure:** All stored health assessments now use WHtR

### Backward Compatibility
- Existing users will need to add their waist measurement in Settings
- Old meal plans with BMI data may not display health assessment until regenerated

### User Impact
- **Positive:** More accurate health risk assessment (WHtR is better for chronic disease prediction)
- **Action Required:** Users must measure and input waist circumference (at navel level)
- **Guidance Provided:** Clear instructions on where to measure (navel/belly button level)

---

## Files Modified Summary

1. `src/hooks/useSicknessSettings.ts` - Added waist field to interface and validation
2. `src/hooks/useMealPlans.ts` - Updated HealthAssessment interface (bmi → whtr)
3. `src/hooks/useSicknessPlans.ts` - Updated HealthAssessment interface (bmi → whtr)
4. `src/pages/Settings.tsx` - Added waist input field with validation
5. `src/pages/Index.tsx` - Added waist to API calls, updated UI text
6. `src/pages/Sickness.tsx` - Updated UI text
7. `src/components/HealthAssessmentCard.tsx` - Updated to display WHtR instead of BMI

---

## API Compatibility

The frontend is now fully compatible with API Version 2.0 (WHtR-based) as specified in the API documentation dated October 19, 2025.

**Backend Endpoints Used:**
- `http://127.0.0.1:7017/ai_nutrition_plan`
- `http://127.0.0.1:7017/sick_smart_plan`

Both endpoints now receive the `waist` parameter and return `whtr`/`whtr_category` in the response.

---

## Next Steps

1. **Test with Backend:** Verify API integration with actual backend responses
2. **User Migration:** Add migration notice for existing users to update their profile with waist measurement
3. **Documentation:** Update user-facing help text or FAQs about WHtR vs BMI
4. **Data Migration:** Consider migrating historical BMI data (if applicable)

---

## Support Resources

For questions about WHtR measurement:
- Measure at navel (belly button) level
- Use a measuring tape parallel to the floor
- Measure in centimeters
- Typical adult range: 60-150 cm

For API questions, refer to the API documentation (October 19, 2025 version).

