"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import "../styles/ai-response.css"

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

const AIResponsePage: React.FC = () => {
  const [inputType, setInputType] = useState<"image" | "ingredient_list">("image")
  const [ingredientList, setIngredientList] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [analysisId, setAnalysisId] = useState("")
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  useEffect(() => {
    // Initialize Google Analytics
    const script1 = document.createElement("script")
    script1.async = true
    script1.src = "https://www.googletagmanager.com/gtag/js?id=G-TPT4ET0Y2Q"
    document.head.appendChild(script1)

    const script2 = document.createElement("script")
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-TPT4ET0Y2Q');
    `
    document.head.appendChild(script2)

    return () => {
      document.head.removeChild(script1)
      document.head.removeChild(script2)
    }
  }, [])

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

  const uploadData = async () => {
    if (inputType === "ingredient_list" && !ingredientList.trim()) {
      alert("Please enter ingredients.")
      return
    }

    if (inputType === "image" && !selectedImage) {
      alert("Please select an image file.")
      return
    }

    setIsLoading(true)
    setResults(null)

    const formData = new FormData()
    formData.append("image_or_ingredient_list", inputType)

    if (inputType === "ingredient_list") {
      formData.append("ingredient_list", ingredientList)
    } else {
      formData.append("image", selectedImage!)
    }

    try {
      const response = await fetch("https://ai-utu2.onrender.com/process", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        setResults({ error: data.error })
      } else {
        setAnalysisId(data.analysis_id)
        setResults(data)
      }
    } catch (error) {
      console.error("Error:", error)
      setResults({ error: "An error occurred. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = async (suggestion: string) => {
    setIsLoading(true)

    const formData = new FormData()
    formData.append("food_analysis_id", analysisId)
    formData.append("food_choice_index", suggestion)

    try {
      const response = await fetch("https://ai-utu2.onrender.com/instructions", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      setResults((prev) => ({
        ...prev,
        instructions: data.instructions,
        selectedSuggestion: suggestion,
      }))

      fetchResources(suggestion)
    } catch (error) {
      console.error("Error fetching instructions:", error)
      alert("Failed to fetch instructions. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchResources = async (suggestion: string) => {
    const formData = new FormData()
    formData.append("food_choice_index", suggestion)

    try {
      const response = await fetch("https://ai-utu2.onrender.com/resources", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      setResults((prev) => ({
        ...prev,
        resources: data,
      }))

      setTimeout(() => {
        if (!sessionStorage.getItem("feedbackShown")) {
          setShowFeedbackModal(true)
        }
      }, 20000)
    } catch (error) {
      console.error("Error fetching resources:", error)
    }
  }

  const getYouTubeVideoId = (url: string) => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2] && match[2].length === 11 ? match[2] : null
  }

  const submitFeedback = (feedbackType: string) => {
    setShowFeedbackModal(false)
    sessionStorage.setItem("feedbackShown", "true")
  }

  return (
    <div className="min-h-screen detection-container">
      {/* Switch Navigation */}
      <div className="switch-nav p-4">
        <div className="container mx-auto flex justify-center gap-4">
          <button className="px-6 py-2 switch-button-active rounded-full font-semibold">Detect Ingredients</button>
          <Link
            to="/detect-food"
            className="px-6 py-2 switch-button-inactive rounded-full font-semibold transition-colors"
          >
            Detect Food
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <Link to="/" className="text-red-500 hover:text-red-600 transition-colors">
              ← Home
            </Link>
            <button className="text-red-500 hover:text-red-600 transition-colors">Sign Out</button>
          </div>

          <h1 className="text-4xl font-bold text-center mb-8 gradient-text">Ingredient Detection</h1>

          {/* Input Type Selection */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-800 mb-4">How would you like to start?</label>
            <select
              value={inputType}
              onChange={(e) => setInputType(e.target.value as "image" | "ingredient_list")}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none text-lg"
            >
              <option value="image">Snap or Upload Ingredient Image</option>
              <option value="ingredient_list">List Your Ingredients</option>
            </select>
          </div>

          {/* Input Section */}
          {inputType === "image" ? (
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-800 mb-4">Share Your Food Image</label>
              <div className="upload-area p-8 rounded-xl">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none"
                />
              </div>
              {imagePreview && (
                <div className="mt-4 flex justify-center">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Image Preview"
                    className="image-preview w-96 h-72 object-cover"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-800 mb-4">What ingredients do you have?</label>
              <input
                type="text"
                value={ingredientList}
                onChange={(e) => setIngredientList(e.target.value)}
                placeholder="e.g., chicken, tomatoes, basil, olive oil"
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none text-lg"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={uploadData}
            disabled={isLoading}
            className="submit-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full loading-spinner mr-3"></div>
                Processing...
              </div>
            ) : (
              "Discover Recipes"
            )}
          </button>

          {/* Results Section */}
          {results && (
            <div className="mt-12 space-y-8">
              {results.error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">{results.error}</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Detected Ingredients */}
                    <div className="results-card rounded-xl p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-red-200 pb-2">
                        AI Detected Ingredient
                      </h3>
                      <ol className="ingredients-list space-y-2 text-gray-700">
                        {results.response?.map((item: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="font-semibold text-red-500 mr-2">{index + 1}.</span>
                            {item.trim()}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Recipe Suggestions */}
                    <div className="results-card rounded-xl p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-red-200 pb-2">
                        AI Recipe Suggestions
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {results.food_suggestions?.map((suggestion: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="suggestion-button px-4 py-2 rounded-xl font-semibold"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Cooking Instructions */}
                  {results.instructions && (
                    <div className="results-card rounded-xl p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-red-200 pb-2">
                        Cooking Instructions
                      </h3>
                      <div
                        className="instructions-content text-gray-700"
                        dangerouslySetInnerHTML={{
                          __html: results.instructions
                            .replace(/\*\*(.*?)\*\*/g, "<br><strong>$1</strong><br>")
                            .replace(/\*\s*(.*?)\s*\*/g, "<p>$1</p>")
                            .replace(/(\d+\.)/g, "<br>$1"),
                        }}
                      />
                    </div>
                  )}

                  {/* Resources */}
                  {results.resources && (
                    <div className="resources-section resources-grid">
                      {/* YouTube Resources */}
                      <div className="resource-section">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-red-200 pb-2">
                          YouTube Resources
                        </h3>
                        <h4 className="font-semibold text-gray-700 mb-4">Video Tutorials</h4>
                        <div className="space-y-4">
                          {results.resources.YoutubeSearch?.length > 0 ? (
                            results.resources.YoutubeSearch.map((item: any, index: number) => {
                              const videoId = getYouTubeVideoId(item.link)
                              return videoId ? (
                                <div key={index} className="youtube-embed relative pb-56 h-0 overflow-hidden">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title={item.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="absolute top-0 left-0 w-full h-full"
                                  />
                                </div>
                              ) : (
                                <div key={index} className="bg-white p-4 rounded-lg shadow">
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="resource-link text-red-500 hover:text-red-600 font-semibold"
                                  >
                                    {item.title}
                                  </a>
                                </div>
                              )
                            })
                          ) : (
                            <p className="text-gray-500">No video tutorials available.</p>
                          )}
                        </div>
                      </div>

                      {/* Google Resources */}
                      <div className="resource-section">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-red-200 pb-2">
                          Google Resources
                        </h3>
                        <h4 className="font-semibold text-gray-700 mb-4">Recommended Articles</h4>
                        <div className="space-y-4">
                          {results.resources.GoogleSearch?.length > 0 ? (
                            results.resources.GoogleSearch.map((item: any, index: number) => (
                              <div key={index} className="bg-white p-4 rounded-lg shadow">
                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="resource-link text-red-500 hover:text-red-600 font-semibold block mb-2"
                                >
                                  {item.title}
                                </a>
                                <p className="text-gray-600 text-sm">{item.description}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500">No articles available.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Share Button */}
                  {results.instructions && (
                    <div className="text-center">
                      <button className="share-button text-white px-8 py-3 rounded-xl font-semibold">
                        📤 Share This Recipe
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="feedback-modal">
          <div className="feedback-content">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Enjoying the Recipe?</h3>
              <button onClick={() => setShowFeedbackModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <p className="text-gray-600 mb-6">We'd love to hear your feedback to make our app even better!</p>

            <div className="space-y-4">
              <button onClick={() => submitFeedback("yes")} className="feedback-button feedback-button-primary">
                Yes, I loved it!
              </button>
              <button onClick={() => submitFeedback("later")} className="feedback-button feedback-button-secondary">
                Not now, maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIResponsePage
