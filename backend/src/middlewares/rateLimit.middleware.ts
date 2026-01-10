import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    inFlight: number;
  };
}

const store: RateLimitStore = {};

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;
const CLIENT_ERROR_STATUS = 400;

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const identifier = req.ip || 'unknown';
  const now = Date.now();

  if (!store[identifier] || now > store[identifier].resetTime) {
    store[identifier] = {
      count: 0,
      resetTime: now + WINDOW_MS,
      inFlight: 0,
    };
  }

  const entry = store[identifier];

  entry.inFlight++;

  if (entry.count + entry.inFlight > MAX_REQUESTS) {
    entry.inFlight = Math.max(0, entry.inFlight - 1);
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
    });
    return;
  }

  let handled = false;
  const finalize = () => {
    if (handled) return;
    handled = true;
    if (res.statusCode < CLIENT_ERROR_STATUS) {
      entry.count++;
    }
    entry.inFlight = Math.max(0, entry.inFlight - 1);
  };

  res.once('finish', finalize);
  res.once('close', finalize);

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
