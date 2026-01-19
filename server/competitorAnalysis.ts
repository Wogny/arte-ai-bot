import axios from "axios";
import { getDb } from "./db";
import {
  competitors,
  competitorPosts,
  competitorDailyMetrics,
  competitorHashtags,
  competitorPostingSchedule,
} from '../drizzle/schema.js';
import { eq, and, gte, lte } from "drizzle-orm";

interface CompetitorPostData {
  postId: string;
  caption: string;
  mediaUrl?: string;
  mediaType: "image" | "video" | "carousel";
  impressions: number;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  hashtags: string[];
  mentions: string[];
  postUrl: string;
  publishedAt: Date;
}

interface CompetitorMetrics {
  followers: number;
  followersGrowth: number;
  postsCount: number;
  totalImpressions: number;
  totalReach: number;
  totalEngagement: number;
  averageEngagementRate: number;
  topPostId?: string;
  topPostEngagement: number;
  bestPostingHour?: string;
}

/**
 * Serviço para coleta e análise de dados de concorrentes
 */
export class CompetitorAnalysisService {
  private baseUrl = "https://graph.instagram.com/v18.0";
  private facebookBaseUrl = "https://graph.facebook.com/v18.0";

  constructor(private accessToken: string) {}

  /**
   * Coletar posts recentes de um concorrente
   */
  async collectCompetitorPosts(
    accountId: string,
    platform: "facebook" | "instagram" | "tiktok",
    limit: number = 50
  ): Promise<CompetitorPostData[]> {
    try {
      const baseUrl = platform === "facebook" ? this.facebookBaseUrl : this.baseUrl;

      const response = await axios.get(`${baseUrl}/${accountId}/posts`, {
        params: {
          fields: "id,caption,media_type,media_url,impressions,engagement,like_count,comments_count,shares_count,permalink,timestamp",
          limit,
          access_token: this.accessToken,
        },
      });

      const posts = response.data.data || [];

      return posts.map((post: any) => {
        const caption = post.caption || "";
        const hashtags = caption.match(/#\w+/g) || [];
        const mentions = caption.match(/@\w+/g) || [];

        return {
          postId: post.id,
          caption,
          mediaUrl: post.media_url,
          mediaType: post.media_type || "image",
          impressions: post.impressions || 0,
          reach: post.reach || 0,
          engagement: post.engagement || 0,
          likes: post.like_count || 0,
          comments: post.comments_count || 0,
          shares: post.shares_count || 0,
          saves: 0,
          hashtags,
          mentions,
          postUrl: post.permalink,
          publishedAt: new Date(post.timestamp),
        };
      });
    } catch (error) {
      console.error("Erro ao coletar posts do concorrente:", error);
      throw new Error("Falha ao coletar posts do concorrente");
    }
  }

  /**
   * Calcular métricas diárias de um concorrente
   */
  async calculateDailyMetrics(
    competitorId: number,
    posts: CompetitorPostData[]
  ): Promise<CompetitorMetrics> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Obter posts anteriores para calcular crescimento
      const previousPosts = await db
        .select()
        .from(competitorPosts)
        .where(eq(competitorPosts.competitorId, competitorId))
        .orderBy(competitorPosts.publishedAt);

      const totalImpressions = posts.reduce((sum, p) => sum + p.impressions, 0);
      const totalReach = posts.reduce((sum, p) => sum + p.reach, 0);
      const totalEngagement = posts.reduce((sum, p) => sum + p.engagement, 0);
      const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);

      // Encontrar post com melhor engajamento
      const topPost = posts.reduce((best, current) =>
        current.engagement > best.engagement ? current : best
      );

      // Calcular melhor hora para postar
      const hourDistribution: Record<number, number> = {};
      posts.forEach((post) => {
        const hour = new Date(post.publishedAt).getHours();
        hourDistribution[hour] = (hourDistribution[hour] || 0) + post.engagement;
      });

      const bestHour = Object.entries(hourDistribution).reduce((best, [hour, engagement]) =>
        engagement > best[1] ? [hour, engagement] : best,
        ["0", 0]
      )[0];

      const avgEngagementRate =
        totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;

