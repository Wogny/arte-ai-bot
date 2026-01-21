import { protectedProcedure, router } from "../_core/trpc.js";
import { z } from "zod";
import * as db from "../_core/db.js";

export const tagsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.getUserTags(ctx.user.id);
  }),

  create: protectedProcedure
    .input(z.object({ 
      name: z.string().min(1), 
      color: z.string().optional(), 
      description: z.string().optional() 
    }))
    .mutation(async ({ ctx, input }) => {
      return await db.createTag({
        userId: ctx.user.id,
        name: input.name,
        color: input.color || "#3b82f6",
        description: input.description,
      });
    }),

  update: protectedProcedure
    .input(z.object({ 
      id: z.number(), 
      name: z.string().optional(), 
      color: z.string().optional(), 
      description: z.string().optional() 
    }))
    .mutation(async ({ ctx, input }) => {
      await db.updateTag(input.id, ctx.user.id, {
        name: input.name,
        color: input.color,
        description: input.description,
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteTag(input.id, ctx.user.id);
      return { success: true };
    }),

  addToCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number(), tagId: z.number() }))
    .mutation(async ({ input }) => {
      await db.addTagToCampaign(input.campaignId, input.tagId);
      return { success: true };
    }),

  removeFromCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number(), tagId: z.number() }))
    .mutation(async ({ input }) => {
      await db.removeTagFromCampaign(input.campaignId, input.tagId);
      return { success: true };
    }),

  getCampaignTags: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await db.getCampaignTags(input.campaignId, ctx.user.id);
    }),
});
