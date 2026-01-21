import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import { storagePut } from "../storage.js";
import { nanoid } from "nanoid";
import * as db from "../_core/db.js";

// Tipos de mídia suportados
const SUPPORTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/avi"];
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// Durações máximas por formato (em segundos)
const MAX_DURATIONS = {
  reel: 90, // Instagram Reels: 90 segundos
  story: 60, // Stories: 60 segundos
  post: 60 * 60, // Posts: 1 hora
  carousel: 60, // Carousel: 60 segundos por vídeo
};

export const mediaRouter = router({
  // Upload de mídia (imagem ou vídeo)
  upload: protectedProcedure
    .input(z.object({
      mediaType: z.enum(["image", "video", "gif"]),
      contentFormat: z.enum(["post", "story", "reel", "carousel"]).default("post"),
      title: z.string().optional(),
      description: z.string().optional(),
      projectId: z.number().optional(),
      visualStyle: z.string().optional(),
      // Base64 do arquivo
      fileData: z.string(),
      fileName: z.string(),
      mimeType: z.string(),
      fileSize: z.number(),
      // Metadados de vídeo
      duration: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      // Thumbnail para vídeos (base64)
      thumbnailData: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validar tipo de arquivo
      if (input.mediaType === "video" && !SUPPORTED_VIDEO_TYPES.includes(input.mimeType)) {
        throw new Error(`Formato de vídeo não suportado. Use: ${SUPPORTED_VIDEO_TYPES.join(", ")}`);
      }
      
      if (input.mediaType === "image" && !SUPPORTED_IMAGE_TYPES.includes(input.mimeType)) {
        throw new Error(`Formato de imagem não suportado. Use: ${SUPPORTED_IMAGE_TYPES.join(", ")}`);
      }

      // Validar tamanho
      if (input.mediaType === "video" && input.fileSize > MAX_VIDEO_SIZE) {
        throw new Error(`Vídeo muito grande. Tamanho máximo: ${MAX_VIDEO_SIZE / 1024 / 1024}MB`);
      }
      
      if (input.mediaType === "image" && input.fileSize > MAX_IMAGE_SIZE) {
        throw new Error(`Imagem muito grande. Tamanho máximo: ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
      }

      // Validar duração do vídeo
      if (input.mediaType === "video" && input.duration) {
        const maxDuration = MAX_DURATIONS[input.contentFormat];
        if (input.duration > maxDuration) {
          throw new Error(`Vídeo muito longo para ${input.contentFormat}. Duração máxima: ${maxDuration} segundos`);
        }
      }

      // Converter base64 para buffer
      const fileBuffer = Buffer.from(input.fileData, "base64");
      
      // Gerar chave única para o arquivo
      const extension = input.fileName.split(".").pop() || "mp4";
      const fileKey = `${ctx.user.id}/media/${nanoid()}.${extension}`;
      
      // Upload para S3
      const { url: mediaUrl } = await storagePut(fileKey, fileBuffer, input.mimeType);

      // Upload da thumbnail se fornecida
      let thumbnailUrl: string | undefined;
      let thumbnailKey: string | undefined;
      
      if (input.thumbnailData) {
        const thumbBuffer = Buffer.from(input.thumbnailData, "base64");
        thumbnailKey = `${ctx.user.id}/thumbnails/${nanoid()}.jpg`;
        const thumbResult = await storagePut(thumbnailKey, thumbBuffer, "image/jpeg");
        thumbnailUrl = thumbResult.url;
      }

      // Salvar no banco de dados
      const media = await db.createMedia({
        userId: ctx.user.id,
        projectId: input.projectId ?? null,
        mediaType: input.mediaType,
        title: input.title ?? null,
        description: input.description ?? null,
        contentFormat: input.contentFormat,
        visualStyle: input.visualStyle ?? null,
        // Campos de imagem/vídeo
        imageUrl: input.mediaType === "image" ? mediaUrl : null,
        imageKey: input.mediaType === "image" ? fileKey : null,
        videoUrl: input.mediaType === "video" ? mediaUrl : null,
        videoKey: input.mediaType === "video" ? fileKey : null,
        thumbnailUrl: thumbnailUrl ?? null,
        thumbnailKey: thumbnailKey ?? null,
        // Metadados
        duration: input.duration ?? null,
        width: input.width ?? null,
        height: input.height ?? null,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        aiGenerated: false,
      });

      return media;
    }),

  // Listar mídias do usuário
  list: protectedProcedure
    .input(z.object({
      projectId: z.number().optional(),
      mediaType: z.enum(["image", "video", "gif", "carousel"]).optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return await db.getUserMedia(ctx.user.id, input);
    }),

  // Obter mídia por ID
  getById: protectedProcedure
    .input(z.object({ mediaId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await db.getMediaById(input.mediaId, ctx.user.id);
    }),

  // Atualizar mídia
  update: protectedProcedure
    .input(z.object({
      mediaId: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      visualStyle: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { mediaId, ...data } = input;
      await db.updateMedia(mediaId, ctx.user.id, data);
      return { success: true };
    }),

  // Deletar mídia
  delete: protectedProcedure
    .input(z.object({ mediaId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteMedia(input.mediaId, ctx.user.id);
      return { success: true };
    }),

  // Estatísticas de mídia
  stats: protectedProcedure.query(async ({ ctx }) => {
    return await db.getMediaStats(ctx.user.id);
  }),

  // Listar apenas vídeos
  videos: protectedProcedure
    .input(z.object({ projectId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      return await db.getUserVideos(ctx.user.id, input.projectId);
    }),

  // Mídias recentes
  recent: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      return await db.getRecentMedia(ctx.user.id, input.limit);
    }),

  // Validar vídeo antes do upload
  validateVideo: protectedProcedure
    .input(z.object({
      mimeType: z.string(),
      fileSize: z.number(),
      duration: z.number(),
      contentFormat: z.enum(["post", "story", "reel", "carousel"]),
    }))
    .query(({ input }) => {
      const errors: string[] = [];

      // Validar tipo
      if (!SUPPORTED_VIDEO_TYPES.includes(input.mimeType)) {
        errors.push(`Formato não suportado. Use: ${SUPPORTED_VIDEO_TYPES.join(", ")}`);
      }

      // Validar tamanho
      if (input.fileSize > MAX_VIDEO_SIZE) {
        errors.push(`Arquivo muito grande. Máximo: ${MAX_VIDEO_SIZE / 1024 / 1024}MB`);
      }

      // Validar duração
      const maxDuration = MAX_DURATIONS[input.contentFormat];
      if (input.duration > maxDuration) {
        errors.push(`Duração muito longa para ${input.contentFormat}. Máximo: ${maxDuration}s`);
      }

      return {
        valid: errors.length === 0,
        errors,
        limits: {
          maxSize: MAX_VIDEO_SIZE,
          maxDuration: maxDuration,
          supportedFormats: SUPPORTED_VIDEO_TYPES,
        },
      };
    }),

  // Obter limites de upload
  getLimits: protectedProcedure.query(() => {
    return {
      video: {
        maxSize: MAX_VIDEO_SIZE,
        maxSizeMB: MAX_VIDEO_SIZE / 1024 / 1024,
        supportedFormats: SUPPORTED_VIDEO_TYPES,
        maxDurations: MAX_DURATIONS,
      },
      image: {
        maxSize: MAX_IMAGE_SIZE,
        maxSizeMB: MAX_IMAGE_SIZE / 1024 / 1024,
        supportedFormats: SUPPORTED_IMAGE_TYPES,
      },
    };
  }),
});
