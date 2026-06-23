import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors';

/** Simple in-memory sliding-window rate limiter, keyed by userId. Sufficient for a
 * single-instance deployment; not meant to replace a real abuse-prevention system. */
export function rateLimit(maxRequests: number, windowMs: number) {
  const hits = new Map<number, number[]>();

  // Drop fully-expired entries periodically so memory doesn't grow unbounded
  // with every distinct user that has ever hit this endpoint.
  const sweepInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of hits) {
      if (timestamps.every((t) => now - t >= windowMs)) hits.delete(key);
    }
  }, windowMs);
  sweepInterval.unref();

  return (req: Request, _res: Response, next: NextFunction) => {
    const key = req.userId;
    if (key == null) return next();

    const now = Date.now();
    const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (timestamps.length >= maxRequests) {
      hits.set(key, timestamps);
      return next(new AppError(429, 'RATE_LIMITED', "Juda tez urinmoqdasiz, biroz kutib qaytadan urining"));
    }
    timestamps.push(now);
    hits.set(key, timestamps);
    next();
  };
}
