import React from 'react';
import { useLifecycle } from '@/hooks/useLifecycle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, CreditCard, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LifecycleBlockerProps {
    children: React.ReactNode;
    featureName?: string;
}

export const LifecycleBlocker: React.FC<LifecycleBlockerProps> = ({
    children,
    featureName = "this feature"
}) => {
    const {
        canAccess,
        isLoading,
        userState,
        getDisplayMessage,
        getFormattedRemainingTime,
        getProgressPercentage,
        shouldShowTrialTimer,
        shouldShowSubscriptionTimer,
        shouldShowPaymentPrompt,
        getUserStateColor,
        getUserStateIcon
    } = useLifecycle();

    const navigate = useNavigate();

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // If user can access, show the content
    if (canAccess) {
        return <>{children}</>;
    }

    // Show blocking UI based on user state
    const renderBlockingUI = () => {
        switch (userState) {
            case 'trial_used':
                return (
                    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                        <Card className="w-full max-w-md p-8 text-center">
                            <div className="mb-6">
                                <XCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                    Trial Expired
                                </h1>
                                <p className="text-gray-600 mb-6">
                                    Your free trial has ended. Subscribe now to continue using {featureName}.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <Button
                                    onClick={() => navigate('/payment')}
                                    className="w-full bg-orange-500 hover:bg-orange-600"
                                >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Subscribe Now
                                </Button>

                                <div className="text-sm text-gray-500">
                                    <p>Choose from our flexible plans:</p>
                                    <ul className="mt-2 space-y-1">
                                        <li>• Weekly: $2/week</li>
                                        <li>• Bi-weekly: $5/2 weeks</li>
                                        <li>• Monthly: $10/4 weeks</li>
                                        <li>• Yearly: $100/year</li>
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    </div>
                );

            case 'expired':
                return (
                    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                        <Card className="w-full max-w-md p-8 text-center">
                            <div className="mb-6">
                                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                    Subscription Expired
                                </h1>
                                <p className="text-gray-600 mb-6">
                                    Your subscription has expired. Renew now to continue using {featureName}.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <Button
                                    onClick={() => navigate('/payment')}
                                    className="w-full bg-red-500 hover:bg-red-600"
                                >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Renew Subscription
                                </Button>

                                <div className="text-sm text-gray-500">
                                    <p>Your data is safe and will be restored once you renew.</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                );

            default:
                return (
                    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                        <Card className="w-full max-w-md p-8 text-center">
                            <div className="mb-6">
                                <XCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                    Access Restricted
                                </h1>
                                <p className="text-gray-600 mb-6">
                                    You don't have access to {featureName}. Please subscribe to continue.
                                </p>
                            </div>

                            <Button
                                onClick={() => navigate('/payment')}
                                className="w-full bg-orange-500 hover:bg-orange-600"
                            >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Get Access
                            </Button>
                        </Card>
                    </div>
                );
        }
    };

    return renderBlockingUI();
};

// Component for showing trial timer
export const TrialTimer: React.FC = () => {
    const {
        shouldShowTrialTimer,
        getFormattedRemainingTime,
        getProgressPercentage,
        getUserStateColor,
        getUserStateIcon
    } = useLifecycle();

    if (!shouldShowTrialTimer()) {
        return null;
    }

    const progressPercentage = getProgressPercentage();
    const remainingTime = getFormattedRemainingTime();
    const color = getUserStateColor();
    const icon = getUserStateIcon();

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'blue':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'orange':
                return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'green':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'red':
                return 'text-red-600 bg-red-50 border-red-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className={`p-3 rounded-lg border ${getColorClasses(color)}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <span className="text-lg">{icon}</span>
                    <span className="font-medium">Free Trial</span>
                </div>
                <span className="text-sm font-mono">{remainingTime}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
        </div>
    );
};

// Component for showing subscription timer
export const SubscriptionTimer: React.FC = () => {
    const {
        shouldShowSubscriptionTimer,
        getFormattedRemainingTime,
        getProgressPercentage,
        getUserStateColor,
        getUserStateIcon
    } = useLifecycle();

    if (!shouldShowSubscriptionTimer()) {
        return null;
    }

    const progressPercentage = getProgressPercentage();
    const remainingTime = getFormattedRemainingTime();
    const color = getUserStateColor();
    const icon = getUserStateIcon();

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'blue':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'orange':
                return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'green':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'red':
                return 'text-red-600 bg-red-50 border-red-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className={`p-3 rounded-lg border ${getColorClasses(color)}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <span className="text-lg">{icon}</span>
                    <span className="font-medium">Active Subscription</span>
                </div>
                <span className="text-sm font-mono">{remainingTime}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
        </div>
    );
};

// Component for showing payment prompt
export const PaymentPrompt: React.FC = () => {
    const {
        shouldShowPaymentPrompt,
        userState,
        getDisplayMessage
    } = useLifecycle();

    const navigate = useNavigate();

    if (!shouldShowPaymentPrompt()) {
        return null;
    }

    const isExpired = userState === 'expired';
    const buttonText = isExpired ? 'Renew Subscription' : 'Subscribe Now';
    const buttonColor = isExpired ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600';

    return (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium text-orange-900">
                        {isExpired ? 'Subscription Expired' : 'Trial Expired'}
                    </h3>
                    <p className="text-sm text-orange-700 mt-1">
                        {getDisplayMessage()}
                    </p>
                </div>
                <Button
                    onClick={() => navigate('/payment')}
                    className={`${buttonColor} text-white`}
                >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {buttonText}
                </Button>
            </div>
        </div>
    );
};

export default LifecycleBlocker;
