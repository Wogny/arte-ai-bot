import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import {
  competitors,
  competitorPosts,
  competitorDailyMetrics,
  competitorHashtags,
  competitorPostingSchedule,
} from "../../drizzle/schema";
import { eq, and, gte, desc } from "drizzle-orm";

export const competitorsRouter = router({
  /**
   * Adicionar concorrente para monitoramento
   */
  addCompetitor: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        platform: z.enum(["facebook", "instagram", "tiktok"]),
        accountId: z.string().min(1),
        accountUrl: z.string().url().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db.insert(competitors).values({
          userId: ctx.user.id,
          name: input.name,
          platform: input.platform,
          accountId: input.accountId,
          accountUrl: input.accountUrl,
          description: input.description,
          category: input.category,
          isActive: true,
        });

        return {
          success: true,
          message: "Concorrente adicionado com sucesso",
        };
      } catch (error) {
        console.error("Erro ao adicionar concorrente:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Obter lista de concorrentes monitorados
   */
  listCompetitors: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["facebook", "instagram", "tiktok"]).optional(),
        active: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const result = await db
          .select()
          .from(competitors)
          .where(
            and(
              eq(competitors.userId, ctx.user.id),
              eq(competitors.isActive, input.active),
              input.platform ? eq(competitors.platform, input.platform) : undefined
            )
          )
          .orderBy(desc(competitors.createdAt));

        return result.map((c) => ({
          id: c.id,
          name: c.name,
          platform: c.platform,
          accountId: c.accountId,
          accountUrl: c.accountUrl,
          description: c.description,
          category: c.category,
          lastSyncedAt: c.lastSyncedAt,
          createdAt: c.createdAt,
        }));
      } catch (error) {
        console.error("Erro ao listar concorrentes:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Obter detalhes de um concorrente
   */
  getCompetitorDetails: protectedProcedure
    .input(z.object({ competitorId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const competitor = await db
          .select()
          .from(competitors)
          .where(
            and(
              eq(competitors.id, input.competitorId),
              eq(competitors.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (!competitor.length) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const c = competitor[0];

        // Obter últimas métricas
        const latestMetrics = await db
          .select()
          .from(competitorDailyMetrics)
          .where(eq(competitorDailyMetrics.competitorId, input.competitorId))
          .orderBy(desc(competitorDailyMetrics.date))
          .limit(1);

        // Obter posts recentes
        const recentPosts = await db
          .select()
          .from(competitorPosts)
          .where(eq(competitorPosts.competitorId, input.competitorId))
          .orderBy(desc(competitorPosts.publishedAt))
          .limit(10);

        return {
          id: c.id,
          name: c.name,
          platform: c.platform,
          accountId: c.accountId,
          accountUrl: c.accountUrl,
          description: c.description,
          category: c.category,
          lastSyncedAt: c.lastSyncedAt,
          metrics: latestMetrics.length > 0 ? latestMetrics[0] : null,
          recentPosts: recentPosts.map((p) => ({
            id: p.id,
            postId: p.postId,
            caption: p.caption,
            engagement: p.engagement,
            likes: p.likes,
            comments: p.comments,
            publishedAt: p.publishedAt,
          })),
        };
      } catch (error) {
        console.error("Erro ao obter detalhes do concorrente:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Obter métricas históricas de um concorrente
   */
  getCompetitorMetricsHistory: protectedProcedure
    .input(
      z.object({
        competitorId: z.number(),
        days: z.number().default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Verificar permissão
        const competitor = await db
          .select()
          .from(competitors)
          .where(
            and(
              eq(competitors.id, input.competitorId),
              eq(competitors.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (!competitor.length) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);

        const metrics = await db
          .select()
          .from(competitorDailyMetrics)
          .where(
            and(
              eq(competitorDailyMetrics.competitorId, input.competitorId),
              gte(competitorDailyMetrics.date, startDate.toISOString().split("T")[0])
            )
          )
          .orderBy(competitorDailyMetrics.date);

        return metrics.map((m) => ({
          date: m.date,
          followers: m.followers,
          followersGrowth: m.followersGrowth,
          postsCount: m.postsCount,
          totalImpressions: m.totalImpressions,
          totalReach: m.totalReach,
          totalEngagement: m.totalEngagement,
          averageEngagementRate: parseFloat(m.averageEngagementRate),
        }));
      } catch (error) {
        console.error("Erro ao obter histórico de métricas:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Obter análise de hashtags de um concorrente
   */
  getCompetitorHashtags: protectedProcedure
    .input(
      z.object({
        competitorId: z.number(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Verificar permissão
        const competitor = await db
          .select()
          .from(competitors)
          .where(
            and(
              eq(competitors.id, input.competitorId),
              eq(competitors.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (!competitor.length) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const hashtags = await db
          .select()
          .from(competitorHashtags)
          .where(eq(competitorHashtags.competitorId, input.competitorId))
          .orderBy(desc(competitorHashtags.frequency))
          .limit(input.limit);

        return hashtags.map((h) => ({
          hashtag: h.hashtag,
          frequency: h.frequency,
          engagementAverage: parseFloat(h.engagementAverage),
          lastUsedAt: h.lastUsedAt,
        }));
      } catch (error) {
        console.error("Erro ao obter hashtags:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Obter análise de horários de postagem
   */
  getPostingScheduleAnalysis: protectedProcedure
    .input(z.object({ competitorId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Verificar permissão
        const competitor = await db
          .select()
          .from(competitors)
          .where(
            and(
              eq(competitors.id, input.competitorId),
              eq(competitors.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (!competitor.length) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const schedule = await db
          .select()
          .from(competitorPostingSchedule)
          .where(eq(competitorPostingSchedule.competitorId, input.competitorId));

        // Organizar por dia da semana
        const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
        const organized: Record<string, any[]> = {};

        schedule.forEach((s) => {
          const dayName = dayNames[s.dayOfWeek];
          if (!organized[dayName]) {
            organized[dayName] = [];
          }
          organized[dayName].push({
            hour: s.hour,
            postsCount: s.postsCount,
            averageEngagement: parseFloat(s.averageEngagement),
          });
        });

        return organized;
      } catch (error) {
        console.error("Erro ao obter análise de horários:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Comparar dois concorrentes
   */
  compareCompetitors: protectedProcedure
    .input(
      z.object({
        competitorId1: z.number(),
        competitorId2: z.number(),
        days: z.number().default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Verificar permissões
        const competitors1 = await db
          .select()
          .from(competitors)
          .where(
            and(
              eq(competitors.id, input.competitorId1),
              eq(competitors.userId, ctx.user.id)
            )
          );

        const competitors2 = await db
          .select()
          .from(competitors)
          .where(
            and(
              eq(competitors.id, input.competitorId2),
              eq(competitors.userId, ctx.user.id)
            )
          );

        if (!competitors1.length || !competitors2.length) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);
        const dateStr = startDate.toISOString().split("T")[0];

        // Obter métricas do primeiro concorrente
        const metrics1 = await db
          .select()
          .from(competitorDailyMetrics)
          .where(
            and(
              eq(competitorDailyMetrics.competitorId, input.competitorId1),
              gte(competitorDailyMetrics.date, dateStr)
            )
          );

        // Obter métricas do segundo concorrente
        const metrics2 = await db
          .select()
          .from(competitorDailyMetrics)
          .where(
            and(
              eq(competitorDailyMetrics.competitorId, input.competitorId2),
              gte(competitorDailyMetrics.date, dateStr)
            )
          );

        const aggregate = (metrics: any[]) => ({
          totalImpressions: metrics.reduce((sum, m) => sum + m.totalImpressions, 0),
          totalReach: metrics.reduce((sum, m) => sum + m.totalReach, 0),
          totalEngagement: metrics.reduce((sum, m) => sum + m.totalEngagement, 0),
          avgEngagementRate:
            metrics.length > 0
              ? metrics.reduce((sum, m) => sum + parseFloat(m.averageEngagementRate), 0) /
                metrics.length
              : 0,
          postsCount: metrics.reduce((sum, m) => sum + m.postsCount, 0),
        });

        const agg1 = aggregate(metrics1);
        const agg2 = aggregate(metrics2);

        return {
          competitor1: {
            name: competitors1[0].name,
            metrics: agg1,
            advantage: {
              impressions: agg1.totalImpressions - agg2.totalImpressions,
              reach: agg1.totalReach - agg2.totalReach,
              engagement: agg1.totalEngagement - agg2.totalEngagement,
            },
          },
          competitor2: {
            name: competitors2[0].name,
            metrics: agg2,
            advantage: {
              impressions: agg2.totalImpressions - agg1.totalImpressions,
              reach: agg2.totalReach - agg1.totalReach,
              engagement: agg2.totalEngagement - agg1.totalEngagement,
            },
          },
        };
      } catch (error) {
        console.error("Erro ao comparar concorrentes:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Deletar concorrente
   */
  deleteCompetitor: protectedProcedure
    .input(z.object({ competitorId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Verificar permissão
        const competitor = await db
          .select()
          .from(competitors)
          .where(
            and(
              eq(competitors.id, input.competitorId),
              eq(competitors.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (!competitor.length) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        // Deletar dados relacionados
        await db
          .delete(competitorPosts)
          .where(eq(competitorPosts.competitorId, input.competitorId));

        await db
          .delete(competitorDailyMetrics)
          .where(eq(competitorDailyMetrics.competitorId, input.competitorId));

        await db
          .delete(competitorHashtags)
          .where(eq(competitorHashtags.competitorId, input.competitorId));

        await db
          .delete(competitorPostingSchedule)
          .where(eq(competitorPostingSchedule.competitorId, input.competitorId));

        // Deletar concorrente
        await db
          .delete(competitors)
          .where(eq(competitors.id, input.competitorId));

        return { success: true };
      } catch (error) {
        console.error("Erro ao deletar concorrente:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
