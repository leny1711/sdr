# SDR Mobile App - React Native CLI

This is the mobile application for SDR (Text-First Dating), built with React Native CLI for Android.

## Prerequisites

- Node.js 18 or higher
- Java Development Kit (JDK) 17 or higher
- Android Studio with Android SDK
- Android device with USB debugging enabled OR Android emulator

## Setup Instructions

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Android Environment

Make sure you have the following environment variables set:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 3. Start Metro Bundler

In the mobile directory, start Metro:

```bash
npm start
```

### 4. Run on Android

In a new terminal, run:

```bash
npm run android
```

Or directly:

```bash
npx react-native run-android
```

## API Configuration

The app connects to the backend API at:

```
http://192.168.1.116:5000/api
```

This is configured in `src/config/api.ts`. Update this IP address if your backend server is running on a different address.

## Features (Step 1 - Minimal)

Currently implemented:

- **Login Screen**: Email and password authentication
- **Register Screen**: User registration with required fields
  - Name
  - Email
  - Password
  - Age
  - Gender (required by backend)
  - City (required by backend)
  - Description (required by backend)

## Architecture

### Technology Stack

- **React Native**: 0.73.2
- **TypeScript**: 5.0.4
- **React Navigation**: Stack navigation for auth flow
- **Axios**: HTTP client for API calls
- **AsyncStorage**: Local storage for authentication tokens
- **Socket.io-client**: For real-time features (future)

### Project Structure

```
mobile/
├── android/              # Android native code
├── src/
│   ├── config/          # API configuration
│   ├── constants/       # Theme and constants
│   ├── contexts/        # React contexts (Auth)
│   ├── navigation/      # Navigation setup
│   ├── screens/         # Screen components
│   ├── services/        # API and socket services
│   └── types/           # TypeScript type definitions
├── App.tsx              # Root component
├── index.js             # Entry point
└── package.json         # Dependencies
```

## No Expo

This project has been migrated from Expo to React Native CLI for better native control and stability. All Expo dependencies have been removed.

## Troubleshooting

### Metro Bundler Issues

If you encounter Metro cache issues:

```bash
npm start -- --reset-cache
```

### Build Errors

Clean the Android build:

```bash
cd android
./gradlew clean
cd ..
```

### Connection Issues

If the app cannot connect to the backend:

1. Ensure your backend is running on `http://192.168.1.116:5000`
2. Ensure your Android device/emulator is on the same network
3. Update the IP address in `src/config/api.ts` if needed
4. Check that `android:usesCleartextTraffic="true"` is set in AndroidManifest.xml

## Development

### Running on Physical Device

1. Enable USB debugging on your Android device
2. Connect via USB
3. Verify connection: `adb devices`
4. Run: `npm run android`

### Running on Emulator

1. Start Android Studio
2. Open AVD Manager
3. Start an emulator
4. Run: `npm run android`

## Next Steps

Future features to be implemented:
- Discovery screen
- Matches screen
- Chat functionality
- Profile management
- iOS support
