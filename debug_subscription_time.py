#!/usr/bin/env python3
"""
Debug script to check what's actually stored in the database
"""

import requests
import json
from datetime import datetime

def debug_subscription_time():
    """Debug the subscription time calculation"""
    
    print("🔍 Debugging Subscription Time")
    print("=" * 40)
    
    # Test user ID
    test_user_id = "4bcf8b4c-b771-49be-8a4c-895cb30ea0b8"
    
    try:
        print("📊 Getting subscription status...")
        
        response = requests.get(
            f'http://localhost:5001/api/subscription/status?user_id={test_user_id}'
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                data = result.get('data', {})
                subscription = data.get('subscription')
                
                if subscription:
                    print("✅ Subscription found:")
                    print(f"   Start Date: {subscription.get('start_date')}")
                    print(f"   End Date: {subscription.get('end_date')}")
                    print(f"   Remaining Days: {subscription.get('remaining_days')}")
                    print(f"   Remaining Hours: {subscription.get('remaining_hours')}")
                    print(f"   Remaining Minutes: {subscription.get('remaining_minutes')}")
                    print(f"   Status: {subscription.get('status')}")
                    
                    # Calculate the actual time difference
                    if subscription.get('end_date'):
                        end_date = datetime.fromisoformat(subscription['end_date'].replace('Z', '+00:00'))
                        now = datetime.now(end_date.tzinfo)
                        diff = end_date - now
                        
                        print(f"\n🕐 Actual Time Calculation:")
                        print(f"   Now: {now}")
                        print(f"   End: {end_date}")
                        print(f"   Difference: {diff}")
                        print(f"   Total seconds: {diff.total_seconds()}")
                        print(f"   Total minutes: {diff.total_seconds() / 60}")
                        print(f"   Total hours: {diff.total_seconds() / 3600}")
                else:
                    print("❌ No subscription found")
            else:
                print(f"❌ Failed to get status: {result.get('error')}")
        else:
            print(f"❌ HTTP Error {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server. Make sure it's running on localhost:5001")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    debug_subscription_time()
