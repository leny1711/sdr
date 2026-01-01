# SDR Mobile App (Expo)

Text-first dating mobile application built with Expo and TypeScript.

## ⚠️ CRITICAL: IP Address Configuration

**BEFORE RUNNING**, you MUST update your computer's IP address in:

### `mobile/src/config/api.ts`
```typescript
export const API_URL = 'http://YOUR_IP:5000/api';
export const SOCKET_URL = 'http://YOUR_IP:5000';
```

### How to Find Your IP:
- **Windows:** `ipconfig` (look for IPv4 Address)
- **Mac/Linux:** `ifconfig` or `ip addr`

### Example:
If your IP is `192.168.1.105`:
```typescript
export const API_URL = 'http://192.168.1.105:5000/api';
export const SOCKET_URL = 'http://192.168.1.105:5000';
```

**⚠️ Important:**
- Android CANNOT use `localhost` - use your actual IP
- Phone and computer MUST be on same WiFi
- If backend logs show no requests, your IP is wrong
- Also update `backend/.env` with `CORS_ORIGIN=http://YOUR_IP:5173`

## Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)
- Expo Go app on your phone (Android or iOS)
- Backend server running (see main project README)

## Quick Start

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure API URL

Edit `src/config/api.ts` and update with your computer's IP address (see section above).

### 3. Start Expo

```bash
npm start
# or
npx expo start
```

### 4. Open on Your Phone

1. Open Expo Go app on your phone
2. Scan the QR code shown in the terminal
3. Wait for the app to load (30-60 seconds first time)

**Important:** Your phone and computer must be on the same WiFi network.

## Available Commands

```bash
# Start Expo dev server
npm start

# Start with cache cleared
npx expo start -c

# Open on Android (if emulator is running)
npm run android

# Open on iOS simulator (macOS only)
npm run ios

# Type checking
npm run type-check
```

## Project Structure

```
mobile/
├── App.tsx              # Root component with AuthProvider
├── app.json            # Expo configuration
├── index.ts            # Entry point
├── assets/             # Images and fonts
└── src/
    ├── config/         # API configuration
    │   └── api.ts      # API URLs (UPDATE YOUR IP HERE!)
    ├── constants/      # Theme and constants
    ├── contexts/       # React contexts
    │   └── AuthContext.tsx  # Authentication context
    ├── navigation/     # Navigation setup
    │   └── index.tsx   # Auth/App navigator switching
    ├── screens/        # Screen components
    │   ├── LoginScreen.tsx
    │   ├── RegisterScreen.tsx
    │   ├── DiscoveryScreen.tsx
    │   ├── MatchesScreen.tsx
    │   ├── ChatScreen.tsx
    │   └── ProfileScreen.tsx
    ├── services/       # API and socket services
    └── types/          # TypeScript type definitions
```

## Features Implemented

### ✅ Complete Features
- **Authentication:** Login/Register with JWT tokens
- **Auto-navigation:** Automatic switch between auth and app screens
- **Persistent login:** Token saved, auto-login on app restart
- **Bottom Tab Navigation:** Discovery, Matches, Profile tabs
- **Discovery:** Browse and like/pass on users
- **Matches:** View your matches
- **Chat:** Real-time messaging with Socket.io
- **Profile:** Edit your profile, logout

### 📱 App Flow
1. **First Launch:** Login or Register screen
2. **After Auth:** Automatically navigate to Discovery tab
3. **Next Launch:** Skip login if token exists, go directly to app

## Technology Stack

- **Expo:** ~54.0.30
- **React:** 19.1.0
- **React Native:** 0.81.5
- **TypeScript:** ~5.9.2
- **React Navigation:** ^7.x with Bottom Tabs
- **Axios:** ^1.13.2
- **Socket.io-client:** ^4.8.3
- **AsyncStorage:** ^2.2.0 (for token storage)

## Navigation Structure

```
NavigationContainer
├── AuthNavigator (when not authenticated)
│   ├── Login
│   └── Register
└── AppNavigator (when authenticated)
    ├── MainTabs (Bottom Tabs)
    │   ├── Discovery
    │   ├── Matches
    │   └── Profile
    └── Chat (Stack Screen - opens from Matches)
```

## Troubleshooting

### Cannot Connect to Backend / Network Request Failed

**This is the most common issue!**

**Solution:**
1. Verify backend is running: `cd backend && npm run dev`
2. Check your IP address hasn't changed: `ipconfig` or `ifconfig`
3. Update `mobile/src/config/api.ts` with correct IP
4. Update `backend/.env` with `CORS_ORIGIN=http://YOUR_IP:5173`
5. Restart backend after changing `.env`
6. Ensure phone and computer on same WiFi
7. Try clearing Expo cache: `npx expo start -c`

### Cannot Connect to Metro

**Solution:**
```bash
npx expo start -c
```

### Expo Go Not Loading

1. Close Expo Go completely
2. Restart Expo server: `npx expo start -c`
3. Scan QR code again

### App Stuck on Login After Successful Auth

This means navigation isn't switching. Check:
1. AuthContext is properly setting both `user` and `token`
2. Backend returned both in the response
3. Try logging out and back in

### Type Errors

```bash
npm run type-check
```

## Development Workflow

1. Start backend server (separate terminal):
   ```bash
   cd backend
   npm run dev
   ```

2. Start Expo:
   ```bash
   cd mobile
   npm start
   ```

3. Make changes to code - they'll hot reload automatically

4. If changes don't appear, shake your phone and press "Reload"

## Building for Production

For production builds, use Expo Application Services (EAS):

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS (requires Apple Developer account)
eas build --platform ios
```

## Testing on Physical Device

**Android:**
1. Install Expo Go from Google Play Store
2. Ensure phone and computer on same WiFi
3. Scan QR code in terminal

**iOS:**
1. Install Expo Go from App Store
2. Ensure phone and computer on same WiFi
3. Scan QR code with Camera app or Expo Go

## Common Issues

### Port Already in Use

Expo will automatically use a different port if 8081 is taken.

### Firewall Blocking Connection

On Windows, you may need to allow Metro Bundler through the firewall:
1. Windows Defender Firewall
2. Allow an app through firewall
3. Allow Node.js on Private networks

### Slow Loading

First load is always slower. Subsequent loads are faster due to caching.

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Documentation](https://reactnative.dev/)
- **Main Project Docs:** See `QUICK_START.md` in project root

## Support

For issues specific to this project, see:
- **Quick Start Guide:** `../QUICK_START.md`
- **Windows Setup:** `../PROJECT_SETUP_WINDOWS.md`
