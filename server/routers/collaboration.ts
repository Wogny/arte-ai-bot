import { z } from "zod";
import { workspaceProcedure } from "../_core/trpc.js";
import { router } from "../_core/trpc.js";
import { getDb } from "../db.js";
import { scheduledPosts, postComments, postVersions, users } from '../../drizzle/schema.js';
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { logActivity } from "../_core/audit.js";
import { notifyOwner } from "../_core/notification.js";

export const collaborationRouter = router({
  /**
   * Solicita aprovação para um post
   */
  requestApproval: workspaceProcedure("editor")
    .input(z.object({ workspaceId: z.number(), postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(scheduledPosts).set({
        status: "pending_approval",
        approvalStatus: "pending",
      }).where(and(eq(scheduledPosts.id, input.postId), eq(scheduledPosts.workspaceId, input.workspaceId)));

      await logActivity({
        workspaceId: input.workspaceId,
        userId: ctx.user.id,
        action: "post.approval_requested",
        entityType: "post",
        entityId: input.postId,
      });

      // Notifica administradores/revisores (simulado)
      await notifyOwner({
        title: "Aprovação Pendente",
        content: `Um novo post aguarda sua revisão no workspace.`,
      });

      return { success: true };
    }),

  /**
   * Aprova ou rejeita um post
   */
  approvePost: workspaceProcedure("admin")
    .input(z.object({ 
      workspaceId: z.number(), 
      postId: z.number(), 
      approved: z.boolean(),
      feedback: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const status = input.approved ? "approved" : "draft";
      const approvalStatus = input.approved ? "approved" : "rejected";

      await db.update(scheduledPosts).set({
        status,
        approvalStatus,
        approvedBy: ctx.user.id,
        approvedAt: new Date(),
      }).where(and(eq(scheduledPosts.id, input.postId), eq(scheduledPosts.workspaceId, input.workspaceId)));

      if (input.feedback) {
        await db.insert(postComments).values({
          postId: input.postId,
          userId: ctx.user.id,
          content: `[FEEDBACK DE APROVAÇÃO]: ${input.feedback}`,
        });
      }

      await logActivity({
        workspaceId: input.workspaceId,
        userId: ctx.user.id,
        action: input.approved ? "post.approved" : "post.rejected",
        entityType: "post",
        entityId: input.postId,
      });

      return { success: true };
    }),

  /**
   * Adiciona um comentário ao post
   */
  addComment: workspaceProcedure("viewer")
    .input(z.object({ 
      workspaceId: z.number(), 
      postId: z.number(), 
      content: z.string().min(1) 
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(postComments).values({
        postId: input.postId,
        userId: ctx.user.id,
        content: input.content,
      });

      return { success: true };
    }),

  /**
   * Lista comentários de um post
   */
  listComments: workspaceProcedure("viewer")
    .input(z.object({ workspaceId: z.number(), postId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const comments = await db
        .select({
          id: postComments.id,
          content: postComments.content,
          createdAt: postComments.createdAt,
          userName: users.name,
        })
        .from(postComments)
        .innerJoin(users, eq(postComments.userId, users.id))
        .where(eq(postComments.postId, input.postId))
        .orderBy(desc(postComments.createdAt));

      return comments;
    }),

  /**
   * Salva uma nova versão do post
   */
  saveVersion: workspaceProcedure("editor")
    .input(z.object({ 
      workspaceId: z.number(), 
      postId: z.number(), 
      caption: z.string(),
      imageId: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Obtém o número da última versão
      const lastVersion = await db
        .select({ version: postVersions.versionNumber })
        .from(postVersions)
        .where(eq(postVersions.postId, input.postId))
        .orderBy(desc(postVersions.versionNumber))
        .limit(1);

      const nextVersion = (lastVersion[0]?.version || 0) + 1;

      await db.insert(postVersions).values({
        postId: input.postId,
        userId: ctx.user.id,
        caption: input.caption,
        imageId: input.imageId,
        versionNumber: nextVersion,
      });

      return { version: nextVersion };
    }),

  /**
   * Lista versões de um post
   */
  listVersions: workspaceProcedure("viewer")
    .input(z.object({ workspaceId: z.number(), postId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const versions = await db
        .select({
          id: postVersions.id,
          versionNumber: postVersions.versionNumber,
          createdAt: postVersions.createdAt,
          userName: users.name,
        })
        .from(postVersions)
        .innerJoin(users, eq(postVersions.userId, users.id))
        .where(eq(postVersions.postId, input.postId))
        .orderBy(desc(postVersions.versionNumber));

      return versions;
    }),
});
