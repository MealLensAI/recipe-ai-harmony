#!/usr/bin/env python3
"""
Test script to check what user IDs look like in the database
"""

import requests
import json

def test_with_real_user_id():
    """Test with a real UUID format user ID"""
    print("🔍 Testing with real UUID format...")
    
    # Test with a proper UUID format
    test_uuid = "123e4567-e89b-12d3-a456-426614174000"  # Valid UUID format
    
    try:
        response = requests.get(
            f"http://34.170.200.225:5001/api/subscription/status?user_id={test_uuid}",
            timeout=10
        )
        
        print(f"📡 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success with UUID: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Error with UUID: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

def test_payment_with_uuid():
    """Test payment with UUID format"""
    print("\n🔍 Testing payment with UUID format...")
    
    test_payment_data = {
        "user_id": "123e4567-e89b-12d3-a456-426614174000",  # Valid UUID
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
            f"http://34.170.200.225:5001/api/payment/success",
            json=test_payment_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"📡 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Payment success with UUID: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Payment error with UUID: {response.text}")
            
    except Exception as e:
        print(f"❌ Payment request failed: {e}")

def main():
    print("🧪 USER ID FORMAT TEST")
    print("=" * 40)
    
    test_with_real_user_id()
    test_payment_with_uuid()
    
    print("\n" + "=" * 40)
    print("🏁 Test completed!")
    print("\n💡 The issue is that the backend expects UUID format user IDs")
    print("   but the frontend might be sending simple strings.")

if __name__ == "__main__":
    main()
