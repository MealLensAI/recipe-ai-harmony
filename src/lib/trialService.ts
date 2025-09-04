export interface TrialInfo {
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  isExpired: boolean;
  remainingTime: number; // in milliseconds
  remainingHours: number;
  remainingMinutes: number;
}

export class TrialService {
  // Trial duration. For production use 24 * 60 * 60 * 1000.
  private static TRIAL_DURATION = 10 * 60 * 1000;

  // Time unit used for subscription testing. Set to 'days' for normal use,
  // change to 'minutes' to speed up testing.
  private static SUBSCRIPTION_TIME_UNIT: 'days' | 'minutes' =
    (import.meta as any)?.env?.VITE_SUB_TIME_UNIT === 'minutes' ? 'minutes' : 'days';

  // Base keys (per-user suffix is appended internally)
  private static TRIAL_KEY_BASE = 'meallensai_trial_start';
  private static SUBSCRIPTION_STATUS_KEY_BASE = 'meallensai_subscription_status';
  private static SUBSCRIPTION_EXPIRES_KEY_BASE = 'meallensai_subscription_expires_at';

  // Helpers to build per-user keys
  private static getCurrentUserId(): string {
    try {
      const raw = localStorage.getItem('user_data');
      if (!raw) return 'anon';
      const user = JSON.parse(raw);
      return user?.uid || user?.id || user?.email || 'anon';
    } catch {
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
   * Check if user has an active subscription
   */
  static hasActiveSubscription(): boolean {
    const expiresAtIso = localStorage.getItem(this.k(this.SUBSCRIPTION_EXPIRES_KEY_BASE));
    if (!expiresAtIso) {
      return false;
    }
    const expiresAt = new Date(expiresAtIso).getTime();
    return Date.now() < expiresAt;
  }

  /**
   * Check if user can access the app (either trial active or subscription active)
   */
  static canAccessApp(): boolean {
    if (this.hasActiveSubscription()) {
      return true;
    }

    const trialInfo = this.getTrialInfo();
    return trialInfo ? !trialInfo.isExpired : false;
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
  static activateSubscriptionForDays(days: number): void {
    const unit = this.SUBSCRIPTION_TIME_UNIT;
    const durationMs = unit === 'minutes'
      ? days * 60 * 1000
      : days * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + durationMs);
    localStorage.setItem(this.k(this.SUBSCRIPTION_STATUS_KEY_BASE), 'active');
    localStorage.setItem(this.k(this.SUBSCRIPTION_EXPIRES_KEY_BASE), expiresAt.toISOString());
    console.log(`Subscription activated for ${days} ${unit}`);
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
}
