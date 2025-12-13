"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth, safeGetItem } from "@/lib/utils"
import { useAPI } from "@/lib/api"
import CookingTutorialModal from "@/components/CookingTutorialModal"

interface HistoryDetail {
  id: string
  recipe_type: "food_detection" | "ingredient_detection" | "health_meal"
  detected_foods?: string
  instructions?: string
  suggestion?: string
  ingredients?: string
  created_at: string
  resources_link?: string
}

const getCachedHistory = (userId?: string): any[] | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    
    const cacheKey = userId ? `meallensai_history_cache_${userId}` : 'meallensai_history_cache';
    const timestampKey = userId ? `meallensai_history_cache_timestamp_${userId}` : 'meallensai_history_cache_timestamp';
    
    const cached = window.localStorage.getItem(cacheKey);
    const timestamp = window.localStorage.getItem(timestampKey);
    
    if (!cached || !timestamp) return null;
    
    const cacheAge = Date.now() - parseInt(timestamp, 10);
    if (cacheAge > 5 * 60 * 1000) {
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
  
  const userData = safeGetItem('user_data');
  const userId = userData ? JSON.parse(userData)?.uid : undefined;
  
  const cachedHistory = getCachedHistory(userId);
  const cachedItem = cachedHistory?.find((item: any) => item.id === id);
  
  const [historyDetail, setHistoryDetail] = useState<HistoryDetail | null>(cachedItem || null)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { api } = useAPI()

  useEffect(() => {
    const fetchHistoryDetail = async () => {
      if (!id) {
        setError("No history ID provided")
        return
      }

      if (cachedItem) {
        // Update in background
        fetchHistoryDetailBackground().catch(console.error);
        return;
      }

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
              resources_link: raw.resources_link || raw.resources || undefined
            }
            setHistoryDetail(detail)
          } else {
            setError("History entry not found")
          }
        }
      } catch (err) {
        console.error("Error fetching history detail:", err)
        if (!cachedItem) {
          setError("Failed to load history detail. Please try again later.")
        }
      }
    }

    const fetchHistoryDetailBackground = async () => {
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
              resources_link: raw.resources_link || raw.resources || undefined
            }
            setHistoryDetail(detail)
          }
        }
      } catch (err) {
        console.error("Background update failed:", err)
      }
    }

    if (!authLoading && isAuthenticated) {
      fetchHistoryDetail().catch(console.error)
    }
  }, [id, isAuthenticated, authLoading, api, cachedItem])

  if (!isAuthenticated && !authLoading) {
    navigate('/login')
    return null
  }

  if (error || !historyDetail) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "History entry not found"}</p>
          <button
            onClick={() => navigate('/history')}
            className="text-[#1A76E3] hover:underline"
          >
            Back to History
          </button>
        </div>
      </div>
    )
  }

  // Get recipe name and ingredients
  const getRecipeName = () => {
    if (historyDetail.suggestion) return historyDetail.suggestion
    
    try {
      if (historyDetail.detected_foods) {
        const foods = JSON.parse(historyDetail.detected_foods)
        if (Array.isArray(foods) && foods.length > 0) {
          return foods[0]
        }
      }
    } catch {}
    
    return "Recipe"
  }

  const getIngredients = (): string[] => {
    try {
      if (historyDetail.ingredients) {
        const parsed = JSON.parse(historyDetail.ingredients)
        if (Array.isArray(parsed)) return parsed
      }
      if (historyDetail.detected_foods) {
        const parsed = JSON.parse(historyDetail.detected_foods)
        if (Array.isArray(parsed)) return parsed
      }
    } catch {}
    return []
  }

  // Debug logging
  useEffect(() => {
    if (historyDetail) {
      console.log('[HistoryDetailPage] Data ready:', {
        hasHistoryDetail: !!historyDetail,
        hasInstructions: !!historyDetail.instructions,
        hasResources: !!historyDetail.resources_link,
        instructionsLength: historyDetail.instructions?.length || 0,
        resourcesLength: historyDetail.resources_link?.length || 0,
        recipeName: historyDetail.suggestion || 'N/A',
        recipeType: historyDetail.recipe_type
      });
    }
  }, [historyDetail]);

  // Parse resources_link if it's a string
  const getResourcesLink = () => {
    if (!historyDetail.resources_link) return undefined;
    try {
      // If it's already a string, return it
      if (typeof historyDetail.resources_link === 'string') {
        return historyDetail.resources_link;
      }
      // If it's an object, stringify it
      return JSON.stringify(historyDetail.resources_link);
    } catch {
      return undefined;
    }
  };

  return (
    <CookingTutorialModal
      isOpen={true}
      onClose={() => navigate('/history')}
      recipeName={getRecipeName()}
      ingredients={getIngredients()}
      preloadedInstructions={historyDetail.instructions}
      preloadedResources={getResourcesLink()}
    />
  )
}

export default HistoryDetailPage
