"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Utensils, BookOpen, CalendarDays, Clock, Search, Play, Settings as SettingsIcon, Trash2 } from "lucide-react"
import { useAuth, safeGetItem, safeRemoveItem } from "@/lib/utils"
import { useAPI, APIError } from "@/lib/api"
import Logo from "@/components/Logo"

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

// LocalStorage cache keys
const HISTORY_CACHE_KEY = 'meallensai_history_cache'
const HISTORY_CACHE_TIMESTAMP_KEY = 'meallensai_history_cache_timestamp'
const SETTINGS_HISTORY_CACHE_KEY = 'meallensai_settings_history_cache'
const SETTINGS_HISTORY_CACHE_TIMESTAMP_KEY = 'meallensai_settings_history_cache_timestamp'
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper functions for caching
const getCachedHistory = (userId?: string): SharedRecipe[] | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    
    const cacheKey = userId ? `${HISTORY_CACHE_KEY}_${userId}` : HISTORY_CACHE_KEY;
    const timestampKey = userId ? `${HISTORY_CACHE_TIMESTAMP_KEY}_${userId}` : HISTORY_CACHE_TIMESTAMP_KEY;
    
    const cached = window.localStorage.getItem(cacheKey);
    const timestamp = window.localStorage.getItem(timestampKey);
    
    if (!cached || !timestamp) return null;
    
    const cacheAge = Date.now() - parseInt(timestamp, 10);
    if (cacheAge > CACHE_DURATION) {
      safeRemoveItem(cacheKey);
      safeRemoveItem(timestampKey);
      return null;
    }
    
    return JSON.parse(cached);
  } catch (error) {
    console.error('Error reading cached history:', error);
    return null;
  }
};

const setCachedHistory = (history: SharedRecipe[], userId?: string) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cacheKey = userId ? `${HISTORY_CACHE_KEY}_${userId}` : HISTORY_CACHE_KEY;
      const timestampKey = userId ? `${HISTORY_CACHE_TIMESTAMP_KEY}_${userId}` : HISTORY_CACHE_TIMESTAMP_KEY;
      window.localStorage.setItem(cacheKey, JSON.stringify(history));
      window.localStorage.setItem(timestampKey, Date.now().toString());
    }
  } catch (error) {
    console.error('Error caching history:', error);
  }
};

const getCachedSettingsHistory = (userId?: string): any[] | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    
    const cacheKey = userId ? `${SETTINGS_HISTORY_CACHE_KEY}_${userId}` : SETTINGS_HISTORY_CACHE_KEY;
    const timestampKey = userId ? `${SETTINGS_HISTORY_CACHE_TIMESTAMP_KEY}_${userId}` : SETTINGS_HISTORY_CACHE_TIMESTAMP_KEY;
    
    const cached = window.localStorage.getItem(cacheKey);
    const timestamp = window.localStorage.getItem(timestampKey);
    
    if (!cached || !timestamp) return null;
    
    const cacheAge = Date.now() - parseInt(timestamp, 10);
    if (cacheAge > CACHE_DURATION) {
      safeRemoveItem(cacheKey);
      safeRemoveItem(timestampKey);
      return null;
    }
    
    return JSON.parse(cached);
  } catch (error) {
    console.error('Error reading cached settings history:', error);
    return null;
  }
};

const setCachedSettingsHistory = (settingsHistory: any[], userId?: string) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cacheKey = userId ? `${SETTINGS_HISTORY_CACHE_KEY}_${userId}` : SETTINGS_HISTORY_CACHE_KEY;
      const timestampKey = userId ? `${SETTINGS_HISTORY_CACHE_TIMESTAMP_KEY}_${userId}` : SETTINGS_HISTORY_CACHE_TIMESTAMP_KEY;
      window.localStorage.setItem(cacheKey, JSON.stringify(settingsHistory));
      window.localStorage.setItem(timestampKey, Date.now().toString());
    }
  } catch (error) {
    console.error('Error caching settings history:', error);
  }
};

