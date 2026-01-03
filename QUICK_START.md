# 🚀 Quick Start Guide - SDR Application

**For detailed Windows-specific setup instructions, see [PROJECT_SETUP_WINDOWS.md](./PROJECT_SETUP_WINDOWS.md)**

---

## ⚠️ CRITICAL: IP Address Configuration

**BEFORE RUNNING THE MOBILE APP**, you MUST update the IP address in TWO locations when working on a different network:

### 1. Backend Configuration: `backend/.env`
```env
# Add or update this line with your computer's IP:
CORS_ORIGIN=http://YOUR_IP:5173
```

### 2. Mobile App Configuration: `mobile/src/config/api.ts`
```typescript
export const API_URL = 'http://YOUR_IP:5000';
export const SOCKET_URL = 'http://YOUR_IP:5000';
```

### How to Find Your IP Address:
- **Windows:** Run `ipconfig` in Command Prompt (look for "IPv4 Address")
- **Mac/Linux:** Run `ifconfig` or `ip addr` in Terminal

### Example:
If your computer's IP is `192.168.1.105`, update:
```typescript
// mobile/src/config/api.ts
export const API_URL = 'http://192.168.1.105:5000';
export const SOCKET_URL = 'http://192.168.1.105:5000';
```

### ⚠️ Important Notes:
- **Android devices CANNOT use `localhost` or `127.0.0.1`** - you MUST use your computer's actual IP address
- Both your phone and computer MUST be on the same WiFi network
- If the backend logs show no incoming requests, your API URL is probably wrong

---

## Prerequisites

- Node.js 18+ or 20+ (LTS recommended)
- npm (comes with Node.js)
- Java JDK 17 or 21 (for Android development)
- Expo Go app on your phone

---

## Quick Setup (All Platforms)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials AND your IP for CORS_ORIGIN
npx prisma generate
npx prisma migrate dev
npm run dev
```

Backend will run on: http://localhost:5000

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on: http://localhost:5173

---

### 3. Mobile Setup (Expo)

```bash
cd mobile
npm install
# ⚠️ IMPORTANT: Edit mobile/src/config/api.ts with your IP address (see above)
npx expo start
```

**Important Steps:**
1. Find your computer's IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`
2. Update `mobile/src/config/api.ts` with your IP (as shown in the section above)
3. Update `backend/.env` with `CORS_ORIGIN=http://YOUR_IP:5173`
4. Install Expo Go on your phone
5. Scan the QR code shown in terminal
6. Ensure phone and computer are on same WiFi

---

## Running All Three Components

You need **3 separate terminals**:

**Terminal 1 - Backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend && npm run dev
```

**Terminal 3 - Mobile:**
```bash
cd mobile && npx expo start
```

---

## Technology Stack

### Backend
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- Socket.io (Real-time)
- JWT Authentication

### Frontend (Web)
- React 19 + TypeScript
- Vite
- React Router
- Axios + Socket.io-client

### Mobile
- Expo SDK 54
- React Native 0.81.5 + TypeScript
- React Navigation (with Bottom Tabs)
- Axios + Socket.io-client

---

## Troubleshooting

### Mobile App Not Connecting to Backend

**Symptom:** Mobile app shows errors, backend logs show no incoming requests

**Solution:**
1. Verify your computer's IP address hasn't changed (WiFi networks often rotate IPs)
2. Check `mobile/src/config/api.ts` has the correct IP (not localhost)
3. Check `backend/.env` has `CORS_ORIGIN=http://YOUR_IP:5173`
4. Ensure phone and computer are on the same WiFi network
5. Try restarting the backend server after changing CORS_ORIGIN
6. Try clearing Expo cache: `npx expo start -c`

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
# Windows: netstat -ano | findstr :5000
# Then: taskkill /PID <PID> /F
```

### Expo Not Connecting
1. Check phone and computer on same WiFi
2. Verify IP address in `mobile/src/config/api.ts`
3. Try tunnel mode: `npx expo start --tunnel`
4. Clear cache: `npx expo start -c`

### Database Error
```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

### "Network Error" or "Connection Refused" in Mobile App
- This usually means the IP address in `mobile/src/config/api.ts` is incorrect
- Double-check your IP hasn't changed
- Make sure backend is running
- Try pinging your computer from your phone's browser: `http://YOUR_IP:5000`

---

## Full Documentation

- **Windows Setup:** [PROJECT_SETUP_WINDOWS.md](./PROJECT_SETUP_WINDOWS.md) - Complete Windows guide
- **Project Overview:** [README.md](./README.md) - Project description
- **Backend:** [backend/README.md](./backend/README.md) - Backend documentation
- **Frontend:** [frontend/README.md](./frontend/README.md) - Frontend documentation
- **Mobile:** [mobile/README.md](./mobile/README.md) - Expo mobile documentation

---

## What's Working

✅ **Backend:** Complete API with auth, matching, chat, file uploads
✅ **Frontend:** Full web application with all features
✅ **Mobile:** Full Expo app with Login, Register, Discovery, Matches, Chat, and Profile
✅ **Authentication:** JWT-based auth across all platforms with automatic navigation
✅ **Real-time:** Socket.io for messaging
✅ **Database:** PostgreSQL + Prisma ORM
✅ **Navigation:** Bottom tabs for main app, stack navigation for chat

---

## Next Steps

1. Test production builds
2. Deploy to hosting services
3. Add app icons and splash screens

---

**For beginners and Windows users:** Please use [PROJECT_SETUP_WINDOWS.md](./PROJECT_SETUP_WINDOWS.md) for step-by-step instructions with troubleshooting.
