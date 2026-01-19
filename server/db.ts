import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  metaCredentials,
  InsertMetaCredential,
  MetaCredential,
  projects,
  InsertProject,
  Project,
  generatedImages,
  InsertGeneratedImage,
  GeneratedImage,
  generatedMedia,
  InsertGeneratedMedia,
  GeneratedMedia,
  scheduledPosts,
  InsertScheduledPost,
  ScheduledPost,
  campaigns,
  InsertCampaign,
  Campaign,
  recommendations,
  InsertRecommendation,
  Recommendation,
  tags,
  InsertTag,
  Tag,
  campaignTags,
  InsertCampaignTag,
  platformCredentials,
  InsertPlatformCredentials,
  PlatformCredentials,
  multiPlatformPosts,
  InsertMultiPlatformPost,
  MultiPlatformPost,
  userAdminSettings,
  InsertUserAdminSettings,
  UserAdminSettings,
  competitors,
  InsertCompetitor,
  Competitor,
  competitorPosts,
  InsertCompetitorPost,
  CompetitorPost,
  competitorDailyMetrics,
  InsertCompetitorDailyMetrics,
  CompetitorDailyMetrics,
  promptTemplates,
  InsertPromptTemplate,
  PromptTemplate,
  webhookConfigs,
  InsertWebhookConfig,
  WebhookConfig,
  webhookEvents,
  InsertWebhookEvent,
  WebhookEvent,
  auditLogs,
  workspaces,
  workspaceMembers,
  generationHistory,
  InsertGenerationHistory,
  GenerationHistory,
  subscriptions,
  usageTracking,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER OPERATIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.emailVerified !== undefined) {
      values.emailVerified = user.emailVerified;
      updateSet.emailVerified = user.emailVerified;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ META CREDENTIALS OPERATIONS ============

export async function saveMetaCredentials(credential: InsertMetaCredential): Promise<MetaCredential> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(metaCredentials)
    .set({ isActive: false })
    .where(eq(metaCredentials.userId, credential.userId));

  const result = await db.insert(metaCredentials).values(credential);
  const inserted = await db.select().from(metaCredentials).where(eq(metaCredentials.id, Number(result[0].insertId))).limit(1);
  return inserted[0]!;
}

export async function getActiveMetaCredentials(userId: number): Promise<MetaCredential | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(metaCredentials)
    .where(and(eq(metaCredentials.userId, userId), eq(metaCredentials.isActive, true)))
    .limit(1);
  return result[0];
}

// ============ PROJECT OPERATIONS ============

export async function createProject(project: InsertProject): Promise<Project> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projects).values(project);
  const inserted = await db.select().from(projects).where(eq(projects.id, Number(result[0].insertId))).limit(1);
  return inserted[0]!;
}

export async function getUserProjects(userId: number): Promise<Project[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.createdAt));
}

export async function getProjectById(projectId: number, userId: number): Promise<Project | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId))).limit(1);
  return result[0];
}

export async function updateProject(projectId: number, userId: number, data: Partial<InsertProject>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(projects).set(data).where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
}

export async function deleteProject(projectId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
}

// ============ GENERATED IMAGES OPERATIONS ============

export async function saveGeneratedImage(image: InsertGeneratedImage): Promise<GeneratedImage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(generatedImages).values(image);
  const inserted = await db.select().from(generatedImages).where(eq(generatedImages.id, Number(result[0].insertId))).limit(1);
  return inserted[0]!;
}

export async function getUserImages(userId: number, projectId?: number): Promise<GeneratedImage[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = projectId 
    ? and(eq(generatedImages.userId, userId), eq(generatedImages.projectId, projectId))
    : eq(generatedImages.userId, userId);

  return await db.select().from(generatedImages)
    .where(conditions)
    .orderBy(desc(generatedImages.createdAt));
}

export async function getImageById(imageId: number, userId: number): Promise<GeneratedImage | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(generatedImages).where(and(eq(generatedImages.id, imageId), eq(generatedImages.userId, userId))).limit(1);
  return result[0];
}

export async function deleteImage(imageId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(generatedImages).where(and(eq(generatedImages.id, imageId), eq(generatedImages.userId, userId)));
}

// ============ SCHEDULED POSTS OPERATIONS ============

export async function createScheduledPost(post: InsertScheduledPost): Promise<ScheduledPost> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(scheduledPosts).values(post);
  const inserted = await db.select().from(scheduledPosts).where(eq(scheduledPosts.id, Number(result[0].insertId))).limit(1);
  return inserted[0]!;
}

export async function getUserScheduledPosts(userId: number): Promise<ScheduledPost[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(scheduledPosts)
    .where(eq(scheduledPosts.userId, userId))
    .orderBy(desc(scheduledPosts.scheduledFor));
}

export async function getScheduledPostById(postId: number, userId: number): Promise<ScheduledPost | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(scheduledPosts).where(and(eq(scheduledPosts.id, postId), eq(scheduledPosts.userId, userId))).limit(1);
  return result[0];
}

export async function updatePostStatus(
  postId: number, 
  userId: number,
  status: "draft" | "pending_approval" | "approved" | "scheduled" | "published" | "failed" | "cancelled",
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  if (status === "published") {
    updateData.publishedAt = new Date();
  }
  if (errorMessage) {
    updateData.errorMessage = errorMessage;
  }

  await db.update(scheduledPosts)
    .set(updateData)
    .where(and(eq(scheduledPosts.id, postId), eq(scheduledPosts.userId, userId)));
}

