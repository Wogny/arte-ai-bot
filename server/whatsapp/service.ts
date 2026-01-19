import axios from "axios";
import * as whatsappDb from "./db.js";

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";

interface SendMessageOptions {
  workspaceId: number;
  contactId: number;
  type: "text" | "image" | "template" | "interactive";
  content?: string;
  mediaUrl?: string;
  templateName?: string;
  templateParams?: string[];
  buttons?: Array<{ id: string; title: string }>;
}

interface SendApprovalRequestOptions {
  workspaceId: number;
  postId: number;
  contactId: number;
  postTitle: string;
  postCaption: string;
  postImageUrl?: string;
  platforms: string[];
  scheduledFor?: Date;
}

/**
 * Serviço principal de WhatsApp Business
 */
export class WhatsAppService {
  
  /**
   * Obtém as configurações do WhatsApp para um workspace
   */
  async getSettings(workspaceId: number) {
    return await whatsappDb.getNotificationSettings(workspaceId);
  }

  /**
   * Envia uma mensagem de texto simples
   */
  async sendTextMessage(
    workspaceId: number,
    contactId: number,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendMessage({
      workspaceId,
      contactId,
      type: "text",
      content: message,
    });
  }

  /**
   * Envia uma mensagem com imagem
   */
  async sendImageMessage(
    workspaceId: number,
    contactId: number,
    imageUrl: string,
    caption?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendMessage({
      workspaceId,
      contactId,
      type: "image",
      mediaUrl: imageUrl,
      content: caption,
    });
  }

  /**
   * Envia uma mensagem interativa com botões
   */
  async sendInteractiveMessage(
    workspaceId: number,
    contactId: number,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendMessage({
      workspaceId,
      contactId,
      type: "interactive",
      content: bodyText,
      buttons,
    });
  }

