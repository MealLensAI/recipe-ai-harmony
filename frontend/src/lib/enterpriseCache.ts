// Enterprise Dashboard Caching Utility
// Provides localStorage caching for enterprise data to prevent empty screens on load

import { safeGetItem, safeSetItem, safeRemoveItem } from './utils';

// Cache keys
const ENTERPRISE_CACHE_KEY = 'meallensai_enterprise_cache';
const ENTERPRISE_CACHE_TIMESTAMP_KEY = 'meallensai_enterprise_cache_timestamp';
const ENTERPRISE_DETAILS_CACHE_KEY = 'meallensai_enterprise_details_cache';
const ENTERPRISE_DETAILS_CACHE_TIMESTAMP_KEY = 'meallensai_enterprise_details_cache_timestamp';
const USER_HEALTH_SETTINGS_CACHE_KEY = 'meallensai_user_health_settings_cache';
const USER_HEALTH_SETTINGS_CACHE_TIMESTAMP_KEY = 'meallensai_user_health_settings_cache_timestamp';
const USER_HEALTH_HISTORY_CACHE_KEY = 'meallensai_user_health_history_cache';
const USER_HEALTH_HISTORY_CACHE_TIMESTAMP_KEY = 'meallensai_user_health_history_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface CachedEnterpriseData {
  enterprises: any[];
  selectedEnterpriseId?: string;
}

export interface CachedEnterpriseDetails {
  users: any[];
  invitations: any[];
  statistics: any;
  enterpriseId: string;
}

export interface CachedUserHealthSettings {
  userId: string;
  enterpriseId: string;
  settings: any;
}

export interface CachedUserHealthHistory {
  userId: string;
  enterpriseId: string;
  history: any[];
}

// Get cached enterprises list
export const getCachedEnterprises = (userId?: string): CachedEnterpriseData | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    
    const cacheKey = userId ? `${ENTERPRISE_CACHE_KEY}_${userId}` : ENTERPRISE_CACHE_KEY;
    const timestampKey = userId ? `${ENTERPRISE_CACHE_TIMESTAMP_KEY}_${userId}` : ENTERPRISE_CACHE_TIMESTAMP_KEY;
    
    const cached = safeGetItem(cacheKey);
    const timestamp = safeGetItem(timestampKey);
    
    if (!cached || !timestamp) return null;
    
    const cacheAge = Date.now() - parseInt(timestamp, 10);
    if (cacheAge > CACHE_DURATION) {
      safeRemoveItem(cacheKey);
      safeRemoveItem(timestampKey);
      return null;
    }
    
    return JSON.parse(cached);
  } catch (error) {
    console.error('Error reading cached enterprises:', error);
    return null;
  }
};

// Set cached enterprises list
export const setCachedEnterprises = (data: CachedEnterpriseData, userId?: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cacheKey = userId ? `${ENTERPRISE_CACHE_KEY}_${userId}` : ENTERPRISE_CACHE_KEY;
      const timestampKey = userId ? `${ENTERPRISE_CACHE_TIMESTAMP_KEY}_${userId}` : ENTERPRISE_CACHE_TIMESTAMP_KEY;
      safeSetItem(cacheKey, JSON.stringify(data));
      safeSetItem(timestampKey, Date.now().toString());
    }
  } catch (error) {
    console.error('Error caching enterprises:', error);
  }
};

// Get cached enterprise details (users, invitations, statistics)
export const getCachedEnterpriseDetails = (enterpriseId: string, userId?: string): CachedEnterpriseDetails | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    
    const cacheKey = userId 
      ? `${ENTERPRISE_DETAILS_CACHE_KEY}_${enterpriseId}_${userId}` 
      : `${ENTERPRISE_DETAILS_CACHE_KEY}_${enterpriseId}`;
    const timestampKey = userId 
      ? `${ENTERPRISE_DETAILS_CACHE_TIMESTAMP_KEY}_${enterpriseId}_${userId}` 
      : `${ENTERPRISE_DETAILS_CACHE_TIMESTAMP_KEY}_${enterpriseId}`;
    
    const cached = safeGetItem(cacheKey);
    const timestamp = safeGetItem(timestampKey);
    
    if (!cached || !timestamp) return null;
    
    const cacheAge = Date.now() - parseInt(timestamp, 10);
    if (cacheAge > CACHE_DURATION) {
      safeRemoveItem(cacheKey);
      safeRemoveItem(timestampKey);
      return null;
    }
    
    return JSON.parse(cached);
  } catch (error) {
    console.error('Error reading cached enterprise details:', error);
    return null;
  }
};

// Set cached enterprise details
export const setCachedEnterpriseDetails = (data: CachedEnterpriseDetails, userId?: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cacheKey = userId 
        ? `${ENTERPRISE_DETAILS_CACHE_KEY}_${data.enterpriseId}_${userId}` 
        : `${ENTERPRISE_DETAILS_CACHE_KEY}_${data.enterpriseId}`;
      const timestampKey = userId 
        ? `${ENTERPRISE_DETAILS_CACHE_TIMESTAMP_KEY}_${data.enterpriseId}_${userId}` 
        : `${ENTERPRISE_DETAILS_CACHE_TIMESTAMP_KEY}_${data.enterpriseId}`;
      safeSetItem(cacheKey, JSON.stringify(data));
      safeSetItem(timestampKey, Date.now().toString());
    }
  } catch (error) {
    console.error('Error caching enterprise details:', error);
  }
};

