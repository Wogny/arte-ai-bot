import { TRPCError } from "@trpc/server";
import * as db from "../db";

// Limites por plano
export const PLAN_LIMITS = {
  free: {
    imagesPerMonth: 5,
    captionsPerMonth: 10,
    scheduledPosts: 5,
    platforms: 1,
    templates: false,
    analytics: false,
    support: "community",
    teamMembers: 1,
  },
  starter: {
    imagesPerMonth: 50,
    captionsPerMonth: 100,
    scheduledPosts: 30,
    platforms: 2,
    templates: true,
    analytics: "basic",
    support: "email",
    teamMembers: 1,
  },
  professional: {
    imagesPerMonth: 200,
    captionsPerMonth: 500,
    scheduledPosts: 100,
    platforms: 5,
    templates: true,
    analytics: "advanced",
    support: "priority",
    teamMembers: 5,
  },
  enterprise: {
    imagesPerMonth: -1, // ilimitado
    captionsPerMonth: -1,
    scheduledPosts: -1,
    platforms: -1,
    templates: true,
    analytics: "advanced",
    support: "dedicated",
    teamMembers: -1,
  },
};

export type PlanType = keyof typeof PLAN_LIMITS;

// Obter plano atual do usuário
export async function getUserPlan(userId: number): Promise<PlanType> {
  const subscription = await db.getActiveSubscription(userId);
  
  if (!subscription) {
    return "free";
  }
  
  // Mapear planId para tipo de plano
  const planMapping: Record<number, PlanType> = {
    1: "starter",
    2: "professional",
    3: "enterprise",
  };
  
  return planMapping[subscription.planId] || "free";
}

// Obter limites do plano do usuário
export async function getUserLimits(userId: number) {
  const plan = await getUserPlan(userId);
  return {
    plan,
    limits: PLAN_LIMITS[plan],
  };
}

// Verificar se usuário pode realizar ação
export async function checkUsageLimit(
  userId: number,
  action: "image" | "caption" | "schedule" | "platform"
): Promise<{ allowed: boolean; current: number; limit: number; plan: PlanType }> {
  const { plan, limits } = await getUserLimits(userId);
  
  // Obter uso atual do mês
  const usage = await db.getMonthlyUsage(userId);
  
  let current = 0;
  let limit = 0;
  
  switch (action) {
    case "image":
      current = usage.images;
      limit = limits.imagesPerMonth;
      break;
    case "caption":
      current = usage.captions;
      limit = limits.captionsPerMonth;
      break;
    case "schedule":
      current = usage.scheduledPosts;
      limit = limits.scheduledPosts;
      break;
    case "platform":
      current = usage.platforms;
      limit = limits.platforms;
      break;
  }
  
  // -1 significa ilimitado
  const allowed = limit === -1 || current < limit;
  
  return { allowed, current, limit, plan };
}

// Middleware para verificar limite antes de ação
export async function requireUsageLimit(
  userId: number,
  action: "image" | "caption" | "schedule" | "platform"
): Promise<void> {
  const { allowed, current, limit, plan } = await checkUsageLimit(userId, action);
  
  if (!allowed) {
    const actionNames = {
      image: "gerações de imagem",
      caption: "gerações de legenda",
      schedule: "posts agendados",
      platform: "plataformas conectadas",
    };
    
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Você atingiu o limite de ${actionNames[action]} do seu plano (${current}/${limit}). Faça upgrade para continuar.`,
    });
  }
}

// Verificar se feature está disponível no plano
export async function requireFeature(
  userId: number,
  feature: "templates" | "analytics" | "teamMembers"
): Promise<void> {
  const { plan, limits } = await getUserLimits(userId);
  
  if (feature === "templates" && !limits.templates) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Templates não estão disponíveis no plano gratuito. Faça upgrade para acessar.",
    });
  }
  
  if (feature === "analytics" && !limits.analytics) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Analytics não está disponível no plano gratuito. Faça upgrade para acessar.",
    });
  }
}

// Verificar se usuário tem plano ativo (não gratuito)
export async function requirePaidPlan(userId: number): Promise<void> {
  const plan = await getUserPlan(userId);
  
  if (plan === "free") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Esta funcionalidade requer um plano pago. Faça upgrade para continuar.",
    });
  }
}

// Incrementar uso
export async function incrementUsage(
  userId: number,
  action: "image" | "caption" | "schedule"
): Promise<void> {
  await db.incrementMonthlyUsage(userId, action);
}
