/**
 * Serviço de integração com Instagram Graph API
 */

import { apiConfigs } from './apis-config.js';

interface PublishPostParams {
  caption: string;
  imageUrl: string;
  instagramUserId: string;
}

interface PublishPostResponse {
  postId: string;
  caption: string;
  imageUrl: string;
  publishedAt: string;
}

/**
 * Publica um post no Instagram
 */
export async function publishPostToInstagram(
  params: PublishPostParams
): Promise<PublishPostResponse> {
  if (!apiConfigs.instagram.isConfigured()) {
    throw new Error(
      'Instagram não está configurado. Adicione credenciais em Settings → Secrets'
    );
  }

  const { accessToken } = apiConfigs.instagram;
  if (!accessToken) {
    throw new Error('Instagram Access Token não encontrado');
  }

  try {
    // Primeiro, criar um container de mídia
    const containerResponse = await fetch(
      `${apiConfigs.instagram.baseUrl}/${params.instagramUserId}/media`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: params.imageUrl,
          caption: params.caption,
          access_token: accessToken,
        }),
      }
    );

    if (!containerResponse.ok) {
      throw new Error(
        `Instagram API error: ${containerResponse.status} ${containerResponse.statusText}`
      );
    }

    const container = await containerResponse.json();
    const containerId = container.id;

    // Depois, publicar o container
    const publishResponse = await fetch(
      `${apiConfigs.instagram.baseUrl}/${params.instagramUserId}/media_publish`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    );

    if (!publishResponse.ok) {
      throw new Error(
        `Failed to publish to Instagram: ${publishResponse.status} ${publishResponse.statusText}`
      );
    }

    const published = await publishResponse.json();

    return {
      postId: published.id,
      caption: params.caption,
      imageUrl: params.imageUrl,
      publishedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Instagram publish error:', error);
    throw error;
  }
}

/**
 * Obtém informações do usuário Instagram
 */
export async function getInstagramUserInfo(userId: string): Promise<any> {
  if (!apiConfigs.instagram.isConfigured()) {
    throw new Error('Instagram não está configurado');
  }

  const { accessToken } = apiConfigs.instagram;
  if (!accessToken) {
    throw new Error('Instagram Access Token não encontrado');
  }

  try {
    const response = await fetch(
      `${apiConfigs.instagram.baseUrl}/${userId}?fields=id,username,name,biography,website,profile_picture_url,followers_count&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Instagram user info: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Instagram user info error:', error);
    throw error;
  }
}

/**
 * Valida se a API está disponível
 */
export async function validateInstagramConnection(): Promise<boolean> {
  try {
    if (!apiConfigs.instagram.isConfigured()) {
      return false;
    }

    // Tentar obter informações do usuário para validar
    const response = await fetch(
      `${apiConfigs.instagram.baseUrl}/me?fields=id,username&access_token=${apiConfigs.instagram.accessToken}`
    );

    return response.ok;
  } catch (error) {
    console.error('Instagram validation error:', error);
    return false;
  }
}
