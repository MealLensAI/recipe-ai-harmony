export interface TrialInfo {
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  isExpired: boolean;
  remainingTime: number; // in milliseconds
  remainingHours: number;
  remainingMinutes: number;
}

export interface SubscriptionInfo {
  isActive: boolean;
  isExpired: boolean;
  startDate: string;
  endDate: string;
  planId?: string;
  planName?: string;
  formattedRemainingTime: string;
  progressPercentage: number;
}

import { APP_CONFIG } from '@/lib/config';

export class TrialService {
  // Trial duration. For production use 24 * 60 * 60 * 1000.
  private static TRIAL_DURATION = 24 * 60 * 60 * 1000; // 0 seconds for testing

  // Time unit used for subscription testing. Set to 'days' for normal use,
  // change to 'minutes' to speed up testing.
  private static SUBSCRIPTION_TIME_UNIT: 'days' | 'minutes' =
    (import.meta as any)?.env?.VITE_SUB_TIME_UNIT === 'minutes' ? 'minutes' : 'days';

  // Base keys (per-user suffix is appended internally)
  private static TRIAL_KEY_BASE = 'meallensai_trial_start';
  private static SUBSCRIPTION_STATUS_KEY_BASE = 'meallensai_subscription_status';
  private static SUBSCRIPTION_EXPIRES_KEY_BASE = 'meallensai_subscription_expires_at';

  // API base URL for backend calls (production: absolute to Render backend)
  private static API_BASE_URL = `${APP_CONFIG.api.base_url}/api`;

  // Helpers to build per-user keys
  private static getCurrentUserId(): string {
    try {
      const raw = localStorage.getItem('user_data');
      if (!raw) {
        console.log('🔍 No user_data in localStorage');
        return 'anon';
      }
      const user = JSON.parse(raw);

      // Prioritize UUID format IDs (backend expects UUIDs)
      const userId = user?.uid || user?.id || user?.email || 'anon';

      // Check if it's a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isValidUuid = uuidRegex.test(userId);

      console.log('🔍 getCurrentUserId result:', {
        raw,
        user,
        userId,
        isValidUuid,
        uid: user?.uid,
        id: user?.id,
        email: user?.email
      });

      if (!isValidUuid && userId !== 'anon') {
        console.warn('⚠️ User ID is not in UUID format, this may cause backend errors:', userId);
      }

      return userId;
    } catch (error) {
      console.error('🔍 Error parsing user_data:', error);
      return 'anon';
    }
  }

  private static k(base: string): string {
    return `${base}:${this.getCurrentUserId()}`;
  }

  /**
   * Initialize trial for a new user
   */
  static initializeTrial(): void {
    const existingTrial = this.getTrialInfo();
    if (!existingTrial) {
      const startDate = new Date();
      localStorage.setItem(this.k(this.TRIAL_KEY_BASE), startDate.toISOString());
      console.log('Trial initialized for user');
    }
  }

