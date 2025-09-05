import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { firebasePaymentService } from '@/lib/firebasePaymentService';
import { useTrial } from '@/hooks/useTrial';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const PaymentCallback: React.FC = () => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { updateTrialInfo } = useTrial();

    useEffect(() => {
        const handlePaymentCallback = async () => {
            try {
                console.log('🔄 Processing payment callback...');

                // Handle the payment callback
                const result = await firebasePaymentService.handlePaymentCallback();

                if (result.success) {
                    console.log('✅ Payment verified successfully!');
                    setStatus('success');
                    setMessage('Payment successful! Your subscription has been activated.');

                    // Update trial info to refresh the UI
                    await updateTrialInfo();

                    // Redirect to main app after 3 seconds
                    setTimeout(() => {
                        navigate('/');
                    }, 3000);
                } else {
                    console.error('❌ Payment verification failed:', result.error);
                    setStatus('error');
                    setError(result.error || 'Payment verification failed');
                }
            } catch (error) {
                console.error('❌ Error handling payment callback:', error);
                setStatus('error');
                setError('An unexpected error occurred. Please contact support.');
            }
        };

        handlePaymentCallback();
    }, [navigate, updateTrialInfo]);

    const handleRetry = () => {
        navigate('/payment');
    };

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f5f5] to-[#e8e8e8] p-4">
            <Card className="w-full max-w-md p-8 text-center">
                {status === 'loading' && (
                    <>
                        <Loader2 className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Processing Payment</h2>
                        <p className="text-gray-600">Please wait while we verify your payment...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <p className="text-sm text-gray-500 mb-4">
                            You will be redirected to the app in a few seconds...
                        </p>
                        <Button onClick={handleGoHome} className="w-full">
                            Go to App
                        </Button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <div className="space-y-2">
                            <Button onClick={handleRetry} className="w-full">
                                Try Again
                            </Button>
                            <Button onClick={handleGoHome} variant="outline" className="w-full">
                                Go Home
                            </Button>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};

export default PaymentCallback;
