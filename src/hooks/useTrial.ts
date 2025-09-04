import { useState, useEffect, useCallback } from 'react';
import { TrialService, TrialInfo, SubscriptionInfo, UserAccessStatus } from '@/lib/trialService';

export const useTrial = () => {
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [userAccessStatus, setUserAccessStatus] = useState<UserAccessStatus | null>(null);
  const [canAccess, setCanAccess] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const updateTrialInfo = useCallback(async () => {
    try {
      // Get comprehensive user access status
      const accessStatus = await TrialService.getUserAccessStatus();
      const info = TrialService.getTrialInfo();
      const hasAccess = TrialService.canAccessApp();

      setTrialInfo(info);
      setSubscriptionInfo(accessStatus.subscriptionInfo);
      setUserAccessStatus(accessStatus);
      setCanAccess(hasAccess);
      setIsLoading(false);
    } catch (error) {
      console.error('Error updating trial info:', error);
      // Fallback to basic trial info
      const info = TrialService.getTrialInfo();
      const hasAccess = TrialService.canAccessApp();

      setTrialInfo(info);
      setCanAccess(hasAccess);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initialize trial for new users
    TrialService.initializeTrial();

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

  // Helper functions for subscription status
  const hasActiveSubscription = subscriptionInfo?.isActive ?? false;
  const isSubscriptionExpired = subscriptionInfo?.isExpired ?? false;

  // Get progress percentage (for subscription or trial)
  const getProgressPercentage = () => {
    if (subscriptionInfo && hasActiveSubscription) {
      return subscriptionInfo.progressPercentage;
    }
    return TrialService.getTrialProgress();
  };

  // Get formatted remaining time (for subscription or trial)
  const getFormattedRemainingTime = () => {
    if (subscriptionInfo && hasActiveSubscription) {
      return subscriptionInfo.formattedRemainingTime;
    }
    return TrialService.getFormattedRemainingTime();
  };

  return {
    trialInfo,
    subscriptionInfo,
    userAccessStatus,
    canAccess,
    isLoading,
    isTrialExpired: trialInfo?.isExpired ?? false,
    hasActiveSubscription,
    isSubscriptionExpired,
    remainingTime: trialInfo?.remainingTime ?? 0,
    remainingHours: trialInfo?.remainingHours ?? 0,
    remainingMinutes: trialInfo?.remainingMinutes ?? 0,
    formattedRemainingTime: getFormattedRemainingTime(),
    progressPercentage: getProgressPercentage(),
    trialProgress: TrialService.getTrialProgress(),
    activateSubscription,
    activateSubscriptionForDays,
    resetTrial,
    updateTrialInfo
  };
};
