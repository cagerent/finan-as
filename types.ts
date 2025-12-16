export type TransactionType = 'EXPENSE' | 'INCOME';

export interface SubCategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  type: TransactionType;
  subCategories: SubCategory[];
}

export interface Transaction {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  subCategoryId?: string;
  installmentCurrent?: number;
  installmentTotal?: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: { name: string; value: number; color: string }[];
  transactions: Transaction[];
}
