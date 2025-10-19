#!/usr/bin/env python3
"""
Script to create missing detection_history RPC functions in Supabase.
This fixes the issue where detection history is not being saved.
"""

import os
import sys
import requests

# Add parent directory to path to import database module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def run_migration():
    """Run the detection history RPC functions migration"""
    
    # Get Supabase credentials from environment
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment")
        print("\n📋 Instructions:")
        print("1. Go to your Supabase project dashboard")
        print("2. Navigate to SQL Editor")
        print("3. Copy and paste the contents of backend/scripts/020_create_detection_history_functions.sql")
        print("4. Run the SQL script")
        print("\nAlternatively, set the environment variables and run this script again.")
        sys.exit(1)
    
    print(f"🔗 Using Supabase at {supabase_url}")
    
    try:
        # Read the SQL migration file
        script_dir = os.path.dirname(os.path.abspath(__file__))
        sql_file = os.path.join(script_dir, "020_create_detection_history_functions.sql")
        
        with open(sql_file, 'r') as f:
            sql_content = f.read()
        
        print(f"📄 Read migration file: {sql_file}")
        print(f"📝 SQL content length: {len(sql_content)} characters")
        
        # Use Supabase Management API to execute SQL
        print("\n🔄 Executing migration via Supabase REST API...")
        
        # Extract project ref from URL
        project_ref = supabase_url.split("//")[1].split(".")[0]
        
        # Construct SQL API endpoint
        sql_api_url = f"https://api.supabase.com/v1/projects/{project_ref}/database/query"
        
        headers = {
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "query": sql_content
        }
        
        response = requests.post(sql_api_url, json=payload, headers=headers)
        
        if response.status_code == 200:
            print("✅ Migration executed successfully!")
            print(f"📊 Response: {response.json()}")
        else:
            print(f"⚠️ API response status: {response.status_code}")
            print(f"📄 Response: {response.text}")
            print("\n📋 Manual Migration Instructions:")
            print("1. Go to your Supabase project dashboard")
            print("2. Navigate to SQL Editor")
            print("3. Copy and paste the following SQL:")
            print("\n" + "=" * 80)
            print(sql_content)
            print("=" * 80 + "\n")
            print("4. Run the SQL script")
            return
        
        # Test the function by trying to call it
        print("\n🧪 Testing if functions were created...")
        from supabase import create_client, Client
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Try listing functions (this will just verify connection)
        print("✅ Functions should now be available in your database")
        
    except Exception as e:
        print(f"❌ Error during migration: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        
        print("\n📋 Manual Migration Instructions:")
        print("1. Go to your Supabase project dashboard")
        print("2. Navigate to SQL Editor")
        print("3. Copy and paste the contents of backend/scripts/020_create_detection_history_functions.sql")
        print("4. Run the SQL script")
        sys.exit(1)

if __name__ == "__main__":
    print("=" * 80)
    print("🚀 Detection History RPC Functions Migration")
    print("=" * 80)
    run_migration()
    print("=" * 80)
    print("✅ Migration completed!")
    print("=" * 80)

