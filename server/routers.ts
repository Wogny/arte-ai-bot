import { COOKIE_NAME } from "../shared/const.js";
import { tagsRouter } from "./routers/tags.js";
import { mediaRouter } from "./routers/media.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import { templatesRouter } from "./routers/templates.js";
import { platformsRouter } from "./routers/platforms.js";
import { multiplatformRouter } from "./routers/multiplatform.js";
import { analyticsRouter } from "./routers/analytics.js";
import { competitorsRouter } from "./routers/competitors.js";
import { whatsappRouter } from "./routers/whatsapp.js";
import { userRouter } from "./routers/user.js";
import { oauthRouter } from "./routers/oauth.js";
import { collaborationRouter } from "./routers/collaboration.js";
import { realTimeAnalyticsRouter } from "./routers/realTimeAnalytics.js";
import { executionRouter } from "./routers/execution.js";
import { workspacesRouter } from "./routers/workspaces.js";
import { integrationsRouter } from "./routers/integrations.js";
import { supportRouter } from "./routers/support.js";
import { contentAutomationRouter } from "./routers/contentAutomation.js";
import { billingRouter } from "./routers/billing.js";
import { captionsRouter } from "./routers/captions.js";
import { socialConnectionsRouter } from "./routers/socialConnections.js";
import { postTemplatesRouter } from "./routers/postTemplates.js";
import { generationHistoryRouter } from "./routers/generationHistory.js";
import { mercadopagoRouter } from "./routers/mercadopago.js";
import { adminUsersRouter } from "./routers/adminUsers.js";
import { subscriptionRouter } from "./routers/subscription.js";
import { authRouter } from "./routers/auth.js";
import { imageGenerationRouter } from "./routers/imageGeneration.js";
import { socialPublishingRouter } from "./routers/socialPublishing.js";
import { notificationsRouter } from "./routers/notifications.js";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc.js";
import { z } from "zod";
import { generateImage } from "./_core/imageGeneration.js";
import { storagePut } from "./storage.js";
import { nanoid } from "nanoid";
import * as db from "./db.js";

