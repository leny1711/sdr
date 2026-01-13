import { PrismaClient } from '@prisma/client';

/**
 * Ensure the provided database URL carries a connection_limit parameter.
 * Falls back to a simple string append when URL parsing fails.
 */
const withConnectionLimit = (url: string, limit: number = 5): string => {
  const appendLimitParam = (rawUrl: string) => {
    if (rawUrl.toLowerCase().includes('connection_limit=')) return rawUrl;
    const separator = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${separator}connection_limit=${limit}`;
  };

  try {
    const parsed = new URL(url);
    return appendLimitParam(parsed.toString());
  } catch {
    return appendLimitParam(url);
  }
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: withConnectionLimit(databaseUrl),
    },
  },
});

export default prisma;
