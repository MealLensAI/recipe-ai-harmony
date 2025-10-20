#!/usr/bin/env python3
"""
Test script to check subscription data in backend
Run this to verify if subscriptions are being stored and fetched properly
"""

import requests
import json
import os
from datetime import datetime

# Backend URL
BACKEND_URL = "http://34.170.200.225:5001"

def test_backend_connection():
    """Test if backend is running"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=5)
        print(f"✅ Backend connection: {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ Backend connection failed: {e}")
        return False

def test_subscription_status_endpoint():
    """Test the subscription status endpoint"""
    print("\n🔍 Testing subscription status endpoint...")
    
    # Test with a sample user ID
    test_user_id = "test-user-123"
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/subscription/status?user_id={test_user_id}",
            timeout=10
        )
        
        print(f"📡 Response status: {response.status_code}")
        print(f"📡 Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Subscription status response: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Error response: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

def test_payment_success_endpoint():
    """Test the payment success endpoint"""
    print("\n🔍 Testing payment success endpoint...")
    
    test_payment_data = {
        "user_id": "test-user-123",
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
            f"{BACKEND_URL}/api/payment/success",
            json=test_payment_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"📡 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Payment success response: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Error response: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

def test_subscription_plans():
    """Test getting subscription plans"""
    print("\n🔍 Testing subscription plans endpoint...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/subscription/plans", timeout=10)
        
        print(f"📡 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Subscription plans: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Error response: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

def test_database_connection():
    """Test if we can connect to the database directly"""
    print("\n🔍 Testing database connection...")
    
    try:
        # Try to get subscription plans which should hit the database
        response = requests.get(f"{BACKEND_URL}/api/subscription/plans", timeout=10)
        
        if response.status_code == 200:
            print("✅ Database connection appears to be working")
        else:
            print(f"❌ Database connection issue: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Database test failed: {e}")

def main():
    """Run all tests"""
    print("🧪 SUBSCRIPTION BACKEND TEST SCRIPT")
    print("=" * 50)
    
    # Test 1: Backend connection
    if not test_backend_connection():
        print("\n❌ Backend is not running. Please start your backend server first.")
        return
    
    # Test 2: Database connection
    test_database_connection()
    
    # Test 3: Subscription plans
    test_subscription_plans()
    
    # Test 4: Payment success endpoint
    test_payment_success_endpoint()
    
    # Test 5: Subscription status endpoint
    test_subscription_status_endpoint()
    
    print("\n" + "=" * 50)
    print("🏁 Test completed!")
    print("\n📋 Next steps:")
    print("1. Check if backend is running on http://34.170.200.225:5001")
    print("2. Check if Supabase connection is working")
    print("3. Check if subscription data is being stored in database")
    print("4. Check if frontend is calling the correct endpoints")

if __name__ == "__main__":
    main()
