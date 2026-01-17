# React Native CLI Migration Guide

## Overview

The SDR mobile application has been successfully migrated from **Expo** to **React Native CLI**. All Expo-specific dependencies and APIs have been replaced with React Native equivalents while keeping the application functionality **exactly the same**.

## What Was Changed

### 1. Dependencies Removed
- ❌ `expo` (~54.0.30)
- ❌ `expo-status-bar` (~3.0.9)
- ❌ `expo-secure-store` (^15.0.8)
- ❌ `expo-image-picker` (^15.0.8)

### 2. Dependencies Added
- ✅ `react-native-config` (^1.5.1) - Environment variables
- ✅ `react-native-image-picker` (^7.1.2) - Image picker with camera support
- ✅ `@react-native-community/cli` (^20.1.0) - React Native CLI tools
- ✅ `@react-native/babel-preset` (^0.81.5)
- ✅ `@react-native/metro-config` (^0.81.5)

### 3. API Replacements
- ✅ **expo-status-bar** → `react-native` StatusBar component
- ✅ **expo-image-picker** → `react-native-image-picker` with Android permissions handling
- ✅ **registerRootComponent** → `AppRegistry.registerComponent`

### 4. Native Project Structure
- ✅ **android/** - Full Android native project (package: com.sdr.mobile)
- ✅ **ios/** - Full iOS native project (bundle ID: com.sdr.mobile)

### 5. Configuration Files
- ✅ **babel.config.js** - Babel configuration for React Native
- ✅ **metro.config.js** - Metro bundler configuration
- ✅ **tsconfig.json** - Updated for React Native (no expo extends)
- ✅ **app.json** - Simplified for React Native CLI
- ✅ **index.js** - Standard React Native entry point

### 6. Android Permissions
The following permissions have been added to AndroidManifest.xml:
- `CAMERA` - For taking photos
- `READ_EXTERNAL_STORAGE` - For selecting images (SDK < 33)
- `READ_MEDIA_IMAGES` - For selecting images (SDK >= 33)
- `WRITE_EXTERNAL_STORAGE` - For saving images (SDK < 29)

## Requirements

### Windows/Mac/Linux
1. **Node.js** v18+ or v20+ (LTS recommended)
2. **npm** or **yarn**
3. **Java JDK** 17
4. **Android Studio** (for Android SDK)
   - Android SDK Platform 34
   - Android SDK Build-Tools 34.0.0
   - Android SDK Platform-Tools
   - Android Emulator (optional, if not using physical device)

### Environment Variables
- **ANDROID_HOME** - Path to Android SDK
- **JAVA_HOME** - Path to JDK 17

## Setup Instructions

### Step 1: Install Dependencies

```bash
cd mobile
npm install
```

### Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your computer's IP address:
   ```env
   API_URL=http://YOUR_IP_ADDRESS:5000
   SOCKET_URL=http://YOUR_IP_ADDRESS:5000
   ```

   **How to find your IP:**
   - **Windows**: Run `ipconfig` in Command Prompt (look for IPv4 Address)
   - **Mac/Linux**: Run `ifconfig` or `ip addr` in Terminal

   **Important**: Your phone and computer must be on the same WiFi network!

### Step 3: Android Setup

#### Option A: Build and Install (Recommended)

1. Connect your Android device via USB
2. Enable USB Debugging on your device:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable "USB Debugging"

3. Verify device is connected:
   ```bash
   adb devices
   ```

4. Build and install the app:
   ```bash
   cd mobile
   npm run android
   ```

   This will:
   - Build the Android app
   - Install it on your connected device
   - Start the Metro bundler
   - Launch the app on your device

#### Option B: Manual Build and Install

1. Build the APK:
   ```bash
   cd mobile/android
   ./gradlew assembleDebug
   ```

2. The APK will be located at:
   ```
   mobile/android/app/build/outputs/apk/debug/app-debug.apk
   ```

3. Install on device:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

4. Start the Metro bundler:
   ```bash
   npm start
   ```

5. Launch the app on your device

### Step 4: Run the Backend

In a separate terminal:

```bash
cd backend
npm install
cp .env.example .env
# Configure .env with database credentials
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Step 5: Test the Application

1. **Login/Register** - Test user authentication
2. **Image Upload** - Test camera and gallery image picker
3. **Discovery** - Test profile browsing
4. **Chat** - Test real-time messaging
5. **Profile Management** - Test profile editing

## Troubleshooting

### Build Errors

#### "SDK location not found"
Set `ANDROID_HOME` environment variable:
```bash
# Windows
setx ANDROID_HOME "C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk"

# Mac/Linux
export ANDROID_HOME=$HOME/Library/Android/sdk  # or /home/YOUR_USERNAME/Android/Sdk
```

#### "Could not resolve com.android.tools.build:gradle"
This is a network issue accessing dl.google.com. Try:
1. Check your internet connection
2. Use a VPN if dl.google.com is blocked in your region
3. Configure a mirror repository in `android/build.gradle`

#### "Execution failed for task ':app:installDebug'"
- Ensure device is connected: `adb devices`
- Ensure USB debugging is enabled
- Try: `adb kill-server && adb start-server`

### Runtime Errors

#### "Network request failed"
- Verify backend is running on port 5000
- Check `.env` file has correct IP address
- Ensure phone and computer are on same WiFi network
- Check firewall isn't blocking port 5000

#### "Camera permission denied"
- Grant camera permission in Settings → Apps → SDR → Permissions

#### "Unable to load script"
- Ensure Metro bundler is running: `npm start`
- Clear Metro cache: `npm start -- --reset-cache`
- Reload app: Shake device → Reload

## Verification Checklist

- [ ] Dependencies installed successfully (`npm install`)
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] Android build completes successfully (`./gradlew assembleDebug`)
- [ ] App installs on physical device
- [ ] App launches without crashes
- [ ] Login/Register flow works
- [ ] Image picker opens (both camera and gallery)
- [ ] Profile photo uploads successfully
- [ ] Navigation works correctly
- [ ] Chat messages send/receive in real-time
- [ ] All screens render correctly

## Key Differences from Expo

### Development Workflow

**Expo:**
- Simple: `npx expo start` → Scan QR code
- No native code management needed
- OTA updates built-in

**React Native CLI:**
- More control: `npm run android` → USB connection required
- Direct access to native code
- Manual app deployment (Google Play Store, etc.)

### Native Modules

**Expo:**
- Limited to Expo SDK modules
- Some modules require custom dev client

**React Native CLI:**
- Full access to all native modules
- Can add any Android/iOS library
- More flexibility, more complexity

### Permissions

**Expo:**
- Permissions handled automatically
- Permission requests in app.json

**React Native CLI:**
- Manual permission configuration in AndroidManifest.xml and Info.plist
- Runtime permission requests in code

## File Changes Summary

### Created
- `mobile/android/` - Android native project
- `mobile/ios/` - iOS native project
- `mobile/babel.config.js` - Babel config
- `mobile/metro.config.js` - Metro config
- `mobile/index.js` - RN entry point
- `mobile/src/types/react-native-config.d.ts` - Type definitions

### Modified
- `mobile/App.tsx` - StatusBar import changed
- `mobile/package.json` - Dependencies updated
- `mobile/tsconfig.json` - Expo extends removed
- `mobile/app.json` - Simplified config
- `mobile/.gitignore` - RN-specific ignores
- `mobile/src/config/api.ts` - Uses react-native-config
- `mobile/src/screens/RegisterScreen.tsx` - Image picker replaced
- `mobile/src/screens/ProfileScreen.tsx` - Image picker replaced

### Removed
- `mobile/index.ts` → Renamed to `index.js`
- Expo-specific configurations

## What Stays the Same

✅ **All application logic** - No changes to business logic
✅ **All screens and UI** - Identical user interface
✅ **Navigation** - Same React Navigation setup
✅ **State management** - Same AuthContext, MatchFeedbackContext
✅ **API calls** - Same API service layer
✅ **Socket.io** - Same real-time messaging
✅ **TypeScript** - Same type definitions
✅ **Backend** - Completely unchanged
✅ **Frontend web** - Completely unchanged

## Support

If you encounter any issues during the migration:

1. **Check this guide** for troubleshooting steps
2. **Review the git diff** to see exactly what changed
3. **Check React Native docs** at https://reactnative.dev/docs/getting-started
4. **Verify environment setup** - Android SDK, Java, etc.

## Success Criteria

✅ Migration is complete when:
1. App builds successfully with `npm run android`
2. App installs and runs on physical Android device via USB
3. All features work identically to the Expo version
4. No crashes or errors in console
5. Image picker works for both camera and gallery
6. Real-time chat works
7. All navigation flows work correctly

---

**Migration completed on**: 2026-01-17  
**Migrated from**: Expo SDK 54  
**Migrated to**: React Native CLI 0.81.5  
**Package name**: com.sdr.mobile  
**Application name**: SDR
