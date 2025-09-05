// Use initialized Firebase app/auth from our wrapper
// We use Supabase-based auth stored in localStorage (access_token, user_data)

export interface PaymentPlan {
    id: string;
    name: string;
    display_name: string;
    price_usd: number;
    duration_days: number;
    features: string[];
    is_active: boolean;
}

export interface PaymentResult {
    success: boolean;
    data?: {
        authorization_url: string;
        reference: string;
        access_code: string;
        user_id: string;
    };
    error?: string;
}

export interface VerificationResult {
    success: boolean;
    message?: string;
    subscription?: any;
    user_id?: string;
    error?: string;
}

class FirebasePaymentService {
    private baseUrl: string;

    constructor() {
        // Prefer Vite proxy ("/api") during local dev; allow override via VITE_API_URL
        this.baseUrl = import.meta.env.VITE_API_URL || '/api';
    }

    private getStoredUser(): { uid: string; email: string; displayName?: string } | null {
        try {
            const raw = localStorage.getItem('user_data');
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed && parsed.uid ? parsed : null;
        } catch {
            return null;
        }
    }

    private getAuthHeaders(): Record<string, string> {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('access_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    }

    /**
     * Register a Firebase user in the backend
     */
    async registerFirebaseUser(): Promise<{ success: boolean; user_id?: string; error?: string }> {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                return { success: false, error: 'No authenticated user' };
            }

            const response = await fetch(`${this.baseUrl}/auth/register-firebase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firebase_uid: user.uid,
                    email: user.email,
                    full_name: user.displayName || '',
                }),
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                return { success: true, user_id: result.user_id };
            } else {
                return { success: false, error: result.message || 'Registration failed' };
            }
        } catch (error) {
            console.error('Error registering Firebase user:', error);
            return { success: false, error: 'Network error' };
        }
    }

    /**
     * Get available subscription plans from backend
     */
    async getSubscriptionPlans(): Promise<PaymentPlan[]> {
        try {
            const response = await fetch(`${this.baseUrl}/subscription/plans`);
            const result = await response.json();

            if (response.ok && result.success) {
                return result.plans || [];
            } else {
                console.error('Failed to get subscription plans:', result.error);
                return [];
            }
        } catch (error) {
            console.error('Error getting subscription plans:', error);
            return [];
        }
    }

    /**
     * Initialize payment with backend (automatically registers user if needed)
     */
    async initializePayment(
        plan: PaymentPlan,
        callbackUrl?: string,
        opts?: { fullName?: string; email?: string }
    ): Promise<PaymentResult> {
        try {
            const user = this.getStoredUser();
            console.log('🔍 Stored auth user:', user);
            if (!user && !opts?.email) {
                console.error('❌ No authenticated user found');
                return { success: false, error: 'No authenticated user' };
            }

            const requestData = {
                firebase_uid: user?.uid ?? null,
                email: (opts?.email ?? user?.email) as string,
                amount: plan.price_usd,
                plan_id: plan.id,
                full_name: (opts?.fullName ?? user?.displayName ?? '') as string,
                callback_url: callbackUrl || `${window.location.origin}/payment/callback`,
            };

            console.log('🔍 Sending payment request to:', `${this.baseUrl}/payment/initialize-payment-firebase`);
            console.log('🔍 Request data:', requestData);

            const response = await fetch(`${this.baseUrl}/payment/initialize-payment-firebase`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(requestData),
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                return { success: true, data: result.data };
            } else {
                return { success: false, error: result.message || 'Payment initialization failed' };
            }
        } catch (error) {
            console.error('Error initializing payment:', error);
            return { success: false, error: 'Network error' };
        }
    }

    /**
     * Verify payment with backend
     */
    async verifyPayment(reference: string): Promise<VerificationResult> {
        try {
            const user = this.getStoredUser();
            if (!user) {
                return { success: false, error: 'No authenticated user' };
            }

            const response = await fetch(`${this.baseUrl}/payment/verify-payment-firebase`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    reference: reference,
                    firebase_uid: user.uid,
                }),
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                return {
                    success: true,
                    message: result.message,
                    subscription: result.subscription,
                    user_id: result.user_id,
                };
            } else {
                return { success: false, error: result.message || 'Payment verification failed' };
            }
        } catch (error) {
            console.error('Error verifying payment:', error);
            return { success: false, error: 'Network error' };
        }
    }

    /**
     * Check subscription status
     */
    async getSubscriptionStatus(): Promise<any> {
        try {
            const user = this.getStoredUser();
            if (!user) {
                return null;
            }

            const response = await fetch(`${this.baseUrl}/subscription/status?firebase_uid=${user.uid}`, {
                headers: this.getAuthHeaders()
            });
            const result = await response.json();

            if (response.ok && result.success) {
                return result.data;
            } else {
                console.error('Failed to get subscription status:', result.error);
                return null;
            }
        } catch (error) {
            console.error('Error getting subscription status:', error);
            return null;
        }
    }

    /**
     * Complete payment flow: initialize -> redirect to Paystack -> verify
     */
    async processPayment(plan: PaymentPlan): Promise<{ success: boolean; error?: string }> {
        try {
            console.log('🔄 Starting payment process for plan:', plan.display_name);

            // Step 1: Initialize payment with backend
            const initResult = await this.initializePayment(plan);
            if (!initResult.success) {
                return { success: false, error: initResult.error };
            }

            console.log('✅ Payment initialized, redirecting to Paystack...');
            console.log('Payment reference:', initResult.data?.reference);

            // Step 2: Store reference for verification
            localStorage.setItem('payment_reference', initResult.data!.reference);
            localStorage.setItem('payment_plan_id', plan.id);

            // Step 3: Redirect to Paystack
            window.location.href = initResult.data!.authorization_url;

            return { success: true };
        } catch (error) {
            console.error('Error processing payment:', error);
            return { success: false, error: 'Payment processing failed' };
        }
    }

    /**
     * Handle payment callback (call this after user returns from Paystack)
     */
    async handlePaymentCallback(): Promise<{ success: boolean; error?: string }> {
        try {
            const reference = localStorage.getItem('payment_reference');
            if (!reference) {
                return { success: false, error: 'No payment reference found' };
            }

            console.log('🔄 Verifying payment with reference:', reference);

            // Verify payment with backend
            const verifyResult = await this.verifyPayment(reference);
            if (!verifyResult.success) {
                return { success: false, error: verifyResult.error };
            }

            console.log('✅ Payment verified successfully!');
            console.log('User ID:', verifyResult.user_id);
            console.log('Subscription:', verifyResult.subscription);

            // Clear stored data
            localStorage.removeItem('payment_reference');
            localStorage.removeItem('payment_plan_id');

            return { success: true };
        } catch (error) {
            console.error('Error handling payment callback:', error);
            return { success: false, error: 'Payment verification failed' };
        }
    }
}

// Export singleton instance
export const firebasePaymentService = new FirebasePaymentService();
export default firebasePaymentService;
