import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors';

/** Simple in-memory sliding-window rate limiter core, keyed by whatever `keyFn`
 * returns. Sufficient for a single-instance deployment; not meant to replace a
 * real abuse-prevention system. */
function createLimiter<K>(keyFn: (req: Request) => K | null | undefined, maxRequests: number, windowMs: number) {
  const hits = new Map<K, number[]>();

  // Drop fully-expired entries periodically so memory doesn't grow unbounded
  // with every distinct key that has ever hit this endpoint.
  const sweepInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of hits) {
      if (timestamps.every((t) => now - t >= windowMs)) hits.delete(key);
    }
  }, windowMs);
  sweepInterval.unref();

  return (req: Request, _res: Response, next: NextFunction) => {
    const key = keyFn(req);
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

/** Rate limits by authenticated userId — only useful after `requireAuth`. */
export function rateLimit(maxRequests: number, windowMs: number) {
  return createLimiter<number>((req) => req.userId, maxRequests, windowMs);
}

/** Rate limits by client IP — for unauthenticated endpoints (login/signup)
 * where there's no userId yet to key on. Requires `app.set('trust proxy', ...)`
 * (see server/src/index.ts) so `req.ip` reflects the real client behind
 * nginx's X-Forwarded-For instead of every request sharing one IP. */
export function rateLimitByIp(maxRequests: number, windowMs: number) {
  return createLimiter<string>((req) => req.ip, maxRequests, windowMs);
}