      return {
        followers: 0, // Será preenchido pela API
        followersGrowth: 0,
        postsCount: posts.length,
        totalImpressions,
        totalReach,
        totalEngagement,
        averageEngagementRate: avgEngagementRate,
        topPostId: topPost.postId,
        topPostEngagement: topPost.engagement,
        bestPostingHour: String(bestHour).padStart(2, "0"),
      };
    } catch (error) {
      console.error("Erro ao calcular métricas diárias:", error);
      throw new Error("Falha ao calcular métricas diárias");
    }
  }

  /**
   * Analisar hashtags usadas pelo concorrente
   */
  async analyzeHashtags(posts: CompetitorPostData[]): Promise<Map<string, any>> {
    const hashtagMap = new Map<string, any>();

    posts.forEach((post) => {
      post.hashtags.forEach((hashtag) => {
        if (hashtagMap.has(hashtag)) {
          const data = hashtagMap.get(hashtag);
          data.frequency += 1;
          data.engagementTotal += post.engagement;
          data.engagementAverage = data.engagementTotal / data.frequency;
          data.lastUsedAt = new Date();
        } else {
          hashtagMap.set(hashtag, {
            hashtag,
            frequency: 1,
            engagementTotal: post.engagement,
            engagementAverage: post.engagement,
            lastUsedAt: new Date(),
          });
        }
      });
    });

    return hashtagMap;
  }

  /**
   * Analisar padrão de postagem (dia e hora)
   */
  async analyzePostingSchedule(posts: CompetitorPostData[]): Promise<Map<string, any>> {
    const scheduleMap = new Map<string, any>();

    posts.forEach((post) => {
      const date = new Date(post.publishedAt);
      const dayOfWeek = date.getDay();
      const hour = date.getHours();
      const key = `${dayOfWeek}-${hour}`;

      if (scheduleMap.has(key)) {
        const data = scheduleMap.get(key);
        data.postsCount += 1;
        data.engagementTotal += post.engagement;
        data.averageEngagement = data.engagementTotal / data.postsCount;
      } else {
        scheduleMap.set(key, {
          dayOfWeek,
          hour,
          postsCount: 1,
          engagementTotal: post.engagement,
          averageEngagement: post.engagement,
        });
      }
    });

    return scheduleMap;
  }

  /**
   * Comparar métricas entre dois concorrentes
   */
  async compareCompetitors(
    competitorId1: number,
    competitorId2: number,
    days: number = 30
  ): Promise<any> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Obter métricas do primeiro concorrente
      const metrics1 = await db
        .select()
        .from(competitorDailyMetrics)
        .where(
          and(
            eq(competitorDailyMetrics.competitorId, competitorId1),
            gte(competitorDailyMetrics.date, startDate.toISOString().split("T")[0])
          )
        );

      // Obter métricas do segundo concorrente
      const metrics2 = await db
        .select()
        .from(competitorDailyMetrics)
        .where(
          and(
            eq(competitorDailyMetrics.competitorId, competitorId2),
            gte(competitorDailyMetrics.date, startDate.toISOString().split("T")[0])
          )
        );

      // Calcular agregações
      const aggregate = (metrics: any[]) => ({
        totalImpressions: metrics.reduce((sum, m) => sum + m.totalImpressions, 0),
        totalReach: metrics.reduce((sum, m) => sum + m.totalReach, 0),
        totalEngagement: metrics.reduce((sum, m) => sum + m.totalEngagement, 0),
        avgEngagementRate:
          metrics.reduce((sum, m) => sum + parseFloat(m.averageEngagementRate), 0) /
          metrics.length,
        postsCount: metrics.reduce((sum, m) => sum + m.postsCount, 0),
      });

      const agg1 = aggregate(metrics1);
      const agg2 = aggregate(metrics2);

      return {
        competitor1: {
          metrics: agg1,
          growthRate: {
            impressions: agg1.totalImpressions - agg2.totalImpressions,
            reach: agg1.totalReach - agg2.totalReach,
            engagement: agg1.totalEngagement - agg2.totalEngagement,
          },
        },
        competitor2: {
          metrics: agg2,
          growthRate: {
            impressions: agg2.totalImpressions - agg1.totalImpressions,
            reach: agg2.totalReach - agg1.totalReach,
            engagement: agg2.totalEngagement - agg1.totalEngagement,
          },
        },
      };
    } catch (error) {
      console.error("Erro ao comparar concorrentes:", error);
      throw new Error("Falha ao comparar concorrentes");
    }
  }

  /**
   * Obter insights de concorrentes
   */
  async getCompetitorInsights(competitorId: number): Promise<any> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Obter posts do concorrente
      const posts = await db
        .select()
        .from(competitorPosts)
        .where(eq(competitorPosts.competitorId, competitorId))
        .orderBy(competitorPosts.publishedAt);

      // Obter hashtags mais usados
      const hashtags = await db
        .select()
        .from(competitorHashtags)
        .where(eq(competitorHashtags.competitorId, competitorId))
        .orderBy(competitorHashtags.frequency);

      // Obter melhor hora para postar
      const schedule = await db
        .select()
        .from(competitorPostingSchedule)
        .where(eq(competitorPostingSchedule.competitorId, competitorId));

      // Calcular insights
      const topHashtags = hashtags.slice(0, 10);
      const bestHours = schedule
        .sort((a, b) => parseFloat(b.averageEngagement) - parseFloat(a.averageEngagement))
        .slice(0, 5);

      const avgPostsPerDay = posts.length / 30; // Assumindo 30 dias
      const avgEngagement =
        posts.reduce((sum, p) => sum + p.engagement, 0) / posts.length;

      return {
        totalPosts: posts.length,
        avgPostsPerDay,
        avgEngagement,
        topHashtags: topHashtags.map((h) => ({
          hashtag: h.hashtag,
          frequency: h.frequency,
          engagementAverage: h.engagementAverage,
        })),
        bestPostingHours: bestHours.map((h) => ({
          dayOfWeek: h.dayOfWeek,
          hour: h.hour,
          averageEngagement: h.averageEngagement,
        })),
        contentTypes: {
          images: posts.filter((p) => p.mediaType === "image").length,
          videos: posts.filter((p) => p.mediaType === "video").length,
          carousels: posts.filter((p) => p.mediaType === "carousel").length,
        },
      };
    } catch (error) {
      console.error("Erro ao obter insights:", error);
      throw new Error("Falha ao obter insights");
    }
  }
}

/**
 * Sincronizar dados de todos os concorrentes do usuário
 */
export async function syncAllCompetitors(userId: number): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    // Obter todos os concorrentes do usuário
    const userCompetitors = await db
      .select()
      .from(competitors)
      .where(and(eq(competitors.userId, userId), eq(competitors.isActive, true)));

    for (const competitor of userCompetitors) {
      try {
        // Aqui você integraria com a API real do Instagram/Facebook
        console.log(`Sincronizando dados do concorrente: ${competitor.name}`);
        // await service.collectCompetitorPosts(competitor.accountId, competitor.platform);
      } catch (error) {
        console.error(`Erro ao sincronizar ${competitor.name}:`, error);
      }
    }
  } catch (error) {
    console.error("Erro ao sincronizar concorrentes:", error);
  }
}
