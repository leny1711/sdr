# PROJECT SETUP & RUN GUIDE (WINDOWS)

Complete guide to set up and run the SDR (Text-First Dating) application on Windows 10/11.

---

## TABLE OF CONTENTS

- [SECTION A - REQUIRED SOFTWARE (GLOBAL)](#section-a---required-software-global)
- [SECTION B - PROJECT INSTALLATION](#section-b---project-installation)
- [SECTION C - RUN COMMANDS](#section-c---run-commands)
- [SECTION D - COMMON ERRORS & FIXES](#section-d---common-errors--fixes)
- [SECTION E - FINAL CHECKLIST](#section-e---final-checklist)

---

## SECTION A - REQUIRED SOFTWARE (GLOBAL)

### 1. Node.js (REQUIRED)

**Version Required:** v18.x or v20.x (Recommended: v20.x LTS)

**Download:** https://nodejs.org/

**Installation:**
1. Download the Windows Installer (.msi) for your system
2. Run the installer
3. Accept all defaults (including npm package manager)
4. Restart your terminal/command prompt after installation

**Verify Installation:**
```bash
node --version
# Should show: v20.x.x

npm --version
# Should show: 10.x.x
```

---

### 2. Java Development Kit (JDK) (REQUIRED for Android)

**Version Required:** JDK 17 or JDK 21

**Why Needed:** Required for building and running Android apps with Expo

**Download:** https://adoptium.net/ (Temurin JDK)

**Installation:**
1. Download Temurin JDK 17 or 21 for Windows
2. Run the installer
3. **IMPORTANT:** Check "Set JAVA_HOME variable" during installation
4. Complete the installation
5. Restart your terminal

**Verify Installation:**
```bash
java -version
# Should show: openjdk version "17.x.x" or "21.x.x"
```

**Manual JAVA_HOME Setup (if not set automatically):**
1. Open "Environment Variables" (Search in Windows Start)
2. Under "System Variables", click "New"
3. Variable name: `JAVA_HOME`
4. Variable value: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot` (or your installation path)
5. Click OK
6. Restart your terminal

---

### 3. Android Studio (OPTIONAL for Expo)

**Status:** NOT required for basic Expo development

**When Needed:**
- Only if you want to run the app on an Android emulator on your PC
- You can develop without this by using a physical Android device with Expo Go

**If You Want an Emulator:**
1. Download Android Studio from https://developer.android.com/studio
2. Install Android Studio
3. Open Android Studio
4. Go to Tools > Device Manager
5. Create a new Virtual Device
6. Select a device (e.g., Pixel 5)
7. Download a system image (e.g., API 33)
8. Finish setup

---

### 4. Expo Go App (REQUIRED for Mobile Testing)

**Platform:** Android or iOS smartphone

**Download:**
- **Android:** https://play.google.com/store/apps/details?id=host.exp.exponent
- **iOS:** https://apps.apple.com/app/expo-go/id982107779

**Installation:**
1. Open Google Play Store or App Store on your phone
2. Search for "Expo Go"
3. Install the app
4. Open the app (you can create an account or skip)

**IMPORTANT:** Your phone and computer must be on the same WiFi network

---

### 5. Git (OPTIONAL but recommended)

**Download:** https://git-scm.com/download/win

**Installation:**
1. Download Git for Windows
2. Run installer with default options
3. Restart terminal

---

## SECTION B - PROJECT INSTALLATION

### Prerequisites Check

Before starting, verify you have:
- [x] Node.js installed (v18+ or v20+)
- [x] npm installed (comes with Node.js)
- [x] Java JDK installed (JDK 17 or 21)
- [x] Expo Go installed on your phone
- [x] Your phone and computer on the same WiFi network

---

### Step 1: Clone or Download the Project

**Option 1: Using Git**
```bash
git clone <repository-url>
cd sdr
```

**Option 2: Download ZIP**
1. Download the project ZIP file
2. Extract it to a folder (e.g., `C:\Projects\sdr`)
3. Open Command Prompt or PowerShell
4. Navigate to the folder:
```bash
cd C:\Projects\sdr
```

---

### Step 2: Install Backend Dependencies

**Required Node Version:** v18+

**Directory:** `backend/`

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# This will install all required packages including:
# - Express (web server)
# - Prisma (database ORM)
# - Socket.io (real-time communication)
# - bcrypt (password hashing)
# - jsonwebtoken (authentication)
# - And more...
```

**Expected Time:** 1-2 minutes

**Environment File:**
```bash
# Copy the example environment file
copy .env.example .env

# Edit .env file with your settings
notepad .env
```

**Required Variables in `.env`:**
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/sdr_db?schema=public"

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS (for web frontend)
CORS_ORIGIN=http://localhost:5173

# File Storage
STORAGE_TYPE=local
STORAGE_PATH=./uploads
```

**Database Setup:**
```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed the database
npm run seed
```

---

### Step 3: Install Frontend Dependencies

**Required Node Version:** v18+

**Directory:** `frontend/`

```bash
# Navigate to frontend folder (from project root)
cd ..\frontend

# Or if you're in backend:
cd ..\frontend

# Install dependencies
npm install

# This will install:
# - React 19
# - Vite (build tool)
# - TypeScript
# - React Router
# - Axios (HTTP client)
# - Socket.io-client
# - And more...
```

**Expected Time:** 1-2 minutes

**Environment File:**
Frontend doesn't require a `.env` file, but you can create one if needed for custom API URLs.

---

### Step 4: Install Mobile (Expo) Dependencies

**Required Node Version:** v18+

**Directory:** `mobile/`

```bash
# Navigate to mobile folder (from project root)
cd ..\mobile

# Or if you're in frontend:
cd ..\mobile

# Install dependencies
npm install

# This will install:
# - Expo SDK
# - React Native
# - React Navigation
# - Axios
# - Socket.io-client
# - Expo SecureStore
# - And more...
```

**Expected Time:** 2-3 minutes

**Environment File:**
```bash
# Copy the example environment file
copy .env.example .env

# Edit .env file
notepad .env
```

**Required Variables in `.env`:**
```env
# Backend API URL
# IMPORTANT: Replace with your computer's IP address
# To find your IP on Windows: Open Command Prompt and type: ipconfig
# Look for "IPv4 Address" under your WiFi adapter
API_URL=http://192.168.1.100:5000/api

# Socket.io URL
SOCKET_URL=http://192.168.1.100:5000
```

**How to Find Your IP Address:**
1. Open Command Prompt
2. Type: `ipconfig`
3. Look for "Wireless LAN adapter Wi-Fi" section
4. Find "IPv4 Address" (e.g., 192.168.1.100)
5. Use this IP in your `.env` file

---

## SECTION C - RUN COMMANDS

### Running the Complete Application

You need **3 separate terminal windows** (Command Prompt or PowerShell):

---

### Terminal 1: Backend Server

```bash
# Navigate to backend folder
cd C:\Projects\sdr\backend

# Start development server
npm run dev
```

**Expected Output:**
```
Server running on port 5000
Database connected
```

**URL:** http://localhost:5000

**Keep this terminal open**

---

### Terminal 2: Frontend (Web)

```bash
# Navigate to frontend folder
cd C:\Projects\sdr\frontend

# Start development server
npm run dev
```

**Expected Output:**
```
VITE v7.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.100:5173/
```

**URL:** http://localhost:5173

**Keep this terminal open**

---

### Terminal 3: Mobile (Expo)

```bash
# Navigate to mobile folder
cd C:\Projects\sdr\mobile

# Start Expo development server
npx expo start
```

**Expected Output:**
```
› Metro waiting on exp://192.168.1.100:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
› Press ? │ show all commands
```

**What to Do:**
1. Open Expo Go app on your phone
2. Scan the QR code shown in the terminal
3. Wait for the app to load (may take 30-60 seconds first time)
4. The app will open automatically

**Alternative - Connect to Android Emulator:**
```bash
# If you have Android Studio emulator running
npx expo start --android
```

**Keep this terminal open**

---

### Quick Command Summary

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

**Mobile:**
```bash
cd mobile
npx expo start
```

---

## SECTION D - COMMON ERRORS & FIXES

### Error 1: Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Cause:** Another application is using port 5000, 5173, or 8081

**Fix:**

**Option 1: Stop the other application**
```bash
# Find what's using the port
netstat -ano | findstr :5000

# You'll see output like:
# TCP    0.0.0.0:5000     0.0.0.0:0      LISTENING       12345

# Kill the process (replace 12345 with actual PID)
taskkill /PID 12345 /F
```

**Option 2: Change the port**

For backend, edit `.env`:
```env
PORT=5001
```

For frontend, update `vite.config.ts` or run:
```bash
npm run dev -- --port 3000
```

For Expo, it will automatically find an available port.

---

### Error 2: Expo Not Starting

**Error Message:**
```
'expo' is not recognized as an internal or external command
```

**Fix:**
```bash
# Use npx to run expo
npx expo start

# Or install expo-cli globally (not required but optional)
npm install -g expo-cli
```

---

### Error 3: Android Device Not Connecting

**Symptoms:**
- QR code scans but app doesn't load
- "Network request failed" error
- "Cannot connect to Metro" error

**Fix:**

**1. Check WiFi:**
- Ensure your phone and computer are on the same WiFi network
- Some WiFi routers isolate devices - try a mobile hotspot

**2. Verify IP Address:**
```bash
# On Windows Command Prompt
ipconfig

# Find your IPv4 Address and update mobile/.env
```

**3. Disable Firewall Temporarily:**
- Windows Firewall might block Metro bundler
- Go to Windows Defender Firewall > Turn Windows Defender Firewall on or off
- Turn off for Private networks (temporarily)
- Try connecting again
- Remember to turn it back on

**4. Use Tunnel Mode:**
```bash
# In mobile folder
npx expo start --tunnel
```
This uses ngrok to create a tunnel (slower but works through any network)

---

### Error 4: Metro Cache Issues

**Error Message:**
```
Error: Unable to resolve module
```

**Fix:**
```bash
# In mobile folder
npx expo start -c
# or
npx expo start --clear
```

This clears the Metro bundler cache.

---

### Error 5: Database Connection Error

**Error Message:**
```
PrismaClientInitializationError: Can't reach database server
```

**Fix:**

**1. Ensure PostgreSQL is running:**
- Open Services (Win + R, type `services.msc`)
- Find "postgresql-x64-xx" service
- Right-click > Start

**2. Check DATABASE_URL in backend/.env:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/sdr_db?schema=public"
```

**3. Run migrations:**
```bash
cd backend
npx prisma migrate dev
```

---

### Error 6: Java Version Error

**Error Message:**
```
Could not find Java
```

**Fix:**

**1. Install JDK 17 or 21** (see Section A)

**2. Set JAVA_HOME:**
```bash
# Check if JAVA_HOME is set
echo %JAVA_HOME%

# If empty, set it manually:
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot"

# Restart terminal and try again
```

---

### Error 7: npm Install Fails

**Error Message:**
```
npm ERR! code EACCES
npm ERR! syscall access
```

**Fix:**

**1. Run as Administrator:**
- Right-click Command Prompt
- Select "Run as administrator"
- Try `npm install` again

**2. Clear npm cache:**
```bash
npm cache clean --force
npm install
```

**3. Delete node_modules and try again:**
```bash
rmdir /s node_modules
del package-lock.json
npm install
```

---

### Error 8: "Cannot GET /api/..." Error

**Symptoms:**
- Frontend or mobile app shows 404 errors
- API endpoints not found

**Fix:**

**1. Ensure backend is running:**
```bash
cd backend
npm run dev
```

**2. Check API URL in mobile/.env:**
```env
# Use your computer's IP, not localhost
API_URL=http://192.168.1.100:5000/api
```

**3. Check CORS settings in backend/.env:**
```env
# Allow all origins for development
CORS_ORIGIN=*
```

---

### Error 9: Expo Go Not Loading App

**Symptoms:**
- QR code scans successfully
- Expo Go opens but shows blank screen or error

**Fix:**

**1. Restart Expo server:**
- Press Ctrl+C in the terminal
- Run `npx expo start -c` (clears cache)

**2. Restart Expo Go app:**
- Close Expo Go completely
- Reopen and scan QR code again

**3. Check Metro bundler logs:**
- Look at the terminal where `expo start` is running
- Look for error messages

---

## SECTION E - FINAL CHECKLIST

### Installation Verification

Run through this checklist to ensure everything is installed correctly:

**Global Software:**
- [ ] Node.js installed and verified (`node --version` shows v18+ or v20+)
- [ ] npm installed and verified (`npm --version` shows 10.x)
- [ ] Java JDK installed and verified (`java -version` shows JDK 17 or 21)
- [ ] JAVA_HOME environment variable is set
- [ ] Expo Go app installed on your phone

**Project Setup:**
- [ ] Backend dependencies installed (`node_modules` folder exists in `backend/`)
- [ ] Frontend dependencies installed (`node_modules` folder exists in `frontend/`)
- [ ] Mobile dependencies installed (`node_modules` folder exists in `mobile/`)
- [ ] Backend `.env` file created and configured
- [ ] Mobile `.env` file created with correct IP address
- [ ] Database is running (PostgreSQL)
- [ ] Database migrations completed (`npx prisma migrate dev`)

---

### Running Verification

Verify that all three parts of the application work:

**Backend (Terminal 1):**
- [ ] Backend server starts without errors
- [ ] Shows "Server running on port 5000"
- [ ] No error messages in terminal
- [ ] Can access http://localhost:5000 in browser (shows "Cannot GET /")

**Frontend (Terminal 2):**
- [ ] Frontend dev server starts without errors
- [ ] Shows Vite dev server URL
- [ ] Can access http://localhost:5173 in browser
- [ ] Login page loads correctly

**Mobile (Terminal 3):**
- [ ] Expo server starts without errors
- [ ] QR code is displayed
- [ ] Can scan QR code with Expo Go
- [ ] Mobile app loads on phone
- [ ] Login/Register screens are visible

---

### Functionality Verification

Test the basic functionality:

**Backend API:**
- [ ] Backend responds to health check
- [ ] Database connection works

**Frontend Web:**
- [ ] Register page loads
- [ ] Can create a new account
- [ ] Can log in with created account
- [ ] Dashboard/discovery page loads after login

**Mobile App:**
- [ ] Register screen loads
- [ ] Can create a new account
- [ ] Can log in with created account
- [ ] Dashboard/discovery screen loads after login

---

### Network Verification

For mobile app to work properly:

- [ ] Computer and phone are on the same WiFi network
- [ ] IP address in `mobile/.env` matches computer's IPv4 address
- [ ] Windows Firewall allows connections (or is temporarily disabled)
- [ ] Backend server is accessible from mobile app
- [ ] Can register/login from mobile app

---

### Success Criteria

**✅ Everything is working correctly if:**

1. **Backend running:** Terminal shows "Server running on port 5000"
2. **Frontend running:** Browser at http://localhost:5173 shows login page
3. **Mobile running:** Expo Go on phone shows the app with login screen
4. **Can register:** Can create new account from web or mobile
5. **Can login:** Can log in with credentials from web or mobile
6. **Real-time works:** Changes in one client reflect in others (when implemented)

---

### Next Steps After Setup

Once everything is verified:

1. **Development Workflow:**
   - Edit code in your code editor (VS Code recommended)
   - Changes will hot-reload automatically
   - Backend requires restart for some changes

2. **Testing on Device:**
   - Use Expo Go for quick testing
   - For production builds, use `eas build` (Expo Application Services)

3. **Troubleshooting:**
   - Check all terminals for error messages
   - Verify .env files have correct values
   - Ensure all services are running
   - Check firewall settings if connection issues

4. **Documentation:**
   - Backend API documentation: `backend/README.md`
   - Frontend documentation: `frontend/README.md`
   - Mobile documentation: `mobile/README.md`

---

## Quick Reference Commands

**First Time Setup:**
```bash
# Backend
cd backend
npm install
copy .env.example .env
notepad .env
npx prisma generate
npx prisma migrate dev

# Frontend
cd ..\frontend
npm install

# Mobile
cd ..\mobile
npm install
copy .env.example .env
notepad .env
```

**Daily Development:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Mobile
cd mobile
npx expo start
```

**Troubleshooting:**
```bash
# Clear caches
cd mobile
npx expo start -c

cd backend
rmdir /s node_modules
npm install

# Check services
node --version
npm --version
java -version
ipconfig
```

---

## Support

If you encounter issues not covered in this guide:

1. Check the error message carefully
2. Look in Section D (Common Errors & Fixes)
3. Check that all prerequisites are installed
4. Verify your .env files have correct values
5. Try restarting all services
6. Check project-specific README files

---

**🎉 You're ready to develop! Happy coding!**
