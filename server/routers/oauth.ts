import { protectedProcedure, router } from "../_core/trpc.js";
import { z } from "zod";
import {
  TikTokIntegration,
  FacebookInstagramIntegration,
  WhatsAppIntegration,
} from "../platformIntegrations.js";
import { getDb } from "../db.js";
import { platformCredentials } from '../../drizzle/schema.js';
import { eq, and } from "drizzle-orm";

export const oauthRouter = router({
  /**
   * Gera URL de autorização para TikTok
   */
  getTikTokAuthUrl: protectedProcedure.query(({ ctx }) => {
    const tiktok = new TikTokIntegration(
      process.env.TIKTOK_CLIENT_KEY || "",
      process.env.TIKTOK_CLIENT_SECRET || "",
      process.env.TIKTOK_REDIRECT_URI || ""
    );

    const state = `tiktok_${ctx.user.id}_${Date.now()}`;
    const authUrl = tiktok.getAuthorizationUrl(state);

    return {
      authUrl,
      state,
      platform: "tiktok",
    };
  }),

  /**
   * Gera URL de autorização para Facebook/Instagram
   */
  getFacebookAuthUrl: protectedProcedure.query(({ ctx }) => {
    const facebook = new FacebookInstagramIntegration(
      process.env.FACEBOOK_APP_ID || "",
      process.env.FACEBOOK_APP_SECRET || "",
      process.env.FACEBOOK_REDIRECT_URI || ""
    );

    const state = `facebook_${ctx.user.id}_${Date.now()}`;
    const authUrl = facebook.getAuthorizationUrl(state);

    return {
      authUrl,
      state,
      platform: "facebook",
    };
  }),

  /**
   * Processa callback do TikTok OAuth
   */
  handleTikTokCallback: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        state: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Banco de dados não disponível");

        const tiktok = new TikTokIntegration(
          process.env.TIKTOK_CLIENT_KEY || "",
          process.env.TIKTOK_CLIENT_SECRET || "",
          process.env.TIKTOK_REDIRECT_URI || ""
        );

        // Obtém access token
        const { accessToken, refreshToken, expiresIn } =
          await tiktok.getAccessToken(input.code);

        // Obtém informações do usuário
        const userInfo = await tiktok.getUserInfo(accessToken);

        // Salva credenciais no banco
        await db
          .insert(platformCredentials)
          .values({
            userId: ctx.user.id,
            platform: "tiktok",
            accountId: userInfo.userId,
            accountName: userInfo.username,
            accessToken,
            refreshToken,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            isActive: true,
          })
          .onDuplicateKeyUpdate({
            set: {
              accessToken,
              refreshToken,
              expiresAt: new Date(Date.now() + expiresIn * 1000),
              isActive: true,
            },
          });

        return {
          success: true,
          platform: "tiktok",
          username: userInfo.username,
          message: "TikTok conectado com sucesso!",
        };
      } catch (error) {
        throw new Error(
          `Erro ao conectar TikTok: ${error instanceof Error ? error.message : "Desconhecido"}`
        );
      }
    }),

  /**
   * Processa callback do Facebook/Instagram OAuth
   */
  handleFacebookCallback: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        state: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Banco de dados não disponível");

        const facebook = new FacebookInstagramIntegration(
          process.env.FACEBOOK_APP_ID || "",
          process.env.FACEBOOK_APP_SECRET || "",
          process.env.FACEBOOK_REDIRECT_URI || ""
        );

        // Obtém access token
        const { accessToken, userId } = await facebook.getAccessToken(
          input.code
        );

        // Obtém informações do usuário
        const userInfo = await facebook.getUserInfo(accessToken);

        // Salva credenciais para Instagram
        await db
          .insert(platformCredentials)
          .values({
            userId: ctx.user.id,
            platform: "instagram",
            accountId: userInfo.userId,
            accountName: userInfo.username,
            accessToken,
            isActive: true,
          })
          .onDuplicateKeyUpdate({
            set: {
              accessToken,
              isActive: true,
            },
          });

        // Salva credenciais para Facebook
        await db
          .insert(platformCredentials)
          .values({
            userId: ctx.user.id,
            platform: "facebook",
            accountId: userId,
            accountName: userInfo.username,
            accessToken,
            isActive: true,
          })
          .onDuplicateKeyUpdate({
            set: {
              accessToken,
              isActive: true,
            },
          });

        return {
          success: true,
          platforms: ["instagram", "facebook"],
          username: userInfo.username,
          message: "Facebook e Instagram conectados com sucesso!",
        };
      } catch (error) {
        throw new Error(
          `Erro ao conectar Facebook: ${error instanceof Error ? error.message : "Desconhecido"}`
        );
      }
    }),

  /**
   * Desconecta uma plataforma
   */
  disconnectPlatform: protectedProcedure
    .input(z.object({ platform: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Banco de dados não disponível");

        await db
          .update(platformCredentials)
          .set({ isActive: false })
          .where(
            and(
              eq(platformCredentials.userId, ctx.user.id),
              eq(platformCredentials.platform as any, input.platform)
            )
          );

        return {
          success: true,
          platform: input.platform,
          message: `${input.platform} desconectado com sucesso!`,
        };
      } catch (error) {
        throw new Error(
          `Erro ao desconectar plataforma: ${error instanceof Error ? error.message : "Desconhecido"}`
        );
      }
    }),

  /**
   * Obtém status de conexão de todas as plataformas
   */
  getPlatformStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Banco de dados não disponível");

      const credentials = await db
        .select()
        .from(platformCredentials)
        .where(eq(platformCredentials.userId as any, ctx.user.id));

      const platforms = {
        tiktok: false,
        facebook: false,
        instagram: false,
        whatsapp: false,
      };

      credentials.forEach((cred: any) => {
        if (cred.isActive) {
          platforms[cred.platform as keyof typeof platforms] = true;
        }
      });

      return platforms;
    } catch (error) {
      throw new Error(
        `Erro ao obter status das plataformas: ${error instanceof Error ? error.message : "Desconhecido"}`
      );
    }
  }),
});
