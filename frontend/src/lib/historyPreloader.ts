/**
 * History Preloader Utility
 * Pre-loads history data during login to prevent empty screens
 */

import { api } from './api';
import { safeGetItem } from './utils';

const HISTORY_CACHE_KEY = 'meallensai_history_cache';
const HISTORY_CACHE_TIMESTAMP_KEY = 'meallensai_history_cache_timestamp';
const SETTINGS_HISTORY_CACHE_KEY = 'meallensai_settings_history_cache';
const SETTINGS_HISTORY_CACHE_TIMESTAMP_KEY = 'meallensai_settings_history_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface SharedRecipe {
  id: string;
  recipe_type: "food_detection" | "ingredient_detection" | "health_meal" | "meal_plan";
  detected_foods?: string;
  instructions?: string;
  resources?: string;
  suggestion?: string;
  ingredients?: string;
  created_at: string;
  youtube_link?: string;
  google_link?: string;
  resources_link?: string;
}

/**
 * Preload detection history and cache it
 * This should be called during login to prevent empty screens
 */
export async function preloadHistory(): Promise<void> {
  try {
    const userData = safeGetItem('user_data');
    const userId = userData ? JSON.parse(userData)?.uid : undefined;
    
    // Check if we have fresh cached data
    const cacheKey = userId ? `${HISTORY_CACHE_KEY}_${userId}` : HISTORY_CACHE_KEY;
    const timestampKey = userId ? `${HISTORY_CACHE_TIMESTAMP_KEY}_${userId}` : HISTORY_CACHE_TIMESTAMP_KEY;
    
    const cached = window.localStorage.getItem(cacheKey);
    const timestamp = window.localStorage.getItem(timestampKey);
    
    // If we have fresh cache (less than 5 minutes old), skip fetching
    if (cached && timestamp) {
      const cacheAge = Date.now() - parseInt(timestamp, 10);
      if (cacheAge < CACHE_DURATION) {
        console.log('[HistoryPreloader] Using fresh cache, skipping fetch');
        return;
      }
    }
    
    console.log('[HistoryPreloader] Preloading history data...');
    
    // Fetch history in background (don't await - fire and forget)
    const fetchPromise = api.getDetectionHistory().then((result) => {
      if (result.status === 'success') {
        let historyData: any[] = [];
        const resultAny = result as any;
        
        if (resultAny.detection_history) {
          historyData = resultAny.detection_history;
        } else if (resultAny.data?.detection_history) {
          historyData = resultAny.data.detection_history;
        } else if (Array.isArray(resultAny.data)) {
          historyData = resultAny.data;
        } else if (resultAny.data) {
          historyData = [resultAny.data];
        }
        
        // Cache the data
        try {
          window.localStorage.setItem(cacheKey, JSON.stringify(historyData));
          window.localStorage.setItem(timestampKey, Date.now().toString());
          console.log('[HistoryPreloader] ✅ History preloaded and cached:', historyData.length, 'items');
        } catch (error) {
          console.error('[HistoryPreloader] Error caching history:', error);
        }
      } else {
        console.warn('[HistoryPreloader] Failed to preload history:', result.message);
      }
    }).catch((error) => {
      console.error('[HistoryPreloader] Error preloading history:', error);
      // Don't throw - this is a background operation
    });
    
    // Also preload settings history
    const settingsPromise = api.getUserSettingsHistory('health_profile', 50).then((result: any) => {
      if (result.status === 'success') {
        const historyData = result.history || result.data?.history || result.data || [];
        
        const settingsCacheKey = userId 
          ? `${SETTINGS_HISTORY_CACHE_KEY}_${userId}` 
          : SETTINGS_HISTORY_CACHE_KEY;
        const settingsTimestampKey = userId 
          ? `${SETTINGS_HISTORY_CACHE_TIMESTAMP_KEY}_${userId}` 
          : SETTINGS_HISTORY_CACHE_TIMESTAMP_KEY;
        
        try {
          window.localStorage.setItem(settingsCacheKey, JSON.stringify(historyData));
          window.localStorage.setItem(settingsTimestampKey, Date.now().toString());
          console.log('[HistoryPreloader] ✅ Settings history preloaded and cached:', historyData.length, 'items');
        } catch (error) {
          console.error('[HistoryPreloader] Error caching settings history:', error);
        }
      }
    }).catch((error) => {
      console.error('[HistoryPreloader] Error preloading settings history:', error);
    });
    
    // Wait for both to complete (but don't block)
    Promise.allSettled([fetchPromise, settingsPromise]).then(() => {
      console.log('[HistoryPreloader] ✅ All history data preloaded');
    });
    
  } catch (error) {
    console.error('[HistoryPreloader] Error in preloadHistory:', error);
    // Don't throw - this is a background operation
  }
}

/**
 * Get cached history (used by History page)
 */
export function getCachedHistory(userId?: string): SharedRecipe[] | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    
    const cacheKey = userId ? `${HISTORY_CACHE_KEY}_${userId}` : HISTORY_CACHE_KEY;
    const timestampKey = userId ? `${HISTORY_CACHE_TIMESTAMP_KEY}_${userId}` : HISTORY_CACHE_TIMESTAMP_KEY;
    
    const cached = window.localStorage.getItem(cacheKey);
    const timestamp = window.localStorage.getItem(timestampKey);
    
    if (!cached || !timestamp) return null;
    
    const cacheAge = Date.now() - parseInt(timestamp, 10);
    if (cacheAge > CACHE_DURATION) {
      // Cache expired, but still return it for immediate display
      // Fresh data will be fetched in background
      return JSON.parse(cached);
    }
    
    return JSON.parse(cached);
  } catch (error) {
    console.error('[HistoryPreloader] Error reading cached history:', error);
    return null;
  }
}

/**
 * Get cached settings history
 */
export function getCachedSettingsHistory(userId?: string): any[] | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    
    const cacheKey = userId 
      ? `${SETTINGS_HISTORY_CACHE_KEY}_${userId}` 
      : SETTINGS_HISTORY_CACHE_KEY;
    const timestampKey = userId 
      ? `${SETTINGS_HISTORY_CACHE_TIMESTAMP_KEY}_${userId}` 
      : SETTINGS_HISTORY_CACHE_TIMESTAMP_KEY;
    
    const cached = window.localStorage.getItem(cacheKey);
    const timestamp = window.localStorage.getItem(timestampKey);
    
    if (!cached || !timestamp) return null;
    
    const cacheAge = Date.now() - parseInt(timestamp, 10);
    if (cacheAge > CACHE_DURATION) {
      // Cache expired, but still return it for immediate display
      return JSON.parse(cached);
    }
    
    return JSON.parse(cached);
  } catch (error) {
    console.error('[HistoryPreloader] Error reading cached settings history:', error);
    return null;
  }
}

