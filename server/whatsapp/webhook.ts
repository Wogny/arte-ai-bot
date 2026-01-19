/**
 * Webhook Handler para WhatsApp Business API
 * Recebe e processa mensagens, status de entrega e respostas de aprovação
 */

import { Request, Response, Router } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db.js";
import { whatsappNotificationSettings } from '../../drizzle/schema.js';
import * as whatsappDb from "./db.js";
import { whatsappService } from "./service.js";

const router = Router();

// Verificação do webhook (GET)
router.get("/webhook", async (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("[WhatsApp Webhook] Verificação recebida:", { mode, token: token?.toString().substring(0, 10) + "..." });

  // Buscar token de verificação do workspace (usando um token padrão para verificação inicial)
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "arte-ai-bot-verify-token";

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WhatsApp Webhook] Verificação bem-sucedida");
    res.status(200).send(challenge);
  } else {
    console.warn("[WhatsApp Webhook] Verificação falhou", { mode, token });
    res.sendStatus(403);
  }
});

// Recebimento de eventos (POST)
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const body = req.body;

    console.log("[WhatsApp Webhook] Evento recebido:", JSON.stringify(body).substring(0, 500));

    // Verificar se é uma notificação do WhatsApp
    if (body.object !== "whatsapp_business_account") {
      console.log("[WhatsApp Webhook] Objeto não é whatsapp_business_account:", body.object);
      res.sendStatus(404);
      return;
    }

    // Processar cada entrada
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === "messages") {
          await processMessagesChange(change.value);
        }
      }
    }

    // Sempre retornar 200 para evitar reenvios
    res.sendStatus(200);
  } catch (error) {
    console.error("[WhatsApp Webhook] Erro ao processar:", error);
    // Ainda retornar 200 para evitar reenvios do Meta
    res.sendStatus(200);
  }
});

/**
 * Processa mudanças de mensagens
 */
async function processMessagesChange(value: any) {
  const phoneNumberId = value.metadata?.phone_number_id;
  
  console.log("[WhatsApp Webhook] Processando mensagens para phoneNumberId:", phoneNumberId);
  
  // Processar status de mensagens
  if (value.statuses) {
    for (const status of value.statuses) {
      await processMessageStatus(status);
    }
  }

  // Processar mensagens recebidas
  if (value.messages) {
    for (const message of value.messages) {
      await processIncomingMessage(phoneNumberId, message, value.contacts?.[0]);
    }
  }
}

/**
 * Processa status de entrega de mensagens
 */
async function processMessageStatus(status: any) {
  const waMessageId = status.id;
  const statusType = status.status; // sent, delivered, read, failed

  console.log("[WhatsApp Webhook] Status de mensagem:", { waMessageId, statusType });

  const message = await whatsappDb.getMessageByWaId(waMessageId);
  if (!message) {
    console.log("[WhatsApp Webhook] Mensagem não encontrada no banco:", waMessageId);
    return;
  }

  const updateData: any = { status: statusType };
  
  if (statusType === "delivered") {
    updateData.deliveredAt = new Date();
  } else if (statusType === "read") {
    updateData.readAt = new Date();
  } else if (statusType === "failed") {
    updateData.errorMessage = status.errors?.[0]?.message || "Falha no envio";
  }

  // Atualizar mensagem no banco
  // Nota: A função updateWhatsAppMessage requer workspaceId, mas para status updates
  // vindos do webhook, precisamos buscar o workspaceId através da conversa
  try {
    const db = await getDb();
    if (db) {
      const { whatsappMessages } = await import("../../drizzle/schema");
      await db.update(whatsappMessages)
        .set(updateData)
        .where(eq(whatsappMessages.id, message.id));
      console.log(`[WhatsApp Webhook] Mensagem ${waMessageId} atualizada para status: ${statusType}`);
    }
  } catch (error) {
    console.error("[WhatsApp Webhook] Erro ao atualizar status da mensagem:", error);
  }
}