// Get cached user health settings
export const getCachedUserHealthSettings = (userId: string, enterpriseId: string, ownerUserId?: string): CachedUserHealthSettings | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    
    const cacheKey = ownerUserId 
      ? `${USER_HEALTH_SETTINGS_CACHE_KEY}_${enterpriseId}_${userId}_${ownerUserId}` 
      : `${USER_HEALTH_SETTINGS_CACHE_KEY}_${enterpriseId}_${userId}`;
    const timestampKey = ownerUserId 
      ? `${USER_HEALTH_SETTINGS_CACHE_TIMESTAMP_KEY}_${enterpriseId}_${userId}_${ownerUserId}` 
      : `${USER_HEALTH_SETTINGS_CACHE_TIMESTAMP_KEY}_${enterpriseId}_${userId}`;
    
    const cached = safeGetItem(cacheKey);
    const timestamp = safeGetItem(timestampKey);
    
    if (!cached || !timestamp) return null;
    
    const cacheAge = Date.now() - parseInt(timestamp, 10);
    if (cacheAge > CACHE_DURATION) {
      safeRemoveItem(cacheKey);
      safeRemoveItem(timestampKey);
      return null;
    }
    
    return JSON.parse(cached);
  } catch (error) {
    console.error('Error reading cached user health settings:', error);
    return null;
  }
};

// Set cached user health settings
export const setCachedUserHealthSettings = (data: CachedUserHealthSettings, ownerUserId?: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cacheKey = ownerUserId 
        ? `${USER_HEALTH_SETTINGS_CACHE_KEY}_${data.enterpriseId}_${data.userId}_${ownerUserId}` 
        : `${USER_HEALTH_SETTINGS_CACHE_KEY}_${data.enterpriseId}_${data.userId}`;
      const timestampKey = ownerUserId 
        ? `${USER_HEALTH_SETTINGS_CACHE_TIMESTAMP_KEY}_${data.enterpriseId}_${data.userId}_${ownerUserId}` 
        : `${USER_HEALTH_SETTINGS_CACHE_TIMESTAMP_KEY}_${data.enterpriseId}_${data.userId}`;
      safeSetItem(cacheKey, JSON.stringify(data));
      safeSetItem(timestampKey, Date.now().toString());
    }
  } catch (error) {
    console.error('Error caching user health settings:', error);
  }
};

// Get cached user health history
export const getCachedUserHealthHistory = (userId: string, enterpriseId: string, ownerUserId?: string): CachedUserHealthHistory | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    
    const cacheKey = ownerUserId 
      ? `${USER_HEALTH_HISTORY_CACHE_KEY}_${enterpriseId}_${userId}_${ownerUserId}` 
      : `${USER_HEALTH_HISTORY_CACHE_KEY}_${enterpriseId}_${userId}`;
    const timestampKey = ownerUserId 
      ? `${USER_HEALTH_HISTORY_CACHE_TIMESTAMP_KEY}_${enterpriseId}_${userId}_${ownerUserId}` 
      : `${USER_HEALTH_HISTORY_CACHE_TIMESTAMP_KEY}_${enterpriseId}_${userId}`;
    
    const cached = safeGetItem(cacheKey);
    const timestamp = safeGetItem(timestampKey);
    
    if (!cached || !timestamp) return null;
    
    const cacheAge = Date.now() - parseInt(timestamp, 10);
    if (cacheAge > CACHE_DURATION) {
      safeRemoveItem(cacheKey);
      safeRemoveItem(timestampKey);
      return null;
    }
    
    return JSON.parse(cached);
  } catch (error) {
    console.error('Error reading cached user health history:', error);
    return null;
  }
};

// Set cached user health history
export const setCachedUserHealthHistory = (data: CachedUserHealthHistory, ownerUserId?: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cacheKey = ownerUserId 
        ? `${USER_HEALTH_HISTORY_CACHE_KEY}_${data.enterpriseId}_${data.userId}_${ownerUserId}` 
        : `${USER_HEALTH_HISTORY_CACHE_KEY}_${data.enterpriseId}_${data.userId}`;
      const timestampKey = ownerUserId 
        ? `${USER_HEALTH_HISTORY_CACHE_TIMESTAMP_KEY}_${data.enterpriseId}_${data.userId}_${ownerUserId}` 
        : `${USER_HEALTH_HISTORY_CACHE_TIMESTAMP_KEY}_${data.enterpriseId}_${data.userId}`;
      safeSetItem(cacheKey, JSON.stringify(data));
      safeSetItem(timestampKey, Date.now().toString());
    }
  } catch (error) {
    console.error('Error caching user health history:', error);
  }
};

// Clear all enterprise cache for a user
export const clearEnterpriseCache = (userId?: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const prefix = userId ? `${ENTERPRISE_CACHE_KEY}_${userId}` : ENTERPRISE_CACHE_KEY;
      const timestampPrefix = userId ? `${ENTERPRISE_CACHE_TIMESTAMP_KEY}_${userId}` : ENTERPRISE_CACHE_TIMESTAMP_KEY;
      
      // Clear enterprises cache
      safeRemoveItem(prefix);
      safeRemoveItem(timestampPrefix);
      
      // Clear all enterprise details caches (we'd need to iterate, but for simplicity, just clear common patterns)
      if (userId) {
        safeRemoveItem(`${ENTERPRISE_DETAILS_CACHE_KEY}_${userId}`);
        safeRemoveItem(`${ENTERPRISE_DETAILS_CACHE_TIMESTAMP_KEY}_${userId}`);
      }
    }
  } catch (error) {
    console.error('Error clearing enterprise cache:', error);
  }
};

