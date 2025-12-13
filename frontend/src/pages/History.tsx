"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronDown, ArrowRight, Trash2 } from "lucide-react"
import { useAuth, safeGetItem, safeRemoveItem } from "@/lib/utils"
import { useAPI, APIError } from "@/lib/api"

const getSourceText = (recipeType: string) => {
  switch (recipeType) {
    case "food_detection":
      return "Food Detect"
    case "ingredient_detection":
      return "Ingredient Detect"
    case "health_meal":
      return "Health Meal"
    case "meal_plan":
      return "Meal Plan"
    default:
      return "Detection"
  }
}

const getItemName = (item: SharedRecipe) => {
  if (item.suggestion) return item.suggestion
  try {
    if (item.detected_foods) {
      const foods = JSON.parse(item.detected_foods)
      if (Array.isArray(foods) && foods.length > 0) {
        return foods[0] + (foods.length > 1 ? ` (+${foods.length - 1})` : '')
      }
    }
  } catch {}
  return "Unknown"
}

interface SharedRecipe {
  id: string
  recipe_type: "food_detection" | "ingredient_detection" | "health_meal" | "meal_plan"
  detected_foods?: string
  instructions?: string
  resources?: string
  suggestion?: string
  ingredients?: string
  created_at: string
  youtube_link?: string
  google_link?: string
  resources_link?: string
}

// LocalStorage cache keys
const HISTORY_CACHE_KEY = 'meallensai_history_cache'
const HISTORY_CACHE_TIMESTAMP_KEY = 'meallensai_history_cache_timestamp'
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

