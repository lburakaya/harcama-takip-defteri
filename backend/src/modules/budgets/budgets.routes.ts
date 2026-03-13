import { Router } from 'express';
import { prisma } from '../../config/database';
import { authMiddleware, AuthRequest } from '../../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

// ─── GET BUDGETS LIST ───────────────────────────────────
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const budgets = await prisma.monthlyBudget.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    res.json(budgets);
  } catch (err) {
    next(err);
  }
});

// ─── GET BUDGET DETAIL ──────────────────────────────────
router.get('/:year/:month', async (req: AuthRequest, res, next) => {
  try {
    const y = parseInt(req.params.year as string);
    const m = parseInt(req.params.month as string);

    const budget = await prisma.monthlyBudget.findUnique({
      where: { userId_year_month: { userId: req.user!.id, year: y, month: m } },
    });

    if (!budget) {
      res.status(404).json({ message: 'Bu ay için bütçe hedefi bulunamadı' });
      return;
    }

    // Calculate spending
    const expenses = await prisma.expense.findMany({
      where: { userId: req.user!.id, year: y, month: m },
    });

    const totalSpent = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    const monthlyIncome = Number(budget.monthlyIncome);
    const savingsGoal = Number(budget.savingsGoal);
    const spendingBudget = monthlyIncome - savingsGoal;
    const remainingBudget = spendingBudget - totalSpent;

    const daysInMonth = new Date(y, m, 0).getDate();
    const today = new Date();
    const daysPassed = today.getFullYear() === y && today.getMonth() + 1 === m
      ? today.getDate()
      : (m < today.getMonth() + 1 || y < today.getFullYear() ? daysInMonth : 0);
    const daysRemaining = Math.max(0, daysInMonth - daysPassed);

    const dailyAverageActual = daysPassed > 0 ? totalSpent / daysPassed : 0;
    const dailyMaxRecommended = daysRemaining > 0 ? remainingBudget / daysRemaining : 0;
    const budgetUsagePercent = spendingBudget > 0 ? Math.min(100, (totalSpent / spendingBudget) * 100) : 0;

    let status: 'IDEAL' | 'CAUTION' | 'EXCEEDED' = 'IDEAL';
    if (budgetUsagePercent > 100) status = 'EXCEEDED';
    else if (budgetUsagePercent > 80) status = 'CAUTION';

    res.json({
      monthlyIncome,
      savingsGoal,
      spendingBudget,
      totalSpent,
      remainingBudget,
      daysInMonth,
      daysPassed,
      daysRemaining,
      dailyAverageActual,
      dailyMaxRecommended,
      budgetUsagePercent,
      status,
    });
  } catch (err) {
    next(err);
  }
});

// ─── UPSERT BUDGET ──────────────────────────────────────
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { year, month, monthlyIncome, savingsGoal } = req.body;

    const budget = await prisma.monthlyBudget.upsert({
      where: { userId_year_month: { userId: req.user!.id, year, month } },
      create: {
        userId: req.user!.id,
        year,
        month,
        monthlyIncome,
        savingsGoal,
      },
      update: {
        monthlyIncome,
        savingsGoal,
      },
    });

    res.json(budget);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE BUDGET ───────────────────────────────────────
router.delete('/:year/:month', async (req: AuthRequest, res, next) => {
  try {
    const y = parseInt(req.params.year as string);
    const m = parseInt(req.params.month as string);

    await prisma.monthlyBudget.delete({
      where: { userId_year_month: { userId: req.user!.id, year: y, month: m } },
    });

    res.json({ message: 'Bütçe hedefi silindi' });
  } catch (err) {
    next(err);
  }
});

export default router;

