import { getDb } from "../db.js";
import { subscriptions, scheduledPosts, platformCredentials } from '../../drizzle/schema.js';
import { eq, and, count, gte } from "drizzle-orm";

export type PlanType = "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

// Definição dos limites de cada plano
const PLAN_LIMITS = {
  STARTER: {
    name: "Starter",
    maxPosts: 30,
    maxPlatforms: 2,
    maxImages: 50,
  },
  PROFESSIONAL: {
    name: "Professional",
    maxPosts: 200,
    maxPlatforms: 5,
    maxImages: 500,
  },
  ENTERPRISE: {
    name: "Enterprise",
    maxPosts: -1, // ilimitado
    maxPlatforms: -1,
    maxImages: -1,
  },
};

/**
 * Gerencia as quotas e limites de uso dos usuários baseados em seus planos
 */
export class QuotaManager {
  /**
   * Obtém o plano atual do usuário
   */
  static async getUserPlan(userId: number): Promise<PlanType> {
    const db = await getDb();
    if (!db) return "STARTER";

    const sub = await db.select().from(subscriptions).where(
      and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active"))
    ).limit(1);

    if (!sub.length) return "STARTER";
    
    // Mapeia o planId para o tipo de plano
    const planId = sub[0].planId;
    if (planId === 1) return "STARTER";
    if (planId === 2) return "PROFESSIONAL";
    if (planId === 3) return "ENTERPRISE";
    
    return "STARTER";
  }

  /**
   * Verifica se o usuário pode agendar um novo post
   */
  static async canSchedulePost(userId: number): Promise<{ allowed: boolean; message?: string }> {
    const db = await getDb();
    if (!db) return { allowed: false, message: "Erro de conexão" };

    const planType = await this.getUserPlan(userId);
    const plan = PLAN_LIMITS[planType];

    if (plan.maxPosts === -1) return { allowed: true };

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await db.select({ value: count() }).from(scheduledPosts).where(
      and(
        eq(scheduledPosts.userId, userId),
        gte(scheduledPosts.createdAt, startOfMonth)
      )
    );

    const currentUsage = usage[0].value;

    if (currentUsage >= plan.maxPosts) {
      return { 
        allowed: false, 
        message: `Você atingiu o limite de ${plan.maxPosts} posts mensais do plano ${plan.name}. Faça upgrade para postar mais!` 
      };
    }

    return { allowed: true };
  }

  /**
   * Verifica se o usuário pode conectar uma nova plataforma
   */
  static async canConnectPlatform(userId: number): Promise<{ allowed: boolean; message?: string }> {
    const db = await getDb();
    if (!db) return { allowed: false, message: "Erro de conexão" };

    const planType = await this.getUserPlan(userId);
    const plan = PLAN_LIMITS[planType];

    if (plan.maxPlatforms === -1) return { allowed: true };

    const usage = await db.select({ value: count() }).from(platformCredentials).where(
      and(eq(platformCredentials.userId, userId), eq(platformCredentials.isActive, true))
    );

    const currentUsage = usage[0].value;

    if (currentUsage >= plan.maxPlatforms) {
      return { 
        allowed: false, 
        message: `Seu plano ${plan.name} permite apenas ${plan.maxPlatforms} conexões simultâneas.` 
      };
    }

    return { allowed: true };
  }

  /**
   * Obtém os limites do plano do usuário
   */
  static async getPlanLimits(userId: number) {
    const planType = await this.getUserPlan(userId);
    return PLAN_LIMITS[planType];
  }
}
