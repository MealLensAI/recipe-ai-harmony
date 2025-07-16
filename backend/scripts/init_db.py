import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(supabase_url, supabase_key)

def check_or_create_profiles_table():
    """Check if the profiles table exists and create it if it doesn't."""
    try:
        # First, try to create the table (will fail if it already exists)
        create_table_sql = """
        DO $$
        BEGIN
            -- Create the profiles table if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
                CREATE TABLE public.profiles (
                    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
                    email TEXT UNIQUE NOT NULL,
                    firebase_uid TEXT UNIQUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                
                -- Enable Row Level Security
                ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
                
                -- Create policies
                CREATE POLICY "Users can view their own profile." 
                    ON public.profiles FOR SELECT 
                    USING (auth.uid() = id);
                    
                CREATE POLICY "Users can insert their own profile." 
                    ON public.profiles FOR INSERT 
                    WITH CHECK (auth.uid() = id);
                    
                CREATE POLICY "Users can update their own profile." 
                    ON public.profiles FOR UPDATE 
                    USING (auth.uid() = id);
                    
                RAISE NOTICE 'Profiles table created successfully!';
            ELSE
                RAISE NOTICE 'Profiles table already exists.';
            END IF;
        END $$;
        """
        
        # Execute the SQL to create the table if it doesn't exist
        try:
            result = supabase.rpc('execute_sql', {'query': create_table_sql}).execute()
            print("Database schema check/update completed.")
        except Exception as e:
            print(f"Error executing SQL: {str(e)}")
            # Try an alternative approach if the first one fails
            try:
                # Check if table exists by trying to select from it
                supabase.table('profiles').select('*').limit(1).execute()
                print("Profiles table already exists.")
            except Exception as select_error:
                print(f"Profiles table does not exist or is not accessible: {str(select_error)}")
                raise Exception("Could not verify or create the profiles table. Please check your database permissions.")
        
        # Get table structure
        try:
            # Use information_schema directly through a raw query
            structure_sql = """
            SELECT column_name, data_type, is_nullable, 
                   CASE WHEN column_default IS NOT NULL THEN 'DEFAULT' ELSE '' END as has_default,
                   CASE WHEN column_default = 'nextval(''profiles_id_seq''::regclass)' THEN 'SERIAL' ELSE '' END as is_serial
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles'
            ORDER BY ordinal_position;
            """
            
            result = supabase.rpc('execute_sql', {'query': structure_sql}).execute()
            
            if result.data:
                print("\nProfiles table structure:")
                for col in result.data:
                    print(f"- {col['column_name']}: {col['data_type']} ", 
                          f"{'NOT NULL' if col['is_nullable'] == 'NO' else ''} ",
                          f"{'PRIMARY KEY' if 'id' in col['column_name'] else ''} "
                          f"{col['has_default']} {col['is_serial']}".strip())
            else:
                print("\nCould not retrieve table structure. The table might not exist or you might not have permission to view it.")
                
        except Exception as e:
            print(f"\nCould not retrieve table structure: {str(e)}")
            
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        raise

if __name__ == "__main__":
    print("Initializing database...")
    check_or_create_profiles_table()
    print("Database initialization complete.")

# Run the script
# python -m scripts.init_db
