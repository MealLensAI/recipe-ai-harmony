#!/usr/bin/env python3
"""
Test script to check subscription with a real user from your database
"""

import requests
import json

def test_with_real_user():
    """Test with a real user ID from your database"""
    print("🔍 Testing with real user from database...")
    
    # First, let's try to get a real user ID by testing the auth endpoint
    try:
        # Test login to get a real user ID
        login_data = {
            "email": "test@example.com",  # Use your actual email
            "password": "testpassword"    # Use your actual password
        }
        
        print("🔄 Attempting login to get real user ID...")
        response = requests.post(
            "http://127.0.0.1:5001/api/login",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"📡 Login response status: {response.status_code}")
        
        if response.status_code == 200:
            login_result = response.json()
            print(f"✅ Login successful: {json.dumps(login_result, indent=2)}")
            
            # Extract user ID from login response
            if 'data' in login_result and 'user' in login_result['data']:
                user_id = login_result['data']['user'].get('id')
                if user_id:
                    print(f"🎯 Found user ID: {user_id}")
                    
                    # Test subscription status with real user ID
                    test_subscription_status(user_id)
                    return
                    
        print(f"❌ Login failed: {response.text}")
        
    except Exception as e:
        print(f"❌ Login request failed: {e}")

def test_subscription_status(user_id):
    """Test subscription status with real user ID"""
    print(f"\n🔍 Testing subscription status for user: {user_id}")
    
    try:
        response = requests.get(
            f"http://127.0.0.1:5001/api/subscription/status?user_id={user_id}",
            timeout=10
        )
        
        print(f"📡 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Subscription status: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

def test_payment_with_real_user(user_id):
    """Test payment with real user ID"""
    print(f"\n🔍 Testing payment for user: {user_id}")
    
    test_payment_data = {
        "user_id": user_id,
        "email": "test@example.com",
        "plan_name": "Premium Plan",
        "plan_duration_days": 7,
        "paystack_data": {
            "reference": "test-ref-123",
            "transaction_id": "test-txn-123",
            "amount": 1000,
            "plan": "Premium Plan",
            "status": "success"
        }
    }
    
    try:
        response = requests.post(
            f"http://127.0.0.1:5001/api/payment/success",
            json=test_payment_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"📡 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Payment success: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Payment error: {response.text}")
            
    except Exception as e:
        print(f"❌ Payment request failed: {e}")

def main():
    print("🧪 REAL USER TEST")
    print("=" * 40)
    print("This will test with a real user from your database")
    print("Make sure you have a user account in your system")
    print("=" * 40)
    
    test_with_real_user()
    
    print("\n" + "=" * 40)
    print("🏁 Test completed!")
    print("\n💡 If login failed, make sure:")
    print("1. You have a user account in your database")
    print("2. The user exists in the 'profiles' table")
    print("3. The user ID is in UUID format")

if __name__ == "__main__":
    main()
