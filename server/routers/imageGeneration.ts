import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

// Validação de entrada
const generateImageInputSchema = z.object({
  prompt: z.string().min(10, "Prompt deve ter no mínimo 10 caracteres"),
  style: z.enum([
    "realistic",
    "anime",
    "cartoon",
    "oil_painting",
    "watercolor",
    "digital_art",
    "3d_render",
    "photography",
  ]).default("realistic"),
  width: z.number().int().min(256).max(1024).default(512),
  height: z.number().int().min(256).max(1024).default(512),
  steps: z.number().int().min(20).max(100).default(50),
  guidance_scale: z.number().min(1).max(20).default(7.5),
  projectId: z.number().optional(),
});

// Interface para resposta da API
interface StableDiffusionResponse {
  artifacts: Array<{
    base64: string;
    seed: number;
    finishReason: string;
  }>;
}

// Função para chamar Stable Diffusion API
async function generateImageWithStableDiffusion(
  prompt: string,
  style: string,
  width: number,
  height: number,
  steps: number,
  guidance_scale: number
): Promise<string> {
  const apiKey = process.env.STABLE_DIFFUSION_API_KEY;
  const apiUrl = process.env.STABLE_DIFFUSION_API_URL || "https://api.stability.ai/v1/generate";

  if (!apiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Stable Diffusion API key não configurada",
    });
  }

  // Mapear estilo para prompt
  const stylePrompts: Record<string, string> = {
    realistic: "photorealistic, 4k, professional photography",
    anime: "anime style, beautiful, detailed",
    cartoon: "cartoon style, colorful, fun",
    oil_painting: "oil painting, classical, artistic",
    watercolor: "watercolor painting, soft colors",
    digital_art: "digital art, vibrant, modern",
    "3d_render": "3D render, professional, cinematic",
    photography: "professional photography, high quality, sharp focus",
  };

  const enhancedPrompt = `${prompt}, ${stylePrompts[style]}`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
        seed: Math.floor(Math.random() * 1000000),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stable Diffusion API error: ${error.message}`);
    }

    const data: StableDiffusionResponse = await response.json();

    if (!data.artifacts || data.artifacts.length === 0) {
      throw new Error("Nenhuma imagem foi gerada");
    }

    // Converter base64 para buffer
    const base64Image = data.artifacts[0].base64;
    const imageBuffer = Buffer.from(base64Image, "base64");

    // Salvar no S3
    const imageKey = `generated-images/${nanoid()}.png`;
    const result = await storagePut(imageKey, imageBuffer, "image/png");

    return result.url;
  } catch (error) {
    console.error("[Image Generation Error]", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error instanceof Error ? error.message : "Erro ao gerar imagem",
    });
  }
}

export const imageGenerationRouter = router({
  // Gerar imagem com IA
  generate: protectedProcedure
    .input(generateImageInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Gerar imagem
        const imageUrl = await generateImageWithStableDiffusion(
          input.prompt,
          input.style,
          input.width,
          input.height,
          input.steps,
          input.guidance_scale
        );

        // Salvar no banco de dados
        const generatedImage = await db.saveGeneratedImage({
          userId: ctx.user.id,
          projectId: input.projectId,
          prompt: input.prompt,
          visualStyle: input.style,
          imageUrl,
          imageKey: `generated-images/${nanoid()}.png`,
          contentType: "image/png",
          createdAt: new Date(),
        });

        return {
          success: true,
          image: generatedImage,
          message: "Imagem gerada com sucesso!",
        };
      } catch (error) {
        console.error("[Generate Image Error]", error);
        throw error;
      }
    }),

  // Listar imagens geradas
  list: protectedProcedure
    .input(
      z.object({
        projectId: z.number().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const images = await db.getUserImages(ctx.user.id, input.projectId);
      return {
        success: true,
        images: images.slice(input.offset, input.offset + input.limit),
        total: images.length,
      };
    }),

  // Obter imagem por ID
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
      return {
        success: true,
        image,
      };
    }),

  // Deletar imagem
  delete: protectedProcedure
    .input(z.object({ imageId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteImage(input.imageId, ctx.user.id);
      return {
        success: true,
        message: "Imagem deletada com sucesso",
      };
    }),

  // Favoritar imagem
  toggleFavorite: protectedProcedure
    .input(z.object({ imageId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const image = await db.getImageById(input.imageId, ctx.user.id);
      if (!image) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Imagem não encontrada",
        });
      }

      // TODO: Implementar toggle de favorito no banco de dados

      return {
        success: true,
        message: "Imagem favoritada com sucesso",
      };
    }),
});
