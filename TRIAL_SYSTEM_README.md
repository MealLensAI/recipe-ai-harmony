# MealLensAI Trial System

This document describes the 24-hour trial system implementation for MealLensAI.

## Overview

The trial system provides users with a 24-hour free trial period to explore the app's features. After the trial expires, users are blocked from accessing most features and prompted to upgrade to a paid subscription.

## Features

- **24-hour trial period** for new users
- **Automatic trial initialization** when users first access the app
- **Real-time trial status tracking** with countdown timer
- **Trial expiration blocking** - restricts access to app features
- **Payment modal** that appears when trial expires
- **Subscription activation** after successful payment
- **Trial status indicator** in the navbar showing remaining time
- **Progress bar** showing trial completion percentage

## Components

### 1. TrialService (`src/lib/trialService.ts`)
Core service that manages trial logic:
- Trial initialization and tracking
- Time calculations and expiration checks
- Subscription status management
- Local storage operations

### 2. TrialBlocker (`src/components/TrialBlocker.tsx`)
Main component that wraps the entire app:
- Checks trial status on every page
- Shows blocking overlay when trial expires
- Manages trial expired modal display
- Allows access to payment and settings pages

### 3. TrialExpiredModal (`src/components/TrialExpiredModal.tsx`)
Modal that appears when trial expires:
- Informs user about trial expiration
- Lists app features and benefits
- Provides upgrade button leading to payment page
- Can be dismissed temporarily

### 4. TrialStatusIndicator (`src/components/TrialStatusIndicator.tsx`)
Navbar component showing trial status:
- Displays remaining time
- Shows progress bar
- Color-coded status (blue=active, orange=warning, red=expired)
- Warning icon when less than 2 hours remain

### 5. useTrial Hook (`src/hooks/useTrial.ts`)
Custom React hook for trial management:
- Provides trial state and functions
- Handles real-time updates
- Manages subscription activation

## How It Works

### Trial Initialization
1. When a user first accesses the app, `TrialService.initializeTrial()` is called
2. Trial start time is stored in localStorage
3. Trial duration is set to 24 hours (86,400,000 milliseconds)

### Trial Tracking
1. Trial status is checked every minute
2. Remaining time is calculated in real-time
3. Progress percentage is updated continuously
4. Status indicators are updated accordingly

### Trial Expiration
1. When trial expires, `TrialBlocker` detects the change
2. Blocking overlay appears on restricted pages
3. Trial expired modal is shown
4. User can only access payment, settings, login, and signup pages

### Subscription Activation
1. After successful payment, `TrialService.activateSubscription()` is called
2. Subscription status is stored in localStorage
3. All trial restrictions are removed
4. User has full access to the app

## Usage

### Basic Implementation
The trial system is automatically integrated into the app via `TrialBlocker` in `App.tsx`:

```tsx
function App() {
  return (
    <AuthProvider>
      <TrialBlocker>
        <div className="App">
          <RouterProvider router={router} />
          <Toaster />
        </div>
      </TrialBlocker>
    </AuthProvider>
  )
}
```

### Using the Trial Hook
```tsx
import { useTrial } from '@/hooks/useTrial';

const MyComponent = () => {
  const { 
    canAccess, 
    isTrialExpired, 
    formattedRemainingTime,
    activateSubscription 
  } = useTrial();

  if (!canAccess) {
    return <div>Trial expired! Please upgrade.</div>;
  }

  return (
    <div>
      <p>Time remaining: {formattedRemainingTime}</p>
      {/* Your component content */}
    </div>
  );
};
```

### Checking Trial Status
```tsx
import { TrialService } from '@/lib/trialService';

// Check if user can access the app
const canAccess = TrialService.canAccessApp();

// Get trial information
const trialInfo = TrialService.getTrialInfo();

// Check if trial has expired
const isExpired = TrialService.isTrialExpired();

// Get formatted remaining time
const remainingTime = TrialService.getFormattedRemainingTime();
```

## Configuration

### Trial Duration
To change the trial duration, modify the `TRIAL_DURATION` constant in `TrialService`:

```typescript
private static TRIAL_DURATION = 24 * 60 * 60 * 1000; // 24 hours
// Change to: 7 * 24 * 60 * 60 * 1000; // 7 days
```

### Allowed Paths
To modify which pages users can access after trial expiration, update the `allowedPaths` array in `TrialBlocker`:

```typescript
const allowedPaths = ['/payment', '/settings', '/login', '/signup'];
```

### Local Storage Keys
The system uses these localStorage keys:
- `meallensai_trial_start`: Trial start timestamp
- `meallensai_subscription_status`: Subscription status

## Testing

### Trial Test Page
Access `/trial-test` to test the trial system:
- View current trial status
- See remaining time and progress
- Test subscription activation
- Reset trial for testing
- View debug information

### Manual Testing
1. **Test trial initialization**: Clear localStorage and refresh page
2. **Test expiration**: Manually set trial start time to 25+ hours ago
3. **Test subscription**: Use "Activate Subscription" button in test page
4. **Test blocking**: Navigate to restricted pages after trial expires

### Browser DevTools
```javascript
// Check trial status
localStorage.getItem('meallensai_trial_start')
localStorage.getItem('meallensai_subscription_status')

// Reset trial
localStorage.removeItem('meallensai_trial_start')
localStorage.removeItem('meallensai_subscription_status')

// Set trial to expired (25 hours ago)
localStorage.setItem('meallensai_trial_start', new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString())
```

## Integration with Payment System

The trial system integrates with the existing payment system:
1. When trial expires, users are directed to `/payment`
2. After successful payment, `TrialService.activateSubscription()` is called
3. Subscription status is updated in localStorage
4. User gains full access to the app

## Security Considerations

- Trial status is stored in localStorage (client-side)
- For production, consider server-side trial validation
- Implement rate limiting for trial reset functionality
- Add server-side checks for subscription status

## Future Enhancements

- **Server-side trial management** with database storage
- **Trial extension options** for special cases
- **Usage analytics** during trial period
- **Email notifications** before trial expiration
- **Multiple trial periods** for different user types
- **A/B testing** for different trial durations

## Troubleshooting

### Common Issues

1. **Trial not initializing**: Check if localStorage is enabled
2. **Modal not showing**: Verify TrialBlocker is wrapping the app
3. **Status not updating**: Check if useTrial hook is being used
4. **Blocking not working**: Ensure allowedPaths are correctly configured

### Debug Mode
Enable debug logging by adding console.log statements in TrialService methods.

### Performance
The system updates every minute. For better performance, consider:
- Reducing update frequency
- Using React.memo for components
- Implementing virtual scrolling for large lists

## Support

For issues or questions about the trial system:
1. Check the trial test page at `/trial-test`
2. Review browser console for errors
3. Verify localStorage values
4. Test with different trial states
