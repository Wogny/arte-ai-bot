CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(255) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int,
	`details` json,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaign_tags` (
	`campaignId` int NOT NULL,
	`tagId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaign_tags_campaignId_tagId_pk` PRIMARY KEY(`campaignId`,`tagId`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`name` varchar(255) NOT NULL,
	`platform` varchar(50) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`metrics` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competitor_daily_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competitorId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`followers` int NOT NULL DEFAULT 0,
	`followersGrowth` int NOT NULL DEFAULT 0,
	`postsCount` int NOT NULL DEFAULT 0,
	`totalImpressions` int NOT NULL DEFAULT 0,
	`totalReach` int NOT NULL DEFAULT 0,
	`totalEngagement` int NOT NULL DEFAULT 0,
	`averageEngagementRate` varchar(10) NOT NULL DEFAULT '0.00',
	`topPostId` varchar(255),
	`topPostEngagement` int NOT NULL DEFAULT 0,
	`bestPostingHour` varchar(2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `competitor_daily_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competitor_hashtags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competitorId` int NOT NULL,
	`hashtag` varchar(255) NOT NULL,
	`frequency` int NOT NULL DEFAULT 0,
	`lastUsedAt` timestamp,
	`engagementTotal` int NOT NULL DEFAULT 0,
	`engagementAverage` varchar(10) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `competitor_hashtags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competitor_posting_schedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competitorId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`hour` int NOT NULL,
	`postsCount` int NOT NULL DEFAULT 0,
	`averageEngagement` varchar(10) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `competitor_posting_schedule_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competitor_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competitorId` int NOT NULL,
	`postId` varchar(255) NOT NULL,
	`caption` text,
	`mediaUrl` text,
	`mediaType` varchar(50),
	`impressions` int NOT NULL DEFAULT 0,
	`reach` int NOT NULL DEFAULT 0,
	`engagement` int NOT NULL DEFAULT 0,
	`likes` int NOT NULL DEFAULT 0,
	`comments` int NOT NULL DEFAULT 0,
	`shares` int NOT NULL DEFAULT 0,
	`saves` int NOT NULL DEFAULT 0,
	`hashtags` json,
	`mentions` json,
	`postUrl` text,
	`publishedAt` timestamp NOT NULL,
	`collectedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `competitor_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`platform` enum('facebook','instagram','tiktok') NOT NULL,
	`accountId` varchar(255) NOT NULL,
	`accountUrl` text,
	`description` text,
	`category` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `competitors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `faq_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(100) NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `faq_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generated_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`prompt` text NOT NULL,
	`visualStyle` varchar(100) NOT NULL,
	`contentType` varchar(100) NOT NULL,
	`imageUrl` text NOT NULL,
	`imageKey` varchar(500) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generated_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meta_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`appId` varchar(255) NOT NULL,
	`appSecret` text NOT NULL,
	`accessToken` text NOT NULL,
	`isEncrypted` boolean NOT NULL DEFAULT true,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meta_credentials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `multi_platform_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`imageUrl` text,
	`platforms` json NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`status` enum('draft','scheduled','published','failed') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`approvedBy` int,
	`approvedAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `multi_platform_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `outgoing_webhooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`url` text NOT NULL,
	`events` json NOT NULL,
	`secret` varchar(255) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `outgoing_webhooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subscriptionId` int,
	`stripePaymentIntentId` varchar(255),
	`stripeInvoiceId` varchar(255),
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'BRL',
	`status` enum('succeeded','pending','failed','refunded') NOT NULL DEFAULT 'pending',
	`description` text,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platform_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('facebook','instagram','tiktok','whatsapp') NOT NULL,
	`accountName` varchar(255) NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`isEncrypted` boolean NOT NULL DEFAULT true,
	`accountId` varchar(255) NOT NULL,
	`expiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_credentials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `post_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`userId` int NOT NULL,
	`caption` text NOT NULL,
	`imageId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `post_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`niche` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prompt_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`template` text NOT NULL,
	`variables` json,
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prompt_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`type` enum('posting_time','product_boost','lead_generation','traffic_optimization') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduled_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int,
	`assignedTo` int,
	`imageId` int NOT NULL,
	`projectId` int,
	`platform` enum('facebook','instagram','both') NOT NULL,
	`caption` text,
	`scheduledFor` timestamp NOT NULL,
	`status` enum('draft','pending_approval','approved','scheduled','published','failed','cancelled') NOT NULL DEFAULT 'draft',
	`approvalStatus` enum('pending','approved','rejected') DEFAULT 'pending',
	`approvedBy` int,
	`approvedAt` timestamp,
	`errorMessage` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scheduled_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`priceMonthly` int NOT NULL,
	`priceYearly` int,
	`stripePriceIdMonthly` varchar(255),
	`stripePriceIdYearly` varchar(255),
	`description` text,
	`features` json,
	`maxPosts` int,
	`maxPlatforms` int,
	`maxUsers` int,
	`maxCampaigns` int,
	`hasAnalytics` boolean NOT NULL DEFAULT false,
	`hasCompetitorAnalysis` boolean NOT NULL DEFAULT false,
	`hasWhiteLabel` boolean NOT NULL DEFAULT false,
	`hasAPI` boolean NOT NULL DEFAULT false,
	`supportLevel` varchar(50) NOT NULL DEFAULT 'email',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscription_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`status` enum('active','paused','canceled','past_due') NOT NULL DEFAULT 'active',
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`canceledAt` timestamp,
	`trialEndsAt` timestamp,
	`isTrialActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subject` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(7) NOT NULL DEFAULT '#3b82f6',
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usage_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`postsCreated` int NOT NULL DEFAULT 0,
	`campaignsCreated` int NOT NULL DEFAULT 0,
	`platformsConnected` int NOT NULL DEFAULT 0,
	`usersInvited` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `usage_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_admin_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`theme` varchar(50) NOT NULL DEFAULT 'light',
	`timezone` varchar(100) NOT NULL DEFAULT 'America/Sao_Paulo',
	`language` varchar(10) NOT NULL DEFAULT 'pt-BR',
	`notificationsEnabled` boolean NOT NULL DEFAULT true,
	`emailNotifications` boolean NOT NULL DEFAULT true,
	`defaultPlatforms` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_admin_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_admin_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `webhook_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`source` varchar(100) NOT NULL,
	`webhookUrl` text NOT NULL,
	`webhookSecret` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhook_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`webhookConfigId` int NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`payload` json,
	`status` enum('pending','processed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhook_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_approval_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`postId` int NOT NULL,
	`contactId` int NOT NULL,
	`conversationId` int NOT NULL,
	`messageId` int,
	`status` enum('pending','approved','rejected','expired') NOT NULL DEFAULT 'pending',
	`responseMessage` text,
	`respondedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_approval_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`name` varchar(255),
	`email` varchar(255),
	`company` varchar(255),
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastMessageAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`contactId` int NOT NULL,
	`status` enum('active','archived','blocked') NOT NULL DEFAULT 'active',
	`unreadCount` int NOT NULL DEFAULT 0,
	`lastMessageId` int,
	`lastMessageAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`waMessageId` varchar(255),
	`direction` enum('incoming','outgoing') NOT NULL,
	`type` enum('text','image','video','audio','document','template','interactive') NOT NULL DEFAULT 'text',
	`content` text,
	`mediaUrl` text,
	`templateName` varchar(255),
	`status` enum('pending','sent','delivered','read','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`metadata` json,
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_notification_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`phoneNumberId` varchar(255),
	`accessToken` text,
	`businessAccountId` varchar(255),
	`webhookVerifyToken` varchar(255),
	`notifyOnPostPublished` boolean NOT NULL DEFAULT true,
	`notifyOnPostFailed` boolean NOT NULL DEFAULT true,
	`notifyOnApprovalNeeded` boolean NOT NULL DEFAULT true,
	`notifyOnNewComment` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_notification_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `whatsapp_notification_settings_workspaceId_unique` UNIQUE(`workspaceId`)
);
--> statement-breakpoint
CREATE TABLE `workspace_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`email` varchar(255) NOT NULL,
	`role` enum('admin','editor','viewer') NOT NULL DEFAULT 'editor',
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`status` enum('pending','accepted','expired') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspace_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspace_invites_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `workspace_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('admin','editor','revisor','viewer') NOT NULL DEFAULT 'editor',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspace_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`ownerId` int NOT NULL,
	`apiKey` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspaces_apiKey_unique` UNIQUE(`apiKey`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `twoFactorSecret` text;--> statement-breakpoint
ALTER TABLE `users` ADD `isTwoFactorEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `workspaceId_idx` ON `audit_logs` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `audit_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `scheduled_posts` (`userId`);--> statement-breakpoint
CREATE INDEX `workspaceId_idx` ON `scheduled_posts` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `scheduled_posts` (`status`);--> statement-breakpoint
CREATE INDEX `scheduledFor_idx` ON `scheduled_posts` (`scheduledFor`);--> statement-breakpoint
CREATE INDEX `approval_post_idx` ON `whatsapp_approval_requests` (`postId`);--> statement-breakpoint
CREATE INDEX `approval_contact_idx` ON `whatsapp_approval_requests` (`contactId`);--> statement-breakpoint
CREATE INDEX `approval_status_idx` ON `whatsapp_approval_requests` (`status`);--> statement-breakpoint
CREATE INDEX `workspace_phone_idx` ON `whatsapp_contacts` (`workspaceId`,`phoneNumber`);--> statement-breakpoint
CREATE INDEX `workspace_contact_idx` ON `whatsapp_conversations` (`workspaceId`,`contactId`);--> statement-breakpoint
CREATE INDEX `conv_status_idx` ON `whatsapp_conversations` (`status`);--> statement-breakpoint
CREATE INDEX `conversation_idx` ON `whatsapp_messages` (`conversationId`);--> statement-breakpoint
CREATE INDEX `wa_message_id_idx` ON `whatsapp_messages` (`waMessageId`);--> statement-breakpoint
CREATE INDEX `msg_direction_idx` ON `whatsapp_messages` (`direction`);