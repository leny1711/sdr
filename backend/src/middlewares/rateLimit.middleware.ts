import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const identifier = req.ip || 'unknown';
  const now = Date.now();

  if (!store[identifier] || now > store[identifier].resetTime) {
    store[identifier] = {
      count: 0,
      resetTime: now + WINDOW_MS,
    };
  }

  if (store[identifier].count >= MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
    });
    return;
  }

  res.once('finish', () => {
    if (res.statusCode < 400) {
      store[identifier].count++;
    }
  });

  next();
};

setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (now > store[key].resetTime) {
      delete store[key];
    }
  });
}, WINDOW_MS);
