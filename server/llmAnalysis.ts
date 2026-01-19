import { invokeLLM } from "./_core/llm";
import type { Campaign } from "../drizzle/schema";

export interface AnalysisResult {
  recommendations: Array<{
    type: "posting_time" | "product_boost" | "lead_generation" | "traffic_optimization";
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
  }>;
  insights: string;
}

export async function analyzeCampaigns(
  campaigns: Campaign[],
  niche?: string
): Promise<AnalysisResult> {
  if (campaigns.length === 0) {
    return {
      recommendations: [],
      insights: "Nenhuma campanha disponível para análise.",
    };
  }

  // Prepare campaign data for analysis
  const campaignSummary = campaigns.map(c => ({
    name: c.name,
    platform: c.platform,
    startDate: c.startDate,
    endDate: c.endDate,
    metrics: c.metrics,
  }));

  const prompt = `Você é um especialista em marketing digital e análise de campanhas. Analise os dados das campanhas abaixo e forneça recomendações estratégicas.

${niche ? `Nicho/Setor: ${niche}` : ""}

Dados das Campanhas:
${JSON.stringify(campaignSummary, null, 2)}

Com base nesses dados, forneça:
1. Análise geral do desempenho
2. Recomendações específicas para:
   - Melhores horários para postar (posting_time)
   - Produtos ou conteúdos para impulsionar (product_boost)
   - Estratégias para geração de leads (lead_generation)
   - Otimização de tráfego pago (traffic_optimization)

Cada recomendação deve ter:
- type: um dos tipos acima
- title: título curto e direto
- description: descrição detalhada com ações específicas
- priority: "low", "medium" ou "high"

Retorne no formato JSON:
{
  "insights": "análise geral em texto",
  "recommendations": [
    {
      "type": "posting_time",
      "title": "título",
      "description": "descrição detalhada",
      "priority": "high"
    }
  ]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Você é um especialista em marketing digital focado em análise de dados e otimização de campanhas.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "campaign_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              insights: {
                type: "string",
                description: "Análise geral do desempenho das campanhas",
              },
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["posting_time", "product_boost", "lead_generation", "traffic_optimization"],
                    },
                    title: {
                      type: "string",
                      description: "Título curto da recomendação",
                    },
                    description: {
                      type: "string",
                      description: "Descrição detalhada com ações específicas",
                    },
                    priority: {
                      type: "string",
                      enum: ["low", "medium", "high"],
                    },
                  },
                  required: ["type", "title", "description", "priority"],
                  additionalProperties: false,
                },
              },
            },
            required: ["insights", "recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const message = response.choices[0]?.message;
    if (!message?.content) {
      throw new Error("No response from LLM");
    }

    const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
    const result = JSON.parse(content) as AnalysisResult;
    return result;
  } catch (error) {
    console.error("Error analyzing campaigns:", error);
    throw new Error("Falha ao analisar campanhas com IA");
  }
}

export async function generatePostingRecommendation(
  niche: string,
  platform: string
): Promise<string> {
  const prompt = `Como especialista em marketing digital, recomende os melhores horários para postar no ${platform} para o nicho de ${niche}. 
  
Considere:
- Comportamento do público-alvo
- Horários de pico de engajamento
- Dias da semana mais efetivos
- Frequência ideal de postagens

Forneça uma recomendação clara e prática.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Você é um especialista em marketing digital e estratégia de conteúdo.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const message = response.choices[0]?.message;
    if (!message?.content) {
      return "Não foi possível gerar recomendação.";
    }
    return typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
  } catch (error) {
    console.error("Error generating posting recommendation:", error);
    throw new Error("Falha ao gerar recomendação");
  }
}
