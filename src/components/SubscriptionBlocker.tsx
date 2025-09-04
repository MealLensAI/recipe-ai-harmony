import React, { useEffect, useState } from 'react';
import { useTrial } from '@/hooks/useTrial';
import TrialExpiredModal from './TrialExpiredModal';

interface SubscriptionBlockerProps {
    children: React.ReactNode;
}

const SubscriptionBlocker: React.FC<SubscriptionBlockerProps> = ({ children }) => {
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const { canAccess, isSubscriptionExpired, hasActiveSubscription } = useTrial();

    // Track current path without relying on router hooks
    const [currentPath, setCurrentPath] = useState<string>(
        typeof window !== 'undefined' ? window.location.pathname : '/'
    );

    // Allowed paths when subscription is expired (user can still access these)
    const allowedPaths = ['/payment', '/settings', '/login', '/signup'];

    useEffect(() => {
        const handleLocationChange = () => setCurrentPath(window.location.pathname);

        // Listen to browser navigation
        window.addEventListener('popstate', handleLocationChange);
        window.addEventListener('hashchange', handleLocationChange);

        // Monkey-patch pushState/replaceState to detect SPA navigations
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        history.pushState = function (...args) {
            // @ts-ignore
            originalPushState.apply(this, args);
            handleLocationChange();
        } as typeof history.pushState;
        history.replaceState = function (...args) {
            // @ts-ignore
            originalReplaceState.apply(this, args);
            handleLocationChange();
        } as typeof history.replaceState;

        return () => {
            window.removeEventListener('popstate', handleLocationChange);
            window.removeEventListener('hashchange', handleLocationChange);
            history.pushState = originalPushState;
            history.replaceState = originalReplaceState;
        };
    }, []);

    useEffect(() => {
        // Show modal if subscription expired and user is on a restricted page
        if (hasActiveSubscription && isSubscriptionExpired && !allowedPaths.includes(currentPath)) {
            setShowSubscriptionModal(true);
        }
    }, [isSubscriptionExpired, hasActiveSubscription, currentPath]);

    // If user has subscription but it's expired and is on a restricted page, show blocking overlay
    if (hasActiveSubscription && isSubscriptionExpired && !allowedPaths.includes(currentPath)) {
        return (
            <>
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Subscription Expired</h2>
                        <p className="text-gray-600 mb-4">
                            Your subscription has expired. Please renew to continue using MealLensAI.
                        </p>
                        <button
                            onClick={() => {
                                window.location.href = '/payment'
                            }}
                            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                        >
                            Renew Subscription
                        </button>
                    </div>
                </div>
                <TrialExpiredModal
                    isOpen={showSubscriptionModal}
                    onClose={() => setShowSubscriptionModal(false)}
                    isSubscriptionExpired={true}
                />
                {children}
            </>
        );
    }

    return (
        <>
            {children}
            <TrialExpiredModal
                isOpen={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
                isSubscriptionExpired={true}
            />
        </>
    );
};

export default SubscriptionBlocker;