import { z } from "zod";
import { workspaceProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { outgoingWebhooks, workspaces } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

export const integrationsRouter = router({
  /**
   * Gera ou renova a API Key do workspace
   */
  generateApiKey: workspaceProcedure("admin")
    .input(z.object({ workspaceId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const apiKey = `ak_${nanoid(32)}`;
      await db.update(workspaces).set({ apiKey }).where(eq(workspaces.id, input.workspaceId));

      return { apiKey };
    }),

  /**
   * Adiciona um novo webhook de saída
   */
  addWebhook: workspaceProcedure("admin")
    .input(z.object({ 
      workspaceId: z.number(), 
      name: z.string().min(1),
      url: z.string().url(),
      events: z.array(z.string())
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const secret = `whsec_${nanoid(24)}`;
      await db.insert(outgoingWebhooks).values({
        workspaceId: input.workspaceId,
        name: input.name,
        url: input.url,
        events: input.events,
        secret,
      });

      return { secret };
    }),

  /**
   * Lista webhooks do workspace
   */
  listWebhooks: workspaceProcedure("viewer")
    .input(z.object({ workspaceId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return await db.select().from(outgoingWebhooks).where(eq(outgoingWebhooks.workspaceId, input.workspaceId));
    }),
});
