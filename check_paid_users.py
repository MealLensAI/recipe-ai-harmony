#!/usr/bin/env python3
"""
Simple script to check Supabase for users who have paid.
This will show us exactly what's in the database.
"""

import os
from supabase import create_client, Client

def load_env():
    """Load environment variables"""
    env_file = os.path.join(os.path.dirname(__file__), 'backend', '.env')
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
        print(f"✅ Loaded environment from {env_file}")
    else:
        print(f"❌ Environment file not found: {env_file}")

def check_paid_users():
    """Check Supabase for users who have paid"""
    
    print("🍽️ Checking Supabase for Paid Users")
    print("=" * 50)
    
    # Load environment
    load_env()
    
    # Connect to Supabase
    try:
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not url or not key:
            print("❌ Missing Supabase credentials")
            return
            
        supabase: Client = create_client(url, key)
        print(f"✅ Connected to Supabase")
        
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        return
    
    # Check payment transactions
    print("\n💳 Checking Payment Transactions...")
    try:
        result = supabase.table('payment_transactions').select('*').execute()
        
        if result.data:
            print(f"📊 Found {len(result.data)} payment transactions:")
            for i, payment in enumerate(result.data, 1):
                print(f"\n{i}. Payment ID: {payment.get('id')}")
                print(f"   User ID: {payment.get('user_id')}")
                print(f"   Amount: ${payment.get('amount')}")
                print(f"   Status: {payment.get('status')}")
                print(f"   Plan ID: {payment.get('plan_id')}")
                print(f"   Reference: {payment.get('payment_reference')}")
                print(f"   Created: {payment.get('created_at')}")
        else:
            print("❌ No payment transactions found")
            
    except Exception as e:
        print(f"❌ Error checking payment transactions: {e}")
    
    # Check user subscriptions
    print("\n📋 Checking User Subscriptions...")
    try:
        result = supabase.table('user_subscriptions').select('*').execute()
        
        if result.data:
            print(f"📊 Found {len(result.data)} user subscriptions:")
            for i, sub in enumerate(result.data, 1):
                print(f"\n{i}. Subscription ID: {sub.get('id')}")
                print(f"   User ID: {sub.get('user_id')}")
                print(f"   Plan ID: {sub.get('plan_id')}")
                print(f"   Status: {sub.get('status')}")
                print(f"   Start: {sub.get('current_period_start')}")
                print(f"   End: {sub.get('current_period_end')}")
                print(f"   Created: {sub.get('created_at')}")
        else:
            print("❌ No user subscriptions found")
            
    except Exception as e:
        print(f"❌ Error checking user subscriptions: {e}")
    
    # Check subscription plans
    print("\n📦 Checking Subscription Plans...")
    try:
        result = supabase.table('subscription_plans').select('*').execute()
        
        if result.data:
            print(f"📊 Found {len(result.data)} subscription plans:")
            for i, plan in enumerate(result.data, 1):
                print(f"\n{i}. Plan ID: {plan.get('id')}")
                print(f"   Name: {plan.get('name')}")
                print(f"   Display Name: {plan.get('display_name')}")
                print(f"   Price: ${plan.get('price_usd')}")
                print(f"   Active: {plan.get('is_active')}")
        else:
            print("❌ No subscription plans found")
            
    except Exception as e:
        print(f"❌ Error checking subscription plans: {e}")
    
    # Check specific users who have subscriptions
    print("\n👥 Checking Users with Subscriptions...")
    try:
        # Get all user IDs from subscriptions
        sub_result = supabase.table('user_subscriptions').select('user_id').execute()
        
        if sub_result.data:
            user_ids = list(set([sub['user_id'] for sub in sub_result.data]))
            print(f"📊 Found {len(user_ids)} unique users with subscriptions:")
            
            for user_id in user_ids:
                print(f"\n👤 User ID: {user_id}")
                
                # Check if this user has payment transactions
                payment_result = supabase.table('payment_transactions').select('*').eq('user_id', user_id).execute()
                
                if payment_result.data:
                    print(f"   💳 Has {len(payment_result.data)} payment transactions")
                    for payment in payment_result.data:
                        print(f"      - Amount: ${payment.get('amount')}, Status: {payment.get('status')}")
                else:
                    print(f"   ❌ No payment transactions found")
                
                # Check subscription details
                user_sub_result = supabase.table('user_subscriptions').select('*').eq('user_id', user_id).execute()
                if user_sub_result.data:
                    print(f"   📋 Has {len(user_sub_result.data)} subscriptions")
                    for sub in user_sub_result.data:
                        print(f"      - Status: {sub.get('status')}, End: {sub.get('current_period_end')}")
        else:
            print("❌ No users with subscriptions found")
            
    except Exception as e:
        print(f"❌ Error checking users: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Check Complete!")
    print("\n📋 Summary:")
    print("- If you see payment transactions, the system is working")
    print("- If you see subscriptions but no payment transactions, there's a bug")
    print("- If you see neither, no payments have been made yet")

if __name__ == "__main__":
    check_paid_users()
