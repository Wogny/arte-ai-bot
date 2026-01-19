import { getDb } from "../db";
import { outgoingWebhooks } from '../../drizzle/schema.js';
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

/**
 * Envia um evento para todos os webhooks registrados no workspace
 */
export async function triggerWebhook(workspaceId: number, event: string, data: any) {
  try {
    const db = await getDb();
    if (!db) return;

    const webhooks = await db
      .select()
      .from(outgoingWebhooks)
      .where(and(eq(outgoingWebhooks.workspaceId, workspaceId), eq(outgoingWebhooks.isActive, true)));

    for (const webhook of webhooks) {
      const events = webhook.events as string[];
      if (events.includes(event)) {
        // Envia o webhook de forma assíncrona
        sendWebhook(webhook.url, webhook.secret, event, data).catch(err => 
          console.error(`[WEBHOOK] Erro ao enviar para ${webhook.url}:`, err.message)
        );
      }
    }
  } catch (error) {
    console.error("[WEBHOOK] Erro ao buscar webhooks:", error);
  }
}

/**
 * Realiza a chamada HTTP para o webhook com assinatura de segurança
 */
async function sendWebhook(url: string, secret: string, event: string, data: any) {
  const payload = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data,
  });

  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-ArteAI-Signature": signature,
      "X-ArteAI-Event": event,
    },
    body: payload,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  console.log(`[WEBHOOK] Evento ${event} enviado com sucesso para ${url}`);
}
