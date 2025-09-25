#!/usr/bin/env python3
"""
Test the trial display functionality
"""

import os
import sys
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

def main():
    # Load environment variables
    load_dotenv()
    
    # Initialize Supabase client
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        print('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
        sys.exit(1)
    
    supabase = create_client(supabase_url, supabase_key)
    
    try:
        print('🧪 Testing trial display functionality...')
        
        # Import the subscription service
        sys.path.append('./backend')
        from services.subscription_service import SubscriptionService
        
        service = SubscriptionService()
        
        # Get a real user to test with
        profiles_result = supabase.table('profiles').select('id').limit(1).execute()
        if not profiles_result.data:
            print('❌ No users found to test with')
            return
        
        test_user_id = profiles_result.data[0]['id']
        print(f'🧪 Testing with user: {test_user_id[:8]}...')
        
        # Get subscription status
        status_result = service.get_user_subscription_status(test_user_id)
        if status_result['success']:
            data = status_result['data']
            print(f'\n📊 Backend subscription status:')
            print(f'   Has active subscription: {data.get("has_active_subscription", False)}')
            print(f'   Can access app: {data.get("can_access_app", False)}')
            
            if data.get('trial'):
                trial = data['trial']
                print(f'\n⏰ Trial info from backend:')
                print(f'   ID: {trial.get("id", "N/A")[:8]}...')
                print(f'   Start date: {trial.get("start_date")}')
                print(f'   End date: {trial.get("end_date")}')
                print(f'   Is used: {trial.get("is_used")}')
                
                # Calculate remaining time
                try:
                    start_date = datetime.fromisoformat(trial['start_date'].replace('Z', '+00:00'))
                    end_date = datetime.fromisoformat(trial['end_date'].replace('Z', '+00:00'))
                    now = datetime.now()
                    remaining_time = max(0, (end_date - now).total_seconds() * 1000)
                    remaining_hours = int(remaining_time // (1000 * 60 * 60))
                    remaining_minutes = int((remaining_time % (1000 * 60 * 60)) // (1000 * 60))
                    is_expired = remaining_time <= 0 or trial.get('is_used', False)
                    
                    print(f'\n⏱️ Calculated trial time:')
                    print(f'   Remaining time (ms): {remaining_time}')
                    print(f'   Remaining hours: {remaining_hours}')
                    print(f'   Remaining minutes: {remaining_minutes}')
                    print(f'   Is expired: {is_expired}')
                    print(f'   Is active: {not is_expired}')
                    
                    if remaining_hours > 0:
                        formatted_time = f"{remaining_hours}h {remaining_minutes}m remaining"
                    else:
                        formatted_time = f"{remaining_minutes}m remaining"
                    
                    print(f'   Formatted time: {formatted_time}')
                    
                except Exception as e:
                    print(f'   ❌ Error calculating time: {e}')
            
            if data.get('subscription'):
                sub = data['subscription']
                print(f'\n💳 Subscription info:')
                print(f'   Plan name: {sub.get("plan_name")}')
                print(f'   Status: {sub.get("status")}')
                print(f'   Start date: {sub.get("start_date")}')
                print(f'   End date: {sub.get("end_date")}')
        
        print('\n🎉 Trial display test complete!')
        
    except Exception as e:
        print(f'❌ Error during test: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()




