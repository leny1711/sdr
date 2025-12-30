# Quick Start Commands - React Native Android

## ⚡ Fast Setup (3 Steps)

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Start Metro Bundler
```bash
npm start
```
Leave this running in one terminal.

### 3. Build & Run (New Terminal)
```bash
cd mobile
npm run android
```

---

## 🔧 Configuration Required

### Update Backend IP
Edit `mobile/src/config/api.ts`:
```typescript
export const API_URL = 'http://YOUR_IP_ADDRESS:5000/api';
```

Find your IP on Windows:
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.116)

---

## ✅ Verify Device Connection
```bash
adb devices
```
Should show your device.

---

## 🐛 Troubleshooting Commands

### Clean Build
```bash
cd mobile/android
gradlew.bat clean
cd ..
npm run android
```

### Clear Metro Cache
```bash
npm start -- --reset-cache
```

### View Logs
```bash
npx react-native log-android
```

### Restart ADB
```bash
adb kill-server
adb start-server
adb devices
```

---

## 📱 What to Expect

**First Build:** 5-10 minutes (downloads dependencies)  
**Subsequent Builds:** 1-2 minutes  

**You'll see:**
1. ✅ Gradle downloads (first time)
2. ✅ App compiles
3. ✅ App installs on device
4. ✅ Metro loads JS bundle
5. ✅ Login screen appears

---

## 🎯 Ready to Test!

1. Register a new user (all fields required)
2. Login with your credentials
3. Verify authentication works

**Note:** Phone and computer must be on same WiFi network.
