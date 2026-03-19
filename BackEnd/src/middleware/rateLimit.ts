import { NextFunction, Request, Response } from 'express';
import { ApiError } from './apiError';

interface RateWindow {
  count: number;
  resetAt: number;
}

const windows = new Map<string, RateWindow>();

export const createWriteRateLimiter = (maxRequestsPerMinute: number) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const key = `${req.ip}:${req.path}`;

    const current = windows.get(key);
    if (!current || now > current.resetAt) {
      windows.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (current.count >= maxRequestsPerMinute) {
      next(new ApiError(429, 'Rate limit exceeded for write requests'));
      return;
    }

    current.count += 1;
    windows.set(key, current);
    next();
  };
};