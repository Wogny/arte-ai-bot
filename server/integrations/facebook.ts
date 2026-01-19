/**
 * Serviço de integração com Facebook Graph API
 */

import { apiConfigs } from './apis-config';

interface PublishPostParams {
  message: string;
  imageUrl?: string;
  pageId: string;
}

interface PublishPostResponse {
  postId: string;
  message: string;
  publishedAt: string;
}

/**
 * Publica um post no Facebook
 */
export async function publishPostToFacebook(
  params: PublishPostParams
): Promise<PublishPostResponse> {
  if (!apiConfigs.facebook.isConfigured()) {
    throw new Error(
      'Facebook não está configurado. Adicione credenciais em Settings → Secrets'
    );
  }

  const { pageAccessToken } = apiConfigs.facebook;
  if (!pageAccessToken) {
    throw new Error('Facebook Page Access Token não encontrado');
  }

  try {
    const body: any = {
      message: params.message,
      access_token: pageAccessToken,
    };

    if (params.imageUrl) {
      body.picture = params.imageUrl;
      body.link = params.imageUrl;
    }

    const response = await fetch(
      `${apiConfigs.facebook.baseUrl}/${params.pageId}/feed`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Facebook API error: ${response.status} ${response.statusText}`
      );
    }

    const published = await response.json();

    return {
      postId: published.id,
      message: params.message,
      publishedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Facebook publish error:', error);
    throw error;
  }
}

/**
 * Obtém informações da página Facebook
 */
export async function getFacebookPageInfo(pageId: string): Promise<any> {
  if (!apiConfigs.facebook.isConfigured()) {
    throw new Error('Facebook não está configurado');
  }

  const { pageAccessToken } = apiConfigs.facebook;
  if (!pageAccessToken) {
    throw new Error('Facebook Page Access Token não encontrado');
  }

  try {
    const response = await fetch(
      `${apiConfigs.facebook.baseUrl}/${pageId}?fields=id,name,about,picture,followers_count,fan_count&access_token=${pageAccessToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Facebook page info: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Facebook page info error:', error);
    throw error;
  }
}

/**
 * Valida se a API está disponível
 */
export async function validateFacebookConnection(): Promise<boolean> {
  try {
    if (!apiConfigs.facebook.isConfigured()) {
      return false;
    }

    // Tentar obter informações do usuário para validar
    const response = await fetch(
      `${apiConfigs.facebook.baseUrl}/me?fields=id,name&access_token=${apiConfigs.facebook.pageAccessToken}`
    );

    return response.ok;
  } catch (error) {
    console.error('Facebook validation error:', error);
    return false;
  }
}
