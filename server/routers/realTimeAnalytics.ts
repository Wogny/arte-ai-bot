import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { multiPlatformPosts, campaigns, platformCredentials } from "../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getMetaGraphService } from "../metaGraphAPI";

export const realTimeAnalyticsRouter = router({
  /**
   * Obter métricas em tempo real de todas as plataformas
   */
  getRealTimeMetrics: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Obter posts publicados
      const posts = await db
        .select()
        .from(multiPlatformPosts)
        .where(
          and(
            eq(multiPlatformPosts.userId, ctx.user.id),
            eq(multiPlatformPosts.status, "published")
          )
        );

      // Obter campanhas
      const campaignsData = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.userId, ctx.user.id));

      // Calcular métricas agregadas
      const totalImpressions = campaignsData.reduce((sum, c) => sum + (c.metrics?.impressions || 0), 0);
      const totalReach = campaignsData.reduce((sum, c) => sum + (c.metrics?.reach || 0), 0);
      const totalEngagement = campaignsData.reduce((sum, c) => sum + (c.metrics?.engagement || 0), 0);
      const totalClicks = campaignsData.reduce((sum, c) => sum + (c.metrics?.clicks || 0), 0);
      const totalConversions = campaignsData.reduce((sum, c) => sum + (c.metrics?.conversions || 0), 0);
      const totalSpend = campaignsData.reduce((sum, c) => sum + (c.metrics?.spend || 0), 0);

      const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";
      const engagementRate = totalImpressions > 0 ? ((totalEngagement / totalImpressions) * 100).toFixed(2) : "0.00";
      const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : "0.00";
      const cpc = totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : "0.00";
      const cpm = totalImpressions > 0 ? ((totalSpend / totalImpressions) * 1000).toFixed(2) : "0.00";

      return {
        timestamp: new Date(),
        metrics: {
          impressions: totalImpressions,
          reach: totalReach,
          engagement: totalEngagement,
          clicks: totalClicks,
          conversions: totalConversions,
          spend: totalSpend,
          ctr: parseFloat(ctr as string),
          engagementRate: parseFloat(engagementRate as string),
          conversionRate: parseFloat(conversionRate as string),
          cpc: parseFloat(cpc as string),
          cpm: parseFloat(cpm as string),
        },
        platformBreakdown: {
          facebook: {
            posts: posts.filter(p => p.platforms.includes("facebook")).length,
            impressions: campaignsData
              .filter(c => c.platform === "facebook")
              .reduce((sum, c) => sum + (c.metrics?.impressions || 0), 0),
          },
          instagram: {
            posts: posts.filter(p => p.platforms.includes("instagram")).length,
            impressions: campaignsData
              .filter(c => c.platform === "instagram")
              .reduce((sum, c) => sum + (c.metrics?.impressions || 0), 0),
          },
          tiktok: {
            posts: posts.filter(p => p.platforms.includes("tiktok")).length,
            impressions: 0,
          },
          whatsapp: {
            posts: posts.filter(p => p.platforms.includes("whatsapp")).length,
            impressions: 0,
          },
        },
      };
    } catch (error) {
      console.error("Erro ao obter métricas em tempo real:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  /**
   * Obter histórico de métricas para gráficos
   */
  getMetricsHistory: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
        platform: z.enum(["facebook", "instagram", "tiktok", "whatsapp"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);

        let campaignsData = await db
          .select()
          .from(campaigns)
          .where(
            and(
              eq(campaigns.userId, ctx.user.id),
              gte(campaigns.createdAt, startDate)
            )
          )
          .orderBy(desc(campaigns.createdAt));

        if (input.platform) {
          campaignsData = campaignsData.filter(c => c.platform === input.platform);
        }

        // Agrupar por dia
        const historyByDay: Record<string, any> = {};

        campaignsData.forEach(campaign => {
          const date = new Date(campaign.createdAt).toISOString().split("T")[0];
          if (!historyByDay[date]) {
            historyByDay[date] = {
              date,
              impressions: 0,
              reach: 0,
              engagement: 0,
              clicks: 0,
              conversions: 0,
              spend: 0,
            };
          }

          historyByDay[date].impressions += campaign.metrics?.impressions || 0;
          historyByDay[date].reach += campaign.metrics?.reach || 0;
          historyByDay[date].engagement += campaign.metrics?.engagement || 0;
          historyByDay[date].clicks += campaign.metrics?.clicks || 0;
          historyByDay[date].conversions += campaign.metrics?.conversions || 0;
          historyByDay[date].spend += campaign.metrics?.spend || 0;
        });

        return Object.values(historyByDay).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      } catch (error) {
        console.error("Erro ao obter histórico de métricas:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Obter comparação período a período
   */
  getPeriodsComparison: protectedProcedure
    .input(
      z.object({
        currentPeriodDays: z.number().default(30),
        previousPeriodDays: z.number().default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const now = new Date();
        const currentStart = new Date(now);
        currentStart.setDate(currentStart.getDate() - input.currentPeriodDays);

        const previousStart = new Date(currentStart);
        previousStart.setDate(previousStart.getDate() - input.previousPeriodDays);

        // Obter dados do período atual
        const currentCampaigns = await db
          .select()
          .from(campaigns)
          .where(
            and(
              eq(campaigns.userId, ctx.user.id),
              gte(campaigns.createdAt, currentStart),
              lte(campaigns.createdAt, now)
            )
          );

        // Obter dados do período anterior
        const previousCampaigns = await db
          .select()
          .from(campaigns)
          .where(
            and(
              eq(campaigns.userId, ctx.user.id),
              gte(campaigns.createdAt, previousStart),
              lte(campaigns.createdAt, currentStart)
            )
          );

        const calculateMetrics = (campaigns: any[]) => {
          return {
            impressions: campaigns.reduce((sum, c) => sum + (c.metrics?.impressions || 0), 0),
            reach: campaigns.reduce((sum, c) => sum + (c.metrics?.reach || 0), 0),
            engagement: campaigns.reduce((sum, c) => sum + (c.metrics?.engagement || 0), 0),
            clicks: campaigns.reduce((sum, c) => sum + (c.metrics?.clicks || 0), 0),
            conversions: campaigns.reduce((sum, c) => sum + (c.metrics?.conversions || 0), 0),
            spend: campaigns.reduce((sum, c) => sum + (c.metrics?.spend || 0), 0),
          };
        };

        const currentMetrics = calculateMetrics(currentCampaigns);
        const previousMetrics = calculateMetrics(previousCampaigns);

        const calculateChange = (current: number, previous: number) => {
          if (previous === 0) return current > 0 ? 100 : 0;
          return ((current - previous) / previous) * 100;
        };

        return {
          currentPeriod: {
            metrics: currentMetrics,
            days: input.currentPeriodDays,
          },
          previousPeriod: {
            metrics: previousMetrics,
            days: input.previousPeriodDays,
          },
          changes: {
            impressions: calculateChange(currentMetrics.impressions, previousMetrics.impressions),
            reach: calculateChange(currentMetrics.reach, previousMetrics.reach),
            engagement: calculateChange(currentMetrics.engagement, previousMetrics.engagement),
            clicks: calculateChange(currentMetrics.clicks, previousMetrics.clicks),
            conversions: calculateChange(currentMetrics.conversions, previousMetrics.conversions),
            spend: calculateChange(currentMetrics.spend, previousMetrics.spend),
          },
        };
      } catch (error) {
        console.error("Erro ao obter comparação de períodos:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Obter métricas de um post específico
   */
  getPostMetrics: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const post = await db
          .select()
          .from(multiPlatformPosts)
          .where(
            and(
              eq(multiPlatformPosts.id, input.postId),
              eq(multiPlatformPosts.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (!post.length) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const postData = post[0];
        const relatedCampaigns = await db
          .select()
          .from(campaigns)
          .where(eq(campaigns.userId, ctx.user.id));

        return {
          id: postData.id,
          title: postData.title,
          platforms: postData.platforms,
          scheduledAt: postData.scheduledAt,
          publishedAt: postData.publishedAt,
          status: postData.status,
          metrics: {
            impressions: 0,
            reach: 0,
            engagement: 0,
            clicks: 0,
            conversions: 0,
            spend: 0,
          },
          relatedCampaigns: relatedCampaigns.length,
        };
      } catch (error) {
        console.error("Erro ao obter métricas do post:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Sincronizar métricas com Meta Graph API
   */
  syncMetricsWithMeta: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const metaService = await getMetaGraphService(ctx.user.id);
      if (!metaService) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nenhuma credencial Meta configurada",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Obter credenciais do usuário
      const credentials = await db
        .select()
        .from(platformCredentials)
        .where(eq(platformCredentials.userId, ctx.user.id));

      let syncedAccounts = 0;
      const errors: string[] = [];

      // Sincronizar para cada plataforma
      for (const cred of credentials) {
        if (cred.platform === "facebook" || cred.platform === "instagram") {
          try {
            const insights = await metaService.getPageInsights(
              cred.accountId,
              cred.platform as "facebook" | "instagram"
            );
            syncedAccounts++;
            console.log(`Sincronizado: ${cred.platform} - ${cred.accountName}`);
          } catch (error) {
            errors.push(`Erro ao sincronizar ${cred.platform}: ${error}`);
          }
        }
      }

      return {
        success: true,
        syncedAccounts,
        errors,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Erro ao sincronizar métricas:", error);
      throw TRPCError;
    }
  }),

  /**
   * Exportar métricas em CSV
   */
  exportMetricsCSV: protectedProcedure
    .input(
      z.object({
        days: z.number().default(30),
        platform: z.enum(["facebook", "instagram", "tiktok", "whatsapp"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);

        let campaignsData = await db
          .select()
          .from(campaigns)
          .where(
            and(
              eq(campaigns.userId, ctx.user.id),
              gte(campaigns.createdAt, startDate)
            )
          );

        if (input.platform) {
          campaignsData = campaignsData.filter(c => c.platform === input.platform);
        }

        // Gerar CSV
        const headers = ["Data", "Plataforma", "Impressões", "Alcance", "Engajamento", "Cliques", "Conversões", "Investimento"];
        const rows = campaignsData.map(c => [
          new Date(c.createdAt).toLocaleDateString("pt-BR"),
          c.platform,
          c.metrics?.impressions || 0,
          c.metrics?.reach || 0,
          c.metrics?.engagement || 0,
          c.metrics?.clicks || 0,
          c.metrics?.conversions || 0,
          (c.metrics?.spend || 0).toFixed(2),
        ]);

        const csv = [headers, ...rows].map(row => row.join(",")).join("\n");

        return {
          csv,
          filename: `analytics_${new Date().toISOString().split("T")[0]}.csv`,
          recordsCount: campaignsData.length,
        };
      } catch (error) {
        console.error("Erro ao exportar métricas:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
