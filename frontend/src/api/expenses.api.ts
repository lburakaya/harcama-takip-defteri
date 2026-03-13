import { client } from './client';
import type { Expense, CreateExpenseDto, UpdateExpenseDto, ExpenseSummary } from '../types';

export const getExpenses = (params: { year: number; month: number; day?: number }): Promise<Expense[]> =>
  client.get('/expenses', { params }).then((r) => r.data);

export const createExpense = (data: CreateExpenseDto): Promise<Expense> =>
  client.post('/expenses', data).then((r) => r.data);

export const updateExpense = (id: string, data: UpdateExpenseDto): Promise<Expense> =>
  client.patch(`/expenses/${id}`, data).then((r) => r.data);

export const deleteExpense = (id: string): Promise<void> =>
  client.delete(`/expenses/${id}`).then((r) => r.data);

export const getExpenseSummary = (year: number, month: number): Promise<ExpenseSummary> =>
  client.get('/expenses/summary', { params: { year, month } }).then((r) => r.data);
