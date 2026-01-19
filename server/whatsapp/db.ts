/**
 * Operações de banco de dados para WhatsApp Business
 * Usa queries diretas ao invés de db.query para evitar problemas de tipagem
 */

import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../db";
import {
  whatsappContacts,
  whatsappConversations,
  whatsappMessages,
  whatsappApprovalRequests,
  whatsappNotificationSettings,
  multiPlatformPosts,
} from "../../drizzle/schema";

// Tipos para os enums
type ConversationStatus = "active" | "archived" | "blocked";
type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed";
type MessageDirection = "incoming" | "outgoing";
type MessageType = "text" | "image" | "video" | "audio" | "document" | "template" | "interactive";
type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";

// ============ CONTACTS ============

export async function getWhatsAppContact(contactId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(whatsappContacts)
    .where(and(eq(whatsappContacts.id, contactId), eq(whatsappContacts.workspaceId, workspaceId)))
    .limit(1);
  return result[0] || null;
}

export async function getWhatsAppContactByPhone(workspaceId: number, phoneNumber: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(whatsappContacts)
    .where(and(
      eq(whatsappContacts.workspaceId, workspaceId),
      eq(whatsappContacts.phoneNumber, phoneNumber)
    ))
    .limit(1);
  return result[0] || null;
}

export async function getActiveWhatsAppContacts(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(whatsappContacts)
    .where(and(
      eq(whatsappContacts.workspaceId, workspaceId),
      eq(whatsappContacts.isActive, true)
    ));
}

