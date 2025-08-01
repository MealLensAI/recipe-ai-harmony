import React, { useState, useEffect, useRef } from 'react';
import { Camera, List, Upload, Utensils, ChefHat, Search, Plus, Calendar, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import WeeklyPlanner from '../components/WeeklyPlanner';
import RecipeCard from '../components/RecipeCard';
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
  const [inputType, setInputType] = useState<'image' | 'ingredient_list' | 'auto_sick' | 'auto_healthy'>('ingredient_list');
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
  } = useMealPlans();

  const { toast } = useToast();
  const { getSicknessInfo } = useSicknessSettings();

  const prevShowPlanManager = useRef(showPlanManager);
  useEffect(() => {
    if (prevShowPlanManager.current && !showPlanManager) {
      // Modal just closed
      refreshMealPlans();
    }
    prevShowPlanManager.current = showPlanManager;
  }, [showPlanManager, refreshMealPlans]);

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
      const formData = new FormData();

      if (isAutoGenerateEnabled) {
        if (getSicknessInfo()) {
          // Auto generate based on sickness, location, and budget
          formData.append('sickness', sicknessInfo!.sicknessType);
          formData.append('location', location);
          formData.append('budget', budget);
          const response = await fetch('https://ai-utu2.onrender.com/auto_sick_smart_plan', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to generate meal plan');
          }

          const data = await response.json();
          console.log('[Index] Auto Sick API Response:', data);
          console.log('[Index] Meal Plan Data:', data.meal_plan);

          // Save the new meal plan and await the result
          const savedPlan = await saveMealPlan(data.meal_plan, selectedDate);

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
        } else {
          // Auto generate based on location and budget only
          formData.append('location', location);
          formData.append('budget', budget);
          const response = await fetch('https://ai-utu2.onrender.com/auto_generate_plan', {
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
          const savedPlan = await saveMealPlan(data.meal_plan, selectedDate);

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

      // Add sickness information if user has sickness
      if (sicknessInfo) {
        formData.append('sickness', sicknessInfo.sicknessType);
      }

      // Use different endpoint based on sickness status
      const endpoint = sicknessInfo ? 'http://127.0.0.1:5001/sick_smart_plan' : 'https://ai-utu2.onrender.com/smart_plan';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate meal plan');
      }

      const data = await response.json();
      console.log('[Index] API Response:', data);
      console.log('[Index] Meal Plan Data:', data.meal_plan);

      // Save the new meal plan and await the result
      const savedPlan = await saveMealPlan(data.meal_plan, selectedDate);

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
    // Helper function to extract clean food name from meal description
    const extractFoodName = (mealDescription: string): string => {
      // Remove the "(buy: ...)" part and any extra text
      const cleanName = mealDescription.replace(/\s*\(buy:[^)]*\)/, '').trim();
      return cleanName;
    };
    const recipes = [
      {
        title: extractFoodName(dayPlan.breakfast),
        type: 'breakfast',
        time: '15 mins',
        rating: 5,
        originalTitle: dayPlan.breakfast // Keep original for display
      },
      {
        title: extractFoodName(dayPlan.lunch),
        type: 'lunch',
        time: '25 mins',
        rating: 4,
        originalTitle: dayPlan.lunch
      },
      {
        title: extractFoodName(dayPlan.dinner),
        type: 'dinner',
        time: '35 mins',
        rating: 5,
        originalTitle: dayPlan.dinner
      },
    ];
    if (dayPlan.snack) {
      recipes.push({
        title: extractFoodName(dayPlan.snack),
        type: 'snack',
        time: '5 mins',
        rating: 4,
        originalTitle: dayPlan.snack
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
      <header className="bg-white border-b border-[#e2e8f0] px-6 py-4">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🍓</div>
            <div>
              <h1 className="text-2xl font-bold text-[#2D3436]">MealLensAI Meal Planner</h1>
              <p className="text-sm text-[#1e293b] flex items-center gap-1">
                <span>🥑</span>
                a healthy outside starts from the inside
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPlanManager(!showPlanManager)}
              className="flex items-center gap-2 bg-gray-100 text-[#2D3436] px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Manage Plans
            </button>
            <button
              onClick={handleNewPlan}
              className="flex items-center gap-2 bg-[#FF6B6B] text-white px-4 py-2 rounded-lg hover:bg-[#FF8E53] transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Plan
            </button>
          </div>
        </div>
      </header>

      <div className="w-full flex gap-6 p-6">
        {/* Sidebar */}
        <div className="w-64 space-y-4">
          {/* Weekly Planner */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
            <WeeklyPlanner
              selectedDay={selectedDay}
              onDaySelect={setSelectedDay}
              mealPlan={currentPlan?.mealPlan || []}
              startDay={currentPlan ? getDayName(new Date(currentPlan.startDate)) : undefined}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {currentPlan ? (
            <React.Fragment>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-[#2D3436]">Recipes for {savedWeeks[currentWeekIndex]?.name || weekDates.name}</h2>
                    {getSicknessInfo() && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        Health-aware meal plan
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-lg font-semibold text-[#2D3436]">
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

              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {getRecipesForSelectedDay().map((recipe, index) => (
                    <RecipeCard
                      key={`${selectedDay}-${recipe.type}-${index}`}
                      title={recipe.title}
                      originalTitle={recipe.originalTitle}
                      time={recipe.time}
                      rating={recipe.rating}
                      mealType={recipe.type as any}
                      onClick={() => handleRecipeClick(recipe.originalTitle || recipe.title, recipe.type)}
                    />
                  ))}
                </div>
              )}
            </React.Fragment>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-[#e2e8f0]">
              <ChefHat className="w-16 h-16 text-[#e2e8f0] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#2D3436] mb-2">No Meal Plan Selected</h3>
              <p className="text-[#1e293b] mb-6">Create a new meal plan or select an existing one to get started!</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleNewPlan}
                  className="bg-[#FF6B6B] text-white px-6 py-3 rounded-lg hover:bg-[#FF8E53] transition-colors"
                >
                  Create New Plan
                </button>
                <button
                  onClick={() => setShowPlanManager(true)}
                  className="bg-gray-100 text-[#2D3436] px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
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
                    <h3 className="text-sm font-semibold text-[#2D3436]">Auto-Generate Meal Plan</h3>
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

            {/* Sickness Indicator */}
            {getSicknessInfo() && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span className="text-sm font-semibold text-orange-800">Health-aware meal planning</span>
                </div>
                <p className="text-sm text-orange-700">
                  Your meal plan will be customized for your condition: <strong>{getSicknessInfo()?.sicknessType}</strong>
                </p>
              </div>
            )}

            {/* Toggle Buttons - Only show when auto-generate is OFF */}
            {!isAutoGenerateEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setInputType('ingredient_list')}
                  className={`p-4 rounded-xl border-2 transition-all ${inputType === 'ingredient_list'
                    ? 'border-[#FF6B6B] bg-[#FF6B6B] text-white'
                    : 'border-[#e2e8f0] bg-white text-[#2D3436] hover:border-[#FF8E53]'
                    }`}
                >
                  <div className="flex items-center justify-center">
                    <List className="w-5 h-5 mr-3" />
                    <div>
                      <div className="font-semibold">Type Ingredients</div>
                      <div className="text-sm opacity-90">Enter manually</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setInputType('image')}
                  className={`p-4 rounded-xl border-2 transition-all ${inputType === 'image'
                    ? 'border-[#FF6B6B] bg-[#FF6B6B] text-white'
                    : 'border-[#e2e8f0] bg-white text-[#2D3436] hover:border-[#FF8E53]'
                    }`}
                >
                  <div className="flex items-center justify-center">
                    <Camera className="w-5 h-5 mr-3" />
                    <div>
                      <div className="font-semibold">Upload Image</div>
                      <div className="text-sm opacity-90">Take a photo</div>
                    </div>
                  </div>
                </button>
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
                        Auto-Generate Meal Plan
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
