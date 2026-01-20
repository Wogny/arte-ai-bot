import { Request, Response, NextFunction } from "express";
import { TRPCError } from "@trpc/server";

/**
 * Classe de erro customizada para erros da aplicação
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true,
    public code?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware de tratamento de erros global
 */
export function errorHandler(
  err: Error | AppError | TRPCError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log do erro para debugging
  console.error("❌ Erro capturado:", {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Erro operacional customizado
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Erro do TRPC
  if (err instanceof TRPCError) {
    const statusCode = getStatusCodeFromTRPCError(err);
    return res.status(statusCode).json({
      success: false,
      message: translateErrorMessage(err.message),
      code: err.code,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Erros de validação do Zod
  if (err.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Dados inválidos fornecidos",
      errors: (err as any).errors,
    });
  }

  // Erros de banco de dados
  if (err.message.includes("ECONNREFUSED") || err.message.includes("ER_")) {
    return res.status(503).json({
      success: false,
      message: "Erro de conexão com o banco de dados. Tente novamente em instantes.",
      code: "DATABASE_ERROR",
    });
  }

  // Erros de API externa
  if (err.message.includes("API") || err.message.includes("timeout")) {
    return res.status(502).json({
      success: false,
      message: "Erro ao comunicar com serviço externo. Tente novamente.",
      code: "EXTERNAL_API_ERROR",
    });
  }

  // Erro genérico não tratado
  return res.status(500).json({
    success: false,
    message: "Ocorreu um erro inesperado. Nossa equipe foi notificada.",
    code: "INTERNAL_SERVER_ERROR",
    ...(process.env.NODE_ENV === "development" && {
      originalMessage: err.message,
      stack: err.stack,
    }),
  });
}

/**
 * Converte código de erro TRPC para status HTTP
 */
function getStatusCodeFromTRPCError(err: TRPCError): number {
  const codeMap: Record<string, number> = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    TIMEOUT: 408,
    CONFLICT: 409,
    PRECONDITION_FAILED: 412,
    PAYLOAD_TOO_LARGE: 413,
    METHOD_NOT_SUPPORTED: 405,
    UNPROCESSABLE_CONTENT: 422,
    TOO_MANY_REQUESTS: 429,
    CLIENT_CLOSED_REQUEST: 499,
    INTERNAL_SERVER_ERROR: 500,
  };

  return codeMap[err.code] || 500;
}

/**
 * Traduz mensagens de erro comuns para português
 */
function translateErrorMessage(message: string): string {
  const translations: Record<string, string> = {
    "Unauthorized": "Não autorizado. Faça login para continuar.",
    "Not found": "Recurso não encontrado.",
    "Invalid credentials": "Credenciais inválidas.",
    "Token expired": "Sua sessão expirou. Faça login novamente.",
    "Forbidden": "Você não tem permissão para acessar este recurso.",
    "Too many requests": "Muitas requisições. Aguarde um momento e tente novamente.",
    "Bad request": "Requisição inválida. Verifique os dados enviados.",
    "Internal server error": "Erro interno do servidor. Tente novamente mais tarde.",
    "Service unavailable": "Serviço temporariamente indisponível.",
    "Timeout": "A requisição demorou muito tempo. Tente novamente.",
  };

  // Busca tradução exata
  if (translations[message]) {
    return translations[message];
  }

  // Busca tradução parcial
  for (const [key, value] of Object.entries(translations)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  return message;
}

/**
 * Wrapper assíncrono para rotas Express
 * Captura erros automaticamente e passa para o errorHandler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Middleware para tratar rotas não encontradas
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new AppError(
    404,
    `Rota ${req.originalUrl} não encontrada`,
    true,
    "NOT_FOUND"
  );
  next(error);
}
