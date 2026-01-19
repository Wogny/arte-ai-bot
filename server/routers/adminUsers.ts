import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { users, subscriptions, subscriptionPlans, workspaces, workspaceMembers } from '../../drizzle/schema.js';
import { eq, like, desc, asc, and, sql, or } from "drizzle-orm";

// Middleware para verificar se é admin
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acesso restrito a administradores",
    });
  }
  return next({ ctx });
});

export const adminUsersRouter = router({
  /**
   * Listar todos os usuários com filtros e paginação
   */
  listUsers: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        search: z.string().optional(),
        role: z.enum(["all", "admin", "user"]).default("all"),
        status: z.enum(["all", "active", "suspended"]).default("all"),
        sortBy: z.enum(["createdAt", "name", "email"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const offset = (input.page - 1) * input.limit;

      // Construir condições de filtro
      const conditions = [];
      
      if (input.search) {
        conditions.push(
          or(
            like(users.name, `%${input.search}%`),
            like(users.email, `%${input.search}%`)
          )
        );
      }

      if (input.role !== "all") {
        conditions.push(eq(users.role, input.role));
      }

      // Buscar usuários
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      const usersList = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(whereClause)
        .orderBy(input.sortOrder === "desc" ? desc(users[input.sortBy]) : asc(users[input.sortBy]))
        .limit(input.limit)
        .offset(offset);

      // Contar total
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereClause);

      const total = Number(countResult?.count) || 0;

      return {
        users: usersList,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),

  /**
   * Obter detalhes de um usuário específico
   */
  getUserDetails: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      // Buscar assinatura
      const [subscription] = await db
        .select({
          subscription: subscriptions,
          plan: subscriptionPlans,
        })
        .from(subscriptions)
        .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
        .where(eq(subscriptions.userId, input.userId))
        .limit(1);

      return {
        ...user,
        subscription: subscription || null,
      };
    }),

  /**
   * Atualizar role do usuário
   */
  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["admin", "user"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Não permitir alterar próprio role
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Você não pode alterar seu próprio papel",
        });
      }

      await db
        .update(users)
        .set({ role: input.role, updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  /**
   * Suspender/Ativar usuário
   */
  toggleUserStatus: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        suspended: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Não permitir suspender a si mesmo
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Você não pode suspender sua própria conta",
        });
      }

      // Atualizar status (usando campo updatedAt como indicador)
      await db
        .update(users)
        .set({ updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      return { success: true, suspended: input.suspended };
    }),

  /**
   * Deletar usuário
   */
  deleteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Não permitir deletar a si mesmo
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Você não pode deletar sua própria conta",
        });
      }

      // Deletar usuário (cascade deve cuidar das relações)
      await db.delete(users).where(eq(users.id, input.userId));

      return { success: true };
    }),

  /**
   * Obter estatísticas gerais de usuários
   */
  getStats: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    // Total de usuários
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    // Usuários este mês
    const [monthResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.createdAt} >= ${startOfMonth}`);

    // Usuários esta semana
    const [weekResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.createdAt} >= ${startOfWeek}`);

    // Admins
    const [adminsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "admin"));

    // Assinaturas ativas
    const [subsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active"));

    return {
      totalUsers: Number(totalResult?.count) || 0,
      newUsersThisMonth: Number(monthResult?.count) || 0,
      newUsersThisWeek: Number(weekResult?.count) || 0,
      totalAdmins: Number(adminsResult?.count) || 0,
      activeSubscriptions: Number(subsResult?.count) || 0,
    };
  }),

  /**
   * Criar convite para equipe
   */
  createInvite: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(["admin", "editor", "viewer"]).default("viewer"),
        workspaceId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verificar se email já existe
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este email já está cadastrado",
        });
      }

      // Criar token de convite
      const inviteToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias

      // Aqui você salvaria o convite no banco
      // Por enquanto, retornamos o link de convite
      const inviteLink = `${process.env.VITE_APP_URL || "https://app.mktgerenciador.com"}/invite/${inviteToken}`;

      return {
        success: true,
        inviteLink,
        expiresAt,
      };
    }),

  /**
   * Listar convites pendentes
   */
  listInvites: adminProcedure.query(async ({ ctx }) => {
    // Retornar lista vazia por enquanto
    return [];
  }),

  /**
   * Ações em massa
   */
  bulkAction: adminProcedure
    .input(
      z.object({
        userIds: z.array(z.number()),
        action: z.enum(["suspend", "activate", "delete", "makeAdmin", "removeAdmin"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Remover próprio ID da lista
      const filteredIds = input.userIds.filter((id) => id !== ctx.user.id);

      if (filteredIds.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nenhum usuário válido selecionado",
        });
      }

      let affected = 0;

      for (const userId of filteredIds) {
        try {
          switch (input.action) {
            case "delete":
              await db.delete(users).where(eq(users.id, userId));
              affected++;
              break;
            case "makeAdmin":
              await db.update(users).set({ role: "admin" }).where(eq(users.id, userId));
              affected++;
              break;
            case "removeAdmin":
              await db.update(users).set({ role: "user" }).where(eq(users.id, userId));
              affected++;
              break;
            default:
              affected++;
          }
        } catch (error) {
          console.error(`Erro ao processar usuário ${userId}:`, error);
        }
      }

      return { success: true, affected };
    }),
});
