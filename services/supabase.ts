import { createClient } from '@supabase/supabase-js';
import { Category, Transaction } from '../types';

// ⚠️ ATENÇÃO: SUBSTITUA PELOS DADOS DO SEU PROJETO SUPABASE
// Você encontra esses dados no painel do Supabase em: Project Settings > API
const SUPABASE_URL: string = 'https://tiejebnyhlmlbohzivgy.supabase.co';
const SUPABASE_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpZWplYm55aGxtbGJvaHppdmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MDY0NTcsImV4cCI6MjA4MTM4MjQ1N30.DQz0_Zove338noiQh1HGjhOClWt0MOiYF7788pQbEaA';

// Verifica se as chaves foram configuradas pelo usuário
export const isSupabaseConfigured = () => {
  return SUPABASE_URL !== 'https://seu-projeto.supabase.co' && 
         !SUPABASE_URL.includes('seu-projeto') &&
         SUPABASE_KEY !== 'sua-chave-anon-publica';
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

export const api = {
  // --- CATEGORIAS ---

  async getCategories(): Promise<Category[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase.from('categories').select('*');
    if (error) {
      console.error('Erro ao buscar categorias:', error);
      throw error;
    }
    
    // Mapear do formato do Banco (snake_case) para o App (camelCase)
    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      type: c.type,
      subCategories: c.sub_categories || [] // JSONB column
    }));
  },

  async seedInitialCategories(): Promise<void> {
    if (!isSupabaseConfigured()) return;
    console.log("Criando categorias padrão...");
    
    for (const cat of DEFAULT_CATEGORIES) {
      // Usamos uuid aleatórios novos para garantir unicidade no banco real
      const newId = crypto.randomUUID();
      const subCatsWithIds = cat.subCategories.map(s => ({ ...s, id: crypto.randomUUID() }));
      
      await api.upsertCategory({
        ...cat,
        id: newId,
        subCategories: subCatsWithIds
      });
    }
  },

  async upsertCategory(category: Category): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const dbData = {
      id: category.id,
      name: category.name,
      color: category.color,
      type: category.type,
      sub_categories: category.subCategories
    };

    const { error } = await supabase.from('categories').upsert(dbData);
    if (error) throw error;
  },

  async deleteCategory(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  },

  // --- TRANSAÇÕES ---

  async getTransactions(): Promise<Transaction[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase.from('transactions').select('*');
    if (error) {
      console.error('Erro ao buscar transações:', error);
      throw error;
    }

    return data.map((t: any) => ({
      id: t.id,
      date: t.date,
      description: t.description,
      amount: Number(t.amount),
      type: t.type,
      categoryId: t.category_id,
      subCategoryId: t.sub_category_id,
      installmentCurrent: t.installment_current,
      installmentTotal: t.installment_total
    }));
  },

  async addTransactions(transactions: Transaction[]): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const dbData = transactions.map(t => ({
      id: t.id,
      date: t.date,
      description: t.description,
      amount: t.amount,
      type: t.type,
      category_id: t.categoryId,
      sub_category_id: t.subCategoryId,
      installment_current: t.installmentCurrent,
      installment_total: t.installmentTotal
    }));
    
    const { error } = await supabase.from('transactions').insert(dbData);
    if (error) throw error;
  },

  async deleteTransaction(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  }
};