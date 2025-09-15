#!/usr/bin/env python3
"""
Quick script to enable 1-minute test mode for subscription testing
"""

import requests
import json

def enable_test_mode():
    """Enable 1-minute test mode"""
    try:
        # Enable test mode
        response = requests.post(
            'http://localhost:5001/api/lifecycle/set-test-mode',
            json={'enabled': True},
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ 1-minute test mode ENABLED!")
                print("📝 All subscription durations are now 1 minute")
                print("⏰ You can now test expiration quickly")
                return True
            else:
                print(f"❌ Failed to enable test mode: {result.get('error')}")
        else:
            print(f"❌ HTTP Error {response.status_code}: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server. Make sure it's running on localhost:5001")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    return False

def disable_test_mode():
    """Disable test mode (back to normal durations)"""
    try:
        response = requests.post(
            'http://localhost:5001/api/lifecycle/set-test-mode',
            json={'enabled': False},
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ Test mode DISABLED - back to normal durations")
                return True
            else:
                print(f"❌ Failed to disable test mode: {result.get('error')}")
        else:
            print(f"❌ HTTP Error {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    return False

if __name__ == "__main__":
    print("🍽️ MealLensAI Test Mode Controller")
    print("=" * 40)
    
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "disable":
        disable_test_mode()
    else:
        enable_test_mode()
        
    print("\n💡 Usage:")
    print("  python enable_test_mode.py        # Enable 1-minute test mode")
    print("  python enable_test_mode.py disable # Disable test mode")