export async function createWhatsAppContact(data: {
  workspaceId: number;
  name: string;
  phoneNumber: string;
  email?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(whatsappContacts).values({
    ...data,
    isActive: true,
  });
  return (result[0] as any).insertId;
}

export async function updateWhatsAppContact(contactId: number, workspaceId: number, data: Partial<{
  name: string;
  phoneNumber: string;
  email: string;
  notes: string;
  isActive: boolean;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(whatsappContacts)
    .set(data)
    .where(and(eq(whatsappContacts.id, contactId), eq(whatsappContacts.workspaceId, workspaceId)));
}

// ============ CONVERSATIONS ============

export async function getWhatsAppConversation(conversationId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(whatsappConversations)
    .where(and(eq(whatsappConversations.id, conversationId), eq(whatsappConversations.workspaceId, workspaceId)))
    .limit(1);
  return result[0] || null;
}

export async function getConversationByContact(workspaceId: number, contactId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(whatsappConversations)
    .where(and(
      eq(whatsappConversations.workspaceId, workspaceId),
      eq(whatsappConversations.contactId, contactId)
    ))
    .limit(1);
  return result[0] || null;
}

export async function getWorkspaceConversations(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(whatsappConversations)
    .where(eq(whatsappConversations.workspaceId, workspaceId))
    .orderBy(desc(whatsappConversations.lastMessageAt));
}

export async function createWhatsAppConversation(data: {
  workspaceId: number;
  contactId: number;
  status?: ConversationStatus;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(whatsappConversations).values({
    workspaceId: data.workspaceId,
    contactId: data.contactId,
    status: data.status || "active",
    unreadCount: 0,
  });
  return (result[0] as any).insertId;
}

export async function updateWhatsAppConversation(conversationId: number, workspaceId: number, data: {
  status?: ConversationStatus;
  unreadCount?: number;
  lastMessageId?: number;
  lastMessageAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(whatsappConversations)
    .set(data)
    .where(and(eq(whatsappConversations.id, conversationId), eq(whatsappConversations.workspaceId, workspaceId)));
}

// ============ MESSAGES ============

export async function getWhatsAppMessage(messageId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(whatsappMessages)
    .where(eq(whatsappMessages.id, messageId))
    .limit(1);
  return result[0] || null;
}

export async function getMessageByWaId(waMessageId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(whatsappMessages)
    .where(eq(whatsappMessages.waMessageId, waMessageId))
    .limit(1);
  return result[0] || null;
}

export async function getConversationMessages(conversationId: number, workspaceId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(whatsappMessages)
    .innerJoin(whatsappConversations, eq(whatsappMessages.conversationId, whatsappConversations.id))
    .where(and(eq(whatsappMessages.conversationId, conversationId), eq(whatsappConversations.workspaceId, workspaceId)))
    .orderBy(desc(whatsappMessages.sentAt))
    .limit(limit);
}

export async function createWhatsAppMessage(data: {
  conversationId: number;
  waMessageId?: string;
  direction: MessageDirection;
  type: MessageType;
  content?: string;
  mediaUrl?: string;
  templateName?: string;
  status?: MessageStatus;
  metadata?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(whatsappMessages).values({
    conversationId: data.conversationId,
    waMessageId: data.waMessageId,
    direction: data.direction,
    type: data.type || "text",
    content: data.content,
    mediaUrl: data.mediaUrl,
    templateName: data.templateName,
    status: data.status || "sent",
    metadata: data.metadata,
    sentAt: new Date(),
  });
  return (result[0] as any).insertId;
}

export async function updateWhatsAppMessage(messageId: number, workspaceId: number, data: {
  status?: MessageStatus;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(whatsappMessages)
    .set(data)
    .where(eq(whatsappMessages.id, messageId));
}

// ============ APPROVAL REQUESTS ============

export async function getApprovalRequest(requestId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(whatsappApprovalRequests)
    .where(and(eq(whatsappApprovalRequests.id, requestId), eq(whatsappApprovalRequests.workspaceId, workspaceId)))
    .limit(1);
  return result[0] || null;
}

export async function getPendingApprovalByPost(postId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(whatsappApprovalRequests)
    .where(and(
      eq(whatsappApprovalRequests.postId, postId),
      eq(whatsappApprovalRequests.status, "pending")
    ))
    .limit(1);
  return result[0] || null;
}

export async function getWorkspaceApprovalRequests(workspaceId: number, status?: ApprovalStatus) {
  const db = await getDb();
  if (!db) return [];

  const conditions = status
    ? and(eq(whatsappApprovalRequests.workspaceId, workspaceId), eq(whatsappApprovalRequests.status, status))
    : eq(whatsappApprovalRequests.workspaceId, workspaceId);

  return await db.select().from(whatsappApprovalRequests)
    .where(conditions)
    .orderBy(desc(whatsappApprovalRequests.createdAt));
}

export async function createApprovalRequest(data: {
  workspaceId: number;
  postId: number;
  contactId: number;
  conversationId: number;
  messageId?: number;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(whatsappApprovalRequests).values({
    ...data,
    status: "pending" as ApprovalStatus,
  });
  return (result[0] as any).insertId;
}

export async function updateApprovalRequest(requestId: number, workspaceId: number, data: {
  status?: ApprovalStatus;
  respondedAt?: Date;
  responseMessage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(whatsappApprovalRequests)
    .set(data)
    .where(and(eq(whatsappApprovalRequests.id, requestId), eq(whatsappApprovalRequests.workspaceId, workspaceId)));
}

// ============ NOTIFICATION SETTINGS ============

export async function getNotificationSettings(workspaceId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(whatsappNotificationSettings)
    .where(eq(whatsappNotificationSettings.workspaceId, workspaceId))
    .limit(1);
  return result[0] || null;
}

export async function upsertNotificationSettings(workspaceId: number, data: Partial<{
  isActive: boolean;
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  notifyOnPostPublished: boolean;
  notifyOnPostFailed: boolean;
  notifyOnApprovalNeeded: boolean;
  notifyOnNewComment: boolean;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getNotificationSettings(workspaceId);
  
  if (existing) {
    await db.update(whatsappNotificationSettings)
      .set(data)
      .where(eq(whatsappNotificationSettings.workspaceId, workspaceId));
  } else {
    await db.insert(whatsappNotificationSettings).values({
      workspaceId,
      isActive: data.isActive ?? false,
      phoneNumberId: data.phoneNumberId || null,
      accessToken: data.accessToken || null,
      businessAccountId: data.businessAccountId || null,
      webhookVerifyToken: data.webhookVerifyToken || null,
      notifyOnPostPublished: data.notifyOnPostPublished ?? true,
      notifyOnPostFailed: data.notifyOnPostFailed ?? true,
      notifyOnApprovalNeeded: data.notifyOnApprovalNeeded ?? true,
      notifyOnNewComment: data.notifyOnNewComment ?? false,
    });
  }
}

// ============ POSTS ============

export async function getMultiPlatformPost(postId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(multiPlatformPosts)
    .where(and(eq(multiPlatformPosts.id, postId), eq(multiPlatformPosts.userId, workspaceId)))
    .limit(1);
  return result[0] || null;
}

export async function updateMultiPlatformPost(postId: number, workspaceId: number, data: Partial<{
  status: "draft" | "scheduled" | "published" | "failed";
  approvedBy: number;
  approvedAt: Date;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(multiPlatformPosts)
    .set(data)
    .where(and(eq(multiPlatformPosts.id, postId), eq(multiPlatformPosts.userId, workspaceId)));
}
