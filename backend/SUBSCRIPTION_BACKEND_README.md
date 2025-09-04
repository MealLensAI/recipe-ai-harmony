# 🔒 Backend Subscription System Implementation

## 🎯 **Overview**

This document describes the comprehensive backend subscription system that manages user subscriptions, trials, and feature access control. The system integrates with Supabase for data storage and Paystack for payment processing.

## 🏗️ **Architecture**

### **Database Schema**
- **subscription_plans**: Available subscription plans with features
- **user_subscriptions**: User subscription records with expiration tracking
- **payment_transactions**: Payment history and verification
- **user_trials**: Trial period management
- **feature_usage**: Feature usage tracking and analytics
- **paystack_webhooks**: Webhook event processing

### **Backend Services**
- **SubscriptionService**: Core subscription management logic
- **AuthService**: User authentication and profile management
- **SupabaseService**: Database operations and RPC calls

### **API Endpoints**
- **/api/subscription/status**: Get user subscription status
- **/api/subscription/feature-access**: Check feature access
- **/api/subscription/record-usage**: Track feature usage
- **/api/subscription/activate**: Activate subscription after payment
- **/api/subscription/webhook**: Process Paystack webhooks

## 🚀 **Setup Instructions**

### **1. Database Migration**

Run the migration script to create all necessary tables:

```bash
cd backend/scripts
psql -h your-supabase-host -U your-supabase-user -d your-database -f 012_create_user_subscriptions_system.sql
```

### **2. Environment Variables**

Add these to your `.env` file:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_live_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_live_your_public_key

# API Configuration
VITE_API_URL=http://localhost:5000/api
```

### **3. Backend Dependencies**

Ensure these packages are in `requirements.txt`:

```txt
flask==2.3.3
flask-cors==4.0.0
supabase==1.0.3
requests==2.31.0
python-dotenv==1.0.0
```

### **4. Start Backend Server**

```bash
cd backend
python app.py
```

## 📊 **Database Functions**

### **Core Functions**

#### **get_user_subscription_status(p_user_id UUID)**
Returns comprehensive subscription status including:
- Active subscription details
- Trial information
- Remaining time calculations
- Progress percentages

#### **can_user_use_feature(p_user_id UUID, p_feature_name TEXT)**
Checks if user can access specific features:
- Subscription plan validation
- Feature availability check
- Usage tracking

#### **activate_user_subscription(p_user_id UUID, p_plan_name TEXT, p_paystack_data JSONB)**
Activates user subscription:
- Creates new subscription record
- Cancels existing subscriptions
- Deactivates trials
- Stores payment metadata

#### **record_feature_usage(p_user_id UUID, p_feature_name TEXT, p_count INTEGER)**
Tracks feature usage:
- Daily usage aggregation
- Conflict resolution for multiple uses
- Metadata storage

## 🔐 **Security Features**

### **Row Level Security (RLS)**
- Users can only access their own data
- Firebase UID validation
- Service role access for webhooks

### **Authentication**
- Firebase UID header validation
- Supabase JWT token support
- Fallback authentication methods

### **Data Validation**
- Input sanitization
- Plan existence verification
- Payment verification

## 💳 **Payment Integration**

### **Paystack Integration**
- Live payment processing
- Webhook event handling
- Payment verification
- Subscription management

### **Webhook Events**
- `charge.success`: Payment completed
- `subscription.create`: Subscription activated
- `subscription.disable`: Subscription cancelled

### **Payment Flow**
1. User selects plan
2. Paystack payment initiated
3. Payment verification
4. Subscription activation
5. Webhook processing

## 📱 **Frontend Integration**

### **API Client**
```typescript
import { subscriptionService } from '@/lib/subscriptionService';

// Get subscription status
const status = await subscriptionService.getSubscriptionStatus();

// Check feature access
const access = await subscriptionService.canUseFeature('ai_analysis');

// Activate subscription
const success = await subscriptionService.activateSubscription('monthly', paystackData);
```

### **React Hook**
```typescript
import { useBackendSubscription } from '@/hooks/useBackendSubscription';

