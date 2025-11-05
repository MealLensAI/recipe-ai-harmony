import { useState, useEffect, useCallback } from 'react';
import { TrialService } from '@/lib/trialService';

export interface SubscriptionInfo {
    isActive: boolean;
    planType: 'trial' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null;
    startDate: Date | null;
    endDate: Date | null;
    isExpired: boolean;
    remainingTime: number; // in milliseconds
    remainingDays: number;
    remainingHours: number;
    remainingMinutes: number;
    progress: number; // percentage of time used
}

export const useSubscription = () => {
    const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({
        isActive: false,
        planType: null,
        startDate: null,
        endDate: null,
        isExpired: true,
        remainingTime: 0,
        remainingDays: 0,
        remainingHours: 0,
        remainingMinutes: 0,
        progress: 100
    });
    const [isLoading, setIsLoading] = useState(true);

    const updateSubscriptionInfo = useCallback(async () => {
        const trialInfo = await TrialService.getTrialInfo();
        const hasSubscription = await TrialService.hasActiveSubscription();

        if (hasSubscription) {
            // Get subscription info from localStorage
            const expiresAtIso = localStorage.getItem(`meallensai_subscription_expires_at:${TrialService.getCurrentUserId()}`);
            if (expiresAtIso) {
                const endDate = new Date(expiresAtIso);
                const now = new Date();
                const remainingTime = Math.max(0, endDate.getTime() - now.getTime());
                const isExpired = remainingTime <= 0;

                // Determine plan type based on duration
                const durationMs = endDate.getTime() - now.getTime();
                let planType: 'weekly' | 'biweekly' | 'monthly' | 'yearly' = 'monthly';

                if (durationMs <= 7 * 24 * 60 * 60 * 1000) {
                    planType = 'weekly';
                } else if (durationMs <= 14 * 24 * 60 * 60 * 1000) {
                    planType = 'biweekly';
                } else if (durationMs <= 30 * 24 * 60 * 60 * 1000) {
                    planType = 'monthly';
                } else {
                    planType = 'yearly';
                }

                const totalDuration = endDate.getTime() - (endDate.getTime() - durationMs);
                const progress = isExpired ? 100 : Math.min(100, Math.max(0, ((totalDuration - remainingTime) / totalDuration) * 100));

                setSubscriptionInfo({
                    isActive: !isExpired,
                    planType,
                    startDate: new Date(endDate.getTime() - durationMs),
                    endDate,
                    isExpired,
                    remainingTime,
                    remainingDays: Math.floor(remainingTime / (1000 * 60 * 60 * 24)),
                    remainingHours: Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    remainingMinutes: Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60)),
                    progress
                });
            }
        } else if (trialInfo) {
            // Trial info
            const totalDuration = trialInfo.endDate.getTime() - trialInfo.startDate.getTime();
            const progress = trialInfo.isExpired ? 100 : Math.min(100, Math.max(0, ((totalDuration - trialInfo.remainingTime) / totalDuration) * 100));

            setSubscriptionInfo({
                isActive: !trialInfo.isExpired,
                planType: 'trial',
                startDate: trialInfo.startDate,
                endDate: trialInfo.endDate,
                isExpired: trialInfo.isExpired,
                remainingTime: trialInfo.remainingTime,
                remainingDays: Math.floor(trialInfo.remainingTime / (1000 * 60 * 60 * 24)),
                remainingHours: trialInfo.remainingHours,
                remainingMinutes: trialInfo.remainingMinutes,
                progress
            });
        } else {
            // No subscription or trial
            setSubscriptionInfo({
                isActive: false,
                planType: null,
                startDate: null,
                endDate: null,
                isExpired: true,
                remainingTime: 0,
                remainingDays: 0,
                remainingHours: 0,
                remainingMinutes: 0,
                progress: 100
            });
        }

        setIsLoading(false);
    }, []);

    useEffect(() => {
        // Initial update
        updateSubscriptionInfo();

        // Update every minute
        const interval = setInterval(updateSubscriptionInfo, 60000);

        return () => clearInterval(interval);
    }, [updateSubscriptionInfo]);

    const getFormattedRemainingTime = useCallback(() => {
        const { remainingDays, remainingHours, remainingMinutes } = subscriptionInfo;

        if (remainingDays > 0) {
            return `${remainingDays}d ${remainingHours}h remaining`;
        } else if (remainingHours > 0) {
            return `${remainingHours}h ${remainingMinutes}m remaining`;
        } else if (remainingMinutes > 0) {
            return `${remainingMinutes}m remaining`;
        } else {
            return 'Expired';
        }
    }, [subscriptionInfo]);

    const getPlanDisplayName = useCallback(() => {
        switch (subscriptionInfo.planType) {
            case 'trial':
                return 'Free Trial';
            case 'weekly':
                return 'Weekly Plan';
            case 'biweekly':
                return 'Bi-Weekly Plan';
            case 'monthly':
                return 'Monthly Plan';
            case 'yearly':
                return 'Yearly Plan';
            default:
                return 'No Plan';
        }
    }, [subscriptionInfo.planType]);

    const canAccessFeature = useCallback((featureName: string) => {
        return subscriptionInfo.isActive;
    }, [subscriptionInfo.isActive]);

    return {
        ...subscriptionInfo,
        isLoading,
        formattedRemainingTime: getFormattedRemainingTime(),
        planDisplayName: getPlanDisplayName(),
        canAccessFeature,
        updateSubscriptionInfo
    };
};
