import { useState, useEffect, useCallback } from 'react';
import { TrialService, TrialInfo, SubscriptionInfo } from '@/lib/trialService';

export const useTrial = () => {
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [hasEverHadSubscription, setHasEverHadSubscription] = useState<boolean>(false);
  const [canAccess, setCanAccess] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

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
    // Initialize trial for new users
    TrialService.initializeTrial();

    // Set loading to true before initial update
    setIsLoading(true);

    // Initial update
    updateTrialInfo();

    // Update every minute
    const interval = setInterval(updateTrialInfo, 60000);

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
