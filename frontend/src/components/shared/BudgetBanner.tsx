import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target } from '@phosphor-icons/react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface BudgetBannerProps {
  year: number;
  month: number;
  defaultIncome?: number;
  defaultGoal?: number;
  onSubmit: (data: { monthlyIncome: number; savingsGoal: number }) => void;
  onDismiss?: () => void;
}

const monthNames = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export function BudgetBanner({
  year,
  month,
  defaultIncome = 0,
  defaultGoal = 0,
  onSubmit,
  onDismiss,
}: BudgetBannerProps) {
  const [income, setIncome] = useState(defaultIncome.toString());
  const [goal, setGoal] = useState(defaultGoal.toString());

  const incomeNum = parseFloat(income) || 0;
  const goalNum = parseFloat(goal) || 0;
  const spendingBudget = incomeNum - goalNum;
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyMax = spendingBudget > 0 ? spendingBudget / daysInMonth : 0;

  const handleSubmit = () => {
    if (incomeNum > 0 && goalNum >= 0 && goalNum < incomeNum) {
      onSubmit({ monthlyIncome: incomeNum, savingsGoal: goalNum });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -20, height: 0 }}
      className="bg-gradient-to-r from-accent-green/10 via-bg-card to-accent-green/5 border border-accent-green/20 rounded-2xl p-5 mb-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Target size={24} className="text-accent-green" weight="fill" />
        <h3 className="font-display font-semibold text-lg">
          {monthNames[month - 1]} {year} için hedeflerinizi belirleyin
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Input
          label="Aylık Gelir"
          type="number"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          placeholder="0.00"
        />
        <Input
          label="Tasarruf Hedefi"
          type="number"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="0.00"
        />
      </div>

      {incomeNum > 0 && (
        <div className="text-sm text-text-secondary mb-4">
          Harcanabilir Bütçe: <span className="text-accent-green font-medium">₺{spendingBudget.toLocaleString('tr-TR')}</span>
          {' → '}Günlük max: <span className="text-accent-green font-medium">₺{dailyMax.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSubmit} size="sm">Onayla</Button>
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Hatırlat: 3 gün
          </Button>
        )}
      </div>
    </motion.div>
  );
}
