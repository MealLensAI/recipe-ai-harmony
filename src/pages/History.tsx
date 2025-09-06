"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Utensils, BookOpen, CalendarDays, Clock, Search, Filter, Bell, Play } from "lucide-react"
import { useAuth } from "@/lib/utils"
import { useAPI, APIError } from "@/lib/api"
import LoadingSpinner from "@/components/LoadingSpinner"

interface SharedRecipe {
  id: string
  recipe_type: "food_detection" | "ingredient_detection"
  detected_foods?: string // JSON string of string[]
  instructions?: string // HTML string
  resources?: string // HTML string
  suggestion?: string // for ingredient detection
  ingredients?: string // JSON string of string[]
  created_at: string
  youtube_link?: string
  google_link?: string
  resources_link?: string
}

// Helper functions moved outside components
const getStatusColor = (recipeType: string) => {
  switch (recipeType) {
    case "food_detection":
      return "bg-green-100 text-green-700 border-green-200"
    case "ingredient_detection":
      return "bg-blue-100 text-blue-700 border-blue-200"
    default:
      return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

const getStatusText = (recipeType: string) => {
  switch (recipeType) {
    case "food_detection":
      return "Food Detection"
    case "ingredient_detection":
      return "Ingredient Detection"
    default:
      return "Detection"
  }
}

export function HistoryPage() {
  const navigate = useNavigate()
  const [history, setHistory] = useState<SharedRecipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { api } = useAPI()

  if (authLoading) {
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
              Please log in to view your detection history and saved recipes.
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

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true)
      setError(null)

      // Wait for auth to load
      if (authLoading) {
        return
      }

      // Check authentication
      if (!isAuthenticated) {
        setError("Please log in to view your history.")
        setIsLoading(false)
        return
      }

      try {
        const result = await api.getDetectionHistory()

        if (result.status === 'success') {
          // Handle different response structures
          let historyData = []
          if (result.detection_history) {
            historyData = result.detection_history
          } else if (result.data?.detection_history) {
            historyData = result.data.detection_history
          } else if (Array.isArray(result.data)) {
            historyData = result.data
          } else if (result.data) {
            historyData = [result.data]
          } else {
            historyData = []
          }

          setHistory(historyData)
        } else {
          setError(result.message || 'Failed to load history.')
        }
      } catch (err) {
        console.error("Error fetching history:", err)
        if (err instanceof APIError) {
          setError(err.message)
        } else {
          setError("Failed to load history. Please try again later.")
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchHistory()
  }, [isAuthenticated, authLoading, api])

  // Filter history based on search term
  const filteredHistory = history.filter(item => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    const detectedFoods = item.detected_foods ? JSON.parse(item.detected_foods).join(" ") : ""
    const suggestion = item.suggestion || ""

    return detectedFoods.toLowerCase().includes(searchLower) ||
      suggestion.toLowerCase().includes(searchLower)
  })

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[600px] w-full">
        <Loader2 className="h-12 w-12 animate-spin text-red-500" aria-label="Loading authentication" />
        <span className="mt-4 text-xl font-medium text-gray-600">Loading authentication...</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[600px] w-full">
        <Loader2 className="h-12 w-12 animate-spin text-red-500" aria-label="Loading history" />
        <span className="mt-4 text-xl font-medium text-gray-600">Loading history...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="p-8 text-center text-red-600 min-h-[600px] flex flex-col items-center justify-center"
      >
        <p className="text-xl font-semibold">{error}</p>
        <p className="text-gray-500 mt-2">Please ensure you are logged in and try again.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">History</h1>
              <p className="text-gray-600 mt-1">Showing your all histories with a clear view.</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search history..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                T
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {filteredHistory.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-500 text-center p-8 min-h-[400px]">
            <Utensils className="h-16 w-16 text-gray-300 mb-4" aria-hidden="true" />
            <p className="text-xl font-semibold">No detection history yet.</p>
            <p className="text-md mt-2">Start scanning to see your results here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredHistory.map((item) => (
              <HistoryCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface HistoryCardProps {
  item: SharedRecipe
}

function HistoryCard({ item }: HistoryCardProps) {
  const navigate = useNavigate()

  const handleCardClick = () => {
    navigate(`/history/${item.id}`)
  }

  const getDetectedFoods = () => {
    try {
      if (item.detected_foods) {
        return JSON.parse(item.detected_foods)
      }
      if (item.ingredients) {
        return JSON.parse(item.ingredients)
      }
      return []
    } catch {
      return []
    }
  }

  const detectedFoods = getDetectedFoods()
  const mainFood = detectedFoods[0] || "Unknown"
  const additionalCount = detectedFoods.length > 1 ? detectedFoods.length - 1 : 0

  return (
    <Card
      className="overflow-hidden shadow-lg transition-all hover:shadow-xl border border-gray-100 rounded-xl cursor-pointer hover:scale-[1.02] group"
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        {/* Header with play button */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">
              {mainFood}
            </h3>
            {additionalCount > 0 && (
              <p className="text-sm text-gray-500">
                +{additionalCount} more ingredients
              </p>
            )}
          </div>
          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="h-4 w-4" />
          </div>
        </div>

        {/* Info grid */}
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <CalendarDays className="h-4 w-4 mr-2" />
            {new Date(item.created_at).toLocaleDateString()}
          </div>

          <div className="flex items-center text-sm text-gray-600">
            {item.recipe_type === "food_detection" ? (
              <Utensils className="h-4 w-4 mr-2" />
            ) : (
              <BookOpen className="h-4 w-4 mr-2" />
            )}
            {item.recipe_type === "food_detection" ? "Food Detection" : "Ingredient Detection"}
          </div>
        </div>

        {/* Status badge */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Badge
            variant="outline"
            className={`${getStatusColor(item.recipe_type)} text-xs px-2 py-1`}
          >
            {getStatusText(item.recipe_type)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
export default HistoryPage

