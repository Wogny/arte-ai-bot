import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import { getDb } from "../_core/db.js";
import { TRPCError } from "@trpc/server";
import { subscriptions, payments, subscriptionPlans } from '../../drizzle/schema.js';
import { eq } from "drizzle-orm";

// Mercado Pago é usado em vez do Stripe

export const billingRouter = router({
  /**
   * Obter planos disponíveis
   */
  getPlans: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const plans = await db.select().from(subscriptionPlans);
    return plans;
  }),

  /**
   * Obter subscrição atual do usuário
   */
  getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const userSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.user.id))
      .limit(1);

    if (!userSubscription.length) {
      return null;
    }

    const subscription = userSubscription[0];
    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, subscription.planId))
      .limit(1);

    return {
      ...subscription,
      plan: plan[0] || null,
    };
  }),

  /**
   * Cancelar subscrição
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const userSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.user.id))
      .limit(1);

    if (!userSubscription.length) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Nenhuma subscrição ativa",
      });
    }

    const subscription = userSubscription[0];

    try {
      // Atualizar no banco de dados
      await db
        .update(subscriptions)
        .set({
          status: "canceled",
          canceledAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription.id));

      return {
        success: true,
        message: "Subscrição cancelada com sucesso",
      };
    } catch (error) {
      console.error("Erro ao cancelar subscrição:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao cancelar subscrição",
      });
    }
  }),

  /**
   * Obter histórico de pagamentos
   */
  getPaymentHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const userPayments = await db
        .select()
        .from(payments)
        .where(eq(payments.userId, ctx.user.id))
        .limit(input.limit)
        .offset(input.offset);

      return userPayments;
    }),

  /**
   * Obter uso de recursos do mês atual
   */
  getCurrentUsage: protectedProcedure.query(async ({ ctx }) => {
    // Simulação: retornar uso atual
    const usage = {
      postsCreated: 3,
      campaignsCreated: 1,
      platformsConnected: 2,
      usersInvited: 1,
    };

    return usage;
  }),

  /**
   * Obter uso detalhado com limites para página de upgrade
   */
  getUsage: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Importar funções de uso
    const { getMonthlyUsage } = await import("../db");
    const { getUserLimits } = await import("../middleware/subscription");
    
    const usage = await getMonthlyUsage(ctx.user.id);
    const { limits } = await getUserLimits(ctx.user.id);

    return {
      images: { current: usage.images, limit: limits.imagesPerMonth },
      captions: { current: usage.captions, limit: limits.captionsPerMonth },
      scheduled: { current: usage.scheduledPosts, limit: limits.scheduledPosts },
      platforms: { current: usage.platforms, limit: limits.platforms },
    };
  }),

  /**
   * Obter plano atual do usuário
   */
  getCurrentPlan: protectedProcedure.query(async ({ ctx }) => {
    const { getUserPlan, PLAN_LIMITS } = await import("../middleware/subscription");
    const plan = await getUserPlan(ctx.user.id);
    
    const planNames: Record<string, string> = {
      free: "Gratuito",
      starter: "Starter",
      professional: "Professional",
      enterprise: "Enterprise",
    };

    return {
      id: plan,
      name: planNames[plan] || plan,
      limits: PLAN_LIMITS[plan],
    };
  }),

  /**
   * Verificar se usuário pode executar ação baseado no plano
   */
  checkLimit: protectedProcedure
    .input(
      z.object({
        resource: z.enum(["posts", "campaigns", "platforms", "users"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Obter subscrição do usuário
      const userSubscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, ctx.user.id))
        .limit(1);

      if (!userSubscription.length) {
        return { allowed: false, message: "Nenhuma subscrição ativa" };
      }

      const subscription = userSubscription[0];

      // Obter plano
      const plan = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, subscription.planId))
        .limit(1);

      if (!plan.length) {
        return { allowed: false, message: "Plano não encontrado" };
      }

      const planConfig = plan[0];

      // Verificar limite baseado no recurso
      const limits: Record<string, number> = {
        posts: planConfig.maxPosts || 0,
        campaigns: planConfig.maxCampaigns || 0,
        platforms: planConfig.maxPlatforms || 0,
        users: planConfig.maxUsers || 0,
      };

      const limit = limits[input.resource];

      // -1 significa ilimitado
      if (limit === -1) {
        return { allowed: true, message: "Recurso ilimitado" };
      }

      return {
        allowed: true,
        limit,
        message: `Limite: ${limit} ${input.resource}/mês`,
      };
    }),
});
