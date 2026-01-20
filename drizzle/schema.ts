import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, primaryKey, index, customType } from "drizzle-orm/mysql-core";

// Custom type for LONGTEXT in MySQL
const longtext = customType<{ data: string }>({
  dataType() {
    return "longtext";
  },
});
import { sql } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: text("passwordHash"),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  twoFactorSecret: text("twoFactorSecret"),
  isTwoFactorEnabled: boolean("isTwoFactorEnabled").default(false).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==========================================
// WORKSPACE & TEAM MANAGEMENT
// ==========================================

export const workspaces = mysqlTable("workspaces", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerId: int("ownerId").notNull(),
  apiKey: varchar("apiKey", { length: 64 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const workspaceMembers = mysqlTable("workspace_members", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["admin", "editor", "revisor", "viewer"]).default("editor").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const workspaceInvites = mysqlTable("workspace_invites", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "editor", "viewer"]).default("editor").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "expired"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==========================================
// AUDIT & SECURITY
// ==========================================

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId"),
  details: json("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  workspaceIdIdx: index("workspaceId_idx").on(table.workspaceId),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
}));

export const outgoingWebhooks = mysqlTable("outgoing_webhooks", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url").notNull(),
  events: json("events").notNull(),
  secret: varchar("secret", { length: 255 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==========================================
// SUPPORT SYSTEM
// ==========================================

export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const faqEntries = mysqlTable("faq_entries", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 100 }).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  order: int("order").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==========================================
// META API CREDENTIALS
// ==========================================

export const metaCredentials = mysqlTable("meta_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  appId: varchar("appId", { length: 255 }).notNull(),
  appSecret: text("appSecret").notNull(),
  accessToken: text("accessToken").notNull(),
  isEncrypted: boolean("isEncrypted").default(true).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MetaCredential = typeof metaCredentials.$inferSelect;
export type InsertMetaCredential = typeof metaCredentials.$inferInsert;

// ==========================================
// PROJECTS & CONTENT
// ==========================================

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  niche: varchar("niche", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

export const generatedImages = mysqlTable("generated_images", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  prompt: text("prompt").notNull(),
  visualStyle: varchar("visualStyle", { length: 100 }).notNull(),
  contentType: varchar("contentType", { length: 100 }).notNull(),
  imageUrl: longtext("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 500 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GeneratedImage = typeof generatedImages.$inferSelect;
export type InsertGeneratedImage = typeof generatedImages.$inferInsert;

// Tabela para vídeos e mídias
export const generatedMedia = mysqlTable("generated_media", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  mediaType: mysqlEnum("mediaType", ["image", "video", "gif", "carousel"]).notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  // Para imagens
  imageUrl: text("imageUrl"),
  imageKey: varchar("imageKey", { length: 500 }),
  // Para vídeos
  videoUrl: text("videoUrl"),
  videoKey: varchar("videoKey", { length: 500 }),
  thumbnailUrl: text("thumbnailUrl"),
  thumbnailKey: varchar("thumbnailKey", { length: 500 }),
  duration: int("duration"), // duração em segundos
  width: int("width"),
  height: int("height"),
  fileSize: int("fileSize"), // tamanho em bytes
  mimeType: varchar("mimeType", { length: 100 }),
  // Metadados
  visualStyle: varchar("visualStyle", { length: 100 }),
  contentFormat: mysqlEnum("contentFormat", ["post", "story", "reel", "banner", "anuncio", "carousel"]).default("post"),
  prompt: text("prompt"),
  aiGenerated: boolean("aiGenerated").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GeneratedMedia = typeof generatedMedia.$inferSelect;
export type InsertGeneratedMedia = typeof generatedMedia.$inferInsert;

// ==========================================
// SCHEDULING & POSTS
// ==========================================

export const scheduledPosts = mysqlTable("scheduled_posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workspaceId: int("workspaceId"),
  assignedTo: int("assignedTo"),
  // Suporte a imagens (legado) e mídias (novo)
  imageId: int("imageId"), // opcional agora
  mediaId: int("mediaId"), // referência para generatedMedia
  projectId: int("projectId"),
  // Tipo de mídia e formato
  mediaType: mysqlEnum("mediaType", ["image", "video", "gif", "carousel"]).default("image").notNull(),
  contentFormat: mysqlEnum("contentFormat", ["post", "story", "reel", "carousel"]).default("post").notNull(),
  platform: mysqlEnum("platform", ["facebook", "instagram", "tiktok", "whatsapp", "both", "all"]).notNull(),
  caption: text("caption"),
  // Campos específicos para vídeo
  videoUrl: text("videoUrl"),
  videoKey: varchar("videoKey", { length: 500 }),
  thumbnailUrl: text("thumbnailUrl"),
  duration: int("duration"), // duração em segundos
  // Campos para Reels/Stories
  coverImageUrl: text("coverImageUrl"),
  musicTrack: varchar("musicTrack", { length: 255 }),
  hashtags: text("hashtags"),
  // Agendamento e status
  scheduledFor: timestamp("scheduledFor").notNull(),
  status: mysqlEnum("status", ["draft", "pending_approval", "approved", "scheduled", "published", "failed", "cancelled"]).default("draft").notNull(),
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"]).default("pending"),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  errorMessage: text("errorMessage"),
  retryCount: int("retryCount").default(0).notNull(),
  publishedAt: timestamp("publishedAt"),
  // IDs de publicação nas plataformas
  facebookPostId: varchar("facebookPostId", { length: 255 }),
  instagramPostId: varchar("instagramPostId", { length: 255 }),
  tiktokPostId: varchar("tiktokPostId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  workspaceIdIdx: index("workspaceId_idx").on(table.workspaceId),
  statusIdx: index("status_idx").on(table.status),
  scheduledForIdx: index("scheduledFor_idx").on(table.scheduledFor),
  mediaTypeIdx: index("mediaType_idx").on(table.mediaType),
}));

export const postComments = mysqlTable("post_comments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const postVersions = mysqlTable("post_versions", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  caption: text("caption").notNull(),
  imageId: int("imageId").notNull(),
  versionNumber: int("versionNumber").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type InsertScheduledPost = typeof scheduledPosts.$inferInsert;

// ==========================================
// CAMPAIGNS & ANALYTICS
// ==========================================

export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  name: varchar("name", { length: 255 }).notNull(),
  platform: varchar("platform", { length: 50 }).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  metrics: json("metrics").$type<{
    impressions?: number;
    reach?: number;
    engagement?: number;
    clicks?: number;
    conversions?: number;
    spend?: number;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

export const recommendations = mysqlTable("recommendations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  type: mysqlEnum("type", ["posting_time", "product_boost", "lead_generation", "traffic_optimization"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = typeof recommendations.$inferInsert;

// ==========================================
// TAGS & ORGANIZATION
// ==========================================

export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }).default("#3b82f6").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

export const campaignTags = mysqlTable("campaign_tags", {
  campaignId: int("campaignId").notNull(),
  tagId: int("tagId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.campaignId, table.tagId] }),
}));

export type CampaignTag = typeof campaignTags.$inferSelect;
export type InsertCampaignTag = typeof campaignTags.$inferInsert;

// ==========================================
// TEMPLATES
// ==========================================

export const promptTemplates = mysqlTable("prompt_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  template: text("template").notNull(),
  variables: json("variables").$type<string[]>(),
  isPublic: boolean("isPublic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PromptTemplate = typeof promptTemplates.$inferSelect;
export type InsertPromptTemplate = typeof promptTemplates.$inferInsert;

// ==========================================
// WEBHOOKS
// ==========================================

export const webhookConfigs = mysqlTable("webhook_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  source: varchar("source", { length: 100 }).notNull(),
  webhookUrl: text("webhookUrl").notNull(),
  webhookSecret: text("webhookSecret").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WebhookConfig = typeof webhookConfigs.$inferSelect;
export type InsertWebhookConfig = typeof webhookConfigs.$inferInsert;

export const webhookEvents = mysqlTable("webhook_events", {
  id: int("id").autoincrement().primaryKey(),
  webhookConfigId: int("webhookConfigId").notNull(),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  payload: json("payload").$type<Record<string, unknown>>(),
  status: mysqlEnum("status", ["pending", "processed", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = typeof webhookEvents.$inferInsert;

// ==========================================
// PLATFORM CREDENTIALS
// ==========================================

export const platformCredentials = mysqlTable("platform_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  platform: mysqlEnum("platform", ["facebook", "instagram", "tiktok", "whatsapp"]).notNull(),
  accountName: varchar("accountName", { length: 255 }).notNull(),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  isEncrypted: boolean("isEncrypted").default(true).notNull(),
  accountId: varchar("accountId", { length: 255 }).notNull(),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlatformCredentials = typeof platformCredentials.$inferSelect;
export type InsertPlatformCredentials = typeof platformCredentials.$inferInsert;

// ==========================================
// MULTI-PLATFORM POSTS
// ==========================================

export const multiPlatformPosts = mysqlTable("multi_platform_posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  platforms: json("platforms").$type<string[]>().notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  status: mysqlEnum("status", ["draft", "scheduled", "published", "failed"]).default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MultiPlatformPost = typeof multiPlatformPosts.$inferSelect;
export type InsertMultiPlatformPost = typeof multiPlatformPosts.$inferInsert;

// ==========================================
// USER SETTINGS
// ==========================================

export const userAdminSettings = mysqlTable("user_admin_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  theme: varchar("theme", { length: 50 }).default("light").notNull(),
  timezone: varchar("timezone", { length: 100 }).default("America/Sao_Paulo").notNull(),
  language: varchar("language", { length: 10 }).default("pt-BR").notNull(),
  notificationsEnabled: boolean("notificationsEnabled").default(true).notNull(),
  emailNotifications: boolean("emailNotifications").default(true).notNull(),
  defaultPlatforms: json("defaultPlatforms").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserAdminSettings = typeof userAdminSettings.$inferSelect;
export type InsertUserAdminSettings = typeof userAdminSettings.$inferInsert;

// ==========================================
// BILLING & SUBSCRIPTIONS
// ==========================================

export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  priceMonthly: int("priceMonthly").notNull(),
  priceYearly: int("priceYearly"),
  stripePriceIdMonthly: varchar("stripePriceIdMonthly", { length: 255 }),
  stripePriceIdYearly: varchar("stripePriceIdYearly", { length: 255 }),
  description: text("description"),
  features: json("features").$type<string[]>(),
  maxPosts: int("maxPosts"),
  maxPlatforms: int("maxPlatforms"),
  maxUsers: int("maxUsers"),
  maxCampaigns: int("maxCampaigns"),
  hasAnalytics: boolean("hasAnalytics").default(false).notNull(),
  hasCompetitorAnalysis: boolean("hasCompetitorAnalysis").default(false).notNull(),
  hasWhiteLabel: boolean("hasWhiteLabel").default(false).notNull(),
  hasAPI: boolean("hasAPI").default(false).notNull(),
  supportLevel: varchar("supportLevel", { length: 50 }).default("email").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planId: int("planId").notNull(),
  mercadopagoCustomerId: varchar("mercadopagoCustomerId", { length: 255 }),
  mercadopagoSubscriptionId: varchar("mercadopagoSubscriptionId", { length: 255 }),
  status: mysqlEnum("status", ["active", "paused", "canceled", "past_due"]).default("active").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  canceledAt: timestamp("canceledAt"),
  trialEndsAt: timestamp("trialEndsAt"),
  isTrialActive: boolean("isTrialActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subscriptionId: int("subscriptionId"),
  mercadopagoPaymentId: varchar("mercadopagoPaymentId", { length: 255 }),
  mercadopagoPreferenceId: varchar("mercadopagoPreferenceId", { length: 255 }),
  amount: int("amount").notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  status: mysqlEnum("status", ["succeeded", "pending", "failed", "refunded"]).default("pending").notNull(),
  description: text("description"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

export const usageTracking = mysqlTable("usage_tracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // formato: YYYY-MM
  imagesGenerated: int("imagesGenerated").default(0).notNull(),
  captionsGenerated: int("captionsGenerated").default(0).notNull(),
  postsScheduled: int("postsScheduled").default(0).notNull(),
  postsPublished: int("postsPublished").default(0).notNull(),
  postsCreated: int("postsCreated").default(0).notNull(),
  campaignsCreated: int("campaignsCreated").default(0).notNull(),
  platformsConnected: int("platformsConnected").default(0).notNull(),
  usersInvited: int("usersInvited").default(0).notNull(),
  apiCalls: int("apiCalls").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = typeof usageTracking.$inferInsert;

// ==========================================
// COMPETITOR ANALYSIS
// ==========================================

export const competitors = mysqlTable("competitors", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  platform: mysqlEnum("platform", ["facebook", "instagram", "tiktok"]).notNull(),
  accountId: varchar("accountId", { length: 255 }).notNull(),
  accountUrl: text("accountUrl"),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Competitor = typeof competitors.$inferSelect;
export type InsertCompetitor = typeof competitors.$inferInsert;

export const competitorPosts = mysqlTable("competitor_posts", {
  id: int("id").autoincrement().primaryKey(),
  competitorId: int("competitorId").notNull(),
  postId: varchar("postId", { length: 255 }).notNull(),
  caption: text("caption"),
  mediaUrl: text("mediaUrl"),
  mediaType: varchar("mediaType", { length: 50 }),
  impressions: int("impressions").default(0).notNull(),
  reach: int("reach").default(0).notNull(),
  engagement: int("engagement").default(0).notNull(),
  likes: int("likes").default(0).notNull(),
  comments: int("comments").default(0).notNull(),
  shares: int("shares").default(0).notNull(),
  saves: int("saves").default(0).notNull(),
  hashtags: json("hashtags").$type<string[]>(),
  mentions: json("mentions").$type<string[]>(),
  postUrl: text("postUrl"),
  publishedAt: timestamp("publishedAt").notNull(),
  collectedAt: timestamp("collectedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CompetitorPost = typeof competitorPosts.$inferSelect;
export type InsertCompetitorPost = typeof competitorPosts.$inferInsert;

export const competitorDailyMetrics = mysqlTable("competitor_daily_metrics", {
  id: int("id").autoincrement().primaryKey(),
  competitorId: int("competitorId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  followers: int("followers").default(0).notNull(),
  followersGrowth: int("followersGrowth").default(0).notNull(),
  postsCount: int("postsCount").default(0).notNull(),
  totalImpressions: int("totalImpressions").default(0).notNull(),
  totalReach: int("totalReach").default(0).notNull(),
  totalEngagement: int("totalEngagement").default(0).notNull(),
  averageEngagementRate: varchar("averageEngagementRate", { length: 10 }).default("0.00").notNull(),
  topPostId: varchar("topPostId", { length: 255 }),
  topPostEngagement: int("topPostEngagement").default(0).notNull(),
  bestPostingHour: varchar("bestPostingHour", { length: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CompetitorDailyMetrics = typeof competitorDailyMetrics.$inferSelect;
export type InsertCompetitorDailyMetrics = typeof competitorDailyMetrics.$inferInsert;

export const competitorHashtags = mysqlTable("competitor_hashtags", {
  id: int("id").autoincrement().primaryKey(),
  competitorId: int("competitorId").notNull(),
  hashtag: varchar("hashtag", { length: 255 }).notNull(),
  frequency: int("frequency").default(0).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  engagementTotal: int("engagementTotal").default(0).notNull(),
  engagementAverage: varchar("engagementAverage", { length: 10 }).default("0.00").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompetitorHashtag = typeof competitorHashtags.$inferSelect;
export type InsertCompetitorHashtag = typeof competitorHashtags.$inferInsert;

export const competitorPostingSchedule = mysqlTable("competitor_posting_schedule", {
  id: int("id").autoincrement().primaryKey(),
  competitorId: int("competitorId").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(),
  hour: int("hour").notNull(),
  postsCount: int("postsCount").default(0).notNull(),
  averageEngagement: varchar("averageEngagement", { length: 10 }).default("0.00").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompetitorPostingSchedule = typeof competitorPostingSchedule.$inferSelect;
export type InsertCompetitorPostingSchedule = typeof competitorPostingSchedule.$inferInsert;

// ==========================================
// WHATSAPP BUSINESS INTEGRATION
// ==========================================

export const whatsappContacts = mysqlTable("whatsapp_contacts", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  company: varchar("company", { length: 255 }),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  lastMessageAt: timestamp("lastMessageAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  workspacePhoneIdx: index("workspace_phone_idx").on(table.workspaceId, table.phoneNumber),
}));

export type WhatsAppContact = typeof whatsappContacts.$inferSelect;
export type InsertWhatsAppContact = typeof whatsappContacts.$inferInsert;

export const whatsappConversations = mysqlTable("whatsapp_conversations", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  contactId: int("contactId").notNull(),
  status: mysqlEnum("status", ["active", "archived", "blocked"]).default("active").notNull(),
  unreadCount: int("unreadCount").default(0).notNull(),
  lastMessageId: int("lastMessageId"),
  lastMessageAt: timestamp("lastMessageAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  workspaceContactIdx: index("workspace_contact_idx").on(table.workspaceId, table.contactId),
  statusIdx: index("conv_status_idx").on(table.status),
}));

export type WhatsAppConversation = typeof whatsappConversations.$inferSelect;
export type InsertWhatsAppConversation = typeof whatsappConversations.$inferInsert;

export const whatsappMessages = mysqlTable("whatsapp_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  waMessageId: varchar("waMessageId", { length: 255 }),
  direction: mysqlEnum("direction", ["incoming", "outgoing"]).notNull(),
  type: mysqlEnum("type", ["text", "image", "video", "audio", "document", "template", "interactive"]).default("text").notNull(),
  content: text("content"),
  mediaUrl: text("mediaUrl"),
  templateName: varchar("templateName", { length: 255 }),
  status: mysqlEnum("status", ["pending", "sent", "delivered", "read", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  metadata: json("metadata"),
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  conversationIdx: index("conversation_idx").on(table.conversationId),
  waMessageIdIdx: index("wa_message_id_idx").on(table.waMessageId),
  directionIdx: index("msg_direction_idx").on(table.direction),
}));

export type WhatsAppMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsAppMessage = typeof whatsappMessages.$inferInsert;

export const whatsappApprovalRequests = mysqlTable("whatsapp_approval_requests", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  postId: int("postId").notNull(),
  contactId: int("contactId").notNull(),
  conversationId: int("conversationId").notNull(),
  messageId: int("messageId"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "expired"]).default("pending").notNull(),
  responseMessage: text("responseMessage"),
  respondedAt: timestamp("respondedAt"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  postIdx: index("approval_post_idx").on(table.postId),
  contactIdx: index("approval_contact_idx").on(table.contactId),
  statusIdx: index("approval_status_idx").on(table.status),
}));

export type WhatsAppApprovalRequest = typeof whatsappApprovalRequests.$inferSelect;
export type InsertWhatsAppApprovalRequest = typeof whatsappApprovalRequests.$inferInsert;

export const whatsappNotificationSettings = mysqlTable("whatsapp_notification_settings", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull().unique(),
  phoneNumberId: varchar("phoneNumberId", { length: 255 }),
  accessToken: text("accessToken"),
  businessAccountId: varchar("businessAccountId", { length: 255 }),
  webhookVerifyToken: varchar("webhookVerifyToken", { length: 255 }),
  notifyOnPostPublished: boolean("notifyOnPostPublished").default(true).notNull(),
  notifyOnPostFailed: boolean("notifyOnPostFailed").default(true).notNull(),
  notifyOnApprovalNeeded: boolean("notifyOnApprovalNeeded").default(true).notNull(),
  notifyOnNewComment: boolean("notifyOnNewComment").default(false).notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsAppNotificationSettings = typeof whatsappNotificationSettings.$inferSelect;
export type InsertWhatsAppNotificationSettings = typeof whatsappNotificationSettings.$inferInsert;


// ==========================================
// CAPTION HISTORY & FAVORITES
// ==========================================

export const captionHistory = mysqlTable("caption_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  topic: text("topic").notNull(),
  tone: varchar("tone", { length: 50 }).notNull(),
  platform: varchar("platform", { length: 50 }).notNull(),
  niche: varchar("niche", { length: 100 }),
  generatedCaption: text("generatedCaption").notNull(),
  includeHashtags: boolean("includeHashtags").default(true).notNull(),
  includeEmojis: boolean("includeEmojis").default(true).notNull(),
  includeCTA: boolean("includeCTA").default(false).notNull(),
  isFavorite: boolean("isFavorite").default(false).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("caption_userId_idx").on(table.userId),
  isFavoriteIdx: index("caption_isFavorite_idx").on(table.isFavorite),
}));

export type CaptionHistory = typeof captionHistory.$inferSelect;
export type InsertCaptionHistory = typeof captionHistory.$inferInsert;

// ==========================================
// PROMPT HISTORY (for image generation)
// ==========================================

export const promptHistory = mysqlTable("prompt_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  prompt: text("prompt").notNull(),
  visualStyle: varchar("visualStyle", { length: 100 }),
  contentType: varchar("contentType", { length: 100 }),
  imageUrl: text("imageUrl"),
  isFavorite: boolean("isFavorite").default(false).notNull(),
  usageCount: int("usageCount").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastUsedAt: timestamp("lastUsedAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("prompt_userId_idx").on(table.userId),
  isFavoriteIdx: index("prompt_isFavorite_idx").on(table.isFavorite),
}));

export type PromptHistory = typeof promptHistory.$inferSelect;
export type InsertPromptHistory = typeof promptHistory.$inferInsert;

// ==========================================
// POST TEMPLATES
// ==========================================

export const postTemplates = mysqlTable("post_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  niche: varchar("niche", { length: 100 }).notNull(),
  platform: varchar("platform", { length: 50 }).notNull(),
  contentType: varchar("contentType", { length: 50 }).notNull(),
  promptTemplate: text("promptTemplate").notNull(),
  captionTemplate: text("captionTemplate"),
  hashtagSuggestions: text("hashtagSuggestions"),
  visualStyle: varchar("visualStyle", { length: 100 }),
  thumbnailUrl: text("thumbnailUrl"),
  isPremium: boolean("isPremium").default(false).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  nicheIdx: index("template_niche_idx").on(table.niche),
  categoryIdx: index("template_category_idx").on(table.category),
  platformIdx: index("template_platform_idx").on(table.platform),
}));

export type PostTemplate = typeof postTemplates.$inferSelect;
export type InsertPostTemplate = typeof postTemplates.$inferInsert;

// Favoritos de templates por usuário
export const userTemplates = mysqlTable("user_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  templateId: int("templateId").notNull(),
  isFavorite: boolean("isFavorite").default(false).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userTemplate_userId_idx").on(table.userId),
  templateIdIdx: index("userTemplate_templateId_idx").on(table.templateId),
}));

// ==========================================
// SOCIAL PLATFORM CONNECTIONS
// ==========================================

export const socialConnections = mysqlTable("social_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  platform: mysqlEnum("platform", ["instagram", "tiktok", "facebook", "twitter", "linkedin", "youtube"]).notNull(),
  accountId: varchar("accountId", { length: 255 }).notNull(),
  accountName: varchar("accountName", { length: 255 }),
  accountUsername: varchar("accountUsername", { length: 255 }),
  accountAvatar: text("accountAvatar"),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  scopes: text("scopes"),
  isActive: boolean("isActive").default(true).notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("social_userId_idx").on(table.userId),
  platformIdx: index("social_platform_idx").on(table.platform),
}));

export type SocialConnection = typeof socialConnections.$inferSelect;
export type InsertSocialConnection = typeof socialConnections.$inferInsert;


// ==========================================
// GENERATION HISTORY
// ==========================================

export const generationHistory = mysqlTable("generation_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // "image" | "caption"
  prompt: text("prompt").notNull(),
  result: text("result"), // URL da imagem ou texto da legenda
  metadata: text("metadata"), // JSON com dados extras
  isFavorite: boolean("isFavorite").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GenerationHistory = typeof generationHistory.$inferSelect;
export type InsertGenerationHistory = typeof generationHistory.$inferInsert;


// ==========================================
// NOTIFICATIONS
// ==========================================

export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["success", "error", "info", "warning"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  actionUrl: text("actionUrl"),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("notification_userId_idx").on(table.userId),
  readIdx: index("notification_read_idx").on(table.read),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
