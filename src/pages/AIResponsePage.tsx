"use client"

import type { FC } from "react"
import { useState, useRef } from "react"
import { useNavigate, useLocation, Navigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Users, ChefHat, Bookmark, Timer, Utensils, Loader2, Upload, ArrowLeft } from "lucide-react"
import "@/styles/ai-response.css"
// Remove: import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/utils"
import LoadingSpinner from "@/components/LoadingSpinner"

interface Recipe {
  name: string
  description: string
  cookTime: string
  prepTime: string
  servings: number
  difficulty: string
  calories: number
  ingredients: Array<{
    name: string
    amount: string
    unit: string
  }>
  instructions: string[]
  tips?: string[]
  nutrition?: {
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
}

const AIResponsePage: FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentStep, setCurrentStep] = useState(1) // New state for multi-step form
  const [inputType, setInputType] = useState<"image" | "ingredient_list">("image")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [ingredientList, setIngredientList] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [instructions, setInstructions] = useState<string>("")
  const [resources, setResources] = useState<any>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [analysisId, setAnalysisId] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { token, isAuthenticated, loading } = useAuth()
  const [selectedSuggestion, setSelectedSuggestion] = useState<string>("");

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
              onClick={() => navigate('/login')}
              className="w-full py-3 text-lg font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg hover:from-red-600 hover:to-orange-600 transition-all duration-300"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Helper to get a valid token (backend only)
  const getAuthToken = async () => {
    const backendToken = localStorage.getItem('access_token')
    return backendToken
  }

  const handleDiscoverRecipes = async () => {
    setIsLoading(true)
    setDetectedIngredients([])
    setSuggestions([])
    setInstructions("")
    setResources(null)
    const formData = new FormData()
    if (inputType === "image" && selectedImage) {
      formData.append("image_or_ingredient_list", "image")
      formData.append("image", selectedImage)
    } else {
      formData.append("image_or_ingredient_list", "ingredient_list")
      formData.append("ingredient_list", ingredientList)
    }
    const response = await fetch("https://ai-utu2.onrender.com/process", {
      method: "POST",
      body: formData,
    })
    const data = await response.json()
    setIsLoading(false)
    if (data.error) return // handle error
    setAnalysisId(data.analysis_id)
    setDetectedIngredients(data.response || [])
    setSuggestions(data.food_suggestions || [])
    setCurrentStep(2) // Move to step 2 after initial detection
  }

  const handleSuggestionClick = async (suggestion: string) => {
    setIsLoading(true)
    setSelectedSuggestion(suggestion)
    // fetch instructions
    const formData = new FormData()
    formData.append("food_analysis_id", analysisId)
    formData.append("food_choice_index", suggestion)
    const instrRes = await fetch("https://ai-utu2.onrender.com/instructions", {
      method: "POST",
      body: formData,
    })
    const instrData = await instrRes.json()
    setInstructions(instrData.instructions || "")
    // fetch resources
    const resForm = new FormData()
    resForm.append("food_choice_index", suggestion)
    const resRes = await fetch("https://ai-utu2.onrender.com/resources", {
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
      await fetch("/api/food_detection/detection_history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
      });
    }
    setIsLoading(false)
    setCurrentStep(3) // Move to final step
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10 space-y-6">
        {/* Step 1: Input */}
        {currentStep === 1 && (
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-800">Ingredient Detection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="inputType" className="text-sm font-medium text-gray-700">
                  How would you like to start?
                </label>
                <select
                  id="inputType"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={inputType}
                  onChange={(e) => setInputType(e.target.value as "image" | "ingredient_list")}
                >
                  <option value="image">Snap or Upload Ingredient Image</option>
                  <option value="ingredient_list">List Your Ingredients</option>
                </select>
              </div>

              {inputType === "image" ? (
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl transition-all hover:border-red-400 hover:bg-red-50">
                  <label htmlFor="fileInput" className="cursor-pointer text-red-500 font-semibold flex items-center">
                    <Upload className="h-5 w-5 mr-2" /> Share Your Food Image
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="fileInput"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      setSelectedImage(file || null)
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = () => setImagePreview(reader.result as string)
                        reader.readAsDataURL(file)
                      } else {
                        setImagePreview(null)
                      }
                    }}
                  />
                  {imagePreview && (
                    <div className="mt-4 w-full flex justify-center">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Image Preview"
                        className="max-w-full h-48 object-cover rounded-lg shadow-md"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="ingredientTextInput" className="text-sm font-medium text-gray-700">
                    What ingredients do you have?
                  </label>
                  <Textarea
                    id="ingredientTextInput"
                    placeholder="e.g., chicken, tomatoes, basil, olive oil"
                    value={ingredientList || ""}
                    onChange={(e) => setIngredientList(e.target.value)}
                    className="min-h-[80px] shadow-sm focus-visible:ring-red-500"
                  />
                </div>
              )}

              <Button
                className="w-full py-3 text-lg font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg hover:from-red-600 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDiscoverRecipes}
                disabled={
                  isLoading ||
                  (inputType === "image" && !selectedImage) ||
                  (inputType === "ingredient_list" && !ingredientList.trim())
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Discovering...
                  </>
                ) : (
                  "Discover Recipes"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Detected Ingredients & Recipe Suggestions */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-lg border-none">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                    <Utensils className="h-5 w-5 mr-2 text-red-500" /> AI Detected Ingredients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    {detectedIngredients.map((item, i) => (
                      <li key={i} className="flex items-start">
                        <span className="mr-2 text-red-500 font-semibold">{i + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
              <Card className="shadow-lg border-none">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                    <ChefHat className="h-5 w-5 mr-2 text-red-500" /> AI Recipe Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        className="border-red-400 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 shadow-sm bg-transparent"
                        onClick={() => handleSuggestionClick(suggestion)}
                        disabled={isLoading}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setCurrentStep(1)} disabled={isLoading}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              {/* No "Next" button here, as selection leads to next step */}
            </div>
          </div>
        )}

        {/* Step 3: Instructions & Resources */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {instructions && (
              <Card className="shadow-lg border-none">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                    <Timer className="h-5 w-5 mr-2 text-red-500" /> Cooking Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: instructions }}
                  />
                </CardContent>
              </Card>
            )}

            {resources && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="shadow-lg border-none">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-red-500" /> Youtube Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {resources.YoutubeSearch && resources.YoutubeSearch.length > 0 ? (
                      resources.YoutubeSearch.map((item: any, idx: number) => {
                        const videoId = item.link.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/)
                        return videoId ? (
                          <div key={idx} className="relative w-full aspect-video rounded-lg overflow-hidden shadow-md">
                            <iframe
                              src={`https://www.youtube.com/embed/${videoId[1]}`}
                              title={item.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="absolute top-0 left-0 w-full h-full border-0"
                            />
                          </div>
                        ) : (
                          <a
                            key={idx}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors duration-200 shadow-sm"
                          >
                            <h3 className="text-base font-semibold text-red-600 hover:underline">{item.title}</h3>
                          </a>
                        )
                      })
                    ) : (
                      <p className="text-gray-500">No video tutorials available.</p>
                    )}
                  </CardContent>
                </Card>
                <Card className="shadow-lg border-none">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                      <Bookmark className="h-5 w-5 mr-2 text-red-500" /> Google Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {resources.GoogleSearch && resources.GoogleSearch.length > 0 ? (
                      resources.GoogleSearch.map((item: any, idx: number) => (
                        <a
                          key={idx}
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors duration-200 shadow-sm"
                        >
                          <h3 className="text-base font-semibold text-red-600 hover:underline">{item.title}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                        </a>
                      ))
                    ) : (
                      <p className="text-gray-500">No articles available.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setCurrentStep(2)} disabled={isLoading}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              {/* No "Next" button here, as this is the final step */}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default AIResponsePage
