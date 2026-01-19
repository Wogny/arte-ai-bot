import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { runInBackground } from "../_core/queue";
import { notifyOwner } from "../_core/notification";
import {
  adaptContentForMultiplePlatforms,
  adaptContentForPlatform,
  generateContentRecommendations,
  PLATFORM_CONFIGS,
  PlatformType,
} from "../contentAutomation";
import { getDb } from "../db";
import { generatedImages } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const contentAutomationRouter = router({
  /**
   * Adaptar conteúdo para uma plataforma específica
   */
  adaptForPlatform: protectedProcedure
    .input(
      z.object({
        text: z.string(),
        platform: z.enum(["instagram", "tiktok", "facebook", "linkedin", "twitter"]),
        imageId: z.number().optional(),
        niche: z.string().optional(),
        tone: z.enum(["professional", "casual", "funny", "inspirational"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        let imageBuffer: Buffer | null = null;

        // Se fornecido imageId, buscar imagem do banco
        if (input.imageId) {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

          const image = await db
            .select()
            .from(generatedImages)
            .where(eq(generatedImages.id, input.imageId))
            .limit(1);

          if (image.length && image[0].imageUrl) {
            // Em produção, fazer download da imagem do S3
            // Por enquanto, usar URL como está
          }
        }

        const adapted = await adaptContentForPlatform(
          input.text,
          imageBuffer,
          input.platform as PlatformType,
          {
            niche: input.niche,
            tone: input.tone,
          }
        );

        return adapted;
      } catch (error) {
        console.error("Erro ao adaptar conteúdo:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao adaptar conteúdo para plataforma",
        });
      }
    }),

  /**
   * Adaptar conteúdo para múltiplas plataformas
   */
  adaptForMultiplePlatforms: protectedProcedure
    .input(
      z.object({
        text: z.string(),
        platforms: z.array(
          z.enum(["instagram", "tiktok", "facebook", "linkedin", "twitter"])
        ),
        imageId: z.number().optional(),
        niche: z.string().optional(),
        tone: z.enum(["professional", "casual", "funny", "inspirational"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Executa em background para não travar a UI
      runInBackground(async () => {
        try {
          let imageBuffer: Buffer | null = null;
          const adaptations = await adaptContentForMultiplePlatforms(
            input.text,
            imageBuffer,
            input.platforms as PlatformType[],
            {
              niche: input.niche,
              tone: input.tone,
            }
          );

          // Notifica o usuário quando estiver pronto
          await notifyOwner({
            title: "Adaptação de Conteúdo Concluída",
            content: `Seu conteúdo foi adaptado para ${input.platforms.length} plataformas com sucesso.`,
          });
        } catch (error) {
          console.error("Erro em background ao adaptar conteúdo:", error);
        }
      });

      return { 
        success: true, 
        message: "O processamento foi iniciado em background. Você será notificado quando terminar." 
      };
    }),

  /**
   * Obter configurações de plataformas
   */
  getPlatformConfigs: protectedProcedure.query(() => {
    return Object.entries(PLATFORM_CONFIGS).map(([key, config]) => ({
      id: key,
      ...config,
    }));
  }),

  /**
   * Obter recomendações de conteúdo
   */
  getContentRecommendations: protectedProcedure
    .input(
      z.object({
        pastPerformance: z.array(
          z.object({
            text: z.string(),
            platform: z.enum(["instagram", "tiktok", "facebook", "linkedin", "twitter"]),
            engagement: z.number(),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      try {
        const recommendations = await generateContentRecommendations(
          input.pastPerformance
        );
        return {
          recommendations: recommendations
            .split("\n")
            .filter((r) => r.trim().length > 0),
        };
      } catch (error) {
        console.error("Erro ao gerar recomendações:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao gerar recomendações de conteúdo",
        });
      }
    }),

  /**
   * Listar plataformas disponíveis
   */
  listPlatforms: protectedProcedure.query(() => {
    return Object.entries(PLATFORM_CONFIGS).map(([key, config]) => ({
      id: key,
      name: config.name,
      description: config.description,
      format: config.format,
    }));
  }),
});
