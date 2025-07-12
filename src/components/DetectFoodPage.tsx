"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Link } from "react-router-dom"
import "../styles/detect-food.css"

interface FoodItem {
  name: string
  confidence: number
  description: string
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  category: string
}

const DetectFoodPage: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [foodResults, setFoodResults] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setError(null)
      }
      reader.readAsDataURL(file)
    } else {
      setError("Please select a valid image file.")
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)

    const file = event.dataTransfer.files[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)
  }

  const analyzeFood = async () => {
    if (!selectedImage) {
      setError("Please select an image first.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Simulate API call to food detection service
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Mock results - in real app, this would come from your AI service
      const mockResults: FoodItem[] = [
        {
          name: "Margherita Pizza",
          confidence: 94,
          description: "Classic Italian pizza with tomato sauce, mozzarella cheese, and fresh basil leaves.",
          nutrition: {
            calories: 266,
            protein: 11,
            carbs: 33,
            fat: 10,
            fiber: 2,
          },
          category: "Italian Cuisine",
        },
        {
          name: "Fresh Basil",
          confidence: 87,
          description: "Fresh basil leaves used as a garnish, providing aromatic flavor and nutritional benefits.",
          nutrition: {
            calories: 1,
            protein: 0.1,
            carbs: 0.1,
            fat: 0,
            fiber: 0.1,
          },
          category: "Herbs",
        },
      ]

      setFoodResults(mockResults)

      // Track successful analysis
      if (window.gtag) {
        window.gtag("event", "food_analysis_complete", {
          event_category: "ai_detection",
          event_label: "success",
        })
      }
    } catch (err) {
      setError("Failed to analyze the image. Please try again.")
      console.error("Food analysis error:", err)
    } finally {
      setLoading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="detect-food-container">
      <div className="container mx-auto px-4">
        <Link to="/" className="back-button">
          ← Back to Home
        </Link>

        <div className="detect-header">
          <h1 className="detect-title">📸 Food Detection AI</h1>
          <p className="detect-subtitle">
            Upload a photo of any dish and our AI will identify it, providing detailed nutritional information and
            insights about your food.
          </p>
        </div>

        {/* Upload Section */}
        <div className="upload-section">
          <div
            className={`upload-area ${dragOver ? "dragover" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={triggerFileInput}
          >
            <div className="upload-icon">📷</div>
            <div className="upload-text">
              {selectedImage ? "Image selected! Click to change" : "Drop your food image here or click to browse"}
            </div>
            <div className="upload-subtext">Supports JPG, PNG, GIF up to 10MB</div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="file-input" />
          </div>

          {selectedImage && (
            <div className="image-preview">
              <img src={selectedImage || "/placeholder.svg"} alt="Selected food" className="preview-image" />
              <button onClick={analyzeFood} disabled={loading} className="analyze-button">
                {loading ? "Analyzing..." : "🔍 Analyze Food"}
              </button>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
        </div>

        {/* Results Section */}
        {foodResults.length > 0 && (
          <div className="results-section">
            <h2 className="results-title">🍽️ Detection Results</h2>
            <div className="space-y-6">
              {foodResults.map((food, index) => (
                <div key={index} className="food-item">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="food-name">{food.name}</h3>
                      <div className="food-confidence">Confidence: {food.confidence}%</div>
                      <div className="text-sm text-gray-500">Category: {food.category}</div>
                    </div>
                  </div>

                  <p className="food-description">{food.description}</p>

                  <div className="nutrition-info">
                    <div className="nutrition-title">Nutritional Information (per 100g):</div>
                    <div className="nutrition-grid">
                      <div className="nutrition-item">
                        <div className="nutrition-value">{food.nutrition.calories}</div>
                        <div className="nutrition-label">Calories</div>
                      </div>
                      <div className="nutrition-item">
                        <div className="nutrition-value">{food.nutrition.protein}g</div>
                        <div className="nutrition-label">Protein</div>
                      </div>
                      <div className="nutrition-item">
                        <div className="nutrition-value">{food.nutrition.carbs}g</div>
                        <div className="nutrition-label">Carbs</div>
                      </div>
                      <div className="nutrition-item">
                        <div className="nutrition-value">{food.nutrition.fat}g</div>
                        <div className="nutrition-label">Fat</div>
                      </div>
                      <div className="nutrition-item">
                        <div className="nutrition-value">{food.nutrition.fiber}g</div>
                        <div className="nutrition-label">Fiber</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="text-center mt-8 space-x-4">
          <Link to="/ai-response" className="cta-button bg-blue-500 hover:bg-blue-600">
            🥗 Try Ingredient Detection
          </Link>
          <Link to="/meal-planner" className="cta-button bg-purple-500 hover:bg-purple-600">
            📅 Plan Your Meals
          </Link>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p className="text-gray-600">Analyzing your food image...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default DetectFoodPage
