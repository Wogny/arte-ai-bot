import { CronJob } from "cron";
import { getDb } from "./db";
import { scheduledPosts, platformCredentials, generatedImages } from '../drizzle/schema.js';
import { eq, and, lte } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { callPlatformApi } from "./_core/apiResilience";
import { FacebookInstagramIntegration, TikTokIntegration, WhatsAppIntegration } from "./platformIntegrations";
import { ENV } from "./_core/env";
import { getFriendlyErrorMessage } from "./_core/apiErrors";

interface ExecutionLog {
  postId: number;
  platform: string;
  status: "success" | "failed" | "pending";
  message: string;
  timestamp: Date;
  retryCount: number;
}

class PostExecutor {
  private executionLogs: ExecutionLog[] = [];
  private cronJob: CronJob | null = null;
  private isRunning = false;
  private maxRetries = 3;

  /**
   * Inicia o executor de postagens
   * Verifica a cada minuto se há postagens para executar
   */
  start() {
    if (this.cronJob) {
      console.log("[PostExecutor] Executor já está rodando");
      return;
    }

    // Executa a cada minuto
    this.cronJob = new CronJob("* * * * *", async () => {
      if (!this.isRunning) {
        await this.executeScheduledPosts();
      }
    });

    this.cronJob.start();
    console.log("[PostExecutor] Executor iniciado - verificando a cada minuto");
  }