export async function updateScheduledPost(postId: number, userId: number, data: Partial<InsertScheduledPost>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(scheduledPosts).set(data).where(and(eq(scheduledPosts.id, postId), eq(scheduledPosts.userId, userId)));
}

export async function deleteScheduledPost(postId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(scheduledPosts).where(and(eq(scheduledPosts.id, postId), eq(scheduledPosts.userId, userId)));
}

export async function getPendingPosts(): Promise<ScheduledPost[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  return await db.select().from(scheduledPosts)
    .where(and(
      eq(scheduledPosts.status, "scheduled"),
      sql`${scheduledPosts.scheduledFor} <= ${now}`
    ))
    .orderBy(scheduledPosts.scheduledFor);
}

// ============ CAMPAIGNS OPERATIONS ============

export async function createCampaign(campaign: InsertCampaign): Promise<Campaign> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(campaigns).values(campaign);
  const inserted = await db.select().from(campaigns).where(eq(campaigns.id, Number(result[0].insertId))).limit(1);
  return inserted[0]!;
}

export async function getUserCampaigns(userId: number, projectId?: number): Promise<Campaign[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = projectId 
    ? and(eq(campaigns.userId, userId), eq(campaigns.projectId, projectId))
    : eq(campaigns.userId, userId);

  return await db.select().from(campaigns)
    .where(conditions)
    .orderBy(desc(campaigns.startDate));
}

export async function getCampaignById(campaignId: number, userId: number): Promise<Campaign | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(campaigns).where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId))).limit(1);
  return result[0];
}

export async function updateCampaign(campaignId: number, userId: number, data: Partial<InsertCampaign>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(campaigns).set(data).where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)));
}

export async function deleteCampaign(campaignId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(campaignTags).where(eq(campaignTags.campaignId, campaignId));
  await db.delete(campaigns).where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)));
}

// ============ RECOMMENDATIONS OPERATIONS ============

export async function createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(recommendations).values(recommendation);
  const inserted = await db.select().from(recommendations).where(eq(recommendations.id, Number(result[0].insertId))).limit(1);
  return inserted[0]!;
}

export async function getUserRecommendations(userId: number, unreadOnly: boolean = false): Promise<Recommendation[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = unreadOnly
    ? and(eq(recommendations.userId, userId), eq(recommendations.isRead, false))
    : eq(recommendations.userId, userId);

  return await db.select().from(recommendations)
    .where(conditions)
    .orderBy(desc(recommendations.createdAt));
}

export async function markRecommendationAsRead(recommendationId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(recommendations)
    .set({ isRead: true })
    .where(and(eq(recommendations.id, recommendationId), eq(recommendations.userId, userId)));
}

// ============ TAGS OPERATIONS ============

export async function createTag(data: InsertTag): Promise<Tag> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tags).values(data);
  const inserted = await db.select().from(tags).where(eq(tags.id, Number(result[0].insertId))).limit(1);
  return inserted[0]!;
}

export async function getUserTags(userId: number): Promise<Tag[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(tags)
    .where(eq(tags.userId, userId))
    .orderBy(desc(tags.createdAt));
}

export async function updateTag(id: number, userId: number, data: Partial<Omit<InsertTag, 'userId'>>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(tags)
    .set(data)
    .where(and(eq(tags.id, id), eq(tags.userId, userId)));
}

export async function deleteTag(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(campaignTags).where(eq(campaignTags.tagId, id));
  await db.delete(tags).where(and(eq(tags.id, id), eq(tags.userId, userId)));
}

// ============ CAMPAIGN TAGS OPERATIONS ============

export async function addTagToCampaign(campaignId: number, tagId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(campaignTags).values({ campaignId, tagId }).onDuplicateKeyUpdate({
    set: { campaignId },
  });
}

export async function removeTagFromCampaign(campaignId: number, tagId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(campaignTags).where(
    and(eq(campaignTags.campaignId, campaignId), eq(campaignTags.tagId, tagId))
  );
}

export async function getCampaignTags(campaignId: number, userId: number): Promise<Tag[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({ tag: tags }).from(tags)
    .innerJoin(campaignTags, eq(tags.id, campaignTags.tagId))
    .where(and(eq(campaignTags.campaignId, campaignId), eq(tags.userId, userId)));

  return result.map(r => r.tag);
}

// ============ PLATFORM CREDENTIALS OPERATIONS ============

export async function savePlatformCredentials(credential: InsertPlatformCredentials): Promise<PlatformCredentials> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(platformCredentials).values(credential);
  const inserted = await db.select().from(platformCredentials).where(eq(platformCredentials.id, Number(result[0].insertId))).limit(1);
  return inserted[0]!;
}

export async function getUserPlatformCredentials(userId: number, platform?: string): Promise<PlatformCredentials[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = platform
    ? and(eq(platformCredentials.userId, userId), eq(platformCredentials.platform, platform as any), eq(platformCredentials.isActive, true))
    : and(eq(platformCredentials.userId, userId), eq(platformCredentials.isActive, true));

  return await db.select().from(platformCredentials)
    .where(conditions)
    .orderBy(desc(platformCredentials.createdAt));
}

export async function getPlatformCredentialById(id: number, userId: number): Promise<PlatformCredentials | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(platformCredentials)
    .where(and(eq(platformCredentials.id, id), eq(platformCredentials.userId, userId)))
    .limit(1);
  return result[0];
}

