import React, { useState, useEffect, useMemo } from 'react';
import { api, isSupabaseConfigured } from './services/supabase';
import { Category, Transaction, FinancialSummary } from './types';
import { Dashboard } from './components/Dashboard';
import { TransactionForm } from './components/TransactionForm';
import { CategoryManager } from './components/CategoryManager';
import { AiAdvisor } from './components/AiAdvisor';
import { Plus, Settings, List, LayoutDashboard, ChevronLeft, ChevronRight, Trash2, Loader2, Database, AlertTriangle, Edit2, CheckCircle2, CircleDashed } from 'lucide-react';

// Helper to extract error message safely
const getErrorMessage = (error: any): string => {
  if (!error) return "Erro desconhecido";
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  
  // Supabase/Postgres specific fields
  if (error.message) return String(error.message);
  if (error.error_description) return String(error.error_description);
  if (error.details) return String(error.details);
  
  // JSON Fallback
  try {
    const json = JSON.stringify(error, null, 2);
    if (json && json !== '{}') return json;
  } catch (e) {
    // ignore
  }
  
  return String(error); // Last resort
};

const App: React.FC = () => {
  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'TRANSACTIONS'>('DASHBOARD');
  const [showTransForm, setShowTransForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showCatManager, setShowCatManager] = useState(false);

  // Initialization - Load from Supabase
  useEffect(() => {
    const loadData = async () => {
      // Check configuration first
      if (!isSupabaseConfigured()) {
        setConfigError(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let [cats, trans] = await Promise.all([
          api.getCategories(),
          api.getTransactions()
        ]);
        
        // Se não houver categorias (banco novo), criar as padrões
        if (cats.length === 0) {
          await api.seedInitialCategories();
          cats = await api.getCategories(); // Recarregar após criar
        }

        setCategories(cats);
        setTransactions(trans);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        alert("Erro ao conectar com o banco de dados. Verifique sua conexão e chaves.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Update categories wrapper
  const handleUpdateCategories = async (newCats: Category[]) => {
    const oldCats = [...categories];
    setCategories(newCats); // Optimistic

    try {
      const newIds = new Set(newCats.map(c => c.id));
      const deletedCats = oldCats.filter(c => !newIds.has(c.id));

      for (const cat of deletedCats) {
        await api.deleteCategory(cat.id);
      }

      for (const cat of newCats) {
        await api.upsertCategory(cat);
      }
    } catch (error) {
      console.error("Erro ao salvar categorias:", error);
      alert("Erro ao sincronizar categorias. Revertendo.");
      setCategories(oldCats);
    }
  };

  // Add/Edit transaction wrapper
  const handleSaveTransaction = async (baseT: Omit<Transaction, 'id'> | Transaction, installments: number, isEditing: boolean) => {
    
    if (isEditing && 'id' in baseT) {
      // Logic for Editing
      const existingT = transactions.find(t => t.id === (baseT as Transaction).id);
      // Mescla os dados existentes (para manter campos como parcelas) com os editados
      const updatedT: Transaction = { ...existingT!, ...(baseT as Transaction) };
      
      const oldTransactions = [...transactions];
      setTransactions(transactions.map(t => t.id === updatedT.id ? updatedT : t)); // Optimistic

      try {
        await api.updateTransaction(updatedT);
      } catch (error: any) {
        console.error("Erro ao atualizar transação:", error);
        const errorMsg = getErrorMessage(error);
        const lowerMsg = errorMsg.toLowerCase();
        
        // Check for common schema errors
        if (lowerMsg.includes('status') || lowerMsg.includes('column') || lowerMsg.includes('does not exist')) {
           alert(
             "ERRO DE BANCO DE DADOS (Schema Desatualizado):\n\n" +
             "O Supabase rejeitou a atualização porque faltam colunas na tabela.\n\n" +
             "SOLUÇÃO:\n" +
             "1. Vá no Supabase > SQL Editor\n" +
             "2. Execute:\n\n" +
             "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status text DEFAULT 'COMPLETED';\n" +
             "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_current integer;\n" +
             "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_total integer;\n"
           );
        } else {
           alert(`Erro ao atualizar no banco: ${errorMsg}`);
        }
        setTransactions(oldTransactions);
      }
      return;
    }

    // Logic for Creating (with optional installments)
    const newTransactions: Transaction[] = [];
    
    // Safer Date Math to avoid timezone issues with `new Date()`
    const [y, m, d] = baseT.date.split('-').map(Number);
    
    for (let i = 0; i < installments; i++) {
      // Create new date by manipulating month integer
      const newMonth = m - 1 + i; // 0-indexed month
      const targetDate = new Date(y, newMonth, d);
      
      // Format back to YYYY-MM-DD manually to match local time expectation
      const yearStr = targetDate.getFullYear();
      const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(targetDate.getDate()).padStart(2, '0');
      const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

      const transaction: Transaction = {
        ...(baseT as Omit<Transaction, 'id'>),
        id: crypto.randomUUID(),
        date: dateStr,
        status: i === 0 ? baseT.status : 'PENDING', // First follows selection, others are Pending
        installmentCurrent: installments > 1 ? i + 1 : undefined,
        installmentTotal: installments > 1 ? installments : undefined,
      };
      newTransactions.push(transaction);
    }

    const oldTransactions = [...transactions];
    setTransactions([...transactions, ...newTransactions]); // Optimistic

    try {
      await api.addTransactions(newTransactions);
    } catch (error: any) {
      console.error("Erro ao salvar transação:", error);
      const errorMsg = getErrorMessage(error);
      const lowerMsg = errorMsg.toLowerCase();
      
      // Check for common schema errors
      if (lowerMsg.includes('status') || lowerMsg.includes('column') || lowerMsg.includes('does not exist')) {
        alert(
          "ERRO DE BANCO DE DADOS (Schema Desatualizado):\n\n" +
          "O Supabase rejeitou a gravação porque faltam colunas na tabela.\n\n" +
          "SOLUÇÃO:\n" +
          "1. Vá no Supabase > SQL Editor\n" +
          "2. Execute:\n\n" +
          "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status text DEFAULT 'COMPLETED';\n" +
          "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_current integer;\n" +
          "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_total integer;\n"
        );
       } else {
          alert(`Erro ao salvar no banco: ${errorMsg}`);
       }
      setTransactions(oldTransactions);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
      const oldTransactions = [...transactions];
      setTransactions(transactions.filter(t => t.id !== id)); // Optimistic

      try {
        await api.deleteTransaction(id);
      } catch (error) {
        console.error("Erro ao excluir:", error);
        alert("Erro ao excluir transação.");
        setTransactions(oldTransactions);
      }
  };

  const openEditModal = (t: Transaction) => {
    setEditingTransaction(t);
    setShowTransForm(true);
  };

  // Date Navigation
  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedDate(newDate);
  };

  const formattedMonth = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  
  // Calculate Summary Data
  const summary: FinancialSummary = useMemo(() => {
    // Filter transactions for the selected month using STRING PARSING
    // This avoids timezone issues where '2023-10-01' becomes '2023-09-30' due to local timezone
    const filtered = transactions.filter(t => {
      if (!t.date) return false;
      const [yearStr, monthStr] = t.date.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1; // JS months are 0-indexed
      
      return month === selectedDate.getMonth() && year === selectedDate.getFullYear();
    });

    // Totals (Projected - includes PENDING and COMPLETED)
    const income = filtered.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const expense = filtered.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);

    // Realized (Only COMPLETED)
    const realizedIncome = filtered.filter(t => t.type === 'INCOME' && t.status === 'COMPLETED').reduce((acc, t) => acc + t.amount, 0);
    const realizedExpense = filtered.filter(t => t.type === 'EXPENSE' && t.status === 'COMPLETED').reduce((acc, t) => acc + t.amount, 0);

    const categoryMap = new Map<string, number>();
    filtered.filter(t => t.type === 'EXPENSE').forEach(t => {
      const current = categoryMap.get(t.categoryId) || 0;
      categoryMap.set(t.categoryId, current + t.amount);
    });

    const byCategory = Array.from(categoryMap.entries()).map(([id, value]) => {
      const cat = categories.find(c => c.id === id);
      return {
        name: cat?.name || 'Desconhecido',
        value,
        color: cat?.color || '#cbd5e1'
      };
    }).sort((a, b) => b.value - a.value);

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      realizedIncome,
      realizedExpense,
      realizedBalance: realizedIncome - realizedExpense,
      byCategory,
      transactions: filtered.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
  }, [transactions, selectedDate, categories]);

  // --- RENDERING STATES ---

  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-lg text-center border border-slate-200">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Configuração Necessária</h1>
          <p className="text-slate-600 mb-6">
            Para usar o banco de dados online, você precisa configurar o Supabase.
          </p>
          
          <div className="text-left bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm space-y-3 mb-6">
            <p>1. Abra o arquivo <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">services/supabase.ts</code>.</p>
            <p>2. Substitua <code className="text-red-500">SUPABASE_URL</code> e <code className="text-red-500">SUPABASE_KEY</code> pelos dados do seu projeto Supabase.</p>
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="bg-brand-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-brand-700 w-full"
          >
            Já configurei, recarregar
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
          <p>Sincronizando com o banco de dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <div className="md:w-64 bg-white border-r border-slate-200 flex flex-col md:h-screen sticky top-0 z-10">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <span className="font-bold text-slate-800 text-lg">Finanças.AI</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-x-auto md:overflow-visible flex md:flex-col">
          <button 
            onClick={() => setActiveTab('DASHBOARD')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'DASHBOARD' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button 
             onClick={() => setActiveTab('TRANSACTIONS')}
             className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'TRANSACTIONS' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <List className="w-5 h-5" /> Transações
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
           <div className="flex items-center gap-2 px-4 py-2 text-xs text-green-600 bg-green-50 rounded-lg border border-green-100">
             <Database className="w-3 h-3" />
             <span>Supabase Conectado</span>
           </div>
           <button 
             onClick={() => setShowCatManager(true)}
             className="flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
             <Settings className="w-5 h-5" /> Configurações
           </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        
        {/* Top Bar: Date & Add Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center bg-white rounded-lg shadow-sm border border-slate-200 p-1">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-md text-slate-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 font-semibold text-slate-800 min-w-[160px] text-center capitalize">
              {formattedMonth}
            </span>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-md text-slate-600">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={() => {
              setEditingTransaction(null);
              setShowTransForm(true);
            }}
            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 font-medium transition-transform active:scale-95"
          >
            <Plus className="w-5 h-5" /> Nova Transação
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-8 animate-fadeIn">
            <Dashboard summary={summary} month={formattedMonth} />
            <AiAdvisor summary={summary} categories={categories} monthName={formattedMonth} />
          </div>
        )}

        {activeTab === 'TRANSACTIONS' && (
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn">
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-slate-200">
                   <tr>
                     <th className="px-6 py-4 font-semibold text-slate-600 text-sm w-12 text-center">St</th>
                     <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Data</th>
                     <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Descrição</th>
                     <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Categoria</th>
                     <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Valor</th>
                     <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-center">Ações</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {summary.transactions.length === 0 ? (
                     <tr>
                       <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                         Nenhuma transação encontrada neste mês.
                       </td>
                     </tr>
                   ) : (
                     summary.transactions.map(t => {
                       const category = categories.find(c => c.id === t.categoryId);
                       const subCategory = category?.subCategories.find(s => s.id === t.subCategoryId);
                       return (
                         <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                           <td className="px-6 py-4 text-center">
                              {t.status === 'COMPLETED' ? (
                                <span title="Efetivado" className="inline-flex">
                                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                                </span>
                              ) : (
                                <span title="Pendente/Previsto" className="inline-flex">
                                  <CircleDashed className="w-5 h-5 text-slate-300" />
                                </span>
                              )}
                           </td>
                           <td className="px-6 py-4 text-slate-600 text-sm">
                             {new Date(t.date).toLocaleDateString('pt-BR')}
                           </td>
                           <td className="px-6 py-4">
                             <div className={`font-medium ${t.status === 'COMPLETED' ? 'text-slate-800' : 'text-slate-500 italic'}`}>
                                {t.description}
                             </div>
                             {t.installmentTotal && (
                               <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                 {t.installmentCurrent}/{t.installmentTotal}
                               </span>
                             )}
                           </td>
                           <td className="px-6 py-4">
                             <div className="flex flex-col">
                               <span className="text-sm text-slate-700" style={{ color: category?.color }}>
                                 {category?.name}
                               </span>
                               {subCategory && (
                                 <span className="text-xs text-slate-400">{subCategory.name}</span>
                               )}
                             </div>
                           </td>
                           <td className={`px-6 py-4 text-right font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'} ${t.status === 'PENDING' ? 'opacity-60' : ''}`}>
                             {t.type === 'EXPENSE' ? '- ' : '+ '}
                             R$ {t.amount.toFixed(2)}
                           </td>
                           <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => openEditModal(t)}
                                  className="text-slate-400 hover:text-brand-600 transition-colors"
                                  title="Editar / Confirmar Pagamento"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTransaction(t.id)}
                                  className="text-slate-400 hover:text-red-500 transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                           </td>
                         </tr>
                       );
                     })
                   )}
                 </tbody>
               </table>
             </div>
           </div>
        )}

      </main>

      {/* Modals */}
      {showTransForm && (
        <TransactionForm 
          categories={categories}
          initialData={editingTransaction || undefined}
          onClose={() => setShowTransForm(false)} 
          onSave={handleSaveTransaction}
        />
      )}

      {showCatManager && (
        <CategoryManager 
          categories={categories}
          onUpdateCategories={handleUpdateCategories}
          onClose={() => setShowCatManager(false)}
        />
      )}
    </div>
  );
};

export default App;