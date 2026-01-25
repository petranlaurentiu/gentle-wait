#!/bin/bash
# Script to set up iOS native modules for Gentle Wait
# This helps automate the Xcode project configuration

set -e

echo "🍎 Setting up iOS native modules..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from project root${NC}"
    exit 1
fi

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}❌ Error: Xcode is not installed${NC}"
    echo "Install Xcode from the App Store"
    exit 1
fi

# Check if CocoaPods is installed
if ! command -v pod &> /dev/null; then
    echo -e "${YELLOW}⚠️  CocoaPods not found in PATH${NC}"
    echo "Checking alternate locations..."
    
    POD_PATH="/opt/homebrew/lib/ruby/gems/3.4.0/bin/pod"
    if [ -f "$POD_PATH" ]; then
        echo -e "${GREEN}✓ Found CocoaPods at: $POD_PATH${NC}"
        alias pod="$POD_PATH"
    else
        echo -e "${RED}❌ CocoaPods not installed${NC}"
        echo "Install with: sudo gem install cocoapods"
        exit 1
    fi
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# Check if iOS folder exists
if [ ! -d "ios" ]; then
    echo -e "${YELLOW}⚠️  iOS folder not found. Running expo prebuild...${NC}"
    npx expo prebuild --platform ios
fi

# Check if Swift files exist
SWIFT_FILE="ios/gentlewait/GentleWaitModule.swift"
OBJC_FILE="ios/gentlewait/GentleWaitModule.m"

if [ ! -f "$SWIFT_FILE" ]; then
    echo -e "${RED}❌ $SWIFT_FILE not found${NC}"
    echo "Run: npm run setup-ios (or expo prebuild)"
    exit 1
fi

if [ ! -f "$OBJC_FILE" ]; then
    echo -e "${RED}❌ $OBJC_FILE not found${NC}"
    echo "Run: npm run setup-ios (or expo prebuild)"
    exit 1
fi

echo -e "${GREEN}✓ Swift native files found${NC}"
echo ""

# Run pod install
echo "📦 Installing CocoaPods dependencies..."
cd ios
pod install
cd ..
echo -e "${GREEN}✓ CocoaPods installed${NC}"
echo ""

# Open Xcode
echo "🔨 Opening Xcode..."
open ios/gentlewait.xcworkspace

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📝 MANUAL STEPS REQUIRED IN XCODE:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "1. In Xcode, find the 'gentlewait' folder (blue icon)"
echo "2. Right-click → 'Add Files to gentlewait...'"
echo "3. Navigate to: ios/gentlewait/"
echo "4. Select BOTH files:"
echo "   - GentleWaitModule.swift"
echo "   - GentleWaitModule.m"
echo "5. ✅ Check 'Copy items if needed'"
echo "6. ✅ Check 'Add to targets: gentlewait'"
echo "7. Click 'Add'"
echo ""
echo "8. Build the project (⌘B)"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✓ Setup script complete!${NC}"
echo ""
echo "After adding files in Xcode, run:"
echo "  npm run ios"
echo ""
