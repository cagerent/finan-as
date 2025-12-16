import React, { useState } from 'react';
import { Category, SubCategory, TransactionType } from '../types';
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronRight, Save } from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  onUpdateCategories: (categories: Category[]) => void;
  onClose: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onUpdateCategories, onClose }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // New Category State
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<TransactionType>('EXPENSE');
  const [newCatColor, setNewCatColor] = useState('#64748b');

  // Edit Category State
  const [editCatName, setEditCatName] = useState('');
  const [editCatType, setEditCatType] = useState<TransactionType>('EXPENSE');
  const [editCatColor, setEditCatColor] = useState('');

  // New SubCategory State
  const [newSubCatName, setNewSubCatName] = useState('');
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null);

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCategory: Category = {
      id: crypto.randomUUID(),
      name: newCatName,
      type: newCatType,
      color: newCatColor,
      subCategories: []
    };
    onUpdateCategories([...categories, newCategory]);
    setNewCatName('');
    setNewCatColor('#64748b');
  };

  const handleStartEditing = (category: Category) => {
    setEditingId(category.id);
    setEditCatName(category.name);
    setEditCatType(category.type);
    setEditCatColor(category.color);
    setExpandedId(null); // Collapse while editing to avoid UI clutter
  };

  const handleSaveEdit = () => {
    if (!editCatName.trim() || !editingId) return;
    
    const updated = categories.map(cat => {
      if (cat.id === editingId) {
        return {
          ...cat,
          name: editCatName,
          type: editCatType,
          color: editCatColor
        };
      }
      return cat;
    });

    onUpdateCategories(updated);
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Tem certeza? Isso excluirá a categoria e suas subcategorias.')) {
      onUpdateCategories(categories.filter(c => c.id !== id));
    }
  };

  const handleAddSubCategory = (categoryId: string) => {
    if (!newSubCatName.trim()) return;
    const updated = categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          subCategories: [...cat.subCategories, { id: crypto.randomUUID(), name: newSubCatName }]
        };
      }
      return cat;
    });
    onUpdateCategories(updated);
    setNewSubCatName('');
    setAddingSubTo(null);
  };

  const handleDeleteSubCategory = (categoryId: string, subId: string) => {
    const updated = categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          subCategories: cat.subCategories.filter(s => s.id !== subId)
        };
      }
      return cat;
    });
    onUpdateCategories(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Gerenciar Categorias</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Add New Category Form */}
          <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-600 mb-3">Nova Categoria</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                placeholder="Nome da Categoria" 
                className="flex-1 px-3 py-2 border rounded-md"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
              />
              <select 
                className="px-3 py-2 border rounded-md bg-white"
                value={newCatType}
                onChange={e => setNewCatType(e.target.value as TransactionType)}
              >
                <option value="EXPENSE">Despesa</option>
                <option value="INCOME">Receita</option>
              </select>
              <input 
                type="color" 
                className="h-10 w-12 cursor-pointer border rounded-md"
                value={newCatColor}
                onChange={e => setNewCatColor(e.target.value)}
              />
              <button 
                onClick={handleAddCategory}
                className="bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </div>
          </div>

          {/* List Categories */}
          <div className="space-y-3">
            {categories.map(category => (
              <div key={category.id} className="border border-slate-200 rounded-lg overflow-hidden">
                
                {editingId === category.id ? (
                  // EDIT MODE
                  <div className="p-3 bg-brand-50 flex flex-col sm:flex-row gap-2 items-center">
                     <input 
                        type="text" 
                        className="flex-1 px-2 py-1 border rounded text-sm"
                        value={editCatName}
                        onChange={e => setEditCatName(e.target.value)}
                      />
                      <select 
                        className="px-2 py-1 border rounded text-sm bg-white"
                        value={editCatType}
                        onChange={e => setEditCatType(e.target.value as TransactionType)}
                      >
                        <option value="EXPENSE">Despesa</option>
                        <option value="INCOME">Receita</option>
                      </select>
                      <input 
                        type="color" 
                        className="h-8 w-10 cursor-pointer border rounded"
                        value={editCatColor}
                        onChange={e => setEditCatColor(e.target.value)}
                      />
                      <div className="flex gap-1">
                        <button onClick={handleSaveEdit} className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600">
                          <Save className="w-4 h-4" />
                        </button>
                        <button onClick={handleCancelEdit} className="p-1.5 bg-slate-300 text-slate-700 rounded hover:bg-slate-400">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                  </div>
                ) : (
                  // VIEW MODE
                  <div className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setExpandedId(expandedId === category.id ? null : category.id)}>
                      {expandedId === category.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: category.color }}></div>
                      <span className="font-medium text-slate-700">{category.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${category.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {category.type === 'INCOME' ? 'Receita' : 'Despesa'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleStartEditing(category)}
                        className="text-slate-400 hover:text-brand-600 p-1.5 rounded-full hover:bg-slate-100"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-slate-100"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Subcategories Area */}
                {expandedId === category.id && !editingId && (
                  <div className="bg-slate-50 p-3 border-t border-slate-100 pl-10 animate-fadeIn">
                    <div className="space-y-2 mb-3">
                      {category.subCategories.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between text-sm group hover:bg-slate-100 p-1 rounded">
                          <span className="text-slate-600">- {sub.name}</span>
                          <button 
                            onClick={() => handleDeleteSubCategory(category.id, sub.id)}
                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {category.subCategories.length === 0 && <span className="text-xs text-slate-400 italic">Sem subcategorias</span>}
                    </div>
                    
                    {addingSubTo === category.id ? (
                       <div className="flex gap-2">
                         <input 
                           autoFocus
                           className="flex-1 px-2 py-1 text-sm border rounded shadow-sm"
                           placeholder="Nome da subcategoria"
                           value={newSubCatName}
                           onChange={e => setNewSubCatName(e.target.value)}
                         />
                         <button onClick={() => handleAddSubCategory(category.id)} className="bg-green-500 text-white p-1 rounded hover:bg-green-600"><Check className="w-4 h-4" /></button>
                         <button onClick={() => setAddingSubTo(null)} className="bg-slate-300 text-slate-700 p-1 rounded hover:bg-slate-400"><X className="w-4 h-4" /></button>
                       </div>
                    ) : (
                      <button 
                        onClick={() => setAddingSubTo(category.id)}
                        className="text-sm text-brand-600 hover:underline flex items-center gap-1 mt-2 font-medium"
                      >
                        <Plus className="w-3 h-3" /> Nova Subcategoria
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};