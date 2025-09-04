# 💳 Payment System Setup Guide

## Current Status: ENABLED ✅

The payment system is now **enabled** with real Paystack integration using KES currency. The system has been updated with the working UI and payment configuration from the working HTML file.

## 🚀 Payment System Configuration

### Step 1: Payment System is Already Enabled ✅

The payment system has been automatically enabled. The payment routes file has been updated and is ready to use.

### Step 2: Add Paystack Credentials
```bash
# Add these to your .env file
PAYSTACK_SECRET_KEY=sk_live_your_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_live_your_public_key_here
```

**How to get Paystack keys:**
1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Sign up/Login to your account
3. Go to Settings → API Keys
4. Copy your live keys (the system is configured for production)

**Note:** The frontend is already configured with the live Paystack key: `pk_live_5f7de652daf3ea53dc685902c5f28f0a2063bc33`

### Step 3: Run Database Migration
```bash
# Apply the subscription system database schema
python scripts/apply_migrations.py
```

### Step 4: Restart the Server
```bash
# Stop the current server (Ctrl+C)
# Then restart
python app.py
```

## ✅ What You'll Get

Once enabled, you'll have:

### **Subscription Plans (KES):**
- **Weekly**: KES 1,000/week (7 days access)
- **Bi-weekly**: KES 1,200/2 weeks (14 days access)  
- **Monthly**: KES 1,400/4 weeks (28 days access)
- **Yearly**: KES 47,000/year (365 days access)

### **Payment Endpoints:**
- `GET /api/payment/plans` - Get subscription plans
- `GET /api/payment/subscription` - Get user subscription
- `GET /api/payment/usage` - Get usage summary
- `POST /api/payment/initialize-payment` - Start payment
- `GET /api/payment/verify-payment/<reference>` - Verify payment
- `POST /api/payment/webhook` - Paystack webhooks

### **Features:**
✅ Usage tracking and limits  
✅ Paystack payment processing  
✅ Subscription management  
✅ Webhook handling  
✅ Automatic limit enforcement  

## 🔧 Troubleshooting

### If you get syntax errors:
1. Check for missing `}` or `)` in the payment routes file
2. Make sure all functions are properly closed
3. Use a code editor with syntax highlighting

### If payment service doesn't initialize:
1. Check that Paystack keys are in `.env` file
2. Verify the keys are correct (test vs live)
3. Check the console for error messages

### If database migration fails:
1. Make sure Supabase credentials are correct
2. Check that you have write permissions
3. Run the migration script with proper error handling

## 📚 Documentation

- **Complete API docs**: `docs/payment_api.md`
- **Database schema**: `scripts/011_create_subscription_system.sql`
- **Payment service**: `services/payment_service.py`

## 🎯 Quick Test

Once enabled, test the payment system:

```bash
# Test if payment routes are working
curl http://localhost:5000/api/payment/plans

# Should return subscription plans
```

## 💡 Pro Tips

1. **Production ready** - The system is configured with live Paystack keys for production use
2. **Test webhooks locally** - Use ngrok to test webhooks on localhost
3. **Monitor usage** - Check the usage tracking in your database
4. **Set up alerts** - Configure Paystack webhook notifications
5. **Currency** - All payments are processed in KES (Kenyan Shillings)

---

**Payment system is ready!** The system is now fully enabled with real Paystack integration in KES currency! 🚀 