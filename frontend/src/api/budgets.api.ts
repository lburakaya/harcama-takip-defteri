import { client } from './client';
import type { MonthlyBudget, BudgetDetail, CreateBudgetDto } from '../types';

export const getBudgets = (): Promise<MonthlyBudget[]> =>
  client.get('/budgets').then((r) => r.data);

export const getBudgetDetail = (year: number, month: number): Promise<BudgetDetail> =>
  client.get(`/budgets/${year}/${month}`).then((r) => r.data);

export const upsertBudget = (data: CreateBudgetDto): Promise<MonthlyBudget> =>
  client.post('/budgets', data).then((r) => r.data);

export const deleteBudget = (year: number, month: number): Promise<void> =>
  client.delete(`/budgets/${year}/${month}`).then((r) => r.data);
