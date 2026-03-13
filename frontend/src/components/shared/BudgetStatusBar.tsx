import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import { BudgetStatus, type BudgetDetail } from '../../types';
import { Lightbulb } from '@phosphor-icons/react';
import { useAuthStore } from '../../store/authStore';

interface BudgetStatusBarProps {
  budget: BudgetDetail;
  year: number;
  month: number;
}

const monthNames = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const statusConfig = {
  [BudgetStatus.IDEAL]: { label: '✅ İdeal', variant: 'success' as const },
  [BudgetStatus.CAUTION]: { label: '🟡 Dikkatli', variant: 'warning' as const },
  [BudgetStatus.EXCEEDED]: { label: '🔴 Aşıldı', variant: 'danger' as const },
};

export function BudgetStatusBar({ budget, year, month }: BudgetStatusBarProps) {
  const user = useAuthStore((s) => s.user);
  const currency = user?.currency || 'TRY';

  const fmt = (n: number) =>
    new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(n);

  const statusInfo = statusConfig[budget.status] || statusConfig[BudgetStatus.IDEAL];

  return (
    <div className="bg-bg-card border border-border-custom rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-base">
          {monthNames[month - 1]} {year} Bütçe Durumu
        </h3>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <span className="text-text-muted block text-xs">Aylık Gelir</span>
          <span className="font-medium">{fmt(budget.monthlyIncome)}</span>
        </div>
        <div>
          <span className="text-text-muted block text-xs">Tasarruf Hedefi</span>
          <span className="font-medium">{fmt(budget.savingsGoal)}</span>
        </div>
        <div>
          <span className="text-text-muted block text-xs">Harcanabilir Bütçe</span>
          <span className="font-medium text-accent-green">{fmt(budget.spendingBudget)}</span>
        </div>
      </div>

      <ProgressBar value={budget.budgetUsagePercent} showLabel />

      <div className="flex items-center justify-between mt-3 text-sm">
        <span className="text-text-secondary">
          {fmt(budget.totalSpent)} harcandı / {fmt(budget.remainingBudget)} kaldı
        </span>
        <span className="text-text-muted text-xs">
          Ay: {budget.daysPassed}/{budget.daysInMonth} gün
        </span>
      </div>

      {budget.daysRemaining > 0 && (
        <div className="flex items-center gap-2 mt-3 p-3 bg-accent-green/5 rounded-xl">
          <Lightbulb size={18} className="text-accent-amber shrink-0" weight="fill" />
          <span className="text-sm text-text-secondary">
            Hedefe ulaşmak için kalan {budget.daysRemaining} günde günlük max:{' '}
            <span className="text-accent-green font-medium">
              {fmt(budget.dailyMaxRecommended)}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
