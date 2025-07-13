"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Camera, Upload, ArrowLeft, Loader2, Utensils, Clock, Users } from "lucide-react"

interface DetectedFood {
  name: string
  confidence: number
  nutrition?: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

interface Recipe {
  name: string
  description: string
  cookTime: string
  servings: number
  difficulty: string
  ingredients: string[]
  instructions: string[]
  image?: string
}

const DetectFoodPage = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [detectedFoods, setDetectedFoods] = useState<DetectedFood[]>([])
  const [suggestedRecipes, setSuggestedRecipes] = useState<Recipe[]>([])
  const [additionalIngredients, setAdditionalIngredients] = useState("")
  const [showResults, setShowResults] = useState(false)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setShowResults(false)
        setDetectedFoods([])
        setSuggestedRecipes([])
      }
      reader.readAsDataURL(file)
    }
  }

  const analyzeImage = async () => {
    if (!selectedImage) return

    setIsAnalyzing(true)
    // TODO: Integrate real API call for food detection here
    // Example:
    // const response = await fetch('/api/food-detection', { ... })
    // const { detectedFoods, suggestedRecipes } = await response.json()
    // setDetectedFoods(detectedFoods)
    // setSuggestedRecipes(suggestedRecipes)
    // setIsAnalyzing(false)
    // setShowResults(true)
  }

  const generateMoreRecipes = () => {
    const ingredients = detectedFoods.map((food) => food.name).join(", ")
    const additional = additionalIngredients.trim()
    const allIngredients = additional ? `${ingredients}, ${additional}` : ingredients

    navigate("/ai-response", {
      state: {
        ingredients: allIngredients,
        detectedFoods: detectedFoods,
        fromDetection: true,
      },
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-bold text-gray-900">Food Detection</h1>
            </div>
            <div className="flex items-center space-x-2">
              <img
                src="/MealLeansBeta/landingpage-main/assets/images/logo.png"
                alt="MealLeans"
                className="h-8 w-auto"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Detect Food from Your Image</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload a photo of your ingredients and let our AI identify them to suggest delicious recipes
          </p>
        </div>

        {/* Image Upload Card */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="text-center">
              {!selectedImage ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-orange-400 transition-colors">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 bg-orange-100 rounded-full">
                      <Camera className="h-8 w-8 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Your Food Image</h3>
                      <p className="text-gray-600 mb-4">Take a photo or upload an image of your ingredients</p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File
                        </Button>
                        <Button variant="outline">
                          <Camera className="h-4 w-4 mr-2" />
                          Take Photo
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative inline-block">
                    <img
                      src={selectedImage || "/placeholder.svg"}
                      alt="Selected food"
                      className="max-w-full max-h-96 rounded-lg shadow-lg"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={analyzeImage}
                      disabled={isAnalyzing}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Utensils className="h-4 w-4 mr-2" />
                          Detect Food
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Different Image
                    </Button>
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {showResults && (
          <div className="space-y-8">
            {/* Detected Foods */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Detected Ingredients</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {detectedFoods.map((food, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{food.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {food.confidence}%
                        </Badge>
                      </div>
                      {food.nutrition && (
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Calories: {food.nutrition.calories}</div>
                          <div>Protein: {food.nutrition.protein}g</div>
                          <div>Carbs: {food.nutrition.carbs}g</div>
                          <div>Fat: {food.nutrition.fat}g</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Additional Ingredients */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Add More Ingredients (Optional)</h3>
                <Textarea
                  placeholder="Add any additional ingredients you have (e.g., rice, chicken, spices...)"
                  value={additionalIngredients}
                  onChange={(e) => setAdditionalIngredients(e.target.value)}
                  className="mb-4"
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Suggested Recipes */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Suggested Recipes</h3>
                <Button
                  onClick={generateMoreRecipes}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  Get More Recipes
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {suggestedRecipes.map((recipe, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-6">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{recipe.name}</h4>
                      <p className="text-gray-600 mb-4">{recipe.description}</p>

                      <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {recipe.cookTime}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {recipe.servings} servings
                        </div>
                        <Badge variant="outline">{recipe.difficulty}</Badge>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h5 className="font-semibold text-gray-900 mb-2">Ingredients:</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {recipe.ingredients.slice(0, 4).map((ingredient, i) => (
                              <li key={i}>• {ingredient}</li>
                            ))}
                            {recipe.ingredients.length > 4 && (
                              <li className="text-orange-600">+ {recipe.ingredients.length - 4} more...</li>
                            )}
                          </ul>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full bg-transparent"
                          onClick={() =>
                            navigate("/ai-response", {
                              state: {
                                selectedRecipe: recipe,
                                ingredients: detectedFoods.map((f) => f.name).join(", "),
                                fromDetection: true,
                              },
                            })
                          }
                        >
                          View Full Recipe
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DetectFoodPage
