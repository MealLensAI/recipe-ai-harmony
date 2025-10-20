#!/usr/bin/env python3
"""
Test payment with a real user ID from the JWT token
"""

import requests
import json

def test_payment_real_user():
    print("🧪 TESTING PAYMENT WITH REAL USER ID")
    print("=" * 50)
    
    # Use the real user ID from the JWT token we saw in the logs
    real_user_id = "cd9d8fed-6e82-4831-9890-99c87a2eb8cc"  # From the JWT token
    
    test_data = {
        "user_id": real_user_id,
        "email": "danielsamueletukudo@gmail.com",
        "plan_name": "$2.5 / 1 minute (test)",
        "plan_duration_days": 1,
        "paystack_data": {
            "reference": "test_ref_real_user_123",
            "transaction_id": "test_txn_real_user_456",
            "amount": 2.5,
            "plan": "$2.5 / 1 minute (test)",
            "status": "success",
            "custom_fields": [
                {
                    "display_name": "Name",
                    "variable_name": "name",
                    "value": "Daniel Samuel"
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
        response = requests.post(
            "http://34.170.200.225:5001/api/payment/success",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"📥 Response Status: {response.status_code}")
        
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
        print("❌ Could not connect to backend. Is it running on http://34.170.200.225:5001?")
    except requests.exceptions.Timeout:
        print("❌ Request timed out")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_payment_real_user()
