import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { authMiddleware, AuthRequest } from '../../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

// ─── GET PROFILE ────────────────────────────────────────
router.get('/me', async (req: AuthRequest, res, next) => {
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
router.patch('/me', async (req: AuthRequest, res, next) => {
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
router.delete('/me', async (req: AuthRequest, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.user!.id } });
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Hesap silindi' });
  } catch (err) {
    next(err);
  }
});

// ─── HELPER ─────────────────────────────────────────────
function sanitizeUser(user: any) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export default router;
