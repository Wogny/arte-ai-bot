import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { multiPlatformPosts } from '../../drizzle/schema.js';
import { eq, and, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { QuotaManager } from "../_core/quotaManager";
import { whatsappService } from "../whatsapp/service";
import * as whatsappDb from "../whatsapp/db";

export const multiplatformRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        content: z.string().min(1),
        imageUrl: z.string().optional(),
        platforms: z.array(z.enum(["facebook", "instagram", "tiktok", "whatsapp"])).min(1),
        scheduledAt: z.date(),
        projectId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verificar quota antes de criar
      const quota = await QuotaManager.canSchedulePost(ctx.user.id);
      if (!quota.allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: quota.message,
        });
      }

      await db.insert(multiPlatformPosts).values({
        userId: ctx.user.id,
        projectId: input.projectId,
        title: input.title,
        content: input.content,
        imageUrl: input.imageUrl,
        platforms: input.platforms,
        scheduledAt: input.scheduledAt,
        status: "scheduled",
      });

      return {
        success: true,
        title: input.title,
        platforms: input.platforms,
        scheduledAt: input.scheduledAt,
      };
    }),

  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["draft", "scheduled", "published", "failed"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const posts = await db
        .select()
        .from(multiPlatformPosts)
        .where(eq(multiPlatformPosts.userId, ctx.user.id))
        .limit(input.limit)
        .offset(input.offset);

      return posts;
    }),

  getScheduled: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const now = new Date();
    const posts = await db
      .select()
      .from(multiPlatformPosts)
      .where(
        and(
          eq(multiPlatformPosts.userId, ctx.user.id),
          eq(multiPlatformPosts.status, "scheduled"),
          lte(multiPlatformPosts.scheduledAt, now)
        )
      );

    return posts;
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        platforms: z.array(z.enum(["facebook", "instagram", "tiktok", "whatsapp"])).optional(),
        scheduledAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const updateData: Record<string, unknown> = {};

      if (input.title) updateData.title = input.title;
      if (input.content) updateData.content = input.content;
      if (input.platforms) updateData.platforms = input.platforms;
      if (input.scheduledAt) updateData.scheduledAt = input.scheduledAt;

      await db
        .update(multiPlatformPosts)
        .set(updateData)
        .where(
          and(
            eq(multiPlatformPosts.id, input.id),
            eq(multiPlatformPosts.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  publish: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const post = await db
        .select()
        .from(multiPlatformPosts)
        .where(
          and(
            eq(multiPlatformPosts.id, input.id),
            eq(multiPlatformPosts.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!post.length) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db
        .update(multiPlatformPosts)
        .set({
          status: "published",
          publishedAt: new Date(),
        })
        .where(
          and(
            eq(multiPlatformPosts.id, input.id),
            eq(multiPlatformPosts.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .delete(multiPlatformPosts)
        .where(
          and(
            eq(multiPlatformPosts.id, input.id),
            eq(multiPlatformPosts.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  reschedule: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        newDate: z.string(), // ISO string
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const newScheduledAt = new Date(input.newDate);

      // Verificar se o post pertence ao usuário
      const post = await db
        .select()
        .from(multiPlatformPosts)
        .where(
          and(
            eq(multiPlatformPosts.id, input.postId),
            eq(multiPlatformPosts.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!post.length) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Post não encontrado" });
      }

      // Atualizar a data de agendamento
      await db
        .update(multiPlatformPosts)
        .set({ scheduledAt: newScheduledAt })
        .where(eq(multiPlatformPosts.id, input.postId));

      return { success: true, newDate: newScheduledAt };
    }),

  getStatistics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const posts = await db
      .select()
      .from(multiPlatformPosts)
      .where(eq(multiPlatformPosts.userId, ctx.user.id));

    const stats = {
      total: posts.length,
      published: posts.filter(p => p.status === "published").length,
      scheduled: posts.filter(p => p.status === "scheduled").length,
      draft: posts.filter(p => p.status === "draft").length,
      failed: posts.filter(p => p.status === "failed").length,
      platformBreakdown: {
        facebook: posts.filter(p => p.platforms.includes("facebook")).length,
        instagram: posts.filter(p => p.platforms.includes("instagram")).length,
        tiktok: posts.filter(p => p.platforms.includes("tiktok")).length,
        whatsapp: posts.filter(p => p.platforms.includes("whatsapp")).length,
      },
    };

    return stats;
  }),

  /**
   * Solicita aprovação de um post via WhatsApp
   */
  requestApproval: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        contactId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Buscar o post
      const posts = await db
        .select()
        .from(multiPlatformPosts)
        .where(
          and(
            eq(multiPlatformPosts.id, input.postId),
            eq(multiPlatformPosts.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!posts.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post não encontrado" });
      }

      const post = posts[0];

      // Verificar se o contato pertence ao usuário
      const contact = await whatsappDb.getWhatsAppContact(input.contactId, ctx.user.id);
      if (!contact) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contato não encontrado" });
      }

      // Enviar solicitação de aprovação
      const result = await whatsappService.sendApprovalRequest({
        workspaceId: ctx.user.id,
        postId: input.postId,
        contactId: input.contactId,
        postTitle: post.title,
        postCaption: post.content,
        postImageUrl: post.imageUrl || undefined,
        platforms: post.platforms as string[],
        scheduledFor: post.scheduledAt || undefined,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error || "Erro ao enviar solicitação de aprovação",
        });
      }

      // Atualizar status do post para "pending_approval"
      await db
        .update(multiPlatformPosts)
        .set({ status: "draft" }) // Manter como draft até ser aprovado
        .where(eq(multiPlatformPosts.id, input.postId));

      return {
        success: true,
        approvalRequestId: result.approvalRequestId,
        message: "Solicitação de aprovação enviada com sucesso",
      };
    }),

  /**
   * Lista posts pendentes de aprovação
   */
  getPendingApprovals: protectedProcedure.query(async ({ ctx }) => {
    const approvals = await whatsappDb.getWorkspaceApprovalRequests(ctx.user.id, "pending");
    return approvals;
  }),

  /**
   * Aprova ou rejeita um post manualmente
   */
  processApproval: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        approved: z.boolean(),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verificar se o post pertence ao usuário
      const posts = await db
        .select()
        .from(multiPlatformPosts)
        .where(
          and(
            eq(multiPlatformPosts.id, input.postId),
            eq(multiPlatformPosts.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!posts.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post não encontrado" });
      }

      // Atualizar status do post
      await db
        .update(multiPlatformPosts)
        .set({
          status: input.approved ? "scheduled" : "draft",
          approvedBy: input.approved ? ctx.user.id : null,
          approvedAt: input.approved ? new Date() : null,
        })
        .where(eq(multiPlatformPosts.id, input.postId));

      // Atualizar solicitação de aprovação pendente (se existir)
      const pendingApproval = await whatsappDb.getPendingApprovalByPost(input.postId);
      if (pendingApproval) {
        await whatsappDb.updateApprovalRequest(pendingApproval.id, ctx.user.id, {
          status: input.approved ? "approved" : "rejected",
          respondedAt: new Date(),
          responseMessage: input.feedback,
        });
      }

      return {
        success: true,
        status: input.approved ? "approved" : "rejected",
      };
    }),
});
