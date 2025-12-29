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

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const identifier = req.ip || 'unknown';
  const now = Date.now();

  if (!store[identifier] || now > store[identifier].resetTime) {
    store[identifier] = {
      count: 1,
      resetTime: now + WINDOW_MS,
    };
    return next();
  }

  store[identifier].count++;

  if (store[identifier].count > MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
    });
  }

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
