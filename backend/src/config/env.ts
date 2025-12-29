import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  storageType: process.env.STORAGE_TYPE || 'local',
  storagePath: process.env.STORAGE_PATH || './uploads',
};

// Validate required environment variables
if (!config.jwtSecret) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}
