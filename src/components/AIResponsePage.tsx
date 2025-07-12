"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import "../styles/ai-response.css"

interface Ingredient {
  name: string
  confidence: number
  category: string
}

interface Recipe {
  name: string
  description: string
  ingredients: string[]
  instructions: string[]
  cookingTime: string
  difficulty: string
  servings: number
}

const AIResponsePage: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showTutorial, setShowTutorial] = useState<string | null>(null)

  useEffect(() => {
    // Simulate loading detected ingredients
    setTimeout(() => {
      setIngredients([
        { name: "Tomatoes", confidence: 95, category: "Vegetables" },
        { name: "Onions", confidence: 88, category: "Vegetables" },
        { name: "Garlic", confidence: 92, category: "Aromatics" },
        { name: "Olive Oil", confidence: 85, category: "Oils" },
        { name: "Basil", confidence: 78, category: "Herbs" },
        { name: "Mozzarella", confidence: 90, category: "Dairy" },
      ])

      setRecipes([
        {
          name: "Caprese Salad",
          description:
            "A fresh and simple Italian salad featuring ripe tomatoes, creamy mozzarella, and aromatic basil.",
          ingredients: [
            "4 large ripe tomatoes, sliced",
            "8 oz fresh mozzarella, sliced",
            "1/4 cup fresh basil leaves",
            "3 tbsp extra virgin olive oil",
            "2 tbsp balsamic vinegar",
            "Salt and pepper to taste",
          ],
          instructions: [
            "Arrange alternating slices of tomatoes and mozzarella on a serving platter.",
            "Tuck fresh basil leaves between the slices.",
            "Drizzle with olive oil and balsamic vinegar.",
            "Season with salt and pepper.",
            "Let sit for 10 minutes before serving to allow flavors to meld.",
          ],
          cookingTime: "15 minutes",
          difficulty: "Easy",
          servings: 4,
        },
        {
          name: "Pasta Pomodoro",
          description: "Classic Italian pasta with a simple tomato sauce made from fresh ingredients.",
          ingredients: [
            "1 lb spaghetti or linguine",
            "6 large ripe tomatoes, diced",
            "4 cloves garlic, minced",
            "1 medium onion, diced",
            "1/4 cup olive oil",
            "1/4 cup fresh basil, chopped",
            "Salt and pepper to taste",
            "Parmesan cheese for serving",
          ],
          instructions: [
            "Cook pasta according to package directions until al dente.",
            "Heat olive oil in a large pan over medium heat.",
            "Sauté onions until translucent, about 5 minutes.",
            "Add garlic and cook for 1 minute until fragrant.",
            "Add diced tomatoes and cook for 10-15 minutes until sauce thickens.",
            "Season with salt, pepper, and fresh basil.",
            "Toss with cooked pasta and serve with Parmesan cheese.",
          ],
          cookingTime: "30 minutes",
          difficulty: "Medium",
          servings: 6,
        },
        {
          name: "Bruschetta",
          description: "Toasted bread topped with a fresh tomato and basil mixture, perfect as an appetizer.",
          ingredients: [
            "1 French baguette, sliced",
            "4 ripe tomatoes, diced",
            "3 cloves garlic, minced",
            "1/4 cup fresh basil, chopped",
            "3 tbsp olive oil",
            "1 tbsp balsamic vinegar",
            "Salt and pepper to taste",
          ],
          instructions: [
            "Preheat oven to 400°F (200°C).",
            "Brush bread slices with olive oil and toast until golden.",
            "Mix diced tomatoes, garlic, basil, remaining olive oil, and balsamic vinegar.",
            "Season the tomato mixture with salt and pepper.",
            "Top each toasted bread slice with the tomato mixture.",
            "Serve immediately while bread is still warm.",
          ],
          cookingTime: "20 minutes",
          difficulty: "Easy",
          servings: 8,
        },
      ])

      setLoading(false)
    }, 2000)
  }, [])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const openTutorial = (recipeName: string) => {
    setShowTutorial(recipeName)
    // Track tutorial view
    if (window.gtag) {
      window.gtag("event", "tutorial_view", {
        event_category: "engagement",
        event_label: recipeName,
      })
    }
  }

  if (loading) {
    return (
      <div className="ai-response-container">
        <div className="container mx-auto px-4">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p className="mt-4 text-gray-600">Analyzing your ingredients...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ai-response-container">
      <div className="container mx-auto px-4">
        <Link to="/" className="back-button">
          ← Back to Home
        </Link>

        <div className="response-header">
          <h1 className="response-title">🥗 Ingredient Analysis Results</h1>
          <p className="response-subtitle">
            We've analyzed your ingredients and found some amazing recipes you can make!
          </p>
        </div>

        {/* Upload Section */}
        <div className="ingredients-section">
          <h2 className="ingredients-title">📸 Upload New Image</h2>
          <div className="mb-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          {selectedImage && (
            <div className="mt-4">
              <img
                src={selectedImage || "/placeholder.svg"}
                alt="Uploaded ingredients"
                className="max-w-full h-64 object-cover rounded-lg shadow-lg"
              />
            </div>
          )}
        </div>

        {/* Detected Ingredients */}
        <div className="ingredients-section">
          <h2 className="ingredients-title">🔍 Detected Ingredients</h2>
          <div className="ingredients-list">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="ingredient-item">
                <div className="font-semibold text-gray-800">{ingredient.name}</div>
                <div className="text-sm text-gray-600">{ingredient.category}</div>
                <div className="text-sm text-green-600 font-medium">{ingredient.confidence}% confidence</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recipe Suggestions */}
        <div className="recipes-section">
          <h2 className="recipes-title">👨‍🍳 Recommended Recipes</h2>
          <div className="space-y-6">
            {recipes.map((recipe, index) => (
              <div key={index} className="recipe-card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="recipe-name">{recipe.name}</h3>
                    <div className="flex gap-4 text-sm text-gray-500 mb-2">
                      <span>⏱️ {recipe.cookingTime}</span>
                      <span>👥 {recipe.servings} servings</span>
                      <span>📊 {recipe.difficulty}</span>
                    </div>
                  </div>
                  <button onClick={() => openTutorial(recipe.name)} className="tutorial-button">
                    📺 Watch Tutorial
                  </button>
                </div>

                <p className="recipe-description">{recipe.description}</p>

                <div className="recipe-ingredients">
                  <h4>Ingredients:</h4>
                  <ul>
                    {recipe.ingredients.map((ingredient, idx) => (
                      <li key={idx}>{ingredient}</li>
                    ))}
                  </ul>
                </div>

                <div className="recipe-instructions">
                  <h4>Instructions:</h4>
                  <ol>
                    {recipe.instructions.map((instruction, idx) => (
                      <li key={idx}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tutorial Modal */}
        {showTutorial && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">Cooking Tutorial: {showTutorial}</h3>
                <button onClick={() => setShowTutorial(null)} className="text-gray-500 hover:text-gray-700 text-2xl">
                  ×
                </button>
              </div>

              <div className="aspect-video bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎥</div>
                  <p className="text-gray-600">Tutorial video would load here</p>
                  <p className="text-sm text-gray-500 mt-2">Integration with YouTube API or video hosting service</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold mb-2">Step-by-step Guide:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    {recipes
                      .find((r) => r.name === showTutorial)
                      ?.instructions.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                  </ol>
                </div>

                <div>
                  <h4 className="font-bold mb-2">Tips & Tricks:</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                    <li>Use the freshest ingredients for best flavor</li>
                    <li>Taste and adjust seasoning as you cook</li>
                    <li>Don't rush - let flavors develop naturally</li>
                    <li>Prep all ingredients before you start cooking</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="text-center mt-8 space-x-4">
          <Link to="/detect-food" className="cta-button bg-green-500 hover:bg-green-600">
            📸 Try Food Detection
          </Link>
          <Link to="/meal-planner" className="cta-button bg-purple-500 hover:bg-purple-600">
            📅 Plan Your Meals
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AIResponsePage
