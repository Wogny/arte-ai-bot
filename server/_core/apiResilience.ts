import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { getDb } from "../db";
import { platformCredentials } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { decrypt, encrypt } from "./security";

/**
 * Configuração para tentativas de re-execução (Retry)
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffFactor: 2,
};

/**
 * Executa uma função com lógica de retry exponencial
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = RETRY_CONFIG.maxRetries,
  delay = RETRY_CONFIG.initialDelayMs
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    // Só faz retry em erros de rede ou 5xx (servidor)
    const isNetworkError = !axios.isAxiosError(error) || !error.response;
    const isServerError = axios.isAxiosError(error) && error.response && error.response.status >= 500;
    
    if (isNetworkError || isServerError) {
      console.warn(`[RETRY] Falha detectada. Tentando novamente em ${delay}ms... (${retries} tentativas restantes)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * RETRY_CONFIG.backoffFactor);
    }
    
    throw error;
  }
}

/**
 * Gerencia o refresh automático de tokens para diferentes plataformas
 */
export class TokenManager {
  /**
   * Atualiza o token do TikTok
   */
  static async refreshTikTokToken(credentialId: number): Promise<string> {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados não disponível");

    const creds = await db.select().from(platformCredentials).where(eq(platformCredentials.id, credentialId)).limit(1);
    if (!creds.length || !creds[0].refreshToken) throw new Error("Credential ou Refresh Token não encontrado");

    const decryptedRefreshToken = decrypt(creds[0].refreshToken);

    try {
      const response = await axios.post("https://open.tiktokapis.com/v2/oauth/token/", {
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: decryptedRefreshToken,
      }, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      const newAccessToken = response.data.access_token;
      const newRefreshToken = response.data.refresh_token;
      const expiresAt = new Date(Date.now() + response.data.expires_in * 1000);

      await db.update(platformCredentials).set({
        accessToken: encrypt(newAccessToken),
        refreshToken: newRefreshToken ? encrypt(newRefreshToken) : creds[0].refreshToken,
        expiresAt,
        updatedAt: new Date(),
      }).where(eq(platformCredentials.id, credentialId));

      return newAccessToken;
    } catch (error) {
      console.error("[TOKEN-REFRESH] Erro ao atualizar token TikTok:", error);
      throw error;
    }
  }

  /**
   * Atualiza o token da Meta (Facebook/Instagram) - Long-lived tokens
   * Nota: Meta tokens de longa duração duram 60 dias e podem ser renovados se usados.
   */
  static async refreshMetaToken(credentialId: number): Promise<string> {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados não disponível");

    const creds = await db.select().from(platformCredentials).where(eq(platformCredentials.id, credentialId)).limit(1);
    if (!creds.length) throw new Error("Credential não encontrada");

    const decryptedAccessToken = decrypt(creds[0].accessToken);

    try {
      const response = await axios.get("https://graph.facebook.com/v18.0/oauth/access_token", {
        params: {
          grant_type: "fb_exchange_token",
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          fb_exchange_token: decryptedAccessToken,
        }
      });

      const newAccessToken = response.data.access_token;
      const expiresAt = new Date(Date.now() + (response.data.expires_in || 5184000) * 1000);

      await db.update(platformCredentials).set({
        accessToken: encrypt(newAccessToken),
        expiresAt,
        updatedAt: new Date(),
      }).where(eq(platformCredentials.id, credentialId));

      return newAccessToken;
    } catch (error) {
      console.error("[TOKEN-REFRESH] Erro ao atualizar token Meta:", error);
      throw error;
    }
  }
}

/**
 * Wrapper para chamadas de API com tratamento de erro e refresh de token automático
 */
export async function callPlatformApi<T>(
  credentialId: number,
  apiCall: (accessToken: string) => Promise<T>
): Promise<T> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados não disponível");

  const creds = await db.select().from(platformCredentials).where(eq(platformCredentials.id, credentialId)).limit(1);
  if (!creds.length) throw new Error("Credential não encontrada");

  let accessToken = decrypt(creds[0].accessToken);

  try {
    return await withRetry(() => apiCall(accessToken));
  } catch (error) {
    // Se o erro for 401 (Não autorizado), tenta dar refresh no token
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      console.log(`[API-RESILIENCE] Token expirado para credencial ${credentialId}. Tentando refresh...`);
      
      try {
        if (creds[0].platform === "tiktok") {
          accessToken = await TokenManager.refreshTikTokToken(credentialId);
        } else if (creds[0].platform === "facebook" || creds[0].platform === "instagram") {
          accessToken = await TokenManager.refreshMetaToken(credentialId);
        }
        
        // Tenta a chamada original novamente com o novo token
        return await withRetry(() => apiCall(accessToken));
      } catch (refreshError) {
        console.error(`[API-RESILIENCE] Falha crítica: Não foi possível renovar o token para ${credentialId}`);
        throw refreshError;
      }
    }
    
    throw error;
  }
}
