"use client"

import type React from "react"
import { useState } from "react"
import { Camera, List, Upload, Utensils, ChefHat, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import WeeklyPlanner from "../components/WeeklyPlanner"
import RecipeCard from "../components/RecipeCard"
import MealTypeFilter from "../components/MealTypeFilter"
import LoadingSpinner from "../components/LoadingSpinner"
import CookingTutorialModal from "../components/CookingTutorialModal"

interface MealPlan {
  day: string
  breakfast: string
  lunch: string
  dinner: string
  snack: string
}

const Index = () => {
  const [inputType, setInputType] = useState<"image" | "ingredient_list">("ingredient_list")
  const [ingredientList, setIngredientList] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [mealPlan, setMealPlan] = useState<MealPlan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState("Monday")
  const [selectedMealType, setSelectedMealType] = useState("all")
  const [showInputModal, setShowInputModal] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null)
  const [showTutorialModal, setShowTutorialModal] = useState(false)
  const { toast } = useToast()

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (inputType === "ingredient_list" && !ingredientList.trim()) {
      toast({
        title: "Error",
        description: "Please enter your ingredients list",
        variant: "destructive",
      })
      return
    }

    if (inputType === "image" && !selectedImage) {
      toast({
        title: "Error",
        description: "Please select an image to upload",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("image_or_ingredient_list", inputType)

      if (inputType === "ingredient_list") {
        formData.append("ingredient_list", ingredientList)
      } else {
        formData.append("image", selectedImage!)
      }

      const response = await fetch("https://ai-utu2.onrender.com/smart_plan", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to generate meal plan")
      }

      const data = await response.json()
      setMealPlan(data.meal_plan)
      setShowInputModal(false)

      toast({
        title: "Success!",
        description: "Your 7-day meal plan has been generated",
      })
    } catch (error) {
      console.error("Error generating meal plan:", error)
      toast({
        title: "Error",
        description: "Failed to generate meal plan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecipeClick = (recipeName: string) => {
    setSelectedRecipe(recipeName)
    setShowTutorialModal(true)
  }

  const getRecipesForSelectedDay = () => {
    const dayPlan = mealPlan.find((plan) => plan.day === selectedDay)
    if (!dayPlan) return []

    const recipes = [
      { title: dayPlan.breakfast, type: "breakfast", time: "15 mins", rating: 5 },
      { title: dayPlan.lunch, type: "lunch", time: "25 mins", rating: 4 },
      { title: dayPlan.dinner, type: "dinner", time: "35 mins", rating: 5 },
    ]

    if (dayPlan.snack) {
      recipes.push({ title: dayPlan.snack, type: "snack", time: "5 mins", rating: 4 })
    }

    return selectedMealType === "all" ? recipes : recipes.filter((recipe) => recipe.type === selectedMealType)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🍓</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">The Ultimate Meal Planner</h1>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <span>🥑</span>a healthy outside starts from the inside
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowInputModal(true)}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Plan
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex gap-6 p-6">
        {/* Sidebar */}
        <div className="w-64 bg-white rounded-xl p-6 h-fit shadow-sm border border-gray-200">
          <WeeklyPlanner selectedDay={selectedDay} onDaySelect={setSelectedDay} />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {mealPlan.length > 0 ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Recipes</h2>
                <MealTypeFilter selectedType={selectedMealType} onTypeSelect={setSelectedMealType} />
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
            <Card className="p-12 text-center">
              <CardContent>
                <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Meal Plan Yet</h3>
                <p className="text-gray-600 mb-6">Create your first meal plan to get started with delicious recipes!</p>
                <Button
                  onClick={() => setShowInputModal(true)}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  Create Meal Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Input Modal */}
      {showInputModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Create Your Meal Plan</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setShowInputModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Toggle Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={() => setInputType("ingredient_list")}
                  variant={inputType === "ingredient_list" ? "default" : "outline"}
                  className={`flex-1 p-4 h-auto ${
                    inputType === "ingredient_list"
                      ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      : "border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                  }`}
                >
                  <div className="flex items-center">
                    <List className="w-5 h-5 mr-3" />
                    <div>
                      <div className="font-semibold">Type Ingredients</div>
                      <div className="text-sm opacity-90">Enter manually</div>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => setInputType("image")}
                  variant={inputType === "image" ? "default" : "outline"}
                  className={`flex-1 p-4 h-auto ${
                    inputType === "image"
                      ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      : "border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                  }`}
                >
                  <div className="flex items-center">
                    <Camera className="w-5 h-5 mr-3" />
                    <div>
                      <div className="font-semibold">Upload Image</div>
                      <div className="text-sm opacity-90">Take a photo</div>
                    </div>
                  </div>
                </Button>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {inputType === "ingredient_list" ? (
                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-3">List your ingredients</label>
                    <Textarea
                      value={ingredientList}
                      onChange={(e) => setIngredientList(e.target.value)}
                      placeholder="e.g., tomatoes, onions, beef, rice, bell peppers, garlic, olive oil..."
                      className="h-32 resize-none"
                      disabled={isLoading}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-3">
                      Upload an image of your ingredients
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-orange-500 transition-colors">
                      {imagePreview ? (
                        <div className="space-y-4">
                          <img
                            src={imagePreview || "/placeholder.svg"}
                            alt="Preview"
                            className="max-w-full h-48 object-cover mx-auto rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setSelectedImage(null)
                              setImagePreview(null)
                            }}
                          >
                            Choose different image
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Upload className="w-12 h-12 text-gray-300 mx-auto" />
                          <div>
                            <p className="text-gray-800 font-medium">Click to upload</p>
                            <p className="text-gray-500 text-sm">PNG, JPG, JPEG up to 10MB</p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                            id="file-upload"
                            disabled={isLoading}
                          />
                          <Button
                            asChild
                            variant="outline"
                            className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white bg-transparent"
                          >
                            <label htmlFor="file-upload" className="cursor-pointer">
                              Select Image
                            </label>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 text-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
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
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cooking Tutorial Modal */}
      <CookingTutorialModal
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
        recipeName={selectedRecipe || ""}
      />
    </div>
  )
}

export default Index
