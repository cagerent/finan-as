import React, { useState, useEffect } from 'react';
import { Category, TransactionType, Transaction, SubCategory } from '../types';
import { X, Calendar, DollarSign, Tag, Layers } from 'lucide-react';

interface TransactionFormProps {
  categories: Category[];
  onSave: (transaction: Omit<Transaction, 'id'>, installments: number) => void;
  onClose: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ categories, onSave, onClose }) => {
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState(2);

  // Filter categories by type
  const filteredCategories = categories.filter(c => c.type === type);

  // Reset category selection when type changes
  useEffect(() => {
    setCategoryId('');
    setSubCategoryId('');
  }, [type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !categoryId) return;

    onSave({
      date,
      description,
      amount: parseFloat(amount),
      type,
      categoryId,
      subCategoryId: subCategoryId || undefined,
    }, isInstallment ? installments : 1);
    
    onClose();
  };

  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Nova Transação</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Type Toggle */}
          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`py-2 text-sm font-medium rounded-md transition-colors ${type === 'INCOME' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Entrada
            </button>
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`py-2 text-sm font-medium rounded-md transition-colors ${type === 'EXPENSE' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Saída
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Valor</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Descrição</label>
            <input
              type="text"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              placeholder="Ex: Supermercado Semanal"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Data</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Categoria</label>
            <div className="relative">
              <Layers className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <select
                required
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
              >
                <option value="">Selecione...</option>
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

           {/* SubCategory - Only if category selected and has subs */}
           {selectedCategory && selectedCategory.subCategories.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Subcategoria</label>
              <div className="relative">
                <Tag className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <select
                  value={subCategoryId}
                  onChange={e => setSubCategoryId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                >
                  <option value="">Selecione (Opcional)...</option>
                  {selectedCategory.subCategories.map((sub: SubCategory) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            </div>
           )}

          {/* Installments / Recurring Option - Available for BOTH Expense and Income */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <input 
                  type="checkbox" 
                  id="installments" 
                  checked={isInstallment}
                  onChange={e => setIsInstallment(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                />
                <label htmlFor="installments" className="text-sm font-medium text-slate-700">
                  {type === 'EXPENSE' ? 'Parcelar / Repetir' : 'Repetir Mensalmente'}
                </label>
              </div>
              
              {isInstallment && (
                <div className="flex items-center gap-3 animate-fadeIn">
                  <span className="text-sm text-slate-500">
                    {type === 'EXPENSE' ? 'Parcelas' : 'Meses'}:
                  </span>
                  <input 
                    type="number" 
                    min="2" 
                    max="60"
                    value={installments}
                    onChange={e => setInstallments(parseInt(e.target.value))}
                    className="w-16 px-2 py-1 border rounded text-center"
                  />
                  <span className="text-sm text-slate-500">meses futuros</span>
                </div>
              )}
          </div>

          <button
            type="submit"
            className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30"
          >
            Salvar Transação
          </button>
        </form>
      </div>
    </div>
  );
};