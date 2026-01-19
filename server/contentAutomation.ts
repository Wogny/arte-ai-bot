import { invokeLLM } from "./_core/llm";
import sharp from "sharp";

/**
 * Configurações de cada plataforma para adaptação de conteúdo
 */
export const PLATFORM_CONFIGS = {
  instagram: {
    name: "Instagram",
    imageSize: { width: 1080, height: 1080 },
    videoSize: { width: 1080, height: 1350 },
    textLimit: 2200,
    hashtagLimit: 30,
    bestHashtags: 15,
    format: "square",
    description: "Posts quadrados com foco em imagem",
  },
  tiktok: {
    name: "TikTok",
    imageSize: { width: 1080, height: 1920 },
    videoSize: { width: 1080, height: 1920 },
    textLimit: 150,
    hashtagLimit: 5,
    bestHashtags: 3,
    format: "vertical",
    description: "Vídeos verticais curtos e dinâmicos",
  },
  facebook: {
    name: "Facebook",
    imageSize: { width: 1200, height: 628 },
    videoSize: { width: 1280, height: 720 },
    textLimit: 3000,
    hashtagLimit: 10,
    bestHashtags: 5,
    format: "horizontal",
    description: "Posts horizontais com texto longo",
  },
  linkedin: {
    name: "LinkedIn",
    imageSize: { width: 1200, height: 627 },
    videoSize: { width: 1280, height: 720 },
    textLimit: 3000,
    hashtagLimit: 5,
    bestHashtags: 3,
    format: "professional",
    description: "Conteúdo profissional e corporativo",
  },
  twitter: {
    name: "Twitter/X",
    imageSize: { width: 1024, height: 512 },
    videoSize: { width: 1024, height: 576 },
    textLimit: 280,
    hashtagLimit: 2,
    bestHashtags: 1,
    format: "compact",
    description: "Posts curtos e diretos",
  },
};

export type PlatformType = keyof typeof PLATFORM_CONFIGS;

/**
 * Interface para conteúdo adaptado
 */
export interface AdaptedContent {
  platform: PlatformType;
  text: string;
  hashtags: string[];
  imageUrl?: string;
  videoUrl?: string;
  bestPostingTime: string;
  characterCount: number;
  estimatedReach: number;
}

/**
 * Adaptar imagem para tamanho específico da plataforma
 */
export async function adaptImage(
  imageBuffer: Buffer,
  platform: PlatformType
): Promise<Buffer> {
  const config = PLATFORM_CONFIGS[platform];

  try {
    const adapted = await sharp(imageBuffer)
      .resize(config.imageSize.width, config.imageSize.height, {
        fit: "cover",
        position: "center",
      })
      .toBuffer();

    return adapted;
  } catch (error) {
    console.error(`Erro ao adaptar imagem para ${platform}:`, error);
    throw error;
  }
}

/**
 * Gerar variação de texto para cada plataforma
 */
export async function generateTextVariation(
  originalText: string,
  platform: PlatformType,
  context?: {
    niche?: string;
    brand?: string;
    tone?: "professional" | "casual" | "funny" | "inspirational";
  }
): Promise<string> {
  const config = PLATFORM_CONFIGS[platform];
  const platformGuide = {
    instagram: "Engajador, com emojis, storytelling visual",
    tiktok: "Curto, viral, com trends, linguagem jovem",
    facebook: "Informativo, com CTA, direcionado a família",
    linkedin: "Profissional, insights, pensamento estratégico",
    twitter: "Direto, opinião, conversacional",
  };

  const prompt = `Adapte este texto para ${config.name}:
    
Texto original: "${originalText}"

Guia de tom: ${platformGuide[platform]}
Limite de caracteres: ${config.textLimit}
Nicho: ${context?.niche || "geral"}
Tom: ${context?.tone || "casual"}

Gere uma versão otimizada que:
1. Respeite o limite de caracteres
2. Seja atrativo para a plataforma
3. Mantenha a mensagem principal
4. Use linguagem apropriada

Retorne APENAS o texto adaptado, sem explicações.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "Você é um especialista em marketing de redes sociais. Adapte textos para diferentes plataformas mantendo a essência da mensagem.",
      },
      {
        role: "user",
        content: prompt as string,
      },
    ],
  });

  const content = response.choices[0]?.message.content;
  const adaptedText = typeof content === "string" ? content : originalText;
  return adaptedText.substring(0, config.textLimit);
}

/**
 * Gerar hashtags otimizadas para cada plataforma
 */
export async function generateHashtags(
  text: string,
  platform: PlatformType,
  context?: {
    niche?: string;
    trending?: string[];
  }
): Promise<string[]> {
  const config = PLATFORM_CONFIGS[platform];

  const prompt = `Gere hashtags otimizadas para ${config.name}:
    
Texto: "${text}"
Nicho: ${context?.niche || "geral"}
Hashtags em alta: ${context?.trending?.join(", ") || "nenhum"}

Requisitos:
1. Máximo ${config.hashtagLimit} hashtags
2. Mix de hashtags populares e de nicho
3. Relevantes ao conteúdo
4. Formato: #hashtag

Retorne APENAS os hashtags, um por linha, sem explicações.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "Você é um especialista em SEO de redes sociais. Gere hashtags que maximizem o alcance.",
      },
      {
        role: "user",
        content: prompt as string,
      },
    ],
  });

  const content = response.choices[0]?.message.content;
  const hashtagText = typeof content === "string" ? content : "";
  const hashtags = hashtagText
    .split("\n")
    .filter((h: string) => h.trim().startsWith("#"))
    .map((h: string) => h.trim())
    .slice(0, config.bestHashtags);

  return hashtags;
}

