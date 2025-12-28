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
├── frontend/         # React web application (Coming in STEP 9)
├── mobile/           # Expo mobile app (Coming in STEP 10)
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL
- npm or yarn

### Backend Setup

See [backend/README.md](./backend/README.md) for detailed instructions.

```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file
npm run dev
```

## 📖 Development Progress

### ✅ STEP 1: Backend Foundation - COMPLETE
- Backend directory structure
- Node.js + TypeScript setup
- Express server with Socket.io
- Environment configuration
- Server verified running

### 🔄 Next Steps
- STEP 2: Database schema & migrations
- STEP 3: Authentication (JWT)
- STEP 4: Profile API
- STEP 5: Discovery & likes
- STEP 6: Matching & conversations
- STEP 7: Photo reveal logic
- STEP 8: Real-time chat (text + voice)
- STEP 9: Frontend Web (Kindle style)
- STEP 10: Mobile App (Expo)
- STEP 11: Final verification & README

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
