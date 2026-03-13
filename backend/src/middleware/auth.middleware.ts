import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;

    // Try Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Fallback to cookie
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      res.status(401).json({ message: 'Erişim tokenı gereklidir' });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string; email: string };
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch {
    res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token' });
  }
}