export function HistoryPage() {
  const navigate = useNavigate()
  
  // Get user ID for cache key
  const userData = safeGetItem('user_data');
  const userId = userData ? JSON.parse(userData)?.uid : undefined;
  
  // Try to load from cache first for instant display
  const cachedHistory = getCachedHistory(userId);
  const cachedSettingsHistory = getCachedSettingsHistory(userId);
  
  const [history, setHistory] = useState<SharedRecipe[]>(cachedHistory || [])
  const [settingsHistory, setSettingsHistory] = useState<any[]>(cachedSettingsHistory || [])
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("detections")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { api } = useAPI()

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="flex items-center justify-center mx-auto">
            <Logo size="lg" />
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
      // Don't block rendering - load in background
      if (authLoading || !isAuthenticated) {
        return
      }

      // Always fetch fresh data in background, show cached data immediately
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
          // Cache the data
          setCachedHistory(historyData, userId)
        } else {
          // Only show error if we don't have cached data
          if (!cachedHistory) {
            setError(result.message || 'Failed to load history.')
          }
        }
      } catch (err) {
        console.error("Error fetching history:", err)
        // Don't show error if we have cached data
        if (!cachedHistory) {
          if (err instanceof APIError) {
            setError(err.message)
          } else {
            setError("Failed to load history. Please try again later.")
          }
        }
      }
    }
    
    // Load in background - don't block
    fetchHistory().catch(console.error)
  }, [isAuthenticated, authLoading, api, userId, cachedHistory])

  // Fetch settings history when tab is switched
  useEffect(() => {
    const fetchSettingsHistory = async () => {
      if (activeTab !== "settings" || !isAuthenticated || authLoading) {
        return
      }

      // Always fetch fresh data in background, show cached data immediately
      try {
        const result = await api.getUserSettingsHistory('health_profile', 50)
        if ((result as any).status === 'success') {
          const historyData = (result as any).history || []
          setSettingsHistory(historyData)
          // Cache the data
          setCachedSettingsHistory(historyData, userId)
          console.log('✅ Settings history loaded:', historyData.length, 'records')
        }
      } catch (err) {
        console.error("Error fetching settings history:", err)
        // Don't show error if we have cached data - just use cached data
      }
    }

    // Load in background - don't block
    fetchSettingsHistory().catch(console.error)
  }, [activeTab, isAuthenticated, authLoading, api, userId, cachedSettingsHistory])

  // Listen for settings saved event to refresh history
  useEffect(() => {
    const handleSettingsSaved = () => {
      console.log('🔄 Settings saved event received, refreshing history...')
      if (activeTab === "settings" && isAuthenticated && !authLoading) {
        // Clear cache and fetch fresh data
        try {
          const userId = localStorage.getItem('user_id') || undefined;
          const cacheKey = userId ? `meallensai_settings_history_cache_${userId}` : 'meallensai_settings_history_cache';
          const timestampKey = userId ? `meallensai_settings_history_cache_timestamp_${userId}` : 'meallensai_settings_history_cache_timestamp';
          localStorage.removeItem(cacheKey);
          localStorage.removeItem(timestampKey);
        } catch (e) {
          console.warn('Failed to clear cache:', e)
        }
        // Fetch fresh history
        api.getUserSettingsHistory('health_profile', 50)
          .then((result: any) => {
            if (result.status === 'success') {
              const historyData = result.history || []
              setSettingsHistory(historyData)
              setCachedSettingsHistory(historyData, userId)
              console.log('✅ History refreshed after save:', historyData.length, 'records')
            }
          })
          .catch((err) => {
            console.error("Error refreshing settings history:", err)
          })
      }
    }

    window.addEventListener('settingsSaved', handleSettingsSaved)
    return () => {
      window.removeEventListener('settingsSaved', handleSettingsSaved)
    }
  }, [activeTab, isAuthenticated, authLoading, api, userId])

  const handleDeleteHistory = async (recordId: string) => {
    if (!window.confirm('Are you sure you want to delete this settings history entry? This action cannot be undone.')) {
      return
    }

    setDeletingId(recordId)
    try {
      const result = await api.deleteSettingsHistory(recordId)
      if ((result as any).status === 'success') {
        // Remove the deleted record from the list
        setSettingsHistory(prev => {
          const updated = prev.filter(record => record.id !== recordId);
          // Update cache
          setCachedSettingsHistory(updated, userId);
          return updated;
        })
      } else {
        alert((result as any).message || 'Failed to delete history entry')
      }
    } catch (err) {
      console.error("Error deleting settings history:", err)
      if (err instanceof APIError) {
        alert(err.message)
      } else {
        alert('Failed to delete history entry. Please try again.')
      }
    } finally {
      setDeletingId(null)
    }
  }

  // Filter history based on search term
  const filteredHistory = history.filter(item => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    const detectedFoods = item.detected_foods ? JSON.parse(item.detected_foods).join(" ") : ""
    const suggestion = item.suggestion || ""

    return detectedFoods.toLowerCase().includes(searchLower) ||
      suggestion.toLowerCase().includes(searchLower)
  })

  // Don't block rendering - show content immediately with cached data
  // Fresh data will load in background

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
            {settingsHistory.length === 0 ? (
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
                          <th className="pb-3 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {settingsHistory.map((record, index) => {
                          // Helper function to format field names for display
                          const formatFieldName = (fieldName: string): string => {
                            const fieldMap: Record<string, string> = {
                              'hasSickness': 'Health Condition',
                              'sicknessType': 'Condition Type',
                              'age': 'Age',
                              'gender': 'Gender',
                              'height': 'Height',
                              'weight': 'Weight',
                              'waist': 'Waist Circumference',
                              'activityLevel': 'Activity Level',
                              'goal': 'Health Goal',
                              'location': 'Location'
                            };
                            
                            // Remove " (removed)" suffix if present
                            const cleanField = fieldName.replace(' (removed)', '');
                            return fieldMap[cleanField] || cleanField
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^./, str => str.toUpperCase())
                              .trim();
                          };

                          // Filter out numbered removed items (like "0 (removed)", "1 (removed)", etc.)
                          const meaningfulFields = record.changed_fields 
                            ? record.changed_fields.filter((field: string) => {
                                // Filter out fields that are just numbers followed by " (removed)"
                                const isNumberedRemoved = /^\d+\s*\(removed\)$/.test(field);
                                return !isNumberedRemoved;
                              })
                            : [];

                          // Get only the meaningful saved data (exclude empty/null values and array indices)
                          const meaningfulData = record.settings_data 
                            ? Object.entries(record.settings_data).filter(([key, value]) => {
                                // Filter out numbered keys (array indices)
                                const isNumberKey = /^\d+$/.test(key);
                                // Filter out null, undefined, or empty string values
                                const hasValue = value !== null && value !== undefined && value !== '';
                                return !isNumberKey && hasValue;
                              })
                            : [];

                          // If no changed_fields but we have data, show all fields that have values
                          const fieldsToDisplay = meaningfulFields.length > 0 
                            ? meaningfulFields 
                            : meaningfulData.map(([key]) => key);

                          return (
                          <tr key={record.id || index} className="hover:bg-gray-50">
                            <td className="py-3 text-gray-600 whitespace-nowrap">
                              {formatDate(record.created_at)}
                            </td>
                            <td className="py-3">
                                {fieldsToDisplay.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                    {fieldsToDisplay.map((field: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800"
                                    >
                                        {formatFieldName(field)}
                                    </span>
                                  ))}
                                </div>
                                ) : (
                                  <span className="text-gray-500 italic">Settings updated</span>
                              )}
                            </td>
                            <td className="py-3">
                              <details className="cursor-pointer">
                                <summary className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                                    ► View details
                                </summary>
                                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs space-y-2">
                                    {meaningfulData.length > 0 ? (
                                      meaningfulData.map(([key, value]: [string, any]) => {
                                        // Format field names for display
                                        const fieldNameMap: Record<string, string> = {
                                          'hasSickness': 'Has Health Condition',
                                          'sicknessType': 'Condition Type',
                                          'age': 'Age',
                                          'gender': 'Gender',
                                          'height': 'Height (cm)',
                                          'weight': 'Weight (kg)',
                                          'waist': 'Waist Circumference (cm)',
                                          'activityLevel': 'Activity Level',
                                          'goal': 'Health Goal',
                                          'location': 'Location'
                                        };
                                        
                                        const formattedKey = fieldNameMap[key] || key
                                          .replace(/([A-Z])/g, ' $1')
                                          .replace(/^./, str => str.toUpperCase())
                                          .trim();
                                        
                                        // Format values for display
                                        let formattedValue = String(value);
                                        if (typeof value === 'boolean') {
                                          formattedValue = value ? 'Yes' : 'No';
                                        } else if (key === 'gender') {
                                          formattedValue = String(value).charAt(0).toUpperCase() + String(value).slice(1);
                                        } else if (key === 'activityLevel') {
                                          formattedValue = String(value)
                                            .split('_')
                                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                            .join(' ');
                                        } else if (key === 'goal') {
                                          formattedValue = String(value)
                                            .split('_')
                                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                            .join(' ');
                                        }

                                        return (
                                    <div key={key} className="flex justify-between gap-4">
                                            <span className="font-medium text-gray-700">{formattedKey}:</span>
                                            <span className="text-gray-600 text-right">{formattedValue}</span>
                                    </div>
                                        );
                                      })
                                    ) : (
                                      <p className="text-gray-500 italic">No saved data</p>
                                    )}
                                </div>
                              </details>
                            </td>
                              <td className="py-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteHistory(record.id)}
                                  disabled={deletingId === record.id}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Delete this entry"
                                >
                                  {deletingId === record.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </td>
                          </tr>
                          );
                        })}
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

