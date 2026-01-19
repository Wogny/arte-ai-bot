import { z } from "zod";
import { encrypt, decrypt } from "../_core/security";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { platformCredentials } from '../../drizzle/schema.js';
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { QuotaManager } from "../_core/quotaManager";

export const platformsRouter = router({
  addCredentials: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["facebook", "instagram", "tiktok", "whatsapp"]),
        accountName: z.string().min(1).max(255),
        accessToken: z.string().min(1),
        refreshToken: z.string().optional(),
        accountId: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB indisponível");

      // Verificar quota de plataformas
      const quota = await QuotaManager.canConnectPlatform(ctx.user.id);
      if (!quota.allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: quota.message,
        });
      }

      await db.insert(platformCredentials).values({
        userId: ctx.user.id,
        platform: input.platform,
        accountName: input.accountName,
        accessToken: encrypt(input.accessToken), // Criptografar
        refreshToken: input.refreshToken ? encrypt(input.refreshToken) : undefined, // Criptografar
        accountId: input.accountId,
        isActive: true,
      });

      return {
        success: true,
        platform: input.platform,
        accountName: input.accountName,
      };
    }),

  listCredentials: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const credentials = await db
      .select()
      .from(platformCredentials)
      .where(eq(platformCredentials.userId, ctx.user.id));

    return credentials.map(c => ({
      id: c.id,
      platform: c.platform,
      accountName: c.accountName,
      accountId: c.accountId,
      isActive: c.isActive,
      connectedAt: c.createdAt,
    }));
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const credentials = await db
      .select()
      .from(platformCredentials)
      .where(eq(platformCredentials.userId, ctx.user.id));

    return credentials.map(c => ({
      id: c.id,
      platform: c.platform,
      accountName: c.accountName,
      accountId: c.accountId,
      isActive: c.isActive,
      createdAt: c.createdAt,
    }));
  }),

  listByPlatform: protectedProcedure
    .input(z.object({ platform: z.enum(["facebook", "instagram", "tiktok", "whatsapp"]) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const credentials = await db
        .select()
        .from(platformCredentials)
        .where(
          and(
            eq(platformCredentials.userId, ctx.user.id),
            eq(platformCredentials.platform, input.platform)
          )
        );

      return credentials;
    }),

  toggleActive: protectedProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(platformCredentials)
        .set({ isActive: input.isActive })
        .where(
          and(
            eq(platformCredentials.id, input.id),
            eq(platformCredentials.userId, ctx.user.id)
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
        .delete(platformCredentials)
        .where(
          and(
            eq(platformCredentials.id, input.id),
            eq(platformCredentials.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  testConnection: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const cred = await db
        .select()
        .from(platformCredentials)
        .where(
          and(
            eq(platformCredentials.id, input.id),
            eq(platformCredentials.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!cred.length) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Credencial não encontrada ou acesso negado" });
      }

      try {
        let response;

        const decryptedAccessToken = decrypt(cred[0].accessToken); // Descriptografar
        
        if (cred[0].platform === "facebook" || cred[0].platform === "instagram") {
          response = await fetch(
            `https://graph.instagram.com/me?fields=id,username&access_token=${decryptedAccessToken}`
          );
        } else if (cred[0].platform === "tiktok") {
          response = await fetch("https://open.tiktokapis.com/v1/user/info/", {
            headers: {
              Authorization: `Bearer ${decryptedAccessToken}`,
            },
          });
        } else if (cred[0].platform === "whatsapp") {
          response = await fetch(
            `https://graph.whatsapp.com/v18.0/${cred[0].accountId}?access_token=${decryptedAccessToken}`
          );
        }

        return {
          success: response?.ok || false,
          status: response?.status,
          message: response?.ok ? "Conexão bem-sucedida" : "Falha na conexão",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        };
      }
    }),
});
