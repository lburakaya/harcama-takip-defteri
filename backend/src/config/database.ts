import { PrismaClient } from '@prisma/client';

export const prisma = new (PrismaClient as any)({
  datasourceUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/expense_tracker',
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
