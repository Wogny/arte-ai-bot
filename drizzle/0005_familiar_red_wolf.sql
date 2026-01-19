ALTER TABLE `usage_tracking` ADD `imagesGenerated` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `usage_tracking` ADD `captionsGenerated` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `usage_tracking` ADD `postsScheduled` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `usage_tracking` ADD `postsPublished` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `usage_tracking` ADD `apiCalls` int DEFAULT 0 NOT NULL;