import { getAuth } from 'firebase/auth';

export interface SubscriptionStatus {
    has_active_subscription: boolean;
    subscription: {
        id: string;
        plan_name: string;
        plan_display_name: string;
        price_usd: number;
        duration_days: number;
        features: string[];
        start_date: string;
        end_date: string;
        remaining_days: number;
        remaining_hours: number;
        remaining_minutes: number;
        progress_percentage: number;
    } | null;
    trial: {
        start_date: string;
        end_date: string;
        is_active: boolean;
        remaining_days: number;
        remaining_hours: number;
        remaining_minutes: number;
        progress_percentage: number;
    } | null;
    can_access_app: boolean;
}

export interface FeatureAccess {
    can_use: boolean;
    feature_name: string;
    plan_name: string;
    current_usage: number;
    feature_available: boolean;
    message: string;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    display_name: string;
    price_usd: number;
    duration_days: number;
    features: string[];
    is_active: boolean;
}

class SubscriptionService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    }

    private async getAuthHeaders(): Promise<HeadersInit> {
        const auth = getAuth();
        const user = auth.currentUser;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (user) {
            // Add Firebase UID to headers
            headers['X-Firebase-UID'] = user.uid;
        }

        return headers;
    }

    private async getCurrentUser(): Promise<{ uid: string; email: string | null } | null> {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
            return {
                uid: user.uid,
                email: user.email
            };
        }

        return null;
    }

    /**
     * Get user's current subscription status
     */
    async getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
        try {
            const user = await this.getCurrentUser();
            if (!user) return null;

            const headers = await this.getAuthHeaders();
            const response = await fetch(
                `${this.baseUrl}/subscription/status?firebase_uid=${user.uid}`,
                { headers }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                return result.data;
            } else {
                console.error('Failed to get subscription status:', result.error);
                // Return a default status that blocks access
                return {
                    has_active_subscription: false,
                    subscription: null,
                    trial: null,
                    can_access_app: false
                };
            }
        } catch (error) {
            console.error('Error getting subscription status:', error);
            // Return a default status that blocks access when backend is unavailable
            return {
                has_active_subscription: false,
                subscription: null,
                trial: null,
                can_access_app: false
            };
        }
    }

    /**
     * Check if user can use a specific feature
     */
    async canUseFeature(featureName: string): Promise<FeatureAccess | null> {
        try {
            const user = await this.getCurrentUser();
            if (!user) return null;

            const headers = await this.getAuthHeaders();
            const response = await fetch(`${this.baseUrl}/subscription/feature-access`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    firebase_uid: user.uid,
                    feature_name: featureName
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                return result.data;
            } else {
                console.error('Failed to check feature access:', result.error);
                return null;
            }
        } catch (error) {
            console.error('Error checking feature access:', error);
            return null;
        }
    }

    /**
     * Record feature usage
     */
    async recordFeatureUsage(featureName: string, count: number = 1): Promise<boolean> {
        try {
            const user = await this.getCurrentUser();
            if (!user) return false;

            const headers = await this.getAuthHeaders();
            const response = await fetch(`${this.baseUrl}/subscription/record-usage`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    firebase_uid: user.uid,
                    feature_name: featureName,
                    count
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error recording feature usage:', error);
            return false;
        }
    }

    /**
     * Create a trial for a new user
     */
    async createTrial(durationDays: number = 7): Promise<boolean> {
        try {
            const user = await this.getCurrentUser();
            if (!user) return false;

            const headers = await this.getAuthHeaders();
            const response = await fetch(`${this.baseUrl}/subscription/create-trial`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    firebase_uid: user.uid,
                    duration_days: durationDays
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error creating trial:', error);
            return false;
        }
    }

    /**
     * Activate subscription after successful payment
     */
    async activateSubscription(planName: string, paystackData: any): Promise<boolean> {
        try {
            const user = await this.getCurrentUser();
            if (!user) return false;

            const headers = await this.getAuthHeaders();
            const response = await fetch(`${this.baseUrl}/subscription/activate`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    firebase_uid: user.uid,
                    plan_name: planName,
                    paystack_data: paystackData
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error activating subscription:', error);
            return false;
        }
    }

    /**
     * Get all available subscription plans
     */
    async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${this.baseUrl}/subscription/plans`, {
                headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                return result.plans;
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
     * Verify Paystack payment
     */
    async verifyPayment(reference: string): Promise<any> {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${this.baseUrl}/subscription/verify-payment`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ reference })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error verifying payment:', error);
            return { success: false, error: 'Verification failed' };
        }
    }

    /**
     * Get user's usage statistics
     */
    async getUsageStats(): Promise<any[]> {
        try {
            const user = await this.getCurrentUser();
            if (!user) return [];

            const headers = await this.getAuthHeaders();
            const response = await fetch(
                `${this.baseUrl}/subscription/usage-stats?firebase_uid=${user.uid}`,
                { headers }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                return result.usage_stats;
            } else {
                console.error('Failed to get usage stats:', result.error);
                return [];
            }
        } catch (error) {
            console.error('Error getting usage stats:', error);
            return [];
        }
    }

    /**
     * Check if user has access to the app
     */
    async hasAppAccess(): Promise<boolean> {
        try {
            const status = await this.getSubscriptionStatus();
            return status?.can_access_app || false;
        } catch (error) {
            console.error('Error checking app access:', error);
            return false;
        }
    }

    /**
     * Get formatted remaining time for subscription or trial
     */
    getFormattedRemainingTime(status: SubscriptionStatus): string {
        if (status.subscription) {
            const { remaining_days, remaining_hours, remaining_minutes } = status.subscription;

            if (remaining_days > 0) {
                return `${remaining_days}d ${remaining_hours}h remaining`;
            } else if (remaining_hours > 0) {
                return `${remaining_hours}h ${remaining_minutes}m remaining`;
            } else if (remaining_minutes > 0) {
                return `${remaining_minutes}m remaining`;
            } else {
                return 'Expired';
            }
        } else if (status.trial) {
            const { remaining_days, remaining_hours, remaining_minutes } = status.trial;

            if (remaining_days > 0) {
                return `${remaining_days}d ${remaining_hours}h remaining`;
            } else if (remaining_hours > 0) {
                return `${remaining_hours}h ${remaining_minutes}m remaining`;
            } else if (remaining_minutes > 0) {
                return `${remaining_minutes}m remaining`;
            } else {
                return 'Trial expired';
            }
        }

        return 'No active subscription';
    }

    /**
     * Get plan display name
     */
    getPlanDisplayName(status: SubscriptionStatus): string {
        if (status.subscription) {
            return status.subscription.plan_display_name;
        } else if (status.trial) {
            return 'Free Trial';
        }
        return 'No Plan';
    }

    /**
     * Check if subscription is expired
     */
    isSubscriptionExpired(status: SubscriptionStatus): boolean {
        if (status.subscription) {
            return status.subscription.remaining_days <= 0 &&
                status.subscription.remaining_hours <= 0 &&
                status.subscription.remaining_minutes <= 0;
        }
        return true;
    }

    /**
     * Check if trial is expired
     */
    isTrialExpired(status: SubscriptionStatus): boolean {
        if (status.trial) {
            return !status.trial.is_active ||
                (status.trial.remaining_days <= 0 &&
                    status.trial.remaining_hours <= 0 &&
                    status.trial.remaining_minutes <= 0);
        }
        return true;
    }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
export default subscriptionService;



