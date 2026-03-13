import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import * as Accordion from '@radix-ui/react-accordion';
import {
  CaretLeft, CaretRight, CaretDown, Plus, PencilSimple,
  Trash, Robot, CalendarBlank, FilePdf,
} from '@phosphor-icons/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRealTime } from '../hooks/useRealTime';
import { useBudget } from '../hooks/useBudget';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { PageLoader } from '../components/ui/Spinner';
import { BudgetBanner } from '../components/shared/BudgetBanner';
import {
  getExpenses, createExpense, updateExpense, deleteExpense,
  getExpenseSummary,
} from '../api/expenses.api';
import { upsertBudget } from '../api/budgets.api';
import type { Expense, DayGroup, ExpenseCategory, ExpenseSummary } from '../types';
import { ExpenseCategoryLabels } from '../types';
import * as Select from '@radix-ui/react-select';
import { Check } from '@phosphor-icons/react';

const monthNames = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

const categories: ExpenseCategory[] = [
  'MARKET', 'BILLS', 'TRANSPORT', 'FOOD', 'ENTERTAINMENT',
  'HEALTH', 'CLOTHING', 'EDUCATION', 'SUBSCRIPTION', 'OTHER',
] as ExpenseCategory[];

// Zod schema for expense form
const expenseSchema = z.object({
  name: z.string().min(1, 'Harcama adı gereklidir'),
  amount: z.number({ error: 'Geçerli bir tutar giriniz' }).positive('Tutar 0\'dan büyük olmalıdır'),
  category: z.string().min(1, 'Kategori seçiniz'),
  expenseDate: z.string().min(1, 'Tarih seçiniz'),
  note: z.string().optional(),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

export default function TablePage() {
  const { currentYear, currentMonth, currentDay } = useRealTime();
  const [viewYear, setViewYear] = useState(currentYear);
  const [viewMonth, setViewMonth] = useState(currentMonth);
  const { budget, refetch: refetchBudget } = useBudget(viewYear, viewMonth);
  const user = useAuthStore((s) => s.user);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);


  const currency = user?.currency || 'TRY';
  const fmt = (n: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
  });

  const [selectedCategory, setSelectedCategory] = useState('');

  // Sync year/month when realTime loads
  useEffect(() => {
    if (currentYear && currentMonth) {
      setViewYear(currentYear);
      setViewMonth(currentMonth);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    loadData();
  }, [viewYear, viewMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [expData, sumData] = await Promise.all([
        getExpenses({ year: viewYear, month: viewMonth }).catch(() => []),
        getExpenseSummary(viewYear, viewMonth).catch(() => null),
      ]);
      setExpenses(expData);
      setSummary(sumData);
    } catch {
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Group expenses by day
  const dayGroups = useMemo<DayGroup[]>(() => {
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const groups: DayGroup[] = [];

    for (let day = daysInMonth; day >= 1; day--) {
      const date = new Date(viewYear, viewMonth - 1, day);
      const dayExpenses = expenses.filter((e) => e.day === day);

      if (dayExpenses.length > 0 || (viewYear === currentYear && viewMonth === currentMonth && day === currentDay)) {
        groups.push({
          date: `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          dayOfWeek: dayNames[date.getDay()],
          dayLabel: `${dayNames[date.getDay()]}, ${day} ${monthNames[viewMonth - 1]}`,
          total: dayExpenses.reduce((sum, e) => sum + e.amount, 0),
          expenses: dayExpenses,
        });
      }
    }

    return groups;
  }, [expenses, viewYear, viewMonth, currentYear, currentMonth, currentDay]);

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const goToday = () => {
    setViewYear(currentYear);
    setViewMonth(currentMonth);
  };

  const openAddModal = (day?: number) => {
    setEditingExpense(null);
    const dateStr = day
      ? `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      : `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
    reset({
      name: '',
      amount: undefined as any,
      category: '',
      expenseDate: dateStr,
      note: '',
    });
    setSelectedCategory('');
    setModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    reset({
      name: expense.name,
      amount: expense.amount,
      category: expense.category,
      expenseDate: expense.expenseDate.split('T')[0],
      note: expense.note || '',
    });
    setSelectedCategory(expense.category);
    setModalOpen(true);
  };

  const onSubmit = async (data: ExpenseForm) => {
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, {
          name: data.name,
          amount: data.amount,
          category: data.category as ExpenseCategory,
          expenseDate: data.expenseDate,
          note: data.note,
        });
        toast.success('Harcama güncellendi');
      } else {
        await createExpense({
          name: data.name,
          amount: data.amount,
          category: data.category as ExpenseCategory,
          expenseDate: data.expenseDate,
          note: data.note,
        });
        toast.success('Harcama eklendi');
      }
      setModalOpen(false);
      loadData();
      refetchBudget();
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      toast.success('Harcama silindi');
      setDeleteConfirmId(null);
      loadData();
      refetchBudget();
    } catch {
      toast.error('Silme başarısız');
    }
  };

  const handleBudgetSubmit = async (data: { monthlyIncome: number; savingsGoal: number }) => {
    try {
      await upsertBudget({ year: viewYear, month: viewMonth, ...data });
      toast.success('Bütçe hedefi kaydedildi!');
      setShowBanner(false);
      refetchBudget();
    } catch {
      toast.error('Bütçe hedefi kaydedilemedi');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Budget Banner */}
      {showBanner && (
        <BudgetBanner
          year={viewYear}
          month={viewMonth}
          defaultIncome={budget?.monthlyIncome || 0}
          defaultGoal={budget?.savingsGoal || 0}
          onSubmit={handleBudgetSubmit}
          onDismiss={() => setShowBanner(false)}
        />
      )}

      {/* Header: Month selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-bg-hover text-text-secondary transition-colors">
            <CaretLeft size={20} />
          </button>
          <h2 className="font-display font-semibold text-xl min-w-[180px] text-center">
            {monthNames[viewMonth - 1]} {viewYear}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-bg-hover text-text-secondary transition-colors">
            <CaretRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goToday} icon={<CalendarBlank size={16} />}>
            Bugün
          </Button>
          <Button size="sm" onClick={() => openAddModal()} icon={<Plus size={16} />}>
            Harcama Ekle
          </Button>
        </div>
      </div>

      {/* Accordion Day Cards */}
      <Accordion.Root type="multiple" className="space-y-3">
        {dayGroups.length > 0 ? (
          dayGroups.map((group) => (
            <Accordion.Item key={group.date} value={group.date} asChild>
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-card border border-border-custom rounded-2xl overflow-hidden"
              >
                <Accordion.Header>
                  <Accordion.Trigger className="w-full flex items-center justify-between px-5 py-4 hover:bg-bg-hover/50 transition-colors group text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-bg-hover rounded-xl flex items-center justify-center text-sm font-medium text-text-secondary">
                        {parseInt(group.date.split('-')[2])}
                      </div>
                      <div>
                        <span className="font-medium text-sm">{group.dayLabel}</span>
                        <span className="block text-xs text-text-muted">{group.expenses.length} harcama</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{fmt(group.total)}</span>
                      <CaretDown
                        size={16}
                        className="text-text-muted transition-transform group-data-[state=open]:rotate-180"
                      />
                    </div>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-open data-[state=closed]:animate-accordion-close">
                  <div className="px-5 pb-4 border-t border-border-custom">
                    {group.expenses.length > 0 ? (
                      <div className="divide-y divide-border-custom">
                        {group.expenses.map((expense) => (
                          <div key={expense.id} className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                              <span className="text-sm">{expense.name}</span>
                              <Badge variant="default" size="sm">
                                {ExpenseCategoryLabels[expense.category]}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{fmt(expense.amount)}</span>
                              <button
                                onClick={() => openEditModal(expense)}
                                className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted hover:text-accent-green transition-colors"
                              >
                                <PencilSimple size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(expense.id)}
                                className="p-1.5 rounded-lg hover:bg-accent-red/10 text-text-muted hover:text-accent-red transition-colors"
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-text-muted py-3">Bu gün henüz harcama yok</p>
                    )}

                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-custom">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAddModal(parseInt(group.date.split('-')[2]))}
                        icon={<Plus size={14} />}
                      >
                        Bu güne ekle
                      </Button>
                      <Button variant="ghost" size="sm" icon={<Robot size={14} />}>
                        Bu günü analiz et
                      </Button>
                    </div>
                  </div>
                </Accordion.Content>
              </motion.div>
            </Accordion.Item>
          ))
        ) : (
          <Card className="text-center py-12">
            <p className="text-text-muted mb-3">Bu ayda henüz harcama yok</p>
            <Button size="sm" onClick={() => openAddModal()} icon={<Plus size={14} />}>
              İlk Harcamanızı Ekleyin
            </Button>
          </Card>
        )}
      </Accordion.Root>

      {/* Monthly Summary */}
      <Card padding="lg">
        <h3 className="font-display font-semibold mb-4">
          {monthNames[viewMonth - 1]} {viewYear} Özeti
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <span className="text-xs text-text-muted block">Toplam Harcama</span>
            <span className="text-lg font-bold">{fmt(summary?.totalAmount || 0)}</span>
          </div>
          <div>
            <span className="text-xs text-text-muted block">Harcama Sayısı</span>
            <span className="text-lg font-bold">{summary?.count || 0}</span>
          </div>
          <div>
            <span className="text-xs text-text-muted block">Ortalama/Gün</span>
            <span className="text-lg font-bold">{fmt(summary?.averagePerDay || 0)}</span>
          </div>
          <div>
            <span className="text-xs text-text-muted block">Kalan Bütçe</span>
            <span className="text-lg font-bold text-accent-green">
              {fmt(budget?.remainingBudget || 0)}
            </span>
          </div>
        </div>

        {budget && (
          <>
            <ProgressBar value={budget.budgetUsagePercent} showLabel label="Bütçe Kullanımı" />
            <div className="mt-3 text-sm text-text-secondary">
              💡 Kalan {budget.daysRemaining} gün için önerilen günlük max:{' '}
              <span className="text-accent-green font-medium">{fmt(budget.dailyMaxRecommended)}</span>
            </div>
          </>
        )}

        <div className="mt-4">
          <Button variant="secondary" size="sm" icon={<FilePdf size={16} />}>
            PDF Raporu Oluştur
          </Button>
        </div>
      </Card>

      {/* Add/Edit Expense Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingExpense ? 'Harcama Düzenle' : 'Harcama Ekle'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Harcama Adı"
            placeholder="Ör: Migros Market"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Tutar"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register('amount', { valueAsNumber: true })}
          />

          {/* Category Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Kategori</label>
            <Select.Root
              value={selectedCategory}
              onValueChange={(val) => {
                setSelectedCategory(val);
                setValue('category', val);
              }}
            >
              <Select.Trigger className="flex items-center justify-between px-4 py-2.5 bg-bg-card border border-border-custom rounded-xl text-text-primary text-sm">
                <Select.Value placeholder="Kategori seçiniz" />
                <Select.Icon><CaretDown size={14} className="text-text-muted" /></Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="bg-bg-card border border-border-custom rounded-xl shadow-xl z-[100]">
                  <Select.Viewport className="p-1">
                    {categories.map((cat) => (
                      <Select.Item
                        key={cat}
                        value={cat}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-bg-hover outline-none data-[highlighted]:bg-bg-hover text-text-primary"
                      >
                        <Select.ItemText>{ExpenseCategoryLabels[cat]}</Select.ItemText>
                        <Select.ItemIndicator><Check size={14} className="text-accent-green" /></Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
            {errors.category && <span className="text-xs text-accent-red">{errors.category.message}</span>}
          </div>

          <Input
            label="Tarih"
            type="date"
            error={errors.expenseDate?.message}
            {...register('expenseDate')}
          />

          <Textarea
            label="Not (opsiyonel)"
            placeholder="Ek bilgi..."
            {...register('note')}
          />

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" className="flex-1">
              {editingExpense ? 'Güncelle' : 'Kaydet'}
            </Button>
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              İptal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Harcamayı Sil"
        size="sm"
      >
        <p className="text-text-secondary text-sm mb-4">
          Bu harcamayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
        </p>
        <div className="flex items-center gap-3">
          <Button variant="danger" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
            Sil
          </Button>
          <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
            İptal
          </Button>
        </div>
      </Modal>
    </div>
  );
}