export async function updatePlatformCredentials(id: number, userId: number, data: Partial<InsertPlatformCredentials>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(platformCredentials).set(data).where(and(eq(platformCredentials.id, id), eq(platformCredentials.userId, userId)));
}

export async function deletePlatformCredentials(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(platformCredentials).where(and(eq(platformCredentials.id, id), eq(platformCredentials.userId, userId)));
}

// ============ MULTI-PLATFORM POSTS OPERATIONS ============

export async function createMultiPlatformPost(post: InsertMultiPlatformPost): Promise<MultiPlatformPost> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(multiPlatformPosts).values(post);
  const inserted = await db.select().from(multiPlatformPosts).where(eq(multiPlatformPosts.id, Number(result[0].insertId))).limit(1);
  return inserted[0]!;
}

export async function getUserMultiPlatformPosts(userId: number): Promise<MultiPlatformPost[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(multiPlatformPosts)
    .where(eq(multiPlatformPosts.userId, userId))
    .orderBy(desc(multiPlatformPosts.scheduledAt));
}

export async function getMultiPlatformPostById(postId: number, userId: number): Promise<MultiPlatformPost | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(multiPlatformPosts).where(and(eq(multiPlatformPosts.id, postId), eq(multiPlatformPosts.userId, userId))).limit(1);
  return result[0];
}

export async function updateMultiPlatformPost(postId: number, userId: number, data: Partial<InsertMultiPlatformPost>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(multiPlatformPosts).set(data).where(and(eq(multiPlatformPosts.id, postId), eq(multiPlatformPosts.userId, userId)));
}

export async function deleteMultiPlatformPost(postId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(multiPlatformPosts).where(and(eq(multiPlatformPosts.id, postId), eq(multiPlatformPosts.userId, userId)));
}

// ============ USER ADMIN SETTINGS OPERATIONS ============

export async function getUserAdminSettings(userId: number): Promise<UserAdminSettings | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(userAdminSettings).where(eq(userAdminSettings.userId, userId)).limit(1);
  return result[0];
}

export async function upsertUserAdminSettings(userId: number, data: Partial<InsertUserAdminSettings>): Promise<UserAdminSettings> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserAdminSettings(userId);
  
  if (existing) {
    await db.update(userAdminSettings).set(data).where(eq(userAdminSettings.userId, userId));
    const updated = await db.select().from(userAdminSettings).where(eq(userAdminSettings.userId, userId)).limit(1);
    return updated[0]!;
  } else {
    const result = await db.insert(userAdminSettings).values({ userId, ...data });
    const inserted = await db.select().from(userAdminSettings).where(eq(userAdminSettings.id, Number(result[0].insertId))).limit(1);
    return inserted[0]!;
  }
}

// ============ COMPETITORS OPERATIONS ============

export async function createCompetitor(competitor: InsertCompetitor): Promise<Competitor> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(competitors).values(competitor);
  const inserted = await db.select().from(competitors).where(eq(competitors.id, Number(result[0].insertId))).limit(1);
  return inserted[0]!;
}

export async function getUserCompetitors(userId: number): Promise<Competitor[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(competitors)
    .where(eq(competitors.userId, userId))
    .orderBy(desc(competitors.createdAt));
}

export async function getCompetitorById(competitorId: number, userId: number): Promise<Competitor | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(competitors).where(and(eq(competitors.id, competitorId), eq(competitors.userId, userId))).limit(1);
  return result[0];
}

export async function updateCompetitor(competitorId: number, userId: number, data: Partial<InsertCompetitor>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(competitors).set(data).where(and(eq(competitors.id, competitorId), eq(competitors.userId, userId)));
}

export async function deleteCompetitor(competitorId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(competitorPosts).where(eq(competitorPosts.competitorId, competitorId));
  await db.delete(competitorDailyMetrics).where(eq(competitorDailyMetrics.competitorId, competitorId));
  await db.delete(competitors).where(and(eq(competitors.id, competitorId), eq(competitors.userId, userId)));
}

// ============ PROMPT TEMPLATES OPERATIONS ============

export async function createPromptTemplate(template: InsertPromptTemplate): Promise<PromptTemplate> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(promptTemplates).values(template);
  const inserted = await db.select().from(promptTemplates).where(eq(promptTemplates.id, Number(result[0].insertId))).limit(1);
  return inserted[0]!;
}

export async function getUserPromptTemplates(userId: number): Promise<PromptTemplate[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(promptTemplates)
    .where(eq(promptTemplates.userId, userId))
    .orderBy(desc(promptTemplates.createdAt));
}

export async function getPromptTemplateById(templateId: number, userId: number): Promise<PromptTemplate | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(promptTemplates).where(and(eq(promptTemplates.id, templateId), eq(promptTemplates.userId, userId))).limit(1);
  return result[0];
}

export async function updatePromptTemplate(templateId: number, userId: number, data: Partial<InsertPromptTemplate>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(promptTemplates).set(data).where(and(eq(promptTemplates.id, templateId), eq(promptTemplates.userId, userId)));
}

export async function deletePromptTemplate(templateId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(promptTemplates).where(and(eq(promptTemplates.id, templateId), eq(promptTemplates.userId, userId)));
}

// ============ WEBHOOK CONFIGS OPERATIONS ============

export async function createWebhookConfig(config: InsertWebhookConfig): Promise<WebhookConfig> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(webhookConfigs).values(config);
  const inserted = await db.select().from(webhookConfigs).where(eq(webhookConfigs.id, Number(result[0].insertId))).limit(1);
  return inserted[0]!;
}

