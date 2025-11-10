#!/usr/bin/env python
"""
Quick Python version checker for MealLens AI Backend
Run this to verify your Python version is compatible
"""

import sys
import platform

def check_python_version():
    print("=" * 60)
    print("MealLens AI Backend - Python Version Checker")
    print("=" * 60)
    print()
    
    # Get Python version info
    version_info = sys.version_info
    version_string = f"{version_info.major}.{version_info.minor}.{version_info.micro}"
    
    print(f"Python Version: {version_string}")
    print(f"Python Executable: {sys.executable}")
    print(f"Platform: {platform.platform()}")
    print()
    
    # Check if version is compatible
    is_compatible = False
    status = ""
    
    if version_info.major == 3:
        if version_info.minor == 11:
            is_compatible = True
            status = "✅ PERFECT! Python 3.11 is fully supported."
        elif version_info.minor == 12:
            is_compatible = True
            status = "✅ PERFECT! Python 3.12 is fully supported."
        elif version_info.minor == 10:
            is_compatible = True
            status = "⚠️  Python 3.10 works but 3.11 or 3.12 is recommended."
        elif version_info.minor == 9:
            is_compatible = True
            status = "⚠️  Python 3.9 works but 3.11 or 3.12 is recommended."
        elif version_info.minor == 13:
            is_compatible = False
            status = "❌ ERROR! Python 3.13 is NOT supported (alpha/beta version)."
        elif version_info.minor < 9:
            is_compatible = False
            status = f"❌ ERROR! Python 3.{version_info.minor} is too old. Need 3.9+."
        else:
            is_compatible = False
            status = f"⚠️  Python 3.{version_info.minor} is untested. Use 3.11 or 3.12."
    else:
        is_compatible = False
        status = f"❌ ERROR! Python {version_info.major} is not supported. Need Python 3.11 or 3.12."
    
    print(status)
    print()
    
    if not is_compatible:
        print("=" * 60)
        print("SOLUTION:")
        print("=" * 60)
        print()
        print("1. Download Python 3.11 or 3.12 from:")
        print("   https://www.python.org/downloads/")
        print()
        print("2. Or use a package manager:")
        print("   - Chocolatey: choco install python311")
        print("   - Scoop: scoop install python311")
        print()
        print("3. After installation, create a virtual environment:")
        print("   python -m venv venv")
        print("   venv\\Scripts\\activate")
        print("   pip install -r requirements.txt")
        print()
    else:
        print("=" * 60)
        print("NEXT STEPS:")
        print("=" * 60)
        print()
        print("1. Create virtual environment (if not already done):")
        print("   python -m venv venv")
        print()
        print("2. Activate virtual environment:")
        print("   venv\\Scripts\\activate")
        print()
        print("3. Install dependencies:")
        print("   pip install -r requirements.txt")
        print()
        print("4. Run the backend server:")
        print("   python app.py")
        print()
    
    print("=" * 60)
    
    return is_compatible

if __name__ == "__main__":
    is_compatible = check_python_version()
    sys.exit(0 if is_compatible else 1)