/**
 * Processa mensagens recebidas
 */
async function processIncomingMessage(phoneNumberId: string, message: any, contactInfo: any) {
  try {
    const senderPhone = message.from;
    const messageType = message.type;
    const waMessageId = message.id;
    const timestamp = new Date(parseInt(message.timestamp) * 1000);

    console.log("[WhatsApp Webhook] Mensagem recebida:", { 
      from: senderPhone, 
      type: messageType, 
      id: waMessageId 
    });

    // Encontrar o workspace pelo phoneNumberId
    const workspaceId = await findWorkspaceByPhoneNumberId(phoneNumberId);
    if (!workspaceId) {
      console.warn(`[WhatsApp Webhook] Workspace não encontrado para phoneNumberId: ${phoneNumberId}`);
      return;
    }

    console.log("[WhatsApp Webhook] Workspace encontrado:", workspaceId);

    // Buscar ou criar contato
    let contact = await whatsappDb.getWhatsAppContactByPhone(workspaceId, senderPhone);
    if (!contact) {
      console.log("[WhatsApp Webhook] Criando novo contato:", senderPhone);
      const contactId = await whatsappDb.createWhatsAppContact({
        workspaceId,
        name: contactInfo?.profile?.name || senderPhone,
        phoneNumber: senderPhone,
      });
      contact = await whatsappDb.getWhatsAppContact(contactId, workspaceId);
    }

    if (!contact) {
      console.error("[WhatsApp Webhook] Falha ao criar/buscar contato");
      return;
    }

    // Buscar ou criar conversa
    let conversation = await whatsappDb.getConversationByContact(workspaceId, contact.id);
    if (!conversation) {
      console.log("[WhatsApp Webhook] Criando nova conversa para contato:", contact.id);
      const convId = await whatsappDb.createWhatsAppConversation({
        workspaceId,
        contactId: contact.id,
        status: "active",
      });
      conversation = await whatsappDb.getWhatsAppConversation(convId, workspaceId);
    }

    if (!conversation) {
      console.error("[WhatsApp Webhook] Falha ao criar/buscar conversa");
      return;
    }

    // Extrair conteúdo da mensagem
    let content = "";
    let mediaUrl = "";

    switch (messageType) {
      case "text":
        content = message.text?.body || "";
        break;
      case "image":
        mediaUrl = message.image?.id || "";
        content = message.image?.caption || "";
        break;
      case "button":
        content = message.button?.text || "";
        break;
      case "interactive":
        content = message.interactive?.button_reply?.title || 
                  message.interactive?.list_reply?.title || "";
        break;
      case "audio":
        mediaUrl = message.audio?.id || "";
        content = "[Áudio]";
        break;
      case "video":
        mediaUrl = message.video?.id || "";
        content = message.video?.caption || "[Vídeo]";
        break;
      case "document":
        mediaUrl = message.document?.id || "";
        content = message.document?.filename || "[Documento]";
        break;
      case "location":
        content = `[Localização: ${message.location?.latitude}, ${message.location?.longitude}]`;
        break;
      case "contacts":
        content = `[Contato: ${message.contacts?.[0]?.name?.formatted_name || "Desconhecido"}]`;
        break;
      case "sticker":
        mediaUrl = message.sticker?.id || "";
        content = "[Sticker]";
        break;
      default:
        content = `[${messageType}]`;
    }

    // Salvar mensagem no banco
    const savedMessageId = await whatsappDb.createWhatsAppMessage({
      conversationId: conversation.id,
      waMessageId,
      direction: "incoming",
      type: messageType,
      content,
      mediaUrl: mediaUrl || undefined,
      status: "delivered" as const,
    });

    // Atualizar conversa
    await whatsappDb.updateWhatsAppConversation(conversation.id, workspaceId, {
      lastMessageId: savedMessageId,
      lastMessageAt: timestamp,
      unreadCount: (conversation.unreadCount || 0) + 1,
    });

    // Verificar se é uma resposta de aprovação
    await checkApprovalResponse(workspaceId, contact.id, content, message);

    console.log(`[WhatsApp Webhook] Mensagem processada de ${senderPhone}: ${content.substring(0, 50)}...`);

  } catch (error) {
    console.error("[WhatsApp Webhook] Erro ao processar mensagem recebida:", error);
  }
}

