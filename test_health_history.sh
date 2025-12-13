#!/bin/bash
# Quick test script to verify health_history endpoint is available
# Run this AFTER restarting your backend server

echo "Testing /api/health_history endpoint..."
echo ""

# Test if endpoint exists (will get 401 but that means it exists)
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api/health_history)

if [ "$response" == "401" ]; then
    echo "✅ SUCCESS: Route is registered! (401 = auth required, route exists)"
    echo "The endpoint is working, it just requires authentication."
elif [ "$response" == "404" ]; then
    echo "❌ FAILED: Route not found (404)"
    echo "Make sure you restarted the backend server after adding the route."
else
    echo "Response code: $response"
    echo "Endpoint responded, check if it's working correctly."
fi

