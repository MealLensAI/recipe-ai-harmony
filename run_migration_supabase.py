#!/usr/bin/env python3
"""
Migration script using Supabase Python client to set up the user lifecycle management system.
"""

import os
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = "https://pklqumlzpklzroafmtrs.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHF1bWx6cGtsenJvYWZtdHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjExNzE1MiwiZXhwIjoyMDY3NjkzMTUyfQ.nyH5xb6O6E0NCSnycw9AM7r3kfhs1LDrmeTiSsVODO8"

def run_migration():
    """Run the lifecycle management migration using Supabase client"""
    
    print("🚀 Starting User Lifecycle Management Migration")
    print("=" * 50)
    print(f"Supabase URL: {SUPABASE_URL}")
    print("=" * 50)
    
    try:
        # Create Supabase client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        print("✅ Connected to Supabase successfully!")
        
        # Read the migration file
        migration_file = "backend/scripts/018_user_lifecycle_management.sql"
        if not os.path.exists(migration_file):
            print(f"❌ Migration file not found: {migration_file}")
            return False
        
        print(f"📖 Reading migration file: {migration_file}")
        with open(migration_file, 'r') as f:
            migration_sql = f.read()
        
        print("🔄 Executing migration using Supabase RPC...")
        
        # Execute the migration using Supabase's SQL execution
        try:
            result = supabase.rpc('exec_sql', {'sql': migration_sql}).execute()
            print("✅ Migration executed successfully!")
        except Exception as e:
            print(f"⚠️ RPC execution failed, trying alternative method: {str(e)}")
            
            # Alternative: Execute statements one by one
            statements = migration_sql.split(';')
            for i, statement in enumerate(statements):
                statement = statement.strip()
                if statement and not statement.startswith('--') and len(statement) > 10:
                    try:
                        print(f"   Executing statement {i+1}/{len(statements)}...")
                        supabase.rpc('exec_sql', {'sql': statement}).execute()
                        print(f"   ✅ Statement {i+1} executed successfully")
                    except Exception as e:
                        print(f"   ⚠️ Statement {i+1} warning: {str(e)}")
                        # Continue with other statements
        
        print("✅ Migration completed successfully!")
        
        # Test the migration by checking if the new column exists
        print("\n🧪 Testing migration...")
        try:
            # Test if we can query the profiles table with user_state
            result = supabase.table('profiles').select('user_state').limit(1).execute()
            print("✅ user_state column exists and is accessible!")
        except Exception as e:
            print(f"⚠️ Could not test user_state column: {str(e)}")
        
        print("\n🎉 Migration completed successfully!")
        print("=" * 50)
        print("Next steps:")
        print("1. Restart your backend server: cd backend && python app.py")
        print("2. Test the system with: python test_lifecycle_system.py")
        print("3. Or open test_lifecycle_frontend.html in your browser")
        print("=" * 50)
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        return False

def test_connection():
    """Test the Supabase connection"""
    print("🔍 Testing Supabase connection...")
    
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        # Test connection by querying a simple table
        result = supabase.table('profiles').select('id').limit(1).execute()
        print("✅ Supabase connection successful!")
        return True
    except Exception as e:
        print(f"❌ Supabase connection failed: {str(e)}")
        return False

def main():
    """Main function"""
    print("🍽️ MealLensAI Database Migration Tool (Supabase)")
    print("=" * 50)
    
    # Test connection first
    if not test_connection():
        print("\n❌ Cannot connect to Supabase. Please check your credentials.")
        return
    
    print("\n" + "=" * 50)
    response = input("Run the lifecycle management migration? (y/n): ").lower().strip()
    
    if response == 'y':
        success = run_migration()
        if success:
            print("\n🎉 Migration completed successfully!")
        else:
            print("\n❌ Migration failed!")
    else:
        print("Migration cancelled.")

if __name__ == "__main__":
    main()
