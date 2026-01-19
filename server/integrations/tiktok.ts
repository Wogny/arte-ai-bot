/**
 * Serviço de integração com TikTok API
 */

import { apiConfigs } from './apis-config';

interface PublishPostParams {
  caption: string;
  videoUrl: string;
  userId: string;
}

interface PublishPostResponse {
  postId: string;
  caption: string;
  publishedAt: string;
}

/**
 * Publica um vídeo no TikTok
 */
export async function publishPostToTikTok(
  params: PublishPostParams
): Promise<PublishPostResponse> {
  if (!apiConfigs.tiktok.isConfigured()) {
    throw new Error(
      'TikTok não está configurado. Adicione credenciais em Settings → Secrets'
    );
  }

  const { clientId, clientSecret } = apiConfigs.tiktok;
  if (!clientId || !clientSecret) {
    throw new Error('TikTok Client ID ou Secret não encontrado');
  }

  try {
    // Primeiro, fazer upload do vídeo
    const uploadResponse = await fetch(
      `${apiConfigs.tiktok.baseUrl}/video/upload/init/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_info: {
            source: 'FILE_UPLOAD',
            video_size: 0, // Será calculado pelo servidor
          },
          client_key: clientId,
          client_secret: clientSecret,
        }),
      }
    );

    if (!uploadResponse.ok) {
      throw new Error(
        `TikTok upload init error: ${uploadResponse.status} ${uploadResponse.statusText}`
      );
    }

    const uploadInit = await uploadResponse.json();
    const uploadUrl = uploadInit.data.upload_url;
    const videoId = uploadInit.data.video_id;

    // Fazer upload do arquivo de vídeo
    const videoBuffer = await fetch(params.videoUrl).then((res) => res.arrayBuffer());

    const uploadFileResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
      },
      body: videoBuffer,
    });

    if (!uploadFileResponse.ok) {
      throw new Error(
        `TikTok file upload error: ${uploadFileResponse.status} ${uploadFileResponse.statusText}`
      );
    }

    // Publicar o vídeo
    const publishResponse = await fetch(
      `${apiConfigs.tiktok.baseUrl}/video/publish/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_id: videoId,
          caption: params.caption,
          privacy_level: 'PUBLIC_TO_EVERYONE',
          client_key: clientId,
          client_secret: clientSecret,
        }),
      }
    );

    if (!publishResponse.ok) {
      throw new Error(
        `TikTok publish error: ${publishResponse.status} ${publishResponse.statusText}`
      );
    }

    const published = await publishResponse.json();

    return {
      postId: published.data.video_id,
      caption: params.caption,
      publishedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('TikTok publish error:', error);
    throw error;
  }
}

/**
 * Obtém informações do usuário TikTok
 */
export async function getTikTokUserInfo(userId: string): Promise<any> {
  if (!apiConfigs.tiktok.isConfigured()) {
    throw new Error('TikTok não está configurado');
  }

  const { clientId, clientSecret } = apiConfigs.tiktok;
  if (!clientId || !clientSecret) {
    throw new Error('TikTok Client ID ou Secret não encontrado');
  }

  try {
    const response = await fetch(
      `${apiConfigs.tiktok.baseUrl}/user/info/?fields=open_id,union_id,avatar_url,display_name,bio_description,video_count,follower_count,following_count&client_key=${clientId}&client_secret=${clientSecret}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch TikTok user info: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('TikTok user info error:', error);
    throw error;
  }
}

/**
 * Valida se a API está disponível
 */
export async function validateTikTokConnection(): Promise<boolean> {
  try {
    if (!apiConfigs.tiktok.isConfigured()) {
      return false;
    }

    // Tentar obter informações do usuário para validar
    const response = await fetch(
      `${apiConfigs.tiktok.baseUrl}/user/info/?client_key=${apiConfigs.tiktok.clientId}&client_secret=${apiConfigs.tiktok.clientSecret}`
    );

    return response.ok;
  } catch (error) {
    console.error('TikTok validation error:', error);
    return false;
  }
}
