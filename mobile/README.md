# SDR Mobile App - React Native (Expo)

A Kindle-inspired mobile dating application built with React Native and Expo.

## 🎯 Features

- **Kindle-Inspired Design**: Clean, text-first interface with off-white backgrounds and serif fonts
- **Authentication**: User registration and login with JWT tokens
- **Discovery**: Read and discover user profiles like book pages
- **Matches**: View all matched users with photo reveal levels
- **Real-time Chat**: Socket.io powered messaging with typing indicators
- **Profile Management**: View and edit your profile
- **Progressive Photo Reveal**: Photos unlock through genuine conversation

## 🛠️ Tech Stack

- **React Native** with **Expo** ~54.0
- **TypeScript** 5.x
- **React Navigation** 7.x (Native Stack & Bottom Tabs)
- **Axios** for REST API
- **Socket.io Client** for real-time messaging
- **Expo Secure Store** for token storage

## 📋 Prerequisites

- Node.js v18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator
- Backend server running (see `/backend/README.md`)

## 🚀 Installation

1. Install dependencies:
```bash
cd mobile
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your backend API URL
```

3. Start the development server:
```bash
npm start
```

4. Run on your device:
   - Press `i` for iOS Simulator (macOS only)
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on your phone

## 📱 Testing on Physical Device

When testing on a physical device:

1. Make sure your phone and computer are on the same network
2. Find your computer's local IP address:
   - macOS/Linux: `ifconfig | grep inet`
   - Windows: `ipconfig`
3. Update the API URLs in `src/constants/theme.ts`:
   ```typescript
   export const API_URL = 'http://YOUR_IP:5000/api';
   export const SOCKET_URL = 'http://YOUR_IP:5000';
   ```

## 🎨 Design System

### Colors (Kindle-Inspired)
- **Background**: `#F5F4EF` (off-white)
- **Text**: `#111111` (dark)
- **Borders**: `#DDDDDD` (light gray)

### Typography
- **Serif fonts** (Georgia) for body text
- **Sans-serif fonts** for UI elements
- **Line height**: 1.8 for body content

### Layout
- Max content width: 720px
- Screen padding: 20px
- Generous spacing throughout

## 📁 Project Structure

```
mobile/
├── src/
│   ├── screens/          # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── DiscoveryScreen.tsx
│   │   ├── MatchesScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── navigation/       # Navigation setup
│   │   └── index.tsx
│   ├── contexts/         # React Context
│   │   └── AuthContext.tsx
│   ├── services/         # API & Socket.io
│   │   ├── api.ts
│   │   └── socket.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   └── constants/       # Theme & constants
│       └── theme.ts
├── App.tsx              # Root component
├── package.json
└── tsconfig.json
```

## 🔌 API Integration

The mobile app integrates with the backend API:

### REST API Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/discovery` - Get discoverable users
- `POST /api/discovery/like` - Like a user
- `POST /api/discovery/dislike` - Dislike a user
- `GET /api/matches` - Get user matches
- `GET /api/conversations/:id` - Get conversation
- `GET /api/conversations/:id/messages` - Get messages
- `POST /api/messages/text` - Send text message

### Socket.io Events
- `join:conversation` - Join chat room
- `leave:conversation` - Leave chat room
- `message:text` - Send text message
- `message:new` - Receive new message
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `typing:user` - Typing indicator

## 📱 Screens

### Authentication
- **Login**: Email and password login
- **Register**: Full registration with profile details

### Main App
- **Discovery**: Browse and read user profiles
- **Matches**: List of all matched users
- **Chat**: Real-time messaging with typing indicators
- **Profile**: View and edit your profile

## 🔒 Security

- JWT token stored securely in Expo Secure Store
- Automatic token refresh on app restart
- Protected routes with authentication
- Input validation on all forms

## 🚀 Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

See [Expo documentation](https://docs.expo.dev/distribution/building-standalone-apps/) for detailed build instructions.

## 📝 Development Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator (macOS only)
- `npm run web` - Run in web browser (limited functionality)

## 🐛 Troubleshooting

### "Network request failed"
- Ensure backend server is running
- Check API_URL matches your backend URL
- If testing on physical device, use computer's IP address

### "Unable to connect to Socket.io"
- Verify SOCKET_URL is correct
- Check backend Socket.io server is running
- Ensure WebSocket connections are allowed on your network

### iOS Simulator not launching
- Open Xcode and install iOS Simulator
- Run: `xcode-select --install`

### Android Emulator not launching
- Open Android Studio
- Go to AVD Manager and create/start an emulator

## 📄 License

ISC

## 👥 Author

SDR Dating Team
