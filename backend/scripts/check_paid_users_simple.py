#!/usr/bin/env python3
"""
Simple script to check which users have paid subscriptions
Uses existing database tables and functions
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")
        sys.exit(1)
    
    return create_client(supabase_url, supabase_key)

def check_paid_users():
    """Check which users have paid subscriptions"""
    supabase = get_supabase_client()
    
    print("🔍 Checking paid users...")
    print("=" * 60)
    
    try:
        # Query 1: Get all users with active subscriptions
        print("\n📊 ACTIVE SUBSCRIPTIONS:")
        print("-" * 40)
        
        # Get active subscriptions with plan details
        subscription_result = supabase.table('user_subscriptions').select('*').eq('status', 'active').execute()
        
        if subscription_result.data:
            print(f"✅ Found {len(subscription_result.data)} active subscriptions:")
            for i, sub in enumerate(subscription_result.data, 1):
                plan = sub.get('subscription_plans', {})
                user_id = sub.get('user_id', 'N/A')
                
                # Get user profile separately
                try:
                    profile_result = supabase.table('profiles').select('*').eq('id', user_id).execute()
                    profile = profile_result.data[0] if profile_result.data else {}
                except:
                    profile = {}
                
                print(f"\n{i}. User: {profile.get('full_name', 'N/A')} ({profile.get('email', 'N/A')})")
                print(f"   Firebase UID: {profile.get('firebase_uid', 'N/A')}")
                print(f"   User ID: {user_id}")
                print(f"   Plan: {plan.get('display_name', plan.get('name', 'N/A'))}")
                print(f"   Price: ${plan.get('price_usd', 0)}")
                print(f"   Duration: {plan.get('duration_days', 0)} days")
                print(f"   Status: {sub.get('status', 'N/A')}")
                print(f"   Start: {sub.get('start_date', 'N/A')}")
                print(f"   End: {sub.get('end_date', 'N/A')}")
                print(f"   Created: {sub.get('created_at', 'N/A')}")
        else:
            print("❌ No active subscriptions found")
        
        # Query 2: Get all completed payments
        print("\n\n💳 COMPLETED PAYMENTS:")
        print("-" * 40)
        
        payment_result = supabase.table('payment_transactions').select(
            '*, subscription_plans(*)'
        ).eq('status', 'completed').order('created_at', desc=True).execute()
        
        if payment_result.data:
            print(f"✅ Found {len(payment_result.data)} completed payments:")
            total_revenue = 0
            for i, payment in enumerate(payment_result.data, 1):
                plan = payment.get('subscription_plans', {})
                user_id = payment.get('user_id', 'N/A')
                amount = float(payment.get('amount', 0))
                total_revenue += amount
                
                # Get user profile separately
                try:
                    profile_result = supabase.table('profiles').select('*').eq('id', user_id).execute()
                    profile = profile_result.data[0] if profile_result.data else {}
                except:
                    profile = {}
                
                print(f"\n{i}. User: {profile.get('full_name', 'N/A')} ({profile.get('email', 'N/A')})")
                print(f"   Firebase UID: {profile.get('firebase_uid', 'N/A')}")
                print(f"   User ID: {user_id}")
                print(f"   Plan: {plan.get('display_name', plan.get('name', 'N/A'))}")
                print(f"   Amount: {payment.get('currency', 'USD')} {amount}")
                print(f"   Status: {payment.get('status', 'N/A')}")
                print(f"   Reference: {payment.get('payment_reference', 'N/A')}")
                print(f"   Paystack Ref: {payment.get('paystack_reference', 'N/A')}")
                print(f"   Date: {payment.get('created_at', 'N/A')}")
            
            print(f"\n💰 Total Revenue: ${total_revenue:.2f}")
        else:
            print("❌ No completed payments found")
        
        # Query 3: Get users with trials
        print("\n\n🆓 USERS WITH TRIALS:")
        print("-" * 40)
        
        trial_result = supabase.table('user_trials').select('*').order('created_at', desc=True).execute()
        
        if trial_result.data:
            print(f"✅ Found {len(trial_result.data)} trial users:")
            for i, trial in enumerate(trial_result.data, 1):
                user_id = trial.get('user_id', 'N/A')
                
                # Get user profile separately
                try:
                    profile_result = supabase.table('profiles').select('*').eq('id', user_id).execute()
                    profile = profile_result.data[0] if profile_result.data else {}
                except:
                    profile = {}
                
                print(f"\n{i}. User: {profile.get('full_name', 'N/A')} ({profile.get('email', 'N/A')})")
                print(f"   Firebase UID: {profile.get('firebase_uid', 'N/A')}")
                print(f"   User ID: {user_id}")
                print(f"   Start: {trial.get('start_date', 'N/A')}")
                print(f"   End: {trial.get('end_date', 'N/A')}")
                print(f"   Used: {trial.get('is_used', False)}")
                print(f"   Created: {trial.get('created_at', 'N/A')}")
        else:
            print("❌ No trial users found")
        
        # Query 4: Summary statistics
        print("\n\n📈 SUMMARY STATISTICS:")
        print("-" * 40)
        
        # Count active subscriptions
        active_subs = supabase.table('user_subscriptions').select('id', count='exact').eq('status', 'active').gte('end_date', datetime.now().isoformat()).execute()
        active_count = active_subs.count if active_subs.count else 0
        
        # Count completed payments
        completed_payments = supabase.table('payment_transactions').select('id', count='exact').eq('status', 'completed').execute()
        payment_count = completed_payments.count if completed_payments.count else 0
        
        # Count total users with profiles
        total_users = supabase.table('profiles').select('id', count='exact').execute()
        user_count = total_users.count if total_users.count else 0
        
        print(f"👥 Total Users: {user_count}")
        print(f"💳 Completed Payments: {payment_count}")
        print(f"✅ Active Subscriptions: {active_count}")
        print(f"📊 Conversion Rate: {(payment_count/user_count*100):.1f}%" if user_count > 0 else "📊 Conversion Rate: N/A")
        
    except Exception as e:
        print(f"❌ Error querying database: {str(e)}")
        return False
    
    return True

def check_specific_user(firebase_uid: str):
    """Check subscription status for a specific user"""
    supabase = get_supabase_client()
    
    print(f"🔍 Checking user: {firebase_uid}")
    print("=" * 60)
    
    try:
        # Get user profile
        profile_result = supabase.table('profiles').select('*').eq('firebase_uid', firebase_uid).execute()
        
        if not profile_result.data:
            print(f"❌ User not found: {firebase_uid}")
            return False
        
        user_profile = profile_result.data[0]
        user_id = user_profile['id']
        
        print(f"👤 User: {user_profile.get('full_name', 'N/A')} ({user_profile.get('email', 'N/A')})")
        print(f"🆔 User ID: {user_id}")
        print(f"🔥 Firebase UID: {firebase_uid}")
        
        # Check subscription status using the RPC function
        subscription_result = supabase.rpc('get_user_subscription_status', {'p_user_id': user_id}).execute()
        
        if subscription_result.data:
            data = subscription_result.data
            print(f"\n📊 Subscription Status:")
            print(f"   Has Active Subscription: {data.get('has_active_subscription', False)}")
            print(f"   Can Access App: {data.get('can_access_app', False)}")
            
            if data.get('subscription'):
                sub = data['subscription']
                print(f"\n💳 Active Subscription:")
                print(f"   Plan: {sub.get('plan_name', 'N/A')}")
                print(f"   Status: {sub.get('status', 'N/A')}")
                print(f"   Start: {sub.get('start_date', 'N/A')}")
                print(f"   End: {sub.get('end_date', 'N/A')}")
            
            if data.get('trial'):
                trial = data['trial']
                print(f"\n🆓 Trial Info:")
                print(f"   Start: {trial.get('start_date', 'N/A')}")
                print(f"   End: {trial.get('end_date', 'N/A')}")
                print(f"   Used: {trial.get('is_used', False)}")
        
        # Check payment history
        payments_result = supabase.table('payment_transactions').select('*, subscription_plans(*)').eq('user_id', user_id).order('created_at', desc=True).execute()
        
        if payments_result.data:
            print(f"\n💳 Payment History ({len(payments_result.data)} payments):")
            for i, payment in enumerate(payments_result.data, 1):
                plan = payment.get('subscription_plans', {})
                print(f"   {i}. {payment.get('currency', 'USD')} {payment.get('amount', 0)} - {payment.get('status', 'N/A')} - {payment.get('created_at', 'N/A')}")
                print(f"      Plan: {plan.get('display_name', plan.get('name', 'N/A'))}")
        else:
            print(f"\n💳 No payment history found")
        
    except Exception as e:
        print(f"❌ Error checking user: {str(e)}")
        return False
    
    return True

def list_all_users():
    """List all users with their subscription status"""
    supabase = get_supabase_client()
    
    print("👥 All Users with Subscription Status:")
    print("=" * 60)
    
    try:
        # Get all profiles
        profiles_result = supabase.table('profiles').select('*').order('created_at', desc=True).execute()
        
        if not profiles_result.data:
            print("❌ No users found")
            return False
        
        print(f"Found {len(profiles_result.data)} users:")
        
        for i, profile in enumerate(profiles_result.data, 1):
            firebase_uid = profile.get('firebase_uid', 'N/A')
            user_id = profile.get('id', 'N/A')
            
            print(f"\n{i}. {profile.get('full_name', 'N/A')} ({profile.get('email', 'N/A')})")
            print(f"   Firebase UID: {firebase_uid}")
            print(f"   User ID: {user_id}")
            
            # Check subscription status
            try:
                subscription_result = supabase.rpc('get_user_subscription_status', {'p_user_id': user_id}).execute()
                if subscription_result.data:
                    data = subscription_result.data
                    has_sub = data.get('has_active_subscription', False)
                    can_access = data.get('can_access_app', False)
                    print(f"   Status: {'✅ PAID' if has_sub else '🆓 TRIAL' if can_access else '❌ NO ACCESS'}")
                    
                    if data.get('subscription'):
                        sub = data['subscription']
                        print(f"   Plan: {sub.get('plan_name', 'N/A')}")
                        print(f"   End Date: {sub.get('end_date', 'N/A')}")
            except Exception as e:
                print(f"   Status: ❓ ERROR - {str(e)}")
        
    except Exception as e:
        print(f"❌ Error listing users: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "list":
            # List all users
            list_all_users()
        elif command.startswith("user:"):
            # Check specific user
            firebase_uid = command.split(":", 1)[1]
            check_specific_user(firebase_uid)
        else:
            print("Usage:")
            print("  python check_paid_users_simple.py           # Check all paid users")
            print("  python check_paid_users_simple.py list      # List all users")
            print("  python check_paid_users_simple.py user:UID  # Check specific user")
    else:
        # Check all paid users
        check_paid_users()
