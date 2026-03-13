import { Router } from 'express';
import { prisma } from '../../config/database';
import { authMiddleware, AuthRequest } from '../../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

// ─── LIST EXPENSES ──────────────────────────────────────
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { year, month, day } = req.query;
    const where: any = { userId: req.user!.id };

    if (year) where.year = parseInt(year as string);
    if (month) where.month = parseInt(month as string);
    if (day) where.day = parseInt(day as string);

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: [{ day: 'desc' }, { createdAt: 'desc' }],
    });

    res.json(expenses);
  } catch (err) {
    next(err);
  }
});

// ─── SUMMARY ────────────────────────────────────────────
router.get('/summary', async (req: AuthRequest, res, next) => {
  try {
    const { year, month } = req.query;
    const y = parseInt(year as string);
    const m = parseInt(month as string);

    const expenses = await prisma.expense.findMany({
      where: { userId: req.user!.id, year: y, month: m },
    });

    const totalAmount = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    const count = expenses.length;
    const daysInMonth = new Date(y, m, 0).getDate();
    const averagePerDay = count > 0 ? totalAmount / daysInMonth : 0;

    const byCategory: Record<string, number> = {};
    const byDay: Record<number, number> = {};

    for (const e of expenses) {
      byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
      byDay[e.day] = (byDay[e.day] || 0) + Number(e.amount);
    }

    res.json({ totalAmount, count, averagePerDay, byCategory, byDay });
  } catch (err) {
    next(err);
  }
});

// ─── CREATE EXPENSE ─────────────────────────────────────
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { name, amount, category, expenseDate, note } = req.body;
    const date = new Date(expenseDate);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });

    const expense = await prisma.expense.create({
      data: {
        userId: req.user!.id,
        name,
        amount,
        currency: user?.currency || 'TRY',
        category: category || 'OTHER',
        note,
        expenseDate: date,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      },
    });

    res.status(201).json(expense);
  } catch (err) {
    next(err);
  }
});

// ─── UPDATE EXPENSE ─────────────────────────────────────
router.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { name, amount, category, expenseDate, note } = req.body;
    const data: any = {};

    if (name) data.name = name;
    if (amount !== undefined) data.amount = amount;
    if (category) data.category = category;
    if (note !== undefined) data.note = note;
    if (expenseDate) {
      const date = new Date(expenseDate);
      data.expenseDate = date;
      data.year = date.getFullYear();
      data.month = date.getMonth() + 1;
      data.day = date.getDate();
    }

    const expense = await prisma.expense.update({
      where: { id: req.params.id, userId: req.user!.id },
      data,
    });

    res.json(expense);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE EXPENSE ─────────────────────────────────────
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    await prisma.expense.delete({
      where: { id: req.params.id, userId: req.user!.id },
    });
    res.json({ message: 'Harcama silindi' });
  } catch (err) {
    next(err);
  }
});

export default router;
