import { CronJob } from "cron";
import * as db from "../db";
import { notifyOwner } from "../_core/notification";

// Status de publicação
type PublishStatus = "success" | "failed" | "pending";

interface PublishResult {
  status: PublishStatus;
  platform: string;
  postId?: string;
  error?: string;
}

// Função para publicar no Instagram via Graph API
async function publishToInstagram(
  accessToken: string,
  imageUrl: string,
  caption: string,
  accountId: string
): Promise<PublishResult> {
  try {
    // Step 1: Create media container
    const createMediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption,
          access_token: accessToken,
        }),
      }
    );

    const mediaData = await createMediaResponse.json();
    
    if (mediaData.error) {
      return {
        status: "failed",
        platform: "instagram",
        error: mediaData.error.message,
      };
    }

    const containerId = mediaData.id;

    // Step 2: Publish the container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    );

    const publishData = await publishResponse.json();

    if (publishData.error) {
      return {
        status: "failed",
        platform: "instagram",
        error: publishData.error.message,
      };
    }

    return {
      status: "success",
      platform: "instagram",
      postId: publishData.id,
    };
  } catch (error) {
    return {
      status: "failed",
      platform: "instagram",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Função para publicar no Facebook via Graph API
async function publishToFacebook(
  accessToken: string,
  imageUrl: string,
  caption: string,
  pageId: string
): Promise<PublishResult> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/photos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: imageUrl,
          caption: caption,
          access_token: accessToken,
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return {
        status: "failed",
        platform: "facebook",
        error: data.error.message,
      };
    }

    return {
      status: "success",
      platform: "facebook",
      postId: data.post_id || data.id,
    };
  } catch (error) {
    return {
      status: "failed",
      platform: "facebook",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Função para publicar no TikTok (via API oficial)
async function publishToTikTok(
  accessToken: string,
  videoUrl: string,
  caption: string
): Promise<PublishResult> {
  try {
    // TikTok Content Posting API
    // Note: TikTok requires video content, not images
    const response = await fetch(
      "https://open.tiktokapis.com/v2/post/publish/video/init/",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_info: {
            title: caption.substring(0, 150), // TikTok title limit
            privacy_level: "PUBLIC_TO_EVERYONE",
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
          },
          source_info: {
            source: "PULL_FROM_URL",
            video_url: videoUrl,
          },
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return {
        status: "failed",
        platform: "tiktok",
        error: data.error.message || "TikTok API error",
      };
    }

    return {
      status: "success",
      platform: "tiktok",
      postId: data.data?.publish_id,
    };
  } catch (error) {
    return {
      status: "failed",
      platform: "tiktok",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Processar um post agendado
async function processScheduledPost(post: any): Promise<void> {
  console.log(`[PostScheduler] Processing post ${post.id} for platform ${post.platform}`);

  const results: PublishResult[] = [];

  try {
    // Buscar credenciais do usuário
    const connections = await db.getUserSocialConnections(post.userId);
    
    // Buscar URL da imagem/vídeo
    let mediaUrl = "";
    if (post.imageId) {
      const image = await db.getImageById(post.imageId, post.userId);
      mediaUrl = image?.imageUrl || "";
    } else if (post.mediaId) {
      const media = await db.getMediaById(post.mediaId, post.userId);
      mediaUrl = media?.imageUrl || media?.videoUrl || "";
    } else if (post.videoUrl) {
      mediaUrl = post.videoUrl;
    }

    if (!mediaUrl) {
      await db.updatePostStatus(post.id, post.userId, "failed", "Mídia não encontrada");
      return;
    }

    const caption = post.caption || "";

    // Publicar em cada plataforma
    if (post.platform === "instagram" || post.platform === "both" || post.platform === "all") {
      const instagramConnection = connections.find(c => c.platform === "instagram");
      if (instagramConnection) {
        const result = await publishToInstagram(
          instagramConnection.accessToken,
          mediaUrl,
          caption,
          instagramConnection.accountId
        );
        results.push(result);
        
        if (result.status === "success" && result.postId) {
          await db.updateScheduledPostPlatformId(post.id, "instagram", result.postId);
        }
      } else {
        results.push({
          status: "failed",
          platform: "instagram",
          error: "Conta do Instagram não conectada",
        });
      }
    }

    if (post.platform === "facebook" || post.platform === "both" || post.platform === "all") {
      const facebookConnection = connections.find(c => c.platform === "facebook");
      if (facebookConnection) {
        const result = await publishToFacebook(
          facebookConnection.accessToken,
          mediaUrl,
          caption,
          facebookConnection.accountId
        );
        results.push(result);
        
        if (result.status === "success" && result.postId) {
          await db.updateScheduledPostPlatformId(post.id, "facebook", result.postId);
        }
      } else {
        results.push({
          status: "failed",
          platform: "facebook",
          error: "Página do Facebook não conectada",
        });
      }
    }

    if (post.platform === "tiktok" || post.platform === "all") {
      const tiktokConnection = connections.find(c => c.platform === "tiktok");
      if (tiktokConnection && post.videoUrl) {
        const result = await publishToTikTok(
          tiktokConnection.accessToken,
          post.videoUrl,
          caption
        );
        results.push(result);
        
        if (result.status === "success" && result.postId) {
          await db.updateScheduledPostPlatformId(post.id, "tiktok", result.postId);
        }
      } else if (!post.videoUrl) {
        results.push({
          status: "failed",
          platform: "tiktok",
          error: "TikTok requer conteúdo em vídeo",
        });
      } else {
        results.push({
          status: "failed",
          platform: "tiktok",
          error: "Conta do TikTok não conectada",
        });
      }
    }

    // Verificar resultados
    const allSuccess = results.every(r => r.status === "success");
    const anySuccess = results.some(r => r.status === "success");
    const errors = results.filter(r => r.status === "failed").map(r => `${r.platform}: ${r.error}`);

    if (allSuccess) {
      await db.updatePostStatus(post.id, post.userId, "published");
      await notifyOwner({
        title: "Post Publicado com Sucesso! 🎉",
        content: `Seu post foi publicado em ${results.map(r => r.platform).join(", ")}.`,
      });
    } else if (anySuccess) {
      await db.updatePostStatus(post.id, post.userId, "published", `Parcialmente publicado. Erros: ${errors.join("; ")}`);
      await notifyOwner({
        title: "Post Parcialmente Publicado ⚠️",
        content: `Publicado em algumas plataformas. Erros: ${errors.join("; ")}`,
      });
    } else {
      const retryCount = post.retryCount || 0;
      if (retryCount < 3) {
        // Agendar retry
        await db.incrementPostRetryCount(post.id, post.userId);
        console.log(`[PostScheduler] Post ${post.id} failed, will retry (attempt ${retryCount + 1}/3)`);
      } else {
        await db.updatePostStatus(post.id, post.userId, "failed", errors.join("; "));
        await notifyOwner({
          title: "Falha na Publicação ❌",
          content: `Não foi possível publicar após 3 tentativas. Erros: ${errors.join("; ")}`,
        });
      }
    }
  } catch (error) {
    console.error(`[PostScheduler] Error processing post ${post.id}:`, error);
    await db.updatePostStatus(
      post.id, 
      post.userId, 
      "failed", 
      error instanceof Error ? error.message : "Erro desconhecido"
    );
  }
}

// Job principal que roda a cada minuto
async function checkAndPublishPosts(): Promise<void> {
  console.log("[PostScheduler] Checking for posts to publish...");

  try {
    // Buscar posts agendados para agora ou no passado que ainda não foram publicados
    const pendingPosts = await db.getPendingScheduledPosts();

    if (pendingPosts.length === 0) {
      console.log("[PostScheduler] No pending posts to publish");
      return;
    }

    console.log(`[PostScheduler] Found ${pendingPosts.length} posts to publish`);

    // Processar cada post
    for (const post of pendingPosts) {
      await processScheduledPost(post);
    }
  } catch (error) {
    console.error("[PostScheduler] Error checking posts:", error);
  }
}

// Inicializar o scheduler
let schedulerJob: CronJob | null = null;

export function startPostScheduler(): void {
  if (schedulerJob) {
    console.log("[PostScheduler] Scheduler already running");
    return;
  }

  // Rodar a cada minuto
  schedulerJob = new CronJob(
    "* * * * *", // Every minute
    checkAndPublishPosts,
    null,
    true,
    "America/Sao_Paulo"
  );

  console.log("[PostScheduler] Post scheduler started - checking every minute");
}

export function stopPostScheduler(): void {
  if (schedulerJob) {
    schedulerJob.stop();
    schedulerJob = null;
    console.log("[PostScheduler] Post scheduler stopped");
  }
}

// Exportar para uso manual/teste
export { checkAndPublishPosts, processScheduledPost };