export function HistoryPage() {
  const navigate = useNavigate()
  
  const userData = safeGetItem('user_data');
  const userId = userData ? JSON.parse(userData)?.uid : undefined;
  
  const cachedHistory = getCachedHistory(userId);
  
  const [history, setHistory] = useState<SharedRecipe[]>(cachedHistory || [])
  const [settingsHistory, setSettingsHistory] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string>("ingredient_detection")
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { api } = useAPI()

  useEffect(() => {
    const fetchHistory = async () => {
      if (authLoading || !isAuthenticated) {
        return
      }

      try {
        const result = await api.getDetectionHistory()

        if (result.status === 'success') {
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
          setCachedHistory(historyData, userId)
        } else {
          if (!cachedHistory) {
            setError(result.message || 'Failed to load history.')
          }
        }
      } catch (err) {
        console.error("Error fetching history:", err)
        if (!cachedHistory) {
          if (err instanceof APIError) {
            setError(err.message)
          } else {
            setError("Failed to load history. Please try again later.")
          }
        }
      }
    }
    
    fetchHistory().catch(console.error)
  }, [isAuthenticated, authLoading, api, userId, cachedHistory])

  // Fetch settings history when health_history tab is active
  useEffect(() => {
    const fetchSettingsHistory = async () => {
      if (activeFilter !== "health_history" || !isAuthenticated || authLoading) {
        return
      }

      try {
        console.log('🔄 Fetching settings history...')
        const result = await api.getUserSettingsHistory('health_profile', 50)
        console.log('📦 Settings history API response:', result)
        
        if ((result as any).status === 'success') {
          // Try multiple possible response structures
          const historyData = (result as any).history || 
                              (result as any).data?.history || 
                              (result as any).data || 
                              []
          console.log('✅ Settings history loaded:', historyData.length, 'records')
          console.log('📋 Settings history data:', historyData)
          setSettingsHistory(Array.isArray(historyData) ? historyData : [])
        } else {
          console.warn('⚠️ Settings history API returned non-success:', result)
          setSettingsHistory([])
        }
      } catch (err) {
        console.error("❌ Error fetching settings history:", err)
        setSettingsHistory([])
      }
    }

    fetchSettingsHistory().catch(console.error)
  }, [activeFilter, isAuthenticated, authLoading, api])

  const handleDeleteHistory = async (recordId: string) => {
    if (!window.confirm('Are you sure you want to delete this settings history entry? This action cannot be undone.')) {
      return
    }

    setDeletingId(recordId)
    try {
      const result = await api.deleteSettingsHistory(recordId)
      if ((result as any).status === 'success') {
        setSettingsHistory(prev => prev.filter(record => record.id !== recordId))
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

  if (!isAuthenticated && !authLoading) {
    navigate('/login')
    return null
  }

  // Filter history based on active filter
  const filteredHistory = history.filter(item => {
    if (activeFilter === "ingredient_detection") return item.recipe_type === "ingredient_detection"
    return false // health_history shows settings history, not detection history
  })

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header 
        className="px-8 h-[105px] flex items-center border-b"
        style={{ 
          backgroundColor: '#F9FBFE',
          borderColor: '#F6FAFE',
          boxShadow: '0px 2px 2px rgba(227, 227, 227, 0.25)'
        }}
      >
        <div className="flex items-center justify-between w-full">
          <h1 className="text-[32px] font-medium text-[#2A2A2A] tracking-[0.03em] leading-[130%]" style={{ fontFamily: "'Work Sans', sans-serif" }}>
            History
          </h1>
          
          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center h-[56px] gap-3 px-5 rounded-[18px] border border-[#E7E7E7] bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 font-semibold text-sm border border-blue-100">
                {(user?.displayName || user?.email?.split('@')[0] || 'U').substring(0, 2).toUpperCase()}
              </div>
              <span className="text-[16px] font-medium text-gray-600 hidden sm:block">
                {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </span>
              <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showProfileDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowProfileDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-[15px] shadow-lg border border-gray-200 py-3 z-50">
                  <a href="/settings" className="block px-5 py-2.5 text-[15px] text-gray-700 hover:bg-gray-50">Settings</a>
                  <a href="/planner" className="block px-5 py-2.5 text-[15px] text-gray-700 hover:bg-gray-50">Diet Planner</a>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-8 py-8">
        {/* Filter Tabs - Only Ingredient Detections and Health History */}
        <div className="flex justify-start mb-8">
          <div className="inline-flex items-center bg-white border border-[#E7E7E7] rounded-[15px] p-1 gap-[10px]">
            <button
              onClick={() => setActiveFilter("ingredient_detection")}
              className={`px-[10px] py-[10px] rounded-[10px] text-[14px] font-medium transition-all duration-200 border-2 ${
                activeFilter === "ingredient_detection"
                  ? 'bg-[#F6FAFE] text-[#1A76E3] border-[#1A76E3]'
                  : 'text-gray-500 hover:text-gray-700 border-transparent'
              }`}
              style={{ fontFamily: "'Work Sans', sans-serif" }}
            >
              Ingredient Detections
            </button>
            <button
              onClick={() => setActiveFilter("health_history")}
              className={`px-[10px] py-[10px] rounded-[10px] text-[14px] font-medium transition-all duration-200 border-2 ${
                activeFilter === "health_history"
                  ? 'bg-[#F6FAFE] text-[#1A76E3] border-[#1A76E3]'
                  : 'text-gray-500 hover:text-gray-700 border-transparent'
              }`}
              style={{ fontFamily: "'Work Sans', sans-serif" }}
            >
              Health History
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!error && ((activeFilter === "ingredient_detection" && filteredHistory.length === 0) || (activeFilter === "health_history" && settingsHistory.length === 0)) && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No history found</p>
            <p className="text-gray-400 mt-2">
              {activeFilter === "ingredient_detection" 
                ? "Start detecting ingredients to see your history here"
                : "Update your health information to see history here"}
            </p>
          </div>
        )}

        {/* History Table */}
        {!error && ((activeFilter === "ingredient_detection" && filteredHistory.length > 0) || (activeFilter === "health_history" && settingsHistory.length > 0)) && (
          <div className="bg-white border border-[#E7E7E7] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F7F7F7] border-b border-[#E7E7E7]">
                  {activeFilter === "health_history" ? (
                    <>
                      <th 
                        className="text-left"
                        style={{ 
                          padding: '10px 12px',
                          fontFamily: "'Work Sans', sans-serif",
                          fontSize: '16px',
                          fontWeight: 400,
                          lineHeight: '130%',
                          letterSpacing: '3%',
                          color: '#414141'
                        }}
                      >
                        DATE & TIME
                      </th>
                      <th 
                        className="text-left"
                        style={{ 
                          padding: '10px 12px',
                          fontFamily: "'Work Sans', sans-serif",
                          fontSize: '16px',
                          fontWeight: 400,
                          lineHeight: '130%',
                          letterSpacing: '3%',
                          color: '#414141'
                        }}
                      >
                        CHANGES MADE
                      </th>
                      <th 
                        className="text-left"
                        style={{ 
                          padding: '10px 12px',
                          fontFamily: "'Work Sans', sans-serif",
                          fontSize: '16px',
                          fontWeight: 400,
                          lineHeight: '130%',
                          letterSpacing: '3%',
                          color: '#414141'
                        }}
                      >
                        DETAILS
                      </th>
                      <th 
                        className="text-left"
                        style={{ 
                          padding: '10px 12px',
                          fontFamily: "'Work Sans', sans-serif",
                          fontSize: '16px',
                          fontWeight: 400,
                          lineHeight: '130%',
                          letterSpacing: '3%',
                          color: '#414141'
                        }}
                      >
                        ACTIONS
                      </th>
                    </>
                  ) : (
                    <>
                      <th 
                        className="text-left"
                        style={{ 
                          padding: '10px 12px',
                          fontFamily: "'Work Sans', sans-serif",
                          fontSize: '16px',
                          fontWeight: 400,
                          lineHeight: '130%',
                          letterSpacing: '3%',
                          color: '#414141'
                        }}
                      >
                        Name
                      </th>
                      <th 
                        className="text-left"
                        style={{ 
                          padding: '10px 12px',
                          fontFamily: "'Work Sans', sans-serif",
                          fontSize: '16px',
                          fontWeight: 400,
                          lineHeight: '130%',
                          letterSpacing: '3%',
                          color: '#414141'
                        }}
                      >
                        Source
                      </th>
                      <th 
                        className="text-left"
                        style={{ 
                          padding: '10px 12px',
                          fontFamily: "'Work Sans', sans-serif",
                          fontSize: '16px',
                          fontWeight: 400,
                          lineHeight: '130%',
                          letterSpacing: '3%',
                          color: '#414141'
                        }}
                      >
                        Date
                      </th>
                      <th 
                        className="text-left"
                        style={{ 
                          padding: '10px 12px',
                          fontFamily: "'Work Sans', sans-serif",
                          fontSize: '16px',
                          fontWeight: 400,
                          lineHeight: '130%',
                          letterSpacing: '3%',
                          color: '#414141'
                        }}
                      >
                        Action
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {activeFilter === "ingredient_detection" && filteredHistory.map((item, index) => (
                  <tr 
                    key={item.id || index} 
                    className="border-b border-[#E7E7E7] last:border-b-0 hover:bg-gray-50 transition-colors"
                  >
                    <td style={{ padding: '10px 12px' }}>
                      <span 
                        className="text-gray-800"
                        style={{ 
                          fontFamily: "'Work Sans', sans-serif",
                          fontSize: '16px',
                          fontWeight: 400,
                          lineHeight: '130%',
                          letterSpacing: '3%',
                          color: '#414141'
                        }}
                      >
                        {getItemName(item)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span 
                        className="text-gray-600"
                        style={{ 
                          fontFamily: "'Work Sans', sans-serif",
                          fontSize: '16px',
                          fontWeight: 400,
                          lineHeight: '130%',
                          letterSpacing: '3%'
                        }}
                      >
                        {getSourceText(item.recipe_type)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span 
                        className="text-gray-600"
                        style={{ 
                          fontFamily: "'Work Sans', sans-serif",
                          fontSize: '16px',
                          fontWeight: 400,
                          lineHeight: '130%',
                          letterSpacing: '3%'
                        }}
                      >
                        {formatDate(item.created_at)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <button
                        onClick={() => navigate(`/history/${item.id}`)}
                        className="flex items-center gap-2 text-[#1A76E3] font-medium hover:underline"
                        style={{ 
                          fontFamily: "'Work Sans', sans-serif",
                          fontSize: '16px',
                          fontWeight: 400,
                          lineHeight: '130%',
                          letterSpacing: '3%'
                        }}
                      >
                        View Details
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {activeFilter === "health_history" && settingsHistory.map((record, index) => {
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
                    const cleanField = fieldName.replace(' (removed)', '');
                    return fieldMap[cleanField] || cleanField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
                  };

                  const meaningfulFields = record.changed_fields 
                    ? record.changed_fields.filter((field: any) => {
                        const fieldStr = String(field);
                        const isNumericIndex = /^\d+$/.test(fieldStr);
                        const isNumberedRemoved = /^\d+\s*\(removed\)$/.test(fieldStr);
                        return !isNumericIndex && !isNumberedRemoved && typeof field === 'string';
                      })
                    : [];

                  return (
                    <tr 
                      key={record.id || index} 
                      className="border-b border-[#E7E7E7] last:border-b-0 hover:bg-gray-50 transition-colors"
                    >
                      <td style={{ padding: '10px 12px' }}>
                        <span 
                          className="text-gray-600"
                          style={{ 
                            fontFamily: "'Work Sans', sans-serif",
                            fontSize: '16px',
                            fontWeight: 400,
                            lineHeight: '130%',
                            letterSpacing: '3%'
                          }}
                        >
                          {formatDateTime(record.created_at)}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div className="flex flex-wrap gap-2">
                          {meaningfulFields.length > 0 ? (
                            meaningfulFields.map((field: string, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
                                style={{
                                  backgroundColor: '#FFF4E6',
                                  color: '#FF8C00',
                                  border: '1px solid #FFE5CC'
                                }}
                              >
                                {formatFieldName(field)}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500 italic">Settings updated</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <details className="cursor-pointer" onToggle={(e) => {
                          const target = e.target as HTMLDetailsElement;
                          const icon = target.querySelector('svg');
                          if (icon) {
                            if (target.open) {
                              icon.classList.add('rotate-90');
                            } else {
                              icon.classList.remove('rotate-90');
                            }
                          }
                        }}>
                          <summary className="text-[#1A76E3] hover:text-blue-800 text-sm font-medium flex items-center gap-1.5 list-none cursor-pointer">
                            <ChevronDown className="h-4 w-4 text-[#1A76E3] transition-transform" />
                            View details
                          </summary>
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs space-y-2">
                            {(() => {
                              const details = record.settings_data || {};
                              const meaningfulData = Object.entries(details)
                                .filter(([key]) => !/^\d+$/.test(key) && key !== 'id' && details[key] !== null && details[key] !== undefined && details[key] !== '')
                                .map(([key, value]: [string, any]) => {
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

                                  let formattedValue = String(value);
                                  if (typeof value === 'boolean') {
                                    formattedValue = value ? 'Yes' : 'No';
                                  } else if (key === 'gender') {
                                    formattedValue = String(value).charAt(0).toUpperCase() + String(value).slice(1);
                                  } else if (key === 'activityLevel' || key === 'goal') {
                                    formattedValue = String(value)
                                      .split('_')
                                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                      .join(' ');
                                  }

                                  return [formattedKey, formattedValue];
                                });

                              return meaningfulData.length > 0 ? (
                                meaningfulData.map((entry, idx: number) => {
                                  const [key, value] = entry;
                                  return (
                                    <div key={idx} className="flex justify-between gap-4">
                                      <span className="font-medium text-gray-700">{key}:</span>
                                      <span className="text-gray-600 text-right">{value}</span>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-gray-500 italic">No saved data</p>
                              );
                            })()}
                          </div>
                        </details>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <button
                          onClick={() => handleDeleteHistory(record.id)}
                          disabled={deletingId === record.id}
                          className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                          title="Delete this entry"
                        >
                          {deletingId === record.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default HistoryPage
