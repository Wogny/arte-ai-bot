import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc.js";
import { TRPCError } from "@trpc/server";
import * as db from "../db.js";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import { sdk } from "../_core/sdk.js";
import crypto from "crypto";
import { sendEmail, getVerificationEmailTemplate, getPasswordResetEmailTemplate } from "../_core/email.js";

// Validação de email
const emailSchema = z.string().email("Email inválido");

// Validação de senha
const passwordSchema = z
  .string()
  .min(8, "Senha deve ter no mínimo 8 caracteres")
  .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número");

// Hash de senha
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Verificar senha
function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Gerar token aleatório
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const authRouter = router({
  // Obter usuário atual
  me: publicProcedure.query(opts => opts.ctx.user),

  // Logout
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = {
      maxAge: -1,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      httpOnly: true,
      path: "/",
    };
    ctx.res.clearCookie(COOKIE_NAME, cookieOptions);
    return {
      success: true,
    } as const;
  }),

  // Registro de novo usuário
  register: publicProcedure
    .input(
      z.object({
        email: emailSchema,
        password: passwordSchema,
        name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Verificar se email já existe
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email já cadastrado",
          });
        }

        // Hash da senha
        const passwordHash = hashPassword(input.password);

        // Criar usuário com openId único (baseado em email)
        const openId = `email_${crypto.randomBytes(16).toString("hex")}`;
        await db.upsertUser({
          openId,
          email: input.email,
          name: input.name,
          loginMethod: "email",
          passwordHash,
          emailVerified: false, // Por padrão, email não verificado
        });

        // Gerar token de verificação de email
        const verificationToken = generateToken();
        const user = await db.getUserByEmail(input.email);
        if (user) {
          await db.saveEmailVerificationToken(user.id, verificationToken);
          // Enviar email de verificação
          const verificationUrl = `${process.env.VITE_APP_URL}/verify-email?token=${verificationToken}`;
          
          await sendEmail({
            to: input.email,
            subject: "Verifique seu email - MKT Gerenciador",
            html: getVerificationEmailTemplate(input.name, verificationUrl),
          });
          
          console.log(`[AUTH] Link de Verificação de Email enviado para ${input.email}`);
        }

        return {
          success: true,
          message: "Usuário criado com sucesso! Verifique seu email para ativar sua conta.",
          email: input.email,
        };
      } catch (error: any) {
        console.error("[Auth] Registration error:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Erro interno ao criar conta",
        });
      }
    }),

  // Login com email/senha
  loginWithEmail: publicProcedure
    .input(
      z.object({
        email: emailSchema,
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserByEmail(input.email);
      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou senha inválidos",
        });
      }

      // Verificar senha
      if (!verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou senha inválidos",
        });
      }

      // Implementar sistema de verificação de email
      if (!user.emailVerified) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Email não verificado. Verifique seu email para continuar.",
        });
      }

      // Gerar token de sessão
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
      });

      // Definir cookie
      const cookieOptions = {
        maxAge: ONE_YEAR_MS,
        secure: process.env.NODE_ENV === "production",
        sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as const,
        httpOnly: true,
        path: "/",
      };
      
      console.log(`[Auth] Setting session cookie for user: ${user.email}`);
      ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

      return {
        success: true,
        message: "Login realizado com sucesso!",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    }),

  // Solicitar recuperação de senha
  requestPasswordReset: publicProcedure
    .input(z.object({ email: emailSchema }))
    .mutation(async ({ input }) => {
      const user = await db.getUserByEmail(input.email);
      if (!user) {
        // Não revelar se email existe ou não (segurança)
        return {
          success: true,
          message: "Se o email existir, você receberá um link de recuperação",
        };
      }

      // Gerar token de reset
      const resetToken = generateToken();

      // Salvar token no banco de dados
      await db.savePasswordResetToken(user.id, resetToken);

      // Enviar email com link de reset
      const resetUrl = `${process.env.VITE_APP_URL}/reset-password?token=${resetToken}`;
      
      await sendEmail({
        to: user.email!,
        subject: "Recuperação de Senha - MKT Gerenciador",
        html: getPasswordResetEmailTemplate(user.name || "Usuário", resetUrl),
      });

      console.log(`[AUTH] Link de Reset de Senha enviado para ${user.email}`);

      return {
        success: true,
        message: "Se o email existir, você receberá um link de recuperação",
      };
    }),

  // Redefinir senha
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: passwordSchema,
      })
    )
    .mutation(async ({ input }) => {
      // Verificar token no banco de dados
      const result = await db.verifyResetToken(input.token);
      if (!result) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Token inválido ou expirado" });
      }
      // Hash da nova senha
      const passwordHash = hashPassword(input.newPassword);
      // Atualizar senha do usuário
      await db.updateUserPassword(result.userId, passwordHash);
      // Invalidar token
      await db.invalidateResetToken(input.token);

      return {
        success: true,
        message: "Senha redefinida com sucesso!",
      };
    }),

  // Verificar email
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      // Verificar token no banco de dados
      const result = await db.verifyEmailToken(input.token);
      if (!result) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Token de verificação inválido ou expirado" });
      }
      // Marcar email como verificado
      await db.verifyUserEmail(result.userId);
      // Invalidar token
      await db.invalidateEmailToken(input.token);

      return {
        success: true,
        message: "Email verificado com sucesso!",
      };
    }),

  // Reenviar email de verificação
  resendVerificationEmail: publicProcedure
    .input(z.object({ email: emailSchema }))
    .mutation(async ({ input }) => {
      const user = await db.getUserByEmail(input.email);
      
      if (!user) {
        // Por segurança, não confirmamos se o email existe
        return { success: true, message: "Se o email estiver cadastrado e não verificado, você receberá um novo link." };
      }

      if (user.emailVerified) {
        return { success: true, message: "Este email já está verificado." };
      }

      // Gerar novo token
      const verificationToken = generateToken();
      await db.saveEmailVerificationToken(user.id, verificationToken);

      // Enviar email
      const verificationUrl = `${process.env.VITE_APP_URL}/verify-email?token=${verificationToken}`;
      
      await sendEmail({
        to: user.email!,
        subject: "Verifique seu email - MKT Gerenciador",
        html: getVerificationEmailTemplate(user.name || "Usuário", verificationUrl),
      });

      return {
        success: true,
        message: "Um novo link de verificação foi enviado para seu email.",
      };
    }),
});
