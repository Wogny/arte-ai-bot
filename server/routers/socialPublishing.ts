import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import { TRPCError } from "@trpc/server";
import * as db from "../db.js";

// Validação de entrada
const publishPostInputSchema = z.object({
  caption: z.string().min(1, "Legenda é obrigatória"),
  imageUrl: z.string().url("URL de imagem inválida"),
  platforms: z.array(
    z.enum(["instagram", "facebook", "tiktok"])
  ).min(1, "Selecione pelo menos uma plataforma"),
  scheduledFor: z.date().optional(),
  hashtags: z.array(z.string()).optional(),
  mentions: z.array(z.string()).optional(),
});

// Função para publicar no Instagram Business
async function publishToInstagram(
  caption: string,
  imageUrl: string,
  accessToken: string,
  instagramAccountId: string
): Promise<{ postId: string; url: string }> {
  try {
    console.log(`[Instagram] Iniciando postagem para conta: ${instagramAccountId}`);
    
    // 1. Criar o container de mídia
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption,
          access_token: accessToken,
        }),
      }
    );

    const containerData = await containerResponse.json();
    if (!containerResponse.ok) {
      throw new Error(`Erro ao criar container: ${containerData.error?.message || "Erro desconhecido"}`);
    }

    const creationId = containerData.id;

    // 2. Publicar o container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: accessToken,
        }),
      }
    );

    const publishData = await publishResponse.json();
    if (!publishResponse.ok) {
      throw new Error(`Erro ao publicar: ${publishData.error?.message || "Erro desconhecido"}`);
    }

    return {
      postId: publishData.id,
      url: `https://www.instagram.com/p/${publishData.id}/`,
    };
  } catch (error) {
    console.error("[Instagram Publish Error]", error);
    throw new Error(
      `Erro ao publicar no Instagram: ${error instanceof Error ? error.message : "Desconhecido"}`
    );
  }
}

export const socialPublishingRouter = router({
  // Publicar post em múltiplas plataformas
  publish: protectedProcedure
    .input(publishPostInputSchema)
    .mutation(async ({ ctx, input }) => {
      const results: Record<string, { success: boolean; postId?: string; url?: string; error?: string }> = {};

      for (const platform of input.platforms) {
        try {
          let publishResult;
          
          if (platform === "instagram") {
            // Tentar pegar do .env primeiro (configuração manual do admin)
            const accessToken = process.env.FACEBOOK_LONG_LIVED_TOKEN;
            const instagramAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

            if (!accessToken || !instagramAccountId) {
              // Se não tiver no .env, tentar buscar das conexões do banco
              const connections = await db.getUserSocialConnections(ctx.user.id);
              const conn = connections.find(c => c.platform === "instagram");
              
              if (!conn || !conn.accessToken || !conn.accountId) {
                throw new Error("Conta do Instagram não conectada corretamente.");
              }
              
              publishResult = await publishToInstagram(
                input.caption,
                input.imageUrl,
                conn.accessToken,
                conn.accountId
              );
            } else {
              // Usar credenciais do .env
              publishResult = await publishToInstagram(
                input.caption,
                input.imageUrl,
                accessToken,
                instagramAccountId
              );
            }
          } else {
            throw new Error(`Plataforma ${platform} ainda em fase de implementação real.`);
          }

          results[platform] = {
            success: true,
            postId: publishResult.postId,
            url: publishResult.url,
          };

          // Salvar no banco de dados
          await db.createScheduledPost({
            userId: ctx.user.id,
            platform,
            caption: input.caption,
            status: "published",
            publishedAt: new Date(),
            scheduledFor: new Date(),
            createdAt: new Date(),
          });
        } catch (error) {
          results[platform] = {
            success: false,
            error: error instanceof Error ? error.message : "Erro desconhecido",
          };
        }
      }

      return {
        success: Object.values(results).some(r => r.success),
        results,
      };
    }),

  // Agendar publicação para depois
  schedule: protectedProcedure
    .input(publishPostInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!input.scheduledFor) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Data de agendamento é obrigatória",
        });
      }

      for (const platform of input.platforms) {
        await db.createScheduledPost({
          userId: ctx.user.id,
          platform,
          caption: input.caption,
          status: "scheduled",
          scheduledFor: input.scheduledFor,
          createdAt: new Date(),
        });
      }

      return {
        success: true,
        message: `Post agendado para ${input.scheduledFor.toLocaleString()}`,
      };
    }),

  // Obter posts agendados
  getScheduled: protectedProcedure.query(async ({ ctx }) => {
    const posts = await db.getUserScheduledPosts(ctx.user.id);
    return {
      success: true,
      posts: posts.filter(p => p.status === "scheduled"),
    };
  }),
});
