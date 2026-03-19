import { NextFunction, Request, Response } from 'express';

export const authPlaceholder = (req: Request, _res: Response, next: NextFunction) => {
  const rawUserId = req.header('x-user-id');

  if (typeof rawUserId === 'string' && rawUserId.trim().length > 0) {
    req.user = { id: rawUserId.trim() };
  }

  next();
};