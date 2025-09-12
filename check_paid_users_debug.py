#!/usr/bin/env python3
"""
Debug script to check if payment/subscription data is being stored in Supabase
and if we can fetch paid users correctly.
"""

import os
import sys
sys.path.append('backend')

from supabase import create_client, Client
from datetime import datetime
import json

def main():
    print("🔍 DEBUGGING PAID USERS IN SUPABASE")
    print("=" * 60)
    
    # Initialize Supabase client
    try:
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not supabase_url or not supabase_key:
            print("❌ Missing Supabase credentials")
            print("Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables")
            return
            
        print(f"✅ Supabase URL: {supabase_url}")
        print(f"✅ Service key: {supabase_key[:10]}...")
        
        supabase: Client = create_client(supabase_url, supabase_key)
        print("✅ Supabase client created successfully")
        print()
        
    except Exception as e:
        print(f"❌ Failed to create Supabase client: {e}")
        return
    
    # Check 1: List all tables to see what exists
    print("📋 CHECKING AVAILABLE TABLES:")
    print("-" * 40)
    try:
        # Try to get schema info
        tables_to_check = [
            'profiles',
            'user_subscriptions', 
            'user_trials',
            'subscription_plans',
            'payment_transactions',
            'paystack_transactions'
        ]
        
        for table in tables_to_check:
            try:
                result = supabase.table(table).select('*').limit(1).execute()
                print(f"✅ Table '{table}' exists - {len(result.data)} sample rows")
            except Exception as e:
                print(f"❌ Table '{table}' - Error: {str(e)}")
        print()
        
    except Exception as e:
        print(f"❌ Error checking tables: {e}")
    
    # Check 2: List all users
    print("👥 CHECKING ALL USERS:")
    print("-" * 40)
    try:
        profiles = supabase.table('profiles').select('*').execute()
        print(f"Total users in profiles: {len(profiles.data)}")
        
        for i, profile in enumerate(profiles.data[:5]):  # Show first 5
            print(f"User {i+1}: {profile.get('id', 'N/A')} - {profile.get('email', 'N/A')}")
        
        if len(profiles.data) > 5:
            print(f"... and {len(profiles.data) - 5} more users")
        print()
        
    except Exception as e:
        print(f"❌ Error fetching users: {e}")
    
    # Check 3: Check for subscription data
    print("💳 CHECKING SUBSCRIPTION DATA:")
    print("-" * 40)
    try:
        # Check user_subscriptions table
        subscriptions = supabase.table('user_subscriptions').select('*').execute()
        print(f"Total subscriptions: {len(subscriptions.data)}")
        
        active_subs = [s for s in subscriptions.data if s.get('status') == 'active']
        print(f"Active subscriptions: {len(active_subs)}")
        
        for i, sub in enumerate(active_subs[:3]):  # Show first 3 active
            user_id = sub.get('user_id', 'N/A')
            plan_id = sub.get('plan_id', 'N/A')
            start = sub.get('current_period_start', 'N/A')
            end = sub.get('current_period_end', 'N/A')
            print(f"  Active Sub {i+1}: User {user_id} - Plan {plan_id}")
            print(f"    Period: {start} to {end}")
        print()
        
    except Exception as e:
        print(f"❌ Error fetching subscriptions: {e}")
    
    # Check 4: Check for trial data
    print("🎯 CHECKING TRIAL DATA:")
    print("-" * 40)
    try:
        trials = supabase.table('user_trials').select('*').execute()
        print(f"Total trials: {len(trials.data)}")
        
        active_trials = [t for t in trials.data if t.get('end_date') and 
                        datetime.fromisoformat(t['end_date'].replace('Z', '+00:00')) > datetime.now()]
        print(f"Active trials: {len(active_trials)}")
        
        for i, trial in enumerate(active_trials[:3]):  # Show first 3 active
            user_id = trial.get('user_id', 'N/A')
            start = trial.get('start_date', 'N/A')
            end = trial.get('end_date', 'N/A')
            print(f"  Active Trial {i+1}: User {user_id}")
            print(f"    Period: {start} to {end}")
        print()
        
    except Exception as e:
        print(f"❌ Error fetching trials: {e}")
    
    # Check 5: Check payment transactions
    print("💰 CHECKING PAYMENT TRANSACTIONS:")
    print("-" * 40)
    try:
        # Try different possible table names for payment transactions
        payment_tables = ['payment_transactions', 'paystack_transactions', 'transactions']
        
        for table_name in payment_tables:
            try:
                payments = supabase.table(table_name).select('*').execute()
                print(f"✅ Table '{table_name}': {len(payments.data)} transactions")
                
                for i, payment in enumerate(payments.data[:3]):  # Show first 3
                    user_id = payment.get('user_id', 'N/A')
                    ref = payment.get('reference', payment.get('paystack_reference', 'N/A'))
                    amount = payment.get('amount', 'N/A')
                    status = payment.get('status', 'N/A')
                    print(f"  Payment {i+1}: User {user_id} - Ref: {ref}")
                    print(f"    Amount: {amount}, Status: {status}")
                break
                
            except Exception as e:
                print(f"❌ Table '{table_name}' - Error: {str(e)}")
        print()
        
    except Exception as e:
        print(f"❌ Error checking payments: {e}")
    
    # Check 6: Test the backend subscription status endpoint simulation
    print("🔍 TESTING SUBSCRIPTION STATUS LOGIC:")
    print("-" * 40)
    try:
        # Get a sample user to test with
        profiles = supabase.table('profiles').select('*').limit(1).execute()
        if profiles.data:
            test_user_id = profiles.data[0]['id']
            print(f"Testing with user ID: {test_user_id}")
            
            # Check their subscription status manually
            user_subs = supabase.table('user_subscriptions').select('*').eq('user_id', test_user_id).execute()
            print(f"User subscriptions: {len(user_subs.data)}")
            
            for sub in user_subs.data:
                print(f"  Subscription: {sub}")
            
            # Check their trial status
            user_trials = supabase.table('user_trials').select('*').eq('user_id', test_user_id).execute()
            print(f"User trials: {len(user_trials.data)}")
            
            for trial in user_trials.data:
                print(f"  Trial: {trial}")
                
        else:
            print("❌ No users found to test with")
        print()
        
    except Exception as e:
        print(f"❌ Error testing subscription logic: {e}")
    
    # Check 7: Test RPC functions if they exist
    print("⚙️ TESTING RPC FUNCTIONS:")
    print("-" * 40)
    try:
        # Test if RPC functions exist by trying to call them
        rpc_functions = [
            'get_user_subscription_status',
            'create_user_trial', 
            'activate_user_subscription'
        ]
        
        for func_name in rpc_functions:
            try:
                # Try calling with minimal params to see if function exists
                result = supabase.rpc(func_name, {}).execute()
                print(f"✅ RPC function '{func_name}' exists")
            except Exception as e:
                error_msg = str(e).lower()
                if 'does not exist' in error_msg or 'not found' in error_msg:
                    print(f"❌ RPC function '{func_name}' does not exist")
                else:
                    print(f"✅ RPC function '{func_name}' exists (error: {str(e)[:50]}...)")
        print()
        
    except Exception as e:
        print(f"❌ Error testing RPC functions: {e}")
    
    print("🎯 SUMMARY:")
    print("-" * 40)
    print("Check the output above to see:")
    print("1. ✅ Are the required tables present?")
    print("2. 👥 Are users being created in profiles?") 
    print("3. 💳 Are subscriptions being stored after payment?")
    print("4. 🎯 Are trials being created for new users?")
    print("5. 💰 Are payment transactions being recorded?")
    print("6. ⚙️ Are the RPC functions available?")
    print()
    print("If any of these are missing, that's likely the issue!")

if __name__ == "__main__":
    main()
