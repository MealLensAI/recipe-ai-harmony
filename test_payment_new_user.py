#!/usr/bin/env python3
"""
Test payment activation with a different user who doesn't have an active subscription
"""

import os
import sys
sys.path.append('backend')

from backend.services.subscription_service import SubscriptionService
import json

def test_payment_new_user():
    print("🧪 TESTING PAYMENT WITH NEW USER")
    print("=" * 50)
    
    # Use a different user ID from our debug results (one without active subscription)
    test_user_id = "9243f945-35fa-4501-b4d6-f38f272ffe20"  # danielsamueletukudo@gmail.com
    
    print(f"Testing with user ID: {test_user_id}")
    
    # Create subscription service
    try:
        subscription_service = SubscriptionService()
        print("✅ SubscriptionService created")
    except Exception as e:
        print(f"❌ Failed to create SubscriptionService: {e}")
        return
    
    # Test 1: Check current subscription status
    print("\n📋 CHECKING CURRENT STATUS:")
    print("-" * 30)
    try:
        status = subscription_service.get_user_subscription_status(test_user_id)
        print(f"Current status: {json.dumps(status, indent=2)}")
    except Exception as e:
        print(f"❌ Error checking status: {e}")
    
    # Test 2: Try to activate subscription
    print("\n💳 TESTING SUBSCRIPTION ACTIVATION:")
    print("-" * 30)
    try:
        duration_days = 1  # 1 day
        
        paystack_data = {
            'reference': 'test_ref_new_user_123',
            'transaction_id': 'test_txn_new_user_456',
            'amount': 2.5,
            'status': 'success'
        }
        
        print(f"Attempting to activate subscription for {duration_days} days...")
        result = subscription_service.activate_subscription_for_days(
            user_id=test_user_id,
            duration_days=duration_days,
            paystack_data=paystack_data
        )
        
        print("Activation result:")
        print(json.dumps(result, indent=2))
        
        if result.get('success'):
            print("✅ Subscription activation succeeded!")
        else:
            print(f"❌ Subscription activation failed: {result.get('error')}")
            
    except Exception as e:
        print(f"❌ Error during activation: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 3: Check status again after activation
    print("\n📋 CHECKING STATUS AFTER ACTIVATION:")
    print("-" * 30)
    try:
        status = subscription_service.get_user_subscription_status(test_user_id)
        print(f"Status after activation: {json.dumps(status, indent=2)}")
        
        if status.get('success') and status.get('data', {}).get('has_active_subscription'):
            print("✅ User now has active subscription!")
        else:
            print("❌ User still doesn't have active subscription")
            
    except Exception as e:
        print(f"❌ Error checking status after activation: {e}")

if __name__ == "__main__":
    # Set environment variables
    os.environ['SUPABASE_URL'] = 'https://pklqumlzpklzroafmtrs.supabase.co'
    os.environ['SUPABASE_SERVICE_ROLE_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHF1bWx6cGtsenJvYWZtdHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjExNzE1MiwiZXhwIjoyMDY3NjkzMTUyfQ.nyH5xb6O6E0NCSnycw9AM7r3kfhs1LDrmeTiSsVODO8'
    
    test_payment_new_user()
