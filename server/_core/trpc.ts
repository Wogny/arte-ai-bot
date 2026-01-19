import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { getDb } from "../db";
import { workspaceMembers } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

/**
 * Middleware para verificar permissão em um workspace específico
 */
export const workspaceProcedure = (requiredRole: "admin" | "editor" | "viewer" = "viewer") => 
  protectedProcedure.use(async (opts) => {
    const { ctx, next } = opts;
    const rawInput = await opts.getRawInput() as { workspaceId?: number };
    const workspaceId = rawInput?.workspaceId;

    if (!workspaceId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "workspaceId é obrigatório." });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const member = await db.select().from(workspaceMembers).where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, ctx.user.id)
      )
    ).limit(1);

    if (!member.length) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Você não é membro deste workspace." });
    }

    // Hierarquia de roles: admin > editor > viewer
    const roles = ["viewer", "editor", "admin"];
    if (roles.indexOf(member[0].role) < roles.indexOf(requiredRole)) {
      throw new TRPCError({ code: "FORBIDDEN", message: `Permissão insuficiente. Requerido: ${requiredRole}` });
    }

    return next({
      ctx: {
        ...ctx,
        workspaceRole: member[0].role,
      },
    });
  });

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
