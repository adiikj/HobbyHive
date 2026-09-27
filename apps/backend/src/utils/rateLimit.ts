import type { NextFunction, Request, Response } from "express";
import { ApiError } from "./ApiError.js";

/**
 * In-memory sliding-window rate limiter: at most `limit` hits per key in any `windowMs`. Per process, so with several
 * API instances each gets its own budget (Redis would share it). Idle keys are swept so the map can't grow forever.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();

  const recent = (key: string, now: number) => (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, times] of hits) {
      if (!times.some((t) => now - t < windowMs)) hits.delete(key);
    }
  }, windowMs);
  sweep.unref(); // never keeps the process (or a test run) alive

  return {
    /** Records a hit; false when the key is over its limit (the hit isn't counted then). */
    hit(key: string): boolean {
      const now = Date.now();
      const times = recent(key, now);
      const allowed = times.length < limit;
      if (allowed) times.push(now);
      hits.set(key, times);
      return allowed;
    },
    /** Seconds until the key's oldest counted hit leaves the window. */
    retryAfter(key: string): number {
      const now = Date.now();
      const oldest = recent(key, now)[0] ?? now;
      return Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    },
    reset: () => hits.clear(),
    size: () => hits.size,
  };
}

/**
 * Express middleware around a limiter. `key` picks what's limited, e.g. the account being logged into rather than
 * the IP: behind the frontend's proxy every request can arrive from the same address.
 */
export function rateLimit({
  limit,
  windowMs,
  key,
  message,
}: {
  limit: number;
  windowMs: number;
  key: (req: Request) => string | null | undefined;
  message: string;
}) {
  const limiter = createRateLimiter({ limit, windowMs });
  const middleware = (req: Request, res: Response, next: NextFunction) => {
    const k = key(req);
    if (!k) return next(); // nothing to key on: the controller rejects the request anyway
    if (!limiter.hit(k)) {
      res.setHeader("Retry-After", String(limiter.retryAfter(k)));
      return next(new ApiError(429, message));
    }
    next();
  };
  return Object.assign(middleware, { reset: limiter.reset });
}
