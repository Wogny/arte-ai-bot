/**
 * Serviço de Notificações WhatsApp
 * 
 * Integra o sistema de notificações do Arte AI Bot com o WhatsApp Business,
 * enviando alertas automáticos para os contatos configurados.
 */

import * as whatsappDb from "./db.js";
import { whatsappService } from "./service.js";

// Tipos de notificação suportados
export type NotificationType = 
  | "post_published"
  | "post_failed"
  | "approval_needed"
  | "approval_received"
  | "new_comment"
  | "daily_summary"
  | "quota_warning";

interface NotificationPayload {
  workspaceId: number;
  type: NotificationType;
  title: string;
  message: string;
  postId?: number;
  contactId?: number;
  metadata?: Record<string, any>;
}

/**
 * Verifica se as notificações estão habilitadas para um tipo específico
 */
async function isNotificationEnabled(
  workspaceId: number, 
  type: NotificationType
): Promise<boolean> {
  const settings = await whatsappDb.getNotificationSettings(workspaceId);

  if (!settings?.isActive) return false;

  switch (type) {
    case "post_published":
      return settings.notifyOnPostPublished ?? true;
    case "post_failed":
      return settings.notifyOnPostFailed ?? true;
    case "approval_needed":
    case "approval_received":
      return settings.notifyOnApprovalNeeded ?? true;
    case "new_comment":
      return settings.notifyOnNewComment ?? false;
    default:
      return true;
  }
}

/**
 * Envia notificação via WhatsApp
 */
export async function sendWhatsAppNotification(payload: NotificationPayload): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // Verificar se notificações estão habilitadas
    const enabled = await isNotificationEnabled(payload.workspaceId, payload.type);
    if (!enabled) {
      return { success: false, error: "Notificações desabilitadas para este tipo" };
    }

    // Se um contactId específico foi fornecido, enviar apenas para ele
    if (payload.contactId) {
      const result = await whatsappService.sendTextMessage(
        payload.workspaceId,
        payload.contactId,
        formatNotificationMessage(payload)
      );
      return result;
    }

    // Caso contrário, enviar para todos os contatos ativos do workspace
    const contacts = await whatsappDb.getActiveWhatsAppContacts(payload.workspaceId);

    if (contacts.length === 0) {
      return { success: false, error: "Nenhum contato ativo encontrado" };
    }

    // Enviar para o primeiro contato (ou implementar lógica de broadcast)
    const result = await whatsappService.sendTextMessage(
      payload.workspaceId,
      contacts[0].id,
      formatNotificationMessage(payload)
    );

    return result;
  } catch (error: any) {
    console.error("[WhatsApp Notification Error]", error);
    return { success: false, error: error.message };
  }
}

/**
 * Formata a mensagem de notificação
 */
function formatNotificationMessage(payload: NotificationPayload): string {
  const emoji = getNotificationEmoji(payload.type);
  const timestamp = new Date().toLocaleString("pt-BR");

  return `${emoji} *${payload.title}*

${payload.message}

---
_Arte AI Bot • ${timestamp}_`;
}

/**
 * Retorna o emoji apropriado para cada tipo de notificação
 */
function getNotificationEmoji(type: NotificationType): string {
  const emojis: Record<NotificationType, string> = {
    post_published: "✅",
    post_failed: "❌",
    approval_needed: "⏳",
    approval_received: "👍",
    new_comment: "💬",
    daily_summary: "📊",
    quota_warning: "⚠️",
  };
  return emojis[type] || "📢";
}

// ==========================================
// FUNÇÕES DE NOTIFICAÇÃO ESPECÍFICAS
// ==========================================

/**
 * Notifica quando um post é publicado com sucesso
 */
export async function notifyPostPublished(
  workspaceId: number,
  postId: number,
  platforms: string[]
): Promise<void> {
  const post = await whatsappDb.getMultiPlatformPost(postId, workspaceId);

  await sendWhatsAppNotification({
    workspaceId,
    type: "post_published",
    title: "Post Publicado!",
    message: `O post "${post?.title || "Sem título"}" foi publicado com sucesso em: ${platforms.join(", ")}.`,
    postId,
  });
}

