import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import { TRPCError } from "@trpc/server";
import * as db from "../db.js";
import { nanoid } from "nanoid";

// Validação de entrada
const generateImageInputSchema = z.object({
  prompt: z.string().min(10, "Prompt deve ter no mínimo 10 caracteres"),
  style: z.string().default("realistic"),
  width: z.number().int().min(256).max(1024).default(512),
  height: z.number().int().min(256).max(1024).default(512),
  steps: z.number().int().min(20).max(100).default(50),
  guidance_scale: z.number().min(1).max(20).default(7.5),
  projectId: z.number().optional(),
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

// Função para chamar Stable Diffusion API Real
async function generateImageWithStableDiffusion(
  prompt: string,
  style: string,
  width: number,
  height: number,
  steps: number,
  guidance_scale: number
): Promise<string> {
  const apiKey = process.env.STABLE_DIFFUSION_API_KEY;
  const engineId = "stable-diffusion-v1-6";
  const apiUrl = `https://api.stability.ai/v1/generation/${engineId}/text-to-image`;

  if (!apiKey || apiKey.trim() === "") {
    console.error("[Image Generation] ERRO: STABLE_DIFFUSION_API_KEY não encontrada no .env");
    throw new Error("API Key da Stability AI não configurada.");
  }

  console.log(`[Image Generation] Iniciando geração real com API Key: ${apiKey.substring(0, 5)}...`);

  const stylePrompts: Record<string, string> = {
    minimalista: "minimalist style, clean, simple, professional",
    colorido: "vibrant colors, colorful, eye-catching, high saturation",
    corporativo: "corporate style, professional, clean, business-like",
    artistico: "artistic style, creative, expressive, painterly",
    moderno: "modern style, contemporary, sleek, high-tech",
    realistic: "photorealistic, 4k, professional photography",
  };

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
        height,
        width,
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
    return `data:image/png;base64,${data.artifacts[0].base64}`;
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
        const imageUrl = await generateImageWithStableDiffusion(
          input.prompt,
          input.style,
          input.width,
          input.height,
          input.steps,
          input.guidance_scale
        );

        const generatedImage = await db.saveGeneratedImage({
          userId: ctx.user.id,
          projectId: input.projectId || null,
          prompt: input.prompt,
          visualStyle: input.style,
          imageUrl,
          imageKey: `generated-images/${nanoid()}.png`,
          contentType: input.contentType,
          createdAt: new Date(),
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
        projectId: z.number().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return await db.getUserImages(ctx.user.id, input.projectId);
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
