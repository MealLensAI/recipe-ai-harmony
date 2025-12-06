import { useState, useEffect, useCallback } from 'react';
import { TrialService, TrialInfo, SubscriptionInfo } from '@/lib/trialService';
import { safeGetItem, safeRemoveItem } from '@/lib/utils';

// LocalStorage cache keys
const TRIAL_CACHE_KEY = 'meallensai_trial_cache';
const TRIAL_CACHE_TIMESTAMP_KEY = 'meallensai_trial_cache_timestamp';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Helper functions for caching
const getCachedTrialData = (userId?: string): any | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    
    const cacheKey = userId ? `${TRIAL_CACHE_KEY}_${userId}` : TRIAL_CACHE_KEY;
    const timestampKey = userId ? `${TRIAL_CACHE_TIMESTAMP_KEY}_${userId}` : TRIAL_CACHE_TIMESTAMP_KEY;
    
    const cached = window.localStorage.getItem(cacheKey);
    const timestamp = window.localStorage.getItem(timestampKey);
    
    if (!cached || !timestamp) return null;
    
    const cacheAge = Date.now() - parseInt(timestamp, 10);
    if (cacheAge > CACHE_DURATION) {
      // Cache expired
      safeRemoveItem(cacheKey);
      safeRemoveItem(timestampKey);
      return null;
    }
    
    return JSON.parse(cached);
  } catch (error) {
    console.error('Error reading cached trial data:', error);
    return null;
  }
};

const setCachedTrialData = (data: any, userId?: string) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cacheKey = userId ? `${TRIAL_CACHE_KEY}_${userId}` : TRIAL_CACHE_KEY;
      const timestampKey = userId ? `${TRIAL_CACHE_TIMESTAMP_KEY}_${userId}` : TRIAL_CACHE_TIMESTAMP_KEY;
      window.localStorage.setItem(cacheKey, JSON.stringify(data));
      window.localStorage.setItem(timestampKey, Date.now().toString());
    }
  } catch (error) {
    console.error('Error caching trial data:', error);
  }
};

