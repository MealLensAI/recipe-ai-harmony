#!/usr/bin/env python3
"""
Script to apply SQL migrations to Supabase.

This script reads SQL files from the scripts directory and applies them to the Supabase database.
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

def load_sql_file(file_path: str) -> str:
    """Load SQL from a file."""
    with open(file_path, 'r') as f:
        return f.read()

def apply_migration(supabase: Client, sql: str, migration_name: str) -> bool:
    """Apply a single migration."""
    print(f"Applying migration: {migration_name}")
    try:
        # Use the RPC method to execute raw SQL
        result = supabase.rpc('pg_catalog.pg_execute', {
            'query': sql
        }).execute()
        print(f"Successfully applied migration: {migration_name}")
        return True
    except Exception as e:
        print(f"Error applying migration {migration_name}: {str(e)}")
        return False

def main():
    # Load environment variables
    load_dotenv()
    
    # Get Supabase credentials
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    
    if not supabase_url or not supabase_key:
        print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
        sys.exit(1)
    
    # Initialize Supabase client
    supabase = create_client(supabase_url, supabase_key)
    
    # Get list of migration files in order
    migration_dir = os.path.dirname(os.path.abspath(__file__))
    migration_files = sorted([f for f in os.listdir(migration_dir) 
                           if f.endswith('.sql') and f.startswith(('002_', '003_', '004_'))])
    
    if not migration_files:
        print("No migration files found in scripts directory")
        sys.exit(0)
    
    print(f"Found {len(migration_files)} migration(s) to apply")
    
    # Apply each migration
    for migration_file in migration_files:
        migration_path = os.path.join(migration_dir, migration_file)
        sql = load_sql_file(migration_path)
        if not apply_migration(supabase, sql, migration_file):
            print(f"Failed to apply migration: {migration_file}")
            sys.exit(1)
    
    print("All migrations applied successfully")

if __name__ == "__main__":
    main()
