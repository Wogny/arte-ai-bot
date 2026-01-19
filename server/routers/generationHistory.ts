import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

export const generationHistoryRouter = router({
  // Listar histórico de gerações do usuário
  list: protectedProcedure
    .input(z.object({
      type: z.enum(["image", "caption", "all"]).default("all"),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const params = input || { type: "all", limit: 50, offset: 0 };
      return await db.getGenerationHistory(ctx.user.id, params);
    }),

  // Obter detalhes de uma geração
  getById: protectedProcedure
    .input(z.object({
      historyId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const history = await db.getGenerationHistoryById(input.historyId, ctx.user.id);
      if (!history) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Histórico não encontrado",
        });
      }
      return history;
    }),

  // Salvar no histórico (chamado automaticamente após geração)
  save: protectedProcedure
    .input(z.object({
      type: z.enum(["image", "caption"]),
      prompt: z.string(),
      result: z.string().optional(), // URL da imagem ou texto da legenda
      metadata: z.record(z.string(), z.any()).optional(), // Dados extras (estilo, plataforma, etc)
    }))
    .mutation(async ({ ctx, input }) => {
      return await db.saveGenerationHistory({
        userId: ctx.user.id,
        type: input.type,
        prompt: input.prompt,
        result: input.result,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      });
    }),

  // Favoritar/desfavoritar uma geração
  toggleFavorite: protectedProcedure
    .input(z.object({
      historyId: z.number(),
      isFavorite: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.toggleGenerationFavorite(ctx.user.id, input.historyId, input.isFavorite);
      return { success: true };
    }),

  // Listar favoritos
  favorites: protectedProcedure
    .input(z.object({
      type: z.enum(["image", "caption", "all"]).default("all"),
    }).optional())
    .query(async ({ ctx, input }) => {
      return await db.getFavoriteGenerations(ctx.user.id, input?.type || "all");
    }),

  // Deletar do histórico
  delete: protectedProcedure
    .input(z.object({
      historyId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteGenerationHistory(input.historyId, ctx.user.id);
      return { success: true };
    }),

  // Reutilizar um prompt (retorna os dados para preencher o formulário)
  reuse: protectedProcedure
    .input(z.object({
      historyId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const history = await db.getGenerationHistoryById(input.historyId, ctx.user.id);
      if (!history) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Histórico não encontrado",
        });
      }
      
      return {
        type: history.type,
        prompt: history.prompt,
        metadata: history.metadata ? JSON.parse(history.metadata) : null,
      };
    }),

  // Buscar no histórico
  search: protectedProcedure
    .input(z.object({
      query: z.string().min(1),
      type: z.enum(["image", "caption", "all"]).default("all"),
    }))
    .query(async ({ ctx, input }) => {
      return await db.searchGenerationHistory(ctx.user.id, input.query, input.type);
    }),

  // Obter estatísticas do histórico
  stats: protectedProcedure.query(async ({ ctx }) => {
    return await db.getGenerationStats(ctx.user.id);
  }),
});
