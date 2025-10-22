# 🔄 User Lifecycle Management System Setup Guide

## 🎯 **What This System Does**

This new system implements proper user lifecycle management with clear states:

1. **`new`** - Brand new user (gets 2-day trial)
2. **`trial_used`** - Trial has been used and expired (locked, must pay)
3. **`paid`** - User has paid and has active subscription
4. **`expired`** - Paid user whose subscription has expired (locked, must renew)

## 🚀 **Setup Instructions**

### **Step 1: Run Database Migration**

First, apply the database migration to add the user lifecycle management:

```bash
cd backend/scripts
psql -h your-supabase-host -U your-supabase-user -d your-database -f 018_user_lifecycle_management.sql
```

Or if you're using Supabase dashboard:
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy and paste the contents of `018_user_lifecycle_management.sql`
4. Run the script

### **Step 2: Restart Backend Server**

```bash
cd backend
python app.py
```

You should see:
```
Lifecycle routes loaded successfully.
Lifecycle routes registered.
```

### **Step 3: Test the System**

#### **Option A: Use the Test Script**

```bash
python test_lifecycle_system.py
```

#### **Option B: Use the HTML Test Page**

1. Open `test_lifecycle_frontend.html` in your browser
2. Make sure your backend is running on `${API_BASE_URL}`
3. Use the test buttons to simulate the user lifecycle

## 🧪 **Testing with 1-Minute Durations**

The system includes a test mode that uses 1-minute durations instead of days:

### **Enable Test Mode**
```bash
curl -X POST ${API_BASE_URL}/api/lifecycle/set-test-mode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"test_mode": true}'
```

### **Test Trial (1 minute)**
```bash
curl -X POST ${API_BASE_URL}/api/lifecycle/initialize-trial \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"duration_hours": 1/60, "test_mode": true}'
```

### **Test Subscription (1 minute)**
```bash
curl -X POST ${API_BASE_URL}/api/lifecycle/activate-subscription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"duration_days": 1/60/24, "test_mode": true, "paystack_data": {}}'
```

## 📱 **Frontend Integration**

### **Replace TrialService with LifecycleService**

In your React components, replace:

```typescript
// Old
import { useTrial } from '@/hooks/useTrial';

// New
import { useLifecycle } from '@/hooks/useLifecycle';
```

### **Replace TrialBlocker with LifecycleBlocker**

```typescript
// Old
import { TrialBlocker } from '@/components/TrialBlocker';

// New
import { LifecycleBlocker } from '@/components/LifecycleBlocker';

// Usage
<LifecycleBlocker featureName="this feature">
  <YourContent />
</LifecycleBlocker>
```

### **Use New Components**

```typescript
import { 
  LifecycleBlocker, 
  TrialTimer, 
  SubscriptionTimer, 
  PaymentPrompt 
} from '@/components/LifecycleBlocker';

// In your navbar or status area
<TrialTimer />
<SubscriptionTimer />
<PaymentPrompt />
```

## 🔄 **User Lifecycle Flow**

### **1. New User**
- User signs up → `user_state = 'new'`
- Gets 2-day trial automatically
- Shows trial timer
- Can access all features

### **2. Trial Expired**
- Trial expires → `user_state = 'trial_used'`
- Trial marked as used (`is_used = true`)
- Shows "Trial Expired" message
- Blocks access to features
- Shows payment prompt

### **3. User Pays**
- Payment successful → `user_state = 'paid'`
- Subscription activated
- Shows subscription timer
- Can access all features

### **4. Subscription Expired**
- Subscription expires → `user_state = 'expired'`
- Shows "Subscription Expired" message
- Blocks access to features
- Shows renewal prompt

## 🎨 **UI Components**

### **LifecycleBlocker**
- Main component that blocks access based on user state
- Shows appropriate messages for each state
- Handles trial expired, subscription expired, etc.

### **TrialTimer**
- Shows trial countdown and progress
- Only visible when user is in 'new' state with active trial

### **SubscriptionTimer**
- Shows subscription countdown and progress
- Only visible when user is in 'paid' state with active subscription

### **PaymentPrompt**
- Shows payment/renewal prompts
- Only visible when user needs to pay (trial_used or expired states)

## 🔧 **API Endpoints**

### **Get User Status**
```
GET /api/lifecycle/status
```

### **Initialize Trial**
```
POST /api/lifecycle/initialize-trial
{
  "duration_hours": 48,
  "test_mode": false
}
```

### **Mark Trial Used**
```
POST /api/lifecycle/mark-trial-used
```

### **Activate Subscription**
```
POST /api/lifecycle/activate-subscription
{
  "duration_days": 7,
  "paystack_data": {...},
  "test_mode": false
}
```

### **Mark Subscription Expired**
```
POST /api/lifecycle/mark-subscription-expired
```

### **Set Test Mode**
```
POST /api/lifecycle/set-test-mode
{
  "test_mode": true
}
```

### **Get User State Display**
```
GET /api/lifecycle/user-state-display
```

## 🗄️ **Database Schema**

### **New Column in profiles table**
```sql
user_state TEXT DEFAULT 'new' 
CHECK (user_state IN ('new', 'trial_used', 'paid', 'expired'))
```

### **Updated user_trials table**
```sql
is_used BOOLEAN DEFAULT false
```

### **New Functions**
- `get_user_lifecycle_status(user_id)` - Get complete user status
- `initialize_user_trial(user_id, duration_hours)` - Start trial
- `mark_trial_used(user_id)` - Mark trial as expired
- `activate_user_subscription_lifecycle(user_id, plan_id, days, paystack_data)` - Activate subscription
- `mark_subscription_expired(user_id)` - Mark subscription as expired
- `set_test_mode(user_id, enabled)` - Enable 1-minute test mode
- `get_user_state_display(user_id)` - Get UI display info

## 🧪 **Testing Scenarios**

### **Scenario 1: New User Trial**
1. User signs up → `user_state = 'new'`
2. Trial initialized → 2 days access
3. Trial expires → `user_state = 'trial_used'`
4. User blocked until payment

### **Scenario 2: Paid User**
1. User pays → `user_state = 'paid'`
2. Subscription active → 7 days access
3. Subscription expires → `user_state = 'expired'`
4. User blocked until renewal

### **Scenario 3: Test Mode (1 minute)**
1. Enable test mode
2. Initialize trial → 1 minute access
3. Wait 1 minute → trial expires
4. Activate subscription → 1 minute access
5. Wait 1 minute → subscription expires

## 🚨 **Important Notes**

1. **User State Persistence**: User states are stored in the database and persist across sessions
2. **Trial One-Time**: Each user can only use the trial once
3. **Automatic Expiration**: The system automatically handles expiration based on timestamps
4. **Test Mode**: Use test mode for development, disable for production
5. **Backward Compatibility**: The old system still works alongside the new one

## 🔄 **Migration from Old System**

The new system is designed to work alongside the existing system. To fully migrate:

1. **Phase 1**: Deploy new system alongside old system
2. **Phase 2**: Update frontend components to use new lifecycle service
3. **Phase 3**: Remove old trial system once new system is stable

## 📞 **Support**

If you encounter any issues:

1. Check the backend logs for errors
2. Verify database migration was successful
3. Test with the provided test scripts
4. Check that all environment variables are set correctly

---

**The user lifecycle management system is now ready! 🚀**

This system provides clear user states, proper trial management, and easy testing with 1-minute durations.
