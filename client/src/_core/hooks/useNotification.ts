import { toast } from "sonner";

/**
 * Hook customizado para notificações padronizadas em português
 */
export function useNotification() {
  const success = (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 4000,
      style: {
        background: "rgba(16, 185, 129, 0.1)",
        border: "1px solid rgba(16, 185, 129, 0.3)",
        color: "#fff",
      },
    });
  };

  const error = (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 5000,
      style: {
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        color: "#fff",
      },
    });
  };

  const warning = (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 4500,
      style: {
        background: "rgba(245, 158, 11, 0.1)",
        border: "1px solid rgba(245, 158, 11, 0.3)",
        color: "#fff",
      },
    });
  };

  const info = (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
      style: {
        background: "rgba(59, 130, 246, 0.1)",
        border: "1px solid rgba(59, 130, 246, 0.3)",
        color: "#fff",
      },
    });
  };

  const loading = (message: string, description?: string) => {
    return toast.loading(message, {
      description,
      style: {
        background: "rgba(107, 114, 128, 0.1)",
        border: "1px solid rgba(107, 114, 128, 0.3)",
        color: "#fff",
      },
    });
  };

  const promise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      style: {
        background: "rgba(30, 41, 59, 0.95)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        color: "#fff",
      },
    });
  };

  // Notificações específicas do domínio
  const apiError = (error: any) => {
    const message = error?.message || "Erro ao comunicar com o servidor";
    const description = error?.code
      ? `Código: ${error.code}`
      : "Tente novamente em instantes";

    toast.error(message, {
      description,
      duration: 5000,
      style: {
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        color: "#fff",
      },
    });
  };

  const validationError = (message: string = "Verifique os campos e tente novamente") => {
    toast.error("Dados inválidos", {
      description: message,
      duration: 4000,
      style: {
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        color: "#fff",
      },
    });
  };

  const authError = () => {
    toast.error("Sessão expirada", {
      description: "Faça login novamente para continuar",
      duration: 5000,
      style: {
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        color: "#fff",
      },
    });
  };

  const networkError = () => {
    toast.error("Erro de conexão", {
      description: "Verifique sua internet e tente novamente",
      duration: 5000,
      style: {
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        color: "#fff",
      },
    });
  };

  const imageGenerated = (onViewGallery?: () => void) => {
    toast.success("Imagem gerada com sucesso!", {
      description: "Sua arte foi criada e salva na galeria",
      duration: 5000,
      action: onViewGallery
        ? {
            label: "Ver na Galeria",
            onClick: onViewGallery,
          }
        : undefined,
      style: {
        background: "rgba(16, 185, 129, 0.1)",
        border: "1px solid rgba(16, 185, 129, 0.3)",
        color: "#fff",
      },
    });
  };

  const postScheduled = (scheduledFor: Date, onViewCalendar?: () => void) => {
    const dateStr = scheduledFor.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    toast.success("Post agendado!", {
      description: `Será publicado em ${dateStr}`,
      duration: 5000,
      action: onViewCalendar
        ? {
            label: "Ver Calendário",
            onClick: onViewCalendar,
          }
        : undefined,
      style: {
        background: "rgba(16, 185, 129, 0.1)",
        border: "1px solid rgba(16, 185, 129, 0.3)",
        color: "#fff",
      },
    });
  };

  const postPublished = (platform: string) => {
    toast.success(`Post publicado no ${platform}!`, {
      description: "Seu conteúdo está ao vivo",
      duration: 5000,
      style: {
        background: "rgba(16, 185, 129, 0.1)",
        border: "1px solid rgba(16, 185, 129, 0.3)",
        color: "#fff",
      },
    });
  };

  const subscriptionActivated = () => {
    toast.success("Assinatura ativada!", {
      description: "Você agora tem acesso a todos os recursos premium",
      duration: 6000,
      style: {
        background: "rgba(16, 185, 129, 0.1)",
        border: "1px solid rgba(16, 185, 129, 0.3)",
        color: "#fff",
      },
    });
  };

  const paymentSuccess = () => {
    toast.success("Pagamento confirmado!", {
      description: "Obrigado pela sua compra",
      duration: 5000,
      style: {
        background: "rgba(16, 185, 129, 0.1)",
        border: "1px solid rgba(16, 185, 129, 0.3)",
        color: "#fff",
      },
    });
  };

  const paymentError = () => {
    toast.error("Erro no pagamento", {
      description: "Verifique seus dados e tente novamente",
      duration: 5000,
      style: {
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        color: "#fff",
      },
    });
  };

  const dismiss = (toastId?: string | number) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  };

  return {
    success,
    error,
    warning,
    info,
    loading,
    promise,
    apiError,
    validationError,
    authError,
    networkError,
    imageGenerated,
    postScheduled,
    postPublished,
    subscriptionActivated,
    paymentSuccess,
    paymentError,
    dismiss,
  };
}
