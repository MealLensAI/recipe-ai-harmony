import React, { useState } from 'react';
import { Camera, List, Upload, Utensils, ChefHat, Search, Plus } from 'lucide-react';
import WeeklyPlanner from '../components/WeeklyPlanner';
import RecipeCard from '../components/RecipeCard';
import MealTypeFilter from '../components/MealTypeFilter';
import LoadingSpinner from '../components/LoadingSpinner';
import CookingTutorialModal from '../components/CookingTutorialModal';
import { useToast } from '@/hooks/use-toast';

interface MealPlan {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
}

const Index = () => {
  const [inputType, setInputType] = useState<'image' | 'ingredient_list'>('ingredient_list');
  const [ingredientList, setIngredientList] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedMealType, setSelectedMealType] = useState('all');
  const [showInputModal, setShowInputModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const { toast } = useToast();

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

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('image_or_ingredient_list', inputType);
      
      if (inputType === 'ingredient_list') {
        formData.append('ingredient_list', ingredientList);
      } else {
        formData.append('image', selectedImage!);
      }

      const response = await fetch('https://ai-utu2.onrender.com/smart_plan', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate meal plan');
      }

      const data = await response.json();
      setMealPlan(data.meal_plan);
      setShowInputModal(false);
      
      toast({
        title: "Success!",
        description: "Your 7-day meal plan has been generated",
      });
    } catch (error) {
      console.error('Error generating meal plan:', error);
      toast({
        title: "Error",
        description: "Failed to generate meal plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecipeClick = (recipeName: string) => {
    setSelectedRecipe(recipeName);
    setShowTutorialModal(true);
  };

  const getRecipesForSelectedDay = () => {
    const dayPlan = mealPlan.find(plan => plan.day === selectedDay);
    if (!dayPlan) return [];

    const recipes = [
      { title: dayPlan.breakfast, type: 'breakfast', time: '15 mins', rating: 5 },
      { title: dayPlan.lunch, type: 'lunch', time: '25 mins', rating: 4 },
      { title: dayPlan.dinner, type: 'dinner', time: '35 mins', rating: 5 },
    ];

    if (dayPlan.snack) {
      recipes.push({ title: dayPlan.snack, type: 'snack', time: '5 mins', rating: 4 });
    }

    return selectedMealType === 'all' 
      ? recipes 
      : recipes.filter(recipe => recipe.type === selectedMealType);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-[#e2e8f0] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🍓</div>
            <div>
              <h1 className="text-2xl font-bold text-[#2D3436]">The Ultimate Meal Planner</h1>
              <p className="text-sm text-[#1e293b] flex items-center gap-1">
                <span>🥑</span>
                a healthy outside starts from the inside
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowInputModal(true)}
            className="flex items-center gap-2 bg-[#FF6B6B] text-white px-4 py-2 rounded-lg hover:bg-[#FF8E53] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Plan
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex gap-6 p-6">
        {/* Sidebar */}
        <div className="w-64 bg-white rounded-xl p-6 h-fit shadow-sm border border-[#e2e8f0]">
          <WeeklyPlanner 
            selectedDay={selectedDay}
            onDaySelect={setSelectedDay}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {mealPlan.length > 0 ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#2D3436] mb-2">Recipes</h2>
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
                      time={recipe.time}
                      rating={recipe.rating}
                      mealType={recipe.type as any}
                      onClick={() => handleRecipeClick(recipe.title)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-[#e2e8f0]">
              <ChefHat className="w-16 h-16 text-[#e2e8f0] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#2D3436] mb-2">No Meal Plan Yet</h3>
              <p className="text-[#1e293b] mb-6">Create your first meal plan to get started with delicious recipes!</p>
              <button
                onClick={() => setShowInputModal(true)}
                className="bg-[#FF6B6B] text-white px-6 py-3 rounded-lg hover:bg-[#FF8E53] transition-colors"
              >
                Create Meal Plan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Input Modal */}
      {showInputModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#2D3436]">Create Your Meal Plan</h2>
              <button
                onClick={() => setShowInputModal(false)}
                className="text-[#1e293b] hover:text-[#FF6B6B] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Toggle Buttons */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setInputType('ingredient_list')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  inputType === 'ingredient_list'
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
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  inputType === 'image'
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

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {inputType === 'ingredient_list' ? (
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
              ) : (
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
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-[#FF6B6B] text-white font-bold text-lg rounded-xl hover:bg-[#FF8E53] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Utensils className="w-6 h-6 mr-3" />
                    Generate My Meal Plan
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
      />
    </div>
  );
};

export default Index;
