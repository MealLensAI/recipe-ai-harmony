import { useState, useEffect, useCallback } from 'react';
import { LifecycleService, UserLifecycleInfo, UserStateDisplay } from '@/lib/lifecycleService';

export const useLifecycle = () => {
    const [lifecycleInfo, setLifecycleInfo] = useState<UserLifecycleInfo | null>(null);
    const [userStateDisplay, setUserStateDisplay] = useState<UserStateDisplay | null>(null);
    const [canAccess, setCanAccess] = useState(true);
    const [isLoading, setIsLoading] = useState(false); // Start as false - don't block rendering

    const updateLifecycleInfo = useCallback(async () => {
        try {
            // Removed artificial delay - load immediately for faster app
            console.log('🔄 Starting lifecycle status update...');

            // Get lifecycle info from backend
            const lifecycleResult = await LifecycleService.getUserLifecycleStatus();
            const displayResult = await LifecycleService.getUserStateDisplay();

            console.log('🔄 Lifecycle status loaded:', {
                lifecycleSuccess: lifecycleResult.success,
                displaySuccess: displayResult.success,
                canAccess: lifecycleResult.data?.can_access_app,
                userState: lifecycleResult.data?.user_state,
                isLoading: false
            });

            if (lifecycleResult.success && lifecycleResult.data) {
                setLifecycleInfo(lifecycleResult.data);
                setCanAccess(lifecycleResult.data.can_access_app);
            }

            if (displayResult.success && displayResult.data) {
                setUserStateDisplay(displayResult.data);
            }

            setIsLoading(false);
        } catch (error) {
            console.error('Error updating lifecycle info:', error);
            // Fallback to basic access
            setCanAccess(false);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Load lifecycle info in background - don't block rendering
        updateLifecycleInfo().catch(console.error);

        // Update every 2 minutes (less frequent to reduce load)
        const interval = setInterval(() => {
            updateLifecycleInfo().catch(console.error);
        }, 120000);

        return () => clearInterval(interval);
    }, [updateLifecycleInfo]);

    const initializeTrial = useCallback(async (durationHours: number = 48, testMode: boolean = false) => {
        const result = await LifecycleService.initializeTrial(durationHours, testMode);
        if (result.success) {
            await updateLifecycleInfo();
        }
        return result;
    }, [updateLifecycleInfo]);

    const markTrialUsed = useCallback(async () => {
        const result = await LifecycleService.markTrialUsed();
        if (result.success) {
            await updateLifecycleInfo();
        }
        return result;
    }, [updateLifecycleInfo]);

    const activateSubscription = useCallback(async (durationDays: number, paystackData: any = {}, testMode: boolean = false) => {
        const result = await LifecycleService.activateSubscription(durationDays, paystackData, testMode);
        if (result.success) {
            await updateLifecycleInfo();
        }
        return result;
    }, [updateLifecycleInfo]);

    const markSubscriptionExpired = useCallback(async () => {
        const result = await LifecycleService.markSubscriptionExpired();
        if (result.success) {
            await updateLifecycleInfo();
        }
        return result;
    }, [updateLifecycleInfo]);

    const setTestMode = useCallback(async (testMode: boolean = true) => {
        const result = await LifecycleService.setTestMode(testMode);
        if (result.success) {
            await updateLifecycleInfo();
        }
        return result;
    }, [updateLifecycleInfo]);

    const refreshStatus = useCallback(async () => {
        setIsLoading(true);
        await updateLifecycleInfo();
    }, [updateLifecycleInfo]);

    // Helper functions for UI
    const hasActiveTrial = lifecycleInfo?.has_active_trial ?? false;
    const hasActiveSubscription = lifecycleInfo?.has_active_subscription ?? false;
    const userState = lifecycleInfo?.user_state ?? 'new';
    const isTrialExpired = userState === 'trial_used';
    const isSubscriptionExpired = userState === 'expired';

    // Get progress percentage
    const getProgressPercentage = () => {
        if (lifecycleInfo) {
            return LifecycleService.getProgressPercentage(lifecycleInfo);
        }
        return 0;
    };

    // Get formatted remaining time
    const getFormattedRemainingTime = () => {
        if (lifecycleInfo?.trial_info && userState === 'new') {
            return LifecycleService.formatRemainingTime(lifecycleInfo.trial_info.remaining_time);
        }
        if (lifecycleInfo?.subscription_info && userState === 'paid') {
            return LifecycleService.formatRemainingTime(lifecycleInfo.subscription_info.remaining_time);
        }
        return 'No active subscription';
    };

    // Get display message
    const getDisplayMessage = () => {
        if (userStateDisplay) {
            return userStateDisplay.display_message;
        }
        if (lifecycleInfo) {
            return lifecycleInfo.message;
        }
        return 'Loading...';
    };

    // Check if should show trial timer
    const shouldShowTrialTimer = () => {
        if (userStateDisplay) {
            return userStateDisplay.show_trial_timer;
        }
        return userState === 'new' && hasActiveTrial;
    };

    // Check if should show subscription timer
    const shouldShowSubscriptionTimer = () => {
        if (userStateDisplay) {
            return userStateDisplay.show_subscription_timer;
        }
        return userState === 'paid' && hasActiveSubscription;
    };

    // Check if should show payment prompt
    const shouldShowPaymentPrompt = () => {
        if (userStateDisplay) {
            return userStateDisplay.show_payment_prompt;
        }
        return userState === 'trial_used' || userState === 'expired';
    };

    // Get user state color for UI
    const getUserStateColor = () => {
        switch (userState) {
            case 'new':
                return 'blue';
            case 'trial_used':
                return 'orange';
            case 'paid':
                return 'green';
            case 'expired':
                return 'red';
            default:
                return 'gray';
        }
    };

    // Get user state icon for UI
    const getUserStateIcon = () => {
        switch (userState) {
            case 'new':
                return '🎉';
            case 'trial_used':
                return '⏰';
            case 'paid':
                return '✅';
            case 'expired':
                return '❌';
            default:
                return '❓';
        }
    };

    return {
        // State
        lifecycleInfo,
        userStateDisplay,
        canAccess,
        isLoading,

        // User state info
        userState,
        hasActiveTrial,
        hasActiveSubscription,
        isTrialExpired,
        isSubscriptionExpired,

        // Actions
        initializeTrial,
        markTrialUsed,
        activateSubscription,
        markSubscriptionExpired,
        setTestMode,
        refreshStatus,

        // UI helpers
        getProgressPercentage,
        getFormattedRemainingTime,
        getDisplayMessage,
        shouldShowTrialTimer,
        shouldShowSubscriptionTimer,
        shouldShowPaymentPrompt,
        getUserStateColor,
        getUserStateIcon,

        // Legacy compatibility
        formattedRemainingTime: getFormattedRemainingTime(),
        progressPercentage: getProgressPercentage(),
        hasActiveSubscription: hasActiveSubscription,
        isTrialExpired: isTrialExpired,
        isSubscriptionExpired: isSubscriptionExpired,
        updateTrialInfo: refreshStatus
    };
};
