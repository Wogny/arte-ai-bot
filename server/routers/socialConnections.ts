import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc.js";
import * as db from "../_core/db.js";
import { TRPCError } from "@trpc/server";

// Plataformas suportadas
const platformOptions = ["instagram", "tiktok", "facebook", "twitter", "linkedin", "youtube"] as const;

// URLs de OAuth para cada plataforma
const OAUTH_URLS = {
  instagram: {
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth", // Instagram Business usa OAuth do Facebook
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    scopes: ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "instagram_basic", "instagram_content_publish", "business_management"],
  },
  facebook: {
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    scopes: ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "instagram_basic", "instagram_content_publish", "business_management"],
  },
  tiktok: {
    authUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    scopes: ["user.info.basic", "video.publish", "video.upload"],
  },
  twitter: {
    authUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    scopes: ["tweet.read", "tweet.write", "users.read"],
  },
  linkedin: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: ["r_liteprofile", "w_member_social"],
  },
  youtube: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["https://www.googleapis.com/auth/youtube.upload"],
  },
};

// Função auxiliar para pegar as chaves de API corretas
function getPlatformCredentials(platform: string) {
  if (platform === "facebook" || platform === "instagram") {
    return {
      clientId: process.env.FACEBOOK_APP_ID || "",
      clientSecret: process.env.FACEBOOK_APP_SECRET || "",
    };
  }
  
  return {
    clientId: process.env[`${platform.toUpperCase()}_CLIENT_ID`] || "",
    clientSecret: process.env[`${platform.toUpperCase()}_CLIENT_SECRET`] || "",
  };
}