export const appRouter = router({
  system: systemRouter,
  templates: templatesRouter,
  platforms: platformsRouter,
  multiplatform: multiplatformRouter,
  tags: tagsRouter,
  media: mediaRouter,
  analytics: analyticsRouter,
  competitors: competitorsRouter,
  whatsapp: whatsappRouter,
  user: userRouter,
  oauth: oauthRouter,
  collaboration: collaborationRouter,
  realTimeAnalytics: realTimeAnalyticsRouter,
  execution: executionRouter,
  workspaces: workspacesRouter,
  integrations: integrationsRouter,
  support: supportRouter,
  contentAutomation: contentAutomationRouter,
  billing: billingRouter,
  captions: captionsRouter,
  socialConnections: socialConnectionsRouter,
  postTemplates: postTemplatesRouter,
  generationHistory: generationHistoryRouter,
  adminUsers: adminUsersRouter,
  mercadopago: mercadopagoRouter,
  subscription: subscriptionRouter,
  imageGeneration: imageGenerationRouter,
  socialPublishing: socialPublishingRouter,
  notifications: notificationsRouter,
  
  auth: authRouter,

  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserDashboardStats(ctx.user.id);
    }),
  }),

  projects: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        niche: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createProject({
          userId: ctx.user.id,
          ...input,
        });
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserProjects(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getProjectById(input.projectId, ctx.user.id);
      }),

    update: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        niche: z.string().min(1).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { projectId, ...data } = input;
        await db.updateProject(projectId, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteProject(input.projectId, ctx.user.id);
        return { success: true };
      }),
  }),

  images: router({
    generate: protectedProcedure
      .input(z.object({
        prompt: z.string().min(1),
        visualStyle: z.enum(["minimalista", "colorido", "corporativo", "artistico", "moderno"]),
        contentType: z.enum(["post", "story", "banner", "anuncio"]),
        projectId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        console.log("[Images] Gerando imagem para prompt:", input.prompt);
        
        let imageUrl: string;
        const apiKey = process.env.STABLE_DIFFUSION_API_KEY;

        if (!apiKey) {
          console.log("[Images] Modo DEMO: Usando Unsplash");
          // Usar Unsplash Source para imagens aleatórias bonitas
          // Formato: https://images.unsplash.com/photo-<id>?q=80&w=800
          // Usando uma imagem genérica de alta qualidade como placeholder
          imageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop";
        } else {
          const enhancedPrompt = `Create a ${input.visualStyle} style ${input.contentType} for social media. ${input.prompt}`;
          const result = await generateImage({
            prompt: enhancedPrompt,
          });

          if (!result.url) {
            throw new Error("Failed to generate image");
          }
          imageUrl = result.url;
        }

        const fileKey = `${ctx.user.id}/images/${nanoid()}.png`;
        
        // Se for URL externa (Unsplash), salvamos a URL diretamente
        // Se for da API real, poderíamos baixar e salvar no S3, mas para o demo vamos usar a URL
        
        const savedImage = await db.saveGeneratedImage({
          userId: ctx.user.id,
          projectId: input.projectId ?? null,
          prompt: input.prompt,
          visualStyle: input.visualStyle,
          contentType: input.contentType,
          imageUrl: imageUrl,
          imageKey: fileKey,
        });

        return savedImage;
      }),

    list: protectedProcedure
      .input(z.object({ projectId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getUserImages(ctx.user.id, input.projectId);
      }),

    getById: protectedProcedure
      .input(z.object({ imageId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getImageById(input.imageId, ctx.user.id);
      }),

    delete: protectedProcedure
      .input(z.object({ imageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteImage(input.imageId, ctx.user.id);
        return { success: true };
      }),
  }),

  meta: router({
    saveCredentials: protectedProcedure
      .input(z.object({
        appId: z.string().min(1),
        appSecret: z.string().min(1),
        accessToken: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.saveMetaCredentials({
          userId: ctx.user.id,
          ...input,
        });
      }),

    getCredentials: protectedProcedure.query(async ({ ctx }) => {
      const credentials = await db.getActiveMetaCredentials(ctx.user.id);
      if (!credentials) return null;
      
      return {
        id: credentials.id,
        appId: credentials.appId,
        hasCredentials: true,
        createdAt: credentials.createdAt,
      };
    }),
  }),

  scheduling: router({
    create: protectedProcedure
      .input(z.object({
        imageId: z.number().optional(),
        mediaId: z.number().optional(),
        projectId: z.number().optional(),
        mediaType: z.enum(["image", "video", "gif", "carousel"]).default("image"),
        contentFormat: z.enum(["post", "story", "reel", "carousel"]).default("post"),
        platform: z.enum(["facebook", "instagram", "tiktok", "whatsapp", "both", "all"]),
        caption: z.string().optional(),
        videoUrl: z.string().optional(),
        videoKey: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        duration: z.number().optional(),
        coverImageUrl: z.string().optional(),
        musicTrack: z.string().optional(),
        hashtags: z.string().optional(),
        scheduledFor: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { notifyOwner } = await import("./_core/notification");
        
        const post = await db.createScheduledPost({
          userId: ctx.user.id,
          imageId: input.imageId ?? null,
          mediaId: input.mediaId ?? null,
          projectId: input.projectId ?? null,
          mediaType: input.mediaType,
          contentFormat: input.contentFormat,
          platform: input.platform,
          caption: input.caption ?? null,
          videoUrl: input.videoUrl ?? null,
          videoKey: input.videoKey ?? null,
          thumbnailUrl: input.thumbnailUrl ?? null,
          duration: input.duration ?? null,
          coverImageUrl: input.coverImageUrl ?? null,
          musicTrack: input.musicTrack ?? null,
          hashtags: input.hashtags ?? null,
          scheduledFor: input.scheduledFor,
        });

        const platformLabels: Record<string, string> = {
          facebook: "Facebook",
          instagram: "Instagram",
          tiktok: "TikTok",
          whatsapp: "WhatsApp",
          both: "Facebook e Instagram",
          all: "Todas as plataformas",
        };
        const formatLabels: Record<string, string> = {
          post: "Post",
          story: "Story",
          reel: "Reel",
          carousel: "Carousel",
        };
        
        await notifyOwner({
          title: `Novo ${formatLabels[input.contentFormat]} Agendado`,
          content: `Um ${formatLabels[input.contentFormat]} (${input.mediaType}) foi agendado para ${platformLabels[input.platform]} em ${input.scheduledFor.toLocaleString("pt-BR")}.`,
        });

        return post;
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserScheduledPosts(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getScheduledPostById(input.postId, ctx.user.id);
      }),

    update: protectedProcedure
      .input(z.object({
        postId: z.number(),
        status: z.enum(["draft", "pending_approval", "approved", "scheduled", "published", "failed", "cancelled"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updatePostStatus(input.postId, ctx.user.id, input.status);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteScheduledPost(input.postId, ctx.user.id);
        return { success: true };
      }),
  }),
});
