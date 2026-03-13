import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error('Error:', err);

  // Zod validation error
  if (err instanceof ZodError) {
    const issues = (err as any).issues || (err as any).errors || [];
    const errors = issues.map((e: any) => ({
      field: e.path?.join('.') || '',
      message: e.message || 'Validation error',
    }));
    res.status(422).json({ message: 'Doğrulama hatası', errors });
    return;
  }

  // Prisma errors (duck-typed check for Prisma 7.x compatibility)
  const errAny = err as any;
  if (errAny.code === 'P2002') {
    const target = (errAny.meta?.target as string[])?.join(', ') || 'alan';
    res.status(409).json({ message: `Bu ${target} zaten kullanılıyor` });
    return;
  }
  if (errAny.code === 'P2025') {
    res.status(404).json({ message: 'Kayıt bulunamadı' });
    return;
  }

  // Default error
  const statusCode = (err as any).statusCode || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'Sunucu hatası'
    : err.message || 'Sunucu hatası';

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
