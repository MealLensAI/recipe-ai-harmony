"use client"

import type { FC } from "react"
import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import "@/styles/ai-response.css"
import { useAuth } from "@/lib/utils"
import { APP_CONFIG } from "@/lib/config"
import LoadingSpinner from "@/components/LoadingSpinner"
import Logo from "@/components/Logo"
import { useSicknessSettings } from "@/hooks/useSicknessSettings"
import Swal from 'sweetalert2'
import { api } from "@/lib/api"


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
  const [detectedIngredientsArray, setDetectedIngredientsArray] = useState<string[]>([])
  const [instructions, setInstructions] = useState<string>("")
  const [resources, setResources] = useState<any>(null)
  const [loadingResources, setLoadingResources] = useState(false)
  const [healthMeals, setHealthMeals] = useState<HealthMeal[]>([])
  const [showHealthResults, setShowHealthResults] = useState(false)
  const [showMealModal, setShowMealModal] = useState(false)
  const [selectedMealForModal, setSelectedMealForModal] = useState<HealthMeal | null>(null)
  const { token, isAuthenticated, loading } = useAuth()
  const { settings: sicknessSettings, isHealthProfileComplete } = useSicknessSettings()

  if (loading) {
    return <LoadingSpinner />
  }
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="flex items-center justify-center mx-auto">
            <Logo size="lg" />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Authentication Required</h2>
            <p className="text-gray-600">
              Please log in to use the Health Meal Generation feature.
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

  const handleHealthMealGeneration = async () => {
    if (!isHealthProfileComplete()) {
      Swal.fire({
        icon: 'info',
        title: 'Health Profile Required',
        text: 'Please complete your health profile in Settings first.',
        confirmButtonColor: '#f97316'
      })
      return
    }

    setIsLoading(true)
    setHealthMeals([])
    setShowHealthResults(false)
    setDetectedIngredients("")
    setInstructions("")
    setResources(null)

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
      Swal.fire({
        icon: 'warning',
        title: 'Missing Input',
        text: 'Please provide an image or ingredient list',
        confirmButtonColor: '#f97316'
      })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${APP_CONFIG.api.ai_api_url}/generate_meals_from_ingredients`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to generate health meals")
      }

      const data = await response.json()
      console.log("Health meal response:", data)

      if (data.error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.error,
          confirmButtonColor: '#f97316'
        })
        return
      }

      setHealthMeals(data.meal_options || [])
      const mainIngredients = data.main_ingredients || ""
      setDetectedIngredients(mainIngredients)
      setDetectedIngredientsArray(mainIngredients ? mainIngredients.split(', ').filter(Boolean) : [])
      setShowHealthResults(true)
    } catch (error) {
      console.error("Error generating health meals:", error)
      Swal.fire({
        icon: 'error',
        title: 'Generation Failed',
        text: 'Failed to generate health meals. Please try again.',
        confirmButtonColor: '#f97316'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleHealthMealInstructions = async (meal: HealthMeal) => {
    setIsLoading(true)
    setInstructions("")
    setResources(null)

    // Generate analysis ID for this health meal
    const analysisId = `health-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    try {
      const response = await fetch(`${APP_CONFIG.api.ai_api_url}/sick_meal_plan_instructions`, {
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
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.error,
          confirmButtonColor: '#f97316'
        })
        return
      }

      // Convert markdown to HTML
      let htmlInstructions = data.instructions || ''
      htmlInstructions = htmlInstructions
        .replace(/\*\*(.*?)\*\*/g, '<br><strong>$1</strong><br>')
        .replace(/\*\s*(.*?)\s*\*/g, '<p>$1</p>')
        .replace(/(\d+\.)/g, '<br>$1')

      setInstructions(htmlInstructions)

      // Instructions are loaded, now start loading resources
      setIsLoading(false)
      setLoadingResources(true)

      // Get resources (YouTube and Google) for the health meal
      try {
        const resForm = new FormData()
        const mealName = meal.food_suggestions?.[0] || meal.name || meal.title || "Health Meal"
        resForm.append("food_choice_index", mealName)
        console.log("[AIResponse] Fetching resources for:", mealName)
        
        const resRes = await fetch(`${APP_CONFIG.api.ai_api_url}/resources`, {
          method: "POST",
          body: resForm,
        })
        
        if (!resRes.ok) {
          throw new Error(`Resources API returned ${resRes.status}`)
        }
        
        const resData = await resRes.json()
        console.log("[AIResponse] Resources response:", resData)
        
        // Ensure resources object has the expected structure
        const formattedResources = {
          YoutubeSearch: resData.YoutubeSearch || resData.youtube || resData.YouTube || [],
          GoogleSearch: resData.GoogleSearch || resData.google || resData.Google || []
        }
        
        setResources(formattedResources)
        setLoadingResources(false)
        
        console.log("[AIResponse] Formatted resources:", formattedResources)
        
        // Save to history after resources are loaded
        if (token && meal.ingredients_used.length && data.instructions) {
          try {
            const mealName = meal.food_suggestions?.[0] || meal.name || meal.title || "Health Meal"
            
            // Format resources as JSON string for storage
            const resourcesJson = JSON.stringify(formattedResources)
            
            // Get YouTube and Google links (first result from each)
            const youtubeLink = formattedResources.YoutubeSearch?.[0]?.link || 
                              (Array.isArray(formattedResources.YoutubeSearch) && formattedResources.YoutubeSearch.length > 0 && formattedResources.YoutubeSearch[0]?.[0]?.link) || 
                              ""
            const googleLink = formattedResources.GoogleSearch?.[0]?.link || 
                             (Array.isArray(formattedResources.GoogleSearch) && formattedResources.GoogleSearch.length > 0 && formattedResources.GoogleSearch[0]?.[0]?.link) || 
                             ""
            
            const historyData = {
              recipe_type: "health_meal",
              suggestion: mealName,
              instructions: htmlInstructions,
              ingredients: JSON.stringify(meal.ingredients_used),
              detected_foods: JSON.stringify(meal.ingredients_used),
              analysis_id: analysisId,
              youtube_link: youtubeLink,
              google_link: googleLink,
              resources_link: resourcesJson
            }
            
            console.log("[AIResponse] Saving health meal to history:", historyData)
            const saveResult = await api.saveDetectionHistory(historyData)
            
            if (saveResult.status === 'success') {
              console.log("[AIResponse] ✅ Health meal saved to history successfully")
            } else {
              console.warn("[AIResponse] ⚠️ Failed to save health meal to history:", saveResult.message)
            }
          } catch (historyError) {
            console.error("[AIResponse] Error saving health meal to history:", historyError)
            // Don't show error to user, history saving is non-critical
          }
        }
      } catch (resourceError) {
        console.error("[AIResponse] Error fetching resources:", resourceError)
        // Set empty resources on error, so UI doesn't show loading forever
        setResources({ YoutubeSearch: [], GoogleSearch: [] })
        setLoadingResources(false)
        
        // Still try to save history even if resources failed
        if (token && meal.ingredients_used.length && data.instructions) {
          try {
            const mealName = meal.food_suggestions?.[0] || meal.name || meal.title || "Health Meal"
            const historyData = {
              recipe_type: "health_meal",
              suggestion: mealName,
              instructions: htmlInstructions,
              ingredients: JSON.stringify(meal.ingredients_used),
              detected_foods: JSON.stringify(meal.ingredients_used),
              analysis_id: analysisId,
              youtube_link: "",
              google_link: "",
              resources_link: "{}"
            }
            await api.saveDetectionHistory(historyData)
            console.log("[AIResponse] ✅ Health meal saved to history (without resources)")
          } catch (historyError) {
            console.error("[AIResponse] Error saving health meal to history:", historyError)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching health meal instructions:", error)
      Swal.fire({
        icon: 'error',
        title: 'Loading Failed',
        text: 'Failed to load health meal instructions. Please try again.',
        confirmButtonColor: '#f97316'
      })
    } finally {
      setIsLoading(false)
      setLoadingResources(false)
    }
  }

  const handleViewMealInfo = (meal: HealthMeal, event: React.MouseEvent) => {
    event.stopPropagation()
    setSelectedMealForModal(meal)
    setShowMealModal(true)
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        background: "url('https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=2000&q=80') center/cover no-repeat fixed",
        padding: "1rem 0.5rem sm:2rem 1rem",
        color: "#2D3436",
        lineHeight: "1.6"
      }}
    >
      <div className="max-w-[1400px] mx-auto px-2 sm:px-4">
        <div
          className="bg-[rgba(255,255,255,0.95)] rounded-2xl sm:rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.1)] overflow-hidden p-4 sm:p-8 lg:p-12 relative max-w-[800px] mx-auto"
        >
          {/* Title */}
          <h1
            className="text-2xl sm:text-3xl lg:text-[2.5rem] font-extrabold text-center mb-4 sm:mb-8 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] bg-clip-text text-transparent tracking-[-1px]"
          >
            Health Meal Generator
          </h1>

          {/* Health-aware detection badge */}
          {sicknessSettings.hasSickness && (
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
              <div className="inline-flex items-center bg-orange-100 text-orange-800 rounded-full px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-1 sm:mr-2"></div>
                <span className="hidden sm:inline">Tailored for {sicknessSettings.sicknessType}</span>
                <span className="sm:hidden">{sicknessSettings.sicknessType}</span>
              </div>
            </div>
          )}

          {/* Input Form */}
          <div className="mb-4">
            <label className="block font-semibold text-lg text-[#2D3436] mb-3">
              How would you like to provide your ingredients?
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
              <label className="block font-semibold text-sm sm:text-lg text-[#2D3436] mb-2 sm:mb-3">
                Share Your Food Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="w-full bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-lg transition-all duration-300 shadow-[0_4px_6px_rgba(0,0,0,0.05)] focus:border-[#FF6B6B] focus:shadow-[0_0_0_4px_rgba(255,107,107,0.2)]"
              />
              {imagePreview && (
                <div className="flex justify-center mt-2.5">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-w-[400px] h-auto sm:h-[300px] object-cover rounded-xl sm:rounded-2xl"
                  />
                </div>
              )}
            </div>
          )}

          {/* Ingredient Input */}
          {inputType === "ingredient_list" && (
            <div className="mb-4">
              <label className="block font-semibold text-sm sm:text-lg text-[#2D3436] mb-2 sm:mb-3">
                What ingredients do you have?
              </label>
              <input
                type="text"
                value={ingredientList}
                onChange={(e) => setIngredientList(e.target.value)}
                placeholder="e.g., chicken, tomatoes, basil, olive oil"
                className="w-full bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-lg transition-all duration-300 shadow-[0_4px_6px_rgba(0,0,0,0.05)] focus:border-[#FF6B6B] focus:shadow-[0_0_0_4px_rgba(255,107,107,0.2)]"
              />
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleHealthMealGeneration}
            disabled={isLoading || !isHealthProfileComplete()}
            className="w-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white border-none rounded-xl sm:rounded-2xl py-3 sm:py-4 px-4 sm:px-8 text-base sm:text-xl font-semibold transition-all duration-300 uppercase tracking-wider shadow-[0_4px_15px_rgba(255,107,107,0.3)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(255,107,107,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Health Meals
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
                {/* AI Detected Ingredients */}
                <div className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:translate-y-[-5px] hover:shadow-[0_15px_35px_rgba(0,0,0,0.15)]">
                  <div className="p-4 mt-2.5">
                    <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                      Detected Ingredients
                    </h5>
                    <div className="text-left">
                      <p className="text-lg text-gray-700">{detectedIngredients}</p>
                    </div>
                  </div>
                </div>

                {/* Health Meal Suggestions */}
                <div className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:translate-y-[-5px] hover:shadow-[0_15px_35px_rgba(0,0,0,0.15)]">
                  <div className="p-4 mt-2.5">
                    <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                      Health Meal Options
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

                          <button
                            onClick={(e) => handleViewMealInfo(meal, e)}
                            className="absolute bottom-1 right-1 bg-orange-500 text-white rounded text-xs font-bold px-1 py-0 shadow-sm hover:bg-red-600 transition-colors"
                            title="View meal details"
                          >
                            INFO
                          </button>
                        </div>
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

              {/* Resources Section - Loading State */}
              {loadingResources && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Youtube Resources Loading */}
                  <div className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
                    <div className="p-4 mt-2.5">
                      <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                        Youtube Resources
                      </h5>
                      <h6 className="font-bold mb-3 text-left">Video Tutorials</h6>
                      <div className="space-y-4">
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden relative">
                          <div 
                            className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                            style={{
                              animation: 'loading-slide 1.5s ease-in-out infinite'
                            }}
                          ></div>
                        </div>
                        <p className="text-gray-600 text-center">Loading video tutorials...</p>
                      </div>
                    </div>
                  </div>

                  {/* Google Resources Loading */}
                  <div className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
                    <div className="p-4 mt-2.5">
                      <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                        Google Resources
                      </h5>
                      <h6 className="font-bold mb-3 text-left">Recommended Articles</h6>
                      <div className="space-y-4">
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden relative">
                          <div 
                            className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                            style={{
                              animation: 'loading-slide 1.5s ease-in-out infinite'
                            }}
                          ></div>
                        </div>
                        <p className="text-gray-600 text-center">Loading articles...</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Resources Content */}
              {resources && !loadingResources && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* YouTube Resources */}
                  {resources.YoutubeSearch && Array.isArray(resources.YoutubeSearch) && resources.YoutubeSearch.length > 0 && (
                    <div className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
                      <div className="p-4 mt-2.5">
                        <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                          Video Tutorials
                        </h5>
                        <div className="space-y-6">
                          {resources.YoutubeSearch.flat().slice(0, 3).map((item: any, idx: number) => {
                            const videoId = getYouTubeVideoId(item.link)
                            return videoId ? (
                              <div key={idx} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
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
                                </div>
                              </div>
                            ) : null
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Google Resources */}
                  {resources.GoogleSearch && Array.isArray(resources.GoogleSearch) && resources.GoogleSearch.length > 0 && (
                    <div className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
                      <div className="p-4 mt-2.5">
                        <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                          Google Resources
                        </h5>
                        <h6 className="font-bold mb-3 text-left">Recommended Articles</h6>
                        <div className="space-y-6">
                          {resources.GoogleSearch.flat()
                            .filter((item: any) =>
                              !item.title.toLowerCase().includes('gnu make') &&
                              !item.description.toLowerCase().includes('gnu make')
                            )
                            .slice(0, 3)
                            .map((item: any, idx: number) => (
                              <div key={idx} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
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
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Show message if no resources available */}
                  {(!resources.YoutubeSearch || !Array.isArray(resources.YoutubeSearch) || resources.YoutubeSearch.length === 0) &&
                   (!resources.GoogleSearch || !Array.isArray(resources.GoogleSearch) || resources.GoogleSearch.length === 0) && (
                    <div className="col-span-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-[1.5rem] border border-gray-200 p-8 text-center">
                      <p className="text-gray-600">No video tutorials or articles available for this meal.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Meal Info Modal */}
      {showMealModal && selectedMealForModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-2xl font-bold text-[#2D3436] pr-4">
                  {selectedMealForModal.food_suggestions[0] || "Health Meal"}
                </h3>
                <button
                  onClick={() => setShowMealModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl flex-shrink-0"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h4 className="font-semibold text-sm sm:text-base text-[#2D3436] mb-2 sm:mb-3">Health Benefit:</h4>
                  <p className="text-xs sm:text-base text-gray-600 leading-relaxed">
                    {selectedMealForModal.health_benefit}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm sm:text-base text-[#2D3436] mb-2 sm:mb-3">Nutrition Information:</h4>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="bg-orange-50 rounded-lg p-2 sm:p-4">
                      <span className="font-medium text-orange-700 text-xs sm:text-base">Calories:</span>
                      <span className="ml-1 sm:ml-2 text-orange-600 font-bold text-sm sm:text-lg">{selectedMealForModal.calories}</span>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2 sm:p-4">
                      <span className="font-medium text-blue-700 text-xs sm:text-base">Protein:</span>
                      <span className="ml-1 sm:ml-2 text-blue-600 font-bold text-sm sm:text-lg">{selectedMealForModal.protein}g</span>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2 sm:p-4">
                      <span className="font-medium text-green-700 text-xs sm:text-base">Carbs:</span>
                      <span className="ml-1 sm:ml-2 text-green-600 font-bold text-sm sm:text-lg">{selectedMealForModal.carbs}g</span>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-2 sm:p-4">
                      <span className="font-medium text-purple-700 text-xs sm:text-base">Fat:</span>
                      <span className="ml-1 sm:ml-2 text-purple-600 font-bold text-sm sm:text-lg">{selectedMealForModal.fat}g</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm sm:text-base text-[#2D3436] mb-2 sm:mb-3">Ingredients Used:</h4>
                  <ul className="space-y-1 sm:space-y-2">
                    {selectedMealForModal.ingredients_used.map((ingredient, idx) => (
                      <li key={idx} className="flex items-center text-xs sm:text-base text-gray-600">
                        <span className="w-2 h-2 bg-orange-400 rounded-full mr-2 sm:mr-3 flex-shrink-0"></span>
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 sm:pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowMealModal(false)
                      handleHealthMealInstructions(selectedMealForModal)
                    }}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white border-none rounded-lg sm:rounded-xl py-2.5 sm:py-3 px-4 text-sm sm:text-base font-semibold transition-all duration-300 hover:from-orange-600 hover:to-red-600 hover:translate-y-[-2px] hover:shadow-lg"
                  >
                    Get Cooking Instructions
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIResponsePage