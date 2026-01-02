#!/bin/bash
set -e

# FamilyHub Release Script
# Usage: ./scripts/release.sh [patch|minor|major]
# Default: patch

cd "$(dirname "$0")/.."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 FamilyHub Release Script${NC}"
echo "================================"

# Check for required tools
command -v jq >/dev/null 2>&1 || { echo -e "${RED}Error: jq is required. Install with: brew install jq${NC}"; exit 1; }
command -v gh >/dev/null 2>&1 || { echo -e "${RED}Error: GitHub CLI is required. Install with: brew install gh${NC}"; exit 1; }

# Check if gh is authenticated
if ! gh auth status >/dev/null 2>&1; then
    echo -e "${RED}Error: GitHub CLI not authenticated. Run: gh auth login${NC}"
    exit 1
fi

# Get bump type (default: patch)
BUMP_TYPE=${1:-patch}
if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo -e "${RED}Error: Invalid bump type. Use: patch, minor, or major${NC}"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(jq -r '.version' package.json)
echo -e "Current version: ${YELLOW}$CURRENT_VERSION${NC}"

# Calculate new version
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
case $BUMP_TYPE in
    major)
        NEW_VERSION="$((MAJOR + 1)).0.0"
        ;;
    minor)
        NEW_VERSION="$MAJOR.$((MINOR + 1)).0"
        ;;
    patch)
        NEW_VERSION="$MAJOR.$MINOR.$((PATCH + 1))"
        ;;
esac

echo -e "New version: ${GREEN}$NEW_VERSION${NC}"
echo ""

# Confirm
read -p "Continue with release v$NEW_VERSION? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo -e "${YELLOW}📦 Step 1: Updating versions...${NC}"

# Update package.json version
jq ".version = \"$NEW_VERSION\"" package.json > package.json.tmp && mv package.json.tmp package.json
echo "  ✓ package.json"

# Update Android version
ANDROID_BUILD_GRADLE="android/app/build.gradle"
if [ -f "$ANDROID_BUILD_GRADLE" ]; then
    # Calculate versionCode (e.g., 1.2.3 -> 10203)
    VERSION_CODE=$((MAJOR * 10000 + MINOR * 100 + PATCH + 1))
    
    # Update versionCode and versionName
    sed -i '' "s/versionCode [0-9]*/versionCode $VERSION_CODE/" "$ANDROID_BUILD_GRADLE"
    sed -i '' "s/versionName \"[^\"]*\"/versionName \"$NEW_VERSION\"/" "$ANDROID_BUILD_GRADLE"
    echo "  ✓ Android build.gradle (versionCode: $VERSION_CODE)"
fi

# Update iOS version (if exists)
IOS_PROJECT="ios/App/App.xcodeproj/project.pbxproj"
if [ -f "$IOS_PROJECT" ]; then
    sed -i '' "s/MARKETING_VERSION = [^;]*/MARKETING_VERSION = $NEW_VERSION/" "$IOS_PROJECT"
    sed -i '' "s/CURRENT_PROJECT_VERSION = [^;]*/CURRENT_PROJECT_VERSION = $VERSION_CODE/" "$IOS_PROJECT"
    echo "  ✓ iOS project.pbxproj"
fi

echo ""
echo -e "${YELLOW}🔨 Step 2: Building Nuxt app...${NC}"
pnpm build

echo ""
echo -e "${YELLOW}📱 Step 3: Syncing with Capacitor...${NC}"
npx cap sync android

echo ""
echo -e "${YELLOW}🤖 Step 4: Building Android APK...${NC}"

# Check for keystore
KEYSTORE_PATH="android/familyhub-release.keystore"
if [ ! -f "$KEYSTORE_PATH" ]; then
    echo -e "${RED}Error: Keystore not found at $KEYSTORE_PATH${NC}"
    echo "Create one with:"
    echo "  keytool -genkey -v -keystore android/familyhub-release.keystore -alias familyhub -keyalg RSA -keysize 2048 -validity 10000"
    exit 1
fi

# Build release APK with Java 21
cd android
export JAVA_HOME=$(/usr/libexec/java_home -v 21 2>/dev/null || echo $JAVA_HOME)
./gradlew assembleRelease

# Clean up any existing aligned APK
rm -f app-release-aligned.apk

# Align APK
zipalign -v -p 4 app/build/outputs/apk/release/app-release-unsigned.apk app-release-aligned.apk > /dev/null

# Sign APK
APK_NAME="FamilyHub-v${NEW_VERSION}.apk"
echo -e "${YELLOW}Enter keystore password:${NC}"
read -s KEYSTORE_PASS
apksigner sign --ks familyhub-release.keystore --ks-pass "pass:$KEYSTORE_PASS" --out "$APK_NAME" app-release-aligned.apk

# Cleanup
rm -f app-release-aligned.apk

cd ..

# Move APK to project root
mv "android/$APK_NAME" .
echo -e "  ✓ Built: ${GREEN}$APK_NAME${NC}"

APK_SIZE=$(ls -lh "$APK_NAME" | awk '{print $5}')
echo -e "  📦 Size: $APK_SIZE"

echo ""
echo -e "${YELLOW}📝 Step 5: Committing changes...${NC}"
git add package.json android/app/build.gradle
git commit -m "chore: bump version to $NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

echo ""
echo -e "${YELLOW}🚀 Step 6: Pushing to GitHub...${NC}"
git push origin main
git push origin "v$NEW_VERSION"

echo ""
echo -e "${YELLOW}📦 Step 7: Creating GitHub Release...${NC}"

# Generate release notes from recent commits
PREV_TAG=$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo "")
if [ -n "$PREV_TAG" ]; then
    RELEASE_NOTES=$(git log --pretty=format:"- %s" "$PREV_TAG"..HEAD~1)
else
    RELEASE_NOTES="Initial release"
fi

# Create GitHub release with APK
gh release create "v$NEW_VERSION" \
    --title "FamilyHub v$NEW_VERSION" \
    --notes "## What's Changed

$RELEASE_NOTES

## Downloads

- **Android APK**: Download \`$APK_NAME\` below and install on your Android device
" \
    "$APK_NAME"

echo ""
echo -e "${GREEN}✅ Release v$NEW_VERSION complete!${NC}"
echo ""
echo "Release URL: $(gh release view "v$NEW_VERSION" --json url -q '.url')"
echo ""

# Cleanup local APK (optional - keep for reference)
# rm -f "$APK_NAME"
