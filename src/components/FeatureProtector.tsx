import React from 'react';
import { useBackendSubscription } from '@/hooks/useBackendSubscription';
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
    const { canAccessApp, hasActiveSubscription, isLoading, checkFeatureAccess } = useBackendSubscription();
    const [canAccess, setCanAccess] = React.useState(false);
    const [featureCheckLoading, setFeatureCheckLoading] = React.useState(false);

    // Check feature access when component mounts or dependencies change
    React.useEffect(() => {
        const checkAccess = async () => {
            if (!isLoading) {
                setFeatureCheckLoading(true);
                try {
                    const hasAccess = await checkFeatureAccess(featureName);
                    setCanAccess(hasAccess);
                } catch (error) {
                    console.error('Error checking feature access:', error);
                    setCanAccess(false);
                } finally {
                    setFeatureCheckLoading(false);
                }
            }
        };

        checkAccess();
    }, [featureName, isLoading, checkFeatureAccess]);

    if (isLoading || featureCheckLoading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B6B]"></div>
            </div>
        );
    }

    // Check if user can access this feature
    if (!canAccess || !canAccessApp) {
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
    if (requiredPlan && hasActiveSubscription) {
        // For now, if user has any active subscription, allow access
        // You can enhance this to check specific plan types based on your backend data
        return <>{children}</>;
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
