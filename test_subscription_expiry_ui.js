// Quick test to force subscription expiry UI
// Run this in the browser console to test the subscription expiry message

console.log("🧪 Testing Subscription Expiry UI...");

// Method 1: Override the subscription service to force expiry
if (window.subscriptionService) {
    const originalIsSubscriptionExpired = window.subscriptionService.isSubscriptionExpired;
    window.subscriptionService.isSubscriptionExpired = function (status) {
        console.log("🔍 Forced subscription expiry - returning true");
        return true; // Force expiry
    };
    console.log("✅ Subscription service override applied");
}

// Method 2: Override localStorage to simulate expired subscription
const expiredSubscriptionData = {
    subscription: {
        remaining_days: 0,
        remaining_hours: 0,
        remaining_minutes: 0,
        end_date: new Date(Date.now() - 1000).toISOString(), // 1 second ago
        isActive: true, // User has a subscription but it's expired
        isExpired: true
    },
    has_active_subscription: true,
    can_access_app: false
};

localStorage.setItem('subscription_status', JSON.stringify(expiredSubscriptionData));
console.log("✅ localStorage updated with expired subscription data");

// Method 3: Force the useTrial hook to show hasActiveSubscription = true
// This will make the TrialBlocker show "Subscription Expired" instead of "Access Restricted"

// Instructions
console.log(`
📋 Test Results Expected:
1. The page will refresh automatically
2. You should see "Subscription Expired" (not "Access Restricted")
3. The message should say "Your subscription has expired. Please renew..."
4. The button should say "Renew Subscription" (not "Upgrade Now")

🔧 To restore normal behavior:
- Clear localStorage: localStorage.removeItem('subscription_status')
- Refresh the page
`);

// Force page refresh to apply changes
console.log("🔄 Refreshing page to apply changes...");
setTimeout(() => {
    window.location.reload();
}, 1000);
