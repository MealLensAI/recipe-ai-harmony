#!/usr/bin/env python3
"""
Test script for the new minutes-based subscription system
"""

import requests
import json
import time
from datetime import datetime

def test_minutes_system():
    """Test the complete subscription flow with minutes"""
    
    print("🍽️ MealLensAI Minutes-Based Subscription Test")
    print("=" * 50)
    print("⏰ Testing with 1-3 minute durations")
    print("=" * 50)
    
    # Test user ID
    test_user_id = "test-user-minutes-123"
    
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
        
        # Step 2: Test different minute durations
        test_durations = [1, 2, 3]  # 1, 2, 3 minutes
        
        for duration in test_durations:
            print(f"\n2️⃣ Testing {duration}-minute subscription...")
            
            # Activate subscription
            response = requests.post(
                'http://localhost:5001/api/payment/success',
                json={
                    'user_id': test_user_id,
                    'email': 'test@example.com',
                    'plan_name': f'${duration} Test Plan',
                    'plan_duration_minutes': duration,
                    'paystack_data': {
                        'reference': f'test_ref_{duration}',
                        'transaction_id': f'test_txn_{duration}',
                        'amount': duration * 2.5,
                        'plan': f'${duration} Test Plan'
                    }
                },
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    print(f"✅ {duration}-minute subscription activated successfully")
                    print(f"   Subscription ends: {result.get('data', {}).get('end_date')}")
                    
                    # Wait for subscription to expire
                    print(f"   ⏳ Waiting {duration + 10} seconds for subscription to expire...")
                    time.sleep(duration * 60 + 10)  # Wait for duration + 10 seconds
                    
                    # Check status after expiry
                    print(f"   🔍 Checking status after {duration}-minute expiry...")
                    status_response = requests.get(
                        f'http://localhost:5001/api/lifecycle/status?user_id={test_user_id}'
                    )
                    
                    if status_response.status_code == 200:
                        status_result = status_response.json()
                        if status_result.get('success'):
                            status = status_result.get('data', {})
                            print(f"   📊 Status after {duration}-minute expiry:")
                            print(f"      User State: {status.get('user_state')}")
                            print(f"      Has Active Subscription: {status.get('has_active_subscription')}")
                            print(f"      Can Access App: {status.get('can_access_app')}")
                            
                            if not status.get('can_access_app'):
                                print(f"   🎉 SUCCESS: User properly blocked after {duration}-minute subscription expiry!")
                            else:
                                print(f"   ⚠️  WARNING: User still has access after {duration}-minute expiry")
                        else:
                            print(f"   ❌ Failed to get status: {status_result.get('error')}")
                    else:
                        print(f"   ❌ HTTP Error {status_response.status_code}")
                else:
                    print(f"❌ Failed to activate {duration}-minute subscription: {result.get('error')}")
            else:
                print(f"❌ HTTP Error {response.status_code}")
            
            # Wait a bit between tests
            if duration < test_durations[-1]:
                print("   ⏸️  Waiting 5 seconds before next test...")
                time.sleep(5)
        
        print("\n🏁 All tests completed!")
        print("\n💡 Summary:")
        print("   - Frontend now uses durationMinutes instead of durationDays")
        print("   - Backend converts minutes to days for database storage")
        print("   - Subscriptions expire in 1-3 minutes for quick testing")
        print("   - UI shows 'Subscription Expired' for paid users")
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server. Make sure it's running on localhost:5001")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_minutes_system()
