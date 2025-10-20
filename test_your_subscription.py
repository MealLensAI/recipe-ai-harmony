#!/usr/bin/env python3
"""
Test script to check YOUR subscription status with your actual user ID
"""

import requests
import json

def test_your_subscription():
    """Test with your actual user ID from the backend logs"""
    print("🔍 Testing YOUR subscription status...")
    
    # Your actual user ID from the backend logs
    your_user_id = "40093cea-3fe3-4f1e-bac4-38ecf4eaa42c"
    
    try:
        response = requests.get(
            f"http://34.170.200.225:5001/api/subscription/status?user_id={your_user_id}",
            timeout=10
        )
        
        print(f"📡 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ YOUR subscription status: {json.dumps(data, indent=2)}")
            
            if data.get('success') and data.get('data'):
                subscription_data = data['data']
                has_subscription = subscription_data.get('has_active_subscription', False)
                can_access = subscription_data.get('can_access_app', False)
                
                print(f"\n🎯 SUMMARY:")
                print(f"   Has Active Subscription: {has_subscription}")
                print(f"   Can Access App: {can_access}")
                
                if has_subscription:
                    print(f"   ✅ YOU HAVE AN ACTIVE SUBSCRIPTION!")
                    print(f"   ✅ The backend knows you paid!")
                    print(f"   ✅ The frontend should fetch this data!")
                else:
                    print(f"   ❌ No active subscription found")
                    
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

def main():
    print("🧪 YOUR SUBSCRIPTION TEST")
    print("=" * 50)
    print("Testing with your actual user ID from backend logs")
    print("User ID: 40093cea-3fe3-4f1e-bac4-38ecf4eaa42c")
    print("=" * 50)
    
    test_your_subscription()
    
    print("\n" + "=" * 50)
    print("🏁 Test completed!")
    print("\n💡 If this shows you have an active subscription,")
    print("   then the backend is working correctly and the")
    print("   frontend should fetch this data on app load.")

if __name__ == "__main__":
    main()
