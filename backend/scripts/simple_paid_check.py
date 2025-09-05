#!/usr/bin/env python3
"""
Simple script to check paid users - works with actual database schema
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file")
        sys.exit(1)
    
    return create_client(supabase_url, supabase_key)

def check_paid_users_simple():
    """Simple check for paid users"""
    supabase = get_supabase_client()
    
    print("🔍 Simple Paid Users Check")
    print("=" * 50)
    
    # Check subscription plans
    print("\n📋 Available Plans:")
    try:
        plans = supabase.table('subscription_plans').select('*').execute()
        if plans.data:
            for plan in plans.data:
                print(f"   • {plan.get('display_name', 'N/A')} - ${plan.get('price_usd', 0)}")
        else:
            print("   No plans found")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Check user subscriptions
    print("\n💳 User Subscriptions:")
    try:
        subs = supabase.table('user_subscriptions').select('*').execute()
        if subs.data:
            print(f"   Found {len(subs.data)} subscriptions:")
            for sub in subs.data:
                print(f"   • User ID: {sub.get('user_id', 'N/A')}")
                print(f"     Status: {sub.get('status', 'N/A')}")
                print(f"     Plan ID: {sub.get('plan_id', 'N/A')}")
                print(f"     Created: {sub.get('created_at', 'N/A')}")
        else:
            print("   No subscriptions found")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Check payment transactions
    print("\n💰 Payment Transactions:")
    try:
        payments = supabase.table('payment_transactions').select('*').execute()
        if payments.data:
            print(f"   Found {len(payments.data)} payments:")
            total_revenue = 0
            for payment in payments.data:
                amount = float(payment.get('amount', 0))
                total_revenue += amount
                print(f"   • User ID: {payment.get('user_id', 'N/A')}")
                print(f"     Amount: {payment.get('currency', 'USD')} {amount}")
                print(f"     Status: {payment.get('status', 'N/A')}")
                print(f"     Date: {payment.get('created_at', 'N/A')}")
            print(f"   💰 Total Revenue: ${total_revenue:.2f}")
        else:
            print("   No payments found")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Check user trials
    print("\n🆓 User Trials:")
    try:
        trials = supabase.table('user_trials').select('*').execute()
        if trials.data:
            print(f"   Found {len(trials.data)} trials:")
            for trial in trials.data:
                print(f"   • User ID: {trial.get('user_id', 'N/A')}")
                print(f"     Start: {trial.get('start_date', 'N/A')}")
                print(f"     End: {trial.get('end_date', 'N/A')}")
                print(f"     Used: {trial.get('is_used', False)}")
        else:
            print("   No trials found")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Check profiles
    print("\n👥 User Profiles:")
    try:
        profiles = supabase.table('profiles').select('*').execute()
        if profiles.data:
            print(f"   Found {len(profiles.data)} profiles:")
            for profile in profiles.data:
                print(f"   • ID: {profile.get('id', 'N/A')}")
                print(f"     Email: {profile.get('email', 'N/A')}")
                print(f"     Firebase UID: {profile.get('firebase_uid', 'N/A')}")
                print(f"     Created: {profile.get('created_at', 'N/A')}")
        else:
            print("   No profiles found")
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\n" + "=" * 50)
    print("✅ Check completed!")

if __name__ == "__main__":
    check_paid_users_simple()
