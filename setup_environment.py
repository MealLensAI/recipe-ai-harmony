#!/usr/bin/env python3
"""
Environment setup script for MealLensAI.
This script will create the necessary .env files with your Supabase credentials.
"""

import os

def create_backend_env():
    """Create backend/.env file"""
    backend_env_content = """# Supabase Configuration
SUPABASE_URL=https://pklqumlzpklzroafmtrs.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHF1bWx6cGtsenJvYWZtdHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMTcxNTIsImV4cCI6MjA2NzY5MzE1Mn0.eyzqg0hBZ5ZoPJKwGXPSKL96TJaPOX_p08dxt4FOn8g
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHF1bWx6cGtsenJvYWZtdHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjExNzE1MiwiZXhwIjoyMDY3NjkzMTUyfQ.nyH5xb6O6E0NCSnycw9AM7r3kfhs1LDrmeTiSsVODO8

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_JSON=./backend/meallensai-40f6f-firebase-adminsdk-fbsvc-0f6274190b.json

# Paystack Configuration
PAYSTACK_SECRET_KEY=pk_test_1c02d4696e755d70019d0fd4d6a402de0ed7384a
PAYSTACK_PUBLIC_KEY=pk_test_1c02d4696e755d70019d0fd4d6a402de0ed7384a

# API Configuration
VITE_API_URL=http://localhost:5001/api

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,https://meallensai.com,https://www.meallensai.com
"""
    
    backend_env_path = "backend/.env"
    
    try:
        with open(backend_env_path, 'w') as f:
            f.write(backend_env_content)
        print(f"✅ Created {backend_env_path}")
        return True
    except Exception as e:
        print(f"❌ Failed to create {backend_env_path}: {str(e)}")
        return False

def create_frontend_env():
    """Create .env.local file for frontend"""
    frontend_env_content = """# Supabase Configuration
VITE_SUPABASE_URL=https://pklqumlzpklzroafmtrs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHF1bWx6cGtsenJvYWZtdHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMTcxNTIsImV4cCI6MjA2NzY5MzE1Mn0.eyzqg0hBZ5ZoPJKwGXPSKL96TJaPOX_p08dxt4FOn8g

# API Configuration
VITE_API_BASE_URL=http://localhost:5001

# Paystack Configuration
VITE_PAYSTACK_PUBLIC_KEY=pk_test_1c02d4696e755d70019d0fd4d6a402de0ed7384a
# Optional: make "days" behave like minutes for fast testing
VITE_SUB_TIME_UNIT=minutes
"""
    
    frontend_env_path = ".env.local"
    
    try:
        with open(frontend_env_path, 'w') as f:
            f.write(frontend_env_content)
        print(f"✅ Created {frontend_env_path}")
        return True
    except Exception as e:
        print(f"❌ Failed to create {frontend_env_path}: {str(e)}")
        return False

def main():
    """Main setup function"""
    print("🍽️ MealLensAI Environment Setup")
    print("=" * 40)
    
    print("Setting up environment files...")
    
    backend_success = create_backend_env()
    frontend_success = create_frontend_env()
    
    if backend_success and frontend_success:
        print("\n✅ Environment setup completed successfully!")
        print("\nNext steps:")
        print("1. Run the migration: python run_migration.py")
        print("2. Start the backend: cd backend && python app.py")
        print("3. Start the frontend: npm run dev")
    else:
        print("\n❌ Environment setup failed!")
        print("Please check the errors above and try again.")

if __name__ == "__main__":
    main()
