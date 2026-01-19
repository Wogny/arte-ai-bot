import { COOKIE_NAME } from "@shared/const";
import { tagsRouter } from "./routers/tags";
import { mediaRouter } from "./routers/media";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { templatesRouter } from "./routers/templates";
import { platformsRouter } from "./routers/platforms";
import { multiplatformRouter } from "./routers/multiplatform";
import { analyticsRouter } from "./routers/analytics";
import { competitorsRouter } from "./routers/competitors";
import { whatsappRouter } from "./routers/whatsapp";
import { userRouter } from "./routers/user";
import { oauthRouter } from "./routers/oauth";
import { collaborationRouter } from "./routers/collaboration";
import { realTimeAnalyticsRouter } from "./routers/realTimeAnalytics";
import { executionRouter } from "./routers/execution";
import { workspacesRouter } from "./routers/workspaces";
import { integrationsRouter } from "./routers/integrations";
import { supportRouter } from "./routers/support";
import { contentAutomationRouter } from "./routers/contentAutomation";
import { billingRouter } from "./routers/billing";
import { captionsRouter } from "./routers/captions";
import { socialConnectionsRouter } from "./routers/socialConnections";
import { postTemplatesRouter } from "./routers/postTemplates";
import { generationHistoryRouter } from "./routers/generationHistory";
import { mercadopagoRouter } from "./routers/mercadopago";
import { adminUsersRouter } from "./routers/adminUsers";
import { subscriptionRouter } from "./routers/subscription";
import { authRouter } from "./routers/auth";
import { imageGenerationRouter } from "./routers/imageGeneration";
import { socialPublishingRouter } from "./routers/socialPublishing";
import { notificationsRouter } from "./routers/notifications";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import * as db from "./db";

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
        const enhancedPrompt = `Create a ${input.visualStyle} style ${input.contentType} for social media. ${input.prompt}`;

        const result = await generateImage({
          prompt: enhancedPrompt,
        });

        if (!result.url) {
          throw new Error("Failed to generate image");
        }

        const response = await fetch(result.url);
        const imageBuffer = Buffer.from(await response.arrayBuffer());
        
        const fileKey = `${ctx.user.id}/images/${nanoid()}.png`;
        const { url: s3Url } = await storagePut(fileKey, imageBuffer, "image/png");

        const savedImage = await db.saveGeneratedImage({
          userId: ctx.user.id,
          projectId: input.projectId ?? null,
          prompt: input.prompt,
          visualStyle: input.visualStyle,
          contentType: input.contentType,
          imageUrl: s3Url,
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
        caption: z.string().optional(),
        scheduledFor: z.date().optional(),
        platform: z.enum(["facebook", "instagram", "both"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { postId, ...data } = input;
        await db.updateScheduledPost(postId, ctx.user.id, data);
        return { success: true };
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        postId: z.number(),
        status: z.enum(["draft", "pending_approval", "approved", "scheduled", "published", "failed", "cancelled"]),
        errorMessage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updatePostStatus(input.postId, ctx.user.id, input.status, input.errorMessage);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteScheduledPost(input.postId, ctx.user.id);
        return { success: true };
      }),
  }),

  campaigns: router({
    downloadTemplate: publicProcedure.query(async () => {
      const { generateCSVTemplate } = await import("./csvParser");
      return { template: generateCSVTemplate() };
    }),

    importCSV: protectedProcedure
      .input(z.object({ csvContent: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { parseCSV } = await import("./csvParser");
        
        const parseResult = parseCSV(input.csvContent);
        
        if (!parseResult.success && parseResult.errors.length > 0) {
          throw new Error(`Erro ao importar CSV: ${parseResult.errors[0].message}`);
        }

        const importedCampaigns = await Promise.all(
          parseResult.campaigns.map((campaign: any) =>
            db.createCampaign({
              userId: ctx.user.id,
              name: campaign.name,
              platform: campaign.platform,
              startDate: new Date(campaign.startDate),
              endDate: campaign.endDate ? new Date(campaign.endDate) : undefined,
              metrics: {
                impressions: campaign.impressions,
                reach: campaign.reach,
                engagement: campaign.engagement,
                clicks: campaign.clicks,
                conversions: campaign.conversions,
                spend: campaign.spend,
              },
            })
          )
        );

        return {
          imported: importedCampaigns.length,
          campaigns: importedCampaigns,
        };
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        projectId: z.number().optional(),
        platform: z.string().min(1),
        startDate: z.date(),
        endDate: z.date().optional(),
        metrics: z.object({
          impressions: z.number().optional(),
          reach: z.number().optional(),
          engagement: z.number().optional(),
          clicks: z.number().optional(),
          conversions: z.number().optional(),
          spend: z.number().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createCampaign({
          userId: ctx.user.id,
          ...input,
        });
      }),

    list: protectedProcedure
      .input(z.object({ projectId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getUserCampaigns(ctx.user.id, input.projectId);
      }),

    getById: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getCampaignById(input.campaignId, ctx.user.id);
      }),

    update: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        name: z.string().min(1).optional(),
        platform: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        metrics: z.object({
          impressions: z.number().optional(),
          reach: z.number().optional(),
          engagement: z.number().optional(),
          clicks: z.number().optional(),
          conversions: z.number().optional(),
          spend: z.number().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { campaignId, ...data } = input;
        await db.updateCampaign(campaignId, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCampaign(input.campaignId, ctx.user.id);
        return { success: true };
      }),
  }),

  recommendations: router({
    generateFromCampaigns: protectedProcedure
      .input(z.object({ projectId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        const { analyzeCampaigns } = await import("./llmAnalysis");
        const { notifyOwner } = await import("./_core/notification");
        
        const campaigns = await db.getUserCampaigns(ctx.user.id, input.projectId);
        
        if (campaigns.length === 0) {
          throw new Error("Nenhuma campanha disponível para análise");
        }

        let niche: string | undefined;
        if (input.projectId) {
          const project = await db.getProjectById(input.projectId, ctx.user.id);
          niche = project?.niche;
        }

        const analysis = await analyzeCampaigns(campaigns, niche);

        const savedRecommendations = await Promise.all(
          analysis.recommendations.map((rec: any) =>
            db.createRecommendation({
              userId: ctx.user.id,
              projectId: input.projectId ?? null,
              type: rec.type,
              title: rec.title,
              description: rec.description,
              priority: rec.priority,
            })
          )
        );

        const highPriorityCount = savedRecommendations.filter((r: any) => r.priority === "high").length;
        await notifyOwner({
          title: "Novas Recomendações Geradas",
          content: `${savedRecommendations.length} novas recomendações foram geradas${highPriorityCount > 0 ? `, incluindo ${highPriorityCount} de alta prioridade` : ""}. Acesse o painel para visualizar.`,
        });

        return {
          insights: analysis.insights,
          recommendations: savedRecommendations,
        };
      }),

    list: protectedProcedure
      .input(z.object({ unreadOnly: z.boolean().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getUserRecommendations(ctx.user.id, input.unreadOnly);
      }),

    markAsRead: protectedProcedure
      .input(z.object({ recommendationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.markRecommendationAsRead(input.recommendationId, ctx.user.id);
        return { success: true };
      }),
  }),

  userSettings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserAdminSettings(ctx.user.id);
    }),

    update: protectedProcedure
      .input(z.object({
        theme: z.string().optional(),
        timezone: z.string().optional(),
        language: z.string().optional(),
        notificationsEnabled: z.boolean().optional(),
        emailNotifications: z.boolean().optional(),
        defaultPlatforms: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.upsertUserAdminSettings(ctx.user.id, input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
