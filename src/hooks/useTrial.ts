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
      // Add a longer delay to ensure smooth loading experience and prevent flash
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('🔄 Starting trial status update...');

      // Get trial info from backend (NOT localStorage)
      const info = await TrialService.getTrialInfo();

      // Get subscription info ONLY from backend
      const subInfo = await TrialService.getSubscriptionInfo();

      // Get hasEverHadSubscription from backend
      const backendResult = await TrialService.fetchSubscriptionFromBackend();
      const hasEverPaid = backendResult.hasEverHadSubscription || false;

      // Check access (this will also fetch from backend)
      const hasAccess = await TrialService.canAccessApp();

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
      // Fallback to basic trial info from backend
      const info = await TrialService.getTrialInfo();
      const subInfo = await TrialService.getSubscriptionInfo();
      const hasAccess = await TrialService.canAccessApp();

      setTrialInfo(info);
      setSubscriptionInfo(subInfo);
      setCanAccess(hasAccess);
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