export const socialConnectionsRouter = router({
  // Listar conexões do usuário
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.getUserSocialConnections(ctx.user.id);
  }),

  // Obter URL de autorização OAuth
  getAuthUrl: protectedProcedure
    .input(z.object({
      platform: z.enum(platformOptions),
      redirectUri: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = OAUTH_URLS[input.platform];
      if (!config) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Plataforma não suportada",
        });
      }

      const { clientId } = getPlatformCredentials(input.platform);

      // Gerar state para segurança
      const state = Buffer.from(JSON.stringify({
        userId: ctx.user.id,
        platform: input.platform,
        timestamp: Date.now(),
      })).toString("base64");

      // Construir URL de autorização
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: input.redirectUri,
        scope: config.scopes.join(","),
        response_type: "code",
        state,
      });

      return {
        authUrl: `${config.authUrl}?${params.toString()}`,
        state,
      };
    }),

  // Processar callback OAuth
  handleCallback: protectedProcedure
    .input(z.object({
      platform: z.enum(platformOptions),
      code: z.string(),
      redirectUri: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = OAUTH_URLS[input.platform];
      if (!config) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Plataforma não suportada",
        });
      }

      const { clientId, clientSecret } = getPlatformCredentials(input.platform);

      try {
        // Trocar código por token
        const tokenResponse = await fetch(config.tokenUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code: input.code,
            grant_type: "authorization_code",
            redirect_uri: input.redirectUri,
          }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: tokenData.error_description || tokenData.error?.message || "Erro ao obter token",
          });
        }

        // Obter informações da conta
        let accountInfo: {
          id: string;
          name?: string;
          username?: string;
          avatar?: string;
        } = { id: "" };

        if (input.platform === "instagram" || input.platform === "facebook") {
          // Facebook/Instagram Graph API
          const meResponse = await fetch(
            `https://graph.facebook.com/v18.0/me?fields=id,name,picture&access_token=${tokenData.access_token}`
          );
          const meData = await meResponse.json();
          accountInfo = {
            id: meData.id,
            name: meData.name,
            avatar: meData.picture?.data?.url,
          };

          // Para Instagram, buscar conta de negócios
          if (input.platform === "instagram") {
            const pagesResponse = await fetch(
              `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`
            );
            const pagesData = await pagesResponse.json();
            
            if (pagesData.data?.[0]) {
              const pageId = pagesData.data[0].id;
              const igResponse = await fetch(
                `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${tokenData.access_token}`
              );
              const igData = await igResponse.json();
              
              if (igData.instagram_business_account) {
                const igAccountResponse = await fetch(
                  `https://graph.facebook.com/v18.0/${igData.instagram_business_account.id}?fields=id,username,profile_picture_url&access_token=${tokenData.access_token}`
                );
                const igAccountData = await igAccountResponse.json();
                accountInfo = {
                  id: igAccountData.id,
                  username: igAccountData.username,
                  avatar: igAccountData.profile_picture_url,
                };
              }
            }
          }
        } else if (input.platform === "tiktok") {
          const userResponse = await fetch(
            "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
            {
              headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
              },
            }
          );
          const userData = await userResponse.json();
          accountInfo = {
            id: userData.data?.user?.open_id || tokenData.open_id,
            name: userData.data?.user?.display_name,
            avatar: userData.data?.user?.avatar_url,
          };
        }

        // Salvar conexão
        const connection = await db.saveSocialConnection({
          userId: ctx.user.id,
          platform: input.platform,
          accountId: accountInfo.id,
          accountName: accountInfo.name || null,
          accountUsername: accountInfo.username || null,
          accountAvatar: accountInfo.avatar || null,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || null,
          tokenExpiresAt: tokenData.expires_in 
            ? new Date(Date.now() + tokenData.expires_in * 1000) 
            : null,
          scopes: config.scopes.join(","),
        });

        return {
          success: true,
          connection,
        };
      } catch (error) {
        console.error("OAuth callback error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao conectar conta",
        });
      }
    }),

  // Desconectar plataforma
  disconnect: protectedProcedure
    .input(z.object({
      connectionId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.disconnectSocialPlatform(ctx.user.id, input.connectionId);
      return { success: true };
    }),

  // Verificar status da conexão
  checkStatus: protectedProcedure
    .input(z.object({
      platform: z.enum(platformOptions),
    }))
    .query(async ({ ctx, input }) => {
      const connection = await db.getSocialConnectionByPlatform(ctx.user.id, input.platform);
      
      if (!connection) {
        return { connected: false };
      }

      // Verificar se o token expirou
      const isExpired = connection.tokenExpiresAt 
        ? new Date(connection.tokenExpiresAt) < new Date() 
        : false;

      return {
        connected: true,
        isExpired,
        accountName: connection.accountName,
        accountUsername: connection.accountUsername,
        accountAvatar: connection.accountAvatar,
        lastSyncAt: connection.lastSyncAt,
      };
    }),

  // Renovar token (refresh)
  refreshToken: protectedProcedure
    .input(z.object({
      connectionId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const connections = await db.getUserSocialConnections(ctx.user.id);
      const connection = connections.find(c => c.id === input.connectionId);

      if (!connection || !connection.refreshToken) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Conexão não encontrada ou sem refresh token",
        });
      }

      const config = OAUTH_URLS[connection.platform as keyof typeof OAUTH_URLS];
      if (!config) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Plataforma não suportada",
        });
      }

      const { clientId, clientSecret } = getPlatformCredentials(connection.platform);

      try {
        const tokenResponse = await fetch(config.tokenUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: connection.refreshToken,
            grant_type: "refresh_token",
          }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: tokenData.error_description || "Erro ao renovar token",
          });
        }

        await db.updateSocialConnectionTokens(connection.id, {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiresAt: tokenData.expires_in 
            ? new Date(Date.now() + tokenData.expires_in * 1000) 
            : undefined,
        });

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao renovar token",
        });
      }
    }),

  // Obter informações das plataformas disponíveis
  getAvailablePlatforms: protectedProcedure.query(() => {
    return [
      {
        id: "instagram",
        name: "Instagram",
        icon: "instagram",
        description: "Publique fotos e stories automaticamente",
        features: ["Posts", "Stories", "Reels"],
        requiresBusinessAccount: true,
      },
      {
        id: "facebook",
        name: "Facebook",
        icon: "facebook",
        description: "Gerencie suas páginas e publicações",
        features: ["Posts", "Stories", "Vídeos"],
        requiresBusinessAccount: true,
      },
      {
        id: "tiktok",
        name: "TikTok",
        icon: "tiktok",
        description: "Publique vídeos diretamente no TikTok",
        features: ["Vídeos"],
        requiresBusinessAccount: false,
      },
      {
        id: "linkedin",
        name: "LinkedIn",
        icon: "linkedin",
        description: "Compartilhe conteúdo profissional",
        features: ["Posts", "Artigos"],
        requiresBusinessAccount: false,
      },
      {
        id: "twitter",
        name: "Twitter/X",
        icon: "twitter",
        description: "Publique tweets e threads",
        features: ["Tweets", "Threads"],
        requiresBusinessAccount: false,
      },
    ];
  }),
});
