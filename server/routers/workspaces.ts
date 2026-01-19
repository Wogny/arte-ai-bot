import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import { getDb } from "../db.js";
import { workspaces, workspaceMembers, workspaceInvites, users } from '../../drizzle/schema.js';
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { logActivity } from "../_core/audit.js";

export const workspacesRouter = router({
  /**
   * Cria um novo workspace
   */
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [newWorkspace] = await db.insert(workspaces).values({
        name: input.name,
        ownerId: ctx.user.id,
      });

      // Adiciona o criador como admin
      await db.insert(workspaceMembers).values({
        workspaceId: newWorkspace.insertId,
        userId: ctx.user.id,
        role: "admin",
      });

      await logActivity({
        workspaceId: newWorkspace.insertId,
        userId: ctx.user.id,
        action: "workspace.created",
        entityType: "workspace",
        entityId: newWorkspace.insertId,
        details: { name: input.name },
      });

      return { id: newWorkspace.insertId };
    }),

  /**
   * Convida um usuário para o workspace
   */
  invite: protectedProcedure
    .input(z.object({ 
      workspaceId: z.number(), 
      email: z.string().email(),
      role: z.enum(["admin", "editor", "viewer"])
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verifica se o usuário atual é admin do workspace
      const member = await db.select().from(workspaceMembers).where(
        and(
          eq(workspaceMembers.workspaceId, input.workspaceId),
          eq(workspaceMembers.userId, ctx.user.id),
          eq(workspaceMembers.role, "admin")
        )
      ).limit(1);

      if (!member.length) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem convidar membros." });
      }

      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

      await db.insert(workspaceInvites).values({
        workspaceId: input.workspaceId,
        email: input.email,
        role: input.role,
        token,
        expiresAt,
      });

      await logActivity({
        workspaceId: input.workspaceId,
        userId: ctx.user.id,
        action: "user.invited",
        entityType: "user",
        details: { email: input.email, role: input.role },
      });

      // Em produção, aqui enviaria um email com o link de convite
      console.log(`[INVITE] Convite enviado para ${input.email} com token ${token}`);

      return { success: true };
    }),

  /**
   * Lista membros do workspace
   */
  listMembers: protectedProcedure
    .input(z.object({ workspaceId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const members = await db
        .select({
          id: workspaceMembers.id,
          role: workspaceMembers.role,
          userName: users.name,
          userEmail: users.email,
        })
        .from(workspaceMembers)
        .innerJoin(users, eq(workspaceMembers.userId, users.id))
        .where(eq(workspaceMembers.workspaceId, input.workspaceId));

      return members;
    }),
});