  /**
   * Envia solicitação de aprovação de post via WhatsApp
   */
  async sendApprovalRequest(options: SendApprovalRequestOptions): Promise<{
    success: boolean;
    approvalRequestId?: number;
    error?: string;
  }> {
    try {
      const { workspaceId, postId, contactId, postTitle, postCaption, postImageUrl, platforms, scheduledFor } = options;

      // Buscar contato
      const contact = await whatsappDb.getWhatsAppContact(contactId, workspaceId);
      if (!contact) {
        return { success: false, error: "Contato não encontrado" };
      }

      // Buscar ou criar conversa
      let conversation = await whatsappDb.getConversationByContact(workspaceId, contactId);
      if (!conversation) {
        const convId = await whatsappDb.createWhatsAppConversation({
          workspaceId,
          contactId,
          status: "active",
        });
        conversation = await whatsappDb.getWhatsAppConversation(convId, workspaceId);
      }

      // Montar mensagem de aprovação
      const platformsText = platforms.join(", ");
      const scheduleText = scheduledFor 
        ? `📅 Agendado para: ${scheduledFor.toLocaleDateString("pt-BR")} às ${scheduledFor.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
        : "📅 Publicação imediata após aprovação";

      const approvalMessage = `
🎨 *Solicitação de Aprovação*

📝 *Título:* ${postTitle}

💬 *Legenda:*
${postCaption.substring(0, 500)}${postCaption.length > 500 ? "..." : ""}

📱 *Plataformas:* ${platformsText}
${scheduleText}

Por favor, responda com:
✅ *Aprovar* - para autorizar a publicação
❌ *Rejeitar* - para solicitar alterações
      `.trim();

      // Enviar imagem primeiro (se houver)
      if (postImageUrl) {
        await this.sendImageMessage(workspaceId, contactId, postImageUrl, "Preview da arte:");
      }

      // Enviar mensagem interativa com botões
      const result = await this.sendInteractiveMessage(
        workspaceId,
        contactId,
        approvalMessage,
        [
          { id: "aprovar", title: "✅ Aprovar" },
          { id: "rejeitar", title: "❌ Rejeitar" },
        ]
      );

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Buscar a mensagem salva
      const savedMessage = result.messageId 
        ? await whatsappDb.getMessageByWaId(result.messageId)
        : null;

      // Criar registro de solicitação de aprovação
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48); // Expira em 48 horas

      const approvalRequestId = await whatsappDb.createApprovalRequest({
        workspaceId,
        postId,
        contactId,
        conversationId: conversation!.id,
        messageId: savedMessage?.id,
        expiresAt,
      });

      return { success: true, approvalRequestId };

    } catch (error) {
      console.error("[WhatsApp] Erro ao enviar solicitação de aprovação:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
    }
  }

  /**
   * Envia notificação de post publicado
   */
  async sendPostPublishedNotification(
    workspaceId: number,
    contactId: number,
    postTitle: string,
    platforms: string[],
    postUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    const message = `
✅ *Post Publicado com Sucesso!*

📝 *Título:* ${postTitle}
📱 *Plataformas:* ${platforms.join(", ")}
${postUrl ? `🔗 *Link:* ${postUrl}` : ""}

Obrigado por usar o Arte AI Bot! 🚀
    `.trim();

    const result = await this.sendTextMessage(workspaceId, contactId, message);
    return { success: result.success, error: result.error };
  }

  /**
   * Envia notificação de erro na publicação
   */
  async sendPostFailedNotification(
    workspaceId: number,
    contactId: number,
    postTitle: string,
    errorMessage: string
  ): Promise<{ success: boolean; error?: string }> {
    const message = `
❌ *Erro na Publicação*

📝 *Post:* ${postTitle}
⚠️ *Erro:* ${errorMessage}

Nossa equipe foi notificada e está trabalhando para resolver o problema.
    `.trim();

    const result = await this.sendTextMessage(workspaceId, contactId, message);
    return { success: result.success, error: result.error };
  }

  /**
   * Método interno para enviar mensagens
   */
  private async sendMessage(options: SendMessageOptions): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const { workspaceId, contactId, type, content, mediaUrl, templateName, templateParams, buttons } = options;

      // Buscar configurações do workspace
      const settings = await this.getSettings(workspaceId);
      if (!settings || !settings.isActive || !settings.phoneNumberId || !settings.accessToken) {
        return { success: false, error: "WhatsApp não configurado para este workspace" };
      }

      // Buscar contato
      const contact = await whatsappDb.getWhatsAppContact(contactId, workspaceId);
      if (!contact) {
        return { success: false, error: "Contato não encontrado" };
      }

      // Buscar ou criar conversa
      let conversation = await whatsappDb.getConversationByContact(workspaceId, contactId);
      if (!conversation) {
        const convId = await whatsappDb.createWhatsAppConversation({
          workspaceId,
          contactId,
          status: "active",
        });
        conversation = await whatsappDb.getWhatsAppConversation(convId, workspaceId);
      }

      // Montar payload da mensagem
      let messagePayload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: contact.phoneNumber,
      };

      switch (type) {
        case "text":
          messagePayload.type = "text";
          messagePayload.text = { preview_url: true, body: content };
          break;

        case "image":
          messagePayload.type = "image";
          messagePayload.image = { link: mediaUrl };
          if (content) {
            messagePayload.image.caption = content;
          }
          break;

        case "template":
          messagePayload.type = "template";
          messagePayload.template = {
            name: templateName,
            language: { code: "pt_BR" },
          };
          if (templateParams && templateParams.length > 0) {
            messagePayload.template.components = [{
              type: "body",
              parameters: templateParams.map(p => ({ type: "text", text: p })),
            }];
          }
          break;

        case "interactive":
          messagePayload.type = "interactive";
          messagePayload.interactive = {
            type: "button",
            body: { text: content },
            action: {
              buttons: buttons?.map(b => ({
                type: "reply",
                reply: { id: b.id, title: b.title },
              })) || [],
            },
          };
          break;
      }

      // Enviar para a API do WhatsApp
      const response = await axios.post(
        `${WHATSAPP_API_URL}/${settings.phoneNumberId}/messages`,
        messagePayload,
        {
          headers: {
            Authorization: `Bearer ${settings.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const waMessageId = response.data.messages?.[0]?.id;

      // Salvar mensagem no banco
      const savedMessageId = await whatsappDb.createWhatsAppMessage({
        conversationId: conversation!.id,
        waMessageId,
        direction: "outgoing",
        type: type === "interactive" ? "interactive" : type,
        content,
        mediaUrl: mediaUrl || undefined,
        templateName: templateName || undefined,
        status: "sent",
        metadata: buttons ? JSON.stringify({ buttons }) : undefined,
      });

      // Atualizar conversa
      await whatsappDb.updateWhatsAppConversation(conversation!.id, workspaceId, {
        lastMessageId: savedMessageId,
        lastMessageAt: new Date(),
      });

      return { success: true, messageId: waMessageId };

    } catch (error) {
      console.error("[WhatsApp] Erro ao enviar mensagem:", error);
      
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.error;
        return { 
          success: false, 
          error: errorData?.message || error.message 
        };
      }
      
      return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
    }
  }

  /**
   * Marca mensagens como lidas
   */
  async markAsRead(workspaceId: number, conversationId: number): Promise<void> {
    await whatsappDb.updateWhatsAppConversation(conversationId, workspaceId, { unreadCount: 0 });
  }

  /**
   * Arquiva uma conversa
   */
  async archiveConversation(workspaceId: number, conversationId: number): Promise<void> {
    await whatsappDb.updateWhatsAppConversation(conversationId, workspaceId, { status: "archived" });
  }
}

// Exportar instância singleton
export const whatsappService = new WhatsAppService();
