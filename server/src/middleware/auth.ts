import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../lib/auth';
import { unauthorized } from '../lib/errors';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(unauthorized());
  }
  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    next(unauthorized('Sessiya muddati tugagan, qaytadan kiring'));
  }
}
