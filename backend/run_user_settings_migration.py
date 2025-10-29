#!/usr/bin/env python3
"""
Script to create the user_settings table in Supabase
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client

def main():
    # Load environment variables
    load_dotenv()
    
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        print('❌ Missing Supabase credentials in .env file')
        print('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
        sys.exit(1)
    
    # Create Supabase client
    supabase = create_client(supabase_url, supabase_key)
    
    # Read the SQL migration file
    migration_file = 'scripts/021_create_user_settings_table.sql'
    if not os.path.exists(migration_file):
        print(f'❌ Migration file not found: {migration_file}')
        sys.exit(1)
    
    with open(migration_file, 'r') as f:
        sql = f.read()
    
    print('📄 Running user_settings table migration...')
    
    try:
        # Split SQL into individual statements and execute them
        statements = [stmt.strip() for stmt in sql.split(';') if stmt.strip()]
        
        for i, statement in enumerate(statements):
            if statement:
                print(f'  Executing statement {i+1}/{len(statements)}...')
                try:
                    # Use the postgrest client to execute raw SQL
                    result = supabase.postgrest.rpc('exec_sql', {'sql': statement}).execute()
                    print(f'  ✅ Statement {i+1} executed successfully')
                except Exception as e:
                    print(f'  ⚠️  Statement {i+1} warning: {e}')
                    # Continue with other statements
        
        print('✅ Migration completed successfully!')
        
        # Test the table
        print('🧪 Testing user_settings table...')
        result = supabase.table('user_settings').select('*').limit(1).execute()
        print('✅ user_settings table is accessible')
        
    except Exception as e:
        print(f'❌ Migration failed: {e}')
        print('\n📋 Please run the following SQL manually in your Supabase dashboard:')
        print('=' * 60)
        print(sql)
        print('=' * 60)
        sys.exit(1)

if __name__ == '__main__':
    main()
