import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

/**
 * Configuração de retry
 */
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableStatuses: number[];
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Cliente HTTP com retry automático e tratamento de erros
 */
class ApiClient {
  private client: AxiosInstance;
  private retryConfig: RetryConfig;

  constructor(baseURL: string = "/api", retryConfig: Partial<RetryConfig> = {}) {
    this.retryConfig = { ...defaultRetryConfig, ...retryConfig };

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - adiciona token de autenticação
    this.client.interceptors.request.use(
      (config) => {
        // Token pode ser adicionado aqui se necessário
        // const token = localStorage.getItem('token');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - trata erros e retry
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as AxiosRequestConfig & { _retryCount?: number };

        // Verifica se deve fazer retry
        if (this.shouldRetry(error, config)) {
          config._retryCount = config._retryCount || 0;
          config._retryCount += 1;

          // Calcula delay com backoff exponencial
          const delay = this.retryConfig.retryDelay * Math.pow(2, config._retryCount - 1);

          console.log(
            `⚠️ Retentando requisição (${config._retryCount}/${this.retryConfig.maxRetries}) em ${delay}ms...`
          );

          await this.sleep(delay);

          return this.client.request(config);
        }

        // Trata erro e retorna mensagem amigável
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private shouldRetry(error: AxiosError, config: AxiosRequestConfig & { _retryCount?: number }): boolean {
    const retryCount = config._retryCount || 0;

    // Não retenta se já atingiu o máximo
    if (retryCount >= this.retryConfig.maxRetries) {
      return false;
    }

    // Não retenta métodos não-idempotentes por padrão
    if (config.method && !["get", "head", "options", "put", "delete"].includes(config.method.toLowerCase())) {
      return false;
    }

    // Retenta em erros de rede
    if (!error.response) {
      return true;
    }

    // Retenta em status codes específicos
    return this.retryConfig.retryableStatuses.includes(error.response.status);
  }

  private handleError(error: AxiosError): Error {
    if (error.response) {
      // Erro com resposta do servidor
      const status = error.response.status;
      const data = error.response.data as any;

      const errorMessage = data?.message || this.getDefaultErrorMessage(status);

      const enhancedError = new Error(errorMessage);
      (enhancedError as any).status = status;
      (enhancedError as any).code = data?.code;
      (enhancedError as any).originalError = error;

      return enhancedError;
    } else if (error.request) {
      // Erro de rede (sem resposta)
      const networkError = new Error("Erro de conexão. Verifique sua internet e tente novamente.");
      (networkError as any).code = "NETWORK_ERROR";
      (networkError as any).originalError = error;
      return networkError;
    } else {
      // Erro na configuração da requisição
      return error;
    }
  }

  private getDefaultErrorMessage(status: number): string {
    const messages: Record<number, string> = {
      400: "Requisição inválida. Verifique os dados enviados.",
      401: "Não autorizado. Faça login para continuar.",
      403: "Você não tem permissão para acessar este recurso.",
      404: "Recurso não encontrado.",
      408: "A requisição demorou muito tempo. Tente novamente.",
      409: "Conflito. O recurso já existe ou está em uso.",
      422: "Dados inválidos. Verifique os campos e tente novamente.",
      429: "Muitas requisições. Aguarde um momento e tente novamente.",
      500: "Erro interno do servidor. Tente novamente mais tarde.",
      502: "Erro ao comunicar com o servidor. Tente novamente.",
      503: "Serviço temporariamente indisponível. Tente novamente em instantes.",
      504: "Tempo limite excedido. Tente novamente.",
    };

    return messages[status] || "Ocorreu um erro inesperado. Tente novamente.";
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Métodos públicos
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Upload de arquivo com progresso
  async upload<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await this.client.post<T>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  // Download de arquivo
  async download(url: string, filename?: string): Promise<void> {
    const response = await this.client.get(url, {
      responseType: "blob",
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // Cancelar requisições pendentes
  cancelPendingRequests() {
    // Implementar se necessário com AbortController
  }
}

// Instância global do cliente
export const apiClient = new ApiClient();

// Export da classe para criar instâncias customizadas
export default ApiClient;
