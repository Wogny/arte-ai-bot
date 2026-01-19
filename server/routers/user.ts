import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users } from '../../drizzle/schema.js';
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const userRouter = router({
  /**
   * Obter estatísticas do usuário
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // TODO: Implementar queries reais de estatísticas
    return {
      totalArts: 1,
      scheduledPosts: 0,
      activeCampaigns: 0,
      totalEngagement: 0,
    };
  }),

  /**
   * Obter configurações do usuário
   */
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    // TODO: Implementar busca de settings do banco
    return {
      apiKey: ctx.user?.id ? `sk_${nanoid(32)}` : null,
      emailNotifications: true,
      darkTheme: false,
      performanceAlerts: true,
    };
  }),

  /**
   * Atualizar nome do usuário
   */
  updateName: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        await db
          .update(users)
          .set({ name: input.name, updatedAt: new Date() })
          .where(eq(users.id, ctx.user!.id));

        return { success: true };
      } catch (error) {
        console.error("Erro ao atualizar nome:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar nome",
        });
      }
    }),

  /**
   * Atualizar configurações do usuário
   */
  updateSettings: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.boolean().optional(),
        darkTheme: z.boolean().optional(),
        performanceAlerts: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Implementar atualização de settings no banco
      return { success: true };
    }),

  /**
   * Gerar chave de API
   */
  generateApiKey: protectedProcedure.mutation(async ({ ctx }) => {
    const apiKey = `sk_${nanoid(32)}`;
    // TODO: Salvar apiKey no banco associado ao usuário
    return { apiKey };
  }),

  /**
   * Revogar chave de API
   */
  revokeApiKey: protectedProcedure.mutation(async ({ ctx }) => {
    // TODO: Remover apiKey do banco
    return { success: true };
  }),

  /**
   * Obter histórico de atividades
   */
  getActivityLog: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      // TODO: Implementar busca de activity log do banco
      return [
        {
          id: "1",
          action: "Login realizado",
          description: "Acesso à plataforma",
          createdAt: new Date(),
        },
      ];
    }),

  /**
   * Obter informações do usuário
   */
  getInfo: protectedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.user?.id,
      name: ctx.user?.name,
      email: ctx.user?.email,
      role: ctx.user?.role,
      createdAt: ctx.user?.createdAt,
      lastSignedIn: ctx.user?.lastSignedIn,
    };
  }),
});
