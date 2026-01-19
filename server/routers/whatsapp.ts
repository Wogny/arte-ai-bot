import { z } from "zod";
import axios from "axios";
import { router, protectedProcedure } from "../_core/trpc";
import { logActivity } from "../_core/audit";
import { whatsappService } from "../whatsapp/service";
import * as whatsappDb from "../whatsapp/db";

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";

export const whatsappRouter = router({
  // ==========================================
  // CONFIGURAÇÕES
  // ==========================================
  
  /**
   * Obtém as configurações do WhatsApp para o workspace
   */
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const settings = await whatsappDb.getNotificationSettings(ctx.user.id);
    
    return settings || {
      isActive: false,
      phoneNumberId: null,
      accessToken: null,
      businessAccountId: null,
      webhookVerifyToken: null,
      notifyOnPostPublished: true,
      notifyOnPostFailed: true,
      notifyOnApprovalNeeded: true,
      notifyOnNewComment: false,
    };
  }),

  /**
   * Atualiza as configurações do WhatsApp
   */
  updateSettings: protectedProcedure
    .input(z.object({
      isActive: z.boolean().optional(),
      phoneNumberId: z.string().optional(),
      accessToken: z.string().optional(),
      businessAccountId: z.string().optional(),
      webhookVerifyToken: z.string().optional(),
      notifyOnPostPublished: z.boolean().optional(),
      notifyOnPostFailed: z.boolean().optional(),
      notifyOnApprovalNeeded: z.boolean().optional(),
      notifyOnNewComment: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await whatsappDb.upsertNotificationSettings(ctx.user.id, input);

      await logActivity({
        workspaceId: ctx.user.id,
        userId: ctx.user.id,
        action: "whatsapp_settings_updated",
        entityType: "whatsapp_settings",
        details: { changes: Object.keys(input) },
      });

      return { success: true };
    }),

  /**
   * Testa a conexão com o WhatsApp Business API
   */
  testConnection: protectedProcedure.mutation(async ({ ctx }) => {
    const settings = await whatsappDb.getNotificationSettings(ctx.user.id);
    
    if (!settings || !settings.phoneNumberId || !settings.accessToken) {
      return {
        connected: false,
        error: "Credenciais não configuradas. Por favor, preencha o Phone Number ID e Access Token.",
      };
    }

    try {
      // Testar conexão buscando informações do número de telefone
      const response = await axios.get(
        `${WHATSAPP_API_URL}/${settings.phoneNumberId}`,
        {
          headers: {
            Authorization: `Bearer ${settings.accessToken}`,
          },
          params: {
            fields: "verified_name,display_phone_number,quality_rating",
          },
        }
      );

      const data = response.data;

      await logActivity({
        workspaceId: ctx.user.id,
        userId: ctx.user.id,
        action: "whatsapp_connection_tested",
        entityType: "whatsapp_settings",
        details: { success: true, phoneNumber: data.display_phone_number },
      });

      return {
        connected: true,
        phoneNumber: data.display_phone_number,
        businessName: data.verified_name,
        qualityRating: data.quality_rating,
      };
    } catch (error) {
      let errorMessage = "Erro desconhecido ao conectar";
      
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.error;
        if (errorData?.code === 190) {
          errorMessage = "Token de acesso inválido ou expirado";
        } else if (errorData?.code === 100) {
          errorMessage = "Phone Number ID inválido";
        } else {
          errorMessage = errorData?.message || error.message;
        }
      }

      await logActivity({
        workspaceId: ctx.user.id,
        userId: ctx.user.id,
        action: "whatsapp_connection_failed",
        entityType: "whatsapp_settings",
        details: { error: errorMessage },
      });

      return {
        connected: false,
        error: errorMessage,
      };
    }
  }),

  /**
   * Envia uma mensagem de teste
   */
  sendTestMessage: protectedProcedure
    .input(z.object({
      phoneNumber: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const settings = await whatsappDb.getNotificationSettings(ctx.user.id);
      
      if (!settings || !settings.isActive || !settings.phoneNumberId || !settings.accessToken) {
        return {
          success: false,
          error: "WhatsApp não configurado ou inativo",
        };
      }

      try {
        const response = await axios.post(
          `${WHATSAPP_API_URL}/${settings.phoneNumberId}/messages`,
          {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: input.phoneNumber.replace(/\D/g, ""),
            type: "text",
            text: {
              preview_url: false,
              body: "🎨 *Arte AI Bot*\n\nEsta é uma mensagem de teste!\n\nSua integração com o WhatsApp Business está funcionando corretamente. ✅",
            },
          },
          {
            headers: {
              Authorization: `Bearer ${settings.accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        const messageId = response.data.messages?.[0]?.id;

        await logActivity({
          workspaceId: ctx.user.id,
          userId: ctx.user.id,
          action: "whatsapp_test_message_sent",
          entityType: "whatsapp_message",
          details: { phoneNumber: input.phoneNumber, messageId },
        });

        return {
          success: true,
          messageId,
        };
      } catch (error) {
        let errorMessage = "Erro ao enviar mensagem de teste";
        
        if (axios.isAxiosError(error)) {
          const errorData = error.response?.data?.error;
          errorMessage = errorData?.message || error.message;
        }

        return {
          success: false,
          error: errorMessage,
        };
      }
    }),

  // ==========================================
  // CONTATOS
  // ==========================================

  /**
   * Lista todos os contatos do WhatsApp
   */
  listContacts: protectedProcedure.query(async ({ ctx }) => {
    return await whatsappDb.getActiveWhatsAppContacts(ctx.user.id);
  }),

  /**
   * Cria um novo contato
   */
  createContact: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      phoneNumber: z.string().min(10),
      email: z.string().email().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se já existe
      const existing = await whatsappDb.getWhatsAppContactByPhone(ctx.user.id, input.phoneNumber);
      if (existing) {
        throw new Error("Contato com este número já existe");
      }

      const contactId = await whatsappDb.createWhatsAppContact({
        workspaceId: ctx.user.id,
        ...input,
      });

      await logActivity({
        workspaceId: ctx.user.id,
        userId: ctx.user.id,
        action: "whatsapp_contact_created",
        entityType: "whatsapp_contact",
        entityId: contactId,
        details: { name: input.name, phoneNumber: input.phoneNumber },
      });

      return { id: contactId };
    }),

  /**
   * Atualiza um contato
   */
  updateContact: protectedProcedure
    .input(z.object({
      contactId: z.number(),
      name: z.string().min(1).optional(),
      phoneNumber: z.string().min(10).optional(),
      email: z.string().email().optional(),
      notes: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { contactId, ...data } = input;
      await whatsappDb.updateWhatsAppContact(contactId, ctx.user.id, data);
      return { success: true };
    }),

  // ==========================================
  // CONVERSAS
  // ==========================================

  /**
   * Lista todas as conversas
   */
  listConversations: protectedProcedure.query(async ({ ctx }) => {
    return await whatsappDb.getWorkspaceConversations(ctx.user.id);
  }),

  /**
   * Obtém uma conversa específica com mensagens
   */
  getConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verificar que a conversa pertence ao usuário
      const conversation = await whatsappDb.getWhatsAppConversation(input.conversationId, ctx.user.id);
      if (!conversation) {
        throw new Error("Conversa não encontrada ou acesso negado");
      }

      const messages = await whatsappDb.getConversationMessages(input.conversationId, ctx.user.id, 100);
      const contact = await whatsappDb.getWhatsAppContact(conversation.contactId, ctx.user.id);

      return {
        ...conversation,
        contact,
        messages: messages.reverse(), // Ordem cronológica
      };
    }),

  // ==========================================
  // MENSAGENS
  // ==========================================

  /**
   * Envia uma mensagem de texto
   */
  sendMessage: protectedProcedure
    .input(z.object({
      contactId: z.number(),
      message: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await whatsappService.sendTextMessage(
        ctx.user.id,
        input.contactId,
        input.message
      );

      if (!result.success) {
        throw new Error(result.error || "Falha ao enviar mensagem");
      }

      return result;
    }),

  /**
   * Envia uma imagem
   */
  sendImage: protectedProcedure
    .input(z.object({
      contactId: z.number(),
      imageUrl: z.string().url(),
      caption: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await whatsappService.sendImageMessage(
        ctx.user.id,
        input.contactId,
        input.imageUrl,
        input.caption
      );

      if (!result.success) {
        throw new Error(result.error || "Falha ao enviar imagem");
      }

      return result;
    }),

  // ==========================================
  // APROVAÇÕES
  // ==========================================

  /**
   * Lista solicitações de aprovação
   */
  listApprovalRequests: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "approved", "rejected", "expired"]).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return await whatsappDb.getWorkspaceApprovalRequests(
        ctx.user.id,
        input?.status as any
      );
    }),

  /**
   * Envia solicitação de aprovação para um post
   */
  sendApprovalRequest: protectedProcedure
    .input(z.object({
      postId: z.number(),
      contactId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const post = await whatsappDb.getMultiPlatformPost(input.postId, ctx.user.id);
      if (!post) {
        throw new Error("Post não encontrado");
      }

      const result = await whatsappService.sendApprovalRequest({
        workspaceId: ctx.user.id,
        postId: input.postId,
        contactId: input.contactId,
        postTitle: post.title,
        postCaption: post.content,
        postImageUrl: post.imageUrl || undefined,
        platforms: post.platforms as string[],
        scheduledFor: post.scheduledAt,
      });

      if (!result.success) {
        throw new Error(result.error || "Falha ao enviar solicitação");
      }

      await logActivity({
        workspaceId: ctx.user.id,
        userId: ctx.user.id,
        action: "whatsapp_approval_sent",
        entityType: "post",
        entityId: input.postId,
        details: { contactId: input.contactId },
      });

      return result;
    }),

  /**
   * Processa resposta de aprovação manualmente
   */
  processApprovalResponse: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      approved: z.boolean(),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const request = await whatsappDb.getApprovalRequest(input.requestId, ctx.user.id);
      if (!request) {
        throw new Error("Solicitação não encontrada");
      }

      await whatsappDb.updateApprovalRequest(input.requestId, ctx.user.id, {
        status: input.approved ? "approved" : "rejected",
        respondedAt: new Date(),
        responseMessage: input.feedback,
      });

      // Atualizar status do post
      if (input.approved) {
        await whatsappDb.updateMultiPlatformPost(request.postId, ctx.user.id, {
          status: "scheduled",
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
        });
      }

      await logActivity({
        workspaceId: ctx.user.id,
        userId: ctx.user.id,
        action: input.approved ? "post_approved" : "post_rejected",
        entityType: "post",
        entityId: request.postId,
        details: { feedback: input.feedback },
      });

      return { success: true };
    }),
});