export async function getUserWebhookConfigs(userId: number): Promise<WebhookConfig[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(webhookConfigs)
    .where(eq(webhookConfigs.userId, userId))
    .orderBy(desc(webhookConfigs.createdAt));
}

export async function getWebhookConfigById(configId: number, userId: number): Promise<WebhookConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(webhookConfigs).where(and(eq(webhookConfigs.id, configId), eq(webhookConfigs.userId, userId))).limit(1);
  return result[0];
}

export async function updateWebhookConfig(configId: number, userId: number, data: Partial<InsertWebhookConfig>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(webhookConfigs).set(data).where(and(eq(webhookConfigs.id, configId), eq(webhookConfigs.userId, userId)));
}

export async function deleteWebhookConfig(configId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(webhookEvents).where(eq(webhookEvents.webhookConfigId, configId));
  await db.delete(webhookConfigs).where(and(eq(webhookConfigs.id, configId), eq(webhookConfigs.userId, userId)));
}

// ============ AUDIT LOGS OPERATIONS ============

export async function createAuditLog(data: {
  workspaceId: number;
  userId: number;
  action: string;
  entityType: string;
  entityId?: number;
  details?: any;
  ipAddress?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(auditLogs).values(data);
}

export async function getAuditLogs(workspaceId: number, limit: number = 100): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(auditLogs)
    .where(eq(auditLogs.workspaceId, workspaceId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

// ============ DASHBOARD STATS ============

export async function getUserDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return { images: 0, projects: 0, scheduledPosts: 0, recommendations: 0 };

  const [imagesResult, projectsResult, postsResult, recsResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(generatedImages).where(eq(generatedImages.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(projects).where(eq(projects.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(scheduledPosts).where(and(eq(scheduledPosts.userId, userId), eq(scheduledPosts.status, "scheduled"))),
    db.select({ count: sql<number>`count(*)` }).from(recommendations).where(and(eq(recommendations.userId, userId), eq(recommendations.isRead, false))),
  ]);

  return {
    images: Number(imagesResult[0]?.count || 0),
    projects: Number(projectsResult[0]?.count || 0),
    scheduledPosts: Number(postsResult[0]?.count || 0),
    recommendations: Number(recsResult[0]?.count || 0),
  };
}


// ============ MEDIA OPERATIONS (Vídeos e Imagens) ============

export async function createMedia(data: InsertGeneratedMedia): Promise<GeneratedMedia> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(generatedMedia).values(data);
  const inserted = await db.select().from(generatedMedia).where(eq(generatedMedia.id, Number(result[0].insertId))).limit(1);
  return inserted[0]!;
}

export async function getUserMedia(userId: number, options?: {
  projectId?: number;
  mediaType?: "image" | "video" | "gif" | "carousel";
  limit?: number;
}): Promise<GeneratedMedia[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions = eq(generatedMedia.userId, userId);
  
  if (options?.projectId) {
    conditions = and(conditions, eq(generatedMedia.projectId, options.projectId))!;
  }
  
  if (options?.mediaType) {
    conditions = and(conditions, eq(generatedMedia.mediaType, options.mediaType))!;
  }

  const query = db.select().from(generatedMedia)
    .where(conditions)
    .orderBy(desc(generatedMedia.createdAt));

  if (options?.limit) {
    return await query.limit(options.limit);
  }

  return await query;
}

export async function getMediaById(mediaId: number, userId: number): Promise<GeneratedMedia | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(generatedMedia)
    .where(and(eq(generatedMedia.id, mediaId), eq(generatedMedia.userId, userId)))
    .limit(1);
  return result[0];
}

export async function updateMedia(mediaId: number, userId: number, data: Partial<InsertGeneratedMedia>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(generatedMedia)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(generatedMedia.id, mediaId), eq(generatedMedia.userId, userId)));
}

export async function deleteMedia(mediaId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(generatedMedia)
    .where(and(eq(generatedMedia.id, mediaId), eq(generatedMedia.userId, userId)));
}

// ============ VIDEO-SPECIFIC OPERATIONS ============

export async function getUserVideos(userId: number, projectId?: number): Promise<GeneratedMedia[]> {
  return getUserMedia(userId, { mediaType: "video", projectId });
}

export async function getRecentMedia(userId: number, limit: number = 10): Promise<GeneratedMedia[]> {
  return getUserMedia(userId, { limit });
}

export async function getMediaStats(userId: number) {
  const db = await getDb();
  if (!db) return { images: 0, videos: 0, gifs: 0, carousels: 0, total: 0 };

  const result = await db.select({
    mediaType: generatedMedia.mediaType,
    count: sql<number>`count(*)`
  })
    .from(generatedMedia)
    .where(eq(generatedMedia.userId, userId))
    .groupBy(generatedMedia.mediaType);

  const stats = { images: 0, videos: 0, gifs: 0, carousels: 0, total: 0 };
  
  for (const row of result) {
    const count = Number(row.count);
    stats.total += count;
    switch (row.mediaType) {
      case "image": stats.images = count; break;
      case "video": stats.videos = count; break;
      case "gif": stats.gifs = count; break;
      case "carousel": stats.carousels = count; break;
    }
  }

  return stats;
}

// ============ SCHEDULED POSTS WITH VIDEO SUPPORT ============

export async function createScheduledPostWithMedia(data: {
  userId: number;
  mediaId?: number;
  imageId?: number;
  projectId?: number;
  mediaType: "image" | "video" | "gif" | "carousel";
  contentFormat: "post" | "story" | "reel" | "carousel";
  platform: "facebook" | "instagram" | "tiktok" | "whatsapp" | "both" | "all";
  caption?: string;
  videoUrl?: string;
  videoKey?: string;
  thumbnailUrl?: string;
  duration?: number;
  coverImageUrl?: string;
  musicTrack?: string;
  hashtags?: string;
  scheduledFor: Date;
}): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(scheduledPosts).values({
    ...data,
    status: "draft",
  });

  const inserted = await db.select().from(scheduledPosts)
    .where(eq(scheduledPosts.id, Number(result[0].insertId)))
    .limit(1);
  
  return inserted[0]!;
}

