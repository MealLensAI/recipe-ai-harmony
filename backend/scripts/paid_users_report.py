#!/usr/bin/env python3
"""
Comprehensive paid users report script
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
    supabase_key = os.getenv('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file")
        sys.exit(1)
    
    return create_client(supabase_url, supabase_key)

def generate_paid_users_report():
    """Generate comprehensive paid users report"""
    supabase = get_supabase_client()
    
    print("📊 PAID USERS REPORT")
    print("=" * 60)
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    total_revenue = 0
    active_subscriptions = 0
    total_users = 0
    
    try:
        # Get all profiles
        profiles_result = supabase.table('profiles').select('*').execute()
        total_users = len(profiles_result.data) if profiles_result.data else 0
        
        print(f"\n👥 TOTAL USERS: {total_users}")
        
        if total_users == 0:
            print("\n❌ No users found in the system yet.")
            print("   This means:")
            print("   • No one has signed up")
            print("   • No one has paid for subscriptions")
            print("   • The system is ready for users")
            return
        
        # Get all completed payments
        payments_result = supabase.table('payment_transactions').select('*').execute()
        completed_payments = [p for p in payments_result.data if p.get('status') == 'completed'] if payments_result.data else []
        
        print(f"\n💳 COMPLETED PAYMENTS: {len(completed_payments)}")
        
        if completed_payments:
            print("\n💰 PAYMENT DETAILS:")
            for i, payment in enumerate(completed_payments, 1):
                amount = float(payment.get('amount', 0))
                total_revenue += amount
                print(f"   {i}. User ID: {payment.get('user_id', 'N/A')}")
                print(f"      Amount: {payment.get('currency', 'USD')} {amount}")
                print(f"      Status: {payment.get('status', 'N/A')}")
                print(f"      Date: {payment.get('created_at', 'N/A')}")
                print(f"      Reference: {payment.get('payment_reference', 'N/A')}")
        else:
            print("   No completed payments found")
        
        # Get all active subscriptions
        subs_result = supabase.table('user_subscriptions').select('*').execute()
        active_subs = [s for s in subs_result.data if s.get('status') == 'active'] if subs_result.data else []
        active_subscriptions = len(active_subs)
        
        print(f"\n✅ ACTIVE SUBSCRIPTIONS: {active_subscriptions}")
        
        if active_subs:
            print("\n📋 SUBSCRIPTION DETAILS:")
            for i, sub in enumerate(active_subs, 1):
                print(f"   {i}. User ID: {sub.get('user_id', 'N/A')}")
                print(f"      Plan ID: {sub.get('plan_id', 'N/A')}")
                print(f"      Status: {sub.get('status', 'N/A')}")
                print(f"      Start: {sub.get('start_date', 'N/A')}")
                print(f"      End: {sub.get('end_date', 'N/A')}")
                print(f"      Created: {sub.get('created_at', 'N/A')}")
        else:
            print("   No active subscriptions found")
        
        # Get all trials
        trials_result = supabase.table('user_trials').select('*').execute()
        total_trials = len(trials_result.data) if trials_result.data else 0
        
        print(f"\n🆓 TOTAL TRIALS: {total_trials}")
        
        if trials_result.data:
            active_trials = [t for t in trials_result.data if t.get('is_used', False)]
            print(f"   Active Trials: {len(active_trials)}")
        
        # Summary
        print(f"\n📈 SUMMARY:")
        print(f"   Total Users: {total_users}")
        print(f"   Completed Payments: {len(completed_payments)}")
        print(f"   Active Subscriptions: {active_subscriptions}")
        print(f"   Total Revenue: ${total_revenue:.2f}")
        
        if total_users > 0:
            conversion_rate = (len(completed_payments) / total_users) * 100
            print(f"   Conversion Rate: {conversion_rate:.1f}%")
        
        # User breakdown
        print(f"\n👤 USER BREAKDOWN:")
        paid_users = set()
        trial_users = set()
        
        for payment in completed_payments:
            paid_users.add(payment.get('user_id'))
        
        for trial in trials_result.data:
            trial_users.add(trial.get('user_id'))
        
        print(f"   Users who have paid: {len(paid_users)}")
        print(f"   Users with trials: {len(trial_users)}")
        print(f"   Users with no activity: {total_users - len(paid_users) - len(trial_users)}")
        
    except Exception as e:
        print(f"❌ Error generating report: {str(e)}")
        return False
    
    print("\n" + "=" * 60)
    print("✅ Report completed!")
    return True

def check_specific_user(user_identifier):
    """Check specific user by ID or Firebase UID"""
    supabase = get_supabase_client()
    
    print(f"🔍 Checking user: {user_identifier}")
    print("=" * 50)
    
    try:
        # Try to find user by Firebase UID first
        profile_result = supabase.table('profiles').select('*').eq('firebase_uid', user_identifier).execute()
        
        if not profile_result.data:
            # Try by user ID
            profile_result = supabase.table('profiles').select('*').eq('id', user_identifier).execute()
        
        if not profile_result.data:
            print(f"❌ User not found: {user_identifier}")
            return False
        
        profile = profile_result.data[0]
        user_id = profile.get('id')
        
        print(f"👤 User: {profile.get('email', 'N/A')}")
        print(f"   ID: {user_id}")
        print(f"   Firebase UID: {profile.get('firebase_uid', 'N/A')}")
        print(f"   Created: {profile.get('created_at', 'N/A')}")
        
        # Check payments
        payments_result = supabase.table('payment_transactions').select('*').eq('user_id', user_id).execute()
        payments = payments_result.data if payments_result.data else []
        
        print(f"\n💳 Payments: {len(payments)}")
        for payment in payments:
            print(f"   • {payment.get('currency', 'USD')} {payment.get('amount', 0)} - {payment.get('status', 'N/A')} - {payment.get('created_at', 'N/A')}")
        
        # Check subscriptions
        subs_result = supabase.table('user_subscriptions').select('*').eq('user_id', user_id).execute()
        subscriptions = subs_result.data if subs_result.data else []
        
        print(f"\n📋 Subscriptions: {len(subscriptions)}")
        for sub in subscriptions:
            print(f"   • {sub.get('status', 'N/A')} - {sub.get('start_date', 'N/A')} to {sub.get('end_date', 'N/A')}")
        
        # Check trials
        trials_result = supabase.table('user_trials').select('*').eq('user_id', user_id).execute()
        trials = trials_result.data if trials_result.data else []
        
        print(f"\n🆓 Trials: {len(trials)}")
        for trial in trials:
            print(f"   • {trial.get('start_date', 'N/A')} to {trial.get('end_date', 'N/A')} - Used: {trial.get('is_used', False)}")
        
        # Determine status
        has_paid = any(p.get('status') == 'completed' for p in payments)
        has_active_sub = any(s.get('status') == 'active' for s in subscriptions)
        has_trial = len(trials) > 0
        
        print(f"\n📊 Status:")
        print(f"   Has Paid: {'✅' if has_paid else '❌'}")
        print(f"   Active Subscription: {'✅' if has_active_sub else '❌'}")
        print(f"   Has Trial: {'✅' if has_trial else '❌'}")
        
    except Exception as e:
        print(f"❌ Error checking user: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Check specific user
        user_identifier = sys.argv[1]
        check_specific_user(user_identifier)
    else:
        # Generate full report
        generate_paid_users_report()
