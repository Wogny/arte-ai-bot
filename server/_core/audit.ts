import { getDb } from "./db.js";
import { auditLogs } from '../../drizzle/schema.js';

interface AuditLogParams {
  workspaceId: number;
  userId: number;
  action: string;
  entityType: string;
  entityId?: number;
  details?: any;
  ipAddress?: string;
}

/**
 * Registra uma ação no histórico de atividades (Audit Log)
 */
export async function logActivity(params: AuditLogParams) {
  try {
    const db = await getDb();
    if (!db) return;

    await db.insert(auditLogs).values({
      workspaceId: params.workspaceId,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details,
      ipAddress: params.ipAddress,
    });
    
    console.log(`[AUDIT] ${params.action} por usuário ${params.userId} no workspace ${params.workspaceId}`);
  } catch (error) {
    console.error("[AUDIT] Erro ao registrar log de atividade:", error);
  }
}
