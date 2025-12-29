import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);

  if (err.message.includes('not found')) {
    return res.status(404).json({
      success: false,
      error: err.message,
    });
  }

  if (err.message.includes('Unauthorized') || err.message.includes('Invalid credentials')) {
    return res.status(401).json({
      success: false,
      error: err.message,
    });
  }

  if (
    err.message.includes('already') ||
    err.message.includes('Cannot') ||
    err.message.includes('Invalid')
  ) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};
