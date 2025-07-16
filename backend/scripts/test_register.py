#!/usr/bin/env python3
"""
Test script for the registration endpoint.
"""
import os
import sys
import json
import requests
from dotenv import load_dotenv

def test_registration(email, password):
    """Test the registration endpoint."""
    url = "http://localhost:5000/register"
    headers = {
        "Content-Type": "application/json"
    }
    data = {
        "email": email,
        "password": password
    }
    
    print(f"Testing registration with email: {email}")
    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)
        print(f"Status Code: {response.status_code}")
        print("Response:")
        print(json.dumps(response.json(), indent=2))
        return response.status_code == 201
    except Exception as e:
        print(f"Error during registration test: {str(e)}")
        return False

def main():
    """Main function to run the test."""
    # Load environment variables
    load_dotenv()
    
    # Test with a new email each time
    import uuid
    test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "TestPassword123!"
    
    print("=== Testing Registration ===")
    success = test_registration(test_email, test_password)
    
    if success:
        print("\nRegistration test passed!")
        print(f"Test email: {test_email}")
        print(f"Test password: {test_password}")
    else:
        print("\nRegistration test failed!")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
