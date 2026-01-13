import { PrismaClient } from '@prisma/client';

const withConnectionLimit = (url: string, limit: number = 5): string => {
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has('connection_limit')) {
      return parsed.toString();
    }
    parsed.searchParams.set('connection_limit', String(limit));
    return parsed.toString();
  } catch {
    if (url.includes('connection_limit=')) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}connection_limit=${limit}`;
  }
};

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: withConnectionLimit(process.env.DATABASE_URL!),
    },
  },
});

export default prisma;
