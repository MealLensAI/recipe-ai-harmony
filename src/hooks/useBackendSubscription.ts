import { useState, useEffect, useCallback } from 'react';
import { subscriptionService, SubscriptionStatus, FeatureAccess } from '@/lib/subscriptionService';

export const useBackendSubscription = () => {
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const updateSubscriptionStatus = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const status = await subscriptionService.getSubscriptionStatus();
            setSubscriptionStatus(status);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get subscription status');
            console.error('Error updating subscription status:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Initial update
        updateSubscriptionStatus();

        // Update every minute
        const interval = setInterval(updateSubscriptionStatus, 60000);

        return () => clearInterval(interval);
    }, [updateSubscriptionStatus]);

    const canAccessFeature = useCallback(async (featureName: string): Promise<FeatureAccess | null> => {
        try {
            return await subscriptionService.canUseFeature(featureName);
        } catch (err) {
            console.error('Error checking feature access:', err);
            return null;
        }
    }, []);

    const recordFeatureUsage = useCallback(async (featureName: string, count: number = 1): Promise<boolean> => {
        try {
            return await subscriptionService.recordFeatureUsage(featureName, count);
        } catch (err) {
            console.error('Error recording feature usage:', err);
            return false;
        }
    }, []);

    const createTrial = useCallback(async (durationDays: number = 7): Promise<boolean> => {
        try {
            return await subscriptionService.createTrial(durationDays);
        } catch (err) {
            console.error('Error creating trial:', err);
            return false;
        }
    }, []);

    const activateSubscription = useCallback(async (planName: string, paystackData: any): Promise<boolean> => {
        try {
            return await subscriptionService.activateSubscription(planName, paystackData);
        } catch (err) {
            console.error('Error activating subscription:', err);
            return false;
        }
    }, []);

    const verifyPayment = useCallback(async (reference: string): Promise<any> => {
        try {
            return await subscriptionService.verifyPayment(reference);
        } catch (err) {
            console.error('Error verifying payment:', err);
            return { success: false, error: 'Verification failed' };
        }
    }, []);

    const getUsageStats = useCallback(async (): Promise<any[]> => {
        try {
            return await subscriptionService.getUsageStats();
        } catch (err) {
            console.error('Error getting usage stats:', err);
            return [];
        }
    }, []);

    const hasAppAccess = useCallback(async (): Promise<boolean> => {
        try {
            return await subscriptionService.hasAppAccess();
        } catch (err) {
            console.error('Error checking app access:', err);
            return false;
        }
    }, []);

    // Computed values
    const canAccess = subscriptionStatus?.can_access_app ?? false;
    const hasActiveSubscription = subscriptionStatus?.has_active_subscription ?? false;
    const isTrialExpired = subscriptionStatus?.trial ?
        subscriptionService.isTrialExpired(subscriptionStatus) : true;
    const isSubscriptionExpired = subscriptionStatus?.subscription ?
        subscriptionService.isSubscriptionExpired(subscriptionStatus) : true;

    const formattedRemainingTime = subscriptionStatus ?
        subscriptionService.getFormattedRemainingTime(subscriptionStatus) : 'No subscription';

    const planDisplayName = subscriptionStatus ?
        subscriptionService.getPlanDisplayName(subscriptionStatus) : 'No Plan';

    const progress = subscriptionStatus?.subscription?.progress_percentage ??
        subscriptionStatus?.trial?.progress_percentage ?? 100;

    return {
        // State
        subscriptionStatus,
        isLoading,
        error,

        // Computed values
        canAccess,
        hasActiveSubscription,
        isTrialExpired,
        isSubscriptionExpired,
        formattedRemainingTime,
        planDisplayName,
        progress,

        // Actions
        updateSubscriptionStatus,
        canAccessFeature,
        recordFeatureUsage,
        createTrial,
        activateSubscription,
        verifyPayment,
        getUsageStats,
        hasAppAccess,

        // Raw data
        subscription: subscriptionStatus?.subscription,
        trial: subscriptionStatus?.trial
    };
};



