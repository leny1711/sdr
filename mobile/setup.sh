#!/bin/bash

# SDR Mobile App - React Native CLI Setup Script
# This script helps verify your environment is ready for development

set -e

echo "======================================"
echo "SDR Mobile - Environment Check"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Found: $NODE_VERSION"
    
    # Check if version is 18+
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo -e "${YELLOW}⚠${NC}  Warning: Node.js 18+ is recommended (you have $NODE_VERSION)"
    fi
else
    echo -e "${RED}✗${NC} Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} Found: v$NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi

# Check Java
echo -n "Checking Java... "
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    echo -e "${GREEN}✓${NC} Found: $JAVA_VERSION"
else
    echo -e "${RED}✗${NC} Java not found. Please install JDK 17+"
    exit 1
fi

# Check ANDROID_HOME
echo -n "Checking ANDROID_HOME... "
if [ -z "$ANDROID_HOME" ]; then
    echo -e "${RED}✗${NC} ANDROID_HOME not set"
    echo "  Please set ANDROID_HOME environment variable:"
    echo "  export ANDROID_HOME=\$HOME/Android/Sdk"
    exit 1
else
    echo -e "${GREEN}✓${NC} $ANDROID_HOME"
fi

# Check adb
echo -n "Checking adb... "
if command -v adb &> /dev/null; then
    echo -e "${GREEN}✓${NC} Found"
else
    echo -e "${RED}✗${NC} adb not found. Check ANDROID_HOME/platform-tools is in PATH"
    exit 1
fi

# Check for connected devices
echo -n "Checking Android devices... "
DEVICES=$(adb devices | grep -v "List of devices" | grep -v "^$" | wc -l)
if [ "$DEVICES" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} $DEVICES device(s) connected"
    adb devices
else
    echo -e "${YELLOW}⚠${NC}  No devices connected"
    echo "  Please connect an Android device or start an emulator"
fi

echo ""
echo "======================================"
echo "Installing Dependencies"
echo "======================================"
echo ""

# Install npm packages
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
else
    echo -e "${GREEN}✓${NC} node_modules already exists"
fi

echo ""
echo "======================================"
echo "Environment Ready!"
echo "======================================"
echo ""
echo "Next steps:"
echo "  1. Start Metro bundler:"
echo "     ${GREEN}npm start${NC}"
echo ""
echo "  2. In a new terminal, run:"
echo "     ${GREEN}npm run android${NC}"
echo ""
echo "  3. Update API URL in src/config/api.ts if needed"
echo "     Current: http://192.168.1.116:5000/api"
echo ""
echo "For detailed instructions, see MIGRATION_GUIDE.md"
echo ""
