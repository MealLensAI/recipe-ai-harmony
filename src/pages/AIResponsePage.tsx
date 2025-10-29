"use client"

import type { FC } from "react"
import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Utensils } from "lucide-react"
import "@/styles/ai-response.css"
import { useAuth } from "@/lib/utils"
import { APP_CONFIG } from "@/lib/config"
import LoadingSpinner from "@/components/LoadingSpinner"
import { useSicknessSettings } from "@/hooks/useSicknessSettings"


interface HealthMeal {
  calories: number
  carbs: number
  fat: number
  fiber: number
  food_suggestions: string[]
  health_benefit: string
  ingredients_used: string[]
  protein: number
}

const AIResponsePage: FC = () => {
  const navigate = useNavigate()
  const [inputType, setInputType] = useState<"image" | "ingredient_list">("image")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [ingredientList, setIngredientList] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [detectedIngredients, setDetectedIngredients] = useState<string>("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [instructions, setInstructions] = useState<string>("")
  const [resources, setResources] = useState<any>(null)
  const [analysisId, setAnalysisId] = useState<string>("")
  const [loadingResources, setLoadingResources] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const { token, isAuthenticated, loading } = useAuth()

  // Health-focused meal generation state
  const [isHealthMode, setIsHealthMode] = useState(false)
  const [healthMeals, setHealthMeals] = useState<HealthMeal[]>([])
  const [showHealthResults, setShowHealthResults] = useState(false)
  const [showMealModal, setShowMealModal] = useState(false)
  const [selectedMealForModal, setSelectedMealForModal] = useState<HealthMeal | null>(null)
  const { settings: sicknessSettings, isHealthProfileComplete } = useSicknessSettings()

  // Set health mode to true by default if user has health conditions
  React.useEffect(() => {
    if (sicknessSettings.hasSickness && isHealthProfileComplete()) {
      setIsHealthMode(true)
    }
  }, [sicknessSettings.hasSickness, isHealthProfileComplete])

  if (loading) {
    return <LoadingSpinner />
  }
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl shadow-lg mx-auto">
            <Utensils className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Authentication Required</h2>
            <p className="text-gray-600">
              Please log in to use the AI Kitchen feature and save your recipe discoveries to history.
            </p>
            <Button
              onClick={() => navigate('/landing')}
              className="w-full py-3 text-lg font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg hover:from-red-600 hover:to-orange-600 transition-all duration-300"
            >
              Go to Landing Page
            </Button>
          </div>
        </div>
      </div>
    )
  }


  const handleDiscoverRecipes = async () => {
    if (sicknessSettings.hasSickness && isHealthMode) {
      await handleHealthMealGeneration()
      return
    }

    setIsLoading(true)
    setDetectedIngredients("")
    setSuggestions([])
    setInstructions("")
    setResources(null)
    setShowResults(false)
    setHealthMeals([])
    setShowHealthResults(false)

    const formData = new FormData()
    if (inputType === "image" && selectedImage) {
      formData.append("image_or_ingredient_list", "image")
      formData.append("image", selectedImage)
    } else if (inputType === "ingredient_list" && ingredientList.trim()) {
      formData.append("image_or_ingredient_list", "ingredient_list")
      formData.append("ingredient_list", ingredientList)
    } else {
      alert("Please provide an image or ingredient list")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("http://35.238.225.150:7017/process", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to process ingredients")
      }

      const data = await response.json()
      console.log("Process response:", data)

      if (data.error) {
        alert(data.error)
        return
      }

      setAnalysisId(data.analysis_id)
      setDetectedIngredients((data.response || []).join(', '))
      setSuggestions(data.food_suggestions || [])
      setShowResults(true)
    } catch (error) {
      console.error("Error processing ingredients:", error)
      alert("Failed to process ingredients. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleHealthMealGeneration = async () => {
    if (!isHealthProfileComplete) {
      alert("Please complete your health profile in Settings first.")
      return
    }

    setIsLoading(true)
    setHealthMeals([])
    setShowHealthResults(false)
    setDetectedIngredients("")
    setSuggestions([])
    setInstructions("")
    setResources(null)
    setShowResults(false)

    const formData = new FormData()

    // Add health profile data
    formData.append("age", sicknessSettings.age?.toString() || "")
    formData.append("weight", sicknessSettings.weight?.toString() || "")
    formData.append("height", sicknessSettings.height?.toString() || "")
    formData.append("waist", sicknessSettings.waist?.toString() || "")
    formData.append("gender", sicknessSettings.gender || "")
    formData.append("activity_level", sicknessSettings.activityLevel || "")
    formData.append("condition", sicknessSettings.sicknessType || "")
    formData.append("goal", sicknessSettings.goal === "heal" ? "heal" : "manage")

    if (inputType === "image" && selectedImage) {
      formData.append("image_or_ingredient_list", "image")
      formData.append("image", selectedImage)
    } else if (inputType === "ingredient_list" && ingredientList.trim()) {
      formData.append("image_or_ingredient_list", "ingredient_list")
      formData.append("ingredient_list", ingredientList)
    } else {
      alert("Please provide an image or ingredient list")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("http://35.238.225.150:7017/generate_meals_from_ingredients", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to generate health meals")
      }

      const data = await response.json()
      console.log("Health meal response:", data)

      if (data.error) {
        alert(data.error)
        return
      }

      setHealthMeals(data.meal_options || [])
      setDetectedIngredients(data.main_ingredients || "")
      setShowHealthResults(true)
    } catch (error) {
      console.error("Error generating health meals:", error)
      alert("Failed to generate health meals. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = async (suggestion: string) => {
    setIsLoading(true)
    setInstructions("")
    setResources(null)

    console.log('Starting to fetch instructions for:', suggestion)

    try {
      // 1. Get cooking instructions first
      const formData = new FormData()
      formData.append("food_analysis_id", analysisId)
      formData.append("food_choice_index", suggestion)

      console.log('Fetching instructions with analysisId:', analysisId)

      const instrRes = await fetch("http://35.238.225.150:7017/instructions", {
        method: "POST",
        body: formData,
      })
      const instrData = await instrRes.json()

      console.log('Instructions API response:', instrData)

      // Convert markdown to HTML (same as tutorial page)
      let htmlInstructions = instrData.instructions || '';
      htmlInstructions = htmlInstructions
        .replace(/\*\*(.*?)\*\*/g, '<br><strong>$1</strong><br>')
        .replace(/\*\s*(.*?)\s*\*/g, '<p>$1</p>')
        .replace(/(\d+\.)/g, '<br>$1');

      console.log('Converted HTML instructions:', htmlInstructions)
      setInstructions(htmlInstructions);

      // Instructions are loaded, now start loading resources
      setIsLoading(false);
      setLoadingResources(true);

      // 2. Get resources (YouTube and Google)
      const resForm = new FormData()
      resForm.append("food_choice_index", suggestion)
      const resRes = await fetch("http://35.238.225.150:7017/resources", {
        method: "POST",
        body: resForm,
      })
      const resData = await resRes.json()
      setResources(resData)

      // Now POST to backend
      if (
        token &&
        detectedIngredients.length &&
        instrData.instructions &&
        resData
      ) {
        const payload = {
          recipe_type: "ingredient_detection",
          suggestion: suggestion || "",
          instructions: instrData.instructions || "",
          ingredients: JSON.stringify(detectedIngredients || []), // Use actual detected ingredients
          detected_foods: JSON.stringify(detectedIngredients || []),
          analysis_id: analysisId || "",
          youtube: resData?.YoutubeSearch?.[0]?.link || "",
          google: resData?.GoogleSearch?.[0]?.link || "",
          resources: JSON.stringify(resData || {})
        };
        await fetch(`${APP_CONFIG.api.base_url}/api/food_detection/detection_history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload)
        });
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setInstructions('Failed to load instructions. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingResources(false);
    }
  }

  const handleHealthMealInstructions = async (meal: HealthMeal) => {
    setIsLoading(true)
    setInstructions("")
    setResources(null)

    try {
      const response = await fetch("http://35.238.225.150:7017/sick_meal_plan_instructions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          food_name: meal.food_suggestions[0] || "Health Meal",
          ingredients: meal.ingredients_used,
          sickness: sicknessSettings.sicknessType
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get health meal instructions")
      }

      const data = await response.json()
      console.log("Health meal instructions response:", data)

      if (data.error) {
        alert(data.error)
        return
      }

      // Convert markdown to HTML (same as regular instructions)
      let htmlInstructions = data.instructions || '';
      htmlInstructions = htmlInstructions
        .replace(/\*\*(.*?)\*\*/g, '<br><strong>$1</strong><br>')
        .replace(/\*\s*(.*?)\s*\*/g, '<p>$1</p>')
        .replace(/(\d+\.)/g, '<br>$1');

      setInstructions(htmlInstructions)

      // Instructions are loaded, now start loading resources
      setIsLoading(false);
      setLoadingResources(true);

      // 2. Get resources (YouTube and Google) for the health meal
      const resForm = new FormData()
      resForm.append("food_choice_index", meal.food_suggestions[0] || "Health Meal")
      const resRes = await fetch("http://35.238.225.150:7017/resources", {
        method: "POST",
        body: resForm,
      })
      const resData = await resRes.json()
      setResources(resData)

    } catch (error) {
      console.error("Error fetching health meal instructions:", error)
      alert("Failed to load health meal instructions. Please try again.")
    } finally {
      setIsLoading(false);
      setLoadingResources(false);
    }
  }

  const handleViewMealInfo = (meal: HealthMeal, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent the button click from triggering
    setSelectedMealForModal(meal)
    setShowMealModal(true)
  }

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
  }

  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        background: "url('https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=2000&q=80') center/cover no-repeat fixed",
        padding: "2rem 1rem",
        color: "#2D3436",
        lineHeight: "1.6"
      }}
    >
      <div className="max-w-[1400px] mx-auto">
        <div
          className="bg-[rgba(255,255,255,0.95)] rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.1)] overflow-hidden p-12 relative max-w-[800px] mx-auto"
        >
          {/* Title */}
          <h1
            className="text-[2.5rem] font-extrabold text-center mb-8 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] bg-clip-text text-transparent tracking-[-1px]"
          >
            Ingredient Detection
          </h1>

          {/* Health-aware detection badge */}
          {sicknessSettings.hasSickness && (
            <div className="absolute top-4 right-4">
              <div className="inline-flex items-center bg-orange-100 text-orange-800 rounded-full px-4 py-2 text-sm font-medium">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                Health-aware detection
              </div>
            </div>
          )}

          {/* Input Form */}
          <div className="mb-4">
            <label className="block font-semibold text-lg text-[#2D3436] mb-3">
              How would you like to start?
            </label>
            <select
              className="w-full bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-2xl p-4 text-lg transition-all duration-300 shadow-[0_4px_6px_rgba(0,0,0,0.05)] focus:border-[#FF6B6B] focus:shadow-[0_0_0_4px_rgba(255,107,107,0.2)]"
              value={inputType}
              onChange={(e) => setInputType(e.target.value as "image" | "ingredient_list")}
            >
              <option value="image">Snap or Upload Ingredient Image</option>
              <option value="ingredient_list">List Your Ingredients</option>
            </select>
          </div>


          {/* Image Input */}
          {inputType === "image" && (
            <div className="mb-4">
              <label className="block font-semibold text-lg text-[#2D3436] mb-3">
                Share Your Food Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="w-full bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-2xl p-4 text-lg transition-all duration-300 shadow-[0_4px_6px_rgba(0,0,0,0.05)] focus:border-[#FF6B6B] focus:shadow-[0_0_0_4px_rgba(255,107,107,0.2)]"
              />
              {imagePreview && (
                <div className="flex justify-center mt-2.5">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-[400px] h-[300px] object-cover rounded-2xl"
                  />
                </div>
              )}
            </div>
          )}

          {/* Ingredient Input */}
          {inputType === "ingredient_list" && (
            <div className="mb-4">
              <label className="block font-semibold text-lg text-[#2D3436] mb-3">
                What ingredients do you have?
              </label>
              <input
                type="text"
                value={ingredientList}
                onChange={(e) => setIngredientList(e.target.value)}
                placeholder="e.g., chicken, tomatoes, basil, olive oil"
                className="w-full bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-2xl p-4 text-lg transition-all duration-300 shadow-[0_4px_6px_rgba(0,0,0,0.05)] focus:border-[#FF6B6B] focus:shadow-[0_0_0_4px_rgba(255,107,107,0.2)]"
              />
            </div>
          )}

          {/* Discover Button */}
          <button
            onClick={handleDiscoverRecipes}
            disabled={isLoading || (sicknessSettings.hasSickness && isHealthMode && !isHealthProfileComplete)}
            className="w-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white border-none rounded-2xl py-4 px-8 text-xl font-semibold transition-all duration-300 uppercase tracking-wider shadow-[0_4px_15px_rgba(255,107,107,0.3)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(255,107,107,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(sicknessSettings.hasSickness && isHealthMode) ? "Generate Health Meals" : "Discover Recipes"}
          </button>

          {/* Loading Spinner */}
          {isLoading && (
            <div className="flex justify-center mt-8">
              <div className="w-12 h-12 border-4 border-[rgba(255,107,107,0.3)] border-t-[#FF6B6B] rounded-full animate-spin"></div>
            </div>
          )}

          {/* Health Meal Results */}
          {showHealthResults && (
            <div className="mt-4">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-[#2D3436] mb-2 text-center">
                  Health-Focused Meal Options
                </h3>
                <p className="text-gray-600 text-center">
                  Meals tailored for {sicknessSettings.sicknessType} management
                </p>
              </div>

              {/* Side by side layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Detected Ingredients for Health Mode */}
                <div className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:translate-y-[-5px] hover:shadow-[0_15px_35px_rgba(0,0,0,0.15)]">
                  <div className="p-4 mt-2.5">
                    <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                      AI Detected Ingredient
                    </h5>
                    <div className="text-left">
                      <p className="text-lg text-gray-700">{detectedIngredients}</p>
                    </div>
                  </div>
                </div>

                {/* AI Recipe Suggestions */}
                <div className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:translate-y-[-5px] hover:shadow-[0_15px_35px_rgba(0,0,0,0.15)]">
                  <div className="p-4 mt-2.5">
                    <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                      AI Recipe Suggestions
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {healthMeals.map((meal, i) => (
                        <div key={i} className="relative inline-block">
                          <button
                            onClick={() => handleHealthMealInstructions(meal)}
                            disabled={isLoading}
                            className="bg-white text-[#FF6B6B] border-2 border-[#FF6B6B] rounded-2xl px-3 py-3 m-2 transition-all duration-300 font-semibold text-base hover:bg-gradient-to-r hover:from-[#FF6B6B] hover:to-[#FF8E53] hover:text-white hover:border-transparent hover:translate-y-[-2px] hover:shadow-[0_4px_12px_rgba(255,107,107,0.2)] pr-10"
                          >
                            {meal.food_suggestions[0] || "Health Meal"}
                          </button>

                          {/* Small MORE INFO button inside bottom right corner */}
                          <button
                            onClick={(e) => handleViewMealInfo(meal, e)}
                            className="absolute bottom-1 right-1 bg-orange-500 text-white rounded text-xs font-bold px-1 py-0 shadow-sm hover:bg-red-600 transition-colors"
                            title="View meal details"
                          >
                            MORE INFO
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions Section for Health Mode */}
              {instructions && (
                <div
                  className="mt-8 bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                >
                  <div className="p-4 mt-2.5">
                    <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                      Cooking Instructions
                    </h5>
                    <div
                      className="leading-[1.4] m-0 text-left"
                      style={{ lineHeight: '1.4', margin: 0, textAlign: 'left' }}
                      dangerouslySetInnerHTML={{ __html: instructions }}
                    />
                  </div>
                </div>
              )}

              {/* Resources Section for Health Mode */}
              {loadingResources && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* YouTube Resources Loading */}
                  <div
                    className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                  >
                    <div className="p-4 mt-2.5">
                      <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                        Youtube Resources
                      </h5>
                      <h6 className="font-bold mb-3 text-left">Video Tutorials</h6>
                      <div className="w-full h-1 bg-[#f0f0f0] rounded-sm my-4 overflow-hidden relative">
                        <div
                          className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] rounded-sm"
                          style={{
                            animation: 'loading-slide 1.5s ease-in-out infinite'
                          }}
                        ></div>
                      </div>
                      <div className="text-center">Loading video tutorials...</div>
                    </div>
                  </div>

                  {/* Google Resources Loading */}
                  <div
                    className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                  >
                    <div className="p-4 mt-2.5">
                      <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                        Google Resources
                      </h5>
                      <h6 className="font-bold mb-3 text-left">Recommended Articles</h6>
                      <div className="w-full h-1 bg-[#f0f0f0] rounded-sm my-4 overflow-hidden relative">
                        <div
                          className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] rounded-sm"
                          style={{
                            animation: 'loading-slide 1.5s ease-in-out infinite'
                          }}
                        ></div>
                      </div>
                      <div className="text-center">Loading articles...</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Resources Content for Health Mode */}
              {resources && !loadingResources && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* YouTube Resources */}
                  <div
                    className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                  >
                    <div className="p-4 mt-2.5">
                      <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                        Youtube Resources
                      </h5>
                      <h6 className="font-bold mb-3 text-left">Video Tutorials</h6>
                      {resources.YoutubeSearch && resources.YoutubeSearch.length > 0 ? (
                        <div className="space-y-6">
                          {resources.YoutubeSearch.map((item: any, idx: number) => {
                            const videoId = getYouTubeVideoId(item.link);
                            return videoId ? (
                              <div key={idx} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <div className="relative w-full aspect-video bg-black">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title={item.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full rounded-t-2xl"
                                  />
                                </div>
                                <div className="p-6">
                                  <h4 className="font-bold text-[#2D3436] text-base mb-1 line-clamp-2 leading-tight text-left">{item.title}</h4>
                                  <p className="text-xs text-gray-500 mb-4 text-left">{item.channel || ''}</p>
                                </div>
                              </div>
                            ) : (
                              <div key={idx} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <div className="p-6">
                                  <h4 className="font-bold text-[#2D3436] text-base mb-1 line-clamp-2 leading-tight text-left">{item.title}</h4>
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-red-500 text-base font-semibold hover:underline"
                                  >
                                    Watch Tutorial
                                  </a>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-center text-gray-600">No video tutorials available.</p>
                      )}
                    </div>
                  </div>

                  {/* Google Resources */}
                  <div
                    className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                  >
                    <div className="p-4 mt-2.5">
                      <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                        Google Resources
                      </h5>
                      <h6 className="font-bold mb-3 text-left">Recommended Articles</h6>
                      {resources.GoogleSearch && resources.GoogleSearch.length > 0 ? (
                        <div className="space-y-6">
                          {resources.GoogleSearch
                            .filter((item: any) =>
                              !item.title.toLowerCase().includes('gnu make') &&
                              !item.description.toLowerCase().includes('gnu make')
                            )
                            .map((item: any, idx: number) => (
                              <div key={idx} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <div className="p-6">
                                  <h4 className="font-bold text-[#2D3436] text-base mb-1 line-clamp-2 leading-tight text-left">{item.title}</h4>
                                  <p className="text-xs text-gray-500 mb-4 line-clamp-3 leading-relaxed text-left">{item.description}</p>
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow hover:from-blue-400 hover:to-blue-500 transition-colors"
                                  >
                                    Read More
                                  </a>
                                </div>
                              </div>
                            ))}
                          {resources.GoogleSearch.filter((item: any) =>
                            item.title.toLowerCase().includes('gnu make') ||
                            item.description.toLowerCase().includes('gnu make')
                          ).length > 0 && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-yellow-800 text-sm">
                                  ⚠️ Some search results were filtered out due to incorrect content. The search API needs to be fixed.
                                </p>
                              </div>
                            )}
                        </div>
                      ) : (
                        <p className="text-center text-gray-600">No articles available.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Results */}
          {showResults && (
            <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Detected Ingredients */}
                <div
                  className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:translate-y-[-5px] hover:shadow-[0_15px_35px_rgba(0,0,0,0.15)]"
                >
                  <div className="p-4 mt-2.5">
                    <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                      AI Detected Ingredient
                    </h5>
                    <div className="text-left">
                      <p className="text-lg text-gray-700">{detectedIngredients}</p>
                    </div>
                  </div>
                </div>

                {/* AI Recipe Suggestions */}
                <div
                  className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:translate-y-[-5px] hover:shadow-[0_15px_35px_rgba(0,0,0,0.15)]"
                >
                  <div className="p-4 mt-2.5">
                    <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                      AI Recipe Suggestions
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(suggestion)}
                          disabled={isLoading}
                          className="bg-white text-[#FF6B6B] border-2 border-[#FF6B6B] rounded-2xl px-3 py-3 m-2 transition-all duration-300 font-semibold text-base hover:bg-gradient-to-r hover:from-[#FF6B6B] hover:to-[#FF8E53] hover:text-white hover:border-transparent hover:translate-y-[-2px] hover:shadow-[0_4px_12px_rgba(255,107,107,0.2)]"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions Section */}
              {instructions && (
                <div
                  className="mt-8 bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                >
                  <div className="p-4 mt-2.5">
                    <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                      Cooking Instructions
                    </h5>
                    <div
                      className="leading-[1.4] m-0 text-left"
                      style={{ lineHeight: '1.4', margin: 0, textAlign: 'left' }}
                      dangerouslySetInnerHTML={{ __html: instructions }}
                    />
                  </div>
                </div>
              )}

              {/* Resources Section */}
              {loadingResources && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* YouTube Resources Loading */}
                  <div
                    className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                  >
                    <div className="p-4 mt-2.5">
                      <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                        Youtube Resources
                      </h5>
                      <h6 className="font-bold mb-3 text-left">Video Tutorials</h6>
                      <div className="w-full h-1 bg-[#f0f0f0] rounded-sm my-4 overflow-hidden relative">
                        <div
                          className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] rounded-sm"
                          style={{
                            animation: 'loading-slide 1.5s ease-in-out infinite'
                          }}
                        ></div>
                      </div>
                      <div className="text-center">Loading video tutorials...</div>
                    </div>
                  </div>

                  {/* Google Resources Loading */}
                  <div
                    className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                  >
                    <div className="p-4 mt-2.5">
                      <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                        Google Resources
                      </h5>
                      <h6 className="font-bold mb-3 text-left">Recommended Articles</h6>
                      <div className="w-full h-1 bg-[#f0f0f0] rounded-sm my-4 overflow-hidden relative">
                        <div
                          className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] rounded-sm"
                          style={{
                            animation: 'loading-slide 1.5s ease-in-out infinite'
                          }}
                        ></div>
                      </div>
                      <div className="text-center">Loading articles...</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Resources Content */}
              {resources && !loadingResources && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* YouTube Resources */}
                  <div
                    className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                  >
                    <div className="p-4 mt-2.5">
                      <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                        Youtube Resources
                      </h5>
                      <h6 className="font-bold mb-3 text-left">Video Tutorials</h6>
                      {resources.YoutubeSearch && resources.YoutubeSearch.length > 0 ? (
                        <div className="space-y-6">
                          {resources.YoutubeSearch.map((item: any, idx: number) => {
                            const videoId = getYouTubeVideoId(item.link);
                            return videoId ? (
                              <div key={idx} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <div className="relative w-full aspect-video bg-black">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title={item.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full rounded-t-2xl"
                                  />
                                </div>
                                <div className="p-6">
                                  <h4 className="font-bold text-[#2D3436] text-base mb-1 line-clamp-2 leading-tight text-left">{item.title}</h4>
                                  <p className="text-xs text-gray-500 mb-4 text-left">{item.channel || ''}</p>
                                </div>
                              </div>
                            ) : (
                              <div key={idx} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <div className="p-6">
                                  <h4 className="font-bold text-[#2D3436] text-base mb-1 line-clamp-2 leading-tight text-left">{item.title}</h4>
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-red-500 text-base font-semibold hover:underline"
                                  >
                                    Watch Tutorial
                                  </a>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-center text-gray-600">No video tutorials available.</p>
                      )}
                    </div>
                  </div>

                  {/* Google Resources */}
                  <div
                    className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                  >
                    <div className="p-4 mt-2.5">
                      <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                        Google Resources
                      </h5>
                      <h6 className="font-bold mb-3 text-left">Recommended Articles</h6>
                      {resources.GoogleSearch && resources.GoogleSearch.length > 0 ? (
                        <div className="space-y-6">
                          {resources.GoogleSearch
                            .filter((item: any) =>
                              !item.title.toLowerCase().includes('gnu make') &&
                              !item.description.toLowerCase().includes('gnu make')
                            )
                            .map((item: any, idx: number) => (
                              <div key={idx} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <div className="p-6">
                                  <h4 className="font-bold text-[#2D3436] text-base mb-1 line-clamp-2 leading-tight text-left">{item.title}</h4>
                                  <p className="text-xs text-gray-500 mb-4 line-clamp-3 leading-relaxed text-left">{item.description}</p>
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow hover:from-blue-400 hover:to-blue-500 transition-colors"
                                  >
                                    Read More
                                  </a>
                                </div>
                              </div>
                            ))}
                          {resources.GoogleSearch.filter((item: any) =>
                            item.title.toLowerCase().includes('gnu make') ||
                            item.description.toLowerCase().includes('gnu make')
                          ).length > 0 && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-yellow-800 text-sm">
                                  ⚠️ Some search results were filtered out due to incorrect content. The search API needs to be fixed.
                                </p>
                              </div>
                            )}
                        </div>
                      ) : (
                        <p className="text-center text-gray-600">No articles available.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Meal Info Modal */}
      {showMealModal && selectedMealForModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-[#2D3436]">
                  {selectedMealForModal.food_suggestions[0] || "Health Meal"}
                </h3>
                <button
                  onClick={() => setShowMealModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-[#2D3436] mb-3">Health Benefit:</h4>
                  <p className="text-gray-600 leading-relaxed">
                    {selectedMealForModal.health_benefit}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#2D3436] mb-3">Nutrition Information:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-orange-50 rounded-lg p-4">
                      <span className="font-medium text-orange-700">Calories:</span>
                      <span className="ml-2 text-orange-600 font-bold text-lg">{selectedMealForModal.calories}</span>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <span className="font-medium text-blue-700">Protein:</span>
                      <span className="ml-2 text-blue-600 font-bold text-lg">{selectedMealForModal.protein}g</span>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <span className="font-medium text-green-700">Carbs:</span>
                      <span className="ml-2 text-green-600 font-bold text-lg">{selectedMealForModal.carbs}g</span>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <span className="font-medium text-purple-700">Fat:</span>
                      <span className="ml-2 text-purple-600 font-bold text-lg">{selectedMealForModal.fat}g</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-[#2D3436] mb-3">Ingredients Used:</h4>
                  <ul className="space-y-2">
                    {selectedMealForModal.ingredients_used.map((ingredient, idx) => (
                      <li key={idx} className="flex items-center text-gray-600">
                        <span className="w-2 h-2 bg-orange-400 rounded-full mr-3"></span>
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowMealModal(false);
                      handleHealthMealInstructions(selectedMealForModal);
                    }}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white border-none rounded-xl py-3 px-4 font-semibold transition-all duration-300 hover:from-orange-600 hover:to-red-600 hover:translate-y-[-2px] hover:shadow-lg"
                  >
                    Get Cooking Instructions
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes loading-slide {
          0% {
            left: -30%;
          }
          100% {
            left: 100%;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default AIResponsePage