export async function getScheduledPostsByMediaType(userId: number, mediaType?: "image" | "video" | "gif" | "carousel") {
  const db = await getDb();
  if (!db) return [];

  let conditions = eq(scheduledPosts.userId, userId);
  
  if (mediaType) {
    conditions = and(conditions, eq(scheduledPosts.mediaType, mediaType))!;
  }

  return await db.select().from(scheduledPosts)
    .where(conditions)
    .orderBy(desc(scheduledPosts.scheduledFor));
}

export async function getUpcomingReels(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(scheduledPosts)
    .where(and(
      eq(scheduledPosts.userId, userId),
      eq(scheduledPosts.contentFormat, "reel"),
      eq(scheduledPosts.status, "scheduled")
    ))
    .orderBy(scheduledPosts.scheduledFor)
    .limit(limit);
}

export async function getUpcomingStories(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(scheduledPosts)
    .where(and(
      eq(scheduledPosts.userId, userId),
      eq(scheduledPosts.contentFormat, "story"),
      eq(scheduledPosts.status, "scheduled")
    ))
    .orderBy(scheduledPosts.scheduledFor)
    .limit(limit);
}


// ============ CAPTION HISTORY OPERATIONS ============

import { 
  captionHistory, 
  InsertCaptionHistory, 
  CaptionHistory,
  promptHistory,
  InsertPromptHistory,
  PromptHistory,
  postTemplates,
  PostTemplate,
  userTemplates,
  socialConnections,
  SocialConnection,
  InsertSocialConnection,
} from "../drizzle/schema";

export async function saveCaptionHistory(data: {
  userId: number;
  topic: string;
  tone: string;
  platform: string;
  niche: string | null;
  generatedCaption: string;
  includeHashtags: boolean;
  includeEmojis: boolean;
  includeCTA: boolean;
}): Promise<CaptionHistory | null> {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db.insert(captionHistory).values({
    userId: data.userId,
    topic: data.topic,
    tone: data.tone,
    platform: data.platform,
    niche: data.niche,
    generatedCaption: data.generatedCaption,
    includeHashtags: data.includeHashtags,
    includeEmojis: data.includeEmojis,
    includeCTA: data.includeCTA,
  }).$returningId();

  const [saved] = await db.select().from(captionHistory).where(eq(captionHistory.id, result.id));
  return saved || null;
}

