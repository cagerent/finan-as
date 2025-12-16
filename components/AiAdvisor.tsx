import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { FinancialSummary, Category } from '../types';
import { generateFinancialInsights } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface AiAdvisorProps {
  summary: FinancialSummary;
  categories: Category[];
  monthName: string;
}

export const AiAdvisor: React.FC<AiAdvisorProps> = ({ summary, categories, monthName }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGetInsight = async () => {
    setLoading(true);
    const result = await generateFinancialInsights(summary, categories, monthName);
    setInsight(result);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl shadow-lg text-white p-6 relative overflow-hidden">
      {/* Decorative background circles */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-2xl"></div>
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-white opacity-10 blur-2xl"></div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-lg">
            <Sparkles className="w-6 h-6 text-yellow-300" />
          </div>
          <h2 className="text-xl font-bold">Assistente Inteligente Gemini</h2>
        </div>

        {!insight && !loading && (
          <div className="text-center py-6">
            <p className="mb-4 text-indigo-100">
              Obtenha uma análise personalizada das suas finanças deste mês com inteligência artificial.
            </p>
            <button 
              onClick={handleGetInsight}
              className="bg-white text-indigo-700 px-6 py-2 rounded-full font-semibold hover:bg-indigo-50 transition-colors shadow-lg"
            >
              Gerar Análise
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-8 text-indigo-100 animate-pulse">
            <RefreshCw className="w-8 h-8 animate-spin mb-3" />
            <p>Analisando seus dados...</p>
          </div>
        )}

        {insight && (
          <div className="bg-white/10 rounded-lg p-4 text-sm leading-relaxed text-indigo-50 max-h-96 overflow-y-auto custom-scrollbar">
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{insight}</ReactMarkdown>
            </div>
            <button 
              onClick={handleGetInsight} 
              className="mt-4 text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-white flex items-center gap-1 w-fit"
            >
              <RefreshCw className="w-3 h-3" /> Atualizar Análise
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
