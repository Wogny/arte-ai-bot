CREATE TABLE `generated_media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`mediaType` enum('image','video','gif','carousel') NOT NULL,
	`title` varchar(255),
	`description` text,
	`imageUrl` text,
	`imageKey` varchar(500),
	`videoUrl` text,
	`videoKey` varchar(500),
	`thumbnailUrl` text,
	`thumbnailKey` varchar(500),
	`duration` int,
	`width` int,
	`height` int,
	`fileSize` int,
	`mimeType` varchar(100),
	`visualStyle` varchar(100),
	`contentFormat` enum('post','story','reel','banner','anuncio','carousel') DEFAULT 'post',
	`prompt` text,
	`aiGenerated` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `generated_media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `scheduled_posts` MODIFY COLUMN `imageId` int;--> statement-breakpoint
ALTER TABLE `scheduled_posts` MODIFY COLUMN `platform` enum('facebook','instagram','tiktok','whatsapp','both','all') NOT NULL;--> statement-breakpoint
ALTER TABLE `scheduled_posts` ADD `mediaId` int;--> statement-breakpoint
ALTER TABLE `scheduled_posts` ADD `mediaType` enum('image','video','gif','carousel') DEFAULT 'image' NOT NULL;--> statement-breakpoint
ALTER TABLE `scheduled_posts` ADD `contentFormat` enum('post','story','reel','carousel') DEFAULT 'post' NOT NULL;--> statement-breakpoint
ALTER TABLE `scheduled_posts` ADD `videoUrl` text;--> statement-breakpoint
ALTER TABLE `scheduled_posts` ADD `videoKey` varchar(500);--> statement-breakpoint
ALTER TABLE `scheduled_posts` ADD `thumbnailUrl` text;--> statement-breakpoint
ALTER TABLE `scheduled_posts` ADD `duration` int;--> statement-breakpoint
ALTER TABLE `scheduled_posts` ADD `coverImageUrl` text;--> statement-breakpoint
ALTER TABLE `scheduled_posts` ADD `musicTrack` varchar(255);--> statement-breakpoint
ALTER TABLE `scheduled_posts` ADD `hashtags` text;--> statement-breakpoint
ALTER TABLE `scheduled_posts` ADD `facebookPostId` varchar(255);--> statement-breakpoint
ALTER TABLE `scheduled_posts` ADD `instagramPostId` varchar(255);--> statement-breakpoint
ALTER TABLE `scheduled_posts` ADD `tiktokPostId` varchar(255);--> statement-breakpoint
CREATE INDEX `mediaType_idx` ON `scheduled_posts` (`mediaType`);