"use client"

import type { FC } from 'react'
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Clock,
  Users,
  ChefHat,
  Heart,
  Share2,
  Bookmark,
  Plus,
  Minus,
  Timer,
  Utensils,
  Loader2,
} from "lucide-react"

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
  const [ingredients, setIngredients] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [servings, setServings] = useState(4)

  useEffect(() => {
    // Get data from navigation state
    const state = location.state as any
    if (state?.ingredients) {
      setIngredients(state.ingredients)
      if (state.selectedRecipe) {
        setSelectedRecipe(state.selectedRecipe)
      } else {
        generateRecipes(state.ingredients)
      }
    }
  }, [location.state])

  const generateRecipes = async (ingredientList: string) => {
    setIsGenerating(true)
    try {
      // TODO: Integrate real AI recipe generation here
      const mockRecipes: Recipe[] = [] // Mock empty array for now
      setRecipes(mockRecipes)
    } catch (error) {
      console.error('Failed to generate recipes:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const adjustServings = (newServings: number) => {
    if (newServings < 1) return
    setServings(newServings)
  }

  const getAdjustedAmount = (amount: string, originalServings: number) => {
    const ratio = servings / originalServings
    const numericAmount = Number.parseFloat(amount)

    if (isNaN(numericAmount)) return amount

    const adjusted = numericAmount * ratio
    return adjusted % 1 === 0 ? adjusted.toString() : adjusted.toFixed(1)
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
              <h1 className="text-xl font-bold text-gray-900">AI Recipe Generator</h1>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ingredients Input */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Utensils className="h-5 w-5" />
                  <span>Your Ingredients</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter your ingredients (e.g., tomatoes, onions, garlic, pasta...)"
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <Button
                  onClick={() => generateRecipes(ingredients)}
                  disabled={isGenerating || !ingredients.trim()}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Recipes...
                    </>
                  ) : (
                    <>
                      <ChefHat className="h-4 w-4 mr-2" />
                      Generate Recipes
                    </>
                  )}
                </Button>

                {recipes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Generated Recipes:</h4>
                    {recipes.map((recipe, index) => (
                      <Button
                        key={index}
                        variant={selectedRecipe?.name === recipe.name ? "default" : "outline"}
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => setSelectedRecipe(recipe)}
                      >
                        <div>
                          <div className="font-medium">{recipe.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {recipe.cookTime} • {recipe.difficulty}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recipe Display */}
          <div className="lg:col-span-2">
            {selectedRecipe ? (
              <div className="space-y-6">
                {/* Recipe Header */}
                <Card>
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-gray-900">{selectedRecipe.name}</h1>
                        <p className="text-lg text-gray-600">{selectedRecipe.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Bookmark className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Clock className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                        <div className="text-sm text-gray-600">Prep Time</div>
                        <div className="font-semibold">{selectedRecipe.prepTime}</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Timer className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                        <div className="text-sm text-gray-600">Cook Time</div>
                        <div className="font-semibold">{selectedRecipe.cookTime}</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Users className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                        <div className="text-sm text-gray-600">Servings</div>
                        <div className="font-semibold">{selectedRecipe.servings}</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <ChefHat className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                        <div className="text-sm text-gray-600">Difficulty</div>
                        <div className="font-semibold">{selectedRecipe.difficulty}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <Badge variant="secondary" className="text-sm">
                        {selectedRecipe.calories} calories per serving
                      </Badge>
                      {selectedRecipe.nutrition && (
                        <>
                          <Badge variant="outline">Protein: {selectedRecipe.nutrition.protein}g</Badge>
                          <Badge variant="outline">Carbs: {selectedRecipe.nutrition.carbs}g</Badge>
                          <Badge variant="outline">Fat: {selectedRecipe.nutrition.fat}g</Badge>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recipe Content */}
                <Tabs defaultValue="ingredients" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                    <TabsTrigger value="instructions">Instructions</TabsTrigger>
                    <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                  </TabsList>

                  <TabsContent value="ingredients">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Ingredients</CardTitle>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Servings:</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => adjustServings(servings - 1)}
                              disabled={servings <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold">{servings}</span>
                            <Button variant="outline" size="sm" onClick={() => adjustServings(servings + 1)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedRecipe.ingredients.map((ingredient, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                            >
                              <span className="text-gray-900">{ingredient.name}</span>
                              <span className="text-gray-600 font-medium">
                                {getAdjustedAmount(ingredient.amount, selectedRecipe.servings)} {ingredient.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="instructions">
                    <Card>
                      <CardHeader>
                        <CardTitle>Instructions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedRecipe.instructions.map((instruction, index) => (
                            <div key={index} className="flex space-x-4">
                              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                                {index + 1}
                              </div>
                              <p className="text-gray-700 leading-relaxed pt-1">{instruction}</p>
                            </div>
                          ))}
                        </div>

                        {selectedRecipe.tips && (
                          <div className="mt-8 p-4 bg-orange-50 rounded-lg">
                            <h4 className="font-semibold text-orange-900 mb-2">Chef's Tips:</h4>
                            <ul className="space-y-1 text-orange-800">
                              {selectedRecipe.tips.map((tip, index) => (
                                <li key={index} className="text-sm">
                                  • {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="nutrition">
                    <Card>
                      <CardHeader>
                        <CardTitle>Nutrition Information</CardTitle>
                        <p className="text-sm text-gray-600">Per serving ({servings} servings total)</p>
                      </CardHeader>
                      <CardContent>
                        {selectedRecipe.nutrition ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                              <div className="text-2xl font-bold text-gray-900">{selectedRecipe.calories}</div>
                              <div className="text-sm text-gray-600">Calories</div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                              <div className="text-2xl font-bold text-gray-900">
                                {selectedRecipe.nutrition.protein}g
                              </div>
                              <div className="text-sm text-gray-600">Protein</div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                              <div className="text-2xl font-bold text-gray-900">{selectedRecipe.nutrition.carbs}g</div>
                              <div className="text-sm text-gray-600">Carbs</div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                              <div className="text-2xl font-bold text-gray-900">{selectedRecipe.nutrition.fat}g</div>
                              <div className="text-sm text-gray-600">Fat</div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-600">Nutrition information not available for this recipe.</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Card className="h-96 flex items-center justify-center">
                <CardContent className="text-center space-y-4">
                  <ChefHat className="h-16 w-16 mx-auto text-gray-400" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Recipe Selected</h3>
                    <p className="text-gray-600">Enter your ingredients and generate recipes to get started!</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIResponsePage
