"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Utensils, BookOpen, CalendarDays, Clock, Search, Play, Settings as SettingsIcon } from "lucide-react"
import { useAuth } from "@/lib/utils"
import { useAPI, APIError } from "@/lib/api"

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
  const [settingsHistory, setSettingsHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("detections")
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { api } = useAPI()

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
              onClick={() => navigate('/landing')}
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
          let historyData: any[] = []
          if ((result as any).detection_history) {
            historyData = (result as any).detection_history
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

  // Fetch settings history when tab is switched
  useEffect(() => {
    const fetchSettingsHistory = async () => {
      if (activeTab !== "settings" || !isAuthenticated || authLoading) {
        return
      }

      setIsLoadingSettings(true)
      try {
        const result = await api.getUserSettingsHistory('health_profile', 50)
        if ((result as any).status === 'success') {
          setSettingsHistory((result as any).history || [])
        }
      } catch (err) {
        console.error("Error fetching settings history:", err)
      } finally {
        setIsLoadingSettings(false)
      }
    }

    fetchSettingsHistory()
  }, [activeTab, isAuthenticated, authLoading, api])

  // Filter history based on search term
  const filteredHistory = history.filter(item => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    const detectedFoods = item.detected_foods ? JSON.parse(item.detected_foods).join(" ") : ""
    const suggestion = item.suggestion || ""

    return detectedFoods.toLowerCase().includes(searchLower) ||
      suggestion.toLowerCase().includes(searchLower)
  })

  // Removed loading screens - show content immediately

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">History</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">View your detection and settings history</p>
            </div>
            {activeTab === "detections" && (
              <div className="flex items-center">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  <Input
                    placeholder="Search detections..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 sm:pl-10 w-full sm:w-64 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="detections" className="flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              Detections
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Settings History
            </TabsTrigger>
          </TabsList>

          {/* Detections Tab */}
          <TabsContent value="detections">
            {filteredHistory.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-gray-500 text-center p-4 sm:p-8 min-h-[300px] sm:min-h-[400px]">
                <Utensils className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mb-4" aria-hidden="true" />
                <p className="text-lg sm:text-xl font-semibold">No detection history yet.</p>
                <p className="text-sm sm:text-md mt-2">Start scanning to see your results here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                {filteredHistory.map((item) => (
                  <HistoryCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Settings History Tab */}
          <TabsContent value="settings">
            {isLoadingSettings ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : settingsHistory.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-gray-500 text-center p-4 sm:p-8 min-h-[300px] sm:min-h-[400px]">
                <SettingsIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mb-4" aria-hidden="true" />
                <p className="text-lg sm:text-xl font-semibold">No settings history yet</p>
                <p className="text-sm sm:text-md mt-2">Changes to your health profile will appear here</p>
              </div>
            ) : (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr className="text-left">
                          <th className="pb-3 font-semibold text-gray-700">Date & Time</th>
                          <th className="pb-3 font-semibold text-gray-700">Changes Made</th>
                          <th className="pb-3 font-semibold text-gray-700">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {settingsHistory.map((record, index) => (
                          <tr key={record.id || index} className="hover:bg-gray-50">
                            <td className="py-3 text-gray-600 whitespace-nowrap">
                              {formatDate(record.created_at)}
                            </td>
                            <td className="py-3">
                              {record.changed_fields && record.changed_fields.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {record.changed_fields.map((field: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800"
                                    >
                                      {field}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-500 italic">Initial setup</span>
                              )}
                            </td>
                            <td className="py-3">
                              <details className="cursor-pointer">
                                <summary className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                                  View details
                                </summary>
                                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs space-y-2">
                                  {record.settings_data && Object.entries(record.settings_data).map(([key, value]: [string, any]) => (
                                    <div key={key} className="flex justify-between gap-4">
                                      <span className="font-medium text-gray-700">{key}:</span>
                                      <span className="text-gray-600 text-right">
                                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {settingsHistory.length >= 50 && (
                    <p className="text-xs text-gray-500 text-center pt-4 border-t mt-4">
                      Showing last 50 changes
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
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
  // Prefer suggested food name for ingredient detections
  const title = (item.recipe_type === "ingredient_detection" && item.suggestion)
    ? item.suggestion
    : mainFood
  const additionalCount = detectedFoods.length > 1 ? detectedFoods.length - 1 : 0

  return (
    <Card
      className="overflow-hidden shadow-lg transition-all hover:shadow-xl border border-gray-100 rounded-lg sm:rounded-xl cursor-pointer hover:scale-[1.02] group"
      onClick={handleCardClick}
    >
      <CardContent className="p-3 sm:p-6">
        {/* Header with play button */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm sm:text-lg text-gray-900 mb-1 truncate">
              {title}
            </h3>
            {additionalCount > 0 && (
              <p className="text-xs sm:text-sm text-gray-500">
                +{additionalCount} more ingredients
              </p>
            )}
          </div>
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
            <Play className="h-3 w-3 sm:h-4 sm:w-4" />
          </div>
        </div>

        {/* Info grid */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
            <span className="truncate">{new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}</span>
          </div>

          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
            <span className="truncate">{new Date(item.created_at).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            {item.recipe_type === "food_detection" ? (
              <Utensils className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
            ) : (
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
            )}
            <span className="truncate">{item.recipe_type === "food_detection" ? "Food Detection" : "Ingredient Detection"}</span>
          </div>
        </div>

        {/* Status badge */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
          <Badge
            variant="outline"
            className={`${getStatusColor(item.recipe_type)} text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1`}
          >
            {getStatusText(item.recipe_type)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
export default HistoryPage

