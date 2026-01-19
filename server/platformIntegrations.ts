import axios from "axios";

/**
 * Integração com TikTok API
 */
export class TikTokIntegration {
  private clientKey: string;
  private clientSecret: string;
  private redirectUri: string;
  private baseUrl = "https://open.tiktokapis.com";

  constructor(clientKey: string, clientSecret: string, redirectUri: string) {
    this.clientKey = clientKey;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  /**
   * Gera URL de autorização OAuth
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_key: this.clientKey,
      response_type: "code",
      scope: "user.info.basic,video.upload,video.publish",
      redirect_uri: this.redirectUri,
      state,
    });

    return `${this.baseUrl}/platform/oauth/connect?${params.toString()}`;
  }

  /**
   * Troca código de autorização por access token
   */
  async getAccessToken(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/oauth/token/`,
        {
          client_key: this.clientKey,
          client_secret: this.clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: this.redirectUri,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return {
        accessToken: response.data.data.access_token,
        refreshToken: response.data.data.refresh_token,
        expiresIn: response.data.data.expires_in,
      };
    } catch (error) {
      throw new Error(
        `Erro ao obter access token do TikTok: ${error instanceof Error ? error.message : "Desconhecido"}`
      );
    }
  }

  /**
   * Publica vídeo no TikTok
   */
  async publishVideo(
    accessToken: string,
    videoUrl: string,
    caption: string
  ): Promise<{ videoId: string; status: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/video/publish/`,
        {
          video_url: videoUrl,
          text: caption,
          disable_comment: false,
          disable_duet: false,
          disable_stitch: false,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        videoId: response.data.data.video_id,
        status: "published",
      };
    } catch (error) {
      throw new Error(
        `Erro ao publicar vídeo no TikTok: ${error instanceof Error ? error.message : "Desconhecido"}`
      );
    }
  }

  /**
   * Obtém informações do usuário
   */
  async getUserInfo(accessToken: string): Promise<{
    userId: string;
    username: string;
    displayName: string;
    profileImage: string;
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/user/info/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const user = response.data.data.user;
      return {
        userId: user.open_id,
        username: user.username,
        displayName: user.display_name,
        profileImage: user.avatar_url,
      };
    } catch (error) {
      throw new Error(
        `Erro ao obter informações do usuário TikTok: ${error instanceof Error ? error.message : "Desconhecido"}`
      );
    }
  }
}

/**
 * Integração com Facebook/Instagram Graph API
 */
export class FacebookInstagramIntegration {
  private appId: string;
  private appSecret: string;
  private redirectUri: string;
  private baseUrl = "https://graph.instagram.com";
  private facebookBaseUrl = "https://graph.facebook.com";

