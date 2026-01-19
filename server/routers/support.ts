import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { supportTickets, faqEntries } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const supportRouter = router({
  /**
   * Cria um novo ticket de suporte
   */
  createTicket: protectedProcedure
    .input(z.object({ 
      subject: z.string().min(5), 
      description: z.string().min(10),
      priority: z.enum(["low", "medium", "high", "urgent"]).default("medium")
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(supportTickets).values({
        userId: ctx.user.id,
        subject: input.subject,
        description: input.description,
        priority: input.priority,
      });

      return { success: true };
    }),

  /**
   * Lista tickets do usuário
   */
  listMyTickets: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, ctx.user.id))
      .orderBy(desc(supportTickets.createdAt));
  }),

  /**
   * Lista entradas do FAQ
   */
  listFaq: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return await db
      .select()
      .from(faqEntries)
      .orderBy(faqEntries.category, faqEntries.order);
  }),
});
