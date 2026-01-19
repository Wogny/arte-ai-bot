import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import * as db from "../db";

// Categorias de templates
const categoryOptions = [
  "promocao", "lancamento", "engajamento", "educativo", 
  "inspiracional", "bastidores", "depoimento", "dica"
] as const;

// Nichos disponíveis
const nicheOptions = [
  "fitness", "moda", "gastronomia", "tecnologia", "beleza", "viagem",
  "educacao", "negocios", "saude", "lifestyle", "pets", "arte", "musica", "esportes"
] as const;

// Plataformas
const platformOptions = ["instagram", "tiktok", "linkedin", "facebook", "twitter"] as const;

// Tipos de conteúdo
const contentTypeOptions = ["post", "story", "reel", "carousel", "banner"] as const;

export const postTemplatesRouter = router({
  // Listar todos os templates (público)
  list: publicProcedure
    .input(z.object({
      niche: z.enum(nicheOptions).optional(),
      category: z.enum(categoryOptions).optional(),
      platform: z.enum(platformOptions).optional(),
      isPremium: z.boolean().optional(),
      limit: z.number().min(1).max(100).default(50),
    }).optional())
    .query(async ({ input }) => {
      return await db.getPostTemplates(input);
    }),

  // Obter template por ID
  getById: protectedProcedure
    .input(z.object({
      templateId: z.number(),
    }))
    .query(async ({ input }) => {
      const template = await db.getTemplateById(input.templateId);
      if (template) {
        await db.incrementTemplateUsage(input.templateId);
      }
      return template;
    }),

  // Favoritar/desfavoritar template
  toggleFavorite: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      isFavorite: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.toggleUserTemplateFavorite(ctx.user.id, input.templateId, input.isFavorite);
      return { success: true };
    }),

  // Listar favoritos do usuário
  favorites: protectedProcedure.query(async ({ ctx }) => {
    return await db.getUserFavoriteTemplates(ctx.user.id);
  }),

  // Obter categorias e nichos disponíveis
  getFilters: publicProcedure.query(() => {
    return {
      categories: [
        { id: "promocao", name: "Promoção", icon: "🏷️", description: "Ofertas e descontos" },
        { id: "lancamento", name: "Lançamento", icon: "🚀", description: "Novos produtos/serviços" },
        { id: "engajamento", name: "Engajamento", icon: "💬", description: "Interação com audiência" },
        { id: "educativo", name: "Educativo", icon: "📚", description: "Conteúdo informativo" },
        { id: "inspiracional", name: "Inspiracional", icon: "✨", description: "Motivação e inspiração" },
        { id: "bastidores", name: "Bastidores", icon: "🎬", description: "Behind the scenes" },
        { id: "depoimento", name: "Depoimento", icon: "⭐", description: "Reviews e feedbacks" },
        { id: "dica", name: "Dica", icon: "💡", description: "Tips e tutoriais" },
      ],
      niches: [
        { id: "fitness", name: "Fitness", icon: "💪" },
        { id: "moda", name: "Moda", icon: "👗" },
        { id: "gastronomia", name: "Gastronomia", icon: "🍽️" },
        { id: "tecnologia", name: "Tecnologia", icon: "💻" },
        { id: "beleza", name: "Beleza", icon: "💄" },
        { id: "viagem", name: "Viagem", icon: "✈️" },
        { id: "educacao", name: "Educação", icon: "🎓" },
        { id: "negocios", name: "Negócios", icon: "💼" },
        { id: "saude", name: "Saúde", icon: "🏥" },
        { id: "lifestyle", name: "Lifestyle", icon: "🌟" },
        { id: "pets", name: "Pets", icon: "🐾" },
        { id: "arte", name: "Arte", icon: "🎨" },
        { id: "musica", name: "Música", icon: "🎵" },
        { id: "esportes", name: "Esportes", icon: "⚽" },
      ],
      platforms: [
        { id: "instagram", name: "Instagram" },
        { id: "tiktok", name: "TikTok" },
        { id: "linkedin", name: "LinkedIn" },
        { id: "facebook", name: "Facebook" },
        { id: "twitter", name: "Twitter/X" },
      ],
      contentTypes: [
        { id: "post", name: "Post" },
        { id: "story", name: "Story" },
        { id: "reel", name: "Reel" },
        { id: "carousel", name: "Carousel" },
        { id: "banner", name: "Banner" },
      ],
    };
  }),

  // Obter templates populares
  popular: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(20).default(10),
    }).optional())
    .query(async ({ input }) => {
      return await db.getPostTemplates({ isPremium: false });
    }),

  // Obter templates por nicho
  byNiche: publicProcedure
    .input(z.object({
      niche: z.enum(nicheOptions),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      return await db.getPostTemplates({ niche: input.niche });
    }),
});
