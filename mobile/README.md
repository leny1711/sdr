# SDR Mobile App (Expo)

Text-first dating mobile application built with Expo and TypeScript.

## Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)
- Expo Go app on your phone (Android or iOS)
- Java JDK 17 or 21 (for Android development)

## Quick Start

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure API URL

**Option 1: Edit the config file directly (Recommended for beginners)**

Edit `src/config/api.ts` and update the default URLs:

```typescript
export const API_URL = 'http://YOUR_IP_ADDRESS:5000/api';
export const SOCKET_URL = 'http://YOUR_IP_ADDRESS:5000';
```

**Find your IP address:**
- Windows: Open Command Prompt and type `ipconfig`
- Mac: Open Terminal and type `ifconfig`
- Linux: Open Terminal and type `ip addr`
- Look for "IPv4 Address" (e.g., 192.168.1.100)

**Option 2: Use environment variables (Advanced)**

Create a `.env` file (copy from `.env.example`) and update it:
```env
API_URL=http://YOUR_IP_ADDRESS:5000/api
SOCKET_URL=http://YOUR_IP_ADDRESS:5000
```

Then install and configure `expo-constants` to read environment variables.

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
├── App.tsx              # Root component
├── app.json            # Expo configuration
├── index.ts            # Entry point
├── assets/             # Images and fonts
└── src/
    ├── config/         # API configuration
    ├── constants/      # Theme and constants
    ├── contexts/       # React contexts (Auth)
    ├── navigation/     # Navigation setup
    ├── screens/        # Screen components
    │   ├── LoginScreen.tsx
    │   ├── RegisterScreen.tsx
    │   └── unused/     # Future screens
    ├── services/       # API and socket services
    └── types/          # TypeScript type definitions
```

## Features Implemented

- ✅ Expo SDK 54
- ✅ TypeScript
- ✅ React Navigation (Stack Navigator)
- ✅ Authentication (Login/Register)
- ✅ API integration with backend
- ✅ Socket.io client (for real-time features)
- ✅ Secure token storage (Expo SecureStore)
- ✅ Kindle-inspired UI design

## Technology Stack

- **Expo:** ~54.0.30
- **React:** 19.1.0
- **React Native:** 0.81.5
- **TypeScript:** ~5.9.2
- **React Navigation:** ^7.x
- **Axios:** ^1.13.2
- **Socket.io-client:** ^4.8.3

## Troubleshooting

### Cannot Connect to Metro

**Solution:**
```bash
npx expo start -c
```

### Network Request Failed

1. Check backend is running: `cd backend && npm run dev`
2. Verify IP address in `.env` matches your computer's IP
3. Ensure phone and computer are on same WiFi
4. Try tunnel mode: `npx expo start --tunnel`

### Expo Go Not Loading

1. Close Expo Go completely
2. Restart Expo server: `npx expo start -c`
3. Scan QR code again

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

## Environment Variables

Create a `.env` file with:

```env
# Backend API URL (use your computer's IP address)
API_URL=http://192.168.1.100:5000/api

# Socket.io URL
SOCKET_URL=http://192.168.1.100:5000
```

## API Configuration

API base URL is configured in `src/config/api.ts`. It reads from environment variables.

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

## Support

For issues specific to this project, see the main project documentation or the Windows setup guide: `PROJECT_SETUP_WINDOWS.md`
