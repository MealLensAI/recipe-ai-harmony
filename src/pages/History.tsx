"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Utensils, BookOpen, CalendarDays, ChevronDown, ChevronUp } from "lucide-react"
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

export function HistoryPage() {
  const navigate = useNavigate()
  const [history, setHistory] = useState<SharedRecipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
    <ScrollArea className="h-[600px] w-full rounded-lg border border-gray-200 p-4 shadow-inner bg-gray-50">
      {history.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-gray-500 text-center p-8">
          <Utensils className="h-16 w-16 text-gray-300 mb-4" aria-hidden="true" />
          <p className="text-xl font-semibold">No detection history yet.</p>
          <p className="text-md mt-2">Start scanning to see your results here.</p>
        </div>
      ) : (
        <div className="grid gap-6 p-2">
          {history.map((item) => (
            <HistoryCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </ScrollArea>
  )
}

interface HistoryCardProps {
  item: SharedRecipe
}

function HistoryCard({ item }: HistoryCardProps) {
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(false)

  const toggleInstructions = () => {
    setIsInstructionsExpanded(!isInstructionsExpanded)
  }

  return (
    <Card className="overflow-hidden shadow-lg transition-all hover:shadow-xl border border-gray-100 rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-3 bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-100">
        <CardTitle className="text-lg font-bold text-gray-800 flex items-center">
          {item.recipe_type === "food_detection" ? (
            <Utensils className="mr-2 h-5 w-5 text-red-600" aria-hidden="true" />
          ) : (
            <BookOpen className="mr-2 h-5 w-5 text-orange-600" aria-hidden="true" />
          )}
          {item.recipe_type === "food_detection" ? "Food Detection Result" : "Ingredient Detection Result"}
        </CardTitle>
        <Badge
          variant="secondary"
          className="bg-white text-gray-600 border border-gray-200 shadow-sm text-xs px-2 py-1"
        >
          <CalendarDays className="mr-1 h-3 w-3" aria-hidden="true" />
          {new Date(item.created_at).toLocaleDateString()}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 pt-3 space-y-3">
        {item.recipe_type === "food_detection" && item.detected_foods && (
          <div className="text-sm text-gray-700 flex items-center">
            <span className="font-semibold mr-2">Detected Foods:</span>{" "}
            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 font-medium px-2 py-1">
              {JSON.parse(item.detected_foods).join(", ")}
            </Badge>
          </div>
        )}
        {item.recipe_type === "ingredient_detection" && item.ingredients && (
          <div className="text-sm text-gray-700 flex items-center">
            <span className="font-semibold mr-2">Ingredients:</span>{" "}
            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 font-medium px-2 py-1">
              {JSON.parse(item.ingredients).join(", ")}
            </Badge>
          </div>
        )}
        {item.suggestion && (
          <div className="text-sm text-gray-700">
            <span className="font-semibold">Recipe Suggestion:</span>{" "}
            <span className="font-medium text-red-600">{item.suggestion}</span>
          </div>
        )}
        {item.instructions && (
          <div className="mt-2 text-sm text-gray-700">
            <strong className="block mb-1 text-base text-gray-800">Instructions:</strong>
            <div
              id={`instructions-${item.id}`} // Added ID for aria-controls
              className={`prose prose-sm max-w-none text-gray-600 leading-relaxed ${
                isInstructionsExpanded ? "" : "max-h-24 overflow-hidden relative"
              }`}
              dangerouslySetInnerHTML={{ __html: item.instructions }}
            />
            {item.instructions.length > 200 && ( // Simple heuristic for showing toggle
              <Button
                variant="link"
                onClick={toggleInstructions}
                className="p-0 h-auto text-red-600 hover:text-red-700 mt-2"
                aria-expanded={isInstructionsExpanded}
                aria-controls={`instructions-${item.id}`}
              >
                {isInstructionsExpanded ? (
                  <>
                    Show Less <ChevronUp className="ml-1 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Read More <ChevronDown className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}
        {/* Show resource links if present */}
        {(item.youtube_link || item.google_link || item.resources_link) && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Resources & Links:</h4>
            <div className="flex flex-wrap gap-2">
        {item.youtube_link && (
                <a 
                  href={item.youtube_link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium hover:bg-red-200 transition-colors"
                >
                  🎥 YouTube
                </a>
        )}
        {item.google_link && (
                <a 
                  href={item.google_link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors"
                >
                  🔍 Google
                </a>
              )}
              {item.resources_link && (
                <a 
                  href={item.resources_link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium hover:bg-green-200 transition-colors"
                >
                  📚 Resources
                </a>
              )}
            </div>
          </div>
        )}
        
        {/* Show parsed resources if available */}
        {item.resources && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Additional Resources:</h4>
            <div className="text-xs text-gray-600 max-h-32 overflow-y-auto">
              {(() => {
                try {
                  const resources = JSON.parse(item.resources)
                  if (resources.GoogleSearch && Array.isArray(resources.GoogleSearch)) {
                    return (
                      <div className="space-y-1">
                        <p className="font-medium text-gray-700">Google Search Results:</p>
                        {resources.GoogleSearch.slice(0, 3).map((result: any, index: number) => (
                          <div key={index} className="pl-2 border-l-2 border-gray-200">
                            <a 
                              href={result.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline block truncate"
                              title={result.title}
                            >
                              {result.title}
                            </a>
                          </div>
                        ))}
                      </div>
                    )
                  }
                  if (resources.YoutubeSearch && Array.isArray(resources.YoutubeSearch)) {
                    return (
                      <div className="space-y-1">
                        <p className="font-medium text-gray-700">YouTube Videos:</p>
                        {resources.YoutubeSearch.slice(0, 3).map((result: any, index: number) => (
                          <div key={index} className="pl-2 border-l-2 border-gray-200">
                            <a 
                              href={result.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-red-600 hover:underline block truncate"
                              title={result.title}
                            >
                              {result.title}
                            </a>
                          </div>
                        ))}
                      </div>
                    )
                  }
                  return <p className="text-gray-500">Resources available</p>
                } catch (error) {
                  return <p className="text-gray-500">Resources available</p>
                }
              })()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default HistoryPage
