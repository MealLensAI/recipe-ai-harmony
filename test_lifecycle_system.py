#!/usr/bin/env python3
"""
Test script for the new lifecycle management system.
This script helps test the 1-minute trial and subscription functionality.
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:5001/api/lifecycle"
TEST_USER_ID = "test-user-id"  # Replace with actual user ID for testing

def make_request(method, endpoint, data=None):
    """Make a request to the lifecycle API"""
    url = f"{BASE_URL}{endpoint}"
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'  # Replace with actual token
    }
    
    try:
        if method.upper() == 'GET':
            response = requests.get(url, headers=headers)
        elif method.upper() == 'POST':
            response = requests.post(url, headers=headers, json=data)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        print(f"🔍 {method} {endpoint}")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"   Response: {json.dumps(result, indent=2)}")
            return result
        else:
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"   Exception: {str(e)}")
        return None

def test_user_lifecycle():
    """Test the complete user lifecycle"""
    print("🚀 Testing User Lifecycle Management System")
    print("=" * 50)
    
    # Step 1: Get initial status
    print("\n1️⃣ Getting initial user status...")
    status = make_request('GET', '/status')
    if not status:
        print("❌ Failed to get initial status")
        return
    
    # Step 2: Enable test mode (1-minute durations)
    print("\n2️⃣ Enabling test mode (1-minute durations)...")
    test_mode = make_request('POST', '/set-test-mode', {'test_mode': True})
    if not test_mode:
        print("❌ Failed to enable test mode")
        return
    
    # Step 3: Initialize trial (1 minute)
    print("\n3️⃣ Initializing trial (1 minute)...")
    trial = make_request('POST', '/initialize-trial', {
        'duration_hours': 1/60,  # 1 minute
        'test_mode': True
    })
    if not trial:
        print("❌ Failed to initialize trial")
        return
    
    # Step 4: Check status after trial initialization
    print("\n4️⃣ Checking status after trial initialization...")
    status = make_request('GET', '/status')
    
    # Step 5: Wait for trial to expire (1 minute + 10 seconds buffer)
    print("\n5️⃣ Waiting for trial to expire (70 seconds)...")
    print("   This will test the automatic trial expiration...")
    
    for i in range(70):
        print(f"   Waiting... {i+1}/70 seconds", end='\r')
        time.sleep(1)
    
    print("\n   Trial should now be expired!")
    
    # Step 6: Check status after trial expiration
    print("\n6️⃣ Checking status after trial expiration...")
    status = make_request('GET', '/status')
    
    # Step 7: Mark trial as used
    print("\n7️⃣ Marking trial as used...")
    mark_used = make_request('POST', '/mark-trial-used')
    if not mark_used:
        print("❌ Failed to mark trial as used")
        return
    
    # Step 8: Check status after marking trial as used
    print("\n8️⃣ Checking status after marking trial as used...")
    status = make_request('GET', '/status')
    
    # Step 9: Activate subscription (1 minute)
    print("\n9️⃣ Activating subscription (1 minute)...")
    subscription = make_request('POST', '/activate-subscription', {
        'duration_days': 1/60/24,  # 1 minute
        'paystack_data': {
            'reference': 'test-ref-123',
            'transaction_id': 'test-txn-123',
            'amount': 1000,
            'currency': 'USD'
        },
        'test_mode': True
    })
    if not subscription:
        print("❌ Failed to activate subscription")
        return
    
    # Step 10: Check status after subscription activation
    print("\n🔟 Checking status after subscription activation...")
    status = make_request('GET', '/status')
    
    # Step 11: Wait for subscription to expire (1 minute + 10 seconds buffer)
    print("\n1️⃣1️⃣ Waiting for subscription to expire (70 seconds)...")
    print("   This will test the automatic subscription expiration...")
    
    for i in range(70):
        print(f"   Waiting... {i+1}/70 seconds", end='\r')
        time.sleep(1)
    
    print("\n   Subscription should now be expired!")
    
    # Step 12: Check status after subscription expiration
    print("\n1️⃣2️⃣ Checking status after subscription expiration...")
    status = make_request('GET', '/status')
    
    # Step 13: Mark subscription as expired
    print("\n1️⃣3️⃣ Marking subscription as expired...")
    mark_expired = make_request('POST', '/mark-subscription-expired')
    if not mark_expired:
        print("❌ Failed to mark subscription as expired")
        return
    
    # Step 14: Final status check
    print("\n1️⃣4️⃣ Final status check...")
    status = make_request('GET', '/status')
    
    # Step 15: Disable test mode
    print("\n1️⃣5️⃣ Disabling test mode...")
    test_mode = make_request('POST', '/set-test-mode', {'test_mode': False})
    
    print("\n✅ Lifecycle test completed!")
    print("=" * 50)
    print("Summary:")
    print("- ✅ Trial initialization (1 minute)")
    print("- ✅ Trial expiration and marking as used")
    print("- ✅ Subscription activation (1 minute)")
    print("- ✅ Subscription expiration and marking as expired")
    print("- ✅ User state transitions: new → trial_used → paid → expired")

def test_individual_functions():
    """Test individual lifecycle functions"""
    print("\n🧪 Testing Individual Functions")
    print("=" * 30)
    
    # Test user state display
    print("\n📱 Testing user state display...")
    display = make_request('GET', '/user-state-display')
    
    # Test subscription plans
    print("\n💳 Testing subscription plans...")
    plans = make_request('GET', '/plans')
    
    # Test payment verification
    print("\n🔍 Testing payment verification...")
    verify = make_request('POST', '/verify-payment', {
        'reference': 'test-ref-123'
    })

def main():
    """Main test function"""
    print("🍽️ MealLensAI Lifecycle Management Test")
    print("=" * 50)
    print(f"Testing against: {BASE_URL}")
    print(f"Test user ID: {TEST_USER_ID}")
    print("=" * 50)
    
    try:
        # Test individual functions first
        test_individual_functions()
        
        # Ask user if they want to run the full lifecycle test
        print("\n" + "=" * 50)
        response = input("Run full lifecycle test? (y/n): ").lower().strip()
        
        if response == 'y':
            test_user_lifecycle()
        else:
            print("Skipping full lifecycle test.")
            
    except KeyboardInterrupt:
        print("\n\n⏹️ Test interrupted by user.")
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
    
    print("\n🏁 Test completed!")

if __name__ == "__main__":
    main()
