import { GoogleGenAI } from "@google/genai";
import { FinancialSummary, Category } from '../types';

export const generateFinancialInsights = async (
  summary: FinancialSummary,
  categories: Category[],
  monthName: string
): Promise<string> => {
  // Tenta ler a chave de diferentes formas para garantir compatibilidade (Vite, Vercel, Node)
  const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY || (import.meta as any).env?.API_KEY;

  if (!apiKey) {
    return "Erro: Chave de API do Gemini não configurada. Configure a variável de ambiente API_KEY.";
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  // Prepare data for the prompt
  const categorySummary = summary.byCategory
    .map(c => `- ${c.name}: R$ ${c.value.toFixed(2)}`)
    .join('\n');

  const prompt = `
    Você é um consultor financeiro familiar especialista e empático.
    Analise os dados financeiros abaixo referentes ao mês de ${monthName}.
    
    Resumo:
    - Total Receitas: R$ ${summary.totalIncome.toFixed(2)}
    - Total Despesas: R$ ${summary.totalExpense.toFixed(2)}
    - Saldo: R$ ${summary.balance.toFixed(2)}
    
    Gastos por Categoria:
    ${categorySummary}
    
    Por favor, forneça:
    1. Uma breve análise da saúde financeira deste mês.
    2. Identifique onde estão os maiores gastos.
    3. Dê 3 dicas práticas e acionáveis para economizar ou investir melhor no próximo mês, considerando o contexto brasileiro.
    
    Se o saldo for negativo, seja encorajador mas firme sobre a necessidade de cortes.
    Se for positivo, sugira como investir o excedente.
    Mantenha a resposta concisa, usando formatação Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "Você é um assistente financeiro pessoal, focado em ajudar famílias a prosperar financeiramente.",
      }
    });
    
    return response.text || "Não foi possível gerar uma análise no momento.";
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);
    return "Desculpe, ocorreu um erro ao tentar analisar seus dados financeiros. Verifique sua conexão ou tente novamente mais tarde.";
  }
};