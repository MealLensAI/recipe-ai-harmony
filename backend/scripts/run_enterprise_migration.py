"""
Script to run the enterprise system migration
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def run_migration():
    """Run the enterprise system migration"""
    
    # Get Supabase credentials
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        print("Error: Missing Supabase credentials")
        return
    
    # Create Supabase client
    supabase: Client = create_client(supabase_url, supabase_key)
    
    # Read the SQL migration file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sql_file = os.path.join(script_dir, '019_create_enterprise_system.sql')
    
    try:
        with open(sql_file, 'r') as f:
            sql_content = f.read()
        
        print("Running enterprise system migration...")
        print("-" * 50)
        
        # Split SQL into individual statements
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        for i, statement in enumerate(statements, 1):
            if statement.strip():
                try:
                    # Execute SQL statement using the RPC mechanism
                    # Note: Supabase Python client doesn't directly support raw SQL execution
                    # You'll need to use a PostgreSQL client or execute via Supabase dashboard
                    print(f"Statement {i}/{len(statements)}: {statement[:50]}...")
                    
                    # For now, just print the statements
                    # In production, you would execute these via psycopg2 or similar
                    
                except Exception as e:
                    print(f"Warning: Failed to execute statement {i}: {str(e)}")
                    continue
        
        print("-" * 50)
        print("Migration script prepared!")
        print("\nTo execute the migration:")
        print("1. Copy the SQL from backend/scripts/019_create_enterprise_system.sql")
        print("2. Go to your Supabase Dashboard > SQL Editor")
        print("3. Paste and run the SQL")
        print("\nOR run the following command:")
        print(f"psql {supabase_url} < backend/scripts/019_create_enterprise_system.sql")
        
    except FileNotFoundError:
        print(f"Error: Migration file not found at {sql_file}")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    run_migration()

