import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { postExecutor } from "../postExecutor";
import { z } from "zod";

export const executionRouter = router({
  /**
   * Obtém histórico de execuções
   */
  getHistory: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(() => {
      return postExecutor.getExecutionHistory(50);
    }),

  /**
   * Obtém estatísticas de execução
   */
  getStats: publicProcedure.query(() => {
    return postExecutor.getStats();
  }),

  /**
   * Retorna status do executor
   */
  getStatus: publicProcedure.query(() => {
    const stats = postExecutor.getStats();
    return {
      isRunning: true,
      stats,
      lastUpdate: new Date(),
    };
  }),
});
