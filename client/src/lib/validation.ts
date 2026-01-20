import { z } from "zod";

/**
 * Mensagens de erro customizadas em português
 */
const errorMessages = {
  required: "Este campo é obrigatório",
  invalidEmail: "Email inválido",
  invalidUrl: "URL inválida",
  tooShort: (min: number) => `Mínimo de ${min} caracteres`,
  tooLong: (max: number) => `Máximo de ${max} caracteres`,
  invalidPassword: "A senha deve ter pelo menos 8 caracteres, incluindo letras e números",
  passwordMismatch: "As senhas não coincidem",
  invalidPhone: "Telefone inválido",
  invalidDate: "Data inválida",
  futureDateRequired: "A data deve ser futura",
  pastDateRequired: "A data deve ser passada",
  minValue: (min: number) => `Valor mínimo: ${min}`,
  maxValue: (max: number) => `Valor máximo: ${max}`,
  invalidFormat: "Formato inválido",
};

/**
 * Configuração padrão do Zod em português
 */
export const zodConfig = {
  errorMap: (issue: z.ZodIssueOptionalMessage, ctx: z.ErrorMapCtx) => {
    if (issue.code === z.ZodIssueCode.invalid_type) {
      if (issue.expected === "string") {
        return { message: "Texto esperado" };
      }
      if (issue.expected === "number") {
        return { message: "Número esperado" };
      }
      if (issue.expected === "boolean") {
        return { message: "Valor verdadeiro/falso esperado" };
      }
    }

    if (issue.code === z.ZodIssueCode.too_small) {
      if (issue.type === "string") {
        return { message: errorMessages.tooShort(issue.minimum as number) };
      }
      if (issue.type === "number") {
        return { message: errorMessages.minValue(issue.minimum as number) };
      }
    }

    if (issue.code === z.ZodIssueCode.too_big) {
      if (issue.type === "string") {
        return { message: errorMessages.tooLong(issue.maximum as number) };
      }
      if (issue.type === "number") {
        return { message: errorMessages.maxValue(issue.maximum as number) };
      }
    }

    return { message: ctx.defaultError };
  },
};

/**
 * Schemas de validação comuns
 */
export const schemas = {
  email: z
    .string({ required_error: errorMessages.required })
    .email(errorMessages.invalidEmail)
    .min(1, errorMessages.required),

  password: z
    .string({ required_error: errorMessages.required })
    .min(8, errorMessages.invalidPassword)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, errorMessages.invalidPassword),

  name: z
    .string({ required_error: errorMessages.required })
    .min(2, errorMessages.tooShort(2))
    .max(100, errorMessages.tooLong(100)),

  phone: z
    .string({ required_error: errorMessages.required })
    .regex(
      /^(\+55\s?)?(\(?\d{2}\)?\s?)?(9\s?)?\d{4}-?\d{4}$/,
      errorMessages.invalidPhone
    ),

  url: z
    .string({ required_error: errorMessages.required })
    .url(errorMessages.invalidUrl),

  prompt: z
    .string({ required_error: errorMessages.required })
    .min(3, "Descreva melhor o que você quer criar")
    .max(500, errorMessages.tooLong(500)),

  caption: z
    .string({ required_error: errorMessages.required })
    .min(10, "A legenda deve ter pelo menos 10 caracteres")
    .max(2200, "A legenda não pode ter mais de 2200 caracteres"),

  hashtags: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const tags = val.split(/\s+/).filter((t) => t.startsWith("#"));
        return tags.length <= 30;
      },
      { message: "Máximo de 30 hashtags" }
    ),

  futureDate: z
    .date({ required_error: errorMessages.required })
    .refine((date) => date > new Date(), errorMessages.futureDateRequired),

  pastDate: z
    .date({ required_error: errorMessages.required })
    .refine((date) => date < new Date(), errorMessages.pastDateRequired),
};

/**
 * Schema para registro de usuário
 */
export const registerSchema = z
  .object({
    name: schemas.name,
    email: schemas.email,
    password: schemas.password,
    confirmPassword: z.string({ required_error: errorMessages.required }),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Você deve aceitar os termos de uso",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: errorMessages.passwordMismatch,
    path: ["confirmPassword"],
  });

/**
 * Schema para login
 */
export const loginSchema = z.object({
  email: schemas.email,
  password: z.string({ required_error: errorMessages.required }).min(1, errorMessages.required),
});

/**
 * Schema para geração de imagem
 */
export const generateImageSchema = z.object({
  prompt: schemas.prompt,
  visualStyle: z.enum(
    ["minimalista", "colorido", "corporativo", "artistico", "moderno", "vintage", "futurista", "natural"],
    { required_error: "Selecione um estilo visual" }
  ),
  contentType: z.enum(["post", "story", "banner", "logo"], {
    required_error: "Selecione o tipo de conteúdo",
  }),
});

/**
 * Schema para criação de post
 */
export const createPostSchema = z.object({
  caption: schemas.caption,
  hashtags: schemas.hashtags,
  platforms: z
    .array(z.enum(["instagram", "facebook", "tiktok", "linkedin"]))
    .min(1, "Selecione pelo menos uma plataforma"),
  imageId: z.number().optional(),
  scheduledFor: z.date().optional(),
});

/**
 * Schema para agendamento
 */
export const schedulePostSchema = z.object({
  postId: z.number({ required_error: errorMessages.required }),
  scheduledFor: schemas.futureDate,
  platforms: z
    .array(z.enum(["instagram", "facebook", "tiktok", "linkedin"]))
    .min(1, "Selecione pelo menos uma plataforma"),
});

/**
 * Schema para configurações de perfil
 */
export const profileSettingsSchema = z.object({
  name: schemas.name,
  email: schemas.email,
  phone: schemas.phone.optional(),
  bio: z.string().max(500, errorMessages.tooLong(500)).optional(),
  website: schemas.url.optional(),
});

/**
 * Schema para mudança de senha
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string({ required_error: errorMessages.required }),
    newPassword: schemas.password,
    confirmNewPassword: z.string({ required_error: errorMessages.required }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: errorMessages.passwordMismatch,
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "A nova senha deve ser diferente da atual",
    path: ["newPassword"],
  });

/**
 * Schema para conexão de plataforma social
 */
export const connectPlatformSchema = z.object({
  platform: z.enum(["instagram", "facebook", "tiktok", "linkedin"], {
    required_error: "Selecione uma plataforma",
  }),
  accessToken: z.string({ required_error: errorMessages.required }),
  refreshToken: z.string().optional(),
  expiresAt: z.date().optional(),
});

/**
 * Helper para extrair erros do Zod em formato amigável
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  error.errors.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });

  return errors;
}

/**
 * Helper para validar e retornar erros formatados
 */
export function validateWithErrors<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: formatZodErrors(result.error),
  };
}

/**
 * Validadores customizados
 */
export const validators = {
  isStrongPassword: (password: string): boolean => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  },

  isBrazilianPhone: (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length === 10 || cleaned.length === 11;
  },

  isValidHashtag: (tag: string): boolean => {
    return /^#[a-zA-Z0-9_]+$/.test(tag);
  },

  isValidUsername: (username: string): boolean => {
    return /^[a-zA-Z0-9_]{3,30}$/.test(username);
  },

  isValidImageUrl: (url: string): boolean => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  },
};
