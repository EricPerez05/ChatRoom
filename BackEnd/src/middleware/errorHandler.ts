import { NextFunction, Request, Response } from 'express';
import { ApiError } from './apiError';

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, 'Route not found'));
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  console.error(message);
  res.status(500).json({ error: 'Internal server error' });
};