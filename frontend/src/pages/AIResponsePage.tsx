"use client"

import type { FC } from "react"
import React, { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Upload, X, Check, AlertTriangle, ChevronDown } from "lucide-react"
import "@/styles/ai-response.css"
import { useAuth } from "@/lib/utils"
import { APP_CONFIG } from "@/lib/config"
import LoadingSpinner from "@/components/LoadingSpinner"
import { useSicknessSettings } from "@/hooks/useSicknessSettings"
import Swal from 'sweetalert2'
import { api } from "@/lib/api"
import CookingTutorialModal from "@/components/CookingTutorialModal"

interface HealthMeal {
  calories: number
  carbs: number
  fat: number
  fiber: number
  food_suggestions: string[]
  health_benefit: string
  ingredients_used: string[]
  protein: number
  image?: string
}

interface DetectedIngredient {
  name: string
  healthInfo: string
  isWarning: boolean
}

const AIResponsePage: FC = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showIngredientModal, setShowIngredientModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [ingredientList, setIngredientList] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [detectedIngredients, setDetectedIngredients] = useState<DetectedIngredient[]>([])
  const [healthMeals, setHealthMeals] = useState<HealthMeal[]>([])
  const [showResults, setShowResults] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showCookingModal, setShowCookingModal] = useState(false)
  const [selectedMealName, setSelectedMealName] = useState("")
  const [selectedMealIngredients, setSelectedMealIngredients] = useState<string[]>([])
  
  const { user, token, isAuthenticated, loading } = useAuth()
  const { settings: sicknessSettings, isHealthProfileComplete } = useSicknessSettings()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  const handleUploadClick = () => {
    setShowUploadModal(true)
  }

  const handleListIngredientsClick = () => {
    setShowIngredientModal(true)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleDetect = async (inputType: "image" | "ingredient_list" = "image") => {
    if (inputType === "image" && !selectedImage) {
      Swal.fire({
        icon: 'warning',
        title: 'No Image Selected',
        text: 'Please upload or capture an image first.',
        confirmButtonColor: '#1A76E3'
      })
      return
    }

    if (inputType === "ingredient_list" && !ingredientList.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'No Ingredients',
        text: 'Please enter your ingredients.',
        confirmButtonColor: '#1A76E3'
      })
      return
    }

    if (!isHealthProfileComplete()) {
      Swal.fire({
        icon: 'info',
        title: 'Health Profile Required',
        text: 'Please complete your health profile in Settings first.',
        confirmButtonColor: '#1A76E3'
      })
      return
    }

    setShowUploadModal(false)
    setShowIngredientModal(false)
    setIsLoading(true)
    setShowResults(false)

    const formData = new FormData()
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
    } else {
      formData.append("image_or_ingredient_list", "ingredient_list")
      formData.append("ingredient_list", ingredientList)
    }

    try {
      const response = await fetch(`${APP_CONFIG.api.ai_api_url}/generate_meals_from_ingredients`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to detect ingredients")
      }

      const data = await response.json()
      console.log("Detection response:", data)

      if (data.error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.error,
          confirmButtonColor: '#1A76E3'
        })
        return
      }

      // Parse detected ingredients with health info
      const mainIngredients = data.main_ingredients || ""
      const ingredientsList = mainIngredients.split(', ').filter(Boolean)
      
      // Create ingredient objects with mock health info based on sickness type
      const parsedIngredients: DetectedIngredient[] = ingredientsList.map((name: string) => {
        // Simple health assessment based on ingredient and condition
        const isHighRisk = checkIngredientRisk(name, sicknessSettings.sicknessType || "")
        return {
          name,
          healthInfo: isHighRisk 
            ? `May affect ${sicknessSettings.sicknessType}` 
            : `Good for ${sicknessSettings.sicknessType} management`,
          isWarning: isHighRisk
        }
      })

      setDetectedIngredients(parsedIngredients)

      // Process meal options with placeholder images
      const mealsWithImages = (data.meal_options || []).map((meal: HealthMeal, index: number) => ({
        ...meal,
        image: getMealImage(meal.food_suggestions?.[0] || "meal", index)
      }))

      setHealthMeals(mealsWithImages)
      setShowResults(true)
    } catch (error) {
      console.error("Error detecting ingredients:", error)
      Swal.fire({
        icon: 'error',
        title: 'Detection Failed',
        text: 'Failed to detect ingredients. Please try again.',
        confirmButtonColor: '#1A76E3'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const checkIngredientRisk = (ingredient: string, condition: string): boolean => {
    const lowerIngredient = ingredient.toLowerCase()
    const lowerCondition = condition.toLowerCase()
    
    // High cholesterol risks
    if (lowerCondition.includes('cholesterol')) {
      return ['butter', 'cheese', 'bacon', 'sausage', 'fatty', 'fried'].some(r => lowerIngredient.includes(r))
    }
    // Diabetes risks
    if (lowerCondition.includes('diabetes') || lowerCondition.includes('sugar')) {
      return ['sugar', 'candy', 'sweet', 'syrup', 'honey'].some(r => lowerIngredient.includes(r))
    }
    // Heart disease risks
    if (lowerCondition.includes('heart')) {
      return ['salt', 'sodium', 'fried', 'processed'].some(r => lowerIngredient.includes(r))
    }
    return false
  }

  const getMealImage = (mealName: string, index: number): string => {
    // Use Unsplash food images as placeholders
    const foodImages = [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1482049016gy215f-d4b5923e8331?w=400&h=300&fit=crop',
    ]
    return foodImages[index % foodImages.length]
  }

  const handleViewMealDetails = (meal: HealthMeal) => {
    setSelectedMealName(meal.food_suggestions?.[0] || "Health Meal")
    setSelectedMealIngredients(meal.ingredients_used || [])
    setShowCookingModal(true)
  }

  const handleNewDetection = () => {
    setShowResults(false)
    setSelectedImage(null)
    setImagePreview(null)
    setIngredientList("")
    setDetectedIngredients([])
    setHealthMeals([])
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header 
        className="px-8 h-[105px] flex items-center border-b"
        style={{ 
          backgroundColor: '#F9FBFE',
          borderColor: '#F6FAFE',
          boxShadow: '0px 2px 2px rgba(227, 227, 227, 0.25)'
        }}
      >
        <div className="flex items-center justify-between w-full">
          <h1 className="text-[32px] font-medium text-[#2A2A2A] tracking-[0.03em] leading-[130%]" style={{ fontFamily: "'Work Sans', sans-serif" }}>
            Ingredients Detector
          </h1>
          
          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center h-[56px] gap-3 px-5 rounded-[18px] border border-[#E7E7E7] bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 font-semibold text-sm border border-blue-100">
                {(user?.displayName || user?.email?.split('@')[0] || 'U').substring(0, 2).toUpperCase()}
              </div>
              <span className="text-[16px] font-medium text-gray-600 hidden sm:block">
                {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </span>
              <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showProfileDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowProfileDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-[15px] shadow-lg border border-gray-200 py-3 z-50">
                  <a href="/settings" className="block px-5 py-2.5 text-[15px] text-gray-700 hover:bg-gray-50">Settings</a>
                  <a href="/history" className="block px-5 py-2.5 text-[15px] text-gray-700 hover:bg-gray-50">History</a>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-6"></div>
            <p className="text-xl text-gray-600 font-medium">Detecting Ingredients.....</p>
          </div>
        )}

        {/* Initial State - Choose Detection Method */}
        {!isLoading && !showResults && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-2">
              Choose how you want to detect
            </h2>
            <p className="text-center text-gray-500 mb-10">your ingredients.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload Image Card */}
              <button
                onClick={handleUploadClick}
                className="bg-white rounded-2xl border border-gray-200 p-10 hover:border-blue-300 hover:shadow-lg transition-all duration-300 text-center group"
              >
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Upload className="w-10 h-10 text-blue-500 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload image</h3>
                <p className="text-gray-500 text-sm">Choose an Existing photo<br/>from your device</p>
              </button>

              {/* List Ingredients Card */}
              <button
                onClick={handleListIngredientsClick}
                className="bg-white rounded-2xl border border-gray-200 p-10 hover:border-blue-300 hover:shadow-lg transition-all duration-300 text-center group"
              >
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">List Ingredients</h3>
                <p className="text-gray-500 text-sm">Type your ingredients<br/>manually</p>
              </button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Results State */}
        {!isLoading && showResults && (
          <div>
            {/* Header with Detect Button */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-gray-800">Detected Ingredients</h2>
              <button
                onClick={handleNewDetection}
                className="px-6 py-3 bg-[#1A76E3] text-white rounded-[15px] font-semibold hover:bg-blue-600 transition-colors"
              >
                Detect Ingredient
              </button>
            </div>

            {/* Detected Ingredients Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
              {detectedIngredients.map((ingredient, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    ingredient.isWarning ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {ingredient.isWarning ? (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    ) : (
                      <Check className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{ingredient.name}</p>
                    <p className={`text-xs ${ingredient.isWarning ? 'text-red-500' : 'text-blue-500'}`}>
                      {ingredient.healthInfo}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Suggested Meals Section */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                Suggested Meals ({healthMeals.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {healthMeals.map((meal, index) => (
                  <div 
                    key={index} 
                    className="bg-white rounded-[20px] border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                  >
                    {/* Meal Image */}
                    <div className="relative h-[180px] overflow-hidden">
                      <img 
                        src={meal.image} 
                        alt={meal.food_suggestions?.[0] || "Meal"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'
                        }}
                      />
                      {/* Calorie Badge */}
                      <div className="absolute bottom-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        🔥 {meal.calories}kcal
                      </div>
                    </div>

                    {/* Meal Info */}
                    <div className="p-5">
                      <h4 className="font-semibold text-gray-800 text-lg mb-3 line-clamp-2">
                        {meal.food_suggestions?.[0] || "Health Meal"}
                      </h4>

                      {/* Nutrition Info */}
                      <div className="flex gap-3 mb-4">
                        <div className="flex-1 bg-[#FEF5EF] border border-[#FDE8DC] rounded-[10px] p-3 text-center">
                          <span className="text-lg">🍖</span>
                          <p className="font-bold text-gray-800">{meal.protein}g</p>
                          <p className="text-xs text-gray-500">Protein</p>
                        </div>
                        <div className="flex-1 bg-[#FEF5EF] border border-[#FDE8DC] rounded-[10px] p-3 text-center">
                          <span className="text-lg">🌾</span>
                          <p className="font-bold text-gray-800">{meal.carbs}g</p>
                          <p className="text-xs text-gray-500">Carbs</p>
                        </div>
                        <div className="flex-1 bg-[#FEF5EF] border border-[#FDE8DC] rounded-[10px] p-3 text-center">
                          <span className="text-lg">💧</span>
                          <p className="font-bold text-gray-800">{meal.fat}g</p>
                          <p className="text-xs text-gray-500">Fats</p>
                        </div>
                      </div>

                      {/* Health Benefit */}
                      <div className="flex items-start gap-2 mb-4">
                        <span className="text-green-500">✓</span>
                        <p className="text-sm text-orange-500 line-clamp-2">{meal.health_benefit}</p>
                      </div>

                      {/* View Details Button */}
                      <button
                        onClick={() => handleViewMealDetails(meal)}
                        className="w-full py-3 border-2 border-[#1A76E3] text-[#1A76E3] rounded-xl font-semibold hover:bg-[#1A76E3] hover:text-white transition-all duration-200"
                      >
                        View Meal Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Upload Ingredient Image</h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 transition-colors mb-6"
            >
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-[200px] mx-auto rounded-lg object-contain"
                />
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Click to upload</p>
                  <p className="text-gray-400 text-sm mt-1">PNG, JPG, JPEG up to 10MB</p>
                </>
              )}
            </div>

            {/* Detect Button */}
            <button
              onClick={() => handleDetect("image")}
              disabled={!selectedImage}
              className="w-full py-4 bg-[#1A76E3] text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Detect
            </button>
          </div>
        </div>
      )}

      {/* Ingredient List Modal */}
      {showIngredientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">List Your Ingredients</h3>
              <button 
                onClick={() => setShowIngredientModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Ingredient Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What ingredients do you have?
              </label>
              <textarea
                value={ingredientList}
                onChange={(e) => setIngredientList(e.target.value)}
                placeholder="e.g., chicken, tomatoes, basil, olive oil, garlic..."
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-700"
              />
              <p className="text-xs text-gray-400 mt-2">
                Separate ingredients with commas
              </p>
            </div>

            {/* Detect Button */}
            <button
              onClick={() => handleDetect("ingredient_list")}
              disabled={!ingredientList.trim()}
              className="w-full py-4 bg-[#1A76E3] text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Detect
            </button>
          </div>
        </div>
      )}

      {/* Cooking Tutorial Modal */}
      <CookingTutorialModal
        isOpen={showCookingModal}
        onClose={() => setShowCookingModal(false)}
        recipeName={selectedMealName}
        ingredients={selectedMealIngredients}
      />
    </div>
  )
}

export default AIResponsePage
