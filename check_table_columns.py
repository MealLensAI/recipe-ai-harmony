#!/usr/bin/env python3
"""
Check what columns actually exist in the payment_transactions table
"""

import os
import sys
sys.path.append('backend')

from supabase import create_client, Client

def main():
    print("🔍 CHECKING PAYMENT_TRANSACTIONS TABLE COLUMNS")
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
    
    # Try to insert a minimal record to see what columns are required
    print("📋 TESTING MINIMAL PAYMENT RECORD:")
    print("-" * 40)
    
    # Try with just the basic required fields
    minimal_data = {
        'user_id': 'cd9d8fed-6e82-4831-9890-99c87a2eb8cc',
        'amount': 2.5,
        'status': 'completed'
    }
    
    try:
        print("🧪 Attempting minimal insert...")
        result = supabase.table('payment_transactions').insert(minimal_data).execute()
        print("✅ Minimal payment record inserted successfully!")
        print(f"📊 Result: {result.data}")
        
        # Clean up
        if result.data:
            test_id = result.data[0].get('id')
            if test_id:
                delete_result = supabase.table('payment_transactions').delete().eq('id', test_id).execute()
                print(f"🧹 Cleaned up test record")
        
    except Exception as e:
        print(f"❌ Error with minimal insert: {e}")
        
        # Try to get the actual table structure by querying the information schema
        try:
            print("\n🔍 Querying table structure...")
            # This might not work with Supabase client, but let's try
            schema_result = supabase.rpc('get_table_columns', {'table_name': 'payment_transactions'}).execute()
            print(f"📋 Table columns: {schema_result.data}")
        except Exception as schema_error:
            print(f"❌ Could not get table schema: {schema_error}")
            
            # Try a different approach - attempt inserts with different field combinations
            print("\n🧪 Testing different field combinations...")
            
            test_fields = [
                {'user_id': 'test', 'amount': 1.0},
                {'user_id': 'test', 'amount': 1.0, 'currency': 'USD'},
                {'user_id': 'test', 'amount': 1.0, 'payment_method': 'paystack'},
                {'user_id': 'test', 'amount': 1.0, 'reference': 'test_ref'},
                {'user_id': 'test', 'amount': 1.0, 'paystack_reference': 'test_ref'},
            ]
            
            for i, fields in enumerate(test_fields):
                try:
                    result = supabase.table('payment_transactions').insert(fields).execute()
                    print(f"✅ Fields {i+1} work: {list(fields.keys())}")
                    # Clean up
                    if result.data:
                        test_id = result.data[0].get('id')
                        if test_id:
                            supabase.table('payment_transactions').delete().eq('id', test_id).execute()
                    break
                except Exception as field_error:
                    print(f"❌ Fields {i+1} failed: {list(fields.keys())} - {str(field_error)[:100]}...")

if __name__ == "__main__":
    # Set environment variables
    os.environ['SUPABASE_URL'] = 'https://pklqumlzpklzroafmtrs.supabase.co'
    os.environ['SUPABASE_SERVICE_ROLE_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHF1bWx6cGtsenJvYWZtdHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjExNzE1MiwiZXhwIjoyMDY3NjkzMTUyfQ.nyH5xb6O6E0NCSnycw9AM7r3kfhs1LDrmeTiSsVODO8'
    
    main()
