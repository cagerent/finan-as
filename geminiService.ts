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
    Atue como um Consultor Financeiro Pessoal de elite, especializado no mercado brasileiro.
    Analise os dados financeiros abaixo referentes ao mês de ${monthName}.
    
    DADOS DO CLIENTE:
    - Total Receitas (Previsto): R$ ${summary.totalIncome.toFixed(2)}
    - Total Receitas (Já realizado): R$ ${summary.realizedIncome.toFixed(2)}
    - Total Despesas (Previsto): R$ ${summary.totalExpense.toFixed(2)}
    - Total Despesas (Já Pago): R$ ${summary.realizedExpense.toFixed(2)}
    - Saldo Projetado (Final do mês): R$ ${summary.balance.toFixed(2)}
    - Saldo Atual (Real): R$ ${summary.realizedBalance.toFixed(2)}
    
    DETALHE DOS GASTOS (PROJETADO POR CATEGORIA):
    ${categorySummary}
    
    SUA MISSÃO:
    1. **Diagnóstico do Orçamento:** Analise se a previsão fecha no azul ou no vermelho. O saldo projetado é positivo?
    2. **Análise de Execução:** Estamos gastando conforme o planejado? (Compare Realizado vs Previsto se relevante).
    3. **Análise de Ofensores:** Identifique qual categoria está drenando o orçamento.
    4. **Plano de Ação (Brasil):**
       - Sugira onde cortar se a projeção for negativa.
       - Sugira investimentos (Selic/CDI/FIIs) se a projeção for positiva.
    
    TOM DE VOZ:
    Seja direto, profissional, mas motivador. Use formatação Markdown (negrito, listas) para facilitar a leitura.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7, // Um pouco mais criativo, mas ainda focado
        systemInstruction: "Você é um especialista em finanças pessoais do Brasil. Você entende de inflação, taxa Selic, CDI e custo de vida brasileiro. Seja objetivo.",
      }
    });
    
    return response.text || "Não foi possível gerar uma análise no momento.";
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);
    return "Desculpe, ocorreu um erro ao tentar analisar seus dados financeiros. Verifique sua conexão ou tente novamente mais tarde.";
  }
};