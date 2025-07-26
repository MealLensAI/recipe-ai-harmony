"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Utensils, BookOpen } from "lucide-react"
import { useAuth } from "@/lib/utils"
import { useAPI } from "@/lib/api"
import LoadingSpinner from "@/components/LoadingSpinner"

interface HistoryDetail {
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

const HistoryDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [historyDetail, setHistoryDetail] = useState<HistoryDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { api } = useAPI()

  useEffect(() => {
    const fetchHistoryDetail = async () => {
      if (!id) {
        setError("No history ID provided")
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // Get all history and find the specific entry
        const result = await api.getDetectionHistory()
        
        if (result.status === 'success') {
          let historyData = []
          if (result.detection_history) {
            historyData = result.detection_history
          } else if (result.data?.detection_history) {
            historyData = result.data.detection_history
          } else if (Array.isArray(result.data)) {
            historyData = result.data
          } else if (result.data) {
            historyData = [result.data]
          }

          const detail = historyData.find((item: any) => item.id === id)
          
          if (detail) {
            setHistoryDetail(detail)
          } else {
            setError("History entry not found")
          }
        } else {
          setError(result.message || 'Failed to load history detail.')
        }
      } catch (err) {
        console.error("Error fetching history detail:", err)
        setError("Failed to load history detail. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading && isAuthenticated) {
      fetchHistoryDetail()
    }
  }, [id, isAuthenticated, authLoading, api])

  const getYouTubeVideoId = (url: string) => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2] && match[2].length === 11) ? match[2] : null
  }

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
              Please log in to view your detection history.
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[600px] w-full">
        <Loader2 className="h-12 w-12 animate-spin text-red-500" aria-label="Loading history detail" />
        <span className="mt-4 text-xl font-medium text-gray-600">Loading history detail...</span>
      </div>
    )
  }

  if (error || !historyDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl shadow-lg mx-auto">
            <Utensils className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">History Entry Not Found</h2>
            <p className="text-gray-600">
              {error || "The requested history entry could not be found."}
            </p>
            <Button 
              onClick={() => navigate('/history')}
              className="w-full py-3 text-lg font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg hover:from-red-600 hover:to-orange-600 transition-all duration-300"
            >
              Back to History
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen p-8 text-[#2D3436] leading-[1.6]"
      style={{
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        background: "url('https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=2000&q=80') center/cover no-repeat fixed",
        padding: "2rem 1rem"
      }}
    >
      <div className="max-w-[800px] mx-auto">
        <div 
          className="bg-[rgba(255,255,255,0.95)] rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.1)] overflow-hidden p-12 relative"
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <Button 
              onClick={() => navigate('/history')}
              variant="ghost"
              className="text-[#FF6B6B] hover:text-[#FF8E53] p-0"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to History
            </Button>
            <div className="flex items-center gap-2">
              {historyDetail.recipe_type === "food_detection" ? (
                <Utensils className="h-5 w-5 text-red-600" />
              ) : (
                <BookOpen className="h-5 w-5 text-orange-600" />
              )}
              <span className="text-sm text-gray-600">
                {new Date(historyDetail.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 
            className="text-[2.5rem] font-[800] text-center mb-8"
            style={{
              background: "linear-gradient(135deg, #FF6B6B, #FF8E53)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              letterSpacing: "-1px"
            }}
          >
            {historyDetail.recipe_type === "food_detection" ? "Food Detection Result" : "Ingredient Detection Result"}
          </h1>

          {/* Detected Foods/Ingredients */}
          {historyDetail.detected_foods && (
            <div className="mb-6 p-4 bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
              <div className="p-4 mt-2.5">
                <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                  {historyDetail.recipe_type === "food_detection" ? "Detected Foods" : "Ingredients"}
                </h5>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    try {
                      const foods = JSON.parse(historyDetail.detected_foods)
                      return foods.map((food: string, index: number) => (
                        <span 
                          key={index}
                          className="inline-block px-3 py-1 bg-gradient-to-r from-red-100 to-orange-100 text-red-700 border border-red-200 rounded-full text-sm font-medium"
                        >
                          {food}
                        </span>
                      ))
                    } catch {
                      return <span className="text-gray-600">No foods detected</span>
                    }
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Recipe Suggestion */}
          {historyDetail.suggestion && (
            <div className="mb-6 p-4 bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
              <div className="p-4 mt-2.5">
                <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                  Recipe Suggestion
                </h5>
                <p className="text-lg font-medium text-red-600">{historyDetail.suggestion}</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          {historyDetail.instructions && (
            <div className="mb-6 p-4 bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
              <div className="p-4 mt-2.5">
                <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                  Cooking Instructions
                </h5>
                <div 
                  className="leading-[1.4] m-0 text-left"
                  style={{ lineHeight: '1.4', margin: 0, textAlign: 'left' }}
                  dangerouslySetInnerHTML={{ __html: historyDetail.instructions }}
                />
              </div>
            </div>
          )}

          {/* Resources */}
          {historyDetail.resources_link && (
            <div className="mb-6 p-4 bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
              <div className="p-4 mt-2.5">
                <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                  Additional Resources
                </h5>
                <div 
                  className="leading-[1.4] m-0 text-left"
                  style={{ lineHeight: '1.4', margin: 0, textAlign: 'left' }}
                  dangerouslySetInnerHTML={{ __html: historyDetail.resources_link }}
                />
              </div>
            </div>
          )}

          {/* Resource Links */}
          {(historyDetail.youtube_link || historyDetail.google_link) && (
            <div className="mb-6 p-4 bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
              <div className="p-4 mt-2.5">
                <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                  External Resources
                </h5>
                <div className="flex flex-wrap gap-4">
                  {historyDetail.youtube_link && (
                    <a 
                      href={historyDetail.youtube_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
                    >
                      🎥 YouTube Tutorial
                    </a>
                  )}
                  {historyDetail.google_link && (
                    <a 
                      href={historyDetail.google_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors"
                    >
                      🔍 Google Search
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HistoryDetailPage 