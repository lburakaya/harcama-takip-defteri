import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { authMiddleware, AuthRequest } from '../../middleware/auth.middleware';
import { authRateLimit } from '../../middleware/rateLimit.middleware';

const router = Router();

// ─── REGISTER ───────────────────────────────────────────
router.post('/register', authRateLimit, async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, currency, monthlyIncome, savingsGoal } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, passwordHash, firstName, lastName, currency: currency || 'TRY' },
    });

    // Create initial budget for current month
    const now = new Date();
    if (monthlyIncome && savingsGoal !== undefined) {
      await prisma.monthlyBudget.create({
        data: {
          userId: user.id,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          monthlyIncome,
          savingsGoal,
        },
      });
    }

    const tokens = generateTokens(user.id, user.email);
    await saveRefreshToken(user.id, tokens.refreshToken);

    setTokenCookies(res, tokens);
    res.status(201).json({
      user: sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    next(err);
  }
});

// ─── LOGIN ──────────────────────────────────────────────
router.post('/login', authRateLimit, async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ message: 'E-posta veya şifre hatalı' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({ message: 'E-posta veya şifre hatalı' });
      return;
    }

    const expiresIn = rememberMe ? '30d' : env.JWT_REFRESH_EXPIRES;
    const tokens = generateTokens(user.id, user.email, expiresIn);
    await saveRefreshToken(user.id, tokens.refreshToken);

    setTokenCookies(res, tokens);
    res.json({
      user: sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    next(err);
  }
});

// ─── REFRESH TOKEN ──────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!token) {
      res.status(401).json({ message: 'Refresh token gereklidir' });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };

    const storedToken = await prisma.refreshToken.findUnique({ where: { token } });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      res.status(401).json({ message: 'Geçersiz veya süresi dolmuş refresh token' });
      return;
    }

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      res.status(401).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    const tokens = generateTokens(user.id, user.email);
    await saveRefreshToken(user.id, tokens.refreshToken);

    setTokenCookies(res, tokens);
    res.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  } catch {
    res.status(401).json({ message: 'Geçersiz refresh token' });
  }
});

// ─── LOGOUT ─────────────────────────────────────────────
router.post('/logout', authMiddleware, async (req: AuthRequest, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Çıkış yapıldı' });
});

// ─── ME ─────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }
    res.json(sanitizeUser(user));
  } catch (err) {
    next(err);
  }
});

// ─── UPDATE PROFILE ─────────────────────────────────────
router.patch('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { firstName, lastName, email, password, currency, reportEmail } = req.body;
    const data: any = {};

    if (firstName) data.firstName = firstName;
    if (lastName) data.lastName = lastName;
    if (email) data.email = email;
    if (currency) data.currency = currency;
    if (reportEmail !== undefined) data.reportEmail = reportEmail;
    if (password) data.passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({ where: { id: req.user!.id }, data });
    res.json(sanitizeUser(user));
  } catch (err) {
    next(err);
  }
});

// ─── DELETE ACCOUNT ─────────────────────────────────────
router.delete('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.user!.id } });
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Hesap silindi' });
  } catch (err) {
    next(err);
  }
});

// ─── HELPERS ────────────────────────────────────────────

function generateTokens(userId: string, email: string, refreshExpires?: string) {
  const accessToken = jwt.sign({ userId, email }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES as any,
  });
  const refreshToken = jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: (refreshExpires || env.JWT_REFRESH_EXPIRES) as any,
  });
  return { accessToken, refreshToken };
}

async function saveRefreshToken(userId: string, token: string) {
  const decoded = jwt.decode(token) as { exp: number };
  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt: new Date(decoded.exp * 1000),
    },
  });
}

function setTokenCookies(res: any, tokens: { accessToken: string; refreshToken: string }) {
  res.cookie('accessToken', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 15 * 60 * 1000, // 15 min
  });
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function sanitizeUser(user: any) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export default router;
