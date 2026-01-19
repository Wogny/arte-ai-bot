import axios, { AxiosInstance } from "axios";
import * as db from "./db";
import { platformCredentials } from '../drizzle/schema.js';
import { eq, and } from "drizzle-orm";

interface MetaMetrics {
  impressions: number;
  reach: number;
  clicks: number;
  engagement: number;
  conversions: number;
  spend: number;
  ctr: number;
  engagementRate: number;
  timestamp: Date;
}

interface MetaInsight {
  date: string;
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
  conversions?: number;
}

interface PlatformMetrics {
  platform: "facebook" | "instagram";
  accountId: string;
  accountName: string;
  metrics: MetaMetrics;
  insights: MetaInsight[];
}

/**
 * Serviço para integração com Meta Graph API
 * Coleta métricas de posts e campanhas em tempo real
 */
export class MetaGraphAPIService {
  private client: AxiosInstance;
  private baseUrl = "https://graph.instagram.com/v18.0";
  private facebookBaseUrl = "https://graph.facebook.com/v18.0";

  constructor(private accessToken: string) {
    this.client = axios.create({
      timeout: 10000,
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });
  }

  /**
   * Obter métricas de um post específico
   */
  async getPostMetrics(postId: string, platform: "facebook" | "instagram"): Promise<MetaMetrics> {
    try {
      const baseUrl = platform === "facebook" ? this.facebookBaseUrl : this.baseUrl;
      const fields = "impressions,reach,engagement,clicks,video_views";

      const response = await this.client.get(`${baseUrl}/${postId}`, {
        params: {
          fields,
          access_token: this.accessToken,
        },
      });

      const data = response.data;
      const impressions = data.impressions || 0;
      const engagement = data.engagement || 0;
      const clicks = data.clicks || 0;

      return {
        impressions,
        reach: data.reach || 0,
        clicks,
        engagement,
        conversions: 0,
        spend: 0,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        engagementRate: impressions > 0 ? (engagement / impressions) * 100 : 0,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Erro ao obter métricas do post:", error);
      throw new Error("Falha ao obter métricas do Meta");
    }
  }

  /**
   * Obter insights de uma página/perfil
   */
  async getPageInsights(pageId: string, platform: "facebook" | "instagram", period: "day" | "week" | "month" = "day"): Promise<MetaInsight[]> {
    try {
      const baseUrl = platform === "facebook" ? this.facebookBaseUrl : this.baseUrl;
      const fields = "impressions,reach,engagement,clicks,post_impressions,post_engagement";

      const response = await this.client.get(`${baseUrl}/${pageId}/insights`, {
        params: {
          metric: fields,
          period,
          access_token: this.accessToken,
        },
      });

      const insights: MetaInsight[] = [];
      const data = response.data.data || [];

      // Processar dados de insights
      data.forEach((metric: any) => {
        const values = metric.values || [];
        values.forEach((value: any) => {
          insights.push({
            date: value.end_time || new Date().toISOString(),
            impressions: metric.name === "page_impressions" ? value.value : 0,
            reach: metric.name === "page_fans" ? value.value : 0,
            engagement: metric.name === "page_engaged_users" ? value.value : 0,
            clicks: metric.name === "page_clicks" ? value.value : 0,
          });
        });
      });

      return insights;
    } catch (error) {
      console.error("Erro ao obter insights:", error);
      throw new Error("Falha ao obter insights do Meta");
    }
  }

  /**
   * Obter métricas de campanha
   */
  async getCampaignMetrics(campaignId: string): Promise<MetaMetrics> {
    try {
      const response = await this.client.get(`${this.facebookBaseUrl}/${campaignId}`, {
        params: {
          fields: "impressions,spend,clicks,actions,action_values",
          access_token: this.accessToken,
        },
      });

      const data = response.data;
      const impressions = data.impressions || 0;
      const clicks = data.clicks || 0;
      const spend = parseFloat(data.spend) || 0;
      const actions = data.actions || [];

      // Calcular conversões a partir de actions
      const conversions = actions.reduce((sum: number, action: any) => {
        return sum + (action.value || 0);
      }, 0);

      return {
        impressions,
        reach: impressions, // Meta não diferencia reach em campanhas
        clicks,
        engagement: conversions,
        conversions,
        spend,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        engagementRate: impressions > 0 ? (conversions / impressions) * 100 : 0,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Erro ao obter métricas de campanha:", error);
      throw new Error("Falha ao obter métricas de campanha");
    }
  }

  /**
   * Obter lista de posts recentes com métricas
   */
  async getRecentPostsMetrics(pageId: string, platform: "facebook" | "instagram", limit: number = 10): Promise<Array<{ id: string; metrics: MetaMetrics }>> {
    try {
      const baseUrl = platform === "facebook" ? this.facebookBaseUrl : this.baseUrl;

      const response = await this.client.get(`${baseUrl}/${pageId}/posts`, {
        params: {
          fields: "id,impressions,reach,engagement,clicks,created_time",
          limit,
          access_token: this.accessToken,
        },
      });

      const posts = response.data.data || [];
      const postsWithMetrics = posts.map((post: any) => ({
        id: post.id,
        metrics: {
          impressions: post.impressions || 0,
          reach: post.reach || 0,
          clicks: post.clicks || 0,
          engagement: post.engagement || 0,
          conversions: 0,
          spend: 0,
          ctr: post.impressions > 0 ? (post.clicks / post.impressions) * 100 : 0,
          engagementRate: post.impressions > 0 ? (post.engagement / post.impressions) * 100 : 0,
          timestamp: new Date(),
        },
      }));

      return postsWithMetrics;
    } catch (error) {
      console.error("Erro ao obter posts recentes:", error);
      throw new Error("Falha ao obter posts recentes");
    }
  }

  /**
   * Obter métricas de múltiplas contas
   */
  async getMultipleAccountsMetrics(accountIds: string[], platform: "facebook" | "instagram"): Promise<PlatformMetrics[]> {
    try {
      const metrics: PlatformMetrics[] = [];

      for (const accountId of accountIds) {
        const pageMetrics = await this.getPageInsights(accountId, platform);
        const recentPosts = await this.getRecentPostsMetrics(accountId, platform);

        // Calcular métricas agregadas
        const aggregatedMetrics: MetaMetrics = {
          impressions: pageMetrics.reduce((sum, m) => sum + m.impressions, 0),
          reach: pageMetrics.reduce((sum, m) => sum + m.reach, 0),
          clicks: pageMetrics.reduce((sum, m) => sum + m.clicks, 0),
          engagement: pageMetrics.reduce((sum, m) => sum + m.engagement, 0),
          conversions: 0,
          spend: 0,
          ctr: 0,
          engagementRate: 0,
          timestamp: new Date(),
        };

        // Calcular taxas
        if (aggregatedMetrics.impressions > 0) {
          aggregatedMetrics.ctr = (aggregatedMetrics.clicks / aggregatedMetrics.impressions) * 100;
          aggregatedMetrics.engagementRate = (aggregatedMetrics.engagement / aggregatedMetrics.impressions) * 100;
        }

        metrics.push({
          platform,
          accountId,
          accountName: `${platform} Account`,
          metrics: aggregatedMetrics,
          insights: pageMetrics,
        });
      }

      return metrics;
    } catch (error) {
      console.error("Erro ao obter métricas de múltiplas contas:", error);
      throw new Error("Falha ao obter métricas de múltiplas contas");
    }
  }
}

/**
 * Obter serviço de Meta Graph API para um usuário
 */
export async function getMetaGraphService(userId: number): Promise<MetaGraphAPIService | null> {
  try {
    const database = await db.getDb();
    if (!database) return null;

    const credentials = await database
      .select()
      .from(platformCredentials)
      .where(
        and(
          eq(platformCredentials.userId, userId),
          eq(platformCredentials.platform, "facebook")
        )
      )
      .limit(1);

    if (!credentials.length) {
      return null;
    }

    return new MetaGraphAPIService(credentials[0].accessToken);
  } catch (error) {
    console.error("Erro ao obter serviço Meta Graph API:", error);
    return null;
  }
}

/**
 * Sincronizar métricas de todas as contas do usuário
 */
export async function syncUserMetrics(userId: number): Promise<void> {
  try {
    const service = await getMetaGraphService(userId);
    if (!service) {
      console.log("Nenhuma credencial Meta encontrada para o usuário");
      return;
    }

    const database = await db.getDb();
    if (!database) return;

    // Obter todas as credenciais do usuário
    const credentials = await database
      .select()
      .from(platformCredentials)
      .where(eq(platformCredentials.userId, userId));

    // Sincronizar métricas para cada plataforma
    for (const cred of credentials) {
      if (cred.platform === "facebook" || cred.platform === "instagram") {
        try {
          await service.getPageInsights(cred.accountId, cred.platform as "facebook" | "instagram");
          console.log(`Métricas sincronizadas para ${cred.platform} - ${cred.accountName}`);
        } catch (error) {
          console.error(`Erro ao sincronizar ${cred.platform}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Erro ao sincronizar métricas do usuário:", error);
  }
}
