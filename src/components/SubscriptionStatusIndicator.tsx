import React from 'react';
import { Clock, AlertTriangle, Crown, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useTrial } from '@/hooks/useTrial';

const SubscriptionStatusIndicator: React.FC = () => {
    const {
        trialInfo,
        subscriptionInfo,
        hasActiveSubscription,
        progressPercentage,
        formattedRemainingTime,
        isSubscriptionExpired,
        isTrialExpired
    } = useTrial();

    // Don't show if user has no active plan info
    if (!trialInfo && !subscriptionInfo) {
        return null;
    }

    // Use subscription info if available, otherwise use trial info
    const activePlan = subscriptionInfo || trialInfo;
    const isExpired = subscriptionInfo ? isSubscriptionExpired : isTrialExpired;

    const getStatusColor = () => {
        if (isExpired) return 'text-red-600';
        if (subscriptionInfo) {
            if (subscriptionInfo.remaining_hours < 2) return 'text-orange-600';
            return 'text-green-600';
        } else if (trialInfo) {
            if (trialInfo.remainingHours < 2) return 'text-orange-600';
            return 'text-blue-600';
        }
        return 'text-blue-600';
    };

    const getProgressColor = () => {
        if (isExpired) return 'bg-red-500';
        if (subscriptionInfo) {
            if (subscriptionInfo.remaining_hours < 2) return 'bg-orange-500';
            return 'bg-green-500';
        } else if (trialInfo) {
            if (trialInfo.remainingHours < 2) return 'bg-orange-500';
            return 'bg-blue-500';
        }
        return 'bg-blue-500';
    };

    const getIcon = () => {
        if (subscriptionInfo) {
            return <Crown className={`h-4 w-4 ${getStatusColor()}`} />;
        } else if (trialInfo) {
            return <Zap className={`h-4 w-4 ${getStatusColor()}`} />;
        }
        return <Clock className={`h-4 w-4 ${getStatusColor()}`} />;
    };

    const getPlanName = () => {
        if (subscriptionInfo) {
            return subscriptionInfo.planDisplayName;
        } else if (trialInfo) {
            return 'Free Trial';
        }
        return 'No Plan';
    };

    const getBackgroundColor = () => {
        if (subscriptionInfo) {
            return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200';
        } else if (trialInfo) {
            return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200';
        }
        return 'bg-gray-50 border-gray-200';
    };

    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getBackgroundColor()}`}>
            {getIcon()}

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{getPlanName()}</span>
                    <span className={`font-semibold ${getStatusColor()}`}>
                        {isExpired ? 'Expired' : formattedRemainingTime}
                    </span>
                </div>

                {!isExpired && (
                    <Progress
                        value={progressPercentage}
                        className="h-1.5"
                        style={{
                            '--progress-background': getProgressColor()
                        } as React.CSSProperties}
                    />
                )}
            </div>

            {!isExpired && (
                (subscriptionInfo && subscriptionInfo.remaining_hours < 2) ||
                (trialInfo && trialInfo.remainingHours < 2)
            ) && (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                )}

            {subscriptionInfo && !isExpired && (
                <div className="flex items-center gap-1">
                    <Crown className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-yellow-600 font-medium">Premium</span>
                </div>
            )}
        </div>
    );
};

export default SubscriptionStatusIndicator;
