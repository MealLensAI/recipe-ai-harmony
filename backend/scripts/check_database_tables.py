#!/usr/bin/env python3
"""
Script to check database tables and their contents
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

def check_database_tables():
    """Check what tables exist and their contents"""
    supabase = get_supabase_client()
    
    print("🔍 Checking database tables...")
    print("=" * 60)
    
    # List of tables to check
    tables_to_check = [
        'profiles',
        'user_subscriptions', 
        'subscription_plans',
        'payment_transactions',
        'user_trials',
        'feature_usage',
        'paystack_webhooks'
    ]
    
    for table_name in tables_to_check:
        print(f"\n📋 Table: {table_name}")
        print("-" * 40)
        
        try:
            # Try to get a few records from each table
            result = supabase.table(table_name).select('*').limit(5).execute()
            
            if result.data:
                print(f"✅ Found {len(result.data)} records (showing first 5):")
                for i, record in enumerate(result.data, 1):
                    print(f"   {i}. {record}")
            else:
                print("❌ No records found")
                
        except Exception as e:
            print(f"❌ Error accessing table: {str(e)}")
    
    # Check if we can access auth.users (this might be restricted)
    print(f"\n📋 Table: auth.users")
    print("-" * 40)
    try:
        result = supabase.table('auth.users').select('*').limit(3).execute()
        if result.data:
            print(f"✅ Found {len(result.data)} auth users (showing first 3):")
            for i, record in enumerate(result.data, 1):
                # Don't show sensitive data
                safe_record = {k: v for k, v in record.items() if k in ['id', 'email', 'created_at']}
                print(f"   {i}. {safe_record}")
        else:
            print("❌ No auth users found")
    except Exception as e:
        print(f"❌ Error accessing auth.users: {str(e)}")

if __name__ == "__main__":
    check_database_tables()
