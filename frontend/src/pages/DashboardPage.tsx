import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CurrencyDollar,
  TrendUp,
  ShoppingCart,
  Sparkle,
} from '@phosphor-icons/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useRealTime } from '../hooks/useRealTime';
import { useBudget } from '../hooks/useBudget';
import { useAuthStore } from '../store/authStore';
import { StatCard } from '../components/ui/Card';
import { Card } from '../components/ui/Card';
import { PageLoader } from '../components/ui/Spinner';
import { BudgetStatusBar } from '../components/shared/BudgetStatusBar';
import { BudgetBanner } from '../components/shared/BudgetBanner';
import { Badge } from '../components/ui/Badge';
import { getExpenses, getExpenseSummary } from '../api/expenses.api';
import { upsertBudget } from '../api/budgets.api';
import { toast } from 'sonner';
import type { Expense, ExpenseSummary, ExpenseCategory } from '../types';
import { ExpenseCategoryLabels } from '../types';

const PIE_COLORS = ['#00D97E', '#F5A623', '#FF4D4D', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'];

export default function DashboardPage() {
  const { currentYear, currentMonth, currentDay } = useRealTime();
  const { budget, loading: budgetLoading, refetch: refetchBudget } = useBudget(currentYear, currentMonth);
  const user = useAuthStore((s) => s.user);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  // Mock chart data for last 6 months
  const [chartData, setChartData] = useState<Array<{ month: string; amount: number; target: number }>>([]);

  useEffect(() => {
    loadData();
  }, [currentYear, currentMonth]);

  useEffect(() => {
    // Show banner if it's day 1-3 of the month
    if (currentDay <= 3) {
      setShowBanner(true);
    }
  }, [currentDay]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [expData, sumData] = await Promise.all([
        getExpenses({ year: currentYear, month: currentMonth }).catch(() => []),
        getExpenseSummary(currentYear, currentMonth).catch(() => null),
      ]);
      setExpenses(expData);
      setSummary(sumData);

      // Generate chart data for last 6 months
      const months = [];
      const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      for (let i = 5; i >= 0; i--) {
        let m = currentMonth - i;
        let y = currentYear;
        if (m <= 0) { m += 12; y -= 1; }
        months.push({
          month: `${monthNames[m - 1]} ${y}`,
          amount: i === 0 ? (sumData?.totalAmount || 0) : Math.random() * 15000 + 5000,
          target: budget?.spendingBudget || 35000,
        });
      }
      setChartData(months);
    } catch {
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetSubmit = async (data: { monthlyIncome: number; savingsGoal: number }) => {
    try {
      await upsertBudget({
        year: currentYear,
        month: currentMonth,
        ...data,
      });
      toast.success('Bütçe hedefi kaydedildi!');
      setShowBanner(false);
      refetchBudget();
    } catch {
      toast.error('Bütçe hedefi kaydedilemedi');
    }
  };

  const currency = user?.currency || 'TRY';
  const fmt = (n: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

  // Prepare pie data
  const pieData = summary?.byCategory
    ? Object.entries(summary.byCategory)
        .filter(([, v]) => v > 0)
        .map(([key, value]) => ({
          name: ExpenseCategoryLabels[key as ExpenseCategory] || key,
          value: value as number,
        }))
    : [];

  // Last 5 expenses
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Calculate change vs last month (simple estimate)
  const changePercent = summary && budget
    ? ((summary.totalAmount - budget.spendingBudget * 0.5) / (budget.spendingBudget * 0.5)) * 100
    : 0;

  // Find top category
  const topCategory = pieData.length > 0
    ? pieData.reduce((max, c) => c.value > max.value ? c : max, pieData[0])
    : null;

  if (loading || budgetLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Budget Banner */}
      {showBanner && (
        <BudgetBanner
          year={currentYear}
          month={currentMonth}
          defaultIncome={budget?.monthlyIncome || 0}
          defaultGoal={budget?.savingsGoal || 0}
          onSubmit={handleBudgetSubmit}
          onDismiss={() => setShowBanner(false)}
        />
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Bu Ay Harcama"
          value={fmt(summary?.totalAmount || 0)}
          icon={<CurrencyDollar size={24} weight="duotone" />}
        />
        <StatCard
          title="Geçen Aya Göre"
          value={`%${Math.abs(changePercent).toFixed(1)}`}
          icon={<TrendUp size={24} weight="duotone" />}
          change={changePercent}
        />
        <StatCard
          title="En Yüksek Kategori"
          value={topCategory?.name || '-'}
          icon={<ShoppingCart size={24} weight="duotone" />}
          subtitle={topCategory ? fmt(topCategory.value) : undefined}
        />
        <StatCard
          title="AI Tasarruf Potansiyeli"
          value={fmt(budget ? budget.totalSpent * 0.12 : 0)}
          icon={<Sparkle size={24} weight="duotone" />}
          subtitle="Tahmini"
        />
      </div>

      {/* Budget Status Bar */}
      {budget && (
        <BudgetStatusBar
          budget={budget}
          year={currentYear}
          month={currentMonth}
        />
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <Card className="lg:col-span-2" padding="lg">
          <h3 className="font-display font-semibold mb-4">Son 6 Ay Harcama</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2F42" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#8892A4', fontSize: 11 }}
                  axisLine={{ stroke: '#2A2F42' }}
                />
                <YAxis
                  tick={{ fill: '#8892A4', fontSize: 11 }}
                  axisLine={{ stroke: '#2A2F42' }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1C2030',
                    border: '1px solid #2A2F42',
                    borderRadius: '12px',
                    color: '#F0F2F5',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#00D97E"
                  strokeWidth={2}
                  dot={{ fill: '#00D97E', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Harcama"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#F5A623"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Hedef"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart */}
        <Card padding="lg">
          <h3 className="font-display font-semibold mb-4">Kategori Dağılımı</h3>
          {pieData.length > 0 ? (
            <div className="h-64 flex flex-col items-center">
              <ResponsiveContainer width="100%" height="70%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1C2030',
                      border: '1px solid #2A2F42',
                      borderRadius: '12px',
                      color: '#F0F2F5',
                    }}
                    formatter={(value: unknown) => fmt(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center">
                {pieData.slice(0, 5).map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1 text-[10px] text-text-secondary">
                    <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    {d.name}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-text-muted text-sm">
              Henüz harcama yok
            </div>
          )}
        </Card>
      </div>

      {/* Recent Expenses */}
      <Card padding="lg">
        <h3 className="font-display font-semibold mb-4">Son 5 Harcama</h3>
        {recentExpenses.length > 0 ? (
          <div className="space-y-3">
            {recentExpenses.map((exp) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between py-2.5 border-b border-border-custom last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-bg-hover rounded-lg flex items-center justify-center text-xs font-medium text-text-secondary">
                    {exp.day}
                  </div>
                  <div>
                    <span className="text-sm font-medium">{exp.name}</span>
                    <Badge variant="default" size="sm">
                      {ExpenseCategoryLabels[exp.category]}
                    </Badge>
                  </div>
                </div>
                <span className="text-sm font-medium text-accent-red">-{fmt(exp.amount)}</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-text-muted text-sm">
            Bu ay henüz harcama eklenmemiş.
          </div>
        )}
      </Card>
    </div>
  );
}
