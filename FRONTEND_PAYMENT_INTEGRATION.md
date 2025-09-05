# Frontend Payment Integration Guide

## Problem Solved

The issue was that users who paid through the frontend were not being saved to the backend database. This has been fixed with new endpoints that:

1. **Automatically register users** when they make payments
2. **Don't require authentication** for payment processing
3. **Properly save payment and subscription data** to the backend

## New Backend Endpoints

### 1. Register Firebase User
**POST** `/api/auth/register-firebase`

Registers a user using their Firebase UID (for users who pay but aren't in backend yet).

```javascript
const response = await fetch('/api/auth/register-firebase', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    firebase_uid: user.uid,
    email: user.email,
    full_name: user.displayName || '',
    first_name: '', // optional
    last_name: ''   // optional
  })
});
```

### 2. Initialize Payment (Firebase)
**POST** `/api/payment/initialize-payment-firebase`

Initializes a Paystack payment for Firebase users. **Automatically registers the user** if they don't exist.

```javascript
const response = await fetch('/api/payment/initialize-payment-firebase', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    firebase_uid: user.uid,
    email: user.email,
    amount: 1000, // Amount in KES
    plan_id: 'plan-uuid-here',
    full_name: user.displayName || '',
    callback_url: 'https://yourapp.com/payment/callback'
  })
});

const data = await response.json();
if (data.status === 'success') {
  // Redirect to Paystack
  window.location.href = data.data.authorization_url;
}
```

### 3. Verify Payment (Firebase)
**POST** `/api/payment/verify-payment-firebase`

Verifies a Paystack payment and activates the subscription.

```javascript
const response = await fetch('/api/payment/verify-payment-firebase', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    reference: paymentReference,
    firebase_uid: user.uid
  })
});

const data = await response.json();
if (data.status === 'success') {
  console.log('Payment verified and subscription activated!');
  console.log('User ID:', data.user_id);
}
```

## Complete Payment Flow

Here's how to implement the complete payment flow in your frontend:

### Step 1: Get Available Plans
```javascript
const getPlans = async () => {
  const response = await fetch('/api/subscription/plans');
  const data = await response.json();
  return data.plans;
};
```

### Step 2: Initialize Payment
```javascript
const initializePayment = async (user, plan) => {
  const response = await fetch('/api/payment/initialize-payment-firebase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      firebase_uid: user.uid,
      email: user.email,
      amount: plan.price_usd,
      plan_id: plan.id,
      full_name: user.displayName || '',
      callback_url: `${window.location.origin}/payment/callback`
    })
  });

  const data = await response.json();
  
  if (data.status === 'success') {
    // Store reference for verification
    localStorage.setItem('payment_reference', data.data.reference);
    
    // Redirect to Paystack
    window.location.href = data.data.authorization_url;
  } else {
    console.error('Payment initialization failed:', data.message);
  }
};
```

### Step 3: Handle Payment Callback
```javascript
const handlePaymentCallback = async (user) => {
  const reference = localStorage.getItem('payment_reference');
  if (!reference) return;

  try {
    const response = await fetch('/api/payment/verify-payment-firebase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference: reference,
        firebase_uid: user.uid
      })
    });

    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('Payment successful!');
      console.log('Subscription activated for user:', data.user_id);
      
      // Clear stored reference
      localStorage.removeItem('payment_reference');
      
      // Redirect to success page
      window.location.href = '/payment/success';
    } else {
      console.error('Payment verification failed:', data.message);
      // Redirect to error page
      window.location.href = '/payment/error';
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
  }
};
```

### Step 4: Check Subscription Status
```javascript
const checkSubscriptionStatus = async (user) => {
  const response = await fetch(`/api/subscription/status?firebase_uid=${user.uid}`);
  const data = await response.json();
  
  if (data.success) {
    const status = data.data;
    console.log('Has active subscription:', status.has_active_subscription);
    console.log('Can access app:', status.can_access_app);
    
    if (status.subscription) {
      console.log('Plan:', status.subscription.plan_name);
      console.log('End date:', status.subscription.end_date);
    }
  }
};
```

## Key Benefits

1. **No Authentication Required**: Users don't need to be pre-registered in the backend
2. **Automatic Registration**: Users are automatically registered when they make their first payment
3. **Proper Data Storage**: All payment and subscription data is properly saved to the backend
4. **Firebase Integration**: Works seamlessly with Firebase authentication
5. **Error Handling**: Comprehensive error handling and user feedback

## Testing

You can test the new endpoints using the test script:

```bash
cd backend
python scripts/test_firebase_payment_flow.py
```

## Monitoring Paid Users

After users start paying, you can check who has paid using:

```bash
cd backend
python scripts/paid_users_report.py
```

This will show:
- Total users
- Completed payments
- Active subscriptions
- Total revenue
- Conversion rates

## Important Notes

1. **Use the Firebase endpoints** (`-firebase` suffix) for frontend payments
2. **Always include `firebase_uid`** in your requests
3. **Store payment references** temporarily for verification
4. **Handle errors gracefully** and provide user feedback
5. **Test with real Paystack credentials** in production

The system is now ready to properly track and save all paid users from the frontend!
