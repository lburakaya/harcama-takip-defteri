import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';

export function rateLimit(maxRequests: number, windowMs: number) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const key = `rate:${ip}:${req.path}`;

      const current = await redis.incr(key);
      if (current === 1) {
        await redis.pexpire(key, windowMs);
      }

      if (current > maxRequests) {
        res.status(429).json({ message: 'Çok fazla istek. Lütfen bekleyin.' });
        return;
      }

      next();
    } catch {
      // If Redis is down, allow the request
      next();
    }
  };
}

// Presets
export const authRateLimit = rateLimit(10, 60000);    // 10 per minute
export const apiRateLimit = rateLimit(100, 60000);     // 100 per minute
