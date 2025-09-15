# 🕐 Minutes-Based Subscription System

## ✅ **Conversion Complete: Days → Minutes**

The entire codebase has been converted to work with minutes instead of days for quick testing.

### **Frontend Changes (Payment.tsx)**

```typescript
// Before (days):
durationDays: 7,  // 7 days

// After (minutes):
durationMinutes: 1,  // 1 minute for testing
```

**Updated Plans:**
- **Weekly Plan**: 1 minute (was 7 days)
- **2-Week Plan**: 2 minutes (was 14 days)  
- **Monthly Plan**: 3 minutes (was 30 days)
- **Yearly Plan**: 5 minutes (was 365 days)

### **Backend Changes**

#### **Payment Routes (payment_routes.py)**
```python
# Before:
plan_duration_days = data.get('plan_duration_days', 30)
result = subscription_service.activate_subscription_for_days(
    user_id=user_id,
    duration_days=plan_duration_days,
    paystack_data=paystack_data
)

# After:
plan_duration_minutes = data.get('plan_duration_minutes', 30)
result = subscription_service.activate_subscription_for_minutes(
    user_id=user_id,
    duration_minutes=plan_duration_minutes,
    paystack_data=paystack_data
)
```

#### **Subscription Service (subscription_service.py)**
- **New Method**: `activate_subscription_for_minutes()`
- **Conversion**: Minutes → Days (divide by 1440) for database storage
- **Database**: Still stores as days (compatible with existing schema)

### **UI Blocking Fix**

#### **TrialBlocker.tsx**
```typescript
// Now shows appropriate messages:
{hasActiveSubscription ? 'Subscription Expired' : 'Access Restricted'}
{hasActiveSubscription 
  ? 'Your subscription has expired. Please renew...'
  : 'Your trial period has expired. Please upgrade...'
}
{hasActiveSubscription ? 'Renew Subscription' : 'Upgrade Now'}
```

## 🧪 **Testing**

### **Quick Test (1-3 minutes)**
```bash
python test_minutes_system.py
```

### **Manual Test**
1. Make a payment with any plan
2. Wait 1-3 minutes (depending on plan)
3. Refresh page → See "Subscription Expired" message

### **Frontend Test**
1. Open browser console
2. Run `test_subscription_expiry_ui.js`
3. Page refreshes → Shows subscription expiry UI

## 🔄 **To Switch Back to Production**

### **Frontend (Payment.tsx)**
```typescript
// Change back to:
durationMinutes: 7 * 24 * 60,    // 7 days = 10,080 minutes
durationMinutes: 14 * 24 * 60,   // 14 days = 20,160 minutes  
durationMinutes: 30 * 24 * 60,   // 30 days = 43,200 minutes
durationMinutes: 365 * 24 * 60,  // 365 days = 525,600 minutes
```

### **Backend**
- No changes needed - automatically handles conversion
- Database still stores as days (backward compatible)

## 📊 **Benefits**

1. **Quick Testing**: See subscription expiry in 1-3 minutes
2. **Clean Code**: No more decimal day conversions
3. **Paystack Compatible**: Direct minute values
4. **Backward Compatible**: Database schema unchanged
5. **Proper UI**: Shows correct messages for trial vs subscription expiry

## 🎯 **User Flow**

1. **New User** → 1-minute trial → "Access Restricted" + "Upgrade Now"
2. **Paid User** → 1-3 minute subscription → "Subscription Expired" + "Renew Subscription"
3. **No More Confusion**: Once you pay, you never see trial messages again

The system now properly distinguishes between trial expiry and subscription expiry! 🎉
