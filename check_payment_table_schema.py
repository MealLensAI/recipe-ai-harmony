#!/usr/bin/env python3
"""
Check the schema of the payment_transactions table
"""

import os
import sys
sys.path.append('backend')

from supabase import create_client, Client
import json

def main():
    print("🔍 CHECKING PAYMENT_TRANSACTIONS TABLE SCHEMA")
    print("=" * 60)
    
    # Initialize Supabase client
    try:
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not supabase_url or not supabase_key:
            print("❌ Missing Supabase credentials")
            return
            
        supabase: Client = create_client(supabase_url, supabase_key)
        print("✅ Supabase client created successfully")
        print()
        
    except Exception as e:
        print(f"❌ Failed to create Supabase client: {e}")
        return
    
    # Try to get table schema by attempting to insert a test record
    print("📋 TESTING PAYMENT_TRANSACTIONS TABLE:")
    print("-" * 40)
    
    test_payment_data = {
        'user_id': 'cd9d8fed-6e82-4831-9890-99c87a2eb8cc',
        'subscription_id': 'test-sub-id',
        'plan_id': 'test-plan-id',
        'amount': 2.5,
        'currency': 'USD',
        'payment_method': 'paystack',
        'payment_reference': 'test_ref_123',
        'status': 'completed',
        'paystack_reference': 'test_ref_123',
        'paystack_transaction_id': 'test_txn_456',
        'metadata': {'test': 'data'}
    }
    
    try:
        print("🧪 Attempting to insert test payment record...")
        result = supabase.table('payment_transactions').insert(test_payment_data).execute()
        print("✅ Test payment record inserted successfully!")
        print(f"📊 Result: {result.data}")
        
        # Clean up - delete the test record
        if result.data:
            test_id = result.data[0].get('id')
            if test_id:
                delete_result = supabase.table('payment_transactions').delete().eq('id', test_id).execute()
                print(f"🧹 Cleaned up test record: {delete_result.data}")
        
    except Exception as e:
        print(f"❌ Error inserting test payment record: {e}")
        print(f"🔍 Error details: {str(e)}")
        
        # Try to get more info about the table
        try:
            print("\n🔍 Attempting to get table info...")
            # Try a simple select to see what columns exist
            select_result = supabase.table('payment_transactions').select('*').limit(1).execute()
            print(f"📋 Table exists and has {len(select_result.data)} records")
            if select_result.data:
                print(f"📊 Sample record columns: {list(select_result.data[0].keys())}")
        except Exception as select_error:
            print(f"❌ Error selecting from table: {select_error}")

if __name__ == "__main__":
    # Set environment variables
    os.environ['SUPABASE_URL'] = 'https://pklqumlzpklzroafmtrs.supabase.co'
    os.environ['SUPABASE_SERVICE_ROLE_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHF1bWx6cGtsenJvYWZtdHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjExNzE1MiwiZXhwIjoyMDY3NjkzMTUyfQ.nyH5xb6O6E0NCSnycw9AM7r3kfhs1LDrmeTiSsVODO8'
    
    main()
