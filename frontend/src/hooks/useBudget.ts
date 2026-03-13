import { useState, useEffect, useCallback } from 'react';
import { getBudgetDetail } from '../api/budgets.api';
import type { BudgetDetail } from '../types';

export function useBudget(year: number, month: number) {
  const [budget, setBudget] = useState<BudgetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudget = useCallback(async () => {
    if (!year || !month) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getBudgetDetail(year, month);
      setBudget(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bütçe bilgisi alınamadı';
      setError(message);
      setBudget(null);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  return {
    budget,
    loading,
    error,
    refetch: fetchBudget,
  };
}
