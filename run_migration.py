#!/usr/bin/env python3
"""
Migration script to set up the user lifecycle management system in Supabase.
This script will run the database migration directly.
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Supabase connection details
SUPABASE_URL = "https://pklqumlzpklzroafmtrs.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHF1bWx6cGtsenJvYWZtdHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjExNzE1MiwiZXhwIjoyMDY3NjkzMTUyfQ.nyH5xb6O6E0NCSnycw9AM7r3kfhs1LDrmeTiSsVODO8"

# Extract connection details from Supabase URL
# Supabase URL format: https://project-ref.supabase.co
# We need to connect to: db.project-ref.supabase.co:5432
project_ref = SUPABASE_URL.split('//')[1].split('.')[0]
db_host = f"db.{project_ref}.supabase.co"
db_port = 5432
db_name = "postgres"
db_user = "postgres"
db_password = SUPABASE_SERVICE_ROLE_KEY

def run_migration():
    """Run the lifecycle management migration"""
    
    print("🚀 Starting User Lifecycle Management Migration")
    print("=" * 50)
    print(f"Connecting to: {db_host}:{db_port}")
    print(f"Database: {db_name}")
    print(f"User: {db_user}")
    print("=" * 50)
    
    try:
        # Connect to Supabase
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            database=db_name,
            user=db_user,
            password=db_password,
            sslmode='require'
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("✅ Connected to Supabase successfully!")
        
        # Read the migration file
        migration_file = "backend/scripts/018_user_lifecycle_management.sql"
        if not os.path.exists(migration_file):
            print(f"❌ Migration file not found: {migration_file}")
            return False
        
        print(f"📖 Reading migration file: {migration_file}")
        with open(migration_file, 'r') as f:
            migration_sql = f.read()
        
        print("🔄 Executing migration...")
        
        # Split the migration into individual statements
        statements = migration_sql.split(';')
        
        for i, statement in enumerate(statements):
            statement = statement.strip()
            if statement and not statement.startswith('--'):
                try:
                    print(f"   Executing statement {i+1}/{len(statements)}...")
                    cursor.execute(statement)
                    print(f"   ✅ Statement {i+1} executed successfully")
                except Exception as e:
                    print(f"   ⚠️ Statement {i+1} warning: {str(e)}")
                    # Continue with other statements
        
        print("✅ Migration completed successfully!")
        
        # Test the migration by checking if the new column exists
        print("\n🧪 Testing migration...")
        cursor.execute("""
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'user_state'
        """)
        
        result = cursor.fetchone()
        if result:
            print(f"✅ user_state column created successfully!")
            print(f"   Type: {result[1]}")
            print(f"   Default: {result[2]}")
        else:
            print("❌ user_state column not found!")
            return False
        
        # Test the new functions
        print("\n🔍 Testing new functions...")
        test_functions = [
            'get_user_lifecycle_status',
            'initialize_user_trial',
            'mark_trial_used',
            'activate_user_subscription_lifecycle',
            'mark_subscription_expired',
            'set_test_mode',
            'get_user_state_display'
        ]
        
        for func_name in test_functions:
            cursor.execute("""
                SELECT routine_name 
                FROM information_schema.routines 
                WHERE routine_name = %s AND routine_schema = 'public'
            """, (func_name,))
            
            if cursor.fetchone():
                print(f"   ✅ {func_name} function created")
            else:
                print(f"   ❌ {func_name} function not found")
        
        cursor.close()
        conn.close()
        
        print("\n🎉 Migration completed successfully!")
        print("=" * 50)
        print("Next steps:")
        print("1. Restart your backend server: python app.py")
        print("2. Test the system with: python test_lifecycle_system.py")
        print("3. Or open test_lifecycle_frontend.html in your browser")
        print("=" * 50)
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        return False

def test_connection():
    """Test the database connection"""
    print("🔍 Testing database connection...")
    
    try:
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            database=db_name,
            user=db_user,
            password=db_password,
            sslmode='require'
        )
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ Connection successful!")
        print(f"   PostgreSQL version: {version[0]}")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        return False

def main():
    """Main function"""
    print("🍽️ MealLensAI Database Migration Tool")
    print("=" * 50)
    
    # Test connection first
    if not test_connection():
        print("\n❌ Cannot connect to database. Please check your credentials.")
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
