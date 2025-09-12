import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrial } from '@/hooks/useTrial';
import TrialExpiredModal from './TrialExpiredModal';

interface TrialBlockerProps {
  children: React.ReactNode;
}

const TrialBlocker: React.FC<TrialBlockerProps> = ({ children }) => {
  const navigate = useNavigate();
  const [showTrialModal, setShowTrialModal] = useState(false);
  const { canAccess, isTrialExpired, hasActiveSubscription, isSubscriptionExpired, isLoading } = useTrial();

  // Track current path without relying on router hooks
  const [currentPath, setCurrentPath] = useState<string>(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  // Allowed paths when trial is expired (user can still access these)
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
    // Don't show modal while loading - wait for subscription status to be determined
    if (isLoading) {
      console.log('🔄 TrialBlocker: Still loading subscription status, not showing modal');
      setShowTrialModal(false);
      return;
    }

    // Only show modal if user has NO active subscription AND trial is expired
    // If user has active subscription, NEVER show the modal
    const shouldShowModal = !hasActiveSubscription && isTrialExpired && !allowedPaths.includes(currentPath);

    console.log('🔍 TrialBlocker status check:', {
      isTrialExpired,
      hasActiveSubscription,
      isSubscriptionExpired,
      canAccess,
      currentPath,
      shouldShowModal,
      isLoading,
      reason: isLoading ? 'Still loading - no modal' :
        hasActiveSubscription ? 'User has active subscription - no modal' :
          isTrialExpired ? 'Trial expired and no subscription - show modal' :
            'Trial still active - no modal'
    });

    if (shouldShowModal) {
      setShowTrialModal(true);
    } else {
      setShowTrialModal(false);
    }
  }, [isTrialExpired, hasActiveSubscription, isSubscriptionExpired, currentPath, canAccess, isLoading]);

  // Show loading spinner while determining subscription status
  if (isLoading) {
    return (
      <>
        <div className="fixed inset-0 bg-white bg-opacity-95 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FF6B6B] mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg font-medium">Loading your subscription status...</p>
            <p className="text-gray-500 text-sm mt-2">Please wait while we check your access</p>
          </div>
        </div>
        {children}
      </>
    );
  }

  // If user can't access and is on a restricted page, show blocking overlay
  // But only if they don't have an active subscription
  if (!canAccess && !hasActiveSubscription && !allowedPaths.includes(currentPath)) {
    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600 mb-4">
              Your trial period has expired. Please upgrade to continue using MealLensAI.
            </p>
            <button
              onClick={() => {
                navigate('/payment')
              }}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>
        <TrialExpiredModal
          isOpen={showTrialModal}
          onClose={() => setShowTrialModal(false)}
          isSubscriptionExpired={hasActiveSubscription && isSubscriptionExpired}
        />
        {children}
      </>
    );
  }

  return (
    <>
      {children}
      <TrialExpiredModal
        isOpen={showTrialModal}
        onClose={() => setShowTrialModal(false)}
        isSubscriptionExpired={hasActiveSubscription && isSubscriptionExpired}
      />
    </>
  );
};

export default TrialBlocker;
