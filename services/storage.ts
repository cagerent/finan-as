import { Category, Transaction, TransactionType } from '../types';

const KEYS = {
  CATEGORIES: 'finfamily_categories',
  TRANSACTIONS: 'finfamily_transactions',
};

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Moradia',
    color: '#ef4444',
    type: 'EXPENSE',
    subCategories: [
      { id: 's1', name: 'Aluguel/Condomínio' },
      { id: 's2', name: 'Energia' },
      { id: 's3', name: 'Internet' },
    ],
  },
  {
    id: '2',
    name: 'Alimentação',
    color: '#f97316',
    type: 'EXPENSE',
    subCategories: [
      { id: 's4', name: 'Supermercado' },
      { id: 's5', name: 'Restaurante' },
    ],
  },
  {
    id: '3',
    name: 'Transporte',
    color: '#eab308',
    type: 'EXPENSE',
    subCategories: [
      { id: 's6', name: 'Combustível' },
      { id: 's7', name: 'Manutenção' },
      { id: 's8', name: 'Uber/Táxi' },
    ],
  },
  {
    id: '4',
    name: 'Salário',
    color: '#22c55e',
    type: 'INCOME',
    subCategories: [
      { id: 's9', name: 'Mensal' },
      { id: 's10', name: '13º Salário' },
    ],
  },
  {
    id: '5',
    name: 'Investimentos',
    color: '#3b82f6',
    type: 'INCOME',
    subCategories: [
      { id: 's11', name: 'Dividendos' },
    ],
  },
];

export const getCategories = (): Category[] => {
  const stored = localStorage.getItem(KEYS.CATEGORIES);
  if (!stored) {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    return DEFAULT_CATEGORIES;
  }
  return JSON.parse(stored);
};

export const saveCategories = (categories: Category[]) => {
  localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
};

export const getTransactions = (): Transaction[] => {
  const stored = localStorage.getItem(KEYS.TRANSACTIONS);
  return stored ? JSON.parse(stored) : [];
};

export const saveTransactions = (transactions: Transaction[]) => {
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
};

export const addTransactionWithInstallments = (
  baseTransaction: Omit<Transaction, 'id'>,
  installments: number
): Transaction[] => {
  const currentTransactions = getTransactions();
  const newTransactions: Transaction[] = [];

  const baseDate = new Date(baseTransaction.date);

  for (let i = 0; i < installments; i++) {
    const date = new Date(baseDate);
    date.setMonth(date.getMonth() + i);

    const transaction: Transaction = {
      ...baseTransaction,
      id: crypto.randomUUID(),
      date: date.toISOString().split('T')[0],
      installmentCurrent: installments > 1 ? i + 1 : undefined,
      installmentTotal: installments > 1 ? installments : undefined,
    };
    newTransactions.push(transaction);
  }

  const updatedList = [...currentTransactions, ...newTransactions];
  saveTransactions(updatedList);
  return updatedList;
};
