"use client"

import type { FC } from "react"
import { useState, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Users, ChefHat, Bookmark, Timer, Utensils, Loader2, Upload, ArrowLeft } from "lucide-react"
import "@/styles/ai-response.css"
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
  const [loadingResources, setLoadingResources] = useState(false)
  const [showResults, setShowResults] = useState(false)
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
    setShowResults(false)

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
      const response = await fetch("https://ai-utu2.onrender.com/process", {
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
      setDetectedIngredients(data.response || [])
      setSuggestions(data.food_suggestions || [])
      setShowResults(true)
    } catch (error) {
      console.error("Error processing ingredients:", error)
      alert("Failed to process ingredients. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = async (suggestion: string) => {
    setIsLoading(true)
    setSelectedSuggestion(suggestion)
    setInstructions("")
    setResources(null)

    console.log('Starting to fetch instructions for:', suggestion)

    try {
      // 1. Get cooking instructions first
      const formData = new FormData()
      formData.append("food_analysis_id", analysisId)
      formData.append("food_choice_index", suggestion)

      console.log('Fetching instructions with analysisId:', analysisId)

      const instrRes = await fetch("https://ai-utu2.onrender.com/instructions", {
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
    } catch (error) {
      console.error('Error fetching content:', error);
      setInstructions('Failed to load instructions. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingResources(false);
    }
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
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white border-none rounded-2xl py-4 px-8 text-xl font-semibold transition-all duration-300 uppercase tracking-wider shadow-[0_4px_15px_rgba(255,107,107,0.3)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(255,107,107,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Discover Recipes
          </button>

          {/* Loading Spinner */}
          {isLoading && (
            <div className="flex justify-center mt-8">
              <div className="w-12 h-12 border-4 border-[rgba(255,107,107,0.3)] border-t-[#FF6B6B] rounded-full animate-spin"></div>
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
                    <ol className="pl-4 text-left">
                      {detectedIngredients.map((item, i) => (
                        <li key={i} className="mb-3 text-left">{item.trim()}</li>
                      ))}
                    </ol>
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
                          {resources.GoogleSearch.map((item: any, idx: number) => (
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

      <style jsx>{`
        @keyframes loading-slide {
          0% {
            left: -30%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  )
}

export default AIResponsePage
