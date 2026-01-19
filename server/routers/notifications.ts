import { router, protectedProcedure } from "../_core/trpc.js";
import { z } from "zod";
import { getDb } from "../db.js";
import { notifications } from '../../drizzle/schema.js';
import { desc, eq, and } from "drizzle-orm";

export const notificationsRouter = router({
  // Listar notificações do usuário
  list: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
      unreadOnly: z.boolean().default(false),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;
      const unreadOnly = input?.unreadOnly ?? false;

      const whereCondition = unreadOnly
        ? and(
            eq(notifications.userId, ctx.user.id),
            eq(notifications.read, false)
          )
        : eq(notifications.userId, ctx.user.id);

      const items = await db.select().from(notifications).where(whereCondition)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

      return items;
    }),

  // Contar notificações não lidas
  unreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.select().from(notifications).where(
        and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.read, false)
        )
      );

      return result.length;
    }),

  // Marcar como lida
  markAsRead: protectedProcedure
    .input(z.object({
      notificationId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const notification = await db.select().from(notifications).where(
        and(
          eq(notifications.id, input.notificationId),
          eq(notifications.userId, ctx.user.id)
        )
      );

      if (!notification.length) {
        throw new Error("Notificação não encontrada");
      }

      await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, input.notificationId));

      return { success: true };
    }),

  // Marcar todas como lidas
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.userId, ctx.user.id),
            eq(notifications.read, false)
          )
        );

      return { success: true };
    }),

  // Deletar notificação
  delete: protectedProcedure
    .input(z.object({
      notificationId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const notification = await db.select().from(notifications).where(
        and(
          eq(notifications.id, input.notificationId),
          eq(notifications.userId, ctx.user.id)
        )
      );

      if (!notification.length) {
        throw new Error("Notificação não encontrada");
      }

      await db.delete(notifications).where(
        eq(notifications.id, input.notificationId)
      );

      return { success: true };
    }),

  // Deletar todas as notificações
  deleteAll: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(notifications).where(
        eq(notifications.userId, ctx.user.id)
      );

      return { success: true };
    }),

  // Enviar notificação (para uso interno)
  send: protectedProcedure
    .input(z.object({
      type: z.enum(['success', 'error', 'info', 'warning']),
      title: z.string(),
      message: z.string(),
      actionUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await db.insert(notifications).values({
        id,
        userId: ctx.user.id,
        type: input.type,
        title: input.title,
        message: input.message,
        actionUrl: input.actionUrl || null,
        read: false,
        createdAt: new Date(),
      });

      return { id, success: true };
    }),
});