  /**
   * Get current trial information
   */
  static getTrialInfo(): TrialInfo | null {
    const trialStartStr = localStorage.getItem(this.k(this.TRIAL_KEY_BASE));
    if (!trialStartStr) {
      return null;
    }

    const startDate = new Date(trialStartStr);
    const endDate = new Date(startDate.getTime() + this.TRIAL_DURATION);
    const now = new Date();
    const remainingTime = Math.max(0, endDate.getTime() - now.getTime());
    const isExpired = remainingTime <= 0;

    return {
      isActive: !isExpired,
      startDate,
      endDate,
      isExpired,
      remainingTime,
      remainingHours: Math.floor(remainingTime / (1000 * 60 * 60)),
      remainingMinutes: Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60))
    };
  }

  /**
   * Check if trial has expired
   */
  static isTrialExpired(): boolean {
    const trialInfo = this.getTrialInfo();
    return trialInfo ? trialInfo.isExpired : false;
  }

  /**
   * Fetch subscription status from backend
   */
  static async fetchSubscriptionFromBackend(): Promise<{ hasActiveSubscription: boolean; subscriptionInfo: SubscriptionInfo | null }> {
    try {
      const userId = this.getCurrentUserId();
      if (userId === 'anon') {
        console.log('🔍 No user ID found, cannot fetch subscription from backend');
        return { hasActiveSubscription: false, subscriptionInfo: null };
      }

      console.log('🔄 Fetching subscription status from backend...');
      console.log('🔍 Request URL:', `${this.API_BASE_URL}/subscription/status?user_id=${userId}`);
      const response = await fetch(`${this.API_BASE_URL}/subscription/status?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Backend response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Backend subscription response:', result);

        if (result.success && result.data) {
          // New backend returns shape with has_active_subscription and nested subscription
          const data = result.data as any;
          if (data.has_active_subscription && data.subscription) {
            const sub = data.subscription;
            const subscriptionInfo: SubscriptionInfo = {
              isActive: true,
              isExpired: false,
              startDate: sub.start_date,
              endDate: sub.end_date,
              planId: sub.plan_id,
              planName: sub.plan_name || 'Plan',
              formattedRemainingTime: this.formatRemaining(new Date(sub.end_date).getTime() - Date.now()),
              progressPercentage: 0
            };
            console.log('✅ Active subscription found in backend');
            return { hasActiveSubscription: true, subscriptionInfo };
          }
        }
      } else {
        console.log('❌ Backend subscription fetch failed:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching subscription from backend:', error);
    }

    return { hasActiveSubscription: false, subscriptionInfo: null };
  }

  /**
   * Check if user has an active subscription (ONLY from backend, NO localStorage)
   */
  static async hasActiveSubscription(): Promise<boolean> {
    console.log('🔄 Checking subscription status from backend ONLY...');

    // ONLY fetch from backend - NO localStorage fallback
    const backendResult = await this.fetchSubscriptionFromBackend();

    console.log('🔍 Backend subscription result:', backendResult);

    if (backendResult.hasActiveSubscription) {
      console.log('✅ User has active subscription from backend');
      return true;
    }

    console.log('❌ No active subscription found in backend');
    return false;
  }

  /**
   * Get subscription information (ONLY from backend, NO localStorage)
   */
  static async getSubscriptionInfo(): Promise<SubscriptionInfo | null> {
    console.log('🔄 Getting subscription info from backend ONLY...');

    // ONLY fetch from backend - NO localStorage
    const backendResult = await this.fetchSubscriptionFromBackend();

    if (backendResult.subscriptionInfo) {
      console.log('✅ Using subscription info from backend:', backendResult.subscriptionInfo);
      return backendResult.subscriptionInfo;
    }

    console.log('❌ No subscription info found in backend');
    return null;
  }

  /**
   * Check if user can access the app (either trial active or subscription active)
   */
  static async canAccessApp(): Promise<boolean> {
    const hasSubscription = await this.hasActiveSubscription();
    const trialInfo = this.getTrialInfo();
    const trialActive = trialInfo ? !trialInfo.isExpired : false;
    const canAccess = hasSubscription || trialActive;

    console.log('🔍 Access check:', {
      hasSubscription,
      trialActive,
      canAccess,
      trialInfo: trialInfo ? { isExpired: trialInfo.isExpired, remainingTime: trialInfo.remainingTime } : null
    });

    return canAccess;
  }

  /**
   * Get formatted remaining time string
   */
  static getFormattedRemainingTime(): string {
    const trialInfo = this.getTrialInfo();
    if (!trialInfo || trialInfo.isExpired) {
      return 'Trial expired';
    }

    if (trialInfo.remainingHours > 0) {
      return `${trialInfo.remainingHours}h ${trialInfo.remainingMinutes}m remaining`;
    }

    return `${trialInfo.remainingMinutes}m remaining`;
  }

  /**
   * Mark subscription as active (called after successful payment)
   */
  static activateSubscription(): void {
    // Legacy: mark as active for 5 years
    const expiresAt = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000);
    localStorage.setItem(this.k(this.SUBSCRIPTION_STATUS_KEY_BASE), 'active');
    localStorage.setItem(this.k(this.SUBSCRIPTION_EXPIRES_KEY_BASE), expiresAt.toISOString());
    console.log('Subscription activated (5y)');
  }

  /**
   * Activate subscription for a number of days (or minutes if testing).
   * Example: activateSubscriptionForDays(7) -> 7 days (or 7 minutes in test mode)
   */
  static async activateSubscriptionForDays(days: number, paystackData?: any): Promise<boolean> {
    try {
      // Try backend first
      const firebaseUid = this.getCurrentFirebaseUid();
      if (firebaseUid) {
        const response = await fetch(`${this.API_BASE_URL}/subscription/activate-days`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            firebase_uid: firebaseUid,
            duration_days: days,
            paystack_data: paystackData || {}
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            console.log(`✅ Backend subscription activated for ${days} days`);
            // Clear local cache to force refresh
            this.clearUserAccessStatusCache();
            return true;
          }
        }
      }

      // Fallback to local storage
      const unit = this.SUBSCRIPTION_TIME_UNIT;
      const durationMs = unit === 'minutes'
        ? days * 60 * 1000
        : days * 24 * 60 * 60 * 1000;
      const expiresAt = new Date(Date.now() + durationMs);
      localStorage.setItem(this.k(this.SUBSCRIPTION_STATUS_KEY_BASE), 'active');
      localStorage.setItem(this.k(this.SUBSCRIPTION_EXPIRES_KEY_BASE), expiresAt.toISOString());
      console.log(`Subscription activated locally for ${days} ${unit}`);
      return true;
    } catch (error) {
      console.error('Error activating subscription for days:', error);
      // Fallback to local storage
      const unit = this.SUBSCRIPTION_TIME_UNIT;
      const durationMs = unit === 'minutes'
        ? days * 60 * 1000
        : days * 24 * 60 * 60 * 1000;
      const expiresAt = new Date(Date.now() + durationMs);
      localStorage.setItem(this.k(this.SUBSCRIPTION_STATUS_KEY_BASE), 'active');
      localStorage.setItem(this.k(this.SUBSCRIPTION_EXPIRES_KEY_BASE), expiresAt.toISOString());
      console.log(`Subscription activated locally for ${days} ${unit}`);
      return true;
    }
  }

  /**
   * Clear user access status cache
   */
  private static clearUserAccessStatusCache(): void {
    try {
      localStorage.removeItem(this.USER_ACCESS_STATUS_KEY);
      console.log('✅ User access status cache cleared');
    } catch (error) {
      console.error('Error clearing user access status cache:', error);
    }
  }

  /**
   * Reset trial (for testing purposes)
   */
  static resetTrial(): void {
    localStorage.removeItem(this.k(this.TRIAL_KEY_BASE));
    localStorage.removeItem(this.k(this.SUBSCRIPTION_STATUS_KEY_BASE));
    localStorage.removeItem(this.k(this.SUBSCRIPTION_EXPIRES_KEY_BASE));
    console.log('Trial reset');
  }

  /**
   * Get trial progress percentage
   */
  static getTrialProgress(): number {
    const trialInfo = this.getTrialInfo();
    if (!trialInfo || trialInfo.isExpired) {
      return 100;
    }

    const totalTime = this.TRIAL_DURATION;
    const elapsedTime = totalTime - trialInfo.remainingTime;
    return Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
  }

  // Helper methods for backend integration (keeping minimal)
  private static getCurrentFirebaseUid(): string | null {
    try {
      const raw = localStorage.getItem('user_data');
      if (!raw) return null;
      const user = JSON.parse(raw);
      return user?.uid || null;
    } catch {
      return null;
    }
  }

  private static getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('supabase_token') || localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private static USER_ACCESS_STATUS_KEY = 'meallensai_user_access_status';

  private static formatRemaining(ms: number): string {
    if (ms <= 0) return 'Expired';
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h remaining`;
    if (hours > 0) return `${hours}h ${minutes % 60}m remaining`;
    return `${Math.max(1, minutes)}m remaining`;
  }
}