import "dotenv/config";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import { TRPCError } from "@trpc/server";
import * as db from "../_core/db.js";
import { nanoid } from "nanoid";
import { storagePut } from "../storage.js";
import { invokeLLM } from "../_core/llm.js";
import sharp from "sharp";

// Validação de entrada
const generateImageInputSchema = z.object({
  prompt: z.string().min(3, "Prompt deve ter no mínimo 3 caracteres"),
  style: z.string().default("realistic"),
  width: z.union([z.number(), z.string()]).transform(v => Number(v)).default(1024),
  height: z.union([z.number(), z.string()]).transform(v => Number(v)).default(1024),
  steps: z.union([z.number(), z.string()]).transform(v => Number(v)).default(50),
  guidance_scale: z.union([z.number(), z.string()]).transform(v => Number(v)).default(7.5),
  projectId: z.union([z.number(), z.string(), z.null()]).optional(),
  contentType: z.string().default("post"),
});

// Interface para resposta da API
interface StableDiffusionResponse {
  artifacts: Array<{
    base64: string;
    seed: number;
    finishReason: string;
  }>;
}

/**
 * Normaliza as dimensões para os formatos aceitos pelo SDXL 1.0
 * Formatos aceitos: 1024x1024, 1152x896, 1216x832, 1344x768, 1536x640, 640x1536, 768x1344, 832x1216, 896x1152
 */
function normalizeDimensions(width: number, height: number): { width: number; height: number } {
  const ratio = width / height;
  
  // Quadrado
  if (ratio > 0.9 && ratio < 1.1) return { width: 1024, height: 1024 };
  
  // Paisagem (Landscape)
  if (ratio >= 1.1 && ratio < 1.3) return { width: 1152, height: 896 };
  if (ratio >= 1.3 && ratio < 1.5) return { width: 1216, height: 832 };
  if (ratio >= 1.5 && ratio < 2.0) return { width: 1344, height: 768 };
  if (ratio >= 2.0) return { width: 1536, height: 640 };
  
  // Retrato (Portrait)
  if (ratio <= 0.9 && ratio > 0.75) return { width: 896, height: 1152 };
  if (ratio <= 0.75 && ratio > 0.65) return { width: 832, height: 1216 };
  if (ratio <= 0.65 && ratio > 0.5) return { width: 768, height: 1344 };
  if (ratio <= 0.5) return { width: 640, height: 1536 };

  return { width: 1024, height: 1024 };
}

// Função para chamar Stable Diffusion API Real
async function generateImageWithStableDiffusion(
  prompt: string,
  style: string,
  width: number,
  height: number,
  steps: number,
  guidance_scale: number
): Promise<{ imageUrl: string; imageKey: string }> {
  const apiKey = process.env.STABLE_DIFFUSION_API_KEY;
  const engineId = "stable-diffusion-xl-1024-v1-0";
  const apiUrl = `https://api.stability.ai/v1/generation/${engineId}/text-to-image`;

  if (!apiKey || apiKey.trim() === "") {
    console.error("[Image Generation] ERRO: STABLE_DIFFUSION_API_KEY não encontrada no .env");
    throw new Error("API Key da Stability AI não configurada.");
  }

  // Normalizar dimensões para SDXL
  const { width: finalWidth, height: finalHeight } = normalizeDimensions(width, height);
  
  console.log(`[Image Generation] Iniciando geração SDXL (${finalWidth}x${finalHeight}) com API Key: ${apiKey.substring(0, 5)}...`);

  const stylePrompts: Record<string, string> = {
    minimalista: "minimalist style, clean, simple, professional",
    colorido: "vibrant colors, colorful, eye-catching, high saturation",
    corporativo: "corporate style, professional, clean, business-like",
    artistico: "artistic style, creative, expressive, painterly",
    moderno: "modern style, contemporary, sleek, high-tech",
    realistic: "photorealistic, 4k, professional photography",
  };

  // Prompt original (Stability AI prefere inglês, mas aceita outros idiomas com menor precisão)
  // Removida tradução via LLM para evitar erros de conexão no Vercel
  const enhancedPrompt = `${prompt}, ${stylePrompts[style] || style}`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text_prompts: [
          {
            text: enhancedPrompt,
            weight: 1,
          },
        ],
        cfg_scale: guidance_scale,
        height: finalHeight,
        width: finalWidth,
        steps,
        samples: 1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Stability AI API Error]", JSON.stringify(errorData));
      throw new Error(`Erro na API Stability AI: ${errorData.message || response.statusText}`);
    }

    const data: StableDiffusionResponse = await response.json();

    if (!data.artifacts || data.artifacts.length === 0) {
      throw new Error("Nenhuma imagem foi retornada pela API.");
    }

    console.log("[Image Generation] Imagem gerada com sucesso pela Stability AI.");
    
    // Converter base64 para buffer
    let imageBuffer = Buffer.from(data.artifacts[0].base64, "base64");
    
    // Otimizar imagem para reduzir tamanho (especialmente importante para o fallback base64)
    try {
      console.log("[Image Generation] Otimizando imagem...");
      imageBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 80 }) // Converter para JPEG 80% para reduzir drasticamente o tamanho
        .toBuffer();
      console.log(`[Image Generation] Otimização concluída. Novo tamanho: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
    } catch (sharpError) {
      console.warn("[Image Generation] Falha na otimização, usando original:", sharpError);
    }

    // Usar base64 otimizado diretamente para garantir funcionamento imediato
    // Otimização Sharp já reduziu para ~80KB, o que é seguro para o banco de dados
    const imageKey = `generated-images/${nanoid()}.jpg`;
    const imageUrl = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
    
    console.log("[Image Generation] Imagem preparada em base64 otimizado.");
    return { imageUrl, imageKey };
  } catch (error) {
    console.error("[Image Generation Exception]", error);
    throw error;
  }
}

export const imageGenerationRouter = router({
  generate: protectedProcedure
    .input(generateImageInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { imageUrl, imageKey } = await generateImageWithStableDiffusion(
          input.prompt,
          input.style,
          input.width,
          input.height,
          input.steps,
          input.guidance_scale
        );

        const generatedImage = await db.saveGeneratedImage({
          userId: ctx.user.id,
          projectId: (input.projectId && !isNaN(Number(input.projectId))) ? Number(input.projectId) : null,
          prompt: input.prompt,
          visualStyle: input.style,
          imageUrl,
          imageKey,
          contentType: input.contentType,
        });

        return {
          success: true,
          image: generatedImage,
          message: "Imagem gerada com sucesso!",
        };
      } catch (error) {
        console.error("[TRPC Generate Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao processar geração de imagem",
        });
      }
    }),

  list: protectedProcedure
    .input(
      z.object({
        projectId: z.union([z.number(), z.string(), z.null()]).optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const projectId = (input.projectId && !isNaN(Number(input.projectId))) ? Number(input.projectId) : undefined;
      return await db.getUserImages(ctx.user.id, projectId);
    }),

  getById: protectedProcedure
    .input(z.object({ imageId: z.number() }))
    .query(async ({ ctx, input }) => {
      const image = await db.getImageById(input.imageId, ctx.user.id);
      if (!image) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Imagem não encontrada",
        });
      }
      return image;
    }),

  delete: protectedProcedure
    .input(z.object({ imageId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteImage(input.imageId, ctx.user.id);
      return {
        success: true,
        message: "Imagem deletada com sucesso",
      };
    }),
});
