# SDR Frontend - Text-First Dating Application

Kindle-inspired web application for the SDR dating platform.

## 🎯 Overview

This is a React + TypeScript + Vite frontend that provides a reading-first dating experience with:
- **Kindle-style design** with off-white backgrounds and serif fonts
- **Text-first discovery** - read profiles like books
- **Progressive photo reveal** - photos unlock through conversation
- **Real-time chat** with Socket.io
- **Clean, minimal UI** focused on reading and connection

## 🛠️ Tech Stack

- **React** 19.x
- **TypeScript** 5.x
- **Vite** 7.x - Fast build tool
- **React Router** 7.x - Client-side routing
- **Axios** - HTTP client
- **Socket.io Client** - Real-time messaging

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **Backend server** running (see `../backend/README.md`)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The app will start at `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

## 🎨 Design Philosophy - Kindle Style

The UI is inspired by e-readers like Kindle with off-white backgrounds, serif fonts, and text-first experience.

## 📱 Features

- Authentication (login/register)
- Discovery/reading interface
- Matches list with reveal levels
- Real-time chat with Socket.io
- Profile management
- Progressive photo reveal tracking

## ✅ Status

**Frontend Status**: ✅ COMPLETE & PRODUCTION READY
