# Payment & Subscription API Documentation

## Overview

MealLens now includes a comprehensive payment system powered by Paystack, offering subscription plans with usage limits for free users and premium features for paid subscribers.

## Subscription Plans

### Free Plan
- **Price**: ₦0/month
- **Features**: Basic food detection, meal planning, recipe generation
- **Limits**: 
  - 5 food detections per month
  - 3 meal plans per month
  - 10 recipe generations per month

### Basic Plan
- **Price**: ₦1,000/month (₦10,000/year)
- **Features**: All free features + priority support, recipe export
- **Limits**:
  - 50 food detections per month
  - 20 meal plans per month
  - 100 recipe generations per month

### Premium Plan
- **Price**: ₦2,500/month (₦25,000/year)
- **Features**: All basic features + custom meal plans, nutrition analysis
- **Limits**:
  - 200 food detections per month
  - 100 meal plans per month
  - 500 recipe generations per month

### Enterprise Plan
- **Price**: ₦5,000/month (₦50,000/year)
- **Features**: All premium features + API access, white-label options
- **Limits**: Unlimited usage

## API Endpoints

### 1. Get Subscription Plans

```http
GET /api/payment/plans
```

**Description**: Retrieve all available subscription plans.

**Response**:
```json
{
  "status": "success",
  "plans": [
    {
      "id": "uuid",
      "name": "free",
      "display_name": "Free Plan",
      "price_monthly": 0.00,
      "price_yearly": 0.00,
      "currency": "NGN",
      "features": {
        "food_detection": true,
        "meal_planning": true,
        "recipe_generation": true
      },
      "limits": {
        "food_detection_per_month": 5,
        "meal_planning_per_month": 3,
        "recipe_generation_per_month": 10
      }
    }
  ]
}
```

### 2. Get User Subscription

```http
GET /api/payment/subscription
Authorization: Bearer <token>
```

**Description**: Get current user's subscription status.

**Response**:
```json
{
  "status": "success",
  "subscription": {
    "subscription": {
      "id": "uuid",
      "user_id": "uuid",
      "plan_id": "uuid",
      "status": "active",
      "current_period_start": "2024-01-01T00:00:00Z",
      "current_period_end": "2024-02-01T00:00:00Z"
    },
    "plan": {
      "name": "premium",
      "display_name": "Premium Plan",
      "features": {...},
      "limits": {...}
    }
  }
}
```

### 3. Get User Usage

```http
GET /api/payment/usage
Authorization: Bearer <token>
```

**Description**: Get current user's usage summary for the month.

**Response**:
```json
{
  "status": "success",
  "usage": {
    "food_detection": 15,
    "meal_planning": 8,
    "recipe_generation": 45
  }
}
```

### 4. Check Feature Usage

```http
GET /api/payment/check-usage/food_detection
Authorization: Bearer <token>
```

**Description**: Check if user can use a specific feature.

**Response**:
```json
{
  "status": "success",
  "can_use": true,
  "current_usage": 15,
  "limit": 50,
  "remaining": 35,
  "message": ""
}
```

### 5. Initialize Payment

```http
POST /api/payment/initialize-payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "user@example.com",
  "amount": 2500,
  "plan_id": "uuid",
  "callback_url": "https://yourapp.com/payment/callback"
}
```

**Description**: Initialize a Paystack payment for subscription.

**Response**:
```json
{
  "status": "success",
  "data": {
    "authorization_url": "https://checkout.paystack.com/...",
    "reference": "ML_user123_abc12345",
    "access_code": "access_code_123"
  }
}
```

### 6. Verify Payment

```http
GET /api/payment/verify-payment/ML_user123_abc12345
Authorization: Bearer <token>
```

**Description**: Verify a completed payment transaction.

**Response**:
```json
{
  "status": "success",
  "message": "Payment verified and subscription activated",
  "subscription": {
    "id": "uuid",
    "status": "active",
    "plan_id": "uuid"
  }
}
```

### 7. Cancel Subscription

```http
POST /api/payment/cancel-subscription
Authorization: Bearer <token>
```

**Description**: Cancel user's subscription (will end at period end).

**Response**:
```json
{
  "status": "success",
  "message": "Subscription will be cancelled at the end of the current period"
}
```

### 8. Upgrade Subscription

```http
POST /api/payment/upgrade-subscription
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan_id": "uuid"
}
```

**Description**: Upgrade user's subscription to a higher plan.

**Response**:
```json
{
  "status": "success",
  "message": "Subscription upgraded successfully",
  "plan": {
    "name": "premium",
    "display_name": "Premium Plan"
  }
}
```

## Usage Tracking Integration

All feature endpoints now include usage tracking and limit checking:

### Food Detection
- **Endpoint**: `POST /api/food_detection/food_detect`
- **Usage**: Counts as 1 food detection
- **Limit**: Based on user's plan

### Meal Planning
- **Endpoint**: `POST /api/meal_plan/smart_plan`
- **Usage**: Counts as 1 meal planning
- **Limit**: Based on user's plan

### Recipe Generation
- **Endpoint**: `POST /api/food_detection/food_detect_resources`
- **Usage**: Counts as 1 recipe generation
- **Limit**: Based on user's plan

## Error Responses

### Usage Limit Exceeded
```json
{
  "status": "error",
  "message": "Usage limit exceeded for this month",
  "current_usage": 50,
  "limit": 50,
  "remaining": 0
}
```

### Payment Failed
```json
{
  "status": "error",
  "message": "Payment verification failed"
}
```

## Environment Variables

Add these to your `.env` file:

```bash
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
```

## Webhook Configuration

Configure Paystack webhook URL:
```
https://yourdomain.com/api/payment/webhook
```

Supported events:
- `charge.success` - Payment successful
- `subscription.create` - Subscription created
- `subscription.disable` - Subscription cancelled

## Database Schema

The payment system uses these tables:
- `subscription_plans` - Available plans
- `user_subscriptions` - User subscriptions
- `usage_tracking` - Feature usage tracking
- `payment_transactions` - Payment history
- `paystack_webhooks` - Webhook events

## Implementation Notes

1. **Usage Limits**: Reset monthly based on subscription period
2. **Grace Period**: Users can continue using features until period end
3. **Upgrade/Downgrade**: Immediate effect for upgrades, period end for downgrades
4. **Webhook Security**: All webhooks are verified using Paystack signature
5. **Error Handling**: Graceful fallback if payment service is unavailable

## Frontend Integration

### Check Usage Before API Calls
```javascript
// Check if user can use feature
const response = await fetch('/api/payment/check-usage/food_detection', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const usage = await response.json();

if (!usage.can_use) {
  // Show upgrade prompt
  showUpgradeModal(usage);
  return;
}

// Proceed with feature usage
```

### Handle Usage Limit Errors
```javascript
try {
  const response = await fetch('/api/food_detection/food_detect', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  if (response.status === 403) {
    const error = await response.json();
    showUpgradePrompt(error);
  }
} catch (error) {
  console.error('API call failed:', error);
}
```

### Payment Flow
```javascript
// 1. Initialize payment
const payment = await fetch('/api/payment/initialize-payment', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    email: user.email,
    amount: 2500,
    plan_id: selectedPlan.id
  })
});

// 2. Redirect to Paystack
const { authorization_url } = await payment.json();
window.location.href = authorization_url;

// 3. Verify payment (on callback)
const verification = await fetch(`/api/payment/verify-payment/${reference}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
``` 