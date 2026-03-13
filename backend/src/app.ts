import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { prisma } from './config/database';
import { redis } from './config/redis';
import { initBuckets } from './config/minio';
import { errorMiddleware } from './middleware/error.middleware';
import { apiRateLimit } from './middleware/rateLimit.middleware';
import { getRealTime } from './services/time.service';

// Route modules
import authRoutes from './modules/auth/auth.routes';
import expenseRoutes from './modules/expenses/expenses.routes';
import budgetRoutes from './modules/budgets/budgets.routes';
import documentRoutes from './modules/documents/documents.routes';
import analysisRoutes from './modules/analysis/analysis.routes';
import reportRoutes from './modules/reports/reports.routes';
import userRoutes from './modules/users/users.routes';

const app = express();

// ─── MIDDLEWARE ──────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── HEALTH CHECK ───────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── TIME ENDPOINT ──────────────────────────────────────
app.get('/api/v1/time', async (_req, res) => {
  try {
    const time = await getRealTime();
    res.json(time);
  } catch {
    res.status(500).json({ message: 'Zaman bilgisi alınamadı' });
  }
});

// ─── API ROUTES ─────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/expenses', apiRateLimit, expenseRoutes);
app.use('/api/v1/budgets', apiRateLimit, budgetRoutes);
app.use('/api/v1/documents', apiRateLimit, documentRoutes);
app.use('/api/v1/analysis', apiRateLimit, analysisRoutes);
app.use('/api/v1/reports', apiRateLimit, reportRoutes);
app.use('/api/v1/users', apiRateLimit, userRoutes);

// ─── ERROR HANDLER ──────────────────────────────────────
app.use(errorMiddleware);

// ─── START SERVER ───────────────────────────────────────
async function start() {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ PostgreSQL connected');

    // Connect to Redis
    await redis.connect();

    // Init MinIO buckets
    await initBuckets();

    app.listen(env.PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${env.PORT}`);
      console.log(`📊 Environment: ${env.NODE_ENV}`);
      console.log(`📝 API Base: http://localhost:${env.PORT}/api/v1\n`);
    });
  } catch (err) {
    console.error('❌ Server start failed:', err);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});