/**
 * Verifica se a mensagem é uma resposta de aprovação
 */
async function checkApprovalResponse(
  workspaceId: number, 
  contactId: number, 
  content: string,
  rawMessage: any
) {
  // Verificar se é uma resposta de botão interativo
  const buttonId = rawMessage.interactive?.button_reply?.id;
  const isApproval = buttonId === "aprovar" || 
                     content.toLowerCase().includes("aprovar") ||
                     content.toLowerCase().includes("aprovado") ||
                     content.toLowerCase().includes("sim") ||
                     content.toLowerCase() === "ok";
  const isRejection = buttonId === "rejeitar" || 
                      content.toLowerCase().includes("rejeitar") ||
                      content.toLowerCase().includes("rejeitado") ||
                      content.toLowerCase().includes("não") ||
                      content.toLowerCase().includes("nao");

  if (!isApproval && !isRejection) return;

  console.log("[WhatsApp Webhook] Resposta de aprovação detectada:", { isApproval, isRejection });

  // Buscar solicitação de aprovação pendente para este contato
  const approvalRequests = await whatsappDb.getWorkspaceApprovalRequests(workspaceId, "pending");
  const pendingRequest = approvalRequests.find(r => r.contactId === contactId);

  if (!pendingRequest) {
    console.log("[WhatsApp Webhook] Nenhuma solicitação de aprovação pendente encontrada para contato:", contactId);
    return;
  }

  console.log("[WhatsApp Webhook] Processando aprovação para post:", pendingRequest.postId);

  // Atualizar status da solicitação
  await whatsappDb.updateApprovalRequest(pendingRequest.id, workspaceId, {
    status: isApproval ? "approved" : "rejected",
    respondedAt: new Date(),
    responseMessage: content,
  });

  // Atualizar status do post
  await whatsappDb.updateMultiPlatformPost(pendingRequest.postId, workspaceId, {
    status: isApproval ? "scheduled" : "draft",
    approvedAt: isApproval ? new Date() : undefined,
  });

  // Enviar confirmação
  const confirmationMessage = isApproval
    ? "✅ *Post aprovado com sucesso!*\n\nO conteúdo será publicado conforme agendado."
    : "❌ *Post rejeitado.*\n\nNossa equipe irá revisar e fazer os ajustes necessários.";

  await whatsappService.sendTextMessage(workspaceId, contactId, confirmationMessage);

  console.log(`[WhatsApp Webhook] Aprovação processada: ${isApproval ? "APROVADO" : "REJEITADO"} para post ${pendingRequest.postId}`);
}

/**
 * Encontra o workspace pelo phoneNumberId
 * Busca no banco de dados qual workspace tem este phoneNumberId configurado
 */
async function findWorkspaceByPhoneNumberId(phoneNumberId: string): Promise<number | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[WhatsApp Webhook] Database não disponível");
      return null;
    }

    const result = await db.select()
      .from(whatsappNotificationSettings)
      .where(eq(whatsappNotificationSettings.phoneNumberId, phoneNumberId))
      .limit(1);

    if (result.length > 0) {
      return result[0].workspaceId;
    }

    console.warn("[WhatsApp Webhook] Nenhum workspace encontrado para phoneNumberId:", phoneNumberId);
    return null;
  } catch (error) {
    console.error("[WhatsApp Webhook] Erro ao buscar workspace:", error);
    return null;
  }
}

export default router;