  /**
   * Para o executor de postagens
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log("[PostExecutor] Executor parado");
    }
  }

  /**
   * Executa postagens agendadas que chegaram ao horário
   */
  private async executeScheduledPosts() {
    this.isRunning = true;

    try {
      const db = await getDb();
      if (!db) {
        console.error("[PostExecutor] Banco de dados não disponível");
        this.isRunning = false;
        return;
      }

      const now = new Date();

      // Busca posts agendados para agora
      const postsToExecute = await db
        .select()
        .from(scheduledPosts)
        .where(
          and(
            eq(scheduledPosts.status, "scheduled"),
            lte(scheduledPosts.scheduledFor, now)
          )
        );

      if (postsToExecute.length === 0) {
        this.isRunning = false;
        return;
      }

      console.log(
        `[PostExecutor] Encontrados ${postsToExecute.length} posts para executar`
      );

      // Executa cada post
      for (const post of postsToExecute) {
        await this.executePost(post, db);
      }
    } catch (error) {
      console.error("[PostExecutor] Erro ao executar posts:", error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Executa um post individual
   */
  private async executePost(post: any, db: any) {
    try {
      console.log(
        `[PostExecutor] Executando post ${post.id} para ${post.platform}`
      );

      let success = false;
      let message = "";

      // Executa baseado na plataforma
      switch (post.platform) {
        case "facebook":
          ({ success, message } = await this.publishToFacebook(post));
          break;
        case "instagram":
          ({ success, message } = await this.publishToInstagram(post));
          break;
        case "tiktok":
          ({ success, message } = await this.publishToTikTok(post));
          break;
        case "whatsapp":
          ({ success, message } = await this.sendViaWhatsApp(post));
          break;
        default:
          message = `Plataforma desconhecida: ${post.platform}`;
      }

      // Atualiza status
      if (success) {
        await db
          .update(scheduledPosts)
          .set({
            status: "published",
            publishedAt: new Date(),
            errorMessage: null,
          })
          .where(eq(scheduledPosts.id, post.id));

        this.logExecution({
          postId: post.id,
          platform: post.platform,
          status: "success",
          message: `Post publicado com sucesso: ${message}`,
          timestamp: new Date(),
          retryCount: post.retryCount || 0,
        });

        // Notifica sucesso
        await notifyOwner({
          title: "Post Publicado com Sucesso",
          content: `Seu post foi publicado em ${post.platform} com sucesso!`,
        });
      } else {
        // Tenta retry
        const retryCount = (post.retryCount || 0) + 1;

        if (retryCount < this.maxRetries) {
          // Agenda retry para 5 minutos depois
          const nextRetry = new Date(Date.now() + 5 * 60 * 1000);

          await db
            .update(scheduledPosts)
            .set({
              retryCount,
              scheduledFor: nextRetry,
              errorMessage: message,
            })
            .where(eq(scheduledPosts.id, post.id));

          this.logExecution({
            postId: post.id,
            platform: post.platform,
            status: "pending",
            message: `Retry ${retryCount}/${this.maxRetries}: ${message}`,
            timestamp: new Date(),
            retryCount,
          });
        } else {
          // Falha permanente
          await db
            .update(scheduledPosts)
            .set({
              status: "failed",
              errorMessage: message,
              retryCount,
            })
            .where(eq(scheduledPosts.id, post.id));

          this.logExecution({
            postId: post.id,
            platform: post.platform,
            status: "failed",
            message: `Falha permanente após ${retryCount} tentativas: ${message}`,
            timestamp: new Date(),
            retryCount,
          });

          // Notifica falha
          await notifyOwner({
            title: "Erro ao Publicar Post",
            content: `Falha ao publicar post em ${post.platform} após ${retryCount} tentativas. Erro: ${message}`,
          });
        }
      }
    } catch (error) {
      console.error(`[PostExecutor] Erro ao executar post ${post.id}:`, error);

      this.logExecution({
        postId: post.id,
        platform: post.platform,
        status: "failed",
        message: `Erro interno: ${error instanceof Error ? error.message : "Desconhecido"}`,
        timestamp: new Date(),
        retryCount: post.retryCount || 0,
      });
    }
  }

  /**
   * Publica em Facebook
   */
  private async publishToFacebook(post: any): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const db = await getDb();
      if (!db) throw new Error("DB indisponível");

      // Busca credencial ativa para Facebook
      const creds = await db.select().from(platformCredentials).where(
        and(eq(platformCredentials.userId, post.userId), eq(platformCredentials.platform, "facebook"), eq(platformCredentials.isActive, true))
      ).limit(1);

      if (!creds.length) throw new Error("Credencial Facebook não encontrada ou inativa");

      // Busca URL da imagem
      const image = await db.select().from(generatedImages).where(eq(generatedImages.id, post.imageId)).limit(1);
      const imageUrl = image[0]?.imageUrl;

      const fb = new FacebookInstagramIntegration(ENV.appId, "SECRET", "REDIRECT");
      
      const result = await callPlatformApi(creds[0].id, (token) => 
        fb.publishToFacebook(token, creds[0].accountId, post.caption || "", imageUrl)
      );

      return {
        success: true,
        message: `Publicado em Facebook: ${result.postId}`,
      };
    } catch (error) {
      return {
        success: false,
        message: getFriendlyErrorMessage(error, "Facebook"),
      };
    }
  }

  /**
   * Publica em Instagram
   */
  private async publishToInstagram(post: any): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const db = await getDb();
      if (!db) throw new Error("DB indisponível");

      const creds = await db.select().from(platformCredentials).where(
        and(eq(platformCredentials.userId, post.userId), eq(platformCredentials.platform, "instagram"), eq(platformCredentials.isActive, true))
      ).limit(1);

      if (!creds.length) throw new Error("Credencial Instagram não encontrada ou inativa");

      const image = await db.select().from(generatedImages).where(eq(generatedImages.id, post.imageId)).limit(1);
      if (!image[0]?.imageUrl) throw new Error("Imagem não encontrada");

      const ig = new FacebookInstagramIntegration(ENV.appId, "SECRET", "REDIRECT");
      
      const result = await callPlatformApi(creds[0].id, (token) => 
        ig.publishPhoto(token, image[0].imageUrl, post.caption || "")
      );

      return {
        success: true,
        message: `Publicado em Instagram: ${result.mediaId}`,
      };
    } catch (error) {
      return {
        success: false,
        message: getFriendlyErrorMessage(error, "Instagram"),
      };
    }
  }

  /**
   * Publica em TikTok
   */
  private async publishToTikTok(post: any): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const db = await getDb();
      if (!db) throw new Error("DB indisponível");

      const creds = await db.select().from(platformCredentials).where(
        and(eq(platformCredentials.userId, post.userId), eq(platformCredentials.platform, "tiktok"), eq(platformCredentials.isActive, true))
      ).limit(1);

      if (!creds.length) throw new Error("Credencial TikTok não encontrada ou inativa");

      const image = await db.select().from(generatedImages).where(eq(generatedImages.id, post.imageId)).limit(1);
      if (!image[0]?.imageUrl) throw new Error("Imagem não encontrada");

      const tt = new TikTokIntegration("CLIENT_KEY", "CLIENT_SECRET", "REDIRECT");
      
      const result = await callPlatformApi(creds[0].id, (token) => 
        tt.publishVideo(token, image[0].imageUrl, post.caption || "")
      );

      return {
        success: true,
        message: `Publicado em TikTok: ${result.videoId}`,
      };
    } catch (error) {
      return {
        success: false,
        message: getFriendlyErrorMessage(error, "TikTok"),
      };
    }
  }

  /**
   * Envia via WhatsApp
   */
  private async sendViaWhatsApp(post: any): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const db = await getDb();
      if (!db) throw new Error("DB indisponível");

      const creds = await db.select().from(platformCredentials).where(
        and(eq(platformCredentials.userId, post.userId), eq(platformCredentials.platform, "whatsapp"), eq(platformCredentials.isActive, true))
      ).limit(1);

      if (!creds.length) throw new Error("Credencial WhatsApp não encontrada ou inativa");

      const image = await db.select().from(generatedImages).where(eq(generatedImages.id, post.imageId)).limit(1);
      
      const wa = new WhatsAppIntegration(creds[0].accountId, "TOKEN", "BUSINESS_ID");
      
      let result;
      if (image[0]?.imageUrl) {
        result = await callPlatformApi(creds[0].id, (token) => 
          wa.sendImage("RECIPIENT", image[0].imageUrl, post.caption || "")
        );
      } else {
        result = await callPlatformApi(creds[0].id, (token) => 
          wa.sendMessage("RECIPIENT", post.caption || "")
        );
      }

      return {
        success: true,
        message: `Enviado via WhatsApp: ${result.messageId}`,
      };
    } catch (error) {
      return {
        success: false,
        message: getFriendlyErrorMessage(error, "WhatsApp"),
      };
    }
  }

  /**
   * Registra execução no histórico
   */
  private logExecution(log: ExecutionLog) {
    this.executionLogs.push(log);

    // Mantém apenas os últimos 1000 logs em memória
    if (this.executionLogs.length > 1000) {
      this.executionLogs = this.executionLogs.slice(-1000);
    }

    console.log(
      `[PostExecutor] ${log.status.toUpperCase()} - Post ${log.postId} (${log.platform}): ${log.message}`
    );
  }

  /**
   * Retorna histórico de execuções
   */
  getExecutionHistory(limit: number = 100): ExecutionLog[] {
    return this.executionLogs.slice(-limit);
  }

  /**
   * Retorna estatísticas de execução
   */
  getStats() {
    const total = this.executionLogs.length;
    const successful = this.executionLogs.filter(
      (l) => l.status === "success"
    ).length;
    const failed = this.executionLogs.filter((l) => l.status === "failed").length;
    const pending = this.executionLogs.filter(
      (l) => l.status === "pending"
    ).length;

    return {
      total,
      successful,
      failed,
      pending,
      successRate: total > 0 ? ((successful / total) * 100).toFixed(2) : "0",
    };
  }
}

// Instância global do executor
export const postExecutor = new PostExecutor();

// Inicia automaticamente quando o servidor inicia
export function initializePostExecutor() {
  postExecutor.start();
}

// Para quando o servidor desliga
export function stopPostExecutor() {
  postExecutor.stop();
}
