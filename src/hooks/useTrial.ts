import { useState, useEffect, useCallback } from 'react';
import { TrialService, TrialInfo } from '@/lib/trialService';

export const useTrial = () => {
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [canAccess, setCanAccess] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const updateTrialInfo = useCallback(() => {
    const info = TrialService.getTrialInfo();
    const hasAccess = TrialService.canAccessApp();
    
    setTrialInfo(info);
    setCanAccess(hasAccess);
    setIsLoading(false);
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

  const activateSubscription = useCallback(() => {
    TrialService.activateSubscription();
    updateTrialInfo();
  }, [updateTrialInfo]);

  const resetTrial = useCallback(() => {
    TrialService.resetTrial();
    updateTrialInfo();
  }, [updateTrialInfo]);

  return {
    trialInfo,
    canAccess,
    isLoading,
    isTrialExpired: trialInfo?.isExpired ?? false,
    hasActiveSubscription: TrialService.hasActiveSubscription(),
    remainingTime: trialInfo?.remainingTime ?? 0,
    remainingHours: trialInfo?.remainingHours ?? 0,
    remainingMinutes: trialInfo?.remainingMinutes ?? 0,
    formattedRemainingTime: TrialService.getFormattedRemainingTime(),
    trialProgress: TrialService.getTrialProgress(),
    activateSubscription,
    resetTrial,
    updateTrialInfo
  };
};