  constructor(appId: string, appSecret: string, redirectUri: string) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.redirectUri = redirectUri;
  }

  /**
   * Gera URL de autorização OAuth
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: "instagram_basic,instagram_content_publish,pages_read_engagement,pages_manage_posts",
      response_type: "code",
      state,
    });

    return `${this.facebookBaseUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Troca código de autorização por access token
   */
  async getAccessToken(code: string): Promise<{
    accessToken: string;
    userId: string;
  }> {
    try {
      const response = await axios.post(
        `${this.facebookBaseUrl}/oauth/access_token`,
        {
          client_id: this.appId,
          client_secret: this.appSecret,
          redirect_uri: this.redirectUri,
          code,
        }
      );

      return {
        accessToken: response.data.access_token,
        userId: response.data.user_id,
      };
    } catch (error) {
      throw new Error(
        `Erro ao obter access token do Facebook: ${error instanceof Error ? error.message : "Desconhecido"}`
      );
    }
  }

  /**
   * Publica foto no Instagram
   */
  async publishPhoto(
    accessToken: string,
    imageUrl: string,
    caption: string,
    mediaType: "IMAGE" | "CAROUSEL" = "IMAGE"
  ): Promise<{ mediaId: string; status: string }> {
    try {
      // Primeiro cria o container
      const containerResponse = await axios.post(
        `${this.baseUrl}/v18.0/me/media`,
        {
          image_url: imageUrl,
          caption,
          media_type: mediaType,
          access_token: accessToken,
        }
      );

      const containerId = containerResponse.data.id;

      // Depois publica
      const publishResponse = await axios.post(
        `${this.baseUrl}/v18.0/me/media_publish`,
        {
          creation_id: containerId,
          access_token: accessToken,
        }
      );

      return {
        mediaId: publishResponse.data.id,
        status: "published",
      };
    } catch (error) {
      throw new Error(
        `Erro ao publicar foto no Instagram: ${error instanceof Error ? error.message : "Desconhecido"}`
      );
    }
  }

  /**
   * Publica no Facebook
   */
  async publishToFacebook(
    accessToken: string,
    pageId: string,
    message: string,
    imageUrl?: string
  ): Promise<{ postId: string; status: string }> {
    try {
      const data: any = {
        message,
        access_token: accessToken,
      };

      if (imageUrl) {
        data.picture = imageUrl;
      }

      const response = await axios.post(
        `${this.facebookBaseUrl}/v18.0/${pageId}/feed`,
        data
      );

      return {
        postId: response.data.id,
        status: "published",
      };
    } catch (error) {
      throw new Error(
        `Erro ao publicar no Facebook: ${error instanceof Error ? error.message : "Desconhecido"}`
      );
    }
  }

  /**
   * Obtém informações do usuário
   */
  async getUserInfo(accessToken: string): Promise<{
    userId: string;
    username: string;
    displayName: string;
    profileImage: string;
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v18.0/me`,
        {
          params: {
            fields: "id,username,name,profile_picture_url",
            access_token: accessToken,
          },
        }
      );

      return {
        userId: response.data.id,
        username: response.data.username || response.data.name,
        displayName: response.data.name,
        profileImage: response.data.profile_picture_url,
      };
    } catch (error) {
      throw new Error(
        `Erro ao obter informações do usuário Instagram: ${error instanceof Error ? error.message : "Desconhecido"}`
      );
    }
  }
}

/**
 * Integração com WhatsApp Business API
 */
export class WhatsAppIntegration {
  private phoneNumberId: string;
  private accessToken: string;
  private businessAccountId: string;
  private baseUrl = "https://graph.instagram.com";

  constructor(
    phoneNumberId: string,
    accessToken: string,
    businessAccountId: string
  ) {
    this.phoneNumberId = phoneNumberId;
    this.accessToken = accessToken;
    this.businessAccountId = businessAccountId;
  }

  /**
   * Envia mensagem de texto
   */
  async sendMessage(
    recipientPhoneNumber: string,
    message: string
  ): Promise<{ messageId: string; status: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v18.0/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipientPhoneNumber,
          type: "text",
          text: {
            preview_url: true,
            body: message,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        messageId: response.data.messages[0].id,
        status: "sent",
      };
    } catch (error) {
      throw new Error(
        `Erro ao enviar mensagem WhatsApp: ${error instanceof Error ? error.message : "Desconhecido"}`
      );
    }
  }

  /**
   * Envia imagem
   */
  async sendImage(
    recipientPhoneNumber: string,
    imageUrl: string,
    caption?: string
  ): Promise<{ messageId: string; status: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v18.0/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipientPhoneNumber,
          type: "image",
          image: {
            link: imageUrl,
          },
          ...(caption && { caption }),
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        messageId: response.data.messages[0].id,
        status: "sent",
      };
    } catch (error) {
      throw new Error(
        `Erro ao enviar imagem WhatsApp: ${error instanceof Error ? error.message : "Desconhecido"}`
      );
    }
  }

  /**
   * Envia template de mensagem
   */
  async sendTemplate(
    recipientPhoneNumber: string,
    templateName: string,
    parameters?: string[]
  ): Promise<{ messageId: string; status: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v18.0/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: recipientPhoneNumber,
          type: "template",
          template: {
            name: templateName,
            language: {
              code: "pt_BR",
            },
            ...(parameters && {
              components: [
                {
                  type: "body",
                  parameters: parameters.map((p) => ({ type: "text", text: p })),
                },
              ],
            }),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        messageId: response.data.messages[0].id,
        status: "sent",
      };
    } catch (error) {
      throw new Error(
        `Erro ao enviar template WhatsApp: ${error instanceof Error ? error.message : "Desconhecido"}`
      );
    }
  }

  /**
   * Obtém status da mensagem
   */
  async getMessageStatus(messageId: string): Promise<{
    messageId: string;
    status: "sent" | "delivered" | "read" | "failed";
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v18.0/${messageId}`,
        {
          params: {
            access_token: this.accessToken,
          },
        }
      );

      return {
        messageId: response.data.id,
        status: response.data.status,
      };
    } catch (error) {
      throw new Error(
        `Erro ao obter status da mensagem: ${error instanceof Error ? error.message : "Desconhecido"}`
      );
    }
  }
}
