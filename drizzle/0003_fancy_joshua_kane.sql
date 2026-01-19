CREATE TABLE `caption_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`topic` text NOT NULL,
	`tone` varchar(50) NOT NULL,
	`platform` varchar(50) NOT NULL,
	`niche` varchar(100),
	`generatedCaption` text NOT NULL,
	`includeHashtags` boolean NOT NULL DEFAULT true,
	`includeEmojis` boolean NOT NULL DEFAULT true,
	`includeCTA` boolean NOT NULL DEFAULT false,
	`isFavorite` boolean NOT NULL DEFAULT false,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `caption_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`niche` varchar(100) NOT NULL,
	`platform` varchar(50) NOT NULL,
	`contentType` varchar(50) NOT NULL,
	`promptTemplate` text NOT NULL,
	`captionTemplate` text,
	`hashtagSuggestions` text,
	`visualStyle` varchar(100),
	`thumbnailUrl` text,
	`isPremium` boolean NOT NULL DEFAULT false,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `post_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prompt_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`prompt` text NOT NULL,
	`visualStyle` varchar(100),
	`contentType` varchar(100),
	`imageUrl` text,
	`isFavorite` boolean NOT NULL DEFAULT false,
	`usageCount` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prompt_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('instagram','tiktok','facebook','twitter','linkedin','youtube') NOT NULL,
	`accountId` varchar(255) NOT NULL,
	`accountName` varchar(255),
	`accountUsername` varchar(255),
	`accountAvatar` text,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`scopes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`templateId` int NOT NULL,
	`isFavorite` boolean NOT NULL DEFAULT false,
	`usageCount` int NOT NULL DEFAULT 0,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `caption_userId_idx` ON `caption_history` (`userId`);--> statement-breakpoint
CREATE INDEX `caption_isFavorite_idx` ON `caption_history` (`isFavorite`);--> statement-breakpoint
CREATE INDEX `template_niche_idx` ON `post_templates` (`niche`);--> statement-breakpoint
CREATE INDEX `template_category_idx` ON `post_templates` (`category`);--> statement-breakpoint
CREATE INDEX `template_platform_idx` ON `post_templates` (`platform`);--> statement-breakpoint
CREATE INDEX `prompt_userId_idx` ON `prompt_history` (`userId`);--> statement-breakpoint
CREATE INDEX `prompt_isFavorite_idx` ON `prompt_history` (`isFavorite`);--> statement-breakpoint
CREATE INDEX `social_userId_idx` ON `social_connections` (`userId`);--> statement-breakpoint
CREATE INDEX `social_platform_idx` ON `social_connections` (`platform`);--> statement-breakpoint
CREATE INDEX `userTemplate_userId_idx` ON `user_templates` (`userId`);--> statement-breakpoint
CREATE INDEX `userTemplate_templateId_idx` ON `user_templates` (`templateId`);