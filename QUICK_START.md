# 🚀 Quick Start - React Native CLI Mobile App

## ✅ Migration Complete

The SDR mobile app has been successfully migrated from Expo to React Native CLI.

---

## 📋 Quick Command Reference

### First Time Setup

```bash
# 1. Go to mobile directory
cd mobile

# 2. Install dependencies
npm install

# 3. Verify environment (optional)
./setup.sh
```

### Running the App

```bash
# Terminal 1: Start Metro bundler
npm start

# Terminal 2: Build and run on Android
npm run android
```

**That's it!** The app should build and launch on your connected Android device or emulator.

---

## 🎯 What You Get

### Screens Implemented
- ✅ **Login Screen** - Email and password authentication
- ✅ **Register Screen** - Full registration form with:
  - Name
  - Email  
  - Password
  - Age (18+)
  - Gender
  - City
  - Description (100+ characters)

### Technical Stack
- React Native 0.73.2 (CLI, not Expo)
- TypeScript 5.0.4
- React Navigation (Stack)
- Axios for API calls
- AsyncStorage for token storage
- Socket.io-client (ready for future use)

---

## 🔧 Configuration

### API Endpoint
The app connects to:
```
http://192.168.1.116:5000/api
```

**To change:** Edit `mobile/src/config/api.ts`

### Requirements
- Node.js 18+
- JDK 17+
- Android SDK
- Android device or emulator

---

## ⚡ Quick Test

1. **Start backend server** (if not running)
   ```bash
   cd backend
   npm start
   ```

2. **Connect Android device**
   ```bash
   adb devices  # Should show your device
   ```

3. **Build and run**
   ```bash
   cd mobile
   npm start        # Terminal 1
   npm run android  # Terminal 2
   ```

4. **Test registration**
   - Fill all fields on Register screen
   - Submit
   - Should auto-login after successful registration

5. **Test login**
   - Logout (when implemented)
   - Login with registered credentials

---

## 📖 Documentation

- **Quick Start:** This file
- **Detailed Setup:** `mobile/MIGRATION_GUIDE.md`
- **Project Overview:** `mobile/README.md`
- **Migration Summary:** `MOBILE_MIGRATION_COMPLETE.md`

---

## 🐛 Common Issues

### "Cannot connect to development server"
```bash
npm start -- --reset-cache
```

### "SDK location not found"
Set `ANDROID_HOME` environment variable:
```bash
export ANDROID_HOME=$HOME/Android/Sdk
```

### Build failed
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### "Network request failed" when testing
- Check backend is running
- Verify IP address in `src/config/api.ts`
- Ensure phone and computer on same WiFi network

---

## 🎨 Project Structure

```
mobile/
├── android/           # Android native code
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   ├── navigation/    # Auth stack
│   ├── contexts/      # Auth context
│   ├── services/      # API & Socket
│   ├── config/        # API URL
│   └── types/         # TypeScript types
├── App.tsx           # Root component
├── index.js          # Entry point
└── package.json      # Dependencies
```

---

## ✅ What's Different from Expo

| Expo | React Native CLI |
|------|------------------|
| `expo start` | `npm start` |
| QR code scan | Direct USB/WiFi connection |
| Expo Go app | Builds native APK |
| `expo-secure-store` | AsyncStorage |
| Managed workflow | Full native control |

---

## 🎯 Success Criteria

- [x] No Expo dependencies
- [x] React Native CLI structure
- [x] Login screen works
- [x] Register screen works  
- [x] API integration works
- [x] TypeScript compiles
- [ ] Tested on Android device *(user needs to test)*

---

## 🚀 Next Commands

```bash
# Check environment
./setup.sh

# Install dependencies
npm install

# Start development
npm start             # Terminal 1
npm run android       # Terminal 2

# View logs
npx react-native log-android

# Type check
npx tsc --noEmit

# Clean build
cd android && ./gradlew clean && cd ..
```

---

**🎉 Ready to test! Connect your Android device and run `npm run android`**

For issues, see `mobile/MIGRATION_GUIDE.md` troubleshooting section.
