import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { FinancialSummary } from '../types';
import { ArrowUpCircle, ArrowDownCircle, Wallet, CheckCircle2, CircleDashed, TrendingUp, TrendingDown, Clock, AlertCircle } from 'lucide-react';

interface DashboardProps {
  summary: FinancialSummary;
  month: string;
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ summary }) => {
  
  // Dados para o gráfico de barras comparativo
  const barData = useMemo(() => [
    { name: 'Planejado', Receitas: summary.totalIncome, Despesas: summary.totalExpense },
    { name: 'Realizado', Receitas: summary.realizedIncome, Despesas: summary.realizedExpense },
  ], [summary]);

  // Cálculos de pendências
  const pendingIncome = summary.totalIncome - summary.realizedIncome;
  const pendingExpense = summary.totalExpense - summary.realizedExpense;

  // Porcentagens de conclusão
  const incomeProgress = summary.totalIncome > 0 ? (summary.realizedIncome / summary.totalIncome) * 100 : 0;
  const expenseProgress = summary.totalExpense > 0 ? (summary.realizedExpense / summary.totalExpense) * 100 : 0;

  return (
    <div className="space-y-8 pb-8">
      
      {/* SEÇÃO 1: PREVISÃO (O que está planejado/agendado) */}
      <section>
        <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
          <div className="p-1.5 bg-slate-100 rounded-lg">
            <CircleDashed className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Previsão Mensal</h3>
            <p className="text-xs text-slate-400">Expectativa de fechamento se tudo ocorrer como agendado</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card: Receita Prevista */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500 font-medium">Receita Prevista</p>
              <div className="p-1.5 bg-emerald-50 rounded-full">
                <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-700">
              R$ {summary.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            
            {/* Indicador de Pendência */}
            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
               <span className="text-slate-400">Falta receber:</span>
               <span className={`flex items-center gap-1 font-medium ${pendingIncome > 0 ? 'text-orange-500' : 'text-slate-400'}`}>
                 <Clock className="w-3 h-3" /> 
                 R$ {pendingIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
               </span>
            </div>
          </div>

          {/* Card: Despesa Prevista */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-rose-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500 font-medium">Despesa Prevista</p>
              <div className="p-1.5 bg-rose-50 rounded-full">
                <ArrowDownCircle className="w-5 h-5 text-rose-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-700">
              R$ {summary.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            
            {/* Indicador de Pendência */}
            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
               <span className="text-slate-400">Falta pagar:</span>
               <span className={`flex items-center gap-1 font-medium ${pendingExpense > 0 ? 'text-orange-500' : 'text-slate-400'}`}>
                 <Clock className="w-3 h-3" /> 
                 R$ {pendingExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
               </span>
            </div>
          </div>

          {/* Card: Saldo Projetado */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500 font-medium">Saldo Projetado</p>
              <div className="p-1.5 bg-blue-50 rounded-full">
                <Wallet className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <h3 className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              R$ {summary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            
            <div className="mt-4 pt-3 border-t border-slate-50 text-xs text-slate-400">
               Estimativa final do mês
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: EFETIVADO (O que realmente aconteceu) */}
      <section>
        <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
          <div className="p-1.5 bg-brand-100 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Fluxo Real (Efetivado)</h3>
            <p className="text-xs text-slate-400">O que já impactou sua conta bancária</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card: Receita Efetiva */}
          <div className="bg-white p-5 rounded-xl shadow-md border border-emerald-100 relative overflow-hidden group">
             {/* Icone decorativo fundo */}
             <div className="absolute -top-2 -right-2 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingUp className="w-20 h-20 text-emerald-600" />
             </div>

             <div className="relative z-10">
               <div className="flex items-center gap-2 mb-3">
                 <div className="p-2 bg-emerald-100 rounded-lg">
                   <ArrowUpCircle className="w-5 h-5 text-emerald-700" />
                 </div>
                 <p className="text-sm text-slate-600 font-bold">Receita Efetiva</p>
               </div>
               
               <h3 className="text-3xl font-bold text-emerald-700 tracking-tight">
                 R$ {summary.realizedIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
               </h3>

               {/* Barra de Progresso */}
               <div className="mt-4">
                 <div className="flex justify-between text-xs mb-1">
                   <span className="text-slate-500 font-medium">{incomeProgress.toFixed(0)}% do previsto</span>
                 </div>
                 <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(incomeProgress, 100)}%` }}
                    ></div>
                 </div>
               </div>
             </div>
          </div>

          {/* Card: Despesa Efetiva */}
          <div className="bg-white p-5 rounded-xl shadow-md border border-rose-100 relative overflow-hidden group">
             <div className="absolute -top-2 -right-2 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingDown className="w-20 h-20 text-rose-600" />
             </div>

             <div className="relative z-10">
               <div className="flex items-center gap-2 mb-3">
                 <div className="p-2 bg-rose-100 rounded-lg">
                   <ArrowDownCircle className="w-5 h-5 text-rose-700" />
                 </div>
                 <p className="text-sm text-slate-600 font-bold">Despesa Efetiva</p>
               </div>
               
               <h3 className="text-3xl font-bold text-rose-700 tracking-tight">
                 R$ {summary.realizedExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
               </h3>

               {/* Barra de Progresso */}
               <div className="mt-4">
                 <div className="flex justify-between text-xs mb-1">
                   <span className="text-slate-500 font-medium">{expenseProgress.toFixed(0)}% do previsto</span>
                 </div>
                 <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(expenseProgress, 100)}%` }}
                    ></div>
                 </div>
               </div>
             </div>
          </div>

          {/* Card: Saldo Real */}
          <div className={`bg-white p-5 rounded-xl shadow-md border ${summary.realizedBalance >= 0 ? 'border-blue-100' : 'border-orange-100'} relative overflow-hidden`}>
             <div className="relative z-10 flex flex-col h-full justify-between">
               <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-2 rounded-lg ${summary.realizedBalance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                      <Wallet className={`w-5 h-5 ${summary.realizedBalance >= 0 ? 'text-blue-700' : 'text-orange-700'}`} />
                    </div>
                    <p className="text-sm text-slate-600 font-bold">Saldo Real (Hoje)</p>
                  </div>
                  
                  <h3 className={`text-4xl font-bold tracking-tight mt-2 ${summary.realizedBalance >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>
                    R$ {summary.realizedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
               </div>
               
               <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 inline-block w-full text-center">
                 Dinheiro disponível em caixa
               </div>
             </div>
          </div>

        </div>
      </section>

      {/* Seção de Gráficos */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        
        {/* Gráfico: Despesas por Categoria */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-slate-400" />
            Despesas por Categoria
          </h3>
          
          {summary.byCategory.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.byCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {summary.byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <AlertCircle className="w-10 h-10 mb-2 opacity-50" />
              <p>Sem despesas registradas neste mês.</p>
            </div>
          )}
        </div>

        {/* Gráfico: Comparativo Previsto vs Realizado */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <BarChart className="w-5 h-5 text-slate-400" />
            Previsto vs Realizado
          </h3>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={50} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
};