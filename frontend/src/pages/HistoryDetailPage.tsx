"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Utensils, BookOpen } from "lucide-react"
import { useAuth, safeGetItem } from "@/lib/utils"
import { useAPI } from "@/lib/api"

interface HistoryDetail {
  id: string
  recipe_type: "food_detection" | "ingredient_detection"
  detected_foods?: string // JSON string of string[]
  instructions?: string // HTML string
  resources?: string // HTML string (legacy)
  suggestion?: string // for ingredient detection
  ingredients?: string // JSON string of string[]
  created_at: string
  youtube_link?: string
  google_link?: string
  resources_link?: string
  // legacy field names from Supabase
  youtube?: string
  google?: string
}

// Helper to get cached history
const getCachedHistory = (userId?: string): any[] | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    
    const cacheKey = userId ? `meallensai_history_cache_${userId}` : 'meallensai_history_cache';
    const timestampKey = userId ? `meallensai_history_cache_timestamp_${userId}` : 'meallensai_history_cache_timestamp';
    
    const cached = window.localStorage.getItem(cacheKey);
    const timestamp = window.localStorage.getItem(timestampKey);
    
    if (!cached || !timestamp) return null;
    
    const cacheAge = Date.now() - parseInt(timestamp, 10);
    if (cacheAge > 5 * 60 * 1000) { // 5 minutes
      return null;
    }
    
    return JSON.parse(cached);
  } catch (error) {
    return null;
  }
};

const HistoryDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  // Get user ID for cache
  const userData = safeGetItem('user_data');
  const userId = userData ? JSON.parse(userData)?.uid : undefined;
  
  // Try to find item in cache immediately
  const cachedHistory = getCachedHistory(userId);
  const cachedItem = cachedHistory?.find((item: any) => item.id === id);
  
  const [historyDetail, setHistoryDetail] = useState<HistoryDetail | null>(cachedItem ? (() => {
    // Normalize cached item
    return {
      ...cachedItem,
      youtube_link: cachedItem.youtube_link || cachedItem.youtube || undefined,
      google_link: cachedItem.google_link || cachedItem.google || undefined,
      resources_link: cachedItem.resources_link || cachedItem.resources || undefined
    };
  })() : null)
  const [resources, setResources] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false) // Start as false - show cached data immediately
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { api } = useAPI()
  
  // Parse resources from cached item immediately
  useEffect(() => {
    if (cachedItem && historyDetail) {
      try {
        if (historyDetail.resources_link && typeof historyDetail.resources_link === 'string' && historyDetail.resources_link.trim() !== '{}' && historyDetail.resources_link.trim() !== '') {
          const parsed = JSON.parse(historyDetail.resources_link);
          setResources(parsed);
        } else if (historyDetail.resources && typeof historyDetail.resources === 'string' && historyDetail.resources.trim() !== '{}' && historyDetail.resources.trim() !== '') {
          const parsed = JSON.parse(historyDetail.resources);
          setResources(parsed);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [cachedItem, historyDetail])

  // Reuse the Detect Food page formatting for instructions
  const formatInstructionsForDisplay = (raw: string) => {
    if (!raw) return ''
    let html = raw
    // Bold sections wrapped in ** ** with line breaks around
    html = html.replace(/\*\*(.*?)\*\*/g, '<br><strong>$1</strong><br>')
    // Bullet-like lines wrapped in * * into paragraph tags
    html = html.replace(/\*\s*(.*?)\s*\*/g, '<p>$1</p>')
    // Ensure numbered steps start on new lines
    html = html.replace(/(\d+\.)/g, '<br>$1')
    // Newlines to <br>
    html = html.replace(/\n/g, '<br>')
    return html
  }

  useEffect(() => {
    const fetchHistoryDetail = async () => {
      if (!id) {
        setError("No history ID provided")
        return
      }

      // If we have cached data, update in background
      // If no cache, fetch immediately but don't block
      if (cachedItem) {
        // Update in background
        fetchHistoryDetailBackground().catch(console.error);
        return;
      }

      // No cache - fetch but don't block
      try {
        const result = await api.getDetectionHistory()

        if (result.status === 'success') {
          let historyData = []
          const resultAny = result as any
          if (resultAny.detection_history) {
            historyData = resultAny.detection_history
          } else if (resultAny.data?.detection_history) {
            historyData = resultAny.data.detection_history
          } else if (Array.isArray(resultAny.data)) {
            historyData = resultAny.data
          } else if (resultAny.data) {
            historyData = [resultAny.data]
          }

          const raw = historyData.find((item: any) => item.id === id)

          if (raw) {
            // Normalize field names
            const detail: HistoryDetail = {
              ...raw,
              youtube_link: raw.youtube_link || raw.youtube || undefined,
              google_link: raw.google_link || raw.google || undefined,
              resources_link: raw.resources_link || raw.resources || undefined
            }
            setHistoryDetail(detail)
            
            // Parse resources
            try {
              if (detail.resources_link && typeof detail.resources_link === 'string' && detail.resources_link.trim() !== '{}' && detail.resources_link.trim() !== '') {
                setResources(JSON.parse(detail.resources_link))
              } else if (detail.resources && typeof detail.resources === 'string' && detail.resources.trim() !== '{}' && detail.resources.trim() !== '') {
                setResources(JSON.parse(detail.resources))
              }
            } catch (e) {
              // Ignore parse errors
            }
          } else {
            setError("History entry not found")
          }
        }
      } catch (err) {
        console.error("Error fetching history detail:", err)
        // Only show error if we don't have cached data
        if (!cachedItem) {
          setError("Failed to load history detail. Please try again later.")
        }
      }
    }

    const fetchHistoryDetailBackground = async () => {
      // Background update - silent refresh
      try {
        const result = await api.getDetectionHistory()
        if (result.status === 'success') {
          let historyData = []
          const resultAny = result as any
          if (resultAny.detection_history) {
            historyData = resultAny.detection_history
          } else if (resultAny.data?.detection_history) {
            historyData = resultAny.data.detection_history
          } else if (Array.isArray(resultAny.data)) {
            historyData = resultAny.data
          } else if (resultAny.data) {
            historyData = [resultAny.data]
          }

          const raw = historyData.find((item: any) => item.id === id)
          if (raw) {
            const detail: HistoryDetail = {
              ...raw,
              youtube_link: raw.youtube_link || raw.youtube || undefined,
              google_link: raw.google_link || raw.google || undefined,
              resources_link: raw.resources_link || raw.resources || undefined
            }
            setHistoryDetail(detail)
            
            // Parse resources
            try {
              if (detail.resources_link && typeof detail.resources_link === 'string' && detail.resources_link.trim() !== '{}' && detail.resources_link.trim() !== '') {
                setResources(JSON.parse(detail.resources_link))
              } else if (detail.resources && typeof detail.resources === 'string' && detail.resources.trim() !== '{}' && detail.resources.trim() !== '') {
                setResources(JSON.parse(detail.resources))
              }
            } catch (e) {
              // Ignore
            }
          }
        }
      } catch (err) {
        // Silent fail - we have cached data
        console.error("Background update failed:", err)
      }
    }

    if (!authLoading && isAuthenticated) {
      fetchHistoryDetail().catch(console.error)
    }
  }, [id, isAuthenticated, authLoading, api, cachedItem])

  const getYouTubeVideoId = (url: string) => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2] && match[2].length === 11) ? match[2] : null
  }

  // Don't block rendering - show cached data immediately
  // Only show error if we don't have cached data and there's an error

  if (!isAuthenticated && !authLoading) {
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

  // Only show error if we're done loading and there's actually an error
  if (!isLoading && (error || !historyDetail)) {
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

  // Don't render content if no data (even cached)
  if (!historyDetail) {
    if (error) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl shadow-lg mx-auto">
              <Utensils className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">History Entry Not Found</h2>
              <p className="text-gray-600">{error}</p>
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
    return null
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

          {/* Side-by-side: Recipe Suggestion (left) and Ingredients (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Recipe Suggestion */}
            {historyDetail.suggestion && (
              <div className="p-4 bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
                <div className="p-4 mt-2.5">
                  <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                    Recipe Suggestion
                  </h5>
                  <p className="text-lg font-medium text-red-600">{historyDetail.suggestion}</p>
                </div>
              </div>
            )}

            {/* Right: Ingredients/Detected Foods */}
            {historyDetail.detected_foods && (
              <div className="p-4 bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
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
          </div>

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
                  dangerouslySetInnerHTML={{ __html: formatInstructionsForDisplay(historyDetail.instructions) }}
                />
              </div>
            </div>
          )}

          {/* Resources from stored JSON (formatted like Detect Food page) */}
          {/* Always show resources section for food_detection type */}
          {(historyDetail.recipe_type === "food_detection" || resources || historyDetail.youtube_link || historyDetail.google_link) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* YouTube Resources */}
              <div
                className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
              >
                <div className="p-4 mt-2.5">
                  <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                    Youtube Resources
                  </h5>
                  <h6 className="font-bold mb-3 text-left">Video Tutorials</h6>
                  {resources?.YoutubeSearch && resources.YoutubeSearch.length > 0 ? (
                    <div className="space-y-6">
                      {(resources.YoutubeSearch as any[]).flat().map((item: any, idx: number) => {
                        if (!item || !item.link) return null
                        const vid = getYouTubeVideoId(item.link)
                        return vid ? (
                          <div key={idx} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <div className="relative w-full aspect-video bg-black">
                              <iframe
                                src={`https://www.youtube.com/embed/${vid}`}
                                title={item.title || 'YouTube Video'}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full rounded-t-2xl"
                              />
                            </div>
                            <div className="p-6">
                              <h4 className="font-bold text-[#2D3436] text-base mb-1 line-clamp-2 leading-tight text-left">{item.title || 'Untitled Video'}</h4>
                              <p className="text-xs text-gray-500 mb-4 text-left">{item.channel || ''}</p>
                            </div>
                          </div>
                        ) : (
                          <div key={idx} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <div className="p-6">
                              <h4 className="font-bold text-[#2D3436] text-base mb-1 line-clamp-2 leading-tight text-left">{item.title || 'Untitled Video'}</h4>
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-red-500 text-base font-semibold hover:underline"
                              >
                                Watch Tutorial
                              </a>
                            </div>
                          </div>
                        )
                      }).filter(Boolean)}
                    </div>
                  ) : historyDetail.youtube_link ? (
                    // Fallback: Show YouTube link if resources aren't available
                    <div className="space-y-6">
                      <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        {(() => {
                          const vid = getYouTubeVideoId(historyDetail.youtube_link)
                          return vid ? (
                            <>
                              <div className="relative w-full aspect-video bg-black">
                                <iframe
                                  src={`https://www.youtube.com/embed/${vid}`}
                                  title="YouTube Video"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  className="w-full h-full rounded-t-2xl"
                                />
                              </div>
                              <div className="p-6">
                                <a
                                  href={historyDetail.youtube_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-red-500 text-base font-semibold hover:underline"
                                >
                                  Watch on YouTube
                                </a>
                              </div>
                            </>
                          ) : (
                            <div className="p-6">
                              <a
                                href={historyDetail.youtube_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-red-500 text-base font-semibold hover:underline"
                              >
                                🎥 Watch Tutorial on YouTube
                              </a>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-600">No video tutorials available.</p>
                  )}
                </div>
              </div>

              {/* Google Resources */}
              <div
                className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
              >
                <div className="p-4 mt-2.5">
                  <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                    Google Resources
                  </h5>
                  <h6 className="font-bold mb-3 text-left">Recommended Articles</h6>
                  {resources?.GoogleSearch && resources.GoogleSearch.length > 0 ? (
                    <div className="space-y-6">
                      {(resources.GoogleSearch as any[]).flat().map((item: any, idx: number) => (
                        <div key={idx} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                          <div className="p-6">
                            <h4 className="font-bold text-[#2D3436] text-base mb-1 line-clamp-2 leading-tight text-left">{item.title}</h4>
                            <p className="text-xs text-gray-500 mb-4 line-clamp-3 leading-relaxed text-left">{item.description}</p>
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow hover:from-blue-400 hover:to-blue-500 transition-colors"
                            >
                              Read More
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : historyDetail.google_link ? (
                    // Fallback: Show Google link if resources aren't available
                    <div className="space-y-6">
                      <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="p-6">
                          <a
                            href={historyDetail.google_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow hover:from-blue-400 hover:to-blue-500 transition-colors"
                          >
                            🔍 View Google Search Results
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-600">No articles available.</p>
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