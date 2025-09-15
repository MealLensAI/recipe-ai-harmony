#!/usr/bin/env python3
"""
Script to restart the server with SUB_TIME_UNIT=minutes
"""

import os
import subprocess
import sys
import time

def restart_server_with_minutes():
    """Restart the server with minutes time unit"""
    
    print("🔄 Restarting server with SUB_TIME_UNIT=minutes...")
    
    # Set environment variable
    os.environ['SUB_TIME_UNIT'] = 'minutes'
    
    # Kill any existing server
    try:
        subprocess.run(['pkill', '-f', 'python.*app.py'], check=False)
        print("✅ Killed existing server")
    except:
        print("ℹ️  No existing server to kill")
    
    # Wait a moment
    time.sleep(2)
    
    # Start new server with environment variable
    print("🚀 Starting server with SUB_TIME_UNIT=minutes...")
    
    # Change to backend directory
    os.chdir('backend')
    
    # Start server with environment variable
    env = os.environ.copy()
    env['SUB_TIME_UNIT'] = 'minutes'
    
    try:
        subprocess.run([sys.executable, 'app.py'], env=env)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    restart_server_with_minutes()
