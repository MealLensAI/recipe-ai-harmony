// Quick script to force frontend subscription expiry for testing
// Run this in the browser console to test the blocking UI

console.log("🧪 Forcing subscription expiry for testing...");

// Method 1: Override the subscription service
if (window.subscriptionService) {
    const originalIsSubscriptionExpired = window.subscriptionService.isSubscriptionExpired;
    window.subscriptionService.isSubscriptionExpired = function (status) {
        console.log("🔍 Forced subscription expiry check - returning true");
        return true; // Force expiry
    };
    console.log("✅ Override applied - subscription will appear expired");
}

// Method 2: Override localStorage to simulate expired subscription
const expiredSubscriptionData = {
    subscription: {
        remaining_days: 0,
        remaining_hours: 0,
        remaining_minutes: 0,
        end_date: new Date(Date.now() - 1000).toISOString() // 1 second ago
    },
    has_active_subscription: true,
    can_access_app: false
};

localStorage.setItem('subscription_status', JSON.stringify(expiredSubscriptionData));
console.log("✅ localStorage updated with expired subscription data");

// Method 3: Force page refresh to apply changes
console.log("🔄 Refreshing page to apply changes...");
setTimeout(() => {
    window.location.reload();
}, 1000);

// Instructions
console.log(`
📋 Testing Instructions:
1. The page will refresh automatically
2. You should see the "Subscription Expired" blocking modal
3. The modal should prevent access to the app
4. Only /payment, /settings, /login, /signup should be accessible

🔧 To restore normal behavior:
- Clear localStorage: localStorage.removeItem('subscription_status')
- Refresh the page
`);
