import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { FeatureBlocker } from './SubscriptionBlocker';

interface FeatureProtectorProps {
    children: React.ReactNode;
    featureName: string;
    requiredPlan?: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
    fallback?: React.ReactNode;
}

export const FeatureProtector: React.FC<FeatureProtectorProps> = ({
    children,
    featureName,
    requiredPlan,
    fallback
}) => {
    const { canAccessFeature, planType, isLoading } = useSubscription();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B6B]"></div>
            </div>
        );
    }

    // Check if user can access this feature
    if (!canAccessFeature(featureName)) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <FeatureBlocker featureName={featureName} requiredPlan={requiredPlan}>
                {children}
            </FeatureBlocker>
        );
    }

    // If specific plan is required, check if user has that plan or higher
    if (requiredPlan) {
        const planHierarchy = {
            'weekly': 1,
            'biweekly': 2,
            'monthly': 3,
            'yearly': 4
        };

        const userPlanLevel = planType ? planHierarchy[planType] || 0 : 0;
        const requiredPlanLevel = planHierarchy[requiredPlan];

        if (userPlanLevel < requiredPlanLevel) {
            if (fallback) {
                return <>{fallback}</>;
            }

            return (
                <FeatureBlocker featureName={featureName} requiredPlan={requiredPlan}>
                    {children}
                </FeatureBlocker>
            );
        }
    }

    return <>{children}</>;
};

// Convenience components for specific plan requirements
export const WeeklyFeature: React.FC<{ children: React.ReactNode; featureName: string; fallback?: React.ReactNode }> = ({ children, featureName, fallback }) => (
    <FeatureProtector featureName={featureName} requiredPlan="weekly" fallback={fallback}>
        {children}
    </FeatureProtector>
);

export const BiWeeklyFeature: React.FC<{ children: React.ReactNode; featureName: string; fallback?: React.ReactNode }> = ({ children, featureName, fallback }) => (
    <FeatureProtector featureName={featureName} requiredPlan="biweekly" fallback={fallback}>
        {children}
    </FeatureProtector>
);

export const MonthlyFeature: React.FC<{ children: React.ReactNode; featureName: string; fallback?: React.ReactNode }> = ({ children, featureName, fallback }) => (
    <FeatureProtector featureName={featureName} requiredPlan="monthly" fallback={fallback}>
        {children}
    </FeatureProtector>
);

export const YearlyFeature: React.FC<{ children: React.ReactNode; featureName: string; fallback?: React.ReactNode }> = ({ children, featureName, fallback }) => (
    <FeatureProtector featureName={featureName} requiredPlan="yearly" fallback={fallback}>
        {children}
    </FeatureProtector>
);
