import React, { useState, useEffect, useRef } from 'react';
import { Camera, List, Upload, Utensils, ChefHat, Search, Plus, Calendar, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import WeeklyPlanner from '../components/WeeklyPlanner';
import RecipeCard from '../components/RecipeCard';
import EnhancedRecipeCard from '../components/EnhancedRecipeCard';
import HealthAssessmentCard from '../components/HealthAssessmentCard';
import MealTypeFilter from '../components/MealTypeFilter';
import LoadingSpinner from '../components/LoadingSpinner';
import CookingTutorialModal from '../components/CookingTutorialModal';
import MealPlanManager from '../components/MealPlanManager';
import WeekSelector from '../components/WeekSelector';
import { useMealPlans, SavedMealPlan, MealPlan } from '../hooks/useMealPlans';
import { useToast } from '@/hooks/use-toast';
import { useSicknessSettings } from '@/hooks/useSicknessSettings';

// Countries list for the dropdown
const countries = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
  'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador',
  'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait',
  'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico',
  'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru',
  'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman',
  'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
  'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
  'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu',
  'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

const Index = () => {
  const [inputType, setInputType] = useState<'image' | 'ingredient_list' | 'auto_medical' | 'auto_sick' | 'auto_healthy'>('ingredient_list');
  const [ingredientList, setIngredientList] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedMealType, setSelectedMealType] = useState('all');
  const [showInputModal, setShowInputModal] = useState(false);
  const [showPlanManager, setShowPlanManager] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [isAutoGenerateEnabled, setIsAutoGenerateEnabled] = useState(false);

  const {
    currentPlan,
    saveMealPlan,
    updateMealPlan,
    generateWeekDates,
    savedPlans,
    selectMealPlan,
    clearAllPlans,
    refreshMealPlans
    , loading: mealPlansLoading } = useMealPlans(sicknessSettings.hasSickness); // Filter based on current health settings

  const { toast } = useToast();
  const { getSicknessInfo, getHealthProfilePayload, isHealthProfileComplete, settings: sicknessSettings } = useSicknessSettings();

  const prevShowPlanManager = useRef(showPlanManager);
  const isInitialMount = useRef(true);
  const prevSicknessStatus = useRef(sicknessSettings.hasSickness);

  useEffect(() => {
    if (prevShowPlanManager.current && !showPlanManager) {
      // Modal just closed
      refreshMealPlans();
    }
    prevShowPlanManager.current = showPlanManager;
  }, [showPlanManager, refreshMealPlans]);

  // Refresh meal plans when sickness settings change (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevSicknessStatus.current = sicknessSettings.hasSickness;
      return;
    }

    if (prevSicknessStatus.current !== sicknessSettings.hasSickness) {
      console.log('[Index] Sickness settings changed, refreshing meal plans');
      refreshMealPlans();
      prevSicknessStatus.current = sicknessSettings.hasSickness;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sicknessSettings.hasSickness]);

  useEffect(() => {
    if (!currentPlan) {
      setSelectedDay('Monday'); // Reset to default
      setSelectedMealType('all'); // Optionally reset meal type
      // Optionally clear other state if needed
    }
  }, [currentPlan]);

  useEffect(() => {
    if (!showPlanManager && (!currentPlan || !savedPlans.some(plan => plan.id === currentPlan.id))) {
      setSelectedDay('Monday');
      setSelectedMealType('all');
      // Optionally clear other state if needed
    }
  }, [showPlanManager, currentPlan, savedPlans]);

  // Full-page skeleton while meal plans are loading
  if (mealPlansLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Content grid skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Filters/search row */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-56 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
              {/* Recipe cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                    <div className="h-40 bg-gray-200 animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                      <div className="flex items-center justify-between">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right/sidebar skeleton (e.g., plan manager) */}
            <div className="space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
              <div className="space-y-3">
                {[...Array(4)].map((_, idx) => (
                  <div key={idx} className="h-16 w-full bg-gray-100 rounded border border-gray-200 animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const weekDates = generateWeekDates(selectedDate);

  // Find all unique week start dates from savedPlans, sorted ascending
  const savedWeeks = savedPlans
    .map(plan => ({
      id: plan.id,
      startDate: plan.startDate,
      name: plan.name,
    }))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  // Find the index of the currently selected week
  const currentWeekIndex = savedWeeks.findIndex(w => w.startDate === weekDates.startDate);
  // Handlers for week navigation
  const handlePrevWeek = () => {
    if (currentWeekIndex > 0) {
      const prevWeek = savedWeeks[currentWeekIndex - 1];
      setSelectedDate(new Date(prevWeek.startDate));
      selectMealPlan(prevWeek.id);
    }
  };
  const handleNextWeek = () => {
    if (currentWeekIndex < savedWeeks.length - 1) {
      const nextWeek = savedWeeks[currentWeekIndex + 1];
      setSelectedDate(new Date(nextWeek.startDate));
      selectMealPlan(nextWeek.id);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Only validate ingredients/image if auto-generate is OFF
    if (!isAutoGenerateEnabled) {
      if (inputType === 'ingredient_list' && !ingredientList.trim()) {
        toast({
          title: "Error",
          description: "Please enter your ingredients list",
          variant: "destructive",
        });
        return;
      }

      if (inputType === 'image' && !selectedImage) {
        toast({
          title: "Error",
          description: "Please select an image to upload",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate Medical AI requirements
    if (inputType === 'auto_medical') {
      if (!isHealthProfileComplete()) {
        toast({
          title: "Complete Health Profile Required",
          description: "Please complete your health profile in Settings to use Medical AI nutrition planning",
          variant: "destructive"
        });
        return;
      }
    }

    // Validate auto-generate requirements
    if (isAutoGenerateEnabled) {
      if (getSicknessInfo()) {
        // Sick user - validate location and budget
        if (!location.trim() || !budget.trim()) {
          toast({
            title: "Information Required",
            description: "Please provide both location and budget for auto-generation",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Healthy user - validate location and budget
        if (!location.trim() || !budget.trim()) {
          toast({
            title: "Information Required",
            description: "Please provide both location and budget for auto-generation",
            variant: "destructive",
          });
          return;
        }
      }
    }

    setIsLoading(true);

    try {
      const sicknessInfo = getSicknessInfo();
      const healthProfilePayload = getHealthProfilePayload();

      // Handle Medical AI Auto-Generate
      if (inputType === 'auto_medical' && isHealthProfileComplete()) {
        console.log('[Index] Using Medical AI Nutrition Plan endpoint');
        console.log('[Index] Health Profile Payload:', healthProfilePayload);

        const response = await fetch('http://127.0.0.1:7017/ai_nutrition_plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(healthProfilePayload),
        });

        if (!response.ok) {
          throw new Error('Failed to generate medical nutrition plan');
        }

        const data = await response.json();
        console.log('[Index] Medical AI Response:', data);

        if (data.success && data.meal_plan) {
          // Transform the response to match our MealPlan interface
          const transformedMealPlan: MealPlan[] = data.meal_plan.map((dayPlan: any) => ({
            day: dayPlan.day,
            breakfast: dayPlan.breakfast_name,
            lunch: dayPlan.lunch_name,
            dinner: dayPlan.dinner_name,
            snack: dayPlan.snack_name,
            breakfast_ingredients: dayPlan.breakfast_ingredients,
            lunch_ingredients: dayPlan.lunch_ingredients,
            dinner_ingredients: dayPlan.dinner_ingredients,
            snack_ingredients: dayPlan.snack_ingredients,
            // Enhanced nutritional data
            breakfast_name: dayPlan.breakfast_name,
            breakfast_calories: dayPlan.breakfast_calories,
            breakfast_protein: dayPlan.breakfast_protein,
            breakfast_carbs: dayPlan.breakfast_carbs,
            breakfast_fat: dayPlan.breakfast_fat,
            breakfast_benefit: dayPlan.breakfast_benefit,
            lunch_name: dayPlan.lunch_name,
            lunch_calories: dayPlan.lunch_calories,
            lunch_protein: dayPlan.lunch_protein,
            lunch_carbs: dayPlan.lunch_carbs,
            lunch_fat: dayPlan.lunch_fat,
            lunch_benefit: dayPlan.lunch_benefit,
            dinner_name: dayPlan.dinner_name,
            dinner_calories: dayPlan.dinner_calories,
            dinner_protein: dayPlan.dinner_protein,
            dinner_carbs: dayPlan.dinner_carbs,
            dinner_fat: dayPlan.dinner_fat,
            dinner_benefit: dayPlan.dinner_benefit,
            snack_name: dayPlan.snack_name,
            snack_calories: dayPlan.snack_calories,
            snack_protein: dayPlan.snack_protein,
            snack_carbs: dayPlan.snack_carbs,
            snack_fat: dayPlan.snack_fat,
            snack_benefit: dayPlan.snack_benefit,
          }));

          // Save the medical-grade meal plan with health assessment
          const savedPlan = await saveMealPlan(
            transformedMealPlan,
            selectedDate,
            data.health_assessment,
            data.user_info,
            { hasSickness: sicknessSettings.hasSickness, sicknessType: sicknessSettings.sicknessType }
          );

          setShowInputModal(false);
          setIngredientList('');
          setSelectedImage(null);
          setImagePreview(null);
          setLocation('');
          setBudget('');
          setIsAutoGenerateEnabled(false);
          setInputType('ingredient_list'); // Reset to default

          toast({
            title: "Medical Nutrition Plan Created!",
            description: `Your doctor-approved meal plan for ${savedPlan?.name} has been created with personalized nutritional guidance.`,
          });
          return;
        }
      }

      const formData = new FormData();

      if (isAutoGenerateEnabled) {
        if (getSicknessInfo()) {
          // Auto generate based on health profile, location, and budget
          if (!isHealthProfileComplete()) {
            toast({
              title: "Complete Health Profile Required",
              description: "Please complete your health profile in Settings to auto-generate health-aware meal plans",
              variant: "destructive"
            });
            setIsLoading(false);
            return;
          }

          // Use sick_smart_plan with budget_state=true for auto-generation
          formData.append('image_or_ingredient_list', 'ingredient_list');
          formData.append('ingredient_list', ''); // Empty for auto-generation
          formData.append('age', healthProfilePayload!.age.toString());
          formData.append('weight', healthProfilePayload!.weight.toString());
          formData.append('height', healthProfilePayload!.height.toString());
          formData.append('gender', healthProfilePayload!.gender);
          formData.append('activity_level', healthProfilePayload!.activity_level);
          formData.append('condition', healthProfilePayload!.condition);
          formData.append('goal', healthProfilePayload!.goal);
          formData.append('location', location);
          formData.append('budget_state', 'true');
          formData.append('budget', budget);

          console.log('[Index] Using Sick Smart Plan (Auto) with budget_state=true');

          const response = await fetch('http://127.0.0.1:7017/sick_smart_plan', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to auto-generate therapeutic meal plan');
          }

          const data = await response.json();
          console.log('[Index] Auto Sick Smart Plan Response:', data);

          if (data.success && data.meal_plan) {
            // Transform the response to match our MealPlan interface
            const transformedMealPlan: MealPlan[] = data.meal_plan.map((dayPlan: any) => ({
              day: dayPlan.day,
              breakfast: dayPlan.breakfast_name,
              lunch: dayPlan.lunch_name,
              dinner: dayPlan.dinner_name,
              snack: dayPlan.snack_name,
              breakfast_ingredients: dayPlan.breakfast_ingredients,
              lunch_ingredients: dayPlan.lunch_ingredients,
              dinner_ingredients: dayPlan.dinner_ingredients,
              snack_ingredients: dayPlan.snack_ingredients,
              // Enhanced nutritional data
              breakfast_name: dayPlan.breakfast_name,
              breakfast_calories: dayPlan.breakfast_calories,
              breakfast_protein: dayPlan.breakfast_protein,
              breakfast_carbs: dayPlan.breakfast_carbs,
              breakfast_fat: dayPlan.breakfast_fat,
              breakfast_benefit: dayPlan.breakfast_benefit,
              lunch_name: dayPlan.lunch_name,
              lunch_calories: dayPlan.lunch_calories,
              lunch_protein: dayPlan.lunch_protein,
              lunch_carbs: dayPlan.lunch_carbs,
              lunch_fat: dayPlan.lunch_fat,
              lunch_benefit: dayPlan.lunch_benefit,
              dinner_name: dayPlan.dinner_name,
              dinner_calories: dayPlan.dinner_calories,
              dinner_protein: dayPlan.dinner_protein,
              dinner_carbs: dayPlan.dinner_carbs,
              dinner_fat: dayPlan.dinner_fat,
              dinner_benefit: dayPlan.dinner_benefit,
              snack_name: dayPlan.snack_name,
              snack_calories: dayPlan.snack_calories,
              snack_protein: dayPlan.snack_protein,
              snack_carbs: dayPlan.snack_carbs,
              snack_fat: dayPlan.snack_fat,
              snack_benefit: dayPlan.snack_benefit,
            }));

            // Save the therapeutic meal plan with health assessment
            const savedPlan = await saveMealPlan(
              transformedMealPlan,
              selectedDate,
              data.health_assessment,
              data.user_info,
              { hasSickness: sicknessSettings.hasSickness, sicknessType: sicknessSettings.sicknessType }
            );

            setShowInputModal(false);
            setIngredientList('');
            setSelectedImage(null);
            setImagePreview(null);
            setLocation('');
            setBudget('');
            setIsAutoGenerateEnabled(false);

            toast({
              title: "Auto-Generated Therapeutic Plan Created!",
              description: `Your location and budget-based meal plan for ${savedPlan?.name} has been created with nutritional guidance.`,
            });
            return;
          }
        } else {
          // Auto generate based on location and budget only
          formData.append('location', location);
          formData.append('budget', budget);
          const response = await fetch('http://127.0.0.1:7017/auto_generate_plan', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to generate meal plan');
          }

          const data = await response.json();
          console.log('[Index] Auto Healthy API Response:', data);
          console.log('[Index] Meal Plan Data:', data.meal_plan);

          // Save the new meal plan and await the result
          const savedPlan = await saveMealPlan(
            data.meal_plan,
            selectedDate,
            undefined,
            undefined,
            { hasSickness: sicknessSettings.hasSickness, sicknessType: sicknessSettings.sicknessType }
          );

          setShowInputModal(false);
          setIngredientList('');
          setSelectedImage(null);
          setImagePreview(null);
          setLocation('');
          setBudget('');
          setIsAutoGenerateEnabled(false);

          toast({
            title: "Success!",
            description: `Your auto-generated meal plan for ${savedPlan?.name} has been created and saved!`,
          });
          return;
        }
      }

      // Regular meal plan generation
      formData.append('image_or_ingredient_list', inputType);

      if (inputType === 'ingredient_list') {
        formData.append('ingredient_list', ingredientList);
      } else {
        formData.append('image', selectedImage!);
      }

      // Use different endpoint based on sickness status
      if (sicknessInfo) {
        // Sick Smart Plan - requires complete health profile
        if (!isHealthProfileComplete()) {
          toast({
            title: "Complete Health Profile Required",
            description: "Please complete your health profile in Settings to generate health-aware meal plans",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        // Add all health profile parameters
        formData.append('age', healthProfilePayload!.age.toString());
        formData.append('weight', healthProfilePayload!.weight.toString());
        formData.append('height', healthProfilePayload!.height.toString());
        formData.append('gender', healthProfilePayload!.gender);
        formData.append('activity_level', healthProfilePayload!.activity_level);
        formData.append('condition', healthProfilePayload!.condition);
        formData.append('goal', healthProfilePayload!.goal);
        formData.append('location', healthProfilePayload!.location);
        formData.append('budget_state', 'false');
        formData.append('budget', '0');

        console.log('[Index] Using Sick Smart Plan endpoint with health profile');

        const response = await fetch('http://127.0.0.1:7017/sick_smart_plan', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to generate therapeutic meal plan');
        }

        const data = await response.json();
        console.log('[Index] Sick Smart Plan Response:', data);

        if (data.success && data.meal_plan) {
          // Transform the response to match our MealPlan interface (same as medical AI)
          const transformedMealPlan: MealPlan[] = data.meal_plan.map((dayPlan: any) => ({
            day: dayPlan.day,
            breakfast: dayPlan.breakfast_name,
            lunch: dayPlan.lunch_name,
            dinner: dayPlan.dinner_name,
            snack: dayPlan.snack_name,
            breakfast_ingredients: dayPlan.breakfast_ingredients,
            lunch_ingredients: dayPlan.lunch_ingredients,
            dinner_ingredients: dayPlan.dinner_ingredients,
            snack_ingredients: dayPlan.snack_ingredients,
            // Enhanced nutritional data
            breakfast_name: dayPlan.breakfast_name,
            breakfast_calories: dayPlan.breakfast_calories,
            breakfast_protein: dayPlan.breakfast_protein,
            breakfast_carbs: dayPlan.breakfast_carbs,
            breakfast_fat: dayPlan.breakfast_fat,
            breakfast_benefit: dayPlan.breakfast_benefit,
            lunch_name: dayPlan.lunch_name,
            lunch_calories: dayPlan.lunch_calories,
            lunch_protein: dayPlan.lunch_protein,
            lunch_carbs: dayPlan.lunch_carbs,
            lunch_fat: dayPlan.lunch_fat,
            lunch_benefit: dayPlan.lunch_benefit,
            dinner_name: dayPlan.dinner_name,
            dinner_calories: dayPlan.dinner_calories,
            dinner_protein: dayPlan.dinner_protein,
            dinner_carbs: dayPlan.dinner_carbs,
            dinner_fat: dayPlan.dinner_fat,
            dinner_benefit: dayPlan.dinner_benefit,
            snack_name: dayPlan.snack_name,
            snack_calories: dayPlan.snack_calories,
            snack_protein: dayPlan.snack_protein,
            snack_carbs: dayPlan.snack_carbs,
            snack_fat: dayPlan.snack_fat,
            snack_benefit: dayPlan.snack_benefit,
          }));

          // Save the therapeutic meal plan with health assessment
          const savedPlan = await saveMealPlan(
            transformedMealPlan,
            selectedDate,
            data.health_assessment,
            data.user_info,
            { hasSickness: sicknessSettings.hasSickness, sicknessType: sicknessSettings.sicknessType }
          );

          setShowInputModal(false);
          setIngredientList('');
          setSelectedImage(null);
          setImagePreview(null);

          toast({
            title: "Therapeutic Meal Plan Created!",
            description: `Your health-aware meal plan for ${savedPlan?.name} has been created using your available ingredients.`,
          });
          return;
        }
      } else {
        // Regular smart plan for healthy users
        const response = await fetch('http://127.0.0.1:7017/smart_plan', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to generate meal plan');
        }

        const data = await response.json();
        console.log('[Index] Smart Plan Response:', data);
        console.log('[Index] Meal Plan Data:', data.meal_plan);

        // Save the new meal plan and await the result
        const savedPlan = await saveMealPlan(
          data.meal_plan,
          selectedDate,
          undefined,
          undefined,
          { hasSickness: sicknessSettings.hasSickness, sicknessType: sicknessSettings.sicknessType }
        );

        setShowInputModal(false);
        setIngredientList('');
        setSelectedImage(null);
        setImagePreview(null);
        setLocation('');
        setBudget('');
        setIsAutoGenerateEnabled(false);

        toast({
          title: "Success!",
          description: `Your meal plan for ${savedPlan?.name} has been created and saved!`,
        });
      }
    } catch (error: any) {
      // Log the error in detail
      console.error('Error generating meal plan:', error);

      // Try to extract error message from various possible structures
      let errorMessage = '';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        // Try to extract from nested properties
        if (error[1]?.message) {
          errorMessage = error[1].message;
        } else if (error.details) {
          errorMessage = error.details;
        } else {
          errorMessage = JSON.stringify(error);
        }
      }

      // Log the extracted error message for debugging
      console.log('Extracted error message:', errorMessage);

      if (
        errorMessage.includes('duplicate key value') &&
        errorMessage.includes('unique_user_week')
      ) {
        toast({
          title: "Duplicate Plan",
          description: "A meal plan for this week already exists. Please choose a different week or edit the existing plan.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate meal plan. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecipeClick = (recipeName: string, mealType: string) => {
    if (!currentPlan) return;

    // Extract clean food name for tutorial content
    const cleanName = recipeName.replace(/\s*\(buy:[^)]*\)/, '').trim();

    // Get ingredients for the selected meal type
    const dayPlan = currentPlan.mealPlan.find(plan => plan.day === selectedDay);
    let ingredients: string[] = [];

    if (dayPlan) {
      switch (mealType) {
        case 'breakfast':
          ingredients = dayPlan.breakfast_ingredients || [];
          break;
        case 'lunch':
          ingredients = dayPlan.lunch_ingredients || [];
          break;
        case 'dinner':
          ingredients = dayPlan.dinner_ingredients || [];
          break;
        case 'snack':
          ingredients = dayPlan.snack_ingredients || [];
          break;
      }
    }

    console.log('[Index] Recipe clicked:', { cleanName, mealType, ingredients });
    setSelectedRecipe(cleanName);
    setSelectedIngredients(ingredients);
    setShowTutorialModal(true);
  };

  // Helper: rotate meal plan array to start from selectedDay
  const getRotatedMealPlan = () => {
    if (!currentPlan) return [];
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const startIdx = daysOfWeek.indexOf(selectedDay);
    if (startIdx === -1) return currentPlan.mealPlan;
    // Sort mealPlan to match daysOfWeek order
    const sortedPlan = daysOfWeek.map(day => currentPlan.mealPlan.find(mp => mp.day === day)).filter(Boolean);
    // Rotate
    return [...sortedPlan.slice(startIdx), ...sortedPlan.slice(0, startIdx)];
  };

  // In the main content, use the rotated meal plan for display
  const rotatedMealPlan = currentPlan ? getRotatedMealPlan() : [];

  // Replace getRecipesForSelectedDay to use rotated plan
  const getRecipesForSelectedDay = () => {
    const rotatedPlan = getRotatedMealPlan();
    // Always show the first day's recipes (the selected day)
    const dayPlan = rotatedPlan[0];
    if (!dayPlan) return [];

    // Debug: Log the current plan and day plan data
    console.log('[DEBUG] getRecipesForSelectedDay (Sickness) - Current Plan:', {
      id: currentPlan?.id,
      name: currentPlan?.name,
      hasSickness: currentPlan?.hasSickness,
      sicknessType: currentPlan?.sicknessType
    });

    // Helper function to extract clean food name from meal description
    const extractFoodName = (mealDescription: string): string => {
      // Remove the "(buy: ...)" part and any extra text
      const cleanName = mealDescription.replace(/\s*\(buy:[^)]*\)/, '').trim();
      return cleanName;
    };
    // Include nutritional data if current health settings indicate sickness
    const shouldIncludeNutritionData = sicknessSettings.hasSickness;

    const recipes = [
      {
        title: extractFoodName(dayPlan.breakfast),
        type: 'breakfast',
        time: '15 mins',
        rating: 5,
        originalTitle: dayPlan.breakfast, // Keep original for display
        // Include nutritional data if current health settings indicate sickness
        name: shouldIncludeNutritionData ? (dayPlan.breakfast_name || extractFoodName(dayPlan.breakfast)) : undefined,
        ingredients: shouldIncludeNutritionData ? (dayPlan.breakfast_ingredients || []) : undefined,
        calories: shouldIncludeNutritionData ? dayPlan.breakfast_calories : undefined,
        protein: shouldIncludeNutritionData ? dayPlan.breakfast_protein : undefined,
        carbs: shouldIncludeNutritionData ? dayPlan.breakfast_carbs : undefined,
        fat: shouldIncludeNutritionData ? dayPlan.breakfast_fat : undefined,
        benefit: shouldIncludeNutritionData ? dayPlan.breakfast_benefit : undefined
      },
      {
        title: extractFoodName(dayPlan.lunch),
        type: 'lunch',
        time: '25 mins',
        rating: 4,
        originalTitle: dayPlan.lunch,
        // Include nutritional data if current health settings indicate sickness
        name: shouldIncludeNutritionData ? (dayPlan.lunch_name || extractFoodName(dayPlan.lunch)) : undefined,
        ingredients: shouldIncludeNutritionData ? (dayPlan.lunch_ingredients || []) : undefined,
        calories: shouldIncludeNutritionData ? dayPlan.lunch_calories : undefined,
        protein: shouldIncludeNutritionData ? dayPlan.lunch_protein : undefined,
        carbs: shouldIncludeNutritionData ? dayPlan.lunch_carbs : undefined,
        fat: shouldIncludeNutritionData ? dayPlan.lunch_fat : undefined,
        benefit: shouldIncludeNutritionData ? dayPlan.lunch_benefit : undefined
      },
      {
        title: extractFoodName(dayPlan.dinner),
        type: 'dinner',
        time: '35 mins',
        rating: 5,
        originalTitle: dayPlan.dinner,
        // Include nutritional data if current health settings indicate sickness
        name: shouldIncludeNutritionData ? (dayPlan.dinner_name || extractFoodName(dayPlan.dinner)) : undefined,
        ingredients: shouldIncludeNutritionData ? (dayPlan.dinner_ingredients || []) : undefined,
        calories: shouldIncludeNutritionData ? dayPlan.dinner_calories : undefined,
        protein: shouldIncludeNutritionData ? dayPlan.dinner_protein : undefined,
        carbs: shouldIncludeNutritionData ? dayPlan.dinner_carbs : undefined,
        fat: shouldIncludeNutritionData ? dayPlan.dinner_fat : undefined,
        benefit: shouldIncludeNutritionData ? dayPlan.dinner_benefit : undefined
      },
    ];
    if (dayPlan.snack) {
      recipes.push({
        title: extractFoodName(dayPlan.snack),
        type: 'snack',
        time: '5 mins',
        rating: 4,
        originalTitle: dayPlan.snack,
        // Include nutritional data if current health settings indicate sickness
        name: shouldIncludeNutritionData ? (dayPlan.snack_name || extractFoodName(dayPlan.snack)) : undefined,
        ingredients: shouldIncludeNutritionData ? (dayPlan.snack_ingredients || []) : undefined,
        calories: shouldIncludeNutritionData ? dayPlan.snack_calories : undefined,
        protein: shouldIncludeNutritionData ? dayPlan.snack_protein : undefined,
        carbs: shouldIncludeNutritionData ? dayPlan.snack_carbs : undefined,
        fat: shouldIncludeNutritionData ? dayPlan.snack_fat : undefined,
        benefit: shouldIncludeNutritionData ? dayPlan.snack_benefit : undefined
      });
    }
    return selectedMealType === 'all'
      ? recipes
      : recipes.filter(recipe => recipe.type === selectedMealType);
  };

  const handleNewPlan = () => {
    setShowInputModal(true);
  };

  const handleEditPlan = (plan: SavedMealPlan) => {
    // For now, just select the plan to edit
    // In the future, this could open an edit modal
    toast({
      title: "Plan Selected",
      description: `"${plan.name}" is now active for editing.`,
    });
  };

  // When a plan is selected in the manager, jump to that week
  const handleSelectPlan = (plan: SavedMealPlan) => {
    setSelectedDate(new Date(plan.startDate));
    selectMealPlan(plan.id);
    setShowPlanManager(false);
  };

  // Helper to get day name from a Date
  const getDayName = (date: Date) => {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  };

  // Update setSelectedDate to also set selectedDay
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedDay(getDayName(date));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-[#e2e8f0] px-4 sm:px-6 py-3 sm:py-4">
        <div className="w-full flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🍓</div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#2D3436]">MealLensAI Meal Planner</h1>
              <p className="text-xs sm:text-sm text-[#1e293b] flex items-center gap-1">
                <span>🥑</span>
                a healthy outside starts from the inside
              </p>
            </div>
          </div>
          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowPlanManager(!showPlanManager)}
              className="flex items-center justify-center gap-2 bg-gray-100 text-[#2D3436] px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors w-full sm:w-auto"
            >
              <Calendar className="w-4 h-4" />
              Manage Plans
            </button>
            <button
              onClick={handleNewPlan}
              className="flex items-center justify-center gap-2 bg-[#FF6B6B] text-white px-4 py-2 rounded-lg hover:bg-[#FF8E53] transition-colors w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              New Plan
            </button>
          </div>
        </div>
        {/* Mobile actions stacked under title */}
        <div className="mt-2 md:hidden space-y-2">
          <button
            onClick={() => setShowPlanManager(!showPlanManager)}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-[#2D3436] px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Manage Plans
          </button>
          <button
            onClick={handleNewPlan}
            className="w-full flex items-center justify-center gap-2 bg-[#FF6B6B] text-white px-4 py-3 rounded-lg hover:bg-[#FF8E53] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Plan
          </button>
        </div>
      </header>

      <div className="w-full flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 sm:p-6">
        {/* Mobile top day-chip selector */}
        <div className="md:hidden">
          <div className="bg-white rounded-xl p-3 shadow-sm border border-[#e2e8f0]">
            <div className="overflow-x-auto pb-1">
              <div className="flex gap-2 whitespace-nowrap">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-3 py-1.5 rounded-full border transition-colors text-sm ${selectedDay === day ? 'bg-[#FF6B6B] text-white border-[#FF6B6B]' : 'bg-gray-100 text-[#2D3436] border-gray-200'}`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Sidebar: visible only on desktop (lg+) */}
        <div className="hidden lg:block lg:w-64 space-y-4 order-1 lg:order-none">
          {/* Weekly Planner */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-[#e2e8f0]">
            <WeeklyPlanner
              selectedDay={selectedDay}
              onDaySelect={setSelectedDay}
              mealPlan={currentPlan?.mealPlan || []}
              startDay={currentPlan ? getDayName(new Date(currentPlan.startDate)) : undefined}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 order-0 lg:order-none">
          {currentPlan ? (
            <React.Fragment>
              <div className="mb-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#2D3436]">Recipes for {savedWeeks[currentWeekIndex]?.name || weekDates.name}</h2>
                    {currentPlan?.healthAssessment ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-100 to-green-100 text-green-900 border-2 border-green-300 rounded-full text-xs sm:text-sm font-bold">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        🏥 Medical-Grade Plan
                      </div>
                    ) : getSicknessInfo() && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs sm:text-sm font-medium">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        Health-aware meal plan
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-base sm:text-lg font-semibold text-[#2D3436]">
                    <button
                      onClick={handlePrevWeek}
                      disabled={currentWeekIndex <= 0}
                      className={`p-1 rounded hover:bg-gray-100 transition-colors ${currentWeekIndex <= 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      title="Previous Saved Week"
                    >
                      <ChevronLeft className="w-5 h-5 text-[#2D3436]" />
                    </button>
                    <span className="flex items-center gap-1 text-[#2D3436]">
                      <Calendar className="w-5 h-5 text-[#2D3436]" />
                      {savedWeeks[currentWeekIndex]?.name || weekDates.name}
                    </span>
                    <button
                      onClick={handleNextWeek}
                      disabled={currentWeekIndex === -1 || currentWeekIndex >= savedWeeks.length - 1}
                      className={`p-1 rounded hover:bg-gray-100 transition-colors ${currentWeekIndex === -1 || currentWeekIndex >= savedWeeks.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      title="Next Saved Week"
                    >
                      <ChevronRight className="w-5 h-5 text-[#2D3436]" />
                    </button>
                  </div>
                </div>
                <MealTypeFilter
                  selectedType={selectedMealType}
                  onTypeSelect={setSelectedMealType}
                />
              </div>

              {/* Health Assessment Card - Show if available */}
              {currentPlan?.healthAssessment && (
                <div className="mb-6">
                  <HealthAssessmentCard
                    healthAssessment={currentPlan.healthAssessment}
                    userInfo={currentPlan.userInfo}
                  />
                </div>
              )}

              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {getRecipesForSelectedDay().map((recipe, index) => {
                    // Use EnhancedRecipeCard if current health settings indicate sickness, otherwise use basic RecipeCard
                    const shouldShowEnhancedUI = sicknessSettings.hasSickness;

                    console.log('[DEBUG] Sickness page - Health settings:', {
                      hasSickness: sicknessSettings.hasSickness,
                      shouldShowEnhancedUI,
                      recipeTitle: recipe.title
                    });

                    if (shouldShowEnhancedUI) {
                      return (
                        <EnhancedRecipeCard
                          key={`${selectedDay}-${recipe.type}-${index}`}
                          mealType={recipe.type as 'breakfast' | 'lunch' | 'dinner' | 'snack'}
                          name={recipe.name || recipe.title}
                          ingredients={recipe.ingredients || []}
                          calories={recipe.calories}
                          protein={recipe.protein}
                          carbs={recipe.carbs}
                          fat={recipe.fat}
                          benefit={recipe.benefit}
                          onClick={() => handleRecipeClick(recipe.originalTitle || recipe.title, recipe.type)}
                        />
                      );
                    }

                    return (
                      <RecipeCard
                        key={`${selectedDay}-${recipe.type}-${index}`}
                        title={recipe.title}
                        originalTitle={recipe.originalTitle}
                        time={recipe.time}
                        rating={recipe.rating}
                        mealType={recipe.type as any}
                        onClick={() => handleRecipeClick(recipe.originalTitle || recipe.title, recipe.type)}
                      />
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          ) : (
            <div className="bg-white rounded-xl p-8 sm:p-12 text-center shadow-sm border border-[#e2e8f0]">
              <ChefHat className="w-16 h-16 text-[#e2e8f0] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#2D3436] mb-2">No Meal Plan Selected</h3>
              <p className="text-[#1e293b] mb-6">Create a new meal plan or select an existing one to get started!</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleNewPlan}
                  className="bg-[#FF6B6B] text-white px-6 py-3 rounded-lg hover:bg-[#FF8E53] transition-colors w-full max-w-xs sm:w-auto"
                >
                  Create New Plan
                </button>
                <button
                  onClick={() => setShowPlanManager(true)}
                  className="bg-gray-100 text-[#2D3436] px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors w-full max-w-xs sm:w-auto"
                >
                  View Saved Plans
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Plan Manager Modal */}
      {showPlanManager && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#2D3436]">Manage Meal Plans</h2>
              <button
                onClick={() => setShowPlanManager(false)}
                className="text-[#1e293b] hover:text-[#FF6B6B] transition-colors"
              >
                ✕
              </button>
            </div>
            <MealPlanManager
              onNewPlan={() => {
                setShowPlanManager(false);
                setShowInputModal(true);
              }}
              onEditPlan={handleEditPlan}
              onSelectPlan={handleSelectPlan}
              filterBySickness={sicknessSettings.hasSickness}
            />
          </div>
        </div>
      )}

      {/* Input Modal */}
      {showInputModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#2D3436]">Create Your Meal Plan</h2>
              <button
                onClick={() => setShowInputModal(false)}
                className="text-[#1e293b] hover:text-[#FF6B6B] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Week Selection */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-semibold text-[#2D3436] mb-2">
                Select Week
              </label>
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange(new Date(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#FF6B6B] focus:outline-none"
              />
              <p className="text-sm text-[#1e293b] mt-2">
                Creating plan for: {weekDates.name}
              </p>
            </div>

            {/* Auto-Generate Toggle */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ChefHat className="w-5 h-5 text-[#2D3436]" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#2D3436]"> Auto Generate with Budget & Location</h3>
                    <p className="text-xs text-[#1e293b]">
                      {getSicknessInfo()
                        ? `Based on your health condition: ${getSicknessInfo()?.sicknessType}`
                        : 'Based on location and budget preferences'
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAutoGenerateEnabled(!isAutoGenerateEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAutoGenerateEnabled ? 'bg-[#FF6B6B]' : 'bg-gray-300'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAutoGenerateEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            </div>

            {/* Health Profile Indicator */}
            {getSicknessInfo() && (
              <div className={`mb-6 p-4 rounded-lg ${isHealthProfileComplete()
                ? 'bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-300'
                : 'bg-orange-50 border border-orange-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {isHealthProfileComplete() ? (
                    <>
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-sm font-semibold text-green-900">🏥 Medical-Grade AI Nutrition Plan</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      <span className="text-sm font-semibold text-orange-800">Health-aware meal planning</span>
                    </>
                  )}
                </div>
                {isHealthProfileComplete() ? (
                  <div className="space-y-2">
                    <p className="text-sm text-green-800">
                      Your complete health profile will generate a <strong>doctor-approved meal plan</strong> with:
                    </p>
                    <ul className="text-xs text-green-700 space-y-1 ml-4">
                      <li>• Full nutritional breakdown (calories, protein, carbs, fats)</li>
                      <li>• Health assessment (WHtR, BMR, daily calorie needs)</li>
                      <li>• Condition-specific health benefits for each meal</li>
                      <li>• Personalized for: <strong>{getSicknessInfo()?.sicknessType}</strong></li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-orange-700">
                      Your meal plan will be customized for: <strong>{getSicknessInfo()?.sicknessType}</strong>
                    </p>
                    <p className="text-xs text-orange-600">
                      💡 <strong>Tip:</strong> Complete your full health profile in Settings to unlock medical-grade AI nutrition plans with detailed nutritional data!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Toggle Buttons - Only show when auto-generate is OFF */}
            {!isAutoGenerateEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <button
                  onClick={() => setInputType('ingredient_list')}
                  className={`p-6 rounded-xl border-2 transition-all ${inputType === 'ingredient_list'
                    ? 'border-[#FF6B6B] bg-[#FF6B6B] text-white'
                    : 'border-[#e2e8f0] bg-white text-[#2D3436] hover:border-[#FF8E53]'
                    }`}
                >
                  <div className="flex items-center justify-center">
                    <List className="w-6 h-6 mr-4" />
                    <div>
                      <div className="font-semibold text-lg">Type Ingredients</div>
                      <div className="text-sm opacity-90">Enter manually</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setInputType('image')}
                  className={`p-6 rounded-xl border-2 transition-all ${inputType === 'image'
                    ? 'border-[#FF6B6B] bg-[#FF6B6B] text-white'
                    : 'border-[#e2e8f0] bg-white text-[#2D3436] hover:border-[#FF8E53]'
                    }`}
                >
                  <div className="flex items-center justify-center">
                    <Camera className="w-6 h-6 mr-4" />
                    <div>
                      <div className="font-semibold text-lg">Upload Image</div>
                      <div className="text-sm opacity-90">Take a photo</div>
                    </div>
                  </div>
                </button>

                {/* Medical AI Auto-Generate Button */}
                {getSicknessInfo() && (
                  <button
                    onClick={() => setInputType('auto_medical')}
                    className={`p-4 rounded-xl border-2 transition-all ${inputType === 'auto_medical'
                      ? 'border-green-500 bg-green-500 text-white'
                      : isHealthProfileComplete()
                        ? 'border-green-200 bg-gradient-to-br from-green-50 to-blue-50 text-green-800 hover:border-green-400'
                        : 'border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 text-orange-800 hover:border-orange-400'
                      }`}
                  >
                    <div className="flex items-center justify-center">
                      <span className="text-2xl mr-3">🏥</span>
                      <div>
                        <div className="font-semibold">Medical AI</div>
                        <div className="text-sm opacity-90">
                          {isHealthProfileComplete() ? 'Auto-generate' : 'Complete profile needed'}
                        </div>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {isAutoGenerateEnabled ? (
                // Auto-generate form
                <div className="space-y-6">
                  <div className={`p-4 border rounded-xl ${getSicknessInfo()
                    ? 'bg-green-50 border-green-200'
                    : 'bg-blue-50 border-blue-200'
                    }`}>
                    <div className="flex items-center gap-2 mb-3">
                      {getSicknessInfo() ? (
                        <Utensils className="w-5 h-5 text-green-600" />
                      ) : (
                        <ChefHat className="w-5 h-5 text-blue-600" />
                      )}
                      <h3 className={`text-lg font-semibold ${getSicknessInfo() ? 'text-green-800' : 'text-blue-800'
                        }`}>
                        Auto Generate with Budget & Location
                      </h3>
                    </div>
                    <p className={`text-sm ${getSicknessInfo() ? 'text-green-700' : 'text-blue-700'
                      }`}>
                      {getSicknessInfo()
                        ? `We'll create a personalized meal plan based on your health condition: ${getSicknessInfo()?.sicknessType}`
                        : 'We\'ll create a personalized meal plan based on your location and budget preferences.'
                      }
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#2D3436] mb-2">
                        Your Location
                      </label>
                      <select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#FF6B6B] focus:outline-none"
                        disabled={isLoading}
                      >
                        <option value="">Select a country</option>
                        {countries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                      <p className="text-sm text-[#1e293b] mt-1">
                        This helps us suggest locally available ingredients
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#2D3436] mb-2">
                        Weekly Budget
                      </label>
                      <input
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="e.g., 15000"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#FF6B6B] focus:outline-none"
                        disabled={isLoading}
                      />
                      <p className="text-sm text-[#1e293b] mt-1">
                        Your budget for the entire week
                      </p>
                    </div>
                  </div>
                </div>
              ) : inputType === 'auto_medical' ? (
                // Medical AI Auto-Generate form
                <div className="space-y-6">
                  {isHealthProfileComplete() ? (
                    <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">🏥</span>
                        <div>
                          <h3 className="text-xl font-bold text-green-900">Medical AI Nutrition Plan</h3>
                          <p className="text-sm text-green-700">Doctor-approved meal plans with detailed nutrition</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-white border border-green-200 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-2">Your Health Profile</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Age:</span>
                              <span className="ml-2 font-medium">{getSicknessInfo()?.age} years</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Gender:</span>
                              <span className="ml-2 font-medium capitalize">{getSicknessInfo()?.gender}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Height:</span>
                              <span className="ml-2 font-medium">{getSicknessInfo()?.height} cm</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Weight:</span>
                              <span className="ml-2 font-medium">{getSicknessInfo()?.weight} kg</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Waist:</span>
                              <span className="ml-2 font-medium">{getSicknessInfo()?.waist} cm</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Activity:</span>
                              <span className="ml-2 font-medium capitalize">{getSicknessInfo()?.activityLevel?.replace('_', ' ')}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Goal:</span>
                              <span className="ml-2 font-medium capitalize">{getSicknessInfo()?.goal?.replace('_', ' ')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-green-600">🎯</span>
                            <span className="font-semibold text-green-900">Health Condition</span>
                          </div>
                          <p className="text-green-800 font-medium">{getSicknessInfo()?.sicknessType}</p>
                        </div>

                        <div className="p-4 bg-blue-100 border border-blue-300 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-blue-600">✨</span>
                            <span className="font-semibold text-blue-900">What You'll Get</span>
                          </div>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Complete 7-day meal plan with exact portions</li>
                            <li>• Detailed nutritional breakdown (calories, protein, carbs, fats)</li>
                            <li>• Health assessment (WHtR, BMR, daily calorie needs)</li>
                            <li>• Condition-specific health benefits for each meal</li>
                            <li>• Doctor-approved recipes for your health condition</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">🏥</span>
                        <div>
                          <h3 className="text-xl font-bold text-orange-900">Complete Your Health Profile</h3>
                          <p className="text-sm text-orange-700">Unlock medical-grade AI nutrition planning</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-white border border-orange-200 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-2">Current Health Information</h4>
                          <div className="text-sm text-gray-600 mb-3">
                            <span className="font-medium">Health Condition:</span> {getSicknessInfo()?.sicknessType}
                          </div>
                          <div className="text-sm text-orange-700">
                            <strong>Missing information:</strong> Age, Gender, Height, Weight, Activity Level, Health Goal
                          </div>
                        </div>

                        <div className="p-4 bg-orange-100 border border-orange-300 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-orange-600">💡</span>
                            <span className="font-semibold text-orange-900">Next Steps</span>
                          </div>
                          <ol className="text-sm text-orange-800 space-y-1">
                            <li>1. Go to Settings page</li>
                            <li>2. Complete your health profile</li>
                            <li>3. Return here to generate medical-grade meal plans</li>
                          </ol>
                        </div>

                        <div className="p-4 bg-blue-100 border border-blue-300 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-blue-600">✨</span>
                            <span className="font-semibold text-blue-900">What You'll Unlock</span>
                          </div>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Complete 7-day meal plan with exact portions</li>
                            <li>• Detailed nutritional breakdown (calories, protein, carbs, fats)</li>
                            <li>• Health assessment (WHtR, BMR, daily calorie needs)</li>
                            <li>• Condition-specific health benefits for each meal</li>
                            <li>• Doctor-approved recipes for your health condition</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : inputType === 'ingredient_list' ? (
                <div>
                  <label className="block text-lg font-semibold text-[#2D3436] mb-3">
                    List your ingredients
                  </label>
                  <textarea
                    value={ingredientList}
                    onChange={(e) => setIngredientList(e.target.value)}
                    placeholder="e.g., tomatoes, onions, beef, rice, bell peppers, garlic, olive oil..."
                    className="w-full h-32 p-4 border-2 border-[#e2e8f0] rounded-xl focus:border-[#FF6B6B] focus:outline-none transition-colors resize-none"
                    disabled={isLoading}
                  />
                </div>
              ) : inputType === 'image' ? (
                <div>
                  <label className="block text-lg font-semibold text-[#2D3436] mb-3">
                    Upload an image of your ingredients
                  </label>
                  <div className="border-2 border-dashed border-[#e2e8f0] rounded-xl p-8 text-center hover:border-[#FF6B6B] transition-colors">
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-full h-48 object-cover mx-auto rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview(null);
                          }}
                          className="text-[#FF6B6B] hover:text-[#FF8E53]"
                        >
                          Choose different image
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="w-12 h-12 text-[#e2e8f0] mx-auto" />
                        <div>
                          <p className="text-[#2D3436] font-medium">Click to upload</p>
                          <p className="text-[#1e293b] text-sm">PNG, JPG, JPEG up to 10MB</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          id="file-upload"
                          disabled={isLoading}
                        />
                        <label
                          htmlFor="file-upload"
                          className="inline-block px-6 py-3 bg-[#FF6B6B] text-white rounded-lg hover:bg-[#FF8E53] transition-colors cursor-pointer"
                        >
                          Select Image
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-[#FF6B6B] text-white font-bold text-lg rounded-xl hover:bg-[#FF8E53] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    {isAutoGenerateEnabled ? 'Auto-Generating Plan...' : 'Generating Plan...'}
                  </>
                ) : (
                  <>
                    <Utensils className="w-6 h-6 mr-3" />
                    {isAutoGenerateEnabled ? 'Auto-Generate Meal Plan' : 'Generate My Meal Plan'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cooking Tutorial Modal */}
      <CookingTutorialModal
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
        recipeName={selectedRecipe || ''}
        ingredients={selectedIngredients}
      />
    </div>
  );
};

export default Index;
