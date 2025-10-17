#!/usr/bin/env python3
"""
Script to run the sickness tracking migration for meal plans.
This adds the has_sickness and sickness_type columns to the meal_plan_management table.
"""

import os
import sys
import subprocess
from pathlib import Path

def run_migration():
    """Run the database migration to add sickness tracking columns."""
    
    # Get the script directory
    script_dir = Path(__file__).parent
    migration_file = script_dir / "backend" / "scripts" / "014_add_sickness_tracking_to_meal_plans.sql"
    
    if not migration_file.exists():
        print(f"❌ Migration file not found: {migration_file}")
        return False
    
    print(f"🔄 Running migration: {migration_file}")
    
    try:
        # Check if psql is available
        result = subprocess.run(['psql', '--version'], capture_output=True, text=True)
        if result.returncode != 0:
            print("❌ psql not found. Please install PostgreSQL client tools.")
            return False
        
        # You would need to set up the database connection here
        # For now, just show the SQL that needs to be run
        with open(migration_file, 'r') as f:
            sql_content = f.read()
        
        print("📋 SQL Migration Content:")
        print("=" * 50)
        print(sql_content)
        print("=" * 50)
        
        print("\n⚠️  MANUAL STEP REQUIRED:")
        print("Please run this SQL migration manually in your Supabase dashboard or PostgreSQL client:")
        print(f"File: {migration_file}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error running migration: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Sickness Tracking Migration")
    print("=" * 40)
    
    success = run_migration()
    
    if success:
        print("\n✅ Migration script prepared successfully!")
        print("\n📝 Next steps:")
        print("1. Run the SQL migration in your database")
        print("2. Restart your backend server")
        print("3. Test creating meal plans with sickness settings")
        print("4. Verify that the UI shows correct indicators")
    else:
        print("\n❌ Migration failed!")
        sys.exit(1)
