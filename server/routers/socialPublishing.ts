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

// Interface para credenciais de plataforma
interface PlatformCredentials {
  platform: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

// Função para publicar no Instagram
async function publishToInstagram(
  caption: string,
  imageUrl: string,
  accessToken: string
): Promise<{ postId: string; url: string }> {
  try {
    // Usar Instagram Graph API
    const response = await fetch(
      "https://graph.instagram.com/v18.0/me/media",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: imageUrl,
          caption,
          access_token: accessToken,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Instagram API error: ${error.error?.message}`);
    }

    const data = await response.json();
    return {
      postId: data.id,
      url: `https://instagram.com/p/${data.id}`,
    };
  } catch (error) {
    throw new Error(
      `Erro ao publicar no Instagram: ${error instanceof Error ? error.message : "Desconhecido"}`
    );
  }
}

// Função para publicar no Facebook
async function publishToFacebook(
  caption: string,
  imageUrl: string,
  accessToken: string
): Promise<{ postId: string; url: string }> {
  try {
    const response = await fetch(
      "https://graph.facebook.com/v18.0/me/feed",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: caption,
          link: imageUrl,
          access_token: accessToken,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Facebook API error: ${error.error?.message}`);
    }

    const data = await response.json();
    return {
      postId: data.id,
      url: `https://facebook.com/${data.id}`,
    };
  } catch (error) {
    throw new Error(
      `Erro ao publicar no Facebook: ${error instanceof Error ? error.message : "Desconhecido"}`
    );
  }
}

// Função para publicar no TikTok
async function publishToTikTok(
  caption: string,
  imageUrl: string,
  accessToken: string
): Promise<{ postId: string; url: string }> {
  try {
    // TikTok API requer vídeo, não imagem
    // Esta é uma implementação simplificada
    const response = await fetch(
      "https://open.tiktokapis.com/v1/post/publish/action/upload/",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: {
            source_type: "PULL_FROM_URL",
            source_data: {
              upload_url: imageUrl,
            },
          },
          post_info: {
            text: caption,
            title: caption.substring(0, 150),
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`TikTok API error: ${error.error?.message}`);
    }

    const data = await response.json();
    return {
      postId: data.data.video_id,
      url: `https://tiktok.com/@user/video/${data.data.video_id}`,
    };
  } catch (error) {
    throw new Error(
      `Erro ao publicar no TikTok: ${error instanceof Error ? error.message : "Desconhecido"}`
    );
  }
}

// Função para publicar no Twitter/X
async function publishToTwitter(
  caption: string,
  imageUrl: string,
  accessToken: string
): Promise<{ postId: string; url: string }> {
  try {
    // Twitter API v2
    const response = await fetch(
      "https://api.twitter.com/2/tweets",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: caption,
          attachments: {
            media_ids: [imageUrl],
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Twitter API error: ${error.detail}`);
    }

    const data = await response.json();
    return {
      postId: data.data.id,
      url: `https://twitter.com/user/status/${data.data.id}`,
    };
  } catch (error) {
    throw new Error(
      `Erro ao publicar no Twitter: ${error instanceof Error ? error.message : "Desconhecido"}`
    );
  }
}

// Função para publicar no YouTube
async function publishToYouTube(
  caption: string,
  imageUrl: string,
  accessToken: string
): Promise<{ postId: string; url: string }> {
  try {
    // YouTube Community API
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/activities",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: {
            type: "upload",
            description: caption,
            thumbnails: {
              default: {
                url: imageUrl,
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`YouTube API error: ${error.error?.message}`);
    }

    const data = await response.json();
    return {
      postId: data.id,
      url: `https://youtube.com/post/${data.id}`,
    };
  } catch (error) {
    throw new Error(
      `Erro ao publicar no YouTube: ${error instanceof Error ? error.message : "Desconhecido"}`
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
          // Obter credenciais da plataforma
          const credentialsList = await db.getUserPlatformCredentials(ctx.user.id, platform);
          if (!credentialsList || credentialsList.length === 0) {
            results[platform] = {
              success: false,
              error: `Credenciais não configuradas para ${platform}`,
            };
            continue;
          }

          const credentials = credentialsList[0];
          let publishResult;
          switch (platform) {
            case "instagram":
              publishResult = await publishToInstagram(
                input.caption,
                input.imageUrl,
                credentials.accessToken
              );
              break;
            case "facebook":
              publishResult = await publishToFacebook(
                input.caption,
                input.imageUrl,
                credentials.accessToken
              );
              break;
            case "tiktok":
              publishResult = await publishToTikTok(
                input.caption,
                input.imageUrl,
                credentials.accessToken
              );
              break;
            default:
              throw new Error(`Plataforma não suportada: ${platform}`);
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

      const successCount = Object.values(results).filter((r) => r.success).length;
      const failureCount = Object.values(results).filter((r) => !r.success).length;

      return {
        success: successCount > 0,
        results,
        summary: {
          total: input.platforms.length,
          successful: successCount,
          failed: failureCount,
        },
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

      // Salvar como agendado
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
        platforms: input.platforms,
      };
    }),

  // Obter posts agendados
  getScheduled: protectedProcedure.query(async ({ ctx }) => {
    const posts = await db.getUserScheduledPosts(ctx.user.id);
    const scheduled = posts.filter((p) => p.status === "scheduled");
    return {
      success: true,
      posts: scheduled,
      total: scheduled.length,
    };
  }),

  // Cancelar agendamento
  cancelScheduled: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteScheduledPost(input.postId, ctx.user.id);
      return {
        success: true,
        message: "Agendamento cancelado",
      };
    }),
});
