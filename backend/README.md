# SDR Backend - Text-First Dating Application

Complete backend implementation for the SDR dating application.

## 🎯 Overview

This is a production-ready backend built with:
- **Node.js + Express + TypeScript**
- **PostgreSQL** with **Prisma ORM**
- **JWT Authentication**
- **Socket.io** for real-time chat
- **Clean Architecture** (Services, Controllers, Routes)

## 📁 Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema with all models
├── src/
│   ├── config/
│   │   ├── database.ts        # Prisma client configuration
│   │   └── env.ts             # Environment configuration
│   ├── controllers/           # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── discovery.controller.ts
│   │   ├── match.controller.ts
│   │   ├── conversation.controller.ts
│   │   ├── message.controller.ts
│   │   ├── block.controller.ts
│   │   └── report.controller.ts
│   ├── services/              # Business logic
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── discovery.service.ts
│   │   ├── match.service.ts
│   │   ├── conversation.service.ts
│   │   ├── message.service.ts
│   │   ├── block.service.ts
│   │   └── report.service.ts
│   ├── routes/                # API routes
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── discovery.routes.ts
│   │   ├── match.routes.ts
│   │   ├── conversation.routes.ts
│   │   ├── message.routes.ts
│   │   ├── block.routes.ts
│   │   ├── report.routes.ts
│   │   └── upload.routes.ts
│   ├── middlewares/           # Express middlewares
│   │   ├── auth.middleware.ts      # JWT authentication
│   │   ├── validation.middleware.ts # Request validation
│   │   ├── rateLimit.middleware.ts # Rate limiting
│   │   └── error.middleware.ts     # Error handling
│   ├── sockets/
│   │   └── chat.socket.ts     # Real-time chat handlers
│   ├── utils/
│   │   └── upload.ts          # File upload (voice messages)
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   ├── app.ts                 # Express app setup
│   └── server.ts              # Server entry point
├── uploads/                   # Voice message storage
├── .env.example              # Environment variables template
├── package.json
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** database
- **npm** or **yarn**

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Configure your `.env` file:**
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://user:password@localhost:5432/sdr_db?schema=public"
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:5173
   STORAGE_TYPE=local
   STORAGE_PATH=./uploads
   ```

4. **Set up the database:**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

   The server will start at `http://localhost:5000`

### Production Build

```bash
npm run build
npm start
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### User Profile
- `GET /api/users/profile/:userId?` - Get user profile (protected)
- `PUT /api/users/profile` - Update profile (protected)
- `POST /api/users/deactivate` - Deactivate account (protected)
- `DELETE /api/users/delete` - Delete account (protected)

### Discovery
- `GET /api/discovery` - Get discoverable users (protected)
- `POST /api/discovery/like` - Like a user (protected)
- `POST /api/discovery/dislike` - Dislike a user (protected)

### Matches
- `GET /api/matches` - Get user matches (protected)

### Conversations
- `GET /api/conversations/:conversationId` - Get conversation details (protected)
- `GET /api/conversations/:conversationId/messages` - Get messages (protected)

### Messages
- `POST /api/messages/text` - Send text message (protected)
- `POST /api/messages/voice` - Send voice message (protected)

### Block & Report
- `POST /api/blocks` - Block a user (protected)
- `DELETE /api/blocks` - Unblock a user (protected)
- `GET /api/blocks` - Get blocked users (protected)
- `POST /api/reports` - Report a user (protected)
- `GET /api/reports` - Get reports (protected)

### Upload
- `POST /api/upload/voice` - Upload voice message file (protected)

## 🔌 Socket.io Events

### Client → Server
- `join:conversation` - Join a conversation room
- `leave:conversation` - Leave a conversation room
- `message:text` - Send text message
- `message:voice` - Send voice message
- `typing:start` - User started typing
- `typing:stop` - User stopped typing

### Server → Client
- `conversation:joined` - Successfully joined conversation
- `message:new` - New message received
- `typing:user` - Another user typing status
- `error` - Error occurred

## 🗄️ Database Models

### User
- Authentication (email, password)
- Profile (name, age, gender, city, description)
- Photo URL
- Account status

### Like
- From/To user relationship
- Like/Dislike flag

### Match
- Two users matched
- Link to conversation

### Conversation
- Two users chatting
- Text message count (for photo reveal)
- Reveal level (0-3)

### Message
- Text or Voice type
- Content/Audio URL
- Timestamp

### Block
- Blocker/Blocked relationship

### Report
- Reporter/Reported relationship
- Reason

## 🔐 Photo Reveal Logic

Photos are progressively revealed based on **text message count** (voice messages don't count):

- **Level 0** (0-9 messages): Fully blurred, black & white
- **Level 1** (10-19 messages): Lightly visible, black & white
- **Level 2** (20-29 messages): Mostly visible, black & white
- **Level 3** (30+ messages): Fully visible, **full color**

The reveal level is automatically calculated and updated in real-time as text messages are sent.

## 🔒 Security Features

- **JWT Authentication** with token expiration
- **bcrypt** password hashing
- **Rate limiting** (100 requests per 15 minutes per IP)
- **Request validation** with express-validator
- **CORS** configuration
- **Error handling** middleware
- **Secure file uploads** (audio only, 10MB limit)

## 🛠️ Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Create new database migration
- `npx prisma generate` - Generate Prisma client

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | **Required** |
| `JWT_SECRET` | Secret for JWT signing | **Required** |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `STORAGE_TYPE` | File storage type | `local` |
| `STORAGE_PATH` | Path for uploads | `./uploads` |

## 🧪 Testing

To test the API, you can use:
- **Postman** or **Insomnia** for REST endpoints
- **Socket.io Client** for real-time testing
- **Prisma Studio** for database inspection

Example registration request:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "age": 25,
    "gender": "male",
    "city": "New York",
    "description": "A long description about myself..."
  }'
```

## 🔄 Development Workflow

1. Make changes to source files in `src/`
2. Server auto-reloads with nodemon
3. Test with your preferred API client
4. Database changes require Prisma migrations
5. Build before deploying to production

## ✅ What's Complete

- ✅ Full TypeScript implementation
- ✅ Clean architecture with separation of concerns
- ✅ Complete authentication system (register/login/JWT)
- ✅ User profile management
- ✅ Discovery system (like/dislike)
- ✅ Matching algorithm
- ✅ Real-time chat with Socket.io
- ✅ Text and voice messages
- ✅ Progressive photo reveal logic
- ✅ Block and report functionality
- ✅ Security middlewares
- ✅ File upload system
- ✅ Error handling
- ✅ Rate limiting
- ✅ Request validation
- ✅ Production-ready build

## 📖 Next Steps

**STEP 1 IS COMPLETE!**

Ready for **STEP 2**: Frontend Web Application

The backend is fully functional and ready to be integrated with the frontend.

## 📄 License

ISC

---

**Backend Status**: ✅ PRODUCTION READY
