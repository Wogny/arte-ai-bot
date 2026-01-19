import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import { getDb } from "../db.js";
import { multiPlatformPosts, campaigns } from '../../drizzle/schema.js';
import { withCache } from "../_core/cache.js";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const analyticsRouter = router({
  /**
   * Obter métricas gerais do usuário
   */
  getOverviewMetrics: protectedProcedure.query(async ({ ctx }) => {
    return withCache(`overview_metrics_${ctx.user.id}`, async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const posts = await db
        .select()
        .from(multiPlatformPosts)
        .where(eq(multiPlatformPosts.userId, ctx.user.id));

      const campaignsData = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.userId, ctx.user.id));

      // Simulação de tendências (últimos 7 dias)
      const trends = Array.from({ length: 7 }).map((_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        posts: Math.floor(Math.random() * 10),
        engagement: Math.floor(Math.random() * 1000),
      }));

      return {
        totalPosts: posts.length,
        publishedPosts: posts.filter(p => p.status === "published").length,
        scheduledPosts: posts.filter(p => p.status === "scheduled").length,
        failedPosts: posts.filter(p => p.status === "failed").length,
        draftPosts: posts.filter(p => p.status === "draft").length,
        totalCampaigns: campaignsData.length,
        activeCampaigns: campaignsData.length,
        platformBreakdown: {
          facebook: posts.filter(p => p.platforms.includes("facebook")).length,
          instagram: posts.filter(p => p.platforms.includes("instagram")).length,
          tiktok: posts.filter(p => p.platforms.includes("tiktok")).length,
          whatsapp: posts.filter(p => p.platforms.includes("whatsapp")).length,
        },
        trends,
        bestTimePost: "Terça-feira, 18:00",
        lastUpdated: new Date(),
      };
    }, 60);
  }),

  /**
   * Obter métricas de uma campanha específica
   */
  getCampaignMetrics: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const campaign = await db
        .select()
        .from(campaigns)
        .where(
          and(eq(campaigns.id, input.campaignId), eq(campaigns.userId, ctx.user.id))
        )
        .limit(1);

      if (!campaign.length) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const metrics = campaign[0].metrics || {};
      const campaignMetrics = {
        campaignId: campaign[0].id,
        name: campaign[0].name,
        platform: campaign[0].platform,
        impressions: metrics.impressions || 0,
        reach: metrics.reach || 0,
        clicks: metrics.clicks || 0,
        engagement: metrics.engagement || 0,
        conversions: metrics.conversions || 0,
        spend: metrics.spend || 0,
        ctr: metrics.clicks && metrics.impressions 
          ? ((metrics.clicks / metrics.impressions) * 100).toFixed(2)
          : "0.00",
        engagementRate: metrics.engagement && metrics.impressions
          ? ((metrics.engagement / metrics.impressions) * 100).toFixed(2)
          : "0.00",
        createdAt: campaign[0].createdAt,
        updatedAt: campaign[0].updatedAt,
      };

      return campaignMetrics;
    }),

  /**
   * Obter performance por plataforma
   */
  getPlatformPerformance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const posts = await db
      .select()
      .from(multiPlatformPosts)
      .where(eq(multiPlatformPosts.userId, ctx.user.id));

    const platformStats = {
      facebook: {
        totalPosts: posts.filter((p: any) => p.platforms.includes("facebook")).length,
        publishedPosts: posts.filter((p: any) => p.platforms.includes("facebook") && p.status === "published").length,
        failedPosts: posts.filter((p: any) => p.platforms.includes("facebook") && p.status === "failed").length,
      },
      instagram: {
        totalPosts: posts.filter((p: any) => p.platforms.includes("instagram")).length,
        publishedPosts: posts.filter((p: any) => p.platforms.includes("instagram") && p.status === "published").length,
        failedPosts: posts.filter((p: any) => p.platforms.includes("instagram") && p.status === "failed").length,
      },
      tiktok: {
        totalPosts: posts.filter((p: any) => p.platforms.includes("tiktok")).length,
        publishedPosts: posts.filter((p: any) => p.platforms.includes("tiktok") && p.status === "published").length,
        failedPosts: posts.filter((p: any) => p.platforms.includes("tiktok") && p.status === "failed").length,
      },
      whatsapp: {
        totalPosts: posts.filter((p: any) => p.platforms.includes("whatsapp")).length,
        publishedPosts: posts.filter((p: any) => p.platforms.includes("whatsapp") && p.status === "published").length,
        failedPosts: posts.filter((p: any) => p.platforms.includes("whatsapp") && p.status === "failed").length,
      },
    };

    return platformStats;
  }),

  /**
   * Obter histórico de posts com filtros
   */
  getPostsHistory: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["facebook", "instagram", "tiktok", "whatsapp"]).optional(),
        status: z.enum(["draft", "scheduled", "published", "failed"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const postsQuery = await db
        .select()
        .from(multiPlatformPosts)
        .where(eq(multiPlatformPosts.userId, ctx.user.id));

      let filteredPosts = postsQuery;
      if (input.status) {
        filteredPosts = filteredPosts.filter(p => p.status === input.status);
      }

      const paginatedPosts = filteredPosts
        .slice(input.offset, input.offset + input.limit);

      if (input.platform) {
        return paginatedPosts.filter((p: any) => p.platforms.includes(input.platform!));
      }

      return paginatedPosts;
    }),

  /**
   * Obter estatísticas de performance por período
   */
  getPerformanceByPeriod: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const posts = await db
        .select()
        .from(multiPlatformPosts)
        .where(eq(multiPlatformPosts.userId, ctx.user.id));

      const postsInPeriod = posts.filter(
        p => p.publishedAt && p.publishedAt >= input.startDate && p.publishedAt <= input.endDate
      );

      const stats = {
        period: {
          startDate: input.startDate,
          endDate: input.endDate,
        },
        totalPosts: postsInPeriod.length,
        successRate: postsInPeriod.length > 0 
          ? ((postsInPeriod.filter((p: any) => p.status === "published").length / postsInPeriod.length) * 100).toFixed(2)
          : "0.00",
        platformDistribution: {
          facebook: postsInPeriod.filter((p: any) => p.platforms.includes("facebook")).length,
          instagram: postsInPeriod.filter((p: any) => p.platforms.includes("instagram")).length,
          tiktok: postsInPeriod.filter((p: any) => p.platforms.includes("tiktok")).length,
          whatsapp: postsInPeriod.filter((p: any) => p.platforms.includes("whatsapp")).length,
        },
      };

      return stats;
    }),

  /**
   * Obter recomendações baseadas em analytics
   */
  getRecommendations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const posts = await db
      .select()
      .from(multiPlatformPosts)
      .where(eq(multiPlatformPosts.userId, ctx.user.id));

    const recommendations = [];

    // Recomendação 1: Plataforma com melhor performance
      const platformStats = {
        facebook: posts.filter((p: any) => p.platforms.includes("facebook")).length,
        instagram: posts.filter((p: any) => p.platforms.includes("instagram")).length,
        tiktok: posts.filter((p: any) => p.platforms.includes("tiktok")).length,
        whatsapp: posts.filter((p: any) => p.platforms.includes("whatsapp")).length,
      };

    const bestPlatform = Object.entries(platformStats).reduce((a, b) =>
      a[1] > b[1] ? a : b
    );

    if (bestPlatform[1] > 0) {
      recommendations.push({
        type: "platform",
        title: "Foque na plataforma com melhor performance",
        description: `${bestPlatform[0]} teve ${bestPlatform[1]} posts publicados com sucesso. Aumente a frequência de posts nesta plataforma.`,
        priority: "high",
      });
    }

    // Recomendação 2: Taxa de falha
    const failureRate = posts.filter(p => p.status === "failed").length / posts.length;
    if (failureRate > 0.2) {
      recommendations.push({
        type: "error",
        title: "Taxa de falha elevada",
        description: `${(failureRate * 100).toFixed(2)}% dos seus posts falharam. Verifique suas credenciais de plataforma.`,
        priority: "critical",
      });
    }

    // Recomendação 3: Frequência de posts
    if (posts.length < 5) {
      recommendations.push({
        type: "frequency",
        title: "Aumente a frequência de posts",
        description: "Você tem poucos posts agendados. Aumente a frequência para melhor engajamento.",
        priority: "medium",
      });
    }

    return recommendations;
  }),
});
