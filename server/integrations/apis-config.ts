/**
 * Configuração centralizada de todas as APIs externas
 * As credenciais são injetadas via variáveis de ambiente
 */

export const apiConfigs = {
  // Stable Diffusion (Replicate)
  stableDiffusion: {
    provider: process.env.STABLE_DIFFUSION_PROVIDER || 'replicate', // 'replicate' ou 'huggingface'
    replicateToken: process.env.REPLICATE_API_TOKEN,
    huggingfaceToken: process.env.HUGGINGFACE_API_KEY,
    baseUrl: 'https://api.replicate.com/v1',
    isConfigured: () => {
      const provider = process.env.STABLE_DIFFUSION_PROVIDER || 'replicate';
      if (provider === 'replicate') {
        return !!process.env.REPLICATE_API_TOKEN;
      }
      return !!process.env.HUGGINGFACE_API_KEY;
    },
  },

  // Instagram Graph API
  instagram: {
    appId: process.env.INSTAGRAM_APP_ID,
    appSecret: process.env.INSTAGRAM_APP_SECRET,
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
    baseUrl: 'https://graph.instagram.com/v18.0',
    isConfigured: () => {
      return !!(
        process.env.INSTAGRAM_APP_ID &&
        process.env.INSTAGRAM_APP_SECRET &&
        process.env.INSTAGRAM_ACCESS_TOKEN
      );
    },
  },

  // Facebook Graph API
  facebook: {
    appId: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET,
    pageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
    baseUrl: 'https://graph.facebook.com/v18.0',
    isConfigured: () => {
      return !!(
        process.env.FACEBOOK_APP_ID &&
        process.env.FACEBOOK_APP_SECRET &&
        process.env.FACEBOOK_PAGE_ACCESS_TOKEN
      );
    },
  },

  // TikTok API
  tiktok: {
    clientId: process.env.TIKTOK_CLIENT_ID,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET,
    baseUrl: 'https://open.tiktokapis.com/v1',
    isConfigured: () => {
      return !!(
        process.env.TIKTOK_CLIENT_ID &&
        process.env.TIKTOK_CLIENT_SECRET
      );
    },
  },
};

/**
 * Valida se todas as APIs críticas estão configuradas
 */
export function validateApiConfiguration() {
  const configs = {
    stableDiffusion: apiConfigs.stableDiffusion.isConfigured(),
    instagram: apiConfigs.instagram.isConfigured(),
    facebook: apiConfigs.facebook.isConfigured(),
    tiktok: apiConfigs.tiktok.isConfigured(),
  };

  const missing = Object.entries(configs)
    .filter(([_, configured]) => !configured)
    .map(([name]) => name);

  return {
    allConfigured: missing.length === 0,
    configured: configs,
    missing,
  };
}

/**
 * Retorna um resumo das APIs configuradas
 */
export function getApiStatus() {
  const validation = validateApiConfiguration();
  
  return {
    timestamp: new Date().toISOString(),
    ...validation,
    details: {
      stableDiffusion: {
        provider: process.env.STABLE_DIFFUSION_PROVIDER || 'replicate',
        configured: validation.configured.stableDiffusion,
      },
      instagram: {
        configured: validation.configured.instagram,
        hasAppId: !!process.env.INSTAGRAM_APP_ID,
      },
      facebook: {
        configured: validation.configured.facebook,
        hasAppId: !!process.env.FACEBOOK_APP_ID,
      },
      tiktok: {
        configured: validation.configured.tiktok,
        hasClientId: !!process.env.TIKTOK_CLIENT_ID,
      },
    },
  };
}
