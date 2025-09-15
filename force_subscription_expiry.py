#!/usr/bin/env python3
"""
Script to force subscription expiry for testing the blocking UI
"""

import requests
import json
from datetime import datetime, timedelta

def force_subscription_expiry():
    """Force a subscription to expire immediately for testing"""
    
    print("🍽️ MealLensAI Force Subscription Expiry Test")
    print("=" * 50)
    
    # Test user ID (replace with your actual user ID)
    test_user_id = "ec1db3aa-ff0b-4ed3-aa16-3e2d028c116b"  # From your error message
    
    try:
        # Step 1: Check current status
        print("\n1️⃣ Checking current subscription status...")
        response = requests.get(
            f'http://localhost:5001/api/lifecycle/status?user_id={test_user_id}'
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                status = result.get('data', {})
                print("✅ Current status:")
                print(f"   User State: {status.get('user_state')}")
                print(f"   Has Active Subscription: {status.get('has_active_subscription')}")
                print(f"   Can Access App: {status.get('can_access_app')}")
                
                if status.get('has_active_subscription'):
                    print("\n2️⃣ Forcing subscription to expire...")
                    
                    # Mark subscription as expired
                    response = requests.post(
                        'http://localhost:5001/api/lifecycle/mark-subscription-expired',
                        json={'user_id': test_user_id},
                        headers={'Content-Type': 'application/json'}
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        if result.get('success'):
                            print("✅ Subscription marked as expired!")
                        else:
                            print(f"❌ Failed to mark subscription as expired: {result.get('error')}")
                    else:
                        print(f"❌ HTTP Error {response.status_code}")
                else:
                    print("ℹ️  User doesn't have an active subscription to expire")
            else:
                print(f"❌ Failed to get status: {result.get('error')}")
        else:
            print(f"❌ HTTP Error {response.status_code}")
            
        # Step 3: Check status after forcing expiry
        print("\n3️⃣ Checking status after forcing expiry...")
        response = requests.get(
            f'http://localhost:5001/api/lifecycle/status?user_id={test_user_id}'
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                status = result.get('data', {})
                print("✅ Status after forcing expiry:")
                print(f"   User State: {status.get('user_state')}")
                print(f"   Has Active Subscription: {status.get('has_active_subscription')}")
                print(f"   Can Access App: {status.get('can_access_app')}")
                
                if not status.get('can_access_app'):
                    print("🎉 SUCCESS: User is now blocked!")
                    print("\n💡 Now refresh your frontend to see the blocking UI")
                else:
                    print("⚠️  WARNING: User still has access")
            else:
                print(f"❌ Failed to get status: {result.get('error')}")
        else:
            print(f"❌ HTTP Error {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server. Make sure it's running on localhost:5001")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    force_subscription_expiry()