export async function getCaptionHistory(userId: number, limit: number = 20, offset: number = 0): Promise<CaptionHistory[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(captionHistory)
    .where(eq(captionHistory.userId, userId))
    .orderBy(desc(captionHistory.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function toggleCaptionFavorite(userId: number, captionId: number, isFavorite: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(captionHistory)
    .set({ isFavorite })
    .where(and(eq(captionHistory.id, captionId), eq(captionHistory.userId, userId)));
}

export async function getFavoriteCaptions(userId: number): Promise<CaptionHistory[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(captionHistory)
    .where(and(eq(captionHistory.userId, userId), eq(captionHistory.isFavorite, true)))
    .orderBy(desc(captionHistory.createdAt));
}

// ============ PROMPT HISTORY OPERATIONS ============

export async function savePromptHistory(data: {
  userId: number;
  prompt: string;
  visualStyle?: string;
  contentType?: string;
  imageUrl?: string;
}): Promise<PromptHistory | null> {
  const db = await getDb();
  if (!db) return null;

  // Check if prompt already exists for user
  const [existing] = await db.select()
    .from(promptHistory)
    .where(and(eq(promptHistory.userId, data.userId), eq(promptHistory.prompt, data.prompt)));

  if (existing) {
    // Update usage count and last used
    await db.update(promptHistory)
      .set({ 
        usageCount: existing.usageCount + 1,
        lastUsedAt: new Date(),
        imageUrl: data.imageUrl || existing.imageUrl,
      })
      .where(eq(promptHistory.id, existing.id));
    
    const [updated] = await db.select().from(promptHistory).where(eq(promptHistory.id, existing.id));
    return updated || null;
  }

  const [result] = await db.insert(promptHistory).values({
    userId: data.userId,
    prompt: data.prompt,
    visualStyle: data.visualStyle || null,
    contentType: data.contentType || null,
    imageUrl: data.imageUrl || null,
  }).$returningId();

  const [saved] = await db.select().from(promptHistory).where(eq(promptHistory.id, result.id));
  return saved || null;
}

export async function getPromptHistory(userId: number, limit: number = 20, offset: number = 0): Promise<PromptHistory[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(promptHistory)
    .where(eq(promptHistory.userId, userId))
    .orderBy(desc(promptHistory.lastUsedAt))
    .limit(limit)
    .offset(offset);
}

export async function togglePromptFavorite(userId: number, promptId: number, isFavorite: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(promptHistory)
    .set({ isFavorite })
    .where(and(eq(promptHistory.id, promptId), eq(promptHistory.userId, userId)));
}

export async function getFavoritePrompts(userId: number): Promise<PromptHistory[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(promptHistory)
    .where(and(eq(promptHistory.userId, userId), eq(promptHistory.isFavorite, true)))
    .orderBy(desc(promptHistory.lastUsedAt));
}

export async function deletePromptHistory(userId: number, promptId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(promptHistory)
    .where(and(eq(promptHistory.id, promptId), eq(promptHistory.userId, userId)));
}

// ============ POST TEMPLATES OPERATIONS ============

export async function getPostTemplates(filters?: {
  niche?: string;
  category?: string;
  platform?: string;
  isPremium?: boolean;
}): Promise<PostTemplate[]> {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(postTemplates);
  const conditions = [];

  if (filters?.niche) {
    conditions.push(eq(postTemplates.niche, filters.niche));
  }
  if (filters?.category) {
    conditions.push(eq(postTemplates.category, filters.category));
  }
  if (filters?.platform) {
    conditions.push(eq(postTemplates.platform, filters.platform));
  }
  if (filters?.isPremium !== undefined) {
    conditions.push(eq(postTemplates.isPremium, filters.isPremium));
  }

  if (conditions.length > 0) {
    return await query.where(and(...conditions)).orderBy(desc(postTemplates.usageCount));
  }

  return await query.orderBy(desc(postTemplates.usageCount));
}

export async function getTemplateById(templateId: number): Promise<PostTemplate | null> {
  const db = await getDb();
  if (!db) return null;

  const [template] = await db.select()
    .from(postTemplates)
    .where(eq(postTemplates.id, templateId));

  return template || null;
}

export async function incrementTemplateUsage(templateId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const [template] = await db.select().from(postTemplates).where(eq(postTemplates.id, templateId));
  if (template) {
    await db.update(postTemplates)
      .set({ usageCount: template.usageCount + 1 })
      .where(eq(postTemplates.id, templateId));
  }
}

export async function toggleUserTemplateFavorite(userId: number, templateId: number, isFavorite: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const [existing] = await db.select()
    .from(userTemplates)
    .where(and(eq(userTemplates.userId, userId), eq(userTemplates.templateId, templateId)));

  if (existing) {
    await db.update(userTemplates)
      .set({ isFavorite })
      .where(eq(userTemplates.id, existing.id));
  } else {
    await db.insert(userTemplates).values({
      userId,
      templateId,
      isFavorite,
    });
  }
}

export async function getUserFavoriteTemplates(userId: number): Promise<PostTemplate[]> {
  const db = await getDb();
  if (!db) return [];

  const favorites = await db.select()
    .from(userTemplates)
    .where(and(eq(userTemplates.userId, userId), eq(userTemplates.isFavorite, true)));

  if (favorites.length === 0) return [];

  const templateIds = favorites.map(f => f.templateId);
  return await db.select()
    .from(postTemplates)
    .where(inArray(postTemplates.id, templateIds));
}

// ============ SOCIAL CONNECTIONS OPERATIONS ============

export async function saveSocialConnection(data: InsertSocialConnection): Promise<SocialConnection | null> {
  const db = await getDb();
  if (!db) return null;

  // Check if connection already exists
  const [existing] = await db.select()
    .from(socialConnections)
    .where(and(
      eq(socialConnections.userId, data.userId),
      eq(socialConnections.platform, data.platform),
      eq(socialConnections.accountId, data.accountId)
    ));

  if (existing) {
    // Update existing connection
    await db.update(socialConnections)
      .set({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenExpiresAt: data.tokenExpiresAt,
        accountName: data.accountName,
        accountUsername: data.accountUsername,
        accountAvatar: data.accountAvatar,
        scopes: data.scopes,
        isActive: true,
      })
      .where(eq(socialConnections.id, existing.id));

    const [updated] = await db.select().from(socialConnections).where(eq(socialConnections.id, existing.id));
    return updated || null;
  }

  const [result] = await db.insert(socialConnections).values(data).$returningId();
  const [saved] = await db.select().from(socialConnections).where(eq(socialConnections.id, result.id));
  return saved || null;
}

export async function getUserSocialConnections(userId: number): Promise<SocialConnection[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(socialConnections)
    .where(and(eq(socialConnections.userId, userId), eq(socialConnections.isActive, true)));
}

export async function getSocialConnectionByPlatform(userId: number, platform: string): Promise<SocialConnection | null> {
  const db = await getDb();
  if (!db) return null;

  const [connection] = await db.select()
    .from(socialConnections)
    .where(and(
      eq(socialConnections.userId, userId),
      eq(socialConnections.platform, platform as any),
      eq(socialConnections.isActive, true)
    ));

  return connection || null;
}

export async function disconnectSocialPlatform(userId: number, connectionId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(socialConnections)
    .set({ isActive: false })
    .where(and(eq(socialConnections.id, connectionId), eq(socialConnections.userId, userId)));
}

export async function updateSocialConnectionTokens(connectionId: number, tokens: {
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(socialConnections)
    .set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: tokens.tokenExpiresAt,
      lastSyncAt: new Date(),
    })
    .where(eq(socialConnections.id, connectionId));
}


// ============ SCHEDULED POSTS ADVANCED OPERATIONS ============

export async function getPendingScheduledPosts(): Promise<ScheduledPost[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  
  return await db.select()
    .from(scheduledPosts)
    .where(and(
      eq(scheduledPosts.status, "scheduled"),
      sql`${scheduledPosts.scheduledFor} <= ${now}`
    ))
    .orderBy(scheduledPosts.scheduledFor);
}

export async function updateScheduledPostPlatformId(
  postId: number, 
  platform: "instagram" | "facebook" | "tiktok",
  platformPostId: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const updateData: Record<string, string> = {};
  if (platform === "instagram") {
    updateData.instagramPostId = platformPostId;
  } else if (platform === "facebook") {
    updateData.facebookPostId = platformPostId;
  } else if (platform === "tiktok") {
    updateData.tiktokPostId = platformPostId;
  }

  await db.update(scheduledPosts)
    .set({ ...updateData, publishedAt: new Date() })
    .where(eq(scheduledPosts.id, postId));
}

export async function incrementPostRetryCount(postId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const [post] = await db.select()
    .from(scheduledPosts)
    .where(and(eq(scheduledPosts.id, postId), eq(scheduledPosts.userId, userId)));

  if (post) {
    await db.update(scheduledPosts)
      .set({ retryCount: post.retryCount + 1 })
      .where(eq(scheduledPosts.id, postId));
  }
}

export async function getPostsScheduledForToday(userId: number): Promise<ScheduledPost[]> {
  const db = await getDb();
  if (!db) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await db.select()
    .from(scheduledPosts)
    .where(and(
      eq(scheduledPosts.userId, userId),
      sql`${scheduledPosts.scheduledFor} >= ${today}`,
      sql`${scheduledPosts.scheduledFor} < ${tomorrow}`
    ))
    .orderBy(scheduledPosts.scheduledFor);
}

export async function getPostsByDateRange(
  userId: number, 
  startDate: Date, 
  endDate: Date
): Promise<ScheduledPost[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(scheduledPosts)
    .where(and(
      eq(scheduledPosts.userId, userId),
      sql`${scheduledPosts.scheduledFor} >= ${startDate}`,
      sql`${scheduledPosts.scheduledFor} <= ${endDate}`
    ))
    .orderBy(scheduledPosts.scheduledFor);
}

export async function getPublishedPosts(userId: number, limit: number = 20): Promise<ScheduledPost[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(scheduledPosts)
    .where(and(
      eq(scheduledPosts.userId, userId),
      eq(scheduledPosts.status, "published")
    ))
    .orderBy(desc(scheduledPosts.publishedAt))
    .limit(limit);
}

export async function getFailedPosts(userId: number): Promise<ScheduledPost[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(scheduledPosts)
    .where(and(
      eq(scheduledPosts.userId, userId),
      eq(scheduledPosts.status, "failed")
    ))
    .orderBy(desc(scheduledPosts.createdAt));
}

export async function retryFailedPost(postId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(scheduledPosts)
    .set({ 
      status: "scheduled",
      retryCount: 0,
      errorMessage: null,
      scheduledFor: new Date(), // Reagendar para agora
    })
    .where(and(eq(scheduledPosts.id, postId), eq(scheduledPosts.userId, userId)));
}


// ============ GENERATION HISTORY OPERATIONS ============

export async function getGenerationHistory(
  userId: number, 
  params: { type: string; limit: number; offset: number }
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  let query = db.select()
    .from(generationHistory)
    .where(eq(generationHistory.userId, userId))
    .orderBy(desc(generationHistory.createdAt))
    .limit(params.limit)
    .offset(params.offset);

  if (params.type !== "all") {
    query = db.select()
      .from(generationHistory)
      .where(and(
        eq(generationHistory.userId, userId),
        eq(generationHistory.type, params.type)
      ))
      .orderBy(desc(generationHistory.createdAt))
      .limit(params.limit)
      .offset(params.offset);
  }

  return await query;
}

export async function getGenerationHistoryById(historyId: number, userId: number): Promise<any | null> {
  const db = await getDb();
  if (!db) return null;

  const [history] = await db.select()
    .from(generationHistory)
    .where(and(
      eq(generationHistory.id, historyId),
      eq(generationHistory.userId, userId)
    ));

  return history || null;
}

export async function saveGenerationHistory(data: {
  userId: number;
  type: string;
  prompt: string;
  result?: string;
  metadata?: string | null;
}): Promise<any> {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db.insert(generationHistory).values({
    userId: data.userId,
    type: data.type,
    prompt: data.prompt,
    result: data.result || null,
    metadata: data.metadata || null,
    isFavorite: false,
    createdAt: new Date(),
  });

  return { id: result.insertId, ...data };
}

export async function toggleGenerationFavorite(
  userId: number, 
  historyId: number, 
  isFavorite: boolean
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(generationHistory)
    .set({ isFavorite })
    .where(and(
      eq(generationHistory.id, historyId),
      eq(generationHistory.userId, userId)
    ));
}

export async function getFavoriteGenerations(userId: number, type: string): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  if (type === "all") {
    return await db.select()
      .from(generationHistory)
      .where(and(
        eq(generationHistory.userId, userId),
        eq(generationHistory.isFavorite, true)
      ))
      .orderBy(desc(generationHistory.createdAt));
  }

  return await db.select()
    .from(generationHistory)
    .where(and(
      eq(generationHistory.userId, userId),
      eq(generationHistory.isFavorite, true),
      eq(generationHistory.type, type)
    ))
    .orderBy(desc(generationHistory.createdAt));
}

export async function deleteGenerationHistory(historyId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(generationHistory)
    .where(and(
      eq(generationHistory.id, historyId),
      eq(generationHistory.userId, userId)
    ));
}

export async function searchGenerationHistory(
  userId: number, 
  query: string, 
  type: string
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const searchPattern = `%${query}%`;

  if (type === "all") {
    return await db.select()
      .from(generationHistory)
      .where(and(
        eq(generationHistory.userId, userId),
        sql`${generationHistory.prompt} LIKE ${searchPattern}`
      ))
      .orderBy(desc(generationHistory.createdAt))
      .limit(50);
  }

  return await db.select()
    .from(generationHistory)
    .where(and(
      eq(generationHistory.userId, userId),
      eq(generationHistory.type, type),
      sql`${generationHistory.prompt} LIKE ${searchPattern}`
    ))
    .orderBy(desc(generationHistory.createdAt))
    .limit(50);
}

export async function getGenerationStats(userId: number): Promise<{
  totalImages: number;
  totalCaptions: number;
  totalFavorites: number;
  thisMonth: number;
}> {
  const db = await getDb();
  if (!db) return { totalImages: 0, totalCaptions: 0, totalFavorites: 0, thisMonth: 0 };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [images] = await db.select({ count: sql<number>`count(*)` })
    .from(generationHistory)
    .where(and(
      eq(generationHistory.userId, userId),
      eq(generationHistory.type, "image")
    ));

  const [captions] = await db.select({ count: sql<number>`count(*)` })
    .from(generationHistory)
    .where(and(
      eq(generationHistory.userId, userId),
      eq(generationHistory.type, "caption")
    ));

  const [favorites] = await db.select({ count: sql<number>`count(*)` })
    .from(generationHistory)
    .where(and(
      eq(generationHistory.userId, userId),
      eq(generationHistory.isFavorite, true)
    ));

  const [thisMonth] = await db.select({ count: sql<number>`count(*)` })
    .from(generationHistory)
    .where(and(
      eq(generationHistory.userId, userId),
      sql`${generationHistory.createdAt} >= ${startOfMonth}`
    ));

  return {
    totalImages: Number(images?.count) || 0,
    totalCaptions: Number(captions?.count) || 0,
    totalFavorites: Number(favorites?.count) || 0,
    thisMonth: Number(thisMonth?.count) || 0,
  };
}


// ============ SUBSCRIPTION & USAGE OPERATIONS ============

export async function getActiveSubscription(userId: number): Promise<any | null> {
  const db = await getDb();
  if (!db) return null;

  const [subscription] = await db.select()
    .from(subscriptions)
    .where(and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.status, "active")
    ))
    .limit(1);

  return subscription || null;
}

