#!/usr/bin/env python3
"""
Test script to simulate a frontend payment call to the backend
"""

import requests
import json

def test_payment_success():
    print("🧪 TESTING PAYMENT SUCCESS ENDPOINT")
    print("=" * 50)
    
    # Test data that matches what the frontend sends
    test_data = {
        "user_id": "cd9d8fed-6e82-4831-9890-99c87a2eb8cc",  # From our debug results
        "email": "test@example.com",
        "plan_name": "$2.5 / 1 minute (test)",
        "plan_duration_days": 1,
        "paystack_data": {
            "reference": "test_ref_12345",
            "transaction_id": "test_txn_67890",
            "amount": 2.5,
            "plan": "$2.5 / 1 minute (test)",
            "status": "success",
            "custom_fields": [
                {
                    "display_name": "Name",
                    "variable_name": "name", 
                    "value": "Test User"
                },
                {
                    "display_name": "Plan",
                    "variable_name": "plan",
                    "value": "$2.5 / 1 minute (test)"
                }
            ]
        }
    }
    
    print("📤 Sending payment success request...")
    print(f"📊 Data: {json.dumps(test_data, indent=2)}")
    print("-" * 50)
    
    try:
        # Send request to backend
        response = requests.post(
            "http://127.0.0.1:5001/api/payment/success",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"📥 Response Status: {response.status_code}")
        print(f"📥 Response Headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"📥 Response Data: {json.dumps(response_data, indent=2)}")
        except:
            print(f"📥 Response Text: {response.text}")
            
        if response.status_code == 200:
            print("✅ Payment success endpoint responded successfully!")
        else:
            print(f"❌ Payment success endpoint failed with status {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend. Is it running on http://127.0.0.1:5001?")
    except requests.exceptions.Timeout:
        print("❌ Request timed out")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_payment_success()