const {
  canAccess,
  hasActiveSubscription,
  formattedRemainingTime,
  activateSubscription
} = useBackendSubscription();
```

## 🔄 **Subscription Lifecycle**

### **1. User Registration**
- Automatic trial creation (7 days)
- Profile setup in Supabase
- Firebase UID linking

### **2. Trial Period**
- Feature access during trial
- Usage tracking
- Expiration warnings

### **3. Subscription Purchase**
- Plan selection
- Payment processing
- Subscription activation
- Trial deactivation

### **4. Active Subscription**
- Feature access based on plan
- Usage monitoring
- Expiration tracking

### **5. Subscription Expiry**
- Access blocking
- Upgrade prompts
- Data preservation

## 📈 **Monitoring & Analytics**

### **Usage Tracking**
- Feature usage per user
- Daily/monthly aggregation
- Plan utilization metrics

### **Health Checks**
- Database connectivity
- Service status
- API endpoint monitoring

### **Error Handling**
- Comprehensive error logging
- User-friendly error messages
- Fallback mechanisms

## 🧪 **Testing**

### **Database Testing**
```sql
-- Test subscription status
SELECT * FROM get_user_subscription_status('user-uuid');

-- Test feature access
SELECT * FROM can_user_use_feature('user-uuid', 'ai_analysis');

-- Test subscription activation
SELECT * FROM activate_user_subscription('user-uuid', 'monthly', '{}');
```

### **API Testing**
```bash
# Test subscription status
curl "http://localhost:5000/api/subscription/status?firebase_uid=test-uid"

# Test feature access
curl -X POST "http://localhost:5000/api/subscription/feature-access" \
  -H "Content-Type: application/json" \
  -d '{"firebase_uid": "test-uid", "feature_name": "ai_analysis"}'
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Database Connection Errors**
- Check Supabase credentials
- Verify network connectivity
- Check RLS policies

#### **Payment Processing Issues**
- Verify Paystack keys
- Check webhook endpoints
- Monitor payment logs

#### **Authentication Problems**
- Firebase UID validation
- JWT token expiration
- CORS configuration

### **Debug Mode**
Enable debug logging in the backend:

```python
app.run(debug=True, host='0.0.0.0', port=5000)
```

## 🔧 **Configuration Options**

### **Trial Settings**
- Default trial duration: 7 days
- Configurable via environment variables
- Per-user trial customization

### **Subscription Plans**
- Weekly: $2 (7 days)
- Bi-weekly: $5 (14 days)
- Monthly: $10 (28 days)
- Yearly: $100 (365 days)

### **Feature Access Control**
- Plan-based feature restrictions
- Usage limits per feature
- Override capabilities

## 📚 **API Reference**

### **GET /api/subscription/status**
Get user's subscription status.

**Query Parameters:**
- `user_id` (optional): Supabase user ID
- `firebase_uid` (optional): Firebase UID

**Response:**
```json
{
  "success": true,
  "data": {
    "has_active_subscription": true,
    "subscription": { ... },
    "trial": { ... },
    "can_access_app": true
  }
}
```

### **POST /api/subscription/feature-access**
Check if user can use a specific feature.

**Request Body:**
```json
{
  "user_id": "uuid",
  "firebase_uid": "firebase-uid",
  "feature_name": "ai_analysis"
}
```

### **POST /api/subscription/activate**
Activate subscription after payment.

**Request Body:**
```json
{
  "user_id": "uuid",
  "firebase_uid": "firebase-uid",
  "plan_name": "monthly",
  "paystack_data": { ... }
}
```

## 🎯 **Next Steps**

### **Immediate Actions**
1. Run database migration
2. Configure environment variables
3. Test backend endpoints
4. Integrate with frontend

### **Future Enhancements**
- Advanced analytics dashboard
- A/B testing for plans
- Referral system
- Bulk operations
- API rate limiting

## 📞 **Support**

For technical support or questions:
- Check the logs for error details
- Verify configuration settings
- Test with sample data
- Review API documentation

---

**The subscription system is now fully integrated and ready for production use! 🚀**