export const useTrial = () => {
  // Get user ID for cache key
  const userData = safeGetItem('user_data');
  const userId = userData ? JSON.parse(userData)?.uid : undefined;
  
  // Try to load from cache first for instant display
  const cachedData = getCachedTrialData(userId);
  
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(cachedData?.trialInfo || null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(cachedData?.subscriptionInfo || null);
  const [hasEverHadSubscription, setHasEverHadSubscription] = useState<boolean>(cachedData?.hasEverHadSubscription || false);
  const [canAccess, setCanAccess] = useState(cachedData?.canAccess ?? true); // Optimistic default
  const [isLoading, setIsLoading] = useState(false); // Start as false - don't block rendering

  const updateTrialInfo = useCallback(async () => {
    try {
      console.log('🔄 Starting trial status update...');

      // Fetch all backend data in parallel for speed
      const [backendResult, hasAccess] = await Promise.all([
        TrialService.fetchSubscriptionFromBackend(),
        TrialService.canAccessApp()
      ]);

      console.log('🔍 Backend trial data:', backendResult.trialInfo);

      // Extract data from single backend call
      // Note: Backend can return either snake_case or camelCase depending on the endpoint
      const trialData = backendResult.trialInfo;
      const info = trialData ? {
        isActive: trialData.isActive ?? !trialData.isExpired,
        startDate: new Date(trialData.startDate || trialData.start_date),
        endDate: new Date(trialData.endDate || trialData.end_date),
        isExpired: trialData.isExpired ?? (trialData.end_date ? new Date(trialData.end_date) < new Date() : false),
        remainingTime: trialData.remainingTime ?? trialData.remaining_time ?? 0,
        remainingHours: trialData.remainingHours ?? Math.floor((trialData.remaining_time || 0) / (1000 * 60 * 60)),
        remainingMinutes: trialData.remainingMinutes ?? Math.floor(((trialData.remaining_time || 0) % (1000 * 60 * 60)) / (1000 * 60))
      } : null;
      
      console.log('🔍 Parsed trial info:', info);
      
      const subInfo = backendResult.subscriptionInfo;
      const hasEverPaid = backendResult.hasEverHadSubscription || false;

      console.log('🔄 Trial status loaded:', {
        hasAccess,
        hasActiveSubscription: subInfo?.isActive,
        isTrialExpired: info?.isExpired,
        hasEverPaid,
        isLoading: false
      });

      setTrialInfo(info);
      setSubscriptionInfo(subInfo);
      setHasEverHadSubscription(hasEverPaid);
      setCanAccess(hasAccess);
      setIsLoading(false);
      
      // Cache the data for instant access next time
      setCachedTrialData({
        trialInfo: info,
        subscriptionInfo: subInfo,
        hasEverHadSubscription: hasEverPaid,
        canAccess: hasAccess
      }, userId);
    } catch (error) {
      console.error('Error updating trial info:', error);
      // On error, set loading to false immediately
      setTrialInfo(null);
      setSubscriptionInfo(null);
      setCanAccess(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initialize trial for new users (non-blocking)
    TrialService.initializeTrial();

    // Load subscription status in background - don't block rendering
    // Always update in background (cached data already loaded in state)
    updateTrialInfo().catch(console.error);

    // Update every 2 minutes (less frequent to reduce load)
    const interval = setInterval(() => {
      updateTrialInfo().catch(console.error);
    }, 120000);

    return () => clearInterval(interval);
  }, [updateTrialInfo]);

  const activateSubscription = useCallback(async () => {
    await TrialService.activateSubscription();
    await updateTrialInfo();
  }, [updateTrialInfo]);

  const activateSubscriptionForDays = useCallback(async (days: number) => {
    await TrialService.activateSubscriptionForDays(days);
    await updateTrialInfo();
  }, [updateTrialInfo]);

  const resetTrial = useCallback(() => {
    TrialService.resetTrial();
    updateTrialInfo();
  }, [updateTrialInfo]);

  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    await updateTrialInfo();
  }, [updateTrialInfo]);

  // Helper functions for subscription status
  const hasActiveSubscription = subscriptionInfo?.isActive ?? false;
  const isSubscriptionExpired = subscriptionInfo?.isExpired ?? false;

  // Get progress percentage (for subscription or trial)
  const [progressPercentage, setProgressPercentage] = useState(0);
  
  useEffect(() => {
    const updateProgress = async () => {
      if (subscriptionInfo && hasActiveSubscription) {
        setProgressPercentage(subscriptionInfo.progressPercentage);
      } else {
        const progress = await TrialService.getTrialProgress();
        setProgressPercentage(progress);
      }
    };
    updateProgress();
  }, [subscriptionInfo, hasActiveSubscription]);

  // Get formatted remaining time (for subscription or trial)
  const [formattedRemainingTime, setFormattedRemainingTime] = useState('Loading...');
  
  useEffect(() => {
    const updateFormattedTime = async () => {
      if (subscriptionInfo && hasActiveSubscription) {
        setFormattedRemainingTime(subscriptionInfo.formattedRemainingTime);
      } else {
        const formatted = await TrialService.getFormattedRemainingTime();
        setFormattedRemainingTime(formatted);
      }
    };
    updateFormattedTime();
  }, [subscriptionInfo, hasActiveSubscription, trialInfo]);

  return {
    trialInfo,
    subscriptionInfo,
    hasEverHadSubscription,
    canAccess,
    isLoading,
    isTrialExpired: trialInfo?.isExpired ?? false,
    hasActiveSubscription,
    isSubscriptionExpired,
    remainingTime: trialInfo?.remainingTime ?? 0,
    remainingHours: trialInfo?.remainingHours ?? 0,
    remainingMinutes: trialInfo?.remainingMinutes ?? 0,
    formattedRemainingTime,
    progressPercentage,
    trialProgress: progressPercentage,
    activateSubscription,
    activateSubscriptionForDays,
    resetTrial,
    updateTrialInfo,
    refreshStatus
  };
};
