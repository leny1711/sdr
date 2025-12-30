# React Native CLI Migration - Setup Guide

## Overview

The SDR mobile app has been successfully migrated from Expo to React Native CLI. This document provides step-by-step instructions for setting up, building, and running the app.

## What Changed

### Removed
- ❌ Expo SDK (`expo` package)
- ❌ `expo-secure-store` (replaced with AsyncStorage)
- ❌ `expo-status-bar` (replaced with React Native StatusBar)
- ❌ Expo Go workflow
- ❌ QR code scanning

### Added
- ✅ React Native CLI 0.73.2
- ✅ Android native project structure
- ✅ `@react-native-async-storage/async-storage`
- ✅ Standard React Native build tools

### Updated
- ✅ App.tsx: Uses React Native StatusBar
- ✅ AuthContext: Uses AsyncStorage instead of SecureStore
- ✅ Navigation: Simplified to Auth stack only (Login/Register)
- ✅ API Service: Fixed response handling for backend format
- ✅ Types: Added gender field required by backend

## Prerequisites

Before you begin, ensure you have:

1. **Node.js** 18 or higher
   ```bash
   node --version
   ```

2. **Java Development Kit (JDK)** 17 or higher
   ```bash
   java -version
   ```

3. **Android Studio** with:
   - Android SDK Platform 34
   - Android SDK Build-Tools 34.0.0
   - Android Emulator (if not using physical device)

4. **Environment Variables**
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```

## Setup Instructions

### 1. Install Dependencies

```bash
cd mobile
npm install
```

This will install:
- React Native 0.73.2
- React Navigation
- Axios
- AsyncStorage
- Socket.io-client
- TypeScript and build tools

### 2. Verify Android Setup

Check that ADB is working:
```bash
adb devices
```

If using an emulator, start it from Android Studio AVD Manager first.

### 3. Start Metro Bundler

In the mobile directory:
```bash
npm start
```

Keep this terminal open.

### 4. Build and Run

In a **new terminal**:
```bash
cd mobile
npm run android
```

Or directly:
```bash
npx react-native run-android
```

## What to Expect

### First Build
- The first build will take 5-10 minutes as Gradle downloads dependencies
- Subsequent builds will be much faster (1-2 minutes)

### App Launch
1. The app should install on your device/emulator
2. Metro bundler will load the JavaScript bundle
3. You should see the Login screen

### Testing Registration
Fill in all fields:
- **Name**: Your name
- **Email**: Valid email format
- **Password**: At least 6 characters
- **Age**: 18 or older
- **Gender**: Male, Female, Non-binary, etc.
- **City**: Your city
- **Description**: At least 100 characters

### Testing Login
Use the credentials you just registered with.

## API Configuration

The app connects to:
```
http://192.168.1.116:5000/api
```

**To change this:**
1. Edit `mobile/src/config/api.ts`
2. Update `API_URL` to your backend server address
3. Restart Metro bundler

**Important for physical devices:**
- Your phone and computer must be on the same WiFi network
- Use your computer's local IP address, not `localhost`
- The AndroidManifest.xml has `usesCleartextTraffic="true"` to allow HTTP connections

## Project Structure

```
mobile/
├── android/                    # Android native code
│   ├── app/
│   │   ├── build.gradle       # App-level build configuration
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/com/mobile/
│   │       │   ├── MainActivity.java
│   │       │   └── MainApplication.java
│   │       └── res/           # Android resources
│   ├── build.gradle           # Root build configuration
│   └── gradle.properties      # Gradle settings
├── src/
│   ├── config/
│   │   └── api.ts             # API URL configuration
│   ├── constants/
│   │   └── theme.ts           # Design system colors/typography
│   ├── contexts/
│   │   └── AuthContext.tsx    # Authentication state management
│   ├── navigation/
│   │   └── index.tsx          # Auth stack navigation
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   └── unused/            # Future screens (preserved)
│   ├── services/
│   │   ├── api.ts             # API client (Axios)
│   │   └── socket.ts          # Socket.io client
│   └── types/
│       └── index.ts           # TypeScript type definitions
├── App.tsx                     # Root component
├── index.js                    # Entry point (React Native CLI)
├── babel.config.js
├── metro.config.js
├── tsconfig.json
└── package.json
```

## Troubleshooting

### Metro Bundler Issues

**Error: "Cannot find module"**
```bash
npm start -- --reset-cache
```

**Port already in use:**
```bash
# Kill existing Metro process
npx react-native start --port 8082
```

### Android Build Issues

**Gradle build failed:**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

**"SDK location not found":**
Create `android/local.properties`:
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```
(Replace with your actual Android SDK path)

### Connection Issues

**Cannot connect to backend:**
1. Verify backend is running: `curl http://192.168.1.116:5000/api/health`
2. Check your IP address is correct
3. Ensure phone and computer are on same network
4. Try restarting Metro bundler

**Network request failed:**
- Check `src/config/api.ts` has correct IP
- Verify `AndroidManifest.xml` has `usesCleartextTraffic="true"`
- Check firewall settings on your computer

### Device/Emulator Issues

**ADB device not found:**
```bash
# Restart ADB
adb kill-server
adb start-server
adb devices
```

**Build installs but app crashes:**
```bash
# Check logs
npx react-native log-android
```

## Development Workflow

### Making Code Changes

1. Edit source files in `src/`
2. Save the file
3. Metro bundler will automatically reload (Fast Refresh)
4. For native changes (Android code), rebuild:
   ```bash
   npm run android
   ```

### Debugging

**Open React Native Debugger:**
- On device: Shake the device
- On emulator: Press `Cmd+M` (Mac) or `Ctrl+M` (Windows/Linux)
- Select "Debug"

**View Logs:**
```bash
npx react-native log-android
```

### TypeScript Type Checking

```bash
npx tsc --noEmit
```

## Testing Checklist

- [ ] Backend server is running on `http://192.168.1.116:5000`
- [ ] Android device connected or emulator running (`adb devices` shows device)
- [ ] Metro bundler started (`npm start`)
- [ ] App built and installed (`npm run android`)
- [ ] Login screen displays correctly
- [ ] Can navigate to Register screen
- [ ] Can register a new user with all required fields
- [ ] After registration, app shows authenticated state
- [ ] Can logout and login again with same credentials

## Next Steps

After verifying the basic auth flow works:

1. **Add Main Screens** (from `src/screens/unused/`)
   - DiscoveryScreen
   - MatchesScreen
   - ChatScreen
   - ProfileScreen

2. **Add Bottom Tab Navigation**
   - Uncomment tab navigator in navigation
   - Add tab icons

3. **Enable Socket.io**
   - Test real-time messaging
   - Add typing indicators

4. **Add iOS Support**
   - Run `npx react-native run-ios`
   - Configure iOS build settings

## Key Commands Reference

```bash
# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on Android
npm run android

# Clean and rebuild
cd android && ./gradlew clean && cd .. && npm run android

# TypeScript check
npx tsc --noEmit

# View Android logs
npx react-native log-android

# List connected devices
adb devices

# Clear Metro cache
npm start -- --reset-cache
```

## Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review logs: `npx react-native log-android`
3. Verify prerequisites are installed correctly
4. Ensure backend is running and accessible
5. Check React Native documentation: https://reactnative.dev/

## Migration Notes

This migration maintains backward compatibility with the backend API. No backend changes were required. The web frontend is unchanged.

**Preserved for future use:**
- Socket.io integration
- Chat functionality
- Discovery/Matches screens
- Profile management

**Minimal implementation (Step 1):**
- Login screen
- Register screen
- Auth context with AsyncStorage
- API integration with proper error handling
