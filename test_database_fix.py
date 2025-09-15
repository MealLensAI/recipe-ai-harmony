#!/usr/bin/env python3
"""
Quick test to verify the database schema fix
"""

import requests
import json

def test_database_fix():
    """Test the database schema fix"""
    
    print("🔧 Testing Database Schema Fix")
    print("=" * 40)
    
    # Test user ID
    test_user_id = "4bcf8b4c-b771-49be-8a4c-895cb30ea0b8"  # Your actual user ID
    
    try:
        print("🧪 Testing 1-minute subscription activation...")
        
        response = requests.post(
            'http://localhost:5001/api/payment/success',
            json={
                'user_id': test_user_id,
                'email': 'danielsamueletukudo@gmail.com',
                'plan_name': '$2.5 Weekly',
                'plan_duration_minutes': 1,
                'paystack_data': {
                    'reference': 'test_ref_fix',
                    'transaction_id': 'test_txn_fix',
                    'amount': 2.5,
                    'plan': '$2.5 Weekly'
                }
            },
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ SUCCESS: Subscription activated successfully!")
                print(f"   Subscription ID: {result.get('data', {}).get('subscription_id')}")
                print(f"   Plan Name: {result.get('data', {}).get('plan_name')}")
                print(f"   Duration: {result.get('data', {}).get('duration_minutes')} minutes")
                print(f"   End Date: {result.get('data', {}).get('end_date')}")
                print("\n🎉 Database schema fix is working!")
            else:
                print(f"❌ FAILED: {result.get('error')}")
        else:
            print(f"❌ HTTP Error {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server. Make sure it's running on localhost:5001")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_database_fix()
