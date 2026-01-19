import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc.js";
import { invokeLLM } from "../_core/llm.js";
import * as db from "../db.js";

// Tipos de tom para legendas
const toneOptions = ["formal", "casual", "divertido", "inspirador", "profissional", "urgente"] as const;
type Tone = typeof toneOptions[number];

// Tipos de plataforma
const platformOptions = ["instagram", "tiktok", "linkedin", "facebook", "twitter"] as const;
type Platform = typeof platformOptions[number];

// Tipos de nicho
const nicheOptions = [
  "fitness", "moda", "gastronomia", "tecnologia", "beleza", "viagem",
  "educacao", "negocios", "saude", "lifestyle", "pets", "arte", "musica", "esportes"
] as const;

export const captionsRouter = router({
  // Gerar legenda com IA
  generate: protectedProcedure
    .input(z.object({
      topic: z.string().min(1, "Descreva o tema do post"),
      tone: z.enum(toneOptions).default("casual"),
      platform: z.enum(platformOptions).default("instagram"),
      niche: z.enum(nicheOptions).optional(),
      includeHashtags: z.boolean().default(true),
      includeEmojis: z.boolean().default(true),
      includeCTA: z.boolean().default(false),
      maxLength: z.number().min(50).max(2200).default(300),
      language: z.string().default("pt-BR"),
    }))
    .mutation(async ({ ctx, input }) => {
      const toneDescriptions: Record<Tone, string> = {
        formal: "formal, profissional e respeitoso",
        casual: "casual, amigável e descontraído",
        divertido: "divertido, com humor e leve",
        inspirador: "inspirador, motivacional e positivo",
        profissional: "profissional, técnico e informativo",
        urgente: "urgente, com senso de escassez e ação imediata",
      };

      const platformGuidelines: Record<Platform, string> = {
        instagram: "Instagram (máximo 2200 caracteres, hashtags no final, emojis moderados)",
        tiktok: "TikTok (curto e direto, trending hashtags, linguagem jovem)",
        linkedin: "LinkedIn (profissional, sem muitos emojis, hashtags relevantes)",
        facebook: "Facebook (conversacional, pode ser mais longo, poucos hashtags)",
        twitter: "Twitter/X (máximo 280 caracteres, conciso e impactante)",
      };

      const systemPrompt = `Você é um especialista em copywriting para redes sociais. 
Sua tarefa é criar legendas envolventes e otimizadas para engajamento.
Sempre responda em ${input.language}.
Siga as melhores práticas de cada plataforma.`;

      const userPrompt = `Crie uma legenda para ${platformGuidelines[input.platform]}.

TEMA: ${input.topic}
TOM: ${toneDescriptions[input.tone]}
${input.niche ? `NICHO: ${input.niche}` : ""}
TAMANHO MÁXIMO: ${input.maxLength} caracteres

REQUISITOS:
${input.includeHashtags ? "- Inclua 5-10 hashtags relevantes no final" : "- NÃO inclua hashtags"}
${input.includeEmojis ? "- Use emojis de forma estratégica para aumentar engajamento" : "- NÃO use emojis"}
${input.includeCTA ? "- Inclua uma chamada para ação (CTA) clara" : ""}

Responda APENAS com a legenda pronta, sem explicações adicionais.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const rawCaption = response.choices[0]?.message?.content;
      const caption = typeof rawCaption === 'string' ? rawCaption : '';

      // Salvar no histórico
      await db.saveCaptionHistory({
        userId: ctx.user.id,
        topic: input.topic,
        tone: input.tone,
        platform: input.platform,
        niche: input.niche || null,
        generatedCaption: caption,
        includeHashtags: input.includeHashtags,
        includeEmojis: input.includeEmojis,
        includeCTA: input.includeCTA,
      });

      return {
        caption,
        characterCount: caption.length,
        platform: input.platform,
        tone: input.tone,
      };
    }),

  // Gerar variações de uma legenda
  generateVariations: protectedProcedure
    .input(z.object({
      originalCaption: z.string().min(1),
      platform: z.enum(platformOptions).default("instagram"),
      count: z.number().min(1).max(5).default(3),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Você é um especialista em copywriting. Crie variações criativas de legendas mantendo a essência da mensagem original.",
          },
          {
            role: "user",
            content: `Crie ${input.count} variações diferentes da seguinte legenda para ${input.platform}:

"${input.originalCaption}"

Cada variação deve ter um estilo ligeiramente diferente (mais formal, mais casual, mais direto, etc).
Responda em formato JSON: { "variations": ["variação 1", "variação 2", ...] }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "caption_variations",
            strict: true,
            schema: {
              type: "object",
              properties: {
                variations: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["variations"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent) || '{"variations":[]}';
      const parsed = JSON.parse(content);

      return {
        original: input.originalCaption,
        variations: parsed.variations,
      };
    }),

  // Gerar hashtags relevantes
  generateHashtags: protectedProcedure
    .input(z.object({
      topic: z.string().min(1),
      platform: z.enum(platformOptions).default("instagram"),
      niche: z.enum(nicheOptions).optional(),
      count: z.number().min(5).max(30).default(15),
      includeTrending: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Você é um especialista em hashtags para redes sociais. Gere hashtags relevantes e otimizadas para alcance.",
          },
          {
            role: "user",
            content: `Gere ${input.count} hashtags para ${input.platform} sobre o tema: "${input.topic}"
${input.niche ? `Nicho: ${input.niche}` : ""}
${input.includeTrending ? "Inclua hashtags populares/trending quando relevante." : ""}

Responda em formato JSON: { "hashtags": ["#hashtag1", "#hashtag2", ...], "categories": { "popular": [...], "nicho": [...], "especifico": [...] } }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "hashtags_result",
            strict: true,
            schema: {
              type: "object",
              properties: {
                hashtags: {
                  type: "array",
                  items: { type: "string" },
                },
                categories: {
                  type: "object",
                  properties: {
                    popular: { type: "array", items: { type: "string" } },
                    nicho: { type: "array", items: { type: "string" } },
                    especifico: { type: "array", items: { type: "string" } },
                  },
                  required: ["popular", "nicho", "especifico"],
                  additionalProperties: false,
                },
              },
              required: ["hashtags", "categories"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent2 = response.choices[0]?.message?.content;
      const content = typeof rawContent2 === 'string' ? rawContent2 : JSON.stringify(rawContent2) || '{"hashtags":[],"categories":{"popular":[],"nicho":[],"especifico":[]}}';
      return JSON.parse(content);
    }),

  // Listar histórico de legendas geradas
  history: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      return await db.getCaptionHistory(ctx.user.id, input.limit, input.offset);
    }),

  // Favoritar uma legenda do histórico
  favorite: protectedProcedure
    .input(z.object({
      captionId: z.number(),
      isFavorite: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.toggleCaptionFavorite(ctx.user.id, input.captionId, input.isFavorite);
      return { success: true };
    }),

  // Listar legendas favoritas
  favorites: protectedProcedure.query(async ({ ctx }) => {
    return await db.getFavoriteCaptions(ctx.user.id);
  }),

  // Obter opções disponíveis
  options: protectedProcedure.query(() => {
    return {
      tones: toneOptions,
      platforms: platformOptions,
      niches: nicheOptions,
    };
  }),
});
