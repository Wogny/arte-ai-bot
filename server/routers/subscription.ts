import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { subscriptions, payments, subscriptionPlans } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

export const subscriptionRouter = router({
  /**
   * Obter status atual da assinatura do usuário
   */
  getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const subscription = await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        planId: subscriptions.planId,
        status: subscriptions.status,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        canceledAt: subscriptions.canceledAt,
        trialEndsAt: subscriptions.trialEndsAt,
        isTrialActive: subscriptions.isTrialActive,
        createdAt: subscriptions.createdAt,
        updatedAt: subscriptions.updatedAt,
        planName: subscriptionPlans.name,
        planPrice: subscriptionPlans.priceMonthly,
        planFeatures: subscriptionPlans.features,
      })
      .from(subscriptions)
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.userId, ctx.user.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (subscription.length === 0) {
      return null;
    }

    const sub = subscription[0];
    const now = new Date();
    const isExpired = sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) < now;
    const daysRemaining = sub.currentPeriodEnd
      ? Math.ceil((new Date(sub.currentPeriodEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      id: sub.id,
      userId: sub.userId,
      planId: sub.planId,
      planName: sub.planName,
      planPrice: sub.planPrice,
      planFeatures: sub.planFeatures,
      status: sub.status,
      isActive: sub.status === "active" && !isExpired,
      isExpired,
      daysRemaining: Math.max(0, daysRemaining),
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      canceledAt: sub.canceledAt,
      trialEndsAt: sub.trialEndsAt,
      isTrialActive: sub.isTrialActive,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    };
  }),

  /**
   * Obter histórico de pagamentos do usuário
   */
  getPaymentHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
        status: z.enum(["succeeded", "pending", "failed", "refunded"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const conditions = [eq(payments.userId, ctx.user.id)];
      if (input.status) {
        conditions.push(eq(payments.status, input.status));
      }

      const paymentsList = await db
        .select({
          id: payments.id,
          userId: payments.userId,
          mercadopagoPaymentId: payments.mercadopagoPaymentId,
          amount: payments.amount,
          currency: payments.currency,
          status: payments.status,
          description: payments.description,
          paidAt: payments.paidAt,
          createdAt: payments.createdAt,
          updatedAt: payments.updatedAt,
        })
        .from(payments)
        .where(and(...conditions))
        .orderBy(desc(payments.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const totalCount = await db
        .select({ count: payments.id })
        .from(payments)
        .where(and(...conditions));

      return {
        payments: paymentsList.map(p => ({
          ...p,
          amountFormatted: `R$ ${(p.amount / 100).toFixed(2)}`,
          statusLabel: {
            succeeded: "Pagamento Realizado",
            pending: "Pendente",
            failed: "Falha",
            refunded: "Reembolsado",
          }[p.status],
        })),
        total: totalCount[0]?.count || 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Obter resumo de pagamentos (últimos 12 meses)
   */
  getPaymentSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const paymentsList = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        status: payments.status,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .where(
        and(
          eq(payments.userId, ctx.user.id),
          eq(payments.status, "succeeded")
        )
      );

    const totalSpent = paymentsList.reduce((sum, p) => sum + p.amount, 0);
    const paymentCount = paymentsList.length;
    const averagePayment = paymentCount > 0 ? totalSpent / paymentCount : 0;

    // Agrupar por mês
    const byMonth: Record<string, number> = {};
    paymentsList.forEach(p => {
      const date = new Date(p.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      byMonth[monthKey] = (byMonth[monthKey] || 0) + p.amount;
    });

    return {
      totalSpent: totalSpent / 100,
      totalSpentFormatted: `R$ ${(totalSpent / 100).toFixed(2)}`,
      paymentCount,
      averagePayment: averagePayment / 100,
      averagePaymentFormatted: `R$ ${(averagePayment / 100).toFixed(2)}`,
      byMonth: Object.entries(byMonth)
        .sort()
        .map(([month, amount]) => ({
          month,
          amount: amount / 100,
          amountFormatted: `R$ ${(amount / 100).toFixed(2)}`,
        })),
    };
  }),

  /**
   * Cancelar assinatura
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.user.id))
      .limit(1);

    if (subscription.length === 0) {
      throw new Error("Nenhuma assinatura ativa encontrada");
    }

    const now = new Date();
    await db
      .update(subscriptions)
      .set({
        status: "canceled",
        canceledAt: now,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, subscription[0].id));

    return {
      success: true,
      message: "Assinatura cancelada com sucesso",
    };
  }),

  /**
   * Obter planos disponíveis
   */
  getPlans: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const plans = await db
      .select({
        id: subscriptionPlans.id,
        name: subscriptionPlans.name,
        priceMonthly: subscriptionPlans.priceMonthly,
        priceYearly: subscriptionPlans.priceYearly,
        description: subscriptionPlans.description,
        features: subscriptionPlans.features,
        maxPosts: subscriptionPlans.maxPosts,
        maxPlatforms: subscriptionPlans.maxPlatforms,
        maxUsers: subscriptionPlans.maxUsers,
        hasAnalytics: subscriptionPlans.hasAnalytics,
        hasCompetitorAnalysis: subscriptionPlans.hasCompetitorAnalysis,
        hasWhiteLabel: subscriptionPlans.hasWhiteLabel,
        hasAPI: subscriptionPlans.hasAPI,
        supportLevel: subscriptionPlans.supportLevel,
      })
      .from(subscriptionPlans)
      .orderBy(subscriptionPlans.id);

    return plans.map(p => ({
      ...p,
      priceMonthlyFormatted: `R$ ${(p.priceMonthly / 100).toFixed(2)}`,
      priceYearlyFormatted: p.priceYearly ? `R$ ${(p.priceYearly / 100).toFixed(2)}` : null,
    }));
  }),
});
