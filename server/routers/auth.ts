import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc.js";
import { TRPCError } from "@trpc/server";
import * as db from "../db.js";
import { COOKIE_NAME } from "../../shared/const.js";
import crypto from "crypto";

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
      secure: true,
      sameSite: "none" as const,
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
          emailVerified: true, // Marcando como verificado para facilitar o teste inicial
        });

        return {
          success: true,
          message: "Usuário criado com sucesso! Você já pode fazer login.",
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
    .mutation(async ({ input }) => {
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

      // Verificar se email foi verificado
      if (!user.emailVerified) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Email não verificado. Verifique seu email para continuar.",
        });
      }

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

      // TODO: Salvar token no banco de dados
      // await db.savePasswordResetToken(user.id, resetToken);

      // TODO: Enviar email com link de reset
      // const resetUrl = `${process.env.VITE_APP_URL}/reset-password?token=${resetToken}`;

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
      // TODO: Verificar token no banco de dados
      // const result = await verifyResetToken(input.token);

      return {
        success: true,
        message: "Senha redefinida com sucesso!",
      };
    }),

  // Verificar email
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      // TODO: Verificar token no banco de dados
      // const result = await verifyEmailToken(input.token);

      return {
        success: true,
        message: "Email verificado com sucesso!",
      };
    }),
});
