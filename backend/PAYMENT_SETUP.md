# 💳 Payment System Setup Guide

## Current Status: DISABLED ✅

The payment system is currently **disabled** to prevent syntax errors and allow the app to run smoothly. All payment code is preserved and ready to use when you're ready.

## 🚀 How to Re-enable Payment System

### Step 1: Fix the Payment Routes File
```bash
# Open the payment routes file
nano routes/payment_routes.py
```

**What to do:**
1. Remove the `#` at the beginning of each line (uncomment the entire file)
2. Look for any syntax errors (missing braces, parentheses, etc.)
3. Make sure all functions are properly closed
4. Save the file

### Step 2: Add Paystack Credentials
```bash
# Add these to your .env file
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
```

**How to get Paystack keys:**
1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Sign up/Login to your account
3. Go to Settings → API Keys
4. Copy your test keys (or live keys for production)

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

### **Subscription Plans:**
- **Free**: ₦0/month (5 detections, 3 meal plans, 10 recipes)
- **Basic**: ₦1,000/month (50 detections, 20 meal plans, 100 recipes)  
- **Premium**: ₦2,500/month (200 detections, 100 meal plans, 500 recipes)
- **Enterprise**: ₦5,000/month (Unlimited + API access)

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

1. **Start with test keys** - Use Paystack test keys for development
2. **Test webhooks locally** - Use ngrok to test webhooks on localhost
3. **Monitor usage** - Check the usage tracking in your database
4. **Set up alerts** - Configure Paystack webhook notifications

---

**Ready to enable payments?** Just follow the steps above and you'll have a fully functional subscription system! 🚀 