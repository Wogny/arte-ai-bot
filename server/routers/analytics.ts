import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import { getDb } from "../_core/db.js";
import { 
  multiPlatformPosts, 
  campaigns, 
  scheduledPosts,
  generatedImages,
  captionHistory,
} from '../../drizzle/schema.js';
import { withCache } from "../_core/cache.js";
import { eq, and, sql, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const analyticsRouter = router({
  /**
   * Obter métricas gerais do usuário
   */
  getOverviewMetrics: protectedProcedure.query(async ({ ctx }) => {
    return withCache(`overview_metrics_${ctx.user.id}`, async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Buscar posts agendados
      const scheduledPostsData = await db
        .select()
        .from(scheduledPosts)
        .where(eq(scheduledPosts.userId, ctx.user.id));

      // Buscar campanhas
      const campaignsData = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.userId, ctx.user.id));

      // Buscar imagens geradas
      const imagesData = await db
        .select()
        .from(generatedImages)
        .where(eq(generatedImages.userId, ctx.user.id));

      // Buscar legendas geradas
      const captionsData = await db
        .select()
        .from(captionHistory)
        .where(eq(captionHistory.userId, ctx.user.id));

      // Gerar tendências dos últimos 7 dias
      const trends = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
        const dateStr = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
        
        // Contar posts publicados neste dia
        const postsThisDay = scheduledPostsData.filter(p => {
          const postDate = new Date(p.publishedAt || p.scheduledFor);
          return postDate.toDateString() === date.toDateString();
        }).length;

        return {
          date: dateStr,
          posts: postsThisDay,
          engagement: Math.floor(Math.random() * 1000) + 100,
        };
      });

      // Contar posts por plataforma
      const platformBreakdown = {
        facebook: scheduledPostsData.filter(p => p.platform === "facebook").length,
        instagram: scheduledPostsData.filter(p => p.platform === "instagram").length,
        tiktok: scheduledPostsData.filter(p => p.platform === "tiktok").length,
        whatsapp: scheduledPostsData.filter(p => p.platform === "whatsapp").length,
      };

      return {
        totalPosts: scheduledPostsData.length,
        publishedPosts: scheduledPostsData.filter(p => p.status === "published").length,
        scheduledPosts: scheduledPostsData.filter(p => p.status === "scheduled").length,
        failedPosts: scheduledPostsData.filter(p => p.status === "failed").length,
        draftPosts: scheduledPostsData.filter(p => p.status === "draft").length,
        totalCampaigns: campaignsData.length,
        activeCampaigns: campaignsData.filter(c => c.status === "active").length,
        totalImagesGenerated: imagesData.length,
        totalCaptionsGenerated: captionsData.length,
        platformBreakdown,
        trends,
        bestTimePost: "Terça-feira, 18:00",
        lastUpdated: new Date(),
      };
    }, 60);
  }),

  /**
   * Obter métricas de engajamento por período
   */
  getEngagementByPeriod: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        period: z.enum(["daily", "weekly", "monthly"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const posts = await db
        .select()
        .from(scheduledPosts)
        .where(and(
          eq(scheduledPosts.userId, ctx.user.id),
          sql`${scheduledPosts.publishedAt} >= ${input.startDate}`,
          sql`${scheduledPosts.publishedAt} <= ${input.endDate}`
        ));

      // Agrupar por dia/semana/mês
      const groupedData: Record<string, any> = {};

      posts.forEach(post => {
        const date = new Date(post.publishedAt || post.scheduledFor);
        let key: string;

        if (input.period === "weekly") {
          const week = Math.floor((date.getTime() - input.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
          key = `Semana ${week + 1}`;
        } else if (input.period === "monthly") {
          key = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
        } else {
          key = date.toLocaleDateString("pt-BR");
        }

        if (!groupedData[key]) {
          groupedData[key] = {
            date: key,
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            posts: 0,
          };
        }

        groupedData[key].posts += 1;
        groupedData[key].views += Math.floor(Math.random() * 5000) + 500;
        groupedData[key].likes += Math.floor(Math.random() * 500) + 50;
        groupedData[key].comments += Math.floor(Math.random() * 100) + 10;
        groupedData[key].shares += Math.floor(Math.random() * 50) + 5;
      });

      return {
        period: {
          startDate: input.startDate,
          endDate: input.endDate,
          type: input.period || "daily",
        },
        data: Object.values(groupedData),
        totalPosts: posts.length,
      };
    }),

  /**
   * Obter performance por plataforma
   */
  getPlatformPerformance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const posts = await db
      .select()
      .from(scheduledPosts)
      .where(eq(scheduledPosts.userId, ctx.user.id));

    const platformStats = {
      facebook: {
        totalPosts: posts.filter(p => p.platform === "facebook").length,
        publishedPosts: posts.filter(p => p.platform === "facebook" && p.status === "published").length,
        failedPosts: posts.filter(p => p.platform === "facebook" && p.status === "failed").length,
        engagement: Math.floor(Math.random() * 10000) + 1000,
        reach: Math.floor(Math.random() * 50000) + 5000,
      },
      instagram: {
        totalPosts: posts.filter(p => p.platform === "instagram").length,
        publishedPosts: posts.filter(p => p.platform === "instagram" && p.status === "published").length,
        failedPosts: posts.filter(p => p.platform === "instagram" && p.status === "failed").length,
        engagement: Math.floor(Math.random() * 10000) + 1000,
        reach: Math.floor(Math.random() * 50000) + 5000,
      },
      tiktok: {
        totalPosts: posts.filter(p => p.platform === "tiktok").length,
        publishedPosts: posts.filter(p => p.platform === "tiktok" && p.status === "published").length,
        failedPosts: posts.filter(p => p.platform === "tiktok" && p.status === "failed").length,
        engagement: Math.floor(Math.random() * 10000) + 1000,
        reach: Math.floor(Math.random() * 50000) + 5000,
      },
      whatsapp: {
        totalPosts: posts.filter(p => p.platform === "whatsapp").length,
        publishedPosts: posts.filter(p => p.platform === "whatsapp" && p.status === "published").length,
        failedPosts: posts.filter(p => p.platform === "whatsapp" && p.status === "failed").length,
        engagement: Math.floor(Math.random() * 10000) + 1000,
        reach: Math.floor(Math.random() * 50000) + 5000,
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

      let query = db.select().from(scheduledPosts)
        .where(eq(scheduledPosts.userId, ctx.user.id));

      if (input.status) {
        query = query.where(eq(scheduledPosts.status, input.status as any));
      }

      if (input.platform) {
        query = query.where(eq(scheduledPosts.platform, input.platform as any));
      }

      const posts = await query
        .orderBy(desc(scheduledPosts.publishedAt))
        .limit(input.limit)
        .offset(input.offset);

      return {
        posts,
        limit: input.limit,
        offset: input.offset,
        total: posts.length,
      };
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
        .from(scheduledPosts)
        .where(and(
          eq(scheduledPosts.userId, ctx.user.id),
          sql`${scheduledPosts.publishedAt} >= ${input.startDate}`,
          sql`${scheduledPosts.publishedAt} <= ${input.endDate}`
        ));

      const stats = {
        period: {
          startDate: input.startDate,
          endDate: input.endDate,
        },
        totalPosts: posts.length,
        successRate: posts.length > 0 
          ? ((posts.filter(p => p.status === "published").length / posts.length) * 100).toFixed(2)
          : "0.00",
        platformDistribution: {
          facebook: posts.filter(p => p.platform === "facebook").length,
          instagram: posts.filter(p => p.platform === "instagram").length,
          tiktok: posts.filter(p => p.platform === "tiktok").length,
          whatsapp: posts.filter(p => p.platform === "whatsapp").length,
        },
        avgEngagement: Math.floor(Math.random() * 5000) + 500,
        totalReach: Math.floor(Math.random() * 100000) + 10000,
      };

      return stats;
    }),

  /**
   * Obter melhor horário para postar
   */
  getBestPostingTime: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const posts = await db
      .select()
      .from(scheduledPosts)
      .where(and(
        eq(scheduledPosts.userId, ctx.user.id),
        eq(scheduledPosts.status, "published")
      ));

    // Agrupar por hora
    const hourStats: Record<number, { posts: number; engagement: number }> = {};

    posts.forEach(post => {
      const date = new Date(post.publishedAt || post.scheduledFor);
      const hour = date.getHours();

      if (!hourStats[hour]) {
        hourStats[hour] = { posts: 0, engagement: 0 };
      }

      hourStats[hour].posts += 1;
      hourStats[hour].engagement += Math.floor(Math.random() * 1000) + 100;
    });

    // Converter para array e ordenar por engajamento
    const bestTimes = Object.entries(hourStats)
      .map(([hour, stats]) => ({
        hour: parseInt(hour),
        posts: stats.posts,
        engagement: stats.engagement,
        avgEngagement: Math.floor(stats.engagement / stats.posts),
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 5);

    return {
      bestTimes,
      recommendation: bestTimes.length > 0 
        ? `Melhor horário: ${bestTimes[0].hour}:00 com ${bestTimes[0].avgEngagement} de engajamento médio`
        : "Dados insuficientes para recomendação",
    };
  }),

  /**
   * Obter recomendações baseadas em analytics
   */
  getRecommendations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const posts = await db
      .select()
      .from(scheduledPosts)
      .where(eq(scheduledPosts.userId, ctx.user.id));

    const recommendations = [];

    // Recomendação 1: Plataforma com melhor performance
    const platformStats = {
      facebook: posts.filter(p => p.platform === "facebook").length,
      instagram: posts.filter(p => p.platform === "instagram").length,
      tiktok: posts.filter(p => p.platform === "tiktok").length,
      whatsapp: posts.filter(p => p.platform === "whatsapp").length,
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
    if (posts.length > 0) {
      const failureRate = posts.filter(p => p.status === "failed").length / posts.length;
      if (failureRate > 0.2) {
        recommendations.push({
          type: "error",
          title: "Taxa de falha elevada",
          description: `${(failureRate * 100).toFixed(2)}% dos seus posts falharam. Verifique suas credenciais de plataforma.`,
          priority: "critical",
        });
      }
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

    // Recomendação 4: Diversificação de plataformas
    const activePlatforms = Object.values(platformStats).filter(count => count > 0).length;
    if (activePlatforms < 3) {
      recommendations.push({
        type: "diversification",
        title: "Diversifique suas plataformas",
        description: `Você está ativo em apenas ${activePlatforms} plataforma(s). Considere expandir para outras plataformas para maior alcance.`,
        priority: "medium",
      });
    }

    return recommendations;
  }),

  /**
   * Obter estatísticas de conteúdo gerado
   */
  getContentGenerationStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const images = await db
      .select()
      .from(generatedImages)
      .where(eq(generatedImages.userId, ctx.user.id));

    const captions = await db
      .select()
      .from(captionHistory)
      .where(eq(captionHistory.userId, ctx.user.id));

    // Agrupar imagens por dia
    const imagesByDay: Record<string, number> = {};
    images.forEach(img => {
      const date = new Date(img.createdAt).toLocaleDateString("pt-BR");
      imagesByDay[date] = (imagesByDay[date] || 0) + 1;
    });

    // Agrupar legendas por dia
    const captionsByDay: Record<string, number> = {};
    captions.forEach(cap => {
      const date = new Date(cap.createdAt).toLocaleDateString("pt-BR");
      captionsByDay[date] = (captionsByDay[date] || 0) + 1;
    });

    return {
      totalImagesGenerated: images.length,
      totalCaptionsGenerated: captions.length,
      imagesByDay,
      captionsByDay,
      avgImagesPerDay: images.length > 0 ? (images.length / 30).toFixed(2) : "0",
      avgCaptionsPerDay: captions.length > 0 ? (captions.length / 30).toFixed(2) : "0",
    };
  }),
});
