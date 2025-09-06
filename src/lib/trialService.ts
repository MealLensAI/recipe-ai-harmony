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
  endDate: string;
  startDate: string;
  planId?: string;
  planName?: string;
  formattedRemainingTime: string;
  progressPercentage: number;
}

export interface UserAccessStatus {
  canAccess: boolean;
  hasActiveSubscription: boolean;
  isTrialExpired: boolean;
  isSubscriptionExpired: boolean;
  subscriptionInfo: SubscriptionInfo | null;
}

export class TrialService {
  // Trial duration. For production use 24 * 60 * 60 * 1000.
  private static TRIAL_DURATION = 24 * 60 * 60 * 1000; // 10 minutes for testing

  // Time unit used for subscription testing. Set to 'days' for normal use,
  // change to 'minutes' to speed up testing.
  private static SUBSCRIPTION_TIME_UNIT: 'days' | 'minutes' =
    (import.meta as any)?.env?.VITE_SUB_TIME_UNIT === 'minutes' ? 'minutes' : 'days';

  // Base keys (per-user suffix is appended internally)
  private static TRIAL_KEY_BASE = 'meallensai_trial_start';
  private static SUBSCRIPTION_STATUS_KEY_BASE = 'meallensai_subscription_status';
  private static SUBSCRIPTION_EXPIRES_KEY_BASE = 'meallensai_subscription_expires_at';
  private static USER_ACCESS_STATUS_KEY = 'meallensai_user_access_status';
  private static API_BASE_URL = (import.meta as any)?.env?.VITE_API_URL || 'http://127.0.0.1:8083/api';

  // Helpers to build per-user keys
  private static getCurrentUserId(): string {
    try {
      // Check for Supabase user data first
      const supabaseUserId = localStorage.getItem('supabase_user_id');
      if (supabaseUserId) {
        return supabaseUserId;
      }

      // Fallback to user_data
      const raw = localStorage.getItem('user_data');
      if (!raw) return 'anon';
      const user = JSON.parse(raw);
      return user?.uid || user?.id || user?.email || 'anon';
    } catch {
      return 'anon';
    }
  }

  private static getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('supabase_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  private static k(base: string): string {
    return `${base}:${this.getCurrentUserId()}`;
  }

  /**
   * Initialize trial for a new user or existing user without trial
   */
  static initializeTrial(): void {
    const existingTrial = this.getTrialInfo();
    if (!existingTrial) {
      const startDate = new Date();
      localStorage.setItem(this.k(this.TRIAL_KEY_BASE), startDate.toISOString());
      console.log('Trial initialized for user:', this.getCurrentUserId());
    } else {
      console.log('Trial already exists for user:', this.getCurrentUserId());
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
   * Check if user has an active subscription
   */
  static hasActiveSubscription(): boolean {
    const expiresAtIso = localStorage.getItem(this.k(this.SUBSCRIPTION_EXPIRES_KEY_BASE));
    if (!expiresAtIso) {
      console.log('🔍 No subscription expiration found in localStorage');
      return false;
    }
    const expiresAt = new Date(expiresAtIso).getTime();
    const isActive = Date.now() < expiresAt;
    console.log('🔍 Subscription status:', {
      expiresAtIso,
      expiresAt: new Date(expiresAt),
      now: new Date(),
      isActive
    });
    return isActive;
  }

  /**
   * Check if user can access the app (either trial active or subscription active)
   */
  static canAccessApp(): boolean {
    const hasSubscription = this.hasActiveSubscription();
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
      const userId = this.getCurrentUserId();
      if (userId && userId !== 'anon') {
        const response = await fetch(`${this.API_BASE_URL}/subscription/activate-days`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            user_id: userId,
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

  // Fetch comprehensive access status from backend + synthesize frontend fallback
  static async getUserAccessStatus(): Promise<UserAccessStatus> {
    const userId = this.getCurrentUserId();
    const cachedRaw = localStorage.getItem(this.USER_ACCESS_STATUS_KEY);
    const now = Date.now();
    try {
      // Optional: use lightweight cache window to reduce calls
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached.userId === userId && now - (cached.cachedAt || 0) < 30_000) {
          return cached.value as UserAccessStatus;
        }
      }

      // Query backend status
      const resp = await fetch(`${this.API_BASE_URL}/subscription/status?user_id=${encodeURIComponent(userId)}`, {
        headers: this.getAuthHeaders()
      });
      if (resp.ok) {
        const result = await resp.json();
        if (result.success) {
          const sub = result.data.subscription as any | null;
          const trial = result.data.trial as any | null;

          // Build subscription info summary
          let subscriptionInfo: SubscriptionInfo | null = null;
          let subActive = false;
          let subExpired = false;
          let formatted = 'No active subscription';
          let progress = 0;
          if (sub && sub.end_date) {
            const end = new Date(sub.end_date);
            const start = sub.start_date ? new Date(sub.start_date) : new Date();
            const msLeft = end.getTime() - now;
            subActive = msLeft > 0;
            subExpired = !subActive;
            formatted = msLeft > 0 ? this.formatRemaining(msLeft) : 'Expired';
            const total = Math.max(1, end.getTime() - start.getTime());
            progress = Math.min(100, Math.max(0, ((total - msLeft) / total) * 100));
            subscriptionInfo = {
              isActive: subActive,
              isExpired: subExpired,
              startDate: start.toISOString(),
              endDate: end.toISOString(),
              planId: sub.plan_id,
              planName: sub.plan_name,
              formattedRemainingTime: formatted,
              progressPercentage: progress
            };
          }

          const trialExpired = trial ? new Date(trial.end_date).getTime() <= now : true;
          const canAccess = !!(subscriptionInfo?.isActive) || (!!trial && !trialExpired);

          const value: UserAccessStatus = {
            canAccess,
            hasActiveSubscription: !!subscriptionInfo?.isActive,
            isTrialExpired: trial ? trialExpired : true,
            isSubscriptionExpired: subscriptionInfo ? subscriptionInfo.isExpired : true,
            subscriptionInfo
          };

          localStorage.setItem(this.USER_ACCESS_STATUS_KEY, JSON.stringify({ userId, cachedAt: now, value }));
          return value;
        }
      }
    } catch (e) {
      console.warn('Falling back to local access status:', e);
    }

    // Fallback to local logic
    const trialInfo = this.getTrialInfo();
    const hasSub = this.hasActiveSubscription();
    const canAccess = hasSub || (trialInfo ? !trialInfo.isExpired : false);
    return {
      canAccess,
      hasActiveSubscription: hasSub,
      isTrialExpired: trialInfo ? trialInfo.isExpired : true,
      isSubscriptionExpired: !hasSub,
      subscriptionInfo: null
    };
  }

  private static formatRemaining(ms: number): string {
    if (ms <= 0) return 'Expired';
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h remaining`;
    if (hours > 0) return `${hours}h ${minutes % 60}m remaining`;
    return `${Math.max(1, minutes)}m remaining`;
  }

  // Create a trial in Supabase for this user (idempotent server logic)
  static async createBackendTrial(durationDays: number = 7): Promise<boolean> {
    try {
      const userId = this.getCurrentUserId();
      const resp = await fetch(`${this.API_BASE_URL}/subscription/create-trial`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ user_id: userId, duration_days: durationDays })
      });
      if (!resp.ok) return false;
      const result = await resp.json();
      // Clear local cache to force refresh
      this.clearUserAccessStatusCache();
      return !!result.success;
    } catch (e) {
      return false;
    }
  }
}
