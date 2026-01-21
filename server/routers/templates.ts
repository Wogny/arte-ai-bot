import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc.js";
import { getDb } from "../_core/db.js";
import { promptTemplates } from '../../drizzle/schema.js';
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const templatesRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        category: z.enum(["ads", "educational", "promotional", "engagement", "other"]),
        template: z.string().min(1),
        variables: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const result = await db.insert(promptTemplates).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        category: input.category,
        template: input.template,
        variables: input.variables || [],
        isPublic: false,
      });

      return {
        id: Math.floor(Math.random() * 1000000),
        ...input,
        userId: ctx.user.id,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const templates = await db
      .select()
      .from(promptTemplates)
      .where(eq(promptTemplates.userId, ctx.user.id));

    return templates;
  }),

  listByCategory: protectedProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const templates = await db
        .select()
        .from(promptTemplates)
        .where(
          and(
            eq(promptTemplates.userId, ctx.user.id),
            eq(promptTemplates.category, input.category)
          )
        );

      return templates;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        template: z.string().min(1).optional(),
        variables: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (input.name) updateData.name = input.name;
      if (input.description) updateData.description = input.description;
      if (input.template) updateData.template = input.template;
      if (input.variables) updateData.variables = input.variables;

      await db
        .update(promptTemplates)
        .set(updateData)
        .where(
          and(
            eq(promptTemplates.id, input.id),
            eq(promptTemplates.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .delete(promptTemplates)
        .where(
          and(
            eq(promptTemplates.id, input.id),
            eq(promptTemplates.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  // Built-in templates
  getBuiltInTemplates: publicProcedure.query(() => {
    return [
      {
        id: -1,
        name: "Anúncio de Produto",
        category: "ads",
        description: "Template para anúncios de produtos com call-to-action",
        template:
          "🎯 Conheça {{productName}}!\n\n{{productDescription}}\n\n✨ Benefícios:\n- {{benefit1}}\n- {{benefit2}}\n- {{benefit3}}\n\n👉 {{callToAction}}\n\n#{{hashtag1}} #{{hashtag2}}",
        variables: [
          "productName",
          "productDescription",
          "benefit1",
          "benefit2",
          "benefit3",
          "callToAction",
          "hashtag1",
          "hashtag2",
        ],
      },
      {
        id: -2,
        name: "Post Educativo",
        category: "educational",
        description: "Template para conteúdo educativo e informativo",
        template:
          "📚 {{title}}\n\n{{introduction}}\n\n1️⃣ {{point1}}\n2️⃣ {{point2}}\n3️⃣ {{point3}}\n\n💡 {{conclusion}}\n\n{{callToAction}}\n\n#{{hashtag1}} #{{hashtag2}} #{{hashtag3}}",
        variables: [
          "title",
          "introduction",
          "point1",
          "point2",
          "point3",
          "conclusion",
          "callToAction",
          "hashtag1",
          "hashtag2",
          "hashtag3",
        ],
      },
      {
        id: -3,
        name: "Promoção com Desconto",
        category: "promotional",
        description: "Template para campanhas promocionais com desconto",
        template:
          "🔥 PROMOÇÃO IMPERDÍVEL! 🔥\n\n{{discount}}% OFF em {{productName}}\n\n⏰ Válido até {{expirationDate}}\n\n{{description}}\n\n💰 De R$ {{originalPrice}} por apenas R$ {{discountedPrice}}\n\n👉 {{callToAction}}\n\n#{{hashtag1}} #{{hashtag2}}",
        variables: [
          "discount",
          "productName",
          "expirationDate",
          "description",
          "originalPrice",
          "discountedPrice",
          "callToAction",
          "hashtag1",
          "hashtag2",
        ],
      },
      {
        id: -4,
        name: "Engajamento com Pergunta",
        category: "engagement",
        description: "Template para aumentar engajamento com perguntas",
        template:
          "{{emoji}} {{question}}\n\n{{context}}\n\n{{optionA}}\n{{optionB}}\n{{optionC}}\n\n💬 Responda nos comentários!\n\n{{callToAction}}\n\n#{{hashtag1}} #{{hashtag2}}",
        variables: [
          "emoji",
          "question",
          "context",
          "optionA",
          "optionB",
          "optionC",
          "callToAction",
          "hashtag1",
          "hashtag2",
        ],
      },
    ];
  }),
});
