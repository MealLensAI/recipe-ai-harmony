#!/usr/bin/env python3
"""
Quick test script for subscription expiration flow
"""

import requests
import json
import time
from datetime import datetime

def test_subscription_flow():
    """Test the complete subscription flow with 1-minute durations"""
    
    print("🍽️ MealLensAI Subscription Flow Test")
    print("=" * 50)
    print("⏰ Testing with 1-minute durations")
    print("=" * 50)
    
    # Test user ID
    test_user_id = "test-user-123"
    
    try:
        # Step 1: Initialize trial (1 minute)
        print("\n1️⃣ Initializing 1-minute trial...")
        response = requests.post(
            'http://localhost:5001/api/lifecycle/initialize-trial',
            json={'user_id': test_user_id},
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ Trial initialized successfully")
                print(f"   Trial ends: {result.get('trial_end_date')}")
            else:
                print(f"❌ Failed to initialize trial: {result.get('error')}")
                return
        else:
            print(f"❌ HTTP Error {response.status_code}")
            return
        
        # Step 2: Activate subscription (1 minute)
        print("\n2️⃣ Activating 1-minute subscription...")
        response = requests.post(
            'http://localhost:5001/api/lifecycle/activate-subscription',
            json={
                'user_id': test_user_id,
                'duration_days': 1/1440,  # 1 minute
                'plan_name': 'Test Plan'
            },
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ Subscription activated successfully")
                print(f"   Subscription ends: {result.get('subscription_end_date')}")
            else:
                print(f"❌ Failed to activate subscription: {result.get('error')}")
                return
        else:
            print(f"❌ HTTP Error {response.status_code}")
            return
        
        # Step 3: Check status
        print("\n3️⃣ Checking user status...")
        response = requests.get(
            f'http://localhost:5001/api/lifecycle/status?user_id={test_user_id}'
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                status = result.get('data', {})
                print("✅ Current status:")
                print(f"   User State: {status.get('user_state')}")
                print(f"   Has Active Trial: {status.get('has_active_trial')}")
                print(f"   Has Active Subscription: {status.get('has_active_subscription')}")
                print(f"   Can Access App: {status.get('can_access_app')}")
            else:
                print(f"❌ Failed to get status: {result.get('error')}")
        else:
            print(f"❌ HTTP Error {response.status_code}")
        
        # Step 4: Wait and check expiration
        print("\n4️⃣ Waiting 70 seconds for subscription to expire...")
        print("   (Subscription duration: 1 minute)")
        
        for i in range(7):
            print(f"   ⏳ {60 - (i * 10)} seconds remaining...")
            time.sleep(10)
        
        # Step 5: Check status after expiration
        print("\n5️⃣ Checking status after expiration...")
        response = requests.get(
            f'http://localhost:5001/api/lifecycle/status?user_id={test_user_id}'
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                status = result.get('data', {})
                print("✅ Status after expiration:")
                print(f"   User State: {status.get('user_state')}")
                print(f"   Has Active Trial: {status.get('has_active_trial')}")
                print(f"   Has Active Subscription: {status.get('has_active_subscription')}")
                print(f"   Can Access App: {status.get('can_access_app')}")
                
                if not status.get('can_access_app'):
                    print("🎉 SUCCESS: User is properly blocked after subscription expiration!")
                else:
                    print("⚠️  WARNING: User still has access after expiration")
            else:
                print(f"❌ Failed to get status: {result.get('error')}")
        else:
            print(f"❌ HTTP Error {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server. Make sure it's running on localhost:5001")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_subscription_flow()
