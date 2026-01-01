# 🚀 Quick Start Guide - SDR Application

**For detailed Windows-specific setup instructions, see [PROJECT_SETUP_WINDOWS.md](./PROJECT_SETUP_WINDOWS.md)**

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
# Edit .env with your database credentials
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
cp .env.example .env
# Edit .env with your computer's IP address
npx expo start
```

**Important Steps:**
1. Find your computer's IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`
2. Update `mobile/.env` with your IP:
   ```env
   API_URL=http://YOUR_IP:5000/api
   SOCKET_URL=http://YOUR_IP:5000
   ```
3. Install Expo Go on your phone
4. Scan the QR code shown in terminal
5. Ensure phone and computer are on same WiFi

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
- React Navigation
- Axios + Socket.io-client

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
# Windows: netstat -ano | findstr :5000
# Then: taskkill /PID <PID> /F
```

### Expo Not Connecting
1. Check phone and computer on same WiFi
2. Verify IP address in `mobile/.env`
3. Try tunnel mode: `npx expo start --tunnel`
4. Clear cache: `npx expo start -c`

### Database Error
```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

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
✅ **Mobile:** Expo app with Login/Register screens
✅ **Authentication:** JWT-based auth across all platforms
✅ **Real-time:** Socket.io for messaging
✅ **Database:** PostgreSQL + Prisma ORM

---

## Next Steps

1. Complete mobile app features (Discovery, Matches, Chat)
2. Test production builds
3. Deploy to hosting services

---

**For beginners and Windows users:** Please use [PROJECT_SETUP_WINDOWS.md](./PROJECT_SETUP_WINDOWS.md) for step-by-step instructions with troubleshooting.

