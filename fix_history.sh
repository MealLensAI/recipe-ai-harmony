#!/bin/bash

# Script to display the SQL needed to fix the detection history issue

echo "════════════════════════════════════════════════════════════════════════════════"
echo "                       DETECTION HISTORY FIX"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "📋 ISSUE:"
echo "   Detection history is not being saved because RPC functions are missing."
echo ""
echo "🔧 FIX:"
echo "   1. Go to your Supabase Dashboard: https://supabase.com/dashboard"
echo "   2. Select your project"
echo "   3. Navigate to SQL Editor (in the left sidebar)"
echo "   4. Click 'New Query'"
echo "   5. Copy the SQL below and paste it into the editor"
echo "   6. Click 'Run' (or press Ctrl/Cmd + Enter)"
echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo "                    SQL TO COPY AND PASTE:"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

cat backend/scripts/020_create_detection_history_functions.sql

echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo "✅ After running this SQL, your detection history will start working!"
echo "════════════════════════════════════════════════════════════════════════════════"