export async function getMonthlyUsage(userId: number): Promise<{
  images: number;
  captions: number;
  scheduledPosts: number;
  platforms: number;
}> {
  const db = await getDb();
  if (!db) return { images: 0, captions: 0, scheduledPosts: 0, platforms: 0 };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Contar imagens geradas este mês
  const [imagesResult] = await db.select({ count: sql<number>`count(*)` })
    .from(generatedImages)
    .where(and(
      eq(generatedImages.userId, userId),
      sql`${generatedImages.createdAt} >= ${startOfMonth}`
    ));

  // Contar legendas geradas este mês
  const [captionsResult] = await db.select({ count: sql<number>`count(*)` })
    .from(captionHistory)
    .where(and(
      eq(captionHistory.userId, userId),
      sql`${captionHistory.createdAt} >= ${startOfMonth}`
    ));

  // Contar posts agendados este mês
  const [scheduledResult] = await db.select({ count: sql<number>`count(*)` })
    .from(scheduledPosts)
    .where(and(
      eq(scheduledPosts.userId, userId),
      sql`${scheduledPosts.createdAt} >= ${startOfMonth}`
    ));

  // Contar plataformas conectadas
  const [platformsResult] = await db.select({ count: sql<number>`count(*)` })
    .from(socialConnections)
    .where(and(
      eq(socialConnections.userId, userId),
      eq(socialConnections.isActive, true)
    ));

  return {
    images: Number(imagesResult?.count) || 0,
    captions: Number(captionsResult?.count) || 0,
    scheduledPosts: Number(scheduledResult?.count) || 0,
    platforms: Number(platformsResult?.count) || 0,
  };
}

export async function incrementMonthlyUsage(
  userId: number,
  action: "image" | "caption" | "schedule"
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Verificar se já existe registro de uso para este mês
  const [existing] = await db.select()
    .from(usageTracking)
    .where(and(
      eq(usageTracking.userId, userId),
      eq(usageTracking.month, month)
    ));

  if (existing) {
    // Atualizar contagem existente
    const updateData: any = {};
    if (action === "image") updateData.imagesGenerated = sql`${usageTracking.imagesGenerated} + 1`;
    if (action === "caption") updateData.captionsGenerated = sql`${usageTracking.captionsGenerated} + 1`;
    if (action === "schedule") updateData.postsScheduled = sql`${usageTracking.postsScheduled} + 1`;

    await db.update(usageTracking)
      .set(updateData)
      .where(eq(usageTracking.id, existing.id));
  } else {
    // Criar novo registro
    await db.insert(usageTracking).values({
      userId,
      month,
      imagesGenerated: action === "image" ? 1 : 0,
      captionsGenerated: action === "caption" ? 1 : 0,
      postsScheduled: action === "schedule" ? 1 : 0,
      postsPublished: 0,
      apiCalls: 0,
    });
  }
}
