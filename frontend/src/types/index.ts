// ─── ENUMs (as const objects for erasableSyntaxOnly) ─────

export const ExpenseCategory = {
  MARKET: 'MARKET',
  BILLS: 'BILLS',
  TRANSPORT: 'TRANSPORT',
  FOOD: 'FOOD',
  ENTERTAINMENT: 'ENTERTAINMENT',
  HEALTH: 'HEALTH',
  CLOTHING: 'CLOTHING',
  EDUCATION: 'EDUCATION',
  SUBSCRIPTION: 'SUBSCRIPTION',
  OTHER: 'OTHER',
} as const;
export type ExpenseCategory = (typeof ExpenseCategory)[keyof typeof ExpenseCategory];

export const ExpenseCategoryLabels: Record<ExpenseCategory, string> = {
  [ExpenseCategory.MARKET]: 'Market',
  [ExpenseCategory.BILLS]: 'Fatura',
  [ExpenseCategory.TRANSPORT]: 'Ulaşım',
  [ExpenseCategory.FOOD]: 'Yemek',
  [ExpenseCategory.ENTERTAINMENT]: 'Eğlence',
  [ExpenseCategory.HEALTH]: 'Sağlık',
  [ExpenseCategory.CLOTHING]: 'Giyim',
  [ExpenseCategory.EDUCATION]: 'Eğitim',
  [ExpenseCategory.SUBSCRIPTION]: 'Abonelik',
  [ExpenseCategory.OTHER]: 'Diğer',
};

export const ExpenseSource = {
  MANUAL: 'MANUAL',
  DOCUMENT_PARSE: 'DOCUMENT_PARSE',
} as const;
export type ExpenseSource = (typeof ExpenseSource)[keyof typeof ExpenseSource];

export const PeriodType = {
  MONTHLY: 'MONTHLY',
  TWO_MONTHS: 'TWO_MONTHS',
  YEARLY: 'YEARLY',
} as const;
export type PeriodType = (typeof PeriodType)[keyof typeof PeriodType];

export const PeriodTypeLabels: Record<PeriodType, string> = {
  [PeriodType.MONTHLY]: 'Aylık',
  [PeriodType.TWO_MONTHS]: '2 Aylık',
  [PeriodType.YEARLY]: 'Yıllık',
};

export const ParseStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;
export type ParseStatus = (typeof ParseStatus)[keyof typeof ParseStatus];

export const AnalysisType = {
  DAILY: 'DAILY',
  MONTHLY: 'MONTHLY',
  DOCUMENT: 'DOCUMENT',
} as const;
export type AnalysisType = (typeof AnalysisType)[keyof typeof AnalysisType];

export const AnalysisStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;
export type AnalysisStatus = (typeof AnalysisStatus)[keyof typeof AnalysisStatus];

export const ReportType = {
  DAILY: 'DAILY',
  MONTHLY: 'MONTHLY',
  DOCUMENT: 'DOCUMENT',
} as const;
export type ReportType = (typeof ReportType)[keyof typeof ReportType];

export const EmailStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
} as const;
export type EmailStatus = (typeof EmailStatus)[keyof typeof EmailStatus];

export const BudgetStatus = {
  IDEAL: 'IDEAL',
  CAUTION: 'CAUTION',
  EXCEEDED: 'EXCEEDED',
} as const;
export type BudgetStatus = (typeof BudgetStatus)[keyof typeof BudgetStatus];

// ─── MODELS ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  currency: string;
  reportEmail?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  name: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  note?: string;
  expenseDate: string;
  year: number;
  month: number;
  day: number;
  source: ExpenseSource;
  documentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyBudget {
  id: string;
  userId: string;
  year: number;
  month: number;
  monthlyIncome: number;
  savingsGoal: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetDetail {
  monthlyIncome: number;
  savingsGoal: number;
  spendingBudget: number;
  totalSpent: number;
  remainingBudget: number;
  daysInMonth: number;
  daysPassed: number;
  daysRemaining: number;
  dailyAverageActual: number;
  dailyMaxRecommended: number;
  budgetUsagePercent: number;
  status: BudgetStatus;
}

export interface Document {
  id: string;
  userId: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  bankName?: string;
  periodType: PeriodType;
  periodStart: string;
  periodEnd: string;
  parseStatus: ParseStatus;
  parseError?: string;
  parsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnnecessaryExpense {
  name: string;
  amount: number;
  reason: string;
}

export interface SavingsSuggestion {
  title: string;
  description: string;
  potentialSaving: number;
}

export interface Analysis {
  id: string;
  userId: string;
  type: AnalysisType;
  status: AnalysisStatus;
  analysisDate?: string;
  year?: number;
  month?: number;
  documentId?: string;
  rawResponse?: string;
  unnecessaryExpenses?: UnnecessaryExpense[];
  savingsSuggestions?: SavingsSuggestion[];
  totalSpent?: number;
  potentialSavings?: number;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  userId: string;
  analysisId: string;
  type: ReportType;
  fileKey: string;
  fileName: string;
  emailSentTo?: string;
  emailSentAt?: string;
  emailStatus: EmailStatus;
  createdAt: string;
}

// ─── DTOs ──────────────────────────────────────────────

export interface LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirm: string;
  currency: string;
  monthlyIncome: number;
  savingsGoal: number;
}

export interface CreateExpenseDto {
  name: string;
  amount: number;
  category: ExpenseCategory;
  expenseDate: string;
  note?: string;
}

export interface UpdateExpenseDto {
  name?: string;
  amount?: number;
  category?: ExpenseCategory;
  expenseDate?: string;
  note?: string;
}

export interface CreateBudgetDto {
  year: number;
  month: number;
  monthlyIncome: number;
  savingsGoal: number;
}

export interface ExpenseSummary {
  totalAmount: number;
  count: number;
  averagePerDay: number;
  byCategory: Record<ExpenseCategory, number>;
  byDay: Record<number, number>;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TimeResponse {
  timestamp: string;
  date: string;
  time: string;
  timezone: string;
  unixtime: number;
  source?: 'api' | 'fallback';
}

// ─── Stream Events ──────────────────────────────────────

export interface AnalysisStreamEvent {
  type: 'chunk' | 'done' | 'error';
  content?: string;
  result?: Analysis;
  error?: string;
}

// ─── Grouped Expenses (for TablePage) ──────────────────

export interface DayGroup {
  date: string;
  dayOfWeek: string;
  dayLabel: string;
  total: number;
  expenses: Expense[];
}
