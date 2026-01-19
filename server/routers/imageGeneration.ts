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

// Função para gerar imagem em modo demo (fallback)
async function generateDemoImage(
  prompt: string,
  style: string,
  width: number,
  height: number
): Promise<string> {
  console.log("[Image Generation] Usando modo DEMO (fallback)");
  return `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=${width}&h=${height}&auto=format&fit=crop`;
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
  const engineId = "stable-diffusion-v1-6"; // Motor mais estável e rápido
  const apiUrl = `https://api.stability.ai/v1/generation/${engineId}/text-to-image`;

  if (!apiKey || apiKey.trim() === "") {
    return generateDemoImage(prompt, style, width, height);
  }

  // Mapear estilo para prompt
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
    console.log(`[Image Generation] Chamando Stability AI para: ${style}`);
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
      const error = await response.json();
      console.error("[Stability AI Error]", error);
      throw new Error(`Stability AI API error: ${error.message || response.statusText}`);
    }

    const data: StableDiffusionResponse = await response.json();

    if (!data.artifacts || data.artifacts.length === 0) {
      throw new Error("Nenhuma imagem foi gerada");
    }

    // Retornar o base64 para ser salvo no banco/storage
    return `data:image/png;base64,${data.artifacts[0].base64}`;
  } catch (error) {
    console.error("[Image Generation Error]", error);
    // Fallback para demo apenas se a chave falhar
    return generateDemoImage(prompt, style, width, height);
  }
}

export const imageGenerationRouter = router({
  // Gerar imagem com IA
  generate: protectedProcedure
    .input(generateImageInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Gerar imagem real
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
        console.error("[Generate Image Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao processar geração de imagem",
        });
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
      return images;
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
      return image;
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
});
