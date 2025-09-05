# How to Check Which Users Have Paid

## Current Status

**No users have paid yet** - The system is set up and ready, but there are currently:
- 0 users registered
- 0 completed payments  
- 0 active subscriptions
- 0 trials

## Available Subscription Plans

The system has 6 subscription plans configured:

1. **Free Plan** - $10.0 (28 days) - Basic features
2. **Two Weeks Plan** - $10.0 (28 days) - Basic features  
3. **Weekly Plan** - $2.0 (7 days) - Basic meal planning, Food detection, Recipe suggestions
4. **Bi-Weekly Plan** - $5.0 (14 days) - Weekly features, Recipe collections, Meal history
5. **Monthly Plan** - $10.0 (28 days) - Bi-weekly features, Nutrition tracking, Advanced analytics
6. **Yearly Plan** - $100.0 (365 days) - Monthly features, API access, Priority support

## How to Check Paid Users

### Method 1: Use the Report Script (Recommended)

```bash
cd backend
python scripts/paid_users_report.py
```

This will show:
- Total users
- Completed payments with amounts
- Active subscriptions
- Total revenue
- Conversion rates
- User breakdown

### Method 2: Check Specific User

```bash
cd backend
python scripts/paid_users_report.py USER_ID_OR_FIREBASE_UID
```

### Method 3: Simple Check

```bash
cd backend
python scripts/simple_paid_check.py
```

## Database Tables

The system tracks payments and subscriptions in these tables:

- **`profiles`** - User profiles with Firebase UID
- **`user_subscriptions`** - Active subscriptions
- **`payment_transactions`** - Payment history
- **`user_trials`** - Trial periods
- **`subscription_plans`** - Available plans

## How the System Determines if Someone Has Paid

1. **Payment Verification**: When a user pays via Paystack, the payment is recorded in `payment_transactions` with status `completed`

2. **Subscription Creation**: Successful payment creates a record in `user_subscriptions` with status `active`

3. **Access Check**: The system uses the `get_user_subscription_status()` function to check:
   - Active subscriptions (status = 'active' and end_date > now)
   - Active trials (end_date > now)
   - Overall access permission

4. **Frontend Protection**: Components like `FeatureProtector` and `SubscriptionBlocker` check subscription status and block access if expired

## When Users Start Paying

Once users start paying, you can run the report script to see:

- **Who has paid** (user details, amounts, dates)
- **Active subscriptions** (plan types, expiration dates)
- **Revenue totals** (daily, weekly, monthly)
- **Conversion rates** (trial to paid conversion)
- **User status** (paid, trial, no access)

## Key Commands

```bash
# Full report
python scripts/paid_users_report.py

# Check specific user
python scripts/paid_users_report.py firebase_uid_here

# Simple check
python scripts/simple_paid_check.py

# Test subscription system
python scripts/test_subscription_flow.py
```

## Next Steps

1. **Wait for users to sign up** - The system is ready
2. **Monitor payments** - Run the report script regularly
3. **Check specific users** - Use the user-specific command when needed
4. **Track revenue** - The report shows total revenue and conversion rates

The system is fully functional and will automatically track all payments and subscriptions once users start using it.
