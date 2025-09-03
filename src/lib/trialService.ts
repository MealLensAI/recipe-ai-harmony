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
  private static TRIAL_DURATION = 30 * 60 * 1000; // 24 hours in milliseconds  24 * 60 * 60 * 1000
  private static TRIAL_KEY = 'meallensai_trial_start';
  private static SUBSCRIPTION_KEY = 'meallensai_subscription_status';

  /**
   * Initialize trial for a new user
   */
  static initializeTrial(): void {
    const existingTrial = this.getTrialInfo();
    if (!existingTrial) {
      const startDate = new Date();
      localStorage.setItem(this.TRIAL_KEY, startDate.toISOString());
      console.log('Trial initialized for user');
    }
  }

  /**
   * Get current trial information
   */
  static getTrialInfo(): TrialInfo | null {
    const trialStartStr = localStorage.getItem(this.TRIAL_KEY);
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
    const subscriptionStatus = localStorage.getItem(this.SUBSCRIPTION_KEY);
    return subscriptionStatus === 'active';
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
    localStorage.setItem(this.SUBSCRIPTION_KEY, 'active');
    console.log('Subscription activated');
  }

  /**
   * Reset trial (for testing purposes)
   */
  static resetTrial(): void {
    localStorage.removeItem(this.TRIAL_KEY);
    localStorage.removeItem(this.SUBSCRIPTION_KEY);
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