/**
 * Determinar melhor horário para postar em cada plataforma
 */
export function getBestPostingTime(platform: PlatformType): string {
  const bestTimes: Record<PlatformType, string> = {
    instagram: "19:00", // 7 PM - melhor engajamento
    tiktok: "18:00", // 6 PM - público jovem
    facebook: "13:00", // 1 PM - almoço
    linkedin: "08:00", // 8 AM - profissionais
    twitter: "09:00", // 9 AM - manhã
  };

  return bestTimes[platform];
}

/**
 * Estimar alcance baseado na plataforma
 */
export function estimateReach(platform: PlatformType, followers: number): number {
  const reachMultiplier: Record<PlatformType, number> = {
    instagram: 0.15, // 15% de alcance orgânico
    tiktok: 0.25, // 25% - algoritmo favorável
    facebook: 0.08, // 8% - alcance reduzido
    linkedin: 0.12, // 12% - rede profissional
    twitter: 0.2, // 20% - retweets aumentam alcance
  };

  return Math.round(followers * reachMultiplier[platform]);
}

/**
 * Adaptar conteúdo completo para uma plataforma
 */
export async function adaptContentForPlatform(
  originalText: string,
  imageBuffer: Buffer | null,
  platform: PlatformType,
  context?: {
    niche?: string;
    brand?: string;
    tone?: "professional" | "casual" | "funny" | "inspirational";
    followers?: number;
    trending?: string[];
  }
): Promise<AdaptedContent> {
  // Gerar texto adaptado
  const adaptedText = await generateTextVariation(originalText, platform, {
    niche: context?.niche,
    brand: context?.brand,
    tone: context?.tone,
  });

  // Gerar hashtags
  const hashtags = await generateHashtags(adaptedText, platform, {
    niche: context?.niche,
    trending: context?.trending,
  });

  // Adaptar imagem se fornecida
  let adaptedImageUrl: string | undefined;
  if (imageBuffer) {
    try {
      const adaptedImage = await adaptImage(imageBuffer, platform);
      // Em produção, fazer upload para S3
      adaptedImageUrl = `data:image/png;base64,${adaptedImage.toString("base64")}`;
    } catch (error) {
      console.error(`Erro ao adaptar imagem para ${platform}:`, error);
    }
  }

  const bestTime = getBestPostingTime(platform);
  const reach = estimateReach(platform, context?.followers || 1000);

  return {
    platform,
    text: adaptedText,
    hashtags,
    imageUrl: adaptedImageUrl,
    bestPostingTime: bestTime,
    characterCount: adaptedText.length,
    estimatedReach: reach,
  };
}

/**
 * Adaptar conteúdo para múltiplas plataformas
 */
export async function adaptContentForMultiplePlatforms(
  originalText: string,
  imageBuffer: Buffer | null,
  platforms: PlatformType[],
  context?: {
    niche?: string;
    brand?: string;
    tone?: "professional" | "casual" | "funny" | "inspirational";
    followers?: number;
    trending?: string[];
  }
): Promise<AdaptedContent[]> {
  const adaptations = await Promise.all(
    platforms.map((platform) =>
      adaptContentForPlatform(originalText, imageBuffer, platform, context)
    )
  );

  return adaptations;
}

/**
 * Gerar recomendações de conteúdo baseado em performance
 */
export async function generateContentRecommendations(
  pastPerformance: Array<{
    text: string;
    platform: PlatformType;
    engagement: number;
  }>
): Promise<string> {
  const topPerforming = pastPerformance
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 3);

  const prompt = `Baseado nestes posts com melhor performance:
    
${topPerforming.map((p) => `- ${p.platform}: "${p.text}" (${p.engagement} engajamentos)`).join("\n")}

Gere recomendações de conteúdo que teria alta performance.
Retorne 3 ideias de conteúdo, uma por linha.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "Você é um especialista em marketing de redes sociais. Analise padrões de sucesso e recomende conteúdo.",
      },
      {
        role: "user",
        content: prompt as string,
      },
    ],
  });

  const content = response.choices[0]?.message.content;
  return typeof content === "string" ? content : "";
}