/**
 * Notifica quando um post falha na publicação
 */
export async function notifyPostFailed(
  workspaceId: number,
  postId: number,
  error: string
): Promise<void> {
  const post = await whatsappDb.getMultiPlatformPost(postId, workspaceId);

  await sendWhatsAppNotification({
    workspaceId,
    type: "post_failed",
    title: "Erro na Publicação",
    message: `O post "${post?.title || "Sem título"}" não pôde ser publicado.

*Motivo:* ${error}

Acesse o painel para mais detalhes.`,
    postId,
  });
}

/**
 * Notifica quando uma aprovação é necessária
 */
export async function notifyApprovalNeeded(
  workspaceId: number,
  postId: number,
  contactId: number
): Promise<void> {
  const post = await whatsappDb.getMultiPlatformPost(postId, workspaceId);

  // Usar o serviço de aprovação dedicado
  await whatsappService.sendApprovalRequest({
    workspaceId,
    postId,
    contactId,
    postTitle: post?.title || "Novo Post",
    postCaption: post?.content || "",
    postImageUrl: post?.imageUrl || undefined,
    platforms: (post?.platforms as string[]) || [],
    scheduledFor: post?.scheduledAt || undefined,
  });
}

/**
 * Notifica quando uma aprovação é recebida
 */
export async function notifyApprovalReceived(
  workspaceId: number,
  postId: number,
  approved: boolean,
  feedback?: string
): Promise<void> {
  const post = await whatsappDb.getMultiPlatformPost(postId, workspaceId);

  await sendWhatsAppNotification({
    workspaceId,
    type: "approval_received",
    title: approved ? "Post Aprovado!" : "Post Rejeitado",
    message: approved
      ? `O post "${post?.title || "Sem título"}" foi aprovado e será publicado conforme agendado.`
      : `O post "${post?.title || "Sem título"}" foi rejeitado.${feedback ? `\n\n*Feedback:* ${feedback}` : ""}`,
    postId,
  });
}

/**
 * Notifica sobre novos comentários
 */
export async function notifyNewComment(
  workspaceId: number,
  postId: number,
  commentAuthor: string,
  commentText: string
): Promise<void> {
  const post = await whatsappDb.getMultiPlatformPost(postId, workspaceId);

  await sendWhatsAppNotification({
    workspaceId,
    type: "new_comment",
    title: "Novo Comentário",
    message: `*${commentAuthor}* comentou no post "${post?.title || "Sem título"}":

"${commentText.substring(0, 200)}${commentText.length > 200 ? "..." : ""}"`,
    postId,
  });
}

/**
 * Envia resumo diário de atividades
 */
export async function sendDailySummary(
  workspaceId: number,
  stats: {
    postsPublished: number;
    totalReach: number;
    totalEngagement: number;
    pendingApprovals: number;
  }
): Promise<void> {
  await sendWhatsAppNotification({
    workspaceId,
    type: "daily_summary",
    title: "Resumo do Dia",
    message: `📈 *Estatísticas de Hoje*

• Posts publicados: ${stats.postsPublished}
• Alcance total: ${stats.totalReach.toLocaleString("pt-BR")}
• Engajamento: ${stats.totalEngagement.toLocaleString("pt-BR")}
• Aprovações pendentes: ${stats.pendingApprovals}

Continue assim! 🚀`,
  });
}

/**
 * Alerta sobre limite de quota próximo
 */
export async function notifyQuotaWarning(
  workspaceId: number,
  resource: string,
  used: number,
  limit: number
): Promise<void> {
  const percentage = Math.round((used / limit) * 100);

  await sendWhatsAppNotification({
    workspaceId,
    type: "quota_warning",
    title: "Alerta de Limite",
    message: `Você já utilizou *${percentage}%* do seu limite de ${resource}.

• Usado: ${used}
• Limite: ${limit}

Considere fazer upgrade do seu plano para continuar criando conteúdo sem interrupções.`,
  });
}

export default {
  sendWhatsAppNotification,
  notifyPostPublished,
  notifyPostFailed,
  notifyApprovalNeeded,
  notifyApprovalReceived,
  notifyNewComment,
  sendDailySummary,
  notifyQuotaWarning,
};
