#!/usr/bin/env python3
"""
Script to check subscription data directly in Supabase
This will help us see if data is actually being stored in the database
"""

import os
import sys
from supabase import create_client, Client
from datetime import datetime

def check_supabase_connection():
    """Check if we can connect to Supabase"""
    try:
        # Get Supabase credentials from environment
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not supabase_url or not supabase_key:
            print("❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment")
            return None
            
        supabase: Client = create_client(supabase_url, supabase_key)
        print("✅ Connected to Supabase")
        return supabase
        
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        return None

def check_subscription_tables(supabase):
    """Check what's in the subscription-related tables"""
    print("\n🔍 Checking subscription tables...")
    
    try:
        # Check user_subscriptions table
        print("\n📊 USER_SUBSCRIPTIONS table:")
        subscriptions = supabase.table('user_subscriptions').select('*').execute()
        print(f"Found {len(subscriptions.data)} subscription records")
        
        for sub in subscriptions.data:
            print(f"  - User: {sub.get('user_id')}, Status: {sub.get('status')}, End: {sub.get('current_period_end')}")
            
    except Exception as e:
        print(f"❌ Error checking user_subscriptions: {e}")
    
    try:
        # Check user_trials table
        print("\n📊 USER_TRIALS table:")
        trials = supabase.table('user_trials').select('*').execute()
        print(f"Found {len(trials.data)} trial records")
        
        for trial in trials.data:
            print(f"  - User: {trial.get('user_id')}, Used: {trial.get('is_used')}, End: {trial.get('end_date')}")
            
    except Exception as e:
        print(f"❌ Error checking user_trials: {e}")
    
    try:
        # Check subscription_plans table
        print("\n📊 SUBSCRIPTION_PLANS table:")
        plans = supabase.table('subscription_plans').select('*').execute()
        print(f"Found {len(plans.data)} plan records")
        
        for plan in plans.data:
            print(f"  - Plan: {plan.get('name')}, Duration: {plan.get('duration_days')} days")
            
    except Exception as e:
        print(f"❌ Error checking subscription_plans: {e}")
    
    try:
        # Check profiles table
        print("\n📊 PROFILES table:")
        profiles = supabase.table('profiles').select('id, email, created_at').limit(5).execute()
        print(f"Found {len(profiles.data)} profile records (showing first 5)")
        
        for profile in profiles.data:
            print(f"  - ID: {profile.get('id')}, Email: {profile.get('email')}")
            
    except Exception as e:
        print(f"❌ Error checking profiles: {e}")

def test_subscription_status_function(supabase):
    """Test the get_user_subscription_status function"""
    print("\n🔍 Testing get_user_subscription_status function...")
    
    try:
        # Get a user ID from profiles
        profiles = supabase.table('profiles').select('id').limit(1).execute()
        
        if profiles.data:
            user_id = profiles.data[0]['id']
            print(f"Testing with user ID: {user_id}")
            
            # Call the RPC function
            result = supabase.rpc('get_user_subscription_status', {'p_user_id': user_id}).execute()
            
            print(f"✅ RPC function result: {result.data}")
            
        else:
            print("❌ No users found in profiles table")
            
    except Exception as e:
        print(f"❌ Error testing RPC function: {e}")

def main():
    """Main function"""
    print("🧪 SUPABASE SUBSCRIPTION CHECKER")
    print("=" * 50)
    
    # Check connection
    supabase = check_supabase_connection()
    if not supabase:
        return
    
    # Check tables
    check_subscription_tables(supabase)
    
    # Test RPC function
    test_subscription_status_function(supabase)
    
    print("\n" + "=" * 50)
    print("🏁 Check completed!")
    print("\n📋 What to look for:")
    print("1. Are there any records in user_subscriptions?")
    print("2. Are there any records in user_trials?")
    print("3. Is the RPC function working?")
    print("4. Are user IDs consistent between tables?")

if __name__ == "__main__":
    main()
