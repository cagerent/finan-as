import React, { useState, useEffect } from 'react';
import { Category, TransactionType, Transaction, SubCategory, TransactionStatus } from '../types';
import { X, Calendar, DollarSign, Tag, Layers, CheckCircle2, CircleDashed, AlertCircle } from 'lucide-react';

interface TransactionFormProps {
  categories: Category[];
  initialData?: Transaction; // For editing
  onSave: (transaction: Omit<Transaction, 'id'>, installments: number, isEditing: boolean) => void;
  onClose: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ categories, initialData, onSave, onClose }) => {
  
  // Helper to get today's date in local string YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [type, setType] = useState<TransactionType>(initialData?.type || 'EXPENSE');
  const [status, setStatus] = useState<TransactionStatus>(initialData?.status || 'COMPLETED');
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState(initialData?.date || getTodayString());
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [subCategoryId, setSubCategoryId] = useState(initialData?.subCategoryId || '');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState(2);
  const [error, setError] = useState<string | null>(null);

  // Filter categories by type
  const filteredCategories = categories.filter(c => c.type === type);

  // Reset category selection when type changes (only if not editing initial load)
  useEffect(() => {
    // Se estivermos editando e o tipo selecionado for igual ao original, não reseta, mantém a categoria original
    if (initialData && initialData.type === type) {
       setCategoryId(initialData.categoryId);
       setSubCategoryId(initialData.subCategoryId || '');
       return;
    }
    // Se mudou o tipo (ex: Despesa -> Receita), limpa a categoria para o usuário escolher uma nova
    setCategoryId('');
    setSubCategoryId('');
  }, [type, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Replace comma with dot for brazilian currency format support
    const normalizedAmount = amount.replace(',', '.');
    const parsedAmount = parseFloat(normalizedAmount);

    if (!amount || isNaN(parsedAmount)) {
      setError('Por favor, insira um valor válido.');
      return;
    }
    if (!description.trim()) {
      setError('Por favor, insira uma descrição.');
      return;
    }
    if (!categoryId) {
      setError('Por favor, selecione uma categoria.');
      return;
    }

    onSave({
      ...(initialData ? { id: initialData.id } : {}), // Keep ID if editing
      date,
      description,
      amount: parsedAmount,
      type,
      status,
      categoryId,
      subCategoryId: subCategoryId || undefined,
    } as any, isInstallment ? installments : 1, !!initialData);
    
    onClose();
  };

  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fadeIn">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

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

          {/* Status Toggle (Realized vs Predicted) */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setStatus(status === 'COMPLETED' ? 'PENDING' : 'COMPLETED')}>
             <div className="flex items-center gap-3">
               {status === 'COMPLETED' ? (
                 <CheckCircle2 className="w-6 h-6 text-green-500" />
               ) : (
                 <CircleDashed className="w-6 h-6 text-slate-400" />
               )}
               <div className="flex flex-col">
                 <span className={`font-semibold text-sm ${status === 'COMPLETED' ? 'text-green-700' : 'text-slate-600'}`}>
                   {status === 'COMPLETED' ? (type === 'INCOME' ? 'Recebido' : 'Pago') : (type === 'INCOME' ? 'A Receber' : 'A Pagar')}
                 </span>
                 <span className="text-xs text-slate-500">
                   {status === 'COMPLETED' ? 'Valor efetivado no saldo' : 'Valor é uma previsão'}
                 </span>
               </div>
             </div>
             <div className={`w-10 h-5 rounded-full relative transition-colors ${status === 'COMPLETED' ? 'bg-green-500' : 'bg-slate-300'}`}>
               <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${status === 'COMPLETED' ? 'left-6' : 'left-1'}`}></div>
             </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Valor {status === 'PENDING' && '(Previsto)'}</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
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
              placeholder="Ex: Conta de Luz (Estimativa)"
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
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white ${!categoryId ? 'border-red-300' : 'border-slate-300'}`}
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

          {/* Installments / Recurring Option - Only show when creating new */}
          {!initialData && (
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
                    <span className="text-xs text-slate-400">Parcelas futuras ficarão como "Pendentes"</span>
                  </div>
                )}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30"
          >
            {initialData ? 'Atualizar Transação' : 'Salvar Transação'}
          </button>
        </form>
      </div>
    </div>
  );
};