/**
 * Configurações para retry automático
 */
export interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Erros que devem ser retentados automaticamente
 */
const DEFAULT_RETRYABLE_ERRORS = [
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "ECONNRESET",
  "EPIPE",
  "EHOSTUNREACH",
  "EAI_AGAIN",
  "RATE_LIMIT",
  "TIMEOUT",
  "SERVICE_UNAVAILABLE",
  "TOO_MANY_REQUESTS",
];

/**
 * Implementa retry com backoff exponencial
 * @param fn Função assíncrona a ser executada
 * @param config Configurações de retry
 * @returns Resultado da função ou erro após todas as tentativas
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryableErrors = DEFAULT_RETRYABLE_ERRORS,
    onRetry,
  } = config;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Verifica se o erro é retentável
      const isRetryable = retryableErrors.some(
        (retryableError) =>
          lastError.message.includes(retryableError) ||
          (lastError as any).code === retryableError
      );

      // Se não é retentável ou é a última tentativa, lança o erro
      if (!isRetryable || attempt === maxAttempts) {
        console.error(`❌ Falha após ${attempt} tentativa(s):`, lastError.message);
        throw lastError;
      }

      // Calcula delay com jitter para evitar thundering herd
      const jitter = Math.random() * 0.3 * delay; // 30% de variação
      const currentDelay = Math.min(delay + jitter, maxDelay);

      console.warn(
        `⚠️ Tentativa ${attempt}/${maxAttempts} falhou. Retentando em ${Math.round(currentDelay)}ms...`,
        { error: lastError.message }
      );

      // Callback opcional para notificar sobre retry
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Aguarda antes de tentar novamente
      await sleep(currentDelay);

      // Aumenta o delay para próxima tentativa (backoff exponencial)
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError!;
}

/**
 * Wrapper para funções de API externa com retry automático
 */
export async function apiCallWithRetry<T>(
  apiCall: () => Promise<T>,
  apiName: string = "API"
): Promise<T> {
  return withRetry(apiCall, {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    onRetry: (attempt, error) => {
      console.log(`🔄 Retentando chamada para ${apiName} (tentativa ${attempt})`, {
        error: error.message,
      });
    },
  });
}

/**
 * Wrapper para operações de banco de dados com retry
 */
export async function dbOperationWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string = "Database Operation"
): Promise<T> {
  return withRetry(operation, {
    maxAttempts: 5,
    initialDelay: 500,
    maxDelay: 3000,
    retryableErrors: [
      ...DEFAULT_RETRYABLE_ERRORS,
      "ER_LOCK_DEADLOCK",
      "ER_LOCK_WAIT_TIMEOUT",
      "PROTOCOL_CONNECTION_LOST",
    ],
    onRetry: (attempt, error) => {
      console.log(`🔄 Retentando operação de banco: ${operationName} (tentativa ${attempt})`, {
        error: error.message,
      });
    },
  });
}

/**
 * Circuit breaker simples para prevenir cascata de falhas
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private resetTimeout: number = 30000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.resetTimeout) {
        console.log("🔄 Circuit breaker: tentando reabrir (HALF_OPEN)");
        this.state = "HALF_OPEN";
      } else {
        throw new Error(
          `Circuit breaker está ABERTO. Serviço temporariamente indisponível. Tente novamente em ${Math.round((this.resetTimeout - (now - this.lastFailureTime)) / 1000)}s`
        );
      }
    }

    try {
      const result = await fn();

      // Sucesso: reseta contador se estava em HALF_OPEN
      if (this.state === "HALF_OPEN") {
        console.log("✅ Circuit breaker: serviço recuperado (CLOSED)");
        this.reset();
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      console.error(
        `🚨 Circuit breaker: limite de falhas atingido (${this.failureCount}). Abrindo circuito.`
      );
      this.state = "OPEN";
    }
  }

  private reset() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

/**
 * Helper para aguardar
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Timeout wrapper - cancela operação se demorar muito
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = "Operação excedeu o tempo limite"
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`TIMEOUT: ${errorMessage}`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle!);
  }
}
