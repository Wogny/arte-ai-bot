import axios from "axios";

/**
 * Mapeia erros técnicos de APIs para mensagens amigáveis ao usuário
 */
export function getFriendlyErrorMessage(error: any, platform: string): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
  }

  const status = error.response?.status;
  const data = error.response?.data;

  // Erros comuns de Rate Limiting
  if (status === 429) {
    return `Limite de requisições atingido no ${platform}. Por favor, aguarde alguns minutos antes de tentar novamente.`;
  }

  // Erros específicos por plataforma
  switch (platform.toLowerCase()) {
    case "instagram":
    case "facebook":
      return handleMetaError(data, status);
    case "tiktok":
      return handleTikTokError(data, status);
    case "whatsapp":
      return handleWhatsAppError(data, status);
    default:
      return `Erro no ${platform}: ${status || "Sem conexão"}.`;
  }
}

function handleMetaError(data: any, status?: number): string {
  const code = data?.error?.code;
  const subcode = data?.error?.error_subcode;

  if (code === 190) return "Sua conexão com o Facebook/Instagram expirou. Por favor, reconecte sua conta.";
  if (code === 368) return "Ação bloqueada temporariamente pelo Facebook por suspeita de spam.";
  if (subcode === 2207027) return "A imagem enviada não atende aos requisitos de proporção do Instagram (use 1:1 ou 4:5).";
  if (code === 10) return "Permissões insuficientes. Verifique se você autorizou a publicação de conteúdo.";
  
  return data?.error?.message || "Erro na API da Meta.";
}

function handleTikTokError(data: any, status?: number): string {
  const errorCode = data?.data?.error_code;
  if (errorCode === 10006) return "Token do TikTok inválido ou expirado.";
  if (errorCode === 40007) return "O vídeo enviado é muito curto ou inválido para o TikTok.";
  
  return data?.data?.description || "Erro na API do TikTok.";
}

function handleWhatsAppError(data: any, status?: number): string {
  const code = data?.error?.code;
  if (code === 131030) return "Número de telefone do destinatário é inválido.";
  if (code === 131026) return "Mensagem não enviada: O destinatário não recebeu mensagens deste número nas últimas 24 horas.";
  
  return data?.error?.message || "Erro na API do WhatsApp.";
}
