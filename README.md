# SDR - Text-First Dating Application

A Kindle-inspired dating application where users discover profiles through reading, not swiping.

## 🎯 Concept

This is a **text-first dating application** inspired by Kindle/e-ink readers:

- Users discover profiles by **reading long descriptions**
- Profiles are scrollable like book pages
- Photos are **never visible at first**
- Photos are **progressively revealed through conversation**
- Description is PRIMARY, photos are SECONDARY

### Photo Reveal System

Photos unlock through genuine conversation:
- **<10 messages**: Fully blurred, black & white
- **10-19 messages**: Lightly visible, black & white
- **20-29 messages**: Mostly visible, black & white
- **30+ messages**: Fully visible, full color

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Socket.io (Real-time chat)
- bcrypt (Password hashing)

### Frontend (Web)
- React + TypeScript
- Vite
- Web Audio API

### Mobile
- React Native (Expo)
- TypeScript
- Expo Audio/Media APIs

## 📋 Features

- ✅ Email + password authentication (JWT)
- ✅ Long-form profile descriptions
- ✅ Text-first discovery (no swipe)
- ✅ Like/Dislike system
- ✅ Mutual matching
- ✅ Real-time messaging (text + voice)
- ✅ Progressive photo reveal
- ✅ Block/Report users
- ✅ Account management

**NO** Firebase (except push notifications later)  
**NO** Supabase  
**NO** third-party authentication providers

## 🎨 Design Philosophy - Kindle Style

- Off-white/beige backgrounds (#F5F4EF)
- Dark text (#111, #222)
- NO bright colors, cards, shadows, gradients
- Text-first UI with large margins
- Generous line spacing
- One screen = one readable page
- Feels like **reading**, not browsing

## 📁 Project Structure

```
sdr/
├── backend/          # Node.js + Express + Prisma backend
├── frontend/         # React web application
├── mobile/           # Expo mobile app
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ or v20+ (LTS recommended)
- PostgreSQL database
- npm
- Java JDK 17 or 21 (for Android mobile development)
- Expo Go app on your phone (for mobile testing)

### Quick Start

**See [QUICK_START.md](./QUICK_START.md) for quick setup**  
**See [PROJECT_SETUP_WINDOWS.md](./PROJECT_SETUP_WINDOWS.md) for complete Windows guide**

### Backend Setup

See [backend/README.md](./backend/README.md) for detailed instructions.

```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file with database credentials
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Mobile Setup (Expo)

```bash
cd mobile
npm install
cp .env.example .env
# Configure .env with your computer's IP address
npx expo start
```

Then scan the QR code with Expo Go app on your phone.

## 📖 Development Progress

### ✅ STEP 1: Complete Backend - COMPLETE
- ✅ Backend directory structure with clean architecture
- ✅ Node.js + TypeScript setup
- ✅ Express server with Socket.io
- ✅ PostgreSQL + Prisma ORM with complete schema
- ✅ JWT authentication (register/login)
- ✅ User profile management
- ✅ Discovery system (like/dislike)
- ✅ Matching algorithm
- ✅ Real-time chat (text + voice messages)
- ✅ Photo reveal logic (0-3 levels)
- ✅ Block & report functionality
- ✅ Security middlewares (rate limiting, validation)
- ✅ File upload system for voice messages
- ✅ 36+ TypeScript files, 25+ API endpoints
- ✅ Production build verified
- ✅ Comprehensive documentation

**Backend is production-ready!**

### ✅ STEP 2: Frontend Web Application - COMPLETE
- ✅ React + TypeScript + Vite setup
- ✅ Kindle-inspired design system
- ✅ Authentication pages (Login/Register)
- ✅ Protected routes with Auth context
- ✅ Discovery/Reading page (main feature)
- ✅ Matches list page
- ✅ Real-time chat with Socket.io
- ✅ Profile management
- ✅ Progressive photo reveal UI
- ✅ API service layer
- ✅ TypeScript types
- ✅ Production build verified
- ✅ Comprehensive documentation

**Frontend is production-ready!**

### ✅ STEP 3: Mobile App (Expo) - COMPLETE
- ✅ React Native + Expo + TypeScript setup
- ✅ Kindle-inspired mobile design system
- ✅ Authentication screens (Login/Register)
- ✅ React Navigation with Stack & Tab navigators
- ✅ Auth context with Expo Secure Store
- ✅ Discovery/Reading screen (main feature)
- ✅ Matches list screen
- ✅ Real-time chat with Socket.io
- ✅ Profile management screen
- ✅ Progressive photo reveal UI
- ✅ API service layer with Axios
- ✅ Socket.io client integration
- ✅ TypeScript types and interfaces
- ✅ Mobile-optimized UI components
- ✅ Safe area handling
- ✅ Keyboard-aware views
- ✅ Production build verified
- ✅ Comprehensive documentation

**Mobile app is production-ready!**

### 🔄 Next Steps
- STEP 4: Documentation & Finalization

## 🔒 Security & Privacy

- JWT-based authentication
- bcrypt password hashing
- No external auth providers
- CORS configured
- Environment-based secrets
- Block/Report functionality

## 📝 License

ISC

## 👤 Author

SDR Dating Team
