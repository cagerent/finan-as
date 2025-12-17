export type TransactionType = 'EXPENSE' | 'INCOME';
export type TransactionStatus = 'PENDING' | 'COMPLETED';

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
  status: TransactionStatus;
  categoryId: string;
  subCategoryId?: string;
  installmentCurrent?: number;
  installmentTotal?: number;
}

export interface FinancialSummary {
  totalIncome: number; // Total Previsto
  totalExpense: number; // Total Previsto
  balance: number; // Saldo Previsto
  
  realizedIncome: number; // Apenas Recebidos
  realizedExpense: number; // Apenas Pagos
  realizedBalance: number; // Saldo Atual Real

  byCategory: { name: string; value: number; color: string }[];
  transactions: Transaction[];
}