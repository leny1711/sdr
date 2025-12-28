# SDR Dating Application - Backend

Text-first dating application backend built with Node.js, Express, TypeScript, PostgreSQL, and Prisma.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.io
- **Environment**: dotenv

## Project Structure

```
backend/
├── src/
│   ├── routes/          # API route handlers
│   ├── middleware/      # Custom middleware (auth, validation, etc.)
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   └── server.ts        # Application entry point
├── prisma/              # Database schema and migrations
├── uploads/             # Local file storage (voice messages)
└── dist/                # Compiled JavaScript (generated)
```

## Setup

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from template:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
   - Set your PostgreSQL `DATABASE_URL`
   - Generate a secure `JWT_SECRET`
   - Configure other environment variables as needed

### Database Setup

Database schema and migrations will be set up in STEP 2.

## Development

### Run in development mode:
```bash
npm run dev
```

This starts the server with hot-reload using nodemon and ts-node.

### Build for production:
```bash
npm run build
```

### Run in production mode:
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### API Info
- `GET /api` - API version and info

Additional endpoints will be added in subsequent steps:
- Authentication (STEP 3)
- User profiles (STEP 4)
- Discovery & likes (STEP 5)
- Matching & conversations (STEP 6)
- Real-time chat (STEP 8)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment (development/production) | development |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret key for JWT tokens | - |
| `JWT_EXPIRES_IN` | JWT token expiration | 7d |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:5173 |
| `STORAGE_TYPE` | File storage type (local/s3) | local |
| `STORAGE_PATH` | Local storage path | ./uploads |

## Security

- Passwords are hashed using bcrypt
- JWT-based authentication
- CORS configured for frontend origin
- No Firebase or third-party auth providers
- Environment variables for sensitive data

## Development Status

**STEP 1**: ✅ Backend foundation - COMPLETE
- Backend directory structure created
- Node.js project initialized with TypeScript
- All required dependencies installed
- TypeScript configured
- Express server with Socket.io ready
- Environment variables configured
- Server verified and running without errors

**Next Steps**:
- STEP 2: Database schema & migrations (Prisma)
- STEP 3: Authentication (JWT)
- STEP 4: Profile API
- And more...

## Notes

- NO Firebase (except push notifications in future)
- NO Supabase
- NO third-party authentication providers
- TypeScript strict mode enabled
- Clean, modular architecture
